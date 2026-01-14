// api/calendar/auth/init/index.js
// Initialize Google Calendar OAuth flow

const { google } = require('googleapis');

module.exports = async function (context, req) {
  context.log('Calendar auth init request received');

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: state,
      prompt: 'consent'
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        authUrl,
        state
      }
    };
  } catch (error) {
    context.log.error('Calendar auth init error:', error);
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
