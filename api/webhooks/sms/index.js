// api/webhooks/sms/index.js
// Azure Function to receive SMS webhook notifications and auto-log contact events

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.COSMOS_CONNECTION_STRING;
const DB_NAME = 'genogram';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedDb = client.db(DB_NAME);
  return cachedDb;
}

// Normalize phone number for comparison (remove formatting)
function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

module.exports = async function (context, req) {
  context.log('SMS webhook received:', req.body);

  // Validate webhook signature/authentication
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey !== process.env.WEBHOOK_API_KEY) {
    context.res = {
      status: 401,
      body: { error: 'Unauthorized' }
    };
    return;
  }

  const { from, to, body, timestamp, messageId, metadata } = req.body;

  if (!to || !timestamp) {
    context.res = {
      status: 400,
      body: { error: 'Missing required fields: to, timestamp' }
    };
    return;
  }

  try {
    const db = await connectToDatabase();

    // Extract childId from metadata
    const childId = metadata?.childId || metadata?.caseId;
    
    if (!childId) {
      context.log('No childId found in webhook metadata');
      context.res = {
        status: 400,
        body: { error: 'childId required in metadata' }
      };
      return;
    }

    // Normalize phone numbers for comparison
    const normalizedTo = normalizePhone(to);

    // Find network member by phone number
    const member = await db.collection('network_members').findOne({
      childId: childId,
      $or: [
        { phones: to },
        { phones: normalizedTo },
        { 'phones.number': to },
        { 'phones.number': normalizedTo }
      ]
    });

    if (!member) {
      context.log(`No network member found with phone ${to} for child ${childId}`);
      context.res = {
        status: 404,
        body: { error: 'Recipient not in network' }
      };
      return;
    }

    // Create contact event
    const contactEvent = {
      childId: childId,
      memberId: member._id,
      type: 'sms_sent',
      direction: 'outbound',
      summary: `SMS: ${body ? body.substring(0, 50) : '(message sent)'}`,
      at: new Date(timestamp),
      createdBy: 'system_webhook',
      createdAt: new Date(),
      metadata: {
        messageId,
        messageBody: body,
        from,
        to
      }
    };

    await db.collection('contact_events').insertOne(contactEvent);

    // Update lastContactAt on member
    await db.collection('network_members').updateOne(
      { _id: member._id },
      { 
        $set: { lastContactAt: new Date(timestamp) },
        $inc: { totalContacts: 1 }
      }
    );

    context.log(`Auto-logged SMS contact for member ${member.name}`);

    context.res = {
      status: 200,
      body: { 
        success: true,
        contactEventId: contactEvent._id,
        memberId: member._id
      }
    };

  } catch (error) {
    context.log.error('Error processing SMS webhook:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error', message: error.message }
    };
  }
};
