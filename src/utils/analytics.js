// src/utils/analytics.js
export const trackEvent = (action, category = 'genogram_interaction', label = '', value = null) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Specific tracking functions for common events
export const trackFeatureUse = (feature) => {
  trackEvent('feature_use', 'engagement', feature);
};

export const trackPersonAction = (action, details = '') => {
  trackEvent(action, 'person_management', details);
};

export const trackRelationshipAction = (action, type = '') => {
  trackEvent(action, 'relationship_management', type);
};

export const trackExport = (format) => {
  trackEvent('export_genogram', 'file_operations', format);
};

export const trackSave = (method = 'manual') => {
  trackEvent('save_genogram', 'file_operations', method);
};

export const trackError = (error, context = '') => {
  trackEvent('error_occurred', 'errors', `${context}: ${error}`);
};