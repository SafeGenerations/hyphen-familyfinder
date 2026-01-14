/**
 * Relationships API
 *
 * CRUD operations for relationships between network members (edges in graph model).
 * Designed for future graph DB migration: (memberA)-[RELATES_TO]->(memberB)
 */

const { app } = require('@azure/functions');
const { getCollection, generateId } = require('../db/mongodb');
const { recalculateNetworkHealth } = require('./members');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Combined handler for /api/relationships (GET list, POST create)
app.http('relationshipsCollection', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'relationships',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers };

    try {
      const relationships = await getCollection('relationships');

      if (request.method === 'GET') {
        const params = Object.fromEntries(request.query.entries());
        const query = {};
        if (params.childId) query.childId = params.childId;
        if (params.memberId) query.$or = [{ memberIdA: params.memberId }, { memberIdB: params.memberId }];
        if (params.type) query.type = params.type;
        if (params.conflictFlag !== undefined) query.conflictFlag = params.conflictFlag === 'true';

        const data = await relationships.find(query).toArray();
        return { status: 200, headers, body: JSON.stringify({ success: true, data, count: data.length }) };
      } else {
        // POST create
        const body = await request.json();
        if (!body.childId || !body.memberIdA || !body.memberIdB) {
          return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Missing required fields: childId, memberIdA, memberIdB' }) };
        }
        if (body.memberIdA === body.memberIdB) {
          return { status: 400, headers, body: JSON.stringify({ success: false, error: 'Cannot create self-relationship' }) };
        }

        const members = await getCollection('members');
        const [memberA, memberB] = await Promise.all([
          members.findOne({ _id: body.memberIdA }),
          members.findOne({ _id: body.memberIdB })
        ]);
        if (!memberA || !memberB) {
          return { status: 404, headers, body: JSON.stringify({ success: false, error: 'One or both members not found' }) };
        }

        const existing = await relationships.findOne({
          childId: body.childId,
          $or: [
            { memberIdA: body.memberIdA, memberIdB: body.memberIdB },
            { memberIdA: body.memberIdB, memberIdB: body.memberIdA }
          ]
        });
        if (existing) {
          return { status: 409, headers, body: JSON.stringify({ success: false, error: 'Relationship already exists', existingId: existing._id }) };
        }

        const now = new Date().toISOString();
        const newRel = {
          _id: generateId('rel'), childId: body.childId, memberIdA: body.memberIdA, memberIdB: body.memberIdB,
          type: body.type || 'support', strength: body.strength || 0.5, conflictFlag: body.conflictFlag || false,
          notes: body.notes || '', createdAt: now, updatedAt: now
        };

        await relationships.insertOne(newRel);
        await recalculateNetworkHealth(body.childId);
        return { status: 201, headers, body: JSON.stringify({ success: true, data: newRel }) };
      }
    } catch (error) {
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }
});

// Combined handler for /api/relationships/{id} (GET, PATCH, DELETE)
app.http('relationshipsItem', {
  methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'relationships/{id}',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers };
    const id = request.params.id;

    try {
      const relationships = await getCollection('relationships');
      const existing = await relationships.findOne({ _id: id });

      if (request.method === 'GET') {
        if (!existing) return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) };
        return { status: 200, headers, body: JSON.stringify({ success: true, data: existing }) };
      } else if (request.method === 'PATCH') {
        if (!existing) return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) };
        const body = await request.json();
        delete body._id; delete body.childId; delete body.memberIdA; delete body.memberIdB; delete body.createdAt;
        await relationships.updateOne({ _id: id }, { $set: { ...body, updatedAt: new Date().toISOString() } });
        const updated = await relationships.findOne({ _id: id });
        if (body.conflictFlag !== undefined) await recalculateNetworkHealth(existing.childId);
        return { status: 200, headers, body: JSON.stringify({ success: true, data: updated }) };
      } else {
        if (!existing) return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Not found' }) };
        await relationships.deleteOne({ _id: id });
        await recalculateNetworkHealth(existing.childId);
        return { status: 200, headers, body: JSON.stringify({ success: true, deleted: id }) };
      }
    } catch (error) {
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }
});
