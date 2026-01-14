// src/src-modern/services/feedbackAPI.js

const FEEDBACK_ENDPOINT = process.env.REACT_APP_FEEDBACK_ENDPOINT || '/api/feedback';
const FALLBACK_ENDPOINT = 'https://free-tools-feedback.azurewebsites.net/api/feedback';

// Helper functions to parse browser info
function getBrowserName() {
  const agent = navigator.userAgent;
  if (agent.indexOf('Firefox') > -1) return 'Firefox';
  if (agent.indexOf('SamsungBrowser') > -1) return 'Samsung Browser';
  if (agent.indexOf('Opera') > -1 || agent.indexOf('OPR') > -1) return 'Opera';
  if (agent.indexOf('Trident') > -1) return 'Internet Explorer';
  if (agent.indexOf('Edge') > -1 || agent.indexOf('Edg') > -1) return 'Edge';
  if (agent.indexOf('Chrome') > -1) return 'Chrome';
  if (agent.indexOf('Safari') > -1) return 'Safari';
  return 'Unknown';
}

function getBrowserVersion() {
  const agent = navigator.userAgent;
  let match = agent.match(/(firefox|chrome|safari|opera|edge|edg|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(match[1])) {
    const temp = /\brv[ :]+(\d+)/g.exec(agent) || [];
    return temp[1] || '';
  }
  if (match[1] === 'Chrome') {
    const temp = agent.match(/\b(OPR|Edge|Edg)\/(\d+)/);
    if (temp != null) return temp[2];
  }
  match = match[2] ? [match[1], match[2]] : [navigator.appName, navigator.appVersion, '-?'];
  const temp = agent.match(/version\/(\d+)/i);
  if (temp != null) match.splice(1, 1, temp[1]);
  return match[1] || '';
}

export async function submitFeedback(data) {
  const { rating, feedback: comment } = data;
  
  if (!rating && !comment) return false;
  
  // Build complete feedback data with browser info
  const feedbackData = {
    rating: rating || 0,
    comment: comment || '',
    timestamp: new Date().toISOString(),
    app: 'genogram',
    version: '2.0',
    userAgent: navigator.userAgent,
    url: window.location.href,
    browser: {
      name: getBrowserName(),
      version: getBrowserVersion(),
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  // In development, just log locally to avoid CORS errors
  if (process.env.NODE_ENV === 'development') {
    console.log('Feedback (local):', feedbackData);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: 'Feedback logged locally' };
  }

  // In production, try primary endpoint first
  try {
    const res = await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    
    if (res.ok) {
      return { success: true, message: 'Feedback submitted successfully' };
    }
    
    console.error('Error submitting feedback to primary endpoint', res.statusText);
  } catch (err) {
    console.error('Error submitting feedback to primary endpoint', err);
  }

  // Try fallback endpoint if primary fails
  try {
    const fallback = await fetch(FALLBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    
    if (fallback.ok) {
      return { success: true, message: 'Feedback submitted via fallback' };
    }
    
    console.error('Error submitting feedback to fallback', fallback.statusText);
  } catch (err) {
    console.error('Error submitting feedback to fallback', err);
  }

  // If both fail, save to localStorage
  try {
    const existingFeedback = JSON.parse(localStorage.getItem('genogram_feedback') || '[]');
    existingFeedback.push({
      ...feedbackData,
      error: 'Failed to submit to server'
    });
    localStorage.setItem('genogram_feedback', JSON.stringify(existingFeedback));
    
    return { 
      success: false, 
      message: 'Feedback saved locally due to network error' 
    };
  } catch (localError) {
    console.error('Error saving feedback locally:', localError);
    return { success: false, message: 'Failed to submit feedback' };
  }
}

// Utility function to get locally stored feedback (for debugging/recovery)
export const getLocalFeedback = () => {
  try {
    return JSON.parse(localStorage.getItem('genogram_feedback') || '[]');
  } catch (error) {
    console.error('Error reading local feedback:', error);
    return [];
  }
};

// Utility function to clear local feedback
export const clearLocalFeedback = () => {
  try {
    localStorage.removeItem('genogram_feedback');
    return true;
  } catch (error) {
    console.error('Error clearing local feedback:', error);
    return false;
  }
};