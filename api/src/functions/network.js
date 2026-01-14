/**
 * Network Visualization API
 *
 * Returns the complete network graph for a child/case with nodes, edges, and summary metrics.
 * Designed for visualization components and graph-DB-ready structure.
 */

const { app } = require('@azure/functions');
const { getCollection } = require('../db/mongodb');
const { getActivityState } = require('./members');

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/**
 * Compute network health metrics
 * @param {Array} members - List of members
 * @param {Array} relationships - List of relationships
 * @returns {Object} Health metrics
 */
function computeNetworkHealth(members, relationships) {
  const now = Date.now();
  let score = 0;

  // Score active members (max 10 points)
  const activeMembers = members.filter(m => {
    if (!m.lastContactAt) return false;
    const diff = now - new Date(m.lastContactAt).getTime();
    return diff <= 30 * 24 * 60 * 60 * 1000;
  });
  score += Math.min(activeMembers.length, 10);

  // Score role diversity (max 5 points)
  const roles = [...new Set(members.map(m => m.role).filter(Boolean))];
  score += Math.min(roles.length, 5);

  // Deduct for conflicts (max -3 points)
  const conflicts = relationships.filter(r => r.conflictFlag).length;
  score -= Math.min(conflicts, 3);

  // Get most recent contact
  const contactDates = members
    .map(m => m.lastContactAt)
    .filter(Boolean)
    .sort();
  const lastContactAt = contactDates.length > 0 ? contactDates[contactDates.length - 1] : null;

  return {
    score: Math.max(0, score),
    activeCount: activeMembers.length,
    roles,
    conflicts,
    lastContactAt
  };
}

/**
 * Build activity buckets
 * @param {Array} members - List of members with activity state
 * @returns {Object} Activity buckets
 */
function buildActivityBuckets(members) {
  return members.reduce(
    (acc, m) => {
      const state = getActivityState(m.lastContactAt);
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    },
    { active: 0, warming: 0, cold: 0 }
  );
}

// GET /api/network/{childId} - Get full network graph + summary
app.http('networkGet', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'network/{childId}',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return { status: 204, headers };
    }

    try {
      const childId = request.params.childId;
      const params = Object.fromEntries(request.query.entries());

      const [membersCollection, relationshipsCollection, contactEventsCollection] = await Promise.all([
        getCollection('members'),
        getCollection('relationships'),
        getCollection('contactEvents')
      ]);

      // Build query (optionally include inactive members)
      const memberQuery = { childId };
      if (params.includeInactive !== 'true') {
        memberQuery.status = { $ne: 'archived' };
      }

      // Fetch all data in parallel
      const [members, relationships, contactEvents] = await Promise.all([
        membersCollection.find(memberQuery).toArray(),
        relationshipsCollection.find({ childId }).toArray(),
        contactEventsCollection.find({ childId }).toArray()
      ]);

      // Build nodes with activity state
      const nodes = members.map(m => ({
        _id: m._id,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Unknown',
        firstName: m.firstName,
        lastName: m.lastName,
        relationshipToChild: m.relationshipToChild,
        role: m.role,
        status: m.status,
        commitmentLevel: m.commitmentLevel,
        lastContactAt: m.lastContactAt,
        phones: m.phones,
        emails: m.emails,
        activityState: getActivityState(m.lastContactAt)
      }));

      // Build edges (relationships)
      const edges = relationships.map(r => ({
        _id: r._id,
        memberIdA: r.memberIdA,
        memberIdB: r.memberIdB,
        type: r.type,
        strength: r.strength,
        conflictFlag: r.conflictFlag
      }));

      // Compute metrics
      const metrics = computeNetworkHealth(members, relationships);
      const activityBuckets = buildActivityBuckets(members);

      // Build summary
      const summary = {
        metrics,
        counts: {
          members: members.length,
          relationships: relationships.length,
          contactEvents: contactEvents.length
        },
        activityBuckets,
        lastContactAt: metrics.lastContactAt
      };

      context.log(`📊 Network for ${childId}: ${nodes.length} nodes, ${edges.length} edges, score=${metrics.score}`);

      return {
        status: 200,
        headers,
        body: JSON.stringify({
          success: true,
          childId,
          nodes,
          edges,
          summary
        })
      };
    } catch (error) {
      context.error('Error fetching network:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
});

// GET /api/network/{childId}/stats - Get network statistics only
app.http('networkStats', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'network/{childId}/stats',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return { status: 204, headers };
    }

    try {
      const childId = request.params.childId;

      const [membersCollection, relationshipsCollection, contactEventsCollection] = await Promise.all([
        getCollection('members'),
        getCollection('relationships'),
        getCollection('contactEvents')
      ]);

      const [members, relationships, contactEventsCount] = await Promise.all([
        membersCollection.find({ childId, status: { $ne: 'archived' } }).toArray(),
        relationshipsCollection.find({ childId }).toArray(),
        contactEventsCollection.countDocuments({ childId })
      ]);

      const metrics = computeNetworkHealth(members, relationships);
      const activityBuckets = buildActivityBuckets(members);

      return {
        status: 200,
        headers,
        body: JSON.stringify({
          success: true,
          childId,
          stats: {
            metrics,
            counts: {
              members: members.length,
              relationships: relationships.length,
              contactEvents: contactEventsCount
            },
            activityBuckets
          }
        })
      };
    } catch (error) {
      context.error('Error fetching network stats:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
});
