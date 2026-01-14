// src/src-modern/services/webhookService.js
// Service layer for webhook endpoint management and testing

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Get webhook endpoint URLs for provider configuration
 * @returns {Object} Webhook URLs for email and SMS
 */
export function getWebhookEndpoints() {
  const baseUrl = API_BASE_URL || window.location.origin;
  
  return {
    email: `${baseUrl}/api/webhooks/email`,
    sms: `${baseUrl}/api/webhooks/sms`,
    apiKeyRequired: true
  };
}

/**
 * Test email webhook endpoint with sample payload
 * @param {string} apiKey - Webhook API key
 * @param {Object} testPayload - Test email event payload
 * @returns {Promise<Object>} Response from webhook
 */
export async function testEmailWebhook(apiKey, testPayload = null) {
  const samplePayload = testPayload || {
    to: 'test@example.com',
    from: 'caseworker@agency.org',
    subject: 'Follow-up regarding case',
    timestamp: new Date().toISOString(),
    provider: 'test',
    metadata: {
      childId: 'test-child-id'
    }
  };

  const response = await fetch(getWebhookEndpoints().email, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-API-Key': apiKey
    },
    body: JSON.stringify(samplePayload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Webhook test failed');
  }

  return await response.json();
}

/**
 * Test SMS webhook endpoint with sample payload
 * @param {string} apiKey - Webhook API key
 * @param {Object} testPayload - Test SMS event payload
 * @returns {Promise<Object>} Response from webhook
 */
export async function testSmsWebhook(apiKey, testPayload = null) {
  const samplePayload = testPayload || {
    to: '+15555551234',
    from: '+15555559876',
    body: 'Hi, this is your caseworker following up.',
    timestamp: new Date().toISOString(),
    provider: 'test',
    metadata: {
      childId: 'test-child-id'
    }
  };

  const response = await fetch(getWebhookEndpoints().sms, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-API-Key': apiKey
    },
    body: JSON.stringify(samplePayload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Webhook test failed');
  }

  return await response.json();
}

/**
 * Generate webhook configuration examples for common providers
 * @param {string} apiKey - Webhook API key to include in examples
 * @returns {Object} Configuration examples by provider
 */
export function generateProviderConfigs(apiKey) {
  const endpoints = getWebhookEndpoints();

  return {
    sendgrid: {
      name: 'SendGrid',
      url: endpoints.email,
      method: 'POST',
      headers: {
        'X-Webhook-API-Key': apiKey
      },
      payloadMapping: {
        to: '{{email}}',
        from: '{{from_email}}',
        subject: '{{subject}}',
        timestamp: '{{timestamp}}',
        provider: 'sendgrid',
        messageId: '{{sg_message_id}}',
        metadata: {
          childId: '{{custom_args.childId}}'
        }
      },
      setupInstructions: `
1. Log into SendGrid Dashboard
2. Navigate to Settings > Mail Settings > Event Webhook
3. Set HTTP Post URL to: ${endpoints.email}
4. Add custom header: X-Webhook-API-Key = ${apiKey}
5. Include childId in custom_args when sending emails
6. Enable "Delivered" and "Opened" events
      `.trim()
    },

    mailgun: {
      name: 'Mailgun',
      url: endpoints.email,
      method: 'POST',
      headers: {
        'X-Webhook-API-Key': apiKey
      },
      payloadMapping: {
        to: '{{recipient}}',
        from: '{{sender}}',
        subject: '{{subject}}',
        timestamp: '{{timestamp}}',
        provider: 'mailgun',
        messageId: '{{message-id}}',
        metadata: {
          childId: '{{user-variables.childId}}'
        }
      },
      setupInstructions: `
1. Log into Mailgun Dashboard
2. Navigate to Sending > Webhooks
3. Create new webhook for "Delivered" events
4. Set URL to: ${endpoints.email}
5. Add X-Webhook-API-Key header in webhook settings
6. Include childId in user-variables when sending emails
      `.trim()
    },

    twilio: {
      name: 'Twilio',
      url: endpoints.sms,
      method: 'POST',
      headers: {
        'X-Webhook-API-Key': apiKey
      },
      payloadMapping: {
        to: '{{To}}',
        from: '{{From}}',
        body: '{{Body}}',
        timestamp: '{{DateSent}}',
        provider: 'twilio',
        messageId: '{{MessageSid}}',
        metadata: {
          childId: '{{CustomData}}'
        }
      },
      setupInstructions: `
1. Log into Twilio Console
2. Navigate to Messaging > Services
3. Select your messaging service
4. Go to Integration > Webhooks
5. Set Status Callback URL to: ${endpoints.sms}
6. Add X-Webhook-API-Key as custom header (requires TwiML Bins or Functions)
7. Include childId in message parameters when sending SMS
      `.trim()
    },

    generic: {
      name: 'Generic Email Provider',
      url: endpoints.email,
      method: 'POST',
      requiredHeaders: {
        'Content-Type': 'application/json',
        'X-Webhook-API-Key': apiKey
      },
      requiredFields: {
        to: 'Recipient email address',
        from: 'Sender email address',
        subject: 'Email subject',
        timestamp: 'ISO 8601 timestamp',
        provider: 'Provider identifier',
        metadata: {
          childId: 'Family Finder child ID'
        }
      },
      optionalFields: {
        messageId: 'Provider message ID',
        status: 'Delivery status',
        opens: 'Open count',
        clicks: 'Click count'
      }
    },

    genericSms: {
      name: 'Generic SMS Provider',
      url: endpoints.sms,
      method: 'POST',
      requiredHeaders: {
        'Content-Type': 'application/json',
        'X-Webhook-API-Key': apiKey
      },
      requiredFields: {
        to: 'Recipient phone number (E.164 format recommended)',
        from: 'Sender phone number',
        body: 'Message body',
        timestamp: 'ISO 8601 timestamp',
        provider: 'Provider identifier',
        metadata: {
          childId: 'Family Finder child ID'
        }
      },
      optionalFields: {
        messageId: 'Provider message ID',
        status: 'Delivery status',
        segments: 'Message segment count'
      }
    }
  };
}

/**
 * Validate webhook payload structure
 * @param {Object} payload - Webhook payload to validate
 * @param {string} type - 'email' or 'sms'
 * @returns {Object} Validation result with errors if any
 */
export function validateWebhookPayload(payload, type) {
  const errors = [];

  // Common required fields
  if (!payload.to) errors.push('Missing "to" field');
  if (!payload.from) errors.push('Missing "from" field');
  if (!payload.timestamp) errors.push('Missing "timestamp" field');
  if (!payload.provider) errors.push('Missing "provider" field');
  if (!payload.metadata?.childId) errors.push('Missing "metadata.childId" field');

  // Type-specific validation
  if (type === 'email') {
    if (!payload.subject) errors.push('Missing "subject" field for email');
    if (payload.to && !payload.to.includes('@')) {
      errors.push('Invalid email format in "to" field');
    }
  } else if (type === 'sms') {
    if (!payload.body) errors.push('Missing "body" field for SMS');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
