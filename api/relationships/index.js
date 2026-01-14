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

function generateId(type) {
  return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

module.exports = async function (context, req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers };
    return;
  }

  try {
    const db = await getDatabase();
    const relationships = db.collection('relationships');
    const relId = context.bindingData.id;

    if (req.method === 'GET') {
      if (relId) {
        // GET single relationship
        const rel = await relationships.findOne({ _id: relId });
        if (!rel) {
          context.res = { status: 404, headers, body: JSON.stringify({ error: 'Relationship not found' }) };
          return;
        }
        context.res = { status: 200, headers, body: JSON.stringify(rel) };
      } else {
        // GET list with filters
        const query = {};
        if (req.query.childId) query.childId = req.query.childId;
        if (req.query.memberId) {
          query.$or = [{ memberIdA: req.query.memberId }, { memberIdB: req.query.memberId }];
        }

        const data = await relationships.find(query).toArray();
        context.res = { status: 200, headers, body: JSON.stringify({ success: true, data }) };
      }
    } else if (req.method === 'POST') {
      const body = req.body;
      if (!body.childId || !body.memberIdA || !body.memberIdB) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: 'childId, memberIdA, and memberIdB are required' }) };
        return;
      }

      const newRel = {
        _id: generateId('rel'),
        childId: body.childId,
        memberIdA: body.memberIdA,
        memberIdB: body.memberIdB,
        type: body.type || 'knows',
        strength: body.strength || 5,
        conflictFlag: body.conflictFlag || false,
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await relationships.insertOne(newRel);
      context.res = { status: 201, headers, body: JSON.stringify(newRel) };

    } else if (req.method === 'PATCH') {
      if (!relId) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: 'Relationship ID required' }) };
        return;
      }

      const updates = req.body;
      updates.updatedAt = new Date().toISOString();

      const result = await relationships.updateOne({ _id: relId }, { $set: updates });
      if (result.matchedCount === 0) {
        context.res = { status: 404, headers, body: JSON.stringify({ error: 'Relationship not found' }) };
        return;
      }

      const updated = await relationships.findOne({ _id: relId });
      context.res = { status: 200, headers, body: JSON.stringify(updated) };

    } else if (req.method === 'DELETE') {
      if (!relId) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: 'Relationship ID required' }) };
        return;
      }

      const result = await relationships.deleteOne({ _id: relId });
      if (result.deletedCount === 0) {
        context.res = { status: 404, headers, body: JSON.stringify({ error: 'Relationship not found' }) };
        return;
      }

      context.res = { status: 200, headers, body: JSON.stringify({ success: true }) };
    }
  } catch (error) {
    context.log.error('Relationships API Error:', error);
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
