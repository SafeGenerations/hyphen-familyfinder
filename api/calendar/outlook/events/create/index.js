// api/calendar/outlook/events/create/index.js
// Create Microsoft Outlook Calendar event for follow-up

const axios = require('axios');
const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.COSMOS_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  cachedDb = client.db('family-finder');
  return cachedDb;
}

async function getAccessToken(db, userId) {
  // Retrieve stored tokens for user
  const tokens = await db.collection('calendar_tokens').findOne({ 
    userId,
    provider: 'outlook'
  });
  
  if (!tokens) {
    throw new Error('Outlook calendar not authorized');
  }

  // Check if token needs refresh
  if (tokens.expiryDate && new Date(tokens.expiryDate) <= new Date()) {
    // Token expired, refresh it
    const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', 
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        refresh_token: tokens.refreshToken,
        grant_type: 'refresh_token',
        scope: 'Calendars.ReadWrite offline_access'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const newTokens = response.data;
    
    // Update tokens in database
    await db.collection('calendar_tokens').updateOne(
      { _id: tokens._id },
      {
        $set: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || tokens.refreshToken,
          expiryDate: new Date(Date.now() + newTokens.expires_in * 1000),
          updatedAt: new Date()
        }
      }
    );

    return newTokens.access_token;
  }

  return tokens.accessToken;
}

module.exports = async function (context, req) {
  context.log('Create Outlook calendar event request received');

  try {
    const {
      childId,
      memberId,
      summary,
      description,
      startTime,
      endTime,
      contactType,
      reminderMinutes,
      metadata
    } = req.body;

    // Validate required fields
    if (!childId || !memberId || !summary || !startTime || !endTime) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Bad request',
          message: 'Missing required fields: childId, memberId, summary, startTime, endTime'
        }
      };
      return;
    }

    const db = await connectToDatabase();
    
    // TODO: Get userId from session/auth
    const userId = 'default-user';
    
    const accessToken = await getAccessToken(db, userId);

    // Create Outlook calendar event using Microsoft Graph API
    const event = {
      subject: summary,
      body: {
        contentType: 'text',
        content: description || ''
      },
      start: {
        dateTime: startTime,
        timeZone: 'Central Standard Time' // TODO: Make configurable
      },
      end: {
        dateTime: endTime,
        timeZone: 'Central Standard Time'
      },
      isReminderOn: reminderMinutes > 0,
      reminderMinutesBeforeStart: reminderMinutes || 15
    };

    const graphResponse = await axios.post(
      'https://graph.microsoft.com/v1.0/me/events',
      event,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const outlookEvent = graphResponse.data;

    // Store event reference in database
    const followUpEvent = {
      childId,
      memberId,
      userId,
      provider: 'outlook',
      outlookEventId: outlookEvent.id,
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      contactType,
      reminderMinutes,
      metadata,
      status: 'scheduled',
      reminderSent: false,
      webLink: outlookEvent.webLink,
      createdAt: new Date()
    };

    const result = await db.collection('calendar_events').insertOne(followUpEvent);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        event: {
          _id: result.insertedId,
          ...followUpEvent
        }
      }
    };
  } catch (error) {
    context.log.error('Create Outlook calendar event error:', error);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Internal server error',
        message: error.message
      }
    };
  }
};
