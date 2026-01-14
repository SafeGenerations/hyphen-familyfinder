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
    const cases = db.collection('cases');

    if (req.method === 'GET') {
      let data = await cases.find({}).toArray();

      // Initialize with sample data if empty
      if (data.length === 0) {
        const samples = [
          { _id: 'CASE-001', caseId: 'CASE-CASE-001', childName: 'Child case-001', priority: 'low', status: 'active', networkHealth: 8 },
          { _id: 'CASE-002', caseId: 'CASE-CASE-002', childName: 'Marcus Johnson', priority: 'low', status: 'active', networkHealth: 10 },
          { _id: 'CASE-003', caseId: 'CASE-CASE-003', childName: 'Sofia Rodriguez', priority: 'high', status: 'active', networkHealth: 3 },
          { _id: 'CASE-004', caseId: 'CASE-CASE-004', childName: 'Tyler Bennett', priority: 'medium', status: 'active', networkHealth: 6 }
        ];
        await cases.insertMany(samples);
        data = samples;
      }

      context.res = { status: 200, headers, body: JSON.stringify(data) };
    } else if (req.method === 'POST') {
      const body = req.body;
      const newCase = {
        _id: `CASE-${Date.now()}`,
        caseId: body.caseId || `CASE-${Date.now()}`,
        childName: body.childName,
        status: body.status || 'active',
        priority: body.priority || 'medium',
        networkHealth: body.networkHealth || 5,
        createdAt: new Date().toISOString()
      };
      await cases.insertOne(newCase);
      context.res = { status: 201, headers, body: JSON.stringify(newCase) };
    }
  } catch (error) {
    context.log.error('Error:', error);
    context.res = { status: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
