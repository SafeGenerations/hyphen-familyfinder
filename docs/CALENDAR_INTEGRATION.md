# Google Calendar Integration Setup

This document explains how to configure Google Calendar API integration for Family Finder follow-up scheduling.

## Prerequisites

- Google Cloud Platform account
- Family Finder Azure deployment
- Access to Azure App Configuration

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Calendar API" and enable it

## Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Fill in application information:
   - **App name**: Family Finder
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes:
   - Click **Add or Remove Scopes**
   - Search for and add: `https://www.googleapis.com/auth/calendar`
5. Add test users (during development):
   - Add email addresses of users who will test the integration
6. Save and continue through remaining steps

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: Family Finder Calendar Integration
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-app.azurewebsites.net` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://your-app.azurewebsites.net/auth/google/callback` (production)
5. Click **Create**
6. **Save the Client ID and Client Secret** - you'll need these for Azure configuration

## Step 4: Configure Azure App Settings

Add the following application settings to your Azure Function App:

```bash
# PowerShell
az functionapp config appsettings set --name your-function-app `
  --resource-group your-resource-group `
  --settings `
  "GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" `
  "GOOGLE_CLIENT_SECRET=your-client-secret" `
  "GOOGLE_REDIRECT_URI=https://your-app.azurewebsites.net/auth/google/callback"
```

Or add them manually in the Azure Portal:
1. Navigate to your Function App
2. Go to **Configuration** > **Application settings**
3. Add new settings:
   - `GOOGLE_CLIENT_ID`: Your OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your OAuth client secret
   - `GOOGLE_REDIRECT_URI`: Your callback URL

## Step 5: Install Required NPM Package

In your `api` directory, install the Google APIs client library:

```powershell
cd api
npm install googleapis
```

Update `api/package.json` dependencies:
```json
{
  "dependencies": {
    "googleapis": "^128.0.0"
  }
}
```

## Step 6: User Authorization Flow

### For End Users:

1. **Navigate to Member Profile** or **Contact Event** in Family Finder
2. Click **📅 Schedule Follow-up** button
3. If not authorized, click **🔐 Authorize Google Calendar**
4. A popup window opens to Google's authorization page
5. Sign in with your Google account
6. Review and accept the calendar access permission
7. Window closes automatically upon success
8. You can now schedule follow-up events

### Authorization Persistence:

- Tokens are stored securely in Cosmos DB (`calendar_tokens` collection)
- Refresh tokens enable long-term access without re-authorization
- Users can revoke access at any time from their Google Account settings

## Step 7: Testing the Integration

### Test Authorization:

```javascript
import { getCalendarAuthStatus, initializeCalendarAuth } from './services/calendarService';

// Check if authorized
const status = await getCalendarAuthStatus();
console.log('Authorized:', status.authorized);

// If not authorized, initiate flow
if (!status.authorized) {
  const { authUrl } = await initializeCalendarAuth();
  window.open(authUrl, '_blank');
}
```

### Test Event Creation:

```javascript
import { createFollowUpEvent, buildFollowUpEventData } from './services/calendarService';

const member = {
  _id: 'member123',
  firstName: 'John',
  lastName: 'Doe',
  relationship: 'Uncle',
  email: 'john@example.com',
  phone: '+15555551234'
};

const eventData = buildFollowUpEventData(member, {
  childId: 'child123',
  date: '2025-10-25',
  time: '14:00',
  duration: 30,
  contactType: 'phone',
  notes: 'Follow up regarding case status'
});

const result = await createFollowUpEvent(eventData);
console.log('Event created:', result);
```

## Database Schema

### Calendar Tokens Collection

```javascript
// calendar_tokens
{
  _id: ObjectId("..."),
  userId: "user123",
  accessToken: "ya29.a0...",
  refreshToken: "1//0...",
  scope: "https://www.googleapis.com/auth/calendar",
  tokenType: "Bearer",
  expiryDate: ISODate("2025-10-20T10:00:00Z"),
  createdAt: ISODate("2025-10-19T10:00:00Z"),
  updatedAt: ISODate("2025-10-19T10:00:00Z")
}
```

### Calendar Events Collection

```javascript
// calendar_events
{
  _id: ObjectId("..."),
  childId: "child123",
  memberId: ObjectId("..."),
  userId: "user123",
  googleEventId: "abc123def456",
  summary: "Follow-up: John Doe (Uncle)",
  description: "Follow-up contact with John Doe\nRelationship: Uncle\n...",
  startTime: ISODate("2025-10-25T14:00:00Z"),
  endTime: ISODate("2025-10-25T14:30:00Z"),
  contactType: "phone",
  reminderMinutes: 60,
  metadata: {
    memberName: "John Doe",
    relationship: "Uncle",
    email: "john@example.com",
    phone: "+15555551234"
  },
  status: "scheduled",
  reminderSent: false,
  htmlLink: "https://www.google.com/calendar/event?eid=...",
  createdAt: ISODate("2025-10-19T10:00:00Z")
}
```

## Security Considerations

1. **Token Storage**:
   - Tokens are encrypted at rest in Cosmos DB
   - Access tokens expire after 1 hour
   - Refresh tokens enable automatic renewal

2. **User Isolation**:
   - Each user has separate OAuth tokens
   - Calendar events are scoped to user + child + member
   - No cross-user data access

3. **Scope Limitations**:
   - Only `calendar` scope is requested
   - No access to user's emails, contacts, or other data

4. **Revocation**:
   - Users can revoke access from Google Account settings
   - App provides in-app revocation button
   - Tokens are deleted from database upon revocation

## Troubleshooting

### Error: "Calendar not authorized"

**Cause**: User hasn't authorized Google Calendar access or tokens expired.

**Solution**: 
1. Check auth status: `getCalendarAuthStatus()`
2. Re-authorize if needed: `initializeCalendarAuth()`

### Error: "Invalid client"

**Cause**: OAuth client ID or secret misconfigured.

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Azure settings
2. Ensure values match Google Cloud Console credentials
3. Check for extra spaces or quotes in configuration

### Error: "Redirect URI mismatch"

**Cause**: Callback URL doesn't match authorized redirect URIs.

**Solution**:
1. Go to Google Cloud Console > Credentials
2. Edit OAuth client
3. Add exact callback URL to **Authorized redirect URIs**
4. Wait a few minutes for changes to propagate

### Popup Blocked

**Cause**: Browser blocked OAuth popup window.

**Solution**:
1. Allow popups for your Family Finder domain
2. Click authorization button again

## Production Checklist

- [ ] OAuth consent screen verified by Google (if using External user type)
- [ ] Production redirect URI added to Google Cloud credentials
- [ ] Azure App Settings configured with production values
- [ ] Token encryption enabled in Cosmos DB
- [ ] Test authorization and event creation in production environment
- [ ] Monitor Application Insights for auth errors
- [ ] Set up alerts for failed calendar operations

## API Rate Limits

Google Calendar API quotas (as of October 2025):
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 250

For most use cases, these limits are sufficient. If you expect high usage:
1. Request quota increase in Google Cloud Console
2. Implement client-side caching for event lists
3. Add retry logic with exponential backoff

## Future Enhancements

- [ ] Support for multiple calendars
- [ ] Recurring follow-up schedules
- [ ] Automatic rescheduling based on contact events
- [ ] Calendar sync for entire caseload
- [ ] SMS/Email reminders in addition to calendar notifications
- [ ] Integration with Outlook Calendar (Microsoft Graph API)
