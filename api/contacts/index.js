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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers };
    return;
  }

  try {
    const db = await getDatabase();
    const contacts = db.collection('contactEvents');
    const members = db.collection('members');

    if (req.method === 'GET') {
      const query = {};
      if (req.query.childId) query.childId = req.query.childId;
      if (req.query.memberId) query.memberId = req.query.memberId;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const data = await contacts.find(query)
        .sort({ contactedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      const total = await contacts.countDocuments(query);

      context.res = {
        status: 200, headers,
        body: JSON.stringify({
          success: true,
          data,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        })
      };
    } else if (req.method === 'POST') {
      const body = req.body;
      if (!body.childId || !body.memberId) {
        context.res = { status: 400, headers, body: JSON.stringify({ error: 'childId and memberId are required' }) };
        return;
      }

      const contactedAt = body.contactedAt || new Date().toISOString();

      const newContact = {
        _id: generateId('contact'),
        childId: body.childId,
        memberId: body.memberId,
        type: body.type || 'call',
        direction: body.direction || 'outbound',
        outcome: body.outcome || 'completed',
        notes: body.notes || '',
        contactedAt,
        createdAt: new Date().toISOString()
      };

      await contacts.insertOne(newContact);

      // Update member's lastContactAt
      await members.updateOne(
        { _id: body.memberId },
        { $set: { lastContactAt: contactedAt, updatedAt: new Date().toISOString() } }
      );

      context.res = { status: 201, headers, body: JSON.stringify(newContact) };
    }
  } catch (error) {
    context.log.error('Contacts API Error:', error);
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
