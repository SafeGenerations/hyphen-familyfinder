// api/calendar/outlook/auth/init/index.js
// Initialize Microsoft Outlook Calendar OAuth flow

module.exports = async function (context, req) {
  context.log('Outlook calendar auth init request received');

  try {
    // Microsoft Identity Platform v2.0 OAuth endpoints
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.MICROSOFT_REDIRECT_URI);
    const scope = encodeURIComponent('Calendars.ReadWrite offline_access');
    
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    
    // Microsoft OAuth authorization endpoint
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&response_mode=query` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&prompt=consent`;

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        authUrl,
        state,
        provider: 'outlook'
      }
    };
  } catch (error) {
    context.log.error('Outlook auth init error:', error);
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
