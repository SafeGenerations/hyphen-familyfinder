// api/src/functions/feedback.js
const { app } = require('@azure/functions');

// Use the global `fetch` implementation when available. Azure Functions
// running on Node 18+ expose a built-in `fetch`. In older runtimes we
// fall back to the `node-fetch` package if it is installed.
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    // eslint-disable-next-line global-require
    fetchFn = require('node-fetch');
  } catch (err) {
    throw new Error('Fetch API is not available');
  }
}

app.http('feedback', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'feedback',
  handler: async (request, context) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    const body = await request.json();
    const { rating, comment } = body || {};
    
    if (!rating) {
      return {
        status: 400,
        body: 'Rating is required',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    try {
      const response = await fetchFn('https://free-tools-feedback.azurewebsites.net/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });

      const text = await response.text();
      return {
        status: response.status,
        body: text,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    } catch (err) {
      context.error('Error submitting feedback', err);
      return {
        status: 500,
        body: err.message,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }
  }
});
