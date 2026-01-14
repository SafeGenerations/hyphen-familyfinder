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
    const members = db.collection('members');
    const memberId = context.bindingData.id;

    if (req.method === 'GET') {
      if (memberId) {
        // GET single member
        const member = await members.findOne({ _id: memberId });
        if (!member) {
          context.res = { status: 404, headers, body: JSON.stringify({ error: 'Member not found' }) };
          return;
        }
        member.activityState = getActivityState(member.lastContactAt);
        context.res = { status: 200, headers, body: JSON.stringify(member) };
      } else {
        // GET list with filters
        const query = {};
        if (req.query.childId) query.childId = req.query.childId;
        if (req.query.status) query.status = req.query.status;
        if (req.query.role) query.role = req.query.role;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        const data = await members.find(query).skip((page - 1) * limit).limit(limit).toArray();
        const total = await members.countDocuments(query);

        const enriched = data.map(m => ({ ...m, activityState: getActivityState(m.lastContactAt) }));

        context.res = {
          status: 200, headers,
          body: JSON.stringify({
            success: true,
            data: enriched,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
          })
        };
      }
    } else if (req.method === 'POST') {
      const body = req.body;
      if (!body.childId) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: 'childId is required' }) };
        return;
      }

      const newMember = {
        _id: generateId('member'),
        childId: body.childId,
        firstName: body.firstName || '',
        lastName: body.lastName || '',
        relationshipToChild: body.relationshipToChild || '',
        role: body.role || 'other',
        phones: body.phones || [],
        emails: body.emails || [],
        addresses: body.addresses || [],
        commitmentLevel: body.commitmentLevel || 'exploring',
        status: body.status || 'active',
        lastContactAt: body.lastContactAt || null,
        sourceProvenance: body.sourceProvenance || [],
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await members.insertOne(newMember);
      newMember.activityState = getActivityState(newMember.lastContactAt);
      context.res = { status: 201, headers, body: JSON.stringify(newMember) };

    } else if (req.method === 'PATCH') {
      if (!memberId) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: 'Member ID required' }) };
        return;
      }

      const updates = req.body;
      updates.updatedAt = new Date().toISOString();

      const result = await members.updateOne({ _id: memberId }, { $set: updates });
      if (result.matchedCount === 0) {
        context.res = { status: 404, headers, body: JSON.stringify({ error: 'Member not found' }) };
        return;
      }

      const updated = await members.findOne({ _id: memberId });
      updated.activityState = getActivityState(updated.lastContactAt);
      context.res = { status: 200, headers, body: JSON.stringify(updated) };

    } else if (req.method === 'DELETE') {
      if (!memberId) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: 'Member ID required' }) };
        return;
      }

      const result = await members.deleteOne({ _id: memberId });
      if (result.deletedCount === 0) {
        context.res = { status: 404, headers, body: JSON.stringify({ error: 'Member not found' }) };
        return;
      }

      context.res = { status: 200, headers, body: JSON.stringify({ success: true }) };
    }
  } catch (error) {
    context.log.error('Members API Error:', error);
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
