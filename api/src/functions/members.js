/**
 * Network Members API
 *
 * CRUD operations for network members (vertices in graph model).
 * Designed for future graph DB migration.
 */

const { app } = require('@azure/functions');
const { getCollection, generateId } = require('../db/mongodb');

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/**
 * Calculate activity state based on last contact date
 */
function getActivityState(lastContactAt) {
  if (!lastContactAt) return 'cold';
  const diffMs = Date.now() - new Date(lastContactAt).getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  if (diffDays <= 30) return 'active';
  if (diffDays <= 60) return 'warming';
  return 'cold';
}

/**
 * Recalculate network health for a child/case
 */
async function recalculateNetworkHealth(childId) {
  try {
    const members = await getCollection('members');
    const relationships = await getCollection('relationships');
    const cases = await getCollection('cases');

    const membersList = await members.find({ childId }).toArray();
    const relationshipsList = await relationships.find({ childId }).toArray();

    const now = Date.now();
    let score = 0;

    const activeMembers = membersList.filter(m => {
      if (!m.lastContactAt) return false;
      return (now - new Date(m.lastContactAt).getTime()) <= 30 * 24 * 60 * 60 * 1000;
    });
    score += Math.min(activeMembers.length, 10);

    const roles = new Set(membersList.map(m => m.role).filter(Boolean));
    score += Math.min(roles.size, 5);

    const conflicts = relationshipsList.filter(r => r.conflictFlag).length;
    score -= Math.min(conflicts, 3);

    await cases.updateOne(
      { _id: childId },
      { $set: { networkHealth: Math.max(0, score), 'networkMembers.active': activeMembers.length, 'networkMembers.total': membersList.length, lastUpdated: new Date().toISOString() } }
    );
  } catch (error) {
    console.error('Error recalculating network health:', error);
  }
}

// Combined handler for /api/members (GET list, POST create)
app.http('membersCollection', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'members',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers };

    try {
      if (request.method === 'GET') {
        const members = await getCollection('members');
        const params = Object.fromEntries(request.query.entries());
        const query = {};
        if (params.childId) query.childId = params.childId;
        if (params.status) query.status = params.status;

        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 50;

        const [data, total] = await Promise.all([
          members.find(query).skip((page - 1) * limit).limit(limit).toArray(),
          members.countDocuments(query)
        ]);

        return {
          status: 200, headers,
          body: JSON.stringify({ success: true, data: data.map(m => ({ ...m, activityState: getActivityState(m.lastContactAt) })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
        };
      } else {
        const body = await request.json();
        if (!body.childId) return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Missing childId' }) };

        const members = await getCollection('members');
        const now = new Date().toISOString();
        const newMember = {
          _id: generateId('member'), childId: body.childId, firstName: body.firstName || '', lastName: body.lastName || '',
          relationshipToChild: body.relationshipToChild || '', role: body.role || null, phones: body.phones || [], emails: body.emails || [],
          addresses: body.addresses || [], commitmentLevel: body.commitmentLevel || 'exploring', status: body.status || 'active',
          lastContactAt: body.lastContactAt || null, sourceProvenance: body.sourceProvenance || [], notes: body.notes || '', createdAt: now, updatedAt: now
        };

        await members.insertOne(newMember);
        await recalculateNetworkHealth(body.childId);
        return { status: 201, headers, body: JSON.stringify({ success: true, data: newMember }) };
      }
    } catch (error) {
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }
});

// Combined handler for /api/members/{id} (GET, PATCH, DELETE)
app.http('membersItem', {
  methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'members/{id}',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers };
    const id = request.params.id;

    try {
      const members = await getCollection('members');
      const existing = await members.findOne({ _id: id });

      if (request.method === 'GET') {
        if (!existing) return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) };
        return { status: 200, headers, body: JSON.stringify({ success: true, data: { ...existing, activityState: getActivityState(existing.lastContactAt) } }) };
      } else if (request.method === 'PATCH') {
        if (!existing) return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) };
        const body = await request.json();
        delete body._id;
        await members.updateOne({ _id: id }, { $set: { ...body, updatedAt: new Date().toISOString() } });
        const updated = await members.findOne({ _id: id });
        await recalculateNetworkHealth(existing.childId);
        return { status: 200, headers, body: JSON.stringify({ success: true, data: { ...updated, activityState: getActivityState(updated.lastContactAt) } }) };
      } else {
        if (!existing) return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) };
        const relationships = await getCollection('relationships');
        await members.deleteOne({ _id: id });
        await relationships.deleteMany({ $or: [{ memberIdA: id }, { memberIdB: id }] });
        await recalculateNetworkHealth(existing.childId);
        return { status: 200, headers, body: JSON.stringify({ success: true, deleted: id }) };
      }
    } catch (error) {
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }
});

// POST /api/members/{id}/merge
app.http('membersMerge', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'members/{id}/merge',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers };
    const targetId = request.params.id;

    try {
      const body = await request.json();
      const sourceMemberIds = body.sourceMemberIds || [];
      if (!sourceMemberIds.length) return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Missing sourceMemberIds' }) };

      const members = await getCollection('members');
      const relationships = await getCollection('relationships');
      const target = await members.findOne({ _id: targetId });
      if (!target) return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Target not found' }) };

      const now = new Date().toISOString();
      const mergedIds = [];

      for (const sourceId of sourceMemberIds) {
        if (sourceId === targetId) continue;
        const source = await members.findOne({ _id: sourceId });
        if (!source) continue;
        mergedIds.push(sourceId);

        target.phones = [...new Set([...(target.phones || []), ...(source.phones || [])])];
        target.emails = [...new Set([...(target.emails || []), ...(source.emails || [])])];
        target.sourceProvenance = [...new Set([...(target.sourceProvenance || []), ...(source.sourceProvenance || [])])];

        await relationships.updateMany({ memberIdA: sourceId }, { $set: { memberIdA: targetId, updatedAt: now } });
        await relationships.updateMany({ memberIdB: sourceId }, { $set: { memberIdB: targetId, updatedAt: now } });
        await members.updateOne({ _id: sourceId }, { $set: { status: 'archived', mergedInto: targetId, updatedAt: now } });
      }

      await members.updateOne({ _id: targetId }, { $set: { ...target, updatedAt: now } });
      await recalculateNetworkHealth(target.childId);
      const merged = await members.findOne({ _id: targetId });

      return { status: 200, headers, body: JSON.stringify({ success: true, data: merged, mergedSourceIds: mergedIds }) };
    } catch (error) {
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }
});

module.exports = { getActivityState, recalculateNetworkHealth };
