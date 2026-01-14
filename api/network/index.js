const { MongoClient } = require('mongodb');

let cachedDb = null;

async function getDatabase() {
  if (cachedDb) return cachedDb;
  const uri = process.env.COSMOS_CONNECTION_STRING;
  if (!uri) throw new Error('COSMOS_CONNECTION_STRING not set');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  cachedDb = client.db('familyfinder');
  return cachedDb;
}

function getActivityState(lastContactAt) {
  if (!lastContactAt) return 'cold';
  const diffMs = Date.now() - new Date(lastContactAt).getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  if (diffDays <= 30) return 'active';
  if (diffDays <= 60) return 'warming';
  return 'cold';
}

function calculateNetworkHealth(members, relationships) {
  let score = 0;
  const now = Date.now();

  // +1 per active member (max 10)
  const activeMembers = members.filter(m => {
    if (!m.lastContactAt) return false;
    return (now - new Date(m.lastContactAt).getTime()) <= 30 * 24 * 60 * 60 * 1000;
  });
  score += Math.min(activeMembers.length, 10);

  // +1 per unique role (max 5)
  const roles = new Set(members.map(m => m.role).filter(Boolean));
  score += Math.min(roles.size, 5);

  // -1 per conflict (max -3)
  const conflicts = relationships.filter(r => r.conflictFlag).length;
  score -= Math.min(conflicts, 3);

  return Math.max(0, score);
}

module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers };
    return;
  }

  try {
    const db = await getDatabase();
    const childId = context.bindingData.childId;
    const isStats = context.bindingData.stats === 'stats';

    if (!childId) {
      context.res = { status: 400, headers, body: JSON.stringify({ error: 'childId is required' }) };
      return;
    }

    const members = db.collection('members');
    const relationships = db.collection('relationships');
    const contactEvents = db.collection('contactEvents');

    // Get all members for this child/case (excluding archived)
    const membersList = await members.find({
      childId,
      status: { $ne: 'archived' }
    }).toArray();

    // Get all relationships for this child/case
    const relationshipsList = await relationships.find({ childId }).toArray();

    // Get contact event count
    const contactCount = await contactEvents.countDocuments({ childId });

    // Calculate activity buckets
    const activityBuckets = { active: 0, warming: 0, cold: 0 };
    membersList.forEach(m => {
      const state = getActivityState(m.lastContactAt);
      activityBuckets[state]++;
    });

    // Calculate health score
    const healthScore = calculateNetworkHealth(membersList, relationshipsList);

    // Get unique roles
    const roles = [...new Set(membersList.map(m => m.role).filter(Boolean))];

    // Count conflicts
    const conflicts = relationshipsList.filter(r => r.conflictFlag).length;

    if (isStats) {
      // Return just stats
      context.res = {
        status: 200, headers,
        body: JSON.stringify({
          success: true,
          childId,
          metrics: {
            score: healthScore,
            activeCount: activityBuckets.active,
            roles,
            conflicts
          },
          counts: {
            members: membersList.length,
            relationships: relationshipsList.length,
            contactEvents: contactCount
          },
          activityBuckets
        })
      };
    } else {
      // Return full network graph
      const nodes = membersList.map(m => ({
        _id: m._id,
        name: `${m.firstName} ${m.lastName}`.trim() || 'Unknown',
        firstName: m.firstName,
        lastName: m.lastName,
        relationshipToChild: m.relationshipToChild,
        role: m.role,
        status: m.status,
        lastContactAt: m.lastContactAt,
        commitmentLevel: m.commitmentLevel,
        activityState: getActivityState(m.lastContactAt),
        phones: m.phones,
        emails: m.emails
      }));

      const edges = relationshipsList.map(r => ({
        _id: r._id,
        memberIdA: r.memberIdA,
        memberIdB: r.memberIdB,
        type: r.type,
        strength: r.strength,
        conflictFlag: r.conflictFlag
      }));

      context.res = {
        status: 200, headers,
        body: JSON.stringify({
          success: true,
          childId,
          nodes,
          edges,
          summary: {
            metrics: {
              score: healthScore,
              activeCount: activityBuckets.active,
              roles,
              conflicts
            },
            counts: {
              members: membersList.length,
              relationships: relationshipsList.length,
              contactEvents: contactCount
            },
            activityBuckets
          }
        })
      };
    }
  } catch (error) {
    context.log.error('Network API Error:', error);
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
