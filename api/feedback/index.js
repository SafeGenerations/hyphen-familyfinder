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

module.exports = async function (context, req) {
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  const { rating, comment } = req.body || {};
  if (!rating) {
    context.res.status = 400;
    context.res.body = 'Rating is required';
    return;
  }

  try {
    const response = await fetchFn('https://free-tools-feedback.azurewebsites.net/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });

    const text = await response.text();
    context.res.status = response.status;
    context.res.body = text;
  } catch (err) {
    context.log('Error submitting feedback', err);
    context.res.status = 500;
    context.res.body = err.message;
  }
};
