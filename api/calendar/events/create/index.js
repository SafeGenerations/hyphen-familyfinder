// api/calendar/events/create/index.js
// Create Google Calendar event for follow-up

const { google } = require('googleapis');
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

async function getOAuth2Client(db, userId) {
  // Retrieve stored tokens for user
  const tokens = await db.collection('calendar_tokens').findOne({ userId });
  
  if (!tokens) {
    throw new Error('Calendar not authorized');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });

  return oauth2Client;
}

module.exports = async function (context, req) {
  context.log('Create calendar event request received');

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
    
    const oauth2Client = await getOAuth2Client(db, userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Create calendar event
    const event = {
      summary,
      description,
      start: {
        dateTime: startTime,
        timeZone: 'America/Chicago' // TODO: Make configurable
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Chicago'
      },
      reminders: reminderMinutes > 0 ? {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: reminderMinutes }
        ]
      } : undefined
    };

    const calendarEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    // Store event reference in database
    const followUpEvent = {
      childId,
      memberId,
      userId,
      googleEventId: calendarEvent.data.id,
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      contactType,
      reminderMinutes,
      metadata,
      status: 'scheduled',
      reminderSent: false,
      htmlLink: calendarEvent.data.htmlLink,
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
    context.log.error('Create calendar event error:', error);
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
