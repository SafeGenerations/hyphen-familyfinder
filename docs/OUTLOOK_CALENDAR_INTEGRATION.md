# Microsoft Outlook/Exchange Calendar Integration Setup

This document explains how to configure Microsoft Outlook/Exchange Calendar integration for Family Finder follow-up scheduling. **This is the recommended option for government and enterprise clients** who use Microsoft 365.

## User Experience

**Each caseworker authorizes their own personal Outlook calendar once:**

1. Caseworker clicks "Schedule Follow-up" on a member profile
2. If not yet authorized, they're prompted to connect their Outlook calendar
3. They sign in with their Microsoft 365 account (same credentials they use for email)
4. They grant permission for Family Finder to create calendar events
5. **That's it!** - All future follow-ups automatically appear in their Outlook calendar
6. Reminders work on their phone, desktop, and any device synced with their work calendar

## Admin Setup (One-Time Configuration)

### Step 1: Register App in Microsoft Entra ID (Azure AD)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Click **App registrations** > **New registration**
4. Configure:
   - **Name**: Family Finder Calendar Integration
   - **Supported account types**: 
     - Select **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)**
     - This allows any organization using Microsoft 365 to use your app
   - **Redirect URI**: 
     - Platform: **Web**
     - URI: `https://your-app.azurewebsites.net/auth/microsoft/callback`
5. Click **Register**

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `Calendars.ReadWrite` (Create and read calendar events)
   - `offline_access` (Maintain access to data you have given it access to)
6. Click **Add permissions**
7. **Admin consent**: If your organization requires it, click **Grant admin consent for [Org Name]**

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: "Family Finder Production Secret"
4. Choose expiration: **24 months** (recommended)
5. Click **Add**
6. **Copy the secret value immediately** - you won't see it again!
7. Also copy the **Application (client) ID** from the Overview page

### Step 4: Configure Azure Function App Settings

Add these settings to your Azure Function App:

```powershell
# PowerShell
az functionapp config appsettings set --name your-function-app `
  --resource-group your-resource-group `
  --settings `
  "MICROSOFT_CLIENT_ID=your-app-id-guid" `
  "MICROSOFT_CLIENT_SECRET=your-client-secret" `
  "MICROSOFT_REDIRECT_URI=https://your-app.azurewebsites.net/auth/microsoft/callback"
```

Or add manually in Azure Portal:
1. Navigate to your Function App
2. **Configuration** > **Application settings** > **New application setting**
3. Add each setting:
   - `MICROSOFT_CLIENT_ID`: Your application (client) ID
   - `MICROSOFT_CLIENT_SECRET`: The secret value you copied
   - `MICROSOFT_REDIRECT_URI`: Your callback URL

### Step 5: Install Required NPM Packages

```powershell
cd api
npm install axios
```

Update `api/package.json`:
```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### Step 6: Set Default Calendar Provider (Optional)

To make Outlook the default for all users, add to your frontend configuration:

**Option A: Environment variable** (recommended)
```env
# .env or .env.production
REACT_APP_DEFAULT_CALENDAR_PROVIDER=outlook
```

**Option B: Index.html configuration**
```html
<!-- public/index.html -->
<script>
  window.FAMILY_FINDER_CONFIG = {
    defaultCalendarProvider: 'outlook'
  };
</script>
```

## How It Works for Caseworkers

### First Time Authorization

1. **Trigger**: Click "📅 Schedule Follow-up" button
2. **Prompt**: "Connect your Outlook calendar" dialog appears
3. **Sign in**: Popup opens to Microsoft login page
4. **Authenticate**: Enter Microsoft 365 credentials (same as email)
5. **Grant permission**: Review and accept calendar access
6. **Complete**: Popup closes, can now schedule events

### After Authorization

1. **Click "Schedule Follow-up"** on any network member
2. **Select date/time** from suggested options or custom date
3. **Configure reminder** (15 min, 1 hour, 1 day before, etc.)
4. **Create event** - immediately appears in Outlook calendar
5. **Get reminder** on phone/desktop when time approaches

### Benefits for Caseworkers

- ✅ **No separate calendar to check** - uses their existing work calendar
- ✅ **Mobile reminders** - syncs to Outlook app on phone
- ✅ **Email notifications** - can get reminder emails from Outlook
- ✅ **Desktop notifications** - pops up on computer
- ✅ **One-click authorization** - only do it once, works forever
- ✅ **Auto-sync** - any device with Outlook sees the events
- ✅ **Member contact info** included in event description

## For Organizations Using On-Premises Exchange

If your organization uses **Exchange Server** (on-premises) instead of Microsoft 365:

### Exchange Web Services (EWS) Integration

For on-premises Exchange, you have two options:

**Option 1: Hybrid Setup** (Recommended)
- Configure Exchange Hybrid with Microsoft 365
- Use Microsoft Graph API as documented above
- Calendars sync between on-premises and cloud

**Option 2: Direct EWS Integration**
- Requires additional development for Exchange Web Services
- More complex authentication (Basic or OAuth with ADFS)
- Contact SafeGenerations support for EWS integration package

Most modern deployments use Microsoft 365 or hybrid setup, which work with the Graph API integration documented here.

## Multi-Organization Support

Family Finder supports multiple organizations with different calendar systems:

### Scenario 1: All users in one org use Outlook
- Set `REACT_APP_DEFAULT_CALENDAR_PROVIDER=outlook`
- All users get Outlook by default
- No provider selection needed

### Scenario 2: Mixed environment (some Google, some Outlook)
- Don't set a default provider
- Users select their provider on first use
- Choice is saved in browser
- Can change anytime in settings

