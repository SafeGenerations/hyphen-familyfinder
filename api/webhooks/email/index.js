// api/webhooks/email/index.js
// Azure Function to receive email webhook notifications and auto-log contact events

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

module.exports = async function (context, req) {
  context.log('Email webhook received:', req.body);

  // Validate webhook signature/authentication
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey !== process.env.WEBHOOK_API_KEY) {
    context.res = {
      status: 401,
      body: { error: 'Unauthorized' }
    };
    return;
  }

  const { from, to, subject, body, timestamp, messageId, metadata } = req.body;

  if (!to || !timestamp) {
    context.res = {
      status: 400,
      body: { error: 'Missing required fields: to, timestamp' }
    };
    return;
  }

  try {
    const db = await connectToDatabase();

    // Extract childId from metadata or email headers
    const childId = metadata?.childId || metadata?.caseId;
    
    if (!childId) {
      context.log('No childId found in webhook metadata');
      context.res = {
        status: 400,
        body: { error: 'childId required in metadata' }
      };
      return;
    }

    // Find network member by email
    const member = await db.collection('network_members').findOne({
      emails: to,
      childId: childId
    });

    if (!member) {
      context.log(`No network member found with email ${to} for child ${childId}`);
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
      type: 'email_sent',
      direction: 'outbound',
      summary: `Email: ${subject || '(no subject)'}`,
      at: new Date(timestamp),
      createdBy: 'system_webhook',
      createdAt: new Date(),
      metadata: {
        messageId,
        subject,
        preview: body ? body.substring(0, 200) : null,
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

    context.log(`Auto-logged email contact for member ${member.name}`);

    context.res = {
      status: 200,
      body: { 
        success: true,
        contactEventId: contactEvent._id,
        memberId: member._id
      }
    };

  } catch (error) {
    context.log.error('Error processing email webhook:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error', message: error.message }
    };
  }
};
