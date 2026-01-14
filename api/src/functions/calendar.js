// api/src/functions/calendar.js
const { app } = require('@azure/functions');

// TODO: Convert calendar functions from v3 to v4
// Placeholder - calendar functions will be migrated if needed

// Google Calendar OAuth Init
app.http('calendarAuthInit', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'calendar/auth/init',
  handler: async (request, context) => {
    return {
      status: 501,
      jsonBody: { message: 'Calendar functions not yet migrated to v4' }
    };
  }
});

// Microsoft Outlook OAuth Init
app.http('calendarOutlookAuthInit', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'calendar/outlook/auth/init',
  handler: async (request, context) => {
    return {
      status: 501,
      jsonBody: { message: 'Calendar functions not yet migrated to v4' }
    };
  }
});