### Scenario 3: Multi-tenant SaaS
- Each organization configures their own app registration
- Tenant-specific client IDs stored in database
- Users automatically get their org's calendar provider

## Database Schema

### Calendar Tokens (Multi-Provider)

```javascript
// calendar_tokens collection
{
  _id: ObjectId("..."),
  userId: "user123",
  provider: "outlook",  // or "google"
  accessToken: "eyJ0eXAiOiJKV1QiLCJhbGci...",
  refreshToken: "M.R3_BAY.-CUp7RG...",
  scope: "Calendars.ReadWrite offline_access",
  tokenType: "Bearer",
  expiryDate: ISODate("2025-10-19T12:00:00Z"),
  createdAt: ISODate("2025-10-19T10:00:00Z"),
  updatedAt: ISODate("2025-10-19T10:00:00Z")
}
```

### Calendar Events (Multi-Provider)

```javascript
// calendar_events collection
{
  _id: ObjectId("..."),
  childId: "child123",
  memberId: ObjectId("..."),
  userId: "user123",
  provider: "outlook",  // or "google"
  outlookEventId: "AAMkAGI2TG...",  // Outlook event ID
  googleEventId: null,  // or Google event ID
  summary: "Follow-up: John Doe (Uncle)",
  description: "Follow-up contact with John Doe...",
  startTime: ISODate("2025-10-25T14:00:00Z"),
  endTime: ISODate("2025-10-25T14:30:00Z"),
  contactType: "phone",
  reminderMinutes: 60,
  metadata: { ... },
  status: "scheduled",
  webLink: "https://outlook.office365.com/calendar/item/...",
  createdAt: ISODate("2025-10-19T10:00:00Z")
}
```

## Security & Compliance

### Token Security
- ✅ Access tokens expire after 1 hour
- ✅ Refresh tokens enable automatic renewal
- ✅ Tokens encrypted at rest in Cosmos DB
- ✅ Scoped to calendar access only (no email, contacts, or files)

### Data Privacy
- ✅ Each user's tokens isolated to their account
- ✅ Events only visible to the caseworker who created them
- ✅ No cross-user calendar access
- ✅ Users can revoke access anytime

### Compliance
- ✅ HIPAA compliant when using Microsoft 365 E3/E5
- ✅ Data residency follows Microsoft 365 tenant location
- ✅ Audit logs track all calendar operations
- ✅ Microsoft Entra ID controls authentication

## Troubleshooting

### "Calendar not authorized" Error

**User sees**: "Please authorize your Outlook calendar"

**Solution**: Click "Connect Outlook" button and sign in

### "Invalid client" Error

**Cause**: Wrong client ID or secret in Azure settings

**Solution**:
1. Verify `MICROSOFT_CLIENT_ID` matches Azure app registration
2. Verify `MICROSOFT_CLIENT_SECRET` is current (not expired)
3. Check for typos or extra spaces

### "Redirect URI mismatch" Error

**Cause**: Callback URL doesn't match registered redirect URI

**Solution**:
1. Go to Azure Portal > App registrations > Your app
2. Click **Authentication**
3. Add exact callback URL: `https://your-app.azurewebsites.net/auth/microsoft/callback`
4. Save and wait 5 minutes for propagation

### Events Not Appearing in Outlook

**Possible causes**:
1. Token expired - user needs to re-authorize
2. Calendar sync delayed - wait a few minutes
3. Wrong calendar selected - check primary vs shared calendars

**Solution**: Have user re-authorize if events still don't appear after 5 minutes

### Popup Blocked

**Cause**: Browser blocked authorization popup

**Solution**:
1. Allow popups for Family Finder domain
2. Click authorization button again

## Comparison: Outlook vs Google Calendar

| Feature | Microsoft Outlook | Google Calendar |
|---------|------------------|-----------------|
| **Best for** | Government, enterprise, large orgs | Small teams, personal use |
| **Common in** | Social services, child welfare | Tech companies, startups |
| **Integration** | Microsoft Graph API | Google Calendar API |
| **Mobile apps** | Outlook, Teams | Google Calendar |
| **Admin setup** | Microsoft Entra ID | Google Cloud Console |
| **Token lifespan** | 1 hour (auto-refresh) | 1 hour (auto-refresh) |
| **Permissions** | Calendars.ReadWrite | calendar scope |

## Production Checklist

- [ ] App registered in Microsoft Entra ID
- [ ] API permissions granted (Calendars.ReadWrite, offline_access)
- [ ] Client secret created and stored securely
- [ ] Azure Function App settings configured
- [ ] `axios` npm package installed in `api` directory
- [ ] Redirect URI matches production domain
- [ ] Default calendar provider set (if needed)
- [ ] Test authorization flow with real Microsoft 365 accounts
- [ ] Test event creation and syncing to Outlook
- [ ] Verify mobile reminders work on phones
- [ ] Set up monitoring for auth failures
- [ ] Document process for caseworkers
- [ ] Train staff on first-time authorization

## Support for Both Providers

Family Finder supports **both Outlook and Google Calendar** simultaneously:

- **Per-user choice**: Each caseworker can pick their preferred provider
- **Auto-detection**: System can default based on organization
- **Unified interface**: Same "Schedule Follow-up" button works for both
- **Backend abstraction**: API handles provider differences transparently

See `src/src-modern/services/outlookCalendarService.js` for unified calendar service implementation.

## Need Help?

- **Microsoft Graph API docs**: https://learn.microsoft.com/en-us/graph/api/resources/calendar
- **Microsoft Entra ID setup**: https://learn.microsoft.com/en-us/azure/active-directory/
- **Exchange Hybrid**: https://learn.microsoft.com/en-us/exchange/exchange-hybrid
- **SafeGenerations support**: Contact your implementation team
