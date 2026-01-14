// api/src/index.js
// Main entry point for Azure Functions v4 programming model

const { app } = require('@azure/functions');

// Import all function modules
require('./functions/feedback');
require('./functions/contacts');
require('./functions/webhooks');
require('./functions/calendar');
require('./functions/audit');
require('./functions/cases');
require('./functions/members');
require('./functions/relationships');
require('./functions/network');
