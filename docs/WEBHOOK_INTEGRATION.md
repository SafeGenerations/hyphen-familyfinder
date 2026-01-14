# Email & SMS Webhook Integration

This document explains how to configure external email and SMS providers to automatically log contact events in Family Finder.

## Overview

Family Finder provides webhook endpoints that receive notifications when emails or SMS messages are sent to network members. This enables automatic contact event logging without manual data entry.

## Architecture

```
Email/SMS Provider → Webhook Endpoint → Member Lookup → Contact Event Creation → Database Update
```

1. **Provider sends webhook**: When an email or SMS is sent, your provider (SendGrid, Twilio, etc.) posts to our endpoint
2. **Member lookup**: The webhook finds the network member by email address or phone number
3. **Event creation**: A new `contact_event` document is created with contact details
4. **Member update**: The member's `lastContactAt` timestamp is updated

## Webhook Endpoints

### Email Webhook
- **URL**: `https://your-app.azurewebsites.net/api/webhooks/email`
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: Required via `X-Webhook-API-Key` header

### SMS Webhook
- **URL**: `https://your-app.azurewebsites.net/api/webhooks/sms`
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: Required via `X-Webhook-API-Key` header

## API Key Setup

1. Generate a strong API key for webhook authentication:
   ```bash
   # PowerShell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```

2. Add the key to your Azure Functions application settings:
   ```bash
   az functionapp config appsettings set --name your-function-app \
     --resource-group your-resource-group \
     --settings "WEBHOOK_API_KEY=your-generated-key"
   ```

3. Share this key with authorized email/SMS providers only

## Required Payload Format

### Email Webhook Payload

```json
{
  "to": "member@example.com",
  "from": "caseworker@agency.org",
  "subject": "Follow-up regarding case",
  "timestamp": "2025-01-15T14:30:00Z",
  "provider": "sendgrid",
  "messageId": "optional-provider-message-id",
  "metadata": {
    "childId": "child_123abc"
  }
}
```

