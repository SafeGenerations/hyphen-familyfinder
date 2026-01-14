// api/src/functions/webhooks.js
const { app } = require('@azure/functions');
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

// Email Webhook
app.http('webhooksEmail', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'webhooks/email',
  handler: async (request, context) => {
    context.log('Email webhook received');

    // Validate webhook signature/authentication
    const apiKey = request.headers.get('x-api-key') || request.query.get('apiKey');
    if (apiKey !== process.env.WEBHOOK_API_KEY) {
      return {
        status: 401,
        jsonBody: { error: 'Unauthorized' }
      };
    }

    const body = await request.json();
    const { from, to, subject, body: emailBody, timestamp, messageId, metadata } = body;

    if (!to || !timestamp) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields: to, timestamp' }
      };
    }

    try {
      const db = await connectToDatabase();

      // Extract childId from metadata or email headers
      const childId = metadata?.childId || metadata?.caseId;
      
      if (!childId) {
        context.log('No childId found in webhook metadata');
        return {
          status: 400,
          jsonBody: { error: 'childId required in metadata' }
        };
      }

      // Find network member by email
      const member = await db.collection('network_members').findOne({
        emails: to,
        childId: childId
      });

      if (!member) {
        context.log(`No network member found with email ${to} for child ${childId}`);
        return {
          status: 404,
          jsonBody: { error: 'Recipient not in network' }
        };
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
          preview: emailBody ? emailBody.substring(0, 200) : null,
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

      return {
        status: 200,
        jsonBody: { 
          success: true,
          contactEventId: contactEvent._id,
          memberId: member._id
        }
      };

    } catch (error) {
      context.error('Error processing email webhook:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error', message: error.message }
      };
    }
  }
});

// SMS Webhook
app.http('webhooksSms', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'webhooks/sms',
  handler: async (request, context) => {
    context.log('SMS webhook received');

    // Validate webhook signature/authentication
    const apiKey = request.headers.get('x-api-key') || request.query.get('apiKey');
    if (apiKey !== process.env.WEBHOOK_API_KEY) {
      return {
        status: 401,
        jsonBody: { error: 'Unauthorized' }
      };
    }

    const reqBody = await request.json();
    const { from, to, body, timestamp, messageId, metadata } = reqBody;

    if (!to || !timestamp) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields: to, timestamp' }
      };
    }

    try {
      const db = await connectToDatabase();

      // Extract childId from metadata
      const childId = metadata?.childId || metadata?.caseId;
      
      if (!childId) {
        context.log('No childId found in webhook metadata');
        return {
          status: 400,
          jsonBody: { error: 'childId required in metadata' }
        };
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
        return {
          status: 404,
          jsonBody: { error: 'Recipient not in network' }
        };
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

      return {
        status: 200,
        jsonBody: { 
          success: true,
          contactEventId: contactEvent._id,
          memberId: member._id
        }
      };

    } catch (error) {
      context.error('Error processing SMS webhook:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error', message: error.message }
      };
    }
  }
});
