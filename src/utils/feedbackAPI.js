const FEEDBACK_ENDPOINT =
  process.env.REACT_APP_FEEDBACK_ENDPOINT || '/api/feedback';
const FALLBACK_ENDPOINT = 'https://free-tools-feedback.azurewebsites.net/api/feedback';

export async function submitFeedback(rating, comment) {
  if (!rating) return false;
  if (!FEEDBACK_ENDPOINT) {
    // eslint-disable-next-line no-console
    console.error(
      'Feedback endpoint is not configured. Set REACT_APP_FEEDBACK_ENDPOINT in your environment.'
    );
    return false;
  }
  try {
    const res = await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
    if (res.ok) {
      return true;
    }
    // eslint-disable-next-line no-console
    console.error('Error submitting rating', res.statusText);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error submitting rating', err);
  }
  try {
    const fallback = await fetch(FALLBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
    if (!fallback.ok) {
      // eslint-disable-next-line no-console
      console.error('Error submitting rating to fallback', fallback.statusText);
      return false;
    }
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error submitting rating to fallback', err);
    return false;
  }
}