**Required Fields:**
- `to`: Recipient email address (must match member's email in database)
- `from`: Sender email address
- `subject`: Email subject line
- `timestamp`: ISO 8601 timestamp when email was sent
- `provider`: Identifier for email provider (e.g., "sendgrid", "mailgun")
- `metadata.childId`: Family Finder child/case ID for routing

**Optional Fields:**
- `messageId`: Provider's unique message identifier
- `status`: Delivery status (delivered, opened, etc.)
- `opens`: Number of times email was opened
- `clicks`: Number of link clicks

### SMS Webhook Payload

```json
{
  "to": "+15555551234",
  "from": "+15555559876",
  "body": "Hi, this is your caseworker following up.",
  "timestamp": "2025-01-15T14:30:00Z",
  "provider": "twilio",
  "messageId": "optional-provider-message-id",
  "metadata": {
    "childId": "child_123abc"
  }
}
```

**Required Fields:**
- `to`: Recipient phone number (E.164 format recommended: +1XXXXXXXXXX)
- `from`: Sender phone number
- `body`: SMS message body
- `timestamp`: ISO 8601 timestamp when SMS was sent
- `provider`: Identifier for SMS provider (e.g., "twilio")
- `metadata.childId`: Family Finder child/case ID for routing

**Optional Fields:**
- `messageId`: Provider's unique message identifier
- `status`: Delivery status
- `segments`: Number of SMS segments used

## Phone Number Matching

The SMS webhook normalizes phone numbers to match various formats:

- **Input**: `+1 (555) 555-1234`, `555-555-1234`, `(555) 555-1234`
- **Normalized**: `5555551234`
- **Matches**: Any member with phone field containing the 10-digit sequence

## Provider Configuration Examples

### SendGrid (Email)

1. Log into SendGrid Dashboard
2. Navigate to **Settings** > **Mail Settings** > **Event Webhook**
3. Set **HTTP Post URL** to: `https://your-app.azurewebsites.net/api/webhooks/email`
4. Add custom header: `X-Webhook-API-Key: your-api-key`
5. Enable events: **Delivered**, **Opened** (optional)
6. Save webhook configuration

**Sending emails with Family Finder integration:**

```javascript
const msg = {
  to: 'member@example.com',
  from: 'caseworker@agency.org',
  subject: 'Follow-up',
  text: 'Message body',
  customArgs: {
    childId: 'child_123abc'  // Required for routing
  }
};

await sgMail.send(msg);
```

SendGrid will automatically post to your webhook when the email is delivered.

### Mailgun (Email)

1. Log into Mailgun Dashboard
2. Navigate to **Sending** > **Webhooks**
3. Click **Add webhook**
4. Select event type: **Delivered**
5. Set URL to: `https://your-app.azurewebsites.net/api/webhooks/email`
6. Add header: `X-Webhook-API-Key: your-api-key`
7. Save webhook

**Sending emails with Family Finder integration:**

```javascript
const mailgun = require('mailgun-js')({
  apiKey: 'your-mailgun-key',
  domain: 'your-domain.com'
});

const data = {
  from: 'caseworker@agency.org',
  to: 'member@example.com',
  subject: 'Follow-up',
  text: 'Message body',
  'v:childId': 'child_123abc'  // Required for routing
};

await mailgun.messages().send(data);
```

### Twilio (SMS)

1. Log into Twilio Console
2. Navigate to **Messaging** > **Services**
3. Select or create a messaging service
4. Go to **Integration** > **Webhooks**
5. Set **Status Callback URL** to: `https://your-app.azurewebsites.net/api/webhooks/sms`
6. For API key header, use TwiML Bins or Twilio Functions to add `X-Webhook-API-Key`
7. Save configuration

**Sending SMS with Family Finder integration:**

```javascript
const client = require('twilio')(accountSid, authToken);

await client.messages.create({
  body: 'Hi, this is your caseworker following up.',
  from: '+15555559876',
  to: '+15555551234',
  statusCallback: 'https://your-app.azurewebsites.net/api/webhooks/sms',
  statusCallbackMethod: 'POST',
  // Note: childId must be included in custom parameters
  // This may require a Twilio Function to add to the webhook payload
});
```

**Note**: Twilio's webhook doesn't natively support custom headers. You'll need to create a Twilio Function that:
1. Receives the status callback
2. Adds the `X-Webhook-API-Key` header
3. Includes `childId` from message parameters
4. Forwards to Family Finder webhook

Example Twilio Function:

```javascript
exports.handler = function(context, event, callback) {
  const axios = require('axios');
  
  axios.post('https://your-app.azurewebsites.net/api/webhooks/sms', {
    to: event.To,
    from: event.From,
    body: event.Body,
    timestamp: event.DateSent,
    provider: 'twilio',
    messageId: event.MessageSid,
    metadata: {
      childId: event.childId  // Include from original message params
    }
  }, {
    headers: {
      'X-Webhook-API-Key': context.FAMILY_FINDER_WEBHOOK_KEY
    }
  })
  .then(() => callback(null, 'Success'))
  .catch(err => callback(err));
};
```

## Testing Webhooks

### Using Frontend Service

```javascript
import { testEmailWebhook, testSmsWebhook } from '../services/webhookService';

// Test email webhook
try {
  const result = await testEmailWebhook('your-api-key');
  console.log('Email webhook test:', result);
} catch (error) {
  console.error('Email webhook failed:', error.message);
}

// Test SMS webhook
try {
  const result = await testSmsWebhook('your-api-key');
  console.log('SMS webhook test:', result);
} catch (error) {
  console.error('SMS webhook failed:', error.message);
}
```

### Using cURL

**Email webhook:**
```bash
curl -X POST https://your-app.azurewebsites.net/api/webhooks/email \
  -H "Content-Type: application/json" \
  -H "X-Webhook-API-Key: your-api-key" \
  -d '{
    "to": "test@example.com",
    "from": "caseworker@agency.org",
    "subject": "Test email",
    "timestamp": "2025-01-15T14:30:00Z",
    "provider": "test",
    "metadata": {
      "childId": "child_123abc"
    }
  }'
```

**SMS webhook:**
```bash
curl -X POST https://your-app.azurewebsites.net/api/webhooks/sms \
  -H "Content-Type: application/json" \
  -H "X-Webhook-API-Key: your-api-key" \
  -d '{
    "to": "+15555551234",
    "from": "+15555559876",
    "body": "Test message",
    "timestamp": "2025-01-15T14:30:00Z",
    "provider": "test",
    "metadata": {
      "childId": "child_123abc"
    }
  }'
```

## Response Codes

- **200 OK**: Contact event created successfully
  ```json
  {
    "success": true,
    "contactEventId": "60d5ec49e6b5a83d4c8f1234",
    "memberUpdated": true
  }
  ```

- **401 Unauthorized**: Missing or invalid API key
  ```json
  {
    "error": "Unauthorized",
    "message": "Missing or invalid webhook API key"
  }
  ```

- **404 Not Found**: Member not found by email/phone
  ```json
  {
    "error": "Member not found",
    "message": "No member found with email: member@example.com for child: child_123abc"
  }
  ```

- **500 Internal Server Error**: Database or processing error
  ```json
  {
    "error": "Internal server error",
    "message": "Failed to create contact event: <error details>"
  }
  ```

## Database Schema

### Contact Event Document

```javascript
{
  _id: ObjectId("60d5ec49e6b5a83d4c8f1234"),
  memberId: ObjectId("60d5ec49e6b5a83d4c8f5678"),
  childId: "child_123abc",
  contactType: "email",  // or "sms"
  direction: "outbound",
  timestamp: ISODate("2025-01-15T14:30:00Z"),
  notes: "Automated from SendGrid webhook",
  metadata: {
    provider: "sendgrid",
    to: "member@example.com",
    from: "caseworker@agency.org",
    subject: "Follow-up regarding case",
    messageId: "abc123def456"
  },
  createdAt: ISODate("2025-01-15T14:30:05Z")
}
```

### Member Update

When a contact event is logged, the member document is updated:

```javascript
{
  _id: ObjectId("60d5ec49e6b5a83d4c8f5678"),
  // ... other fields
  lastContactAt: ISODate("2025-01-15T14:30:00Z"),  // Updated to latest contact
  updatedAt: ISODate("2025-01-15T14:30:05Z")
}
```

## Security Considerations

1. **API Key Protection**:
   - Never commit API keys to source control
   - Use Azure Key Vault for production
   - Rotate keys regularly
   - Use different keys for dev/staging/prod

2. **Rate Limiting**:
   - Consider implementing rate limits on webhook endpoints
   - Monitor for unusual activity patterns
   - Set up alerts for failed authentication attempts

3. **Payload Validation**:
   - All incoming data is sanitized
   - Required fields are validated before database operations
   - Invalid payloads return 400 Bad Request

4. **Database Security**:
   - Webhook functions use read-only member lookup
   - Write operations limited to contact_events and member updates
   - Connection strings stored in Azure App Settings

## Monitoring and Debugging

### Azure Application Insights

Enable Application Insights for your Function App to track:
- Webhook invocation counts
- Success/failure rates
- Average response times
- Exception details

### Log Queries

```kusto
// Failed webhook attempts
traces
| where message contains "Webhook error"
| project timestamp, message, customDimensions

// Successful contact events
traces
| where message contains "Contact event created"
| summarize count() by bin(timestamp, 1h)
```

### Common Issues

**Issue**: "Member not found" errors
- **Cause**: Email/phone in webhook doesn't match database
- **Solution**: Verify member contact info matches exactly; check for typos, extra spaces, or formatting differences

**Issue**: "Missing childId" errors
- **Cause**: Provider not sending childId in metadata
- **Solution**: Review provider configuration; ensure childId is included in custom parameters when sending messages

**Issue**: "Unauthorized" errors
- **Cause**: API key mismatch
- **Solution**: Verify API key in provider configuration matches `WEBHOOK_API_KEY` environment variable

## Future Enhancements

- [ ] Admin UI for webhook configuration and testing
- [ ] Webhook retry logic for failed deliveries
- [ ] Support for additional providers (AWS SES, Postmark, etc.)
- [ ] Inbound message handling (replies from members)
- [ ] Webhook event filtering and routing rules
- [ ] Real-time dashboard for contact activity
- [ ] Automated follow-up reminders based on contact frequency

## Support

For webhook integration assistance:
1. Check Azure Function logs for detailed error messages
2. Use the test endpoints in `webhookService.js`
3. Verify payload structure against required format
4. Contact development team with provider details and error logs
