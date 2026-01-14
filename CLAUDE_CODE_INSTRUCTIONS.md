# Family Finding Application - Claude Code Implementation Guide
## **UPDATED VERSION - Includes RFP Gap Analysis Additions**

---

## 🔔 IMPORTANT NOTES FOR AI CODERS

**Legend:**
- ✅ = Original requirement (already in your work)
- 🆕 = NEW requirement from RFP gap analysis (ADD THIS TO YOUR EXISTING WORK)
- 🔧 = Modified/enhanced requirement (UPDATE YOUR EXISTING IMPLEMENTATION)

**Instructions:**
1. Continue with your existing implementation plan
2. When you see 🆕, add these new steps/features to your existing phase
3. When you see 🔧, enhance your existing implementation with the specified details
4. Maintain the phase order but add new phases (5-10) after completing Phase 4

---

## Context & Vision

You are transforming an existing genogram application into a comprehensive family finding and network mapping platform for child welfare social workers. The genogram builder is the **central UI** where all mapping happens - it will support traditional genograms, ecomaps, and family finding visualization on a single canvas.

**Reference Documents:**
- `prd.md` - Product Requirements Document with full feature specifications (NOW UPDATED)
- `genogram-node-types-requirement.md` - Node type flexibility requirements
- `pdf-report-requirements.md` - PDF generation requirements

---

## Current Application State

### Existing Architecture
- **Framework**: React with TypeScript
- **State Management**: Custom GenogramContext (`src/contexts/GenogramContext.js`)
- **Canvas**: Interactive SVG-based drag-and-drop interface
- **Node System**: Currently supports person nodes only
- **Relationship System**: Robust relationship editing with visual styles and attributes
- **Data Persistence**: Azure Cosmos DB backend
- **UI Components**: Material-UI with custom modals

### Key Existing Components
- `GenogramCanvas.js` - Main canvas for node/relationship visualization
- `QuickAddModal.js` - Fast node creation (just updated for node types)
- `PersonEditModal.js` - Detailed person editing
- `RelationshipEditModal.js` - Relationship editing with tabs (Basic/Visual/Clinical/Notes)
- `Toolbar.js` - Main toolbar with actions
- SVG rendering and interaction handlers
- Copy-to-clipboard functionality (SVG → PNG via canvas at 2× scale)

### What Works Well
- Fast, intuitive node positioning with snap-to-grid
- Smooth drag-and-drop
- Relationship visual styling (line types, colors, attributes)
- Context menu for quick actions
- Keyboard shortcuts
- Network member system (marking persons as network members with roles)

---

## Implementation Phases

Execute these phases in order, ensuring each is stable before proceeding.

---

## PHASE 1: Node Type System Foundation (✅ ORIGINAL)

**Goal**: Extend the existing person-based system to support multiple node types while maintaining backward compatibility.

### Step 1.1: Update Data Model (✅ ORIGINAL)

**File**: `src/contexts/GenogramContext.js`

Add node type constants:
```javascript
export const NodeType = {
  PERSON: 'person',
  ORGANIZATION: 'organization',
  SERVICE_RESOURCE: 'service_resource',
  PLACE_LOCATION: 'place_location',
  CUSTOM: 'custom'
};
```

Update node structure in state:
```javascript
// Add to each node object:
{
  id: string,
  type: NodeType, // NEW - defaults to 'person' for existing nodes
  name: string,
  x: number,
  y: number,
  
  // Person-specific fields (only if type === PERSON)
  gender?: string,
  age?: number,
  birthDate?: string,
  isDeceased?: boolean,
  networkMember?: boolean,
  networkRole?: string,
  
  // Type-specific data for non-person nodes
  typeData?: {
    // For ORGANIZATION
    organizationType?: string,
    address?: string,
    phone?: string,
    contactPerson?: string,
    
    // For SERVICE_RESOURCE
    serviceType?: string,
    eligibility?: string,
    availability?: string,
    
    // For PLACE_LOCATION
    locationType?: string,
    address?: string,
    accessibilityFeatures?: string[],
  },
  
  // Universal fields
  notes?: string, // Rich text notes
  visualStyle?: {
    color?: string,
    shape?: string,
    icon?: string,
  }
}
```

### Step 1.2: Migration Logic (✅ ORIGINAL)

Add migration function to GenogramContext:
```javascript
const migrateNodesIfNeeded = (nodes) => {
  return nodes.map(node => ({
    ...node,
    type: node.type || NodeType.PERSON,
    typeData: node.typeData || {}
  }));
};
```

### Step 1.3: Update QuickAddModal (✅ ORIGINAL)

**File**: `src/components/UI/QuickAddModal.js`

✅ **ALREADY DONE** - You have the updated version with type selector, conditional fields, etc.

### Step 1.4: Update Visual Rendering (✅ ORIGINAL)

**File**: `src/components/GenogramCanvas.js`

Update node rendering logic for different types with appropriate shapes and icons.

### Step 1.5: Update Edit Modal (✅ ORIGINAL)

**File**: `src/components/UI/PersonEditModal.js` → Rename to `NodeEditModal.js`

Add tabs similar to RelationshipEditModal:
- **Basic Tab**: Type-specific fields
- **Visual Tab**: Color, shape, icon customization
- **Notes Tab**: Rich text notes

### 🆕 Step 1.6: Implement Specific Activity Filters (NEW)

**File**: `src/components/Toolbar.js` or `src/components/FilterPanel.js`

**IMPORTANT**: Implement specific time-based activity filters (not just generic filtering):

```javascript
// Add filter state
const [activityFilter, setActivityFilter] = useState('all');

// Filter options
const ACTIVITY_FILTERS = {
  ALL: 'all',
  ACTIVE_30: 'active_30',    // Green - contact within 30 days
  ACTIVE_60: 'active_60',    // Yellow - 30-60 days
  ACTIVE_90: 'active_90',    // Orange - 60-90 days
  INACTIVE_90: 'inactive_90' // Red - 90+ days
};

// Apply filter logic
const filterNodesByActivity = (nodes) => {
  if (activityFilter === ACTIVITY_FILTERS.ALL) return nodes;
  
  const now = new Date();
  return nodes.filter(node => {
    const daysSinceContact = getDaysSinceLastContact(node);
    
    switch(activityFilter) {
      case ACTIVITY_FILTERS.ACTIVE_30:
        return daysSinceContact <= 30;
      case ACTIVITY_FILTERS.ACTIVE_60:
        return daysSinceContact > 30 && daysSinceContact <= 60;
      case ACTIVITY_FILTERS.ACTIVE_90:
        return daysSinceContact > 60 && daysSinceContact <= 90;
      case ACTIVITY_FILTERS.INACTIVE_90:
        return daysSinceContact > 90;
      default:
        return true;
    }
  });
};

// UI Component
<FormControl>
  <InputLabel>Activity Filter</InputLabel>
  <Select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
    <MenuItem value="all">All Network Members</MenuItem>
    <MenuItem value="active_30">🟢 Active (< 30 days)</MenuItem>
    <MenuItem value="active_60">🟡 Moderate (30-60 days)</MenuItem>
    <MenuItem value="active_90">🟠 Low Activity (60-90 days)</MenuItem>
    <MenuItem value="inactive_90">🔴 Inactive (90+ days)</MenuItem>
  </Select>
</FormControl>
```

**Testing Checkpoints:**
- [ ] Can create nodes of each type via QuickAddModal
- [ ] Existing person nodes still work (backward compatibility)
- [ ] Different node types render with appropriate shapes
- [ ] Can edit nodes and change their type
- [ ] Notes tab works for all node types
- [ ] 🆕 30/60/90 day activity filters work correctly with color coding
- [ ] Data persists to Cosmos DB correctly

---

## PHASE 2: Family Finding Core Features (🔧 ENHANCED)

**Goal**: Add the search, discovery, and potential connection tracking features that enable family finding workflows.

### Step 2.1: Add "Potential" Connection Status (✅ ORIGINAL)

Update relationship data model to support connection stages:

```javascript
{
  id: string,
  person1Id: string,
  person2Id: string,
  type: string,
  connectionStatus?: 'confirmed' | 'potential' | 'exploring' | 'ruled-out',
  discoverySource?: string,
  discoveryDate?: Date,
  discoveryNotes?: string,
  visualStyle?: {...},
  attributes?: [...],
  notes?: string,
}
```

### Step 2.2: Visual Indicators for Potential Connections (✅ ORIGINAL)

Update relationship rendering to show different line styles based on connection status.

### Step 2.3: Add Discovery Tracking Panel (✅ ORIGINAL)

**New Component**: `src/components/Panels/DiscoveryPanel.js`

### Step 2.4: Add Search Interface (✅ ORIGINAL)

**New Component**: `src/components/Search/PersonSearchModal.js`

### Step 2.5: Promote Potential to Confirmed (✅ ORIGINAL)

Add action to relationship edit modal.

### 🆕 Step 2.6: Search Source Configuration UI (NEW)

**New Component**: `src/components/Admin/SearchSourceConfig.js`

**Purpose**: Allow admins to configure which search sources are enabled, their priority, and view cost/usage.

```javascript
// API endpoint: GET /api/search/sources
// Returns array of SearchSource objects

const SearchSourceConfig = () => {
  const [sources, setSources] = useState([]);
  
  return (
    <Box>
      <Typography variant="h5">Search Source Configuration</Typography>
      <Typography variant="body2" color="textSecondary">
        Configure which search providers are used for family finding. 
        Sources are searched in priority order.
      </Typography>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Enabled</TableCell>
              <TableCell>Source Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Cost/Search</TableCell>
              <TableCell>Terms of Service</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sources.map(source => (
              <TableRow key={source._id}>
                <TableCell>
                  <Switch 
                    checked={source.enabled}
                    onChange={() => toggleSource(source._id)}
                  />
                </TableCell>
                <TableCell>{source.name}</TableCell>
                <TableCell>
                  <Chip label={source.type} size="small" />
                </TableCell>
                <TableCell>
                  <TextField 
                    type="number"
                    value={source.priority}
                    onChange={(e) => updatePriority(source._id, e.target.value)}
                    size="small"
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>${source.costPerSearch?.toFixed(2) || 'Free'}</TableCell>
                <TableCell>
                  {source.termsUrl && (
                    <Link href={source.termsUrl} target="_blank">View Terms</Link>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => editSource(source._id)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
```

**Integration**: Add route `/admin/search-sources` and link from admin dashboard.

### 🆕 Step 2.7: Search Result Ranking with Explainability (NEW)

**File**: `src/components/Search/PersonSearchModal.js`

**Purpose**: Show users WHY each search result is ranked where it is, building trust in the system.

```javascript
// Add to each search result card:
const SearchResultCard = ({ result }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">{result.name}</Typography>
          <Chip 
            label={`${result.score}% match`} 
            color={result.score > 80 ? 'success' : 'default'}
          />
        </Box>
        
        {/* Basic info */}
        <Typography>{result.relationship}</Typography>
        <Typography color="textSecondary">{result.location}</Typography>
        
        {/* Ranking explanation */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">Why this ranking?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {result.rankingFactors.map((factor, idx) => (
                <ListItem key={idx}>
                  <ListItemIcon>
                    {factor.weight > 0.3 ? <CheckCircleIcon color="success" /> : <InfoIcon />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={factor.reason}
                    secondary={`Confidence: ${(factor.weight * 100).toFixed(0)}%`}
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="caption" color="textSecondary">
              Data sources: {result.sources.join(', ')}
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Button 
          variant="contained" 
          onClick={() => addToNetwork(result)}
          sx={{ mt: 2 }}
        >
          Add to Network
        </Button>
      </CardContent>
    </Card>
  );
};

// Ranking factors example:
const rankingFactors = [
  {
    reason: "Close biological relationship (sibling)",
    weight: 0.4
  },
  {
    reason: "Lives within 50 miles",
    weight: 0.25
  },
  {
    reason: "No criminal history found",
    weight: 0.2
  },
  {
    reason: "Active phone number verified",
    weight: 0.15
  }
];
```

### 🆕 Step 2.8: AI-Powered Duplicate Detection (NEW)

**New Component**: `src/components/DuplicateDetection/DuplicateAlert.js`
**New Service**: `src/services/duplicateDetectionService.js`

**Purpose**: Automatically detect potential duplicate network members and suggest merges.

```javascript
// API endpoint: GET /api/members/:id/duplicates
// Returns array of potential duplicates with similarity scores

const duplicateDetectionService = {
  async detectDuplicates(member) {
    // Fuzzy matching algorithm
    const similarityScore = (member1, member2) => {
      let score = 0;
      
      // Name similarity (Levenshtein distance)
      const nameSimilarity = calculateLevenshtein(
        member1.name.toLowerCase(),
        member2.name.toLowerCase()
      );
      score += nameSimilarity * 0.4;
      
      // Phone number exact match
      const phoneMatch = hasCommonPhone(member1.phones, member2.phones);
      if (phoneMatch) score += 0.3;
      
      // Email similarity
      const emailMatch = hasCommonEmail(member1.emails, member2.emails);
      if (emailMatch) score += 0.2;
      
      // Relationship to child
      if (member1.relationshipToChild === member2.relationshipToChild) {
        score += 0.1;
      }
      
      return score;
    };
    
    // Return members with score > 0.6 (60% similarity threshold)
    return potentialDuplicates.filter(d => d.score > 0.6);
  }
};

// UI Component
const DuplicateAlert = ({ member, duplicates }) => {
  if (!duplicates || duplicates.length === 0) return null;
  
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <AlertTitle>Potential Duplicate Detected</AlertTitle>
      <Typography variant="body2" sx={{ mb: 2 }}>
        This person may already exist in the network:
      </Typography>
      
      {duplicates.map(dup => (
        <Box key={dup._id} sx={{ mb: 2, p: 1, border: '1px solid #ff9800', borderRadius: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2">{dup.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {dup.phones?.join(', ')} • {dup.relationshipToChild}
              </Typography>
              <Chip 
                label={`${(dup.similarityScore * 100).toFixed(0)}% similar`}
                size="small"
                color="warning"
                sx={{ ml: 1 }}
              />
            </Box>
            <Box>
              <Button 
                size="small" 
                onClick={() => viewComparison(member, dup)}
              >
                Compare
              </Button>
              <Button 
                size="small" 
                variant="contained"
                onClick={() => mergeMember(member, dup)}
              >
                Merge
              </Button>
            </Box>
          </Box>
          
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Similarity factors: {dup.matchReasons.join(' • ')}
          </Typography>
        </Box>
      ))}
      
      <Button 
        size="small" 
        onClick={() => dismissDuplicates(member._id)}
      >
        Not a Duplicate
      </Button>
    </Alert>
  );
};
```

**Integration**: 
- Run duplicate check when creating/editing network members
- Show alert at top of NodeEditModal if duplicates detected
- Provide merge workflow with conflict resolution

### 🆕 Step 2.9: Contact Validation and Standardization (NEW)

**New Service**: `src/services/contactValidationService.js`

**Purpose**: Validate phone numbers, emails, and addresses; standardize formats.

```javascript
const contactValidationService = {
  // Phone validation
  async validatePhone(phone) {
    // Use libphonenumber-js or similar
    const parsed = parsePhoneNumber(phone, 'US');
    
    return {
      isValid: parsed?.isValid() || false,
      formatted: parsed?.formatNational() || phone,
      type: parsed?.getType(), // 'MOBILE', 'FIXED_LINE', etc.
      international: parsed?.formatInternational()
    };
  },
  
  // Email validation
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      normalized: email.toLowerCase().trim()
    };
  },
  
  // Address standardization (use USPS API or similar)
  async standardizeAddress(address) {
    // Call USPS address validation API
    const response = await fetch('/api/validate/address', {
      method: 'POST',
      body: JSON.stringify({ address })
    });
    
    const result = await response.json();
    
    return {
      isValid: result.valid,
      standardized: result.standardizedAddress,
      deliverable: result.deliverable,
      suggestions: result.suggestions || []
    };
  }
};

// UI Integration in NodeEditModal
const ContactFields = ({ member, onUpdate }) => {
  const [phoneValidation, setPhoneValidation] = useState({});
  const [emailValidation, setEmailValidation] = useState({});
  
  const validatePhoneField = async (phone) => {
    const result = await contactValidationService.validatePhone(phone);
    setPhoneValidation(prev => ({ ...prev, [phone]: result }));
    
    if (result.isValid && result.formatted !== phone) {
      // Offer to update to formatted version
      confirmFormatUpdate(phone, result.formatted);
    }
  };
  
  return (
    <>
      {member.phones?.map((phone, idx) => (
        <Box key={idx} display="flex" alignItems="center" gap={1}>
          <TextField 
            label="Phone"
            value={phone}
            onChange={(e) => updatePhone(idx, e.target.value)}
            onBlur={() => validatePhoneField(phone)}
          />
          {phoneValidation[phone]?.isValid ? (
            <CheckCircleIcon color="success" />
          ) : phoneValidation[phone]?.isValid === false ? (
            <Tooltip title="Invalid phone number format">
              <ErrorIcon color="error" />
            </Tooltip>
          ) : null}
          {phoneValidation[phone]?.type && (
            <Chip label={phoneValidation[phone].type} size="small" />
          )}
        </Box>
      ))}
      
      {/* Similar for emails and addresses */}
    </>
  );
};
```

**Testing Checkpoints (Phase 2):**
- [ ] All original Phase 2 features working
- [ ] 🆕 Search source configuration page accessible to admins
- [ ] 🆕 Search results show ranking explainability
- [ ] 🆕 Duplicate detection runs automatically on member creation
- [ ] 🆕 Merge workflow handles conflicts correctly
- [ ] 🆕 Phone/email/address validation works
- [ ] 🆕 Standardization suggestions appear in UI

---

## PHASE 3: Enhanced Node Management (🔧 ENHANCED)

**Goal**: Add bulk operations, filtering, and organization features for complex family networks.

### Step 3.1: Node Filtering/Visibility (✅ ORIGINAL)

Add filtering controls to toolbar.

### Step 3.2: Node Grouping/Categorization (✅ ORIGINAL)

Add ability to create visual groups.

### Step 3.3: Bulk Actions (✅ ORIGINAL)

Add multi-select capability.

### Step 3.4: Search History & Templates (✅ ORIGINAL)

Add ability to save search patterns.

### 🆕 Step 3.5: Email/SMS Webhook Integration (NEW)

**New Route**: `/api/webhooks/email` and `/api/webhooks/sms`
**New Service**: `src/services/webhookService.js`

**Purpose**: Automatically log contact events when emails or SMS messages are sent to network members.

```javascript
// Backend webhook handlers
app.post('/api/webhooks/email', async (req, res) => {
  const { from, to, subject, body, timestamp, messageId } = req.body;
  
  // Find network member by email
  const member = await NetworkMember.findOne({ 
    emails: to,
    // Also need childId - can be included in email metadata
  });
  
  if (!member) {
    return res.status(404).json({ error: 'Recipient not in network' });
  }
  
  // Create contact event
  await ContactEvent.create({
    childId: member.childId,
    memberId: member._id,
    type: 'email_sent',
    direction: 'outbound',
    summary: `Email: ${subject}`,
    at: timestamp,
    createdBy: 'system_webhook',
    metadata: {
      messageId,
      subject,
      preview: body.substring(0, 200)
    }
  });
  
  // Update lastContactAt on member
  await NetworkMember.updateOne(
    { _id: member._id },
    { lastContactAt: timestamp }
  );
  
  res.json({ success: true });
});

app.post('/api/webhooks/sms', async (req, res) => {
  const { from, to, body, timestamp } = req.body;
  
  // Similar logic for SMS
  // Find member by phone number
  // Create contact event
  // Update lastContactAt
});
```

**Integration Setup:**
1. Configure email provider (SendGrid, Mailgun, etc.) to send webhooks
2. Include child/case metadata in email headers for routing
3. Set up SMS provider webhooks (Twilio, etc.)
4. Add webhook authentication/verification

**UI Component**: Show auto-logged contacts with badge/icon:

```javascript
const ContactEventCard = ({ event }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1}>
          {event.createdBy === 'system_webhook' && (
            <Chip 
              label="Auto-logged" 
              size="small" 
              icon={<AutorenewIcon />}
              color="info"
            />
          )}
          <Typography variant="subtitle2">{event.type}</Typography>
        </Box>
        <Typography variant="body2">{event.summary}</Typography>
        <Typography variant="caption" color="textSecondary">
          {new Date(event.at).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};
```

### 🆕 Step 3.6: Contact Event Search and Filtering (NEW)

**New Component**: `src/components/ContactEvents/ContactEventSearch.js`

**Purpose**: Enable caseworkers to search through contact history across all network members.

```javascript
const ContactEventSearch = ({ childId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    member: 'all'
  });
  const [results, setResults] = useState([]);
  
  const handleSearch = async () => {
    const response = await fetch(
      `/api/contact-events/search?childId=${childId}&q=${searchQuery}&` +
      `type=${filters.type}&dateRange=${filters.dateRange}&member=${filters.member}`
    );
    const data = await response.json();
    setResults(data);
  };
  
  return (
    <Box>
      <Typography variant="h6">Search Contact History</Typography>
      
      <Box display="flex" gap={2} mb={2}>
        <TextField 
          label="Search"
          placeholder="Search notes, summaries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>
      
      <Box display="flex" gap={2} mb={3}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Contact Type</InputLabel>
          <Select 
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="phone_call">Phone Call</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="in_person">In-Person</MenuItem>
            <MenuItem value="sms">Text Message</MenuItem>
            <MenuItem value="home_visit">Home Visit</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Date Range</InputLabel>
          <Select 
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Network Member</InputLabel>
          <Select 
            value={filters.member}
            onChange={(e) => setFilters({...filters, member: e.target.value})}
          >
            <MenuItem value="all">All Members</MenuItem>
            {/* Populate with network members */}
          </Select>
        </FormControl>
      </Box>
      
      {/* Search Results */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          {results.length} results found
        </Typography>
        {results.map(event => (
          <ContactEventCard key={event._id} event={event} />
        ))}
      </Box>
      
      {/* Export search results */}
      <Button 
        startIcon={<DownloadIcon />}
        onClick={() => exportSearchResults(results)}
        sx={{ mt: 2 }}
      >
        Export Results
      </Button>
    </Box>
  );
};
```

**Backend API:**
```javascript
app.get('/api/contact-events/search', async (req, res) => {
  const { childId, q, type, dateRange, member } = req.query;
  
  let query = { childId };
  
  // Text search
  if (q) {
    query.$text = { $search: q };
  }
  
  // Type filter
  if (type && type !== 'all') {
    query.type = type;
  }
  
  // Date range
  if (dateRange && dateRange !== 'all') {
    const now = new Date();
    const daysAgo = {
      '7days': 7,
      '30days': 30,
      '90days': 90
    }[dateRange];
    
    if (daysAgo) {
      query.at = { 
        $gte: new Date(now - daysAgo * 24 * 60 * 60 * 1000) 
      };
    }
  }
  
  // Member filter
  if (member && member !== 'all') {
    query.memberId = member;
  }
  
  const events = await ContactEvent.find(query)
    .sort({ at: -1 })
    .limit(100)
    .populate('memberId', 'name relationshipToChild');
  
  res.json(events);
});
```

### 🆕 Step 3.7: Calendar Integration for Follow-ups (NEW)

**New Component**: `src/components/Calendar/FollowUpScheduler.js`
**New Collection**: `scheduled_followups`

**Purpose**: Schedule follow-up contacts and integrate with calendar systems.

```javascript
// Data model for scheduled follow-ups
{
  _id: string,
  childId: string,
  memberId: string,
  scheduledFor: Date,
  type: string, // 'phone_call', 'email', 'home_visit'
  purpose: string,
  notes: string,
  status: 'pending' | 'completed' | 'missed' | 'rescheduled',
  createdBy: string,
  createdAt: Date,
  completedAt: Date,
  reminderSent: boolean
}

// UI Component
const FollowUpScheduler = ({ childId, memberId, memberName }) => {
  const [followUp, setFollowUp] = useState({
    scheduledFor: '',
    type: 'phone_call',
    purpose: '',
    notes: ''
  });
  
  const scheduleFollowUp = async () => {
    await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...followUp,
        childId,
        memberId
      })
    });
    
    // Optionally add to external calendar
    if (calendarIntegrationEnabled) {
      addToGoogleCalendar(followUp);
    }
    
    showSuccess('Follow-up scheduled');
  };
  
  return (
    <Dialog open={true}>
      <DialogTitle>Schedule Follow-up with {memberName}</DialogTitle>
      <DialogContent>
        <TextField 
          label="Date & Time"
          type="datetime-local"
          value={followUp.scheduledFor}
          onChange={(e) => setFollowUp({...followUp, scheduledFor: e.target.value})}
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Contact Type</InputLabel>
          <Select 
            value={followUp.type}
            onChange={(e) => setFollowUp({...followUp, type: e.target.value})}
          >
            <MenuItem value="phone_call">Phone Call</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="home_visit">Home Visit</MenuItem>
            <MenuItem value="in_person">In-Person Meeting</MenuItem>
          </Select>
        </FormControl>
        
        <TextField 
          label="Purpose"
          value={followUp.purpose}
          onChange={(e) => setFollowUp({...followUp, purpose: e.target.value})}
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <TextField 
          label="Notes"
          value={followUp.notes}
          onChange={(e) => setFollowUp({...followUp, notes: e.target.value})}
          multiline
          rows={3}
          fullWidth
        />
        
        <FormControlLabel 
          control={<Checkbox />}
          label="Add to my calendar"
        />
        
        <FormControlLabel 
          control={<Checkbox defaultChecked />}
          label="Send me a reminder"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={scheduleFollowUp}>
          Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Calendar integration (Google Calendar example)
const addToGoogleCalendar = async (followUp) => {
  const event = {
    summary: `Follow-up: ${followUp.purpose}`,
    description: followUp.notes,
    start: {
      dateTime: new Date(followUp.scheduledFor).toISOString(),
      timeZone: 'America/Chicago'
    },
    end: {
      dateTime: new Date(new Date(followUp.scheduledFor).getTime() + 30 * 60000).toISOString(),
      timeZone: 'America/Chicago'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 }
      ]
    }
  };
  
  // Use Google Calendar API
  await gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });
};
```

**Dashboard Widget**: Show upcoming follow-ups

```javascript
const UpcomingFollowUps = ({ childId }) => {
  const [followUps, setFollowUps] = useState([]);
  
  useEffect(() => {
    fetchFollowUps();
  }, [childId]);
  
  return (
    <Card>
      <CardHeader title="Upcoming Follow-ups" />
      <CardContent>
        {followUps.length === 0 ? (
          <Typography color="textSecondary">No follow-ups scheduled</Typography>
        ) : (
          <List>
            {followUps.map(followUp => (
              <ListItem key={followUp._id}>
                <ListItemAvatar>
                  <Avatar>
                    {followUp.type === 'phone_call' && <PhoneIcon />}
                    {followUp.type === 'email' && <EmailIcon />}
                    {followUp.type === 'home_visit' && <HomeIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={followUp.memberName}
                  secondary={`${new Date(followUp.scheduledFor).toLocaleString()} • ${followUp.purpose}`}
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => completeFollowUp(followUp._id)}>
                    <CheckIcon />
                  </IconButton>
                  <IconButton onClick={() => rescheduleFollowUp(followUp._id)}>
                    <EventIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
```

### 🆕 Step 3.8: Audit Logging Middleware (NEW)

**New File**: `src/middleware/auditMiddleware.js`
**New Collection**: `audit_logs` (already in PRD data model)

**Purpose**: Automatically log all data modifications with before/after state.

```javascript
// Middleware to capture all mutations
const auditMiddleware = (req, res, next) => {
  // Only audit write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  // Capture original response.json method
  const originalJson = res.json.bind(res);
  
  // Override res.json to capture response data
  res.json = function(data) {
    // Log audit entry after successful response
    if (res.statusCode >= 200 && res.statusCode < 300) {
      createAuditLog({
        userId: req.user._id,
        userName: req.user.name,
        action: `${req.method} ${req.path}`,
        entityType: extractEntityType(req.path),
        entityId: extractEntityId(req.path, data),
        beforeState: req.beforeState, // Set by entity-specific middleware
        afterState: data,
        diff: calculateDiff(req.beforeState, data),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      });
    }
    
    return originalJson(data);
  };
  
  next();
};

// Entity-specific middleware to capture "before" state
const captureBeforeState = (Model) => async (req, res, next) => {
  if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const entityId = req.params.id;
    if (entityId) {
      req.beforeState = await Model.findById(entityId);
    }
  }
  next();
};

// Usage in routes
app.use(auditMiddleware);

app.patch('/api/members/:id', 
  captureBeforeState(NetworkMember),
  async (req, res) => {
    // Update logic
  }
);

// Diff calculation
const calculateDiff = (before, after) => {
  if (!before) return { created: after };
  
  const diff = {};
  
  // Compare each field
  Object.keys(after).forEach(key => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        old: before[key],
        new: after[key]
      };
    }
  });
  
  return diff;
};
```

### 🆕 Step 3.9: Audit Search and Filtering UI (NEW)

**New Component**: `src/components/Audit/AuditLogViewer.js`

**Purpose**: Allow users to search and filter audit logs.

```javascript
const AuditLogViewer = ({ entityType, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: 'all',
    user: 'all',
    dateRange: '30days'
  });
  
  useEffect(() => {
    fetchAuditLogs();
  }, [entityType, entityId, filters]);
  
  const fetchAuditLogs = async () => {
    const params = new URLSearchParams({
      entityType,
      entityId,
      ...filters
    });
    
    const response = await fetch(`/api/audit?${params}`);
    const data = await response.json();
    setLogs(data);
  };
  
  return (
    <Box>
      <Typography variant="h6">Audit Log</Typography>
      
      {/* Filters */}
      <Box display="flex" gap={2} mb={2}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Action</InputLabel>
          <Select value={filters.action} onChange={(e) => setFilters({...filters, action: e.target.value})}>
            <MenuItem value="all">All Actions</MenuItem>
            <MenuItem value="created">Created</MenuItem>
            <MenuItem value="updated">Updated</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Date Range</InputLabel>
          <Select value={filters.dateRange} onChange={(e) => setFilters({...filters, dateRange: e.target.value})}>
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Audit Log Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Changes</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log._id}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>{log.userName}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${Object.keys(log.diff).length} fields changed`}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => viewAuditDetails(log)}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Export audit log */}
      <Button 
        startIcon={<DownloadIcon />}
        onClick={() => exportAuditLog(entityType, entityId)}
        sx={{ mt: 2 }}
      >
        Export Audit Log
      </Button>
    </Box>
  );
};

// Audit details dialog
const AuditDetailsDialog = ({ log }) => {
  return (
    <Dialog open={true} maxWidth="md" fullWidth>
      <DialogTitle>Audit Log Details</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="subtitle2">User:</Typography>
          <Typography>{log.userName}</Typography>
        </Box>
        
        <Box mb={2}>
          <Typography variant="subtitle2">Action:</Typography>
          <Typography>{log.action}</Typography>
        </Box>
        
        <Box mb={2}>
          <Typography variant="subtitle2">Timestamp:</Typography>
          <Typography>{new Date(log.timestamp).toLocaleString()}</Typography>
        </Box>
        
        <Box mb={2}>
          <Typography variant="subtitle2">IP Address:</Typography>
          <Typography>{log.ipAddress}</Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Changes:</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                <TableCell>Old Value</TableCell>
                <TableCell>New Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(log.diff).map(([field, change]) => (
                <TableRow key={field}>
                  <TableCell><strong>{field}</strong></TableCell>
                  <TableCell>
                    <code>{JSON.stringify(change.old)}</code>
                  </TableCell>
                  <TableCell>
                    <code>{JSON.stringify(change.new)}</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
```

### 🆕 Step 3.10: User-Friendly Activity Timeline (NEW)

**New Component**: `src/components/Activity/ActivityTimeline.js`

**Purpose**: Provide a human-readable activity summary separate from technical audit logs.

```javascript
// This is different from audit logs - it's user-facing activity
const ActivityTimeline = ({ childId }) => {
  const [activities, setActivities] = useState([]);
  
  const fetchActivities = async () => {
    // This API aggregates from audit logs + contact events + other sources
    const response = await fetch(`/api/activity?childId=${childId}`);
    const data = await response.json();
    setActivities(data);
  };
  
  return (
    <Timeline>
      {activities.map(activity => (
        <TimelineItem key={activity._id}>
          <TimelineSeparator>
            <TimelineDot color={activity.type === 'contact' ? 'success' : 'primary'}>
              {getActivityIcon(activity.type)}
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2">{activity.title}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatRelativeTime(activity.timestamp)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {activity.description}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                by {activity.userName}
              </Typography>
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

// Activity aggregation on backend
app.get('/api/activity', async (req, res) => {
  const { childId } = req.query;
  
  // Aggregate from multiple sources
  const [auditLogs, contactEvents, searchHistory] = await Promise.all([
    AuditLog.find({ 
      entityType: { $in: ['NetworkMember', 'Relationship'] },
      'afterState.childId': childId 
    }).limit(50).sort({ timestamp: -1 }),
    
    ContactEvent.find({ childId }).limit(50).sort({ at: -1 }),
    
    SearchHistory.find({ childId }).limit(20).sort({ at: -1 })
  ]);
  
  // Transform into user-friendly activities
  const activities = [];
  
  // From audit logs
  auditLogs.forEach(log => {
    if (log.action.includes('POST')) {
      activities.push({
        _id: log._id,
        type: 'creation',
        title: `Added ${log.entityType}`,
        description: `${log.userName} added ${log.afterState.name} to the network`,
        timestamp: log.timestamp,
        userName: log.userName
      });
    } else if (log.action.includes('PATCH')) {
      activities.push({
        _id: log._id,
        type: 'update',
        title: `Updated ${log.entityType}`,
        description: `${log.userName} updated ${log.afterState.name}`,
        timestamp: log.timestamp,
        userName: log.userName
      });
    }
  });
  
  // From contact events
  contactEvents.forEach(event => {
    activities.push({
      _id: event._id,
      type: 'contact',
      title: formatContactType(event.type),
      description: `${event.summary} with ${event.memberName}`,
      timestamp: event.at,
      userName: event.createdBy
    });
  });
  
  // From search history
  searchHistory.forEach(search => {
    activities.push({
      _id: search._id,
      type: 'search',
      title: 'Searched for connections',
      description: `Found ${search.resultsCount} potential matches`,
      timestamp: search.at,
      userName: search.userName
    });
  });
  
  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json(activities);
});
```

**Testing Checkpoints (Phase 3):**
- [ ] All original Phase 3 features working
- [ ] 🆕 Email/SMS webhooks successfully create contact events
- [ ] 🆕 Contact event search returns accurate results
- [ ] 🆕 Calendar integration adds events to external calendar
- [ ] 🆕 Follow-up reminders sent on schedule
- [ ] 🆕 Audit logs capture all mutations with before/after state
- [ ] 🆕 Audit search UI allows filtering and export
- [ ] 🆕 Activity timeline provides user-friendly view

---

## PHASE 4: PDF Report Generation (✅ ORIGINAL)

**Goal**: Generate professional PDF reports with diagram and detailed node information.

**No changes to original Phase 4 - proceed as documented.**

**Testing Checkpoints:**
- [ ] Diagram renders clearly on page 1
- [ ] All node types grouped correctly
- [ ] Rich text notes preserved
- [ ] Network member badges show
- [ ] PDF downloads with correct filename
- [ ] Works with large diagrams (50+ nodes)

---

## 🆕 PHASE 5: Analytics & Reporting (NEW PHASE)

**Goal**: Provide dashboards, metrics, and export capabilities per RFP §4.5.2.5.

### 🆕 Step 5.1: Child Dashboard Implementation (NEW)

**New Component**: `src/components/Dashboard/ChildDashboard.js`

**Purpose**: Provide at-a-glance view of network health and activity for a single child.

```javascript
const ChildDashboard = ({ childId }) => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    fetchMetrics();
  }, [childId]);
  
  const fetchMetrics = async () => {
    const response = await fetch(`/api/analytics/child/${childId}`);
    const data = await response.json();
    setMetrics(data);
  };
  
  if (!metrics) return <CircularProgress />;
  
  return (
    <Grid container spacing={3}>
      {/* Network Health Index */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Network Health Index
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <GaugeChart 
                value={metrics.networkHealthScore}
                max={100}
                label="Network Health"
              />
            </Box>
            <Typography variant="body2" color="textSecondary" align="center">
              {getHealthDescription(metrics.networkHealthScore)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Key Metrics */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <MetricCard 
                  icon={<PeopleIcon />}
                  value={metrics.totalMembers}
                  label="Network Members"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <MetricCard 
                  icon={<CheckCircleIcon />}
                  value={metrics.activeMembersCount}
                  label="Active Members"
                  subtitle={`${metrics.activePercentage}%`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <MetricCard 
                  icon={<ContactsIcon />}
                  value={metrics.totalContacts}
                  label="Total Contacts"
                  subtitle="Last 30 days"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <MetricCard 
                  icon={<ScheduleIcon />}
                  value={metrics.avgDaysToFirstContact}
                  label="Avg Days to Contact"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Activity Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Contact Activity (Last 90 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.contactActivityByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="contacts" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Network Diversity */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Network Diversity
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={metrics.roleDistribution}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {metrics.roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Flags & Alerts */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Flags & Alerts
            </Typography>
            {metrics.flags.length === 0 ? (
              <Typography color="textSecondary">No flags at this time</Typography>
            ) : (
              <List>
                {metrics.flags.map(flag => (
                  <ListItem key={flag.id}>
                    <ListItemIcon>
                      {flag.severity === 'high' && <ErrorIcon color="error" />}
                      {flag.severity === 'medium' && <WarningIcon color="warning" />}
                      {flag.severity === 'low' && <InfoIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={flag.message}
                      secondary={flag.description}
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" onClick={() => addressFlag(flag)}>
                        Address
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Backend API
app.get('/api/analytics/child/:id', async (req, res) => {
  const childId = req.params.id;
  
  // Fetch all relevant data
  const [child, members, relationships, contacts] = await Promise.all([
    Child.findById(childId),
    NetworkMember.find({ childId }),
    Relationship.find({ childId }),
    ContactEvent.find({ childId })
  ]);
  
  // Calculate metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
  
  const activeMembersCount = members.filter(m => 
    m.lastContactAt && new Date(m.lastContactAt) > thirtyDaysAgo
  ).length;
  
  const recentContacts = contacts.filter(c => 
    new Date(c.at) > thirtyDaysAgo
  );
  
  // Calculate Network Health Index
  const networkHealthScore = calculateNetworkHealth(members, relationships, contacts);
  
  // Activity by week
  const contactActivityByWeek = calculateWeeklyActivity(contacts, 90);
  
  // Role distribution
  const roleDistribution = calculateRoleDistribution(members);
  
  // Generate flags
  const flags = generateFlags(members, contacts);
  
  res.json({
    networkHealthScore,
    totalMembers: members.length,
    activeMembersCount,
    activePercentage: Math.round((activeMembersCount / members.length) * 100),
    totalContacts: recentContacts.length,
    avgDaysToFirstContact: calculateAvgDaysToFirstContact(members, contacts),
    contactActivityByWeek,
    roleDistribution,
    flags
  });
});

// Network Health Index calculation
const calculateNetworkHealth = (members, relationships, contacts) => {
  let score = 0;
  
  // Active members (up to +10 points, 1 per active member)
  const activeMembersCount = members.filter(m => 
    m.lastContactAt && new Date(m.lastContactAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  score += Math.min(activeMembersCount, 10);
  
  // Role diversity (up to +5 points)
  const uniqueRoles = new Set(members.map(m => m.role).filter(Boolean));
  score += Math.min(uniqueRoles.size, 5);
  
  // Conflict penalty (up to -3 points)
  const conflictRelationships = relationships.filter(r => r.conflictFlag);
  score -= Math.min(conflictRelationships.length, 3);
  
  // Normalize to 0-100 scale
  const normalizedScore = Math.max(0, Math.min(100, (score / 12) * 100));
  
  return Math.round(normalizedScore);
};
```

### 🆕 Step 5.2: Supervisor Caseload Dashboard (NEW)

**New Component**: `src/components/Dashboard/SupervisorDashboard.js`

**Purpose**: Roll-up view of all cases for supervision and oversight.

```javascript
const SupervisorDashboard = ({ supervisorId }) => {
  const [caseload, setCaseload] = useState([]);
  const [summary, setSummary] = useState(null);
  
  useEffect(() => {
    fetchCaseload();
  }, [supervisorId]);
  
  const fetchCaseload = async () => {
    const response = await fetch(`/api/analytics/supervision?supervisorId=${supervisorId}`);
    const data = await response.json();
    setCaseload(data.cases);
    setSummary(data.summary);
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Supervisor Dashboard
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cases
              </Typography>
              <Typography variant="h3">{summary?.totalCases}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Network Health
              </Typography>
              <Typography variant="h3">{summary?.avgNetworkHealth}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cases Needing Attention
              </Typography>
              <Typography variant="h3" color="error">
                {summary?.casesNeedingAttention}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Network Members
              </Typography>
              <Typography variant="h3">{summary?.totalNetworkMembers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Caseload Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Caseload Overview</Typography>
            <Button 
              startIcon={<DownloadIcon />}
              onClick={exportCaseload}
            >
              Export
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Child Name</TableCell>
                  <TableCell>Caseworker</TableCell>
                  <TableCell>Network Health</TableCell>
                  <TableCell>Network Size</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {caseload.map(caseItem => (
                  <TableRow key={caseItem.childId}>
                    <TableCell>{caseItem.childName}</TableCell>
                    <TableCell>{caseItem.caseworkerName}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={caseItem.networkHealth}
                          sx={{ width: 100, height: 8, borderRadius: 4 }}
                          color={
                            caseItem.networkHealth > 70 ? 'success' :
                            caseItem.networkHealth > 40 ? 'warning' : 'error'
                          }
                        />
                        <Typography variant="body2">
                          {caseItem.networkHealth}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{caseItem.networkSize}</TableCell>
                    <TableCell>
                      {formatRelativeTime(caseItem.lastActivity)}
                    </TableCell>
                    <TableCell>
                      {caseItem.flags.length > 0 ? (
                        <Chip 
                          label={`${caseItem.flags.length} flag${caseItem.flags.length > 1 ? 's' : ''}`}
                          size="small"
                          color="warning"
                        />
                      ) : (
                        <Chip label="None" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small"
                        onClick={() => viewCase(caseItem.childId)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
```

### 🆕 Step 5.3: Reasonable Efforts Report Generator (NEW)

**New Component**: `src/components/Reports/ReasonableEffortsReport.js`

**Purpose**: Generate court-ready documentation of family finding efforts.

```javascript
const ReasonableEffortsReport = ({ childId }) => {
  const [reportData, setReportData] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  const generateReport = async () => {
    setGenerating(true);
    
    const response = await fetch(`/api/analytics/reasonable-efforts/${childId}`);
    const data = await response.json();
    setReportData(data);
    
    setGenerating(false);
  };
  
  const downloadReport = async () => {
    // Generate PDF or Word document
    const doc = generateReasonableEffortsDocument(reportData);
    doc.save(`reasonable-efforts-${childId}-${new Date().toISOString()}.pdf`);
  };
  
  if (!reportData) {
    return (
      <Button 
        variant="contained"
        onClick={generateReport}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate Reasonable Efforts Report'}
      </Button>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Reasonable Efforts Report</Typography>
        <Button 
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadReport}
        >
          Download PDF
        </Button>
      </Box>
      
      {/* Report Preview */}
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Reasonable Efforts to Identify and Engage Family Network
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Child: {reportData.childName} | Case: {reportData.caseNumber} | Generated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
        
        {/* Search Efforts */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            1. Search Efforts
          </Typography>
          <Typography variant="body2" paragraph>
            The agency conducted comprehensive searches to identify potential family connections:
          </Typography>
          <ul>
            {reportData.searchEfforts.map((effort, idx) => (
              <li key={idx}>
                <Typography variant="body2">
                  <strong>{effort.source}:</strong> Searched on {new Date(effort.date).toLocaleDateString()}, 
                  yielding {effort.resultsCount} potential connections
                </Typography>
              </li>
            ))}
          </ul>
          <Typography variant="body2">
            <strong>Total searches conducted:</strong> {reportData.searchEfforts.length}
          </Typography>
        </Box>
        
        {/* Identified Network */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            2. Identified Network Members
          </Typography>
          <Typography variant="body2" paragraph>
            Through these efforts, the agency identified {reportData.totalMembers} individuals 
            in the child's network:
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>First Contact</TableCell>
                  <TableCell>Total Contacts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.members.map(member => (
                  <TableRow key={member._id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.relationshipToChild}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.firstContactDate ? new Date(member.firstContactDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{member.contactCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {/* Contact Efforts */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            3. Contact and Engagement Efforts
          </Typography>
          <Typography variant="body2" paragraph>
            The agency made {reportData.totalContacts} contacts with network members 
            over the past {reportData.daysCovered} days:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Contact Methods</Typography>
                <List dense>
                  {reportData.contactsByType.map(type => (
                    <ListItem key={type.type}>
                      <ListItemText 
                        primary={type.type}
                        secondary={`${type.count} contacts`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Engagement Summary</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Average days to first contact"
                      secondary={`${reportData.avgDaysToFirstContact} days`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Members engaged"
                      secondary={`${reportData.engagedMembers}/${reportData.totalMembers} (${reportData.engagementRate}%)`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Active relationships"
                      secondary={`${reportData.activeRelationships}`}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Outcomes */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            4. Outcomes and Next Steps
          </Typography>
          <Typography variant="body2" paragraph>
            {reportData.outcomes}
          </Typography>
        </Box>
        
        {/* Barriers */}
        {reportData.barriers.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              5. Barriers Encountered
            </Typography>
            <ul>
              {reportData.barriers.map((barrier, idx) => (
                <li key={idx}>
                  <Typography variant="body2">{barrier}</Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}
        
        {/* Signature */}
        <Box mt={4} pt={2} borderTop="1px solid #ccc">
          <Typography variant="body2">
            Prepared by: {reportData.preparedBy}
          </Typography>
          <Typography variant="body2">
            Date: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

// Backend API
app.get('/api/analytics/reasonable-efforts/:childId', async (req, res) => {
  const childId = req.params.childId;
  
  // Gather all data
  const [child, members, contacts, searches] = await Promise.all([
    Child.findById(childId),
    NetworkMember.find({ childId }),
    ContactEvent.find({ childId }),
    SearchHistory.find({ childId })
  ]);
  
  // Calculate metrics
  const totalContacts = contacts.length;
  const engagedMembers = members.filter(m => m.lastContactAt).length;
  const avgDaysToFirstContact = calculateAvgDaysToFirstContact(members, contacts);
  
  // Contact types breakdown
  const contactsByType = contacts.reduce((acc, contact) => {
    acc[contact.type] = (acc[contact.type] || 0) + 1;
    return acc;
  }, {});
  
  // Search efforts summary
  const searchEfforts = searches.map(search => ({
    source: search.source,
    date: search.at,
    resultsCount: search.resultsCount
  }));
  
  // Generate narrative
  const outcomes = generateOutcomesNarrative(members, contacts);
  const barriers = identifyBarriers(members, contacts);
  
  res.json({
    childName: `${child.firstName} ${child.lastName}`,
    caseNumber: child.caseId,
    totalMembers: members.length,
    members: members.map(m => ({
      _id: m._id,
      name: m.name,
      relationshipToChild: m.relationshipToChild,
      role: m.role,
      firstContactDate: contacts.find(c => c.memberId === m._id)?.at,
      contactCount: contacts.filter(c => c.memberId === m._id).length
    })),
    searchEfforts,
    totalContacts,
    daysCovered: 90, // Or calculate dynamically
    contactsByType: Object.entries(contactsByType).map(([type, count]) => ({ type, count })),
    avgDaysToFirstContact,
    engagedMembers,
    engagementRate: Math.round((engagedMembers / members.length) * 100),
    activeRelationships: members.filter(m => 
      m.lastContactAt && new Date(m.lastContactAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    outcomes,
    barriers,
    preparedBy: req.user.name
  });
});
```

### 🆕 Step 5.4: Predictive Placement Scoring (NEW)

**New Component**: `src/components/Analytics/PlacementScoring.js`
**New Service**: `src/services/mlService.js`

**Purpose**: Use ML to predict likelihood of successful placement with each network member.

```javascript
// This is a simplified ML scoring system
// In production, you'd use a proper ML model trained on historical data

const mlService = {
  async calculatePlacementScore(member, child, relationships) {
    let score = 0;
    const factors = [];
    
    // Relationship type (biological family scores higher)
    const biologicalRelationships = ['parent', 'sibling', 'grandparent', 'aunt', 'uncle'];
    if (biologicalRelationships.includes(member.relationshipToChild?.toLowerCase())) {
      score += 30;
      factors.push({ factor: 'Close biological relationship', weight: 30 });
    } else {
      score += 10;
      factors.push({ factor: 'Non-biological relationship', weight: 10 });
    }
    
    // Contact frequency
    const contactCount = await ContactEvent.countDocuments({ memberId: member._id });
    if (contactCount > 10) {
      score += 20;
      factors.push({ factor: 'Frequent contact history', weight: 20 });
    } else if (contactCount > 5) {
      score += 10;
      factors.push({ factor: 'Moderate contact history', weight: 10 });
    } else {
      factors.push({ factor: 'Limited contact history', weight: 0 });
    }
    
    // Recency of contact
    const daysSinceContact = getDaysSinceLastContact(member);
    if (daysSinceContact < 30) {
      score += 15;
      factors.push({ factor: 'Recent contact (< 30 days)', weight: 15 });
    } else if (daysSinceContact < 90) {
      score += 7;
      factors.push({ factor: 'Somewhat recent contact (< 90 days)', weight: 7 });
    } else {
      factors.push({ factor: 'No recent contact', weight: 0 });
    }
    
    // Commitment level
    if (member.commitmentLevel === 'high') {
      score += 20;
      factors.push({ factor: 'High commitment level', weight: 20 });
    } else if (member.commitmentLevel === 'medium') {
      score += 10;
      factors.push({ factor: 'Medium commitment level', weight: 10 });
    }
    
    // Child comfort
    if (member.childComfort === 'high') {
      score += 15;
      factors.push({ factor: 'Child reports high comfort', weight: 15 });
    } else if (member.childComfort === 'medium') {
      score += 7;
      factors.push({ factor: 'Child reports medium comfort', weight: 7 });
    }
    
    // Geographic proximity (if address data available)
    // This would require geocoding
    
    // Conflicts
    const hasConflicts = await Relationship.findOne({
      $or: [
        { memberIdA: member._id, conflictFlag: true },
        { memberIdB: member._id, conflictFlag: true }
      ]
    });
    
    if (hasConflicts) {
      score -= 10;
      factors.push({ factor: 'Has conflict relationships', weight: -10 });
    }
    
    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      factors,
      recommendation: getRecommendation(score)
    };
  }
};

const getRecommendation = (score) => {
  if (score >= 70) return 'Strong candidate for placement';
  if (score >= 50) return 'Potential placement option, further assessment needed';
  if (score >= 30) return 'Possible option with significant support';
  return 'Not recommended at this time';
};

// UI Component
const PlacementScoring = ({ childId }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    calculateScores();
  }, [childId]);
  
  const calculateScores = async () => {
    setLoading(true);
    const response = await fetch(`/api/analytics/predictive-placement/${childId}`);
    const data = await response.json();
    setScores(data);
    setLoading(false);
  };
  
  if (loading) return <CircularProgress />;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Placement Likelihood Analysis
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        AI-powered analysis of placement potential based on relationship strength, 
        contact history, and other factors.
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Network Member</TableCell>
              <TableCell>Relationship</TableCell>
              <TableCell>Placement Score</TableCell>
              <TableCell>Recommendation</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scores.map(item => (
              <TableRow key={item.memberId}>
                <TableCell>{item.memberName}</TableCell>
                <TableCell>{item.relationshipToChild}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress 
                      variant="determinate"
                      value={item.score}
                      sx={{ width: 100, height: 8, borderRadius: 4 }}
                      color={
                        item.score >= 70 ? 'success' :
                        item.score >= 50 ? 'warning' : 'error'
                      }
                    />
                    <Typography variant="body2">{item.score}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.recommendation}
                    size="small"
                    color={
                      item.score >= 70 ? 'success' :
                      item.score >= 50 ? 'warning' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => viewFactors(item)}>
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>About Placement Scoring</AlertTitle>
        This analysis is a decision-support tool and should not replace professional judgment. 
        Scores are based on data available in the system and may not reflect all relevant factors.
      </Alert>
    </Box>
  );
};
```

### 🆕 Step 5.5: Export Functionality (CSV/XLSX/JSON) (NEW)

**New Service**: `src/services/exportService.js`

**Purpose**: Allow users to export network data in multiple formats.

```javascript
const exportService = {
  async exportToCSV(childId) {
    const data = await fetchNetworkData(childId);
    
    // Convert to CSV format
    const csv = Papa.unparse({
      fields: ['Name', 'Relationship', 'Role', 'Phone', 'Email', 'Last Contact', 'Status'],
      data: data.members.map(m => [
        m.name,
        m.relationshipToChild,
        m.role,
        m.phones?.join('; '),
        m.emails?.join('; '),
        m.lastContactAt ? new Date(m.lastContactAt).toLocaleDateString() : 'Never',
        m.status
      ])
    });
    
    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-${childId}-${Date.now()}.csv`;
    a.click();
  },
  
  async exportToExcel(childId) {
    const data = await fetchNetworkData(childId);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Members sheet
    const membersWS = XLSX.utils.json_to_sheet(
      data.members.map(m => ({
        'Name': m.name,
        'Relationship': m.relationshipToChild,
        'Role': m.role,
        'Phone': m.phones?.join('; '),
        'Email': m.emails?.join('; '),
        'Address': m.addresses?.join('; '),
        'Last Contact': m.lastContactAt,
        'Commitment Level': m.commitmentLevel,
        'Child Comfort': m.childComfort,
        'Status': m.status
      }))
    );
    XLSX.utils.book_append_sheet(wb, membersWS, 'Network Members');
    
    // Contacts sheet
    const contactsWS = XLSX.utils.json_to_sheet(
      data.contacts.map(c => ({
        'Date': c.at,
        'Member': c.memberName,
        'Type': c.type,
        'Summary': c.summary,
        'Outcome': c.outcome,
        'Created By': c.createdBy
      }))
    );
    XLSX.utils.book_append_sheet(wb, contactsWS, 'Contact Log');
    
    // Relationships sheet
    const relationshipsWS = XLSX.utils.json_to_sheet(
      data.relationships.map(r => ({
        'Member A': r.memberAName,
        'Member B': r.memberBName,
        'Relationship Type': r.type,
        'Strength': r.strength,
        'Conflict': r.conflictFlag ? 'Yes' : 'No'
      }))
    );
    XLSX.utils.book_append_sheet(wb, relationshipsWS, 'Relationships');
    
    // Write file
    XLSX.writeFile(wb, `network-${childId}-${Date.now()}.xlsx`);
  },
  
  async exportToJSON(childId) {
    const data = await fetchNetworkData(childId);
    
    const json = JSON.stringify(data, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-${childId}-${Date.now()}.json`;
    a.click();
  }
};

// UI Component
const ExportMenu = ({ childId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  return (
    <>
      <Button 
        startIcon={<DownloadIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Export
      </Button>
      <Menu 
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          exportService.exportToCSV(childId);
          setAnchorEl(null);
        }}>
          <ListItemIcon><InsertDriveFileIcon /></ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          exportService.exportToExcel(childId);
          setAnchorEl(null);
        }}>
          <ListItemIcon><GridOnIcon /></ListItemIcon>
          <ListItemText>Export as Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          exportService.exportToJSON(childId);
          setAnchorEl(null);
        }}>
          <ListItemIcon><CodeIcon /></ListItemIcon>
          <ListItemText>Export as JSON</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
```

**Testing Checkpoints (Phase 5):**
- [ ] 🆕 Child dashboard shows accurate Network Health Index
- [ ] 🆕 All metrics calculate correctly
- [ ] 🆕 Supervisor dashboard displays caseload accurately
- [ ] 🆕 Reasonable efforts report generates complete documentation
- [ ] 🆕 Predictive placement scoring provides actionable insights
- [ ] 🆕 CSV export includes all relevant data
- [ ] 🆕 Excel export creates multiple sheets correctly
- [ ] 🆕 JSON export maintains data structure

---

## 🆕 PHASE 6: Mobile Optimization (NEW PHASE)

**Goal**: Field-ready mobile experience with offline capability per RFP §4.5.2.7.

### 🆕 Step 6.1: Mobile Responsive Testing and Optimization (NEW)

**Purpose**: Ensure all features work smoothly on mobile devices.

```javascript
// Add responsive breakpoints throughout the app
import { useMediaQuery, useTheme } from '@mui/material';

const ResponsiveComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box>
      {isMobile ? (
        <MobileLayout />
      ) : isTablet ? (
        <TabletLayout />
      ) : (
        <DesktopLayout />
      )}
    </Box>
  );
};

// Mobile-specific navigation
const MobileNav = () => {
  return (
    <BottomNavigation>
      <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} />
      <BottomNavigationAction label="Network" icon={<AccountTreeIcon />} />
      <BottomNavigationAction label="Contacts" icon={<ContactsIcon />} />
      <BottomNavigationAction label="Search" icon={<SearchIcon />} />
    </BottomNavigation>
  );
};

// Touch-optimized genogram interactions
const MobileGenogramCanvas = () => {
  const handleTouch = (e) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - drag
      handleDrag(e.touches[0]);
    } else if (e.touches.length === 2) {
      // Pinch zoom
      handlePinchZoom(e.touches);
    }
  };
  
  return (
    <svg 
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouch}
      style={{ touchAction: 'none' }}
    >
      {/* Genogram content */}
    </svg>
  );
};
```

**Testing checklist:**
- [ ] All pages render correctly on mobile (375px width)
- [ ] Touch targets are at least 44x44px
- [ ] Forms are usable with mobile keyboards
- [ ] Genogram canvas supports touch gestures (pan, pinch-zoom)
- [ ] Tables scroll horizontally on mobile
- [ ] Modals/dialogs fit mobile screens
- [ ] No horizontal scrolling on any page

### 🆕 Step 6.2: PWA Implementation for Offline Capability (NEW)

**Purpose**: Enable offline data entry and sync when connection returns.

**Files to create:**
- `public/manifest.json`
- `public/service-worker.js`
- `src/utils/offlineQueue.js`

```javascript
// manifest.json
{
  "short_name": "Family Finder",
  "name": "SafeGenerations Family Finder",
  "icons": [
    {
      "src": "/icon-192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#ffffff"
}

// service-worker.js
const CACHE_NAME = 'family-finder-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// offlineQueue.js - Queue offline actions for sync
class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
  }
  
  loadQueue() {
    const stored = localStorage.getItem('offline_queue');
    return stored ? JSON.parse(stored) : [];
  }
  
  saveQueue() {
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }
  
  add(action) {
    this.queue.push({
      id: Date.now(),
      action,
      timestamp: new Date().toISOString()
    });
    this.saveQueue();
  }
  
  async sync() {
    if (!navigator.onLine) return;
    
    const queue = [...this.queue];
    this.queue = [];
    this.saveQueue();
    
    for (const item of queue) {
      try {
        await this.executeAction(item.action);
      } catch (error) {
        console.error('Failed to sync action:', item, error);
        // Re-queue failed actions
        this.queue.push(item);
      }
    }
    
    this.saveQueue();
  }
  
  async executeAction(action) {
    // Execute the API call that was queued
    return fetch(action.url, {
      method: action.method,
      headers: action.headers,
      body: action.body
    });
  }
}

export const offlineQueue = new OfflineQueue();

// Hook for components
export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(offlineQueue.queue.length);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineQueue.sync().then(() => {
        setQueueSize(offlineQueue.queue.length);
      });
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline, queueSize };
};

// UI indicator
const OfflineIndicator = () => {
  const { isOnline, queueSize } = useOfflineQueue();
  
  if (isOnline && queueSize === 0) return null;
  
  return (
    <Alert severity={isOnline ? "info" : "warning"}>
      {isOnline ? (
        `Syncing ${queueSize} queued action${queueSize > 1 ? 's' : ''}...`
      ) : (
        "You're offline. Changes will be saved and synced when connection returns."
      )}
    </Alert>
  );
};
```

### 🆕 Step 6.3: Mobile-Specific Features (NEW)

**6.3a: Photo Capture for Documentation**

```javascript
const PhotoCapture = ({ onPhotoCapture }) => {
  const inputRef = useRef(null);
  
  const handleCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Compress image
    const compressed = await compressImage(file);
    
    // Convert to base64 for storage
    const base64 = await fileToBase64(compressed);
    
    onPhotoCapture({
      data: base64,
      filename: file.name,
      timestamp: new Date().toISOString()
    });
  };
  
  return (
    <>
      <input 
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleCapture}
      />
      <Button 
        variant="contained"
        startIcon={<CameraIcon />}
        onClick={() => inputRef.current.click()}
      >
        Take Photo
      </Button>
    </>
  );
};

// Usage in contact logging
const MobileContactLog = ({ memberId }) => {
  const [photos, setPhotos] = useState([]);
  
  return (
    <Box>
      <TextField label="Contact Notes" multiline rows={4} fullWidth />
      
      <PhotoCapture onPhotoCapture={(photo) => setPhotos([...photos, photo])} />
      
      <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
        {photos.map((photo, idx) => (
          <img 
            key={idx}
            src={photo.data}
            alt={`Photo ${idx + 1}`}
            style={{ width: 100, height: 100, objectFit: 'cover' }}
          />
        ))}
      </Box>
    </Box>
  );
};
```

**6.3b: GPS Tagging for Visit Logging**

```javascript
const GPSTagging = ({ onLocationCapture }) => {
  const [loading, setLoading] = useState(false);
  
  const captureLocation = () => {
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationCapture({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        });
        setLoading(false);
      },
      (error) => {
        console.error('GPS error:', error);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };
  
  return (
    <Button 
      variant="outlined"
      startIcon={loading ? <CircularProgress size={20} /> : <LocationOnIcon />}
      onClick={captureLocation}
      disabled={loading}
    >
      {loading ? 'Getting Location...' : 'Tag Location'}
    </Button>
  );
};

// Integrate with contact logging
const MobileHomeVisitLog = () => {
  const [location, setLocation] = useState(null);
  
  return (
    <Box>
      <Typography variant="h6">Log Home Visit</Typography>
      
      <TextField label="Visit Notes" multiline rows={4} fullWidth sx={{ mb: 2 }} />
      
      <GPSTagging onLocationCapture={setLocation} />
      
      {location && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Location recorded: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Alert>
      )}
      
      <Button variant="contained" fullWidth sx={{ mt: 2 }}>
        Save Visit
      </Button>
    </Box>
  );
};
```

**6.3c: QR Code Generation for Family Self-Service**

```javascript
import QRCode from 'qrcode.react';

const FamilySelfServiceQR = ({ memberId }) => {
  const [qrUrl, setQrUrl] = useState('');
  
  useEffect(() => {
    generateQRCode();
  }, [memberId]);
  
  const generateQRCode = async () => {
    // Create a unique, time-limited token
    const response = await fetch('/api/members/generate-self-service-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId })
    });
    
    const { token } = await response.json();
    
    // Create URL for self-service portal
    const url = `${window.location.origin}/self-service?token=${token}`;
    setQrUrl(url);
  };
  
  return (
    <Dialog open={true}>
      <DialogTitle>Family Self-Service Portal</DialogTitle>
      <DialogContent>
        <Typography variant="body2" paragraph>
          Scan this QR code to allow the family member to update their own information:
        </Typography>
        
        <Box display="flex" justifyContent="center" mb={2}>
          <QRCode value={qrUrl} size={256} />
        </Box>
        
        <Typography variant="caption" color="textSecondary">
          This link expires in 24 hours for security.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2">
          Or share this link:
        </Typography>
        <TextField 
          value={qrUrl}
          fullWidth
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => navigator.clipboard.writeText(qrUrl)}>
                  <ContentCopyIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Self-service portal page
const SelfServicePortal = () => {
  const [token] = useState(new URLSearchParams(window.location.search).get('token'));
  const [member, setMember] = useState(null);
  
  useEffect(() => {
    validateToken();
  }, [token]);
  
  const validateToken = async () => {
    const response = await fetch(`/api/self-service/validate?token=${token}`);
    if (response.ok) {
      const data = await response.json();
      setMember(data.member);
    }
  };
  
  const handleSubmit = async (updates) => {
    await fetch('/api/self-service/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, updates })
    });
    
    alert('Thank you! Your information has been updated.');
  };
  
  if (!member) return <CircularProgress />;
  
  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Update Your Information
      </Typography>
      <Typography variant="body2" paragraph>
        Please review and update your contact information below:
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <TextField 
          label="Phone Number"
          defaultValue={member.phones?.[0]}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField 
          label="Email"
          defaultValue={member.emails?.[0]}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField 
          label="Address"
          defaultValue={member.addresses?.[0]}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />
        
        <Button type="submit" variant="contained" fullWidth>
          Update Information
        </Button>
      </Box>
    </Container>
  );
};
```

**Testing Checkpoints (Phase 6):**
- [ ] 🆕 App installs as PWA on mobile devices
- [ ] 🆕 Offline mode queues actions successfully
- [ ] 🆕 Actions sync when connection returns
- [ ] 🆕 Photo capture works on iOS and Android
- [ ] 🆕 GPS tagging accurate within 10 meters
- [ ] 🆕 QR code generates and validates correctly
- [ ] 🆕 Self-service portal accessible without login
- [ ] 🆕 All touch interactions feel responsive

---

## 🆕 PHASE 7: Documentation & Training (NEW PHASE)

**Goal**: Deliver all required RFP §4.6 documentation and training materials.

### 🆕 Step 7.1: OpenAPI/Swagger Documentation (NEW)

**File**: `swagger.yaml` or auto-generated

```yaml
openapi: 3.0.0
info:
  title: SafeGenerations Family Finder API
  version: 1.0.0
  description: RESTful API for family finding and network mapping
  
servers:
  - url: https://api.safegenerations.com/v1
    description: Production server
  - url: https://api-staging.safegenerations.com/v1
    description: Staging server

paths:
  /children/{childId}:
    get:
      summary: Get child profile
      tags: [Children]
      parameters:
        - name: childId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Child'
  
  /network/{childId}:
    get:
      summary: Get network graph
      tags: [Network]
      parameters:
        - name: childId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Network data
          content:
            application/json:
              schema:
                type: object
                properties:
                  members:
                    type: array
                    items:
                      $ref: '#/components/schemas/NetworkMember'
                  relationships:
                    type: array
                    items:
                      $ref: '#/components/schemas/Relationship'
  
  # ... Continue for all endpoints

components:
  schemas:
    Child:
      type: object
      properties:
        _id:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        # ... etc
    
    NetworkMember:
      type: object
      properties:
        _id:
          type: string
        name:
          type: string
        relationshipToChild:
          type: string
        # ... etc
  
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

**Auto-generate with:**
```javascript
// Use swagger-jsdoc
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Family Finder API',
      version: '1.0.0',
    },
  },
  apis: ['./routes/*.js'], // Path to API route files
};

const swaggerSpec = swaggerJsdoc(options);
```

### 🆕 Step 7.2-7.5: User Guides (NEW)

Create comprehensive guides for each user role.

**Files to create:**
- `docs/caseworker-guide.md`
- `docs/supervisor-guide.md`
- `docs/admin-guide.md`
- `docs/api-integration-guide.md`

**Example structure (Caseworker Guide):**

```markdown
# Family Finder Caseworker Guide

## Table of Contents
1. Getting Started
2. Viewing the Network
3. Adding Network Members
4. Searching for Connections
5. Logging Contacts
6. Generating Reports
7. Mobile Usage
8. Troubleshooting

## 1. Getting Started

### Logging In
1. Navigate to [app URL]
2. Click "Sign In with SSO"
3. Enter your agency credentials
...

## 2. Viewing the Network

### Understanding the Genogram
The genogram shows the child's family network as a visual map...

[Include screenshots]

### Activity Color Coding
- 🟢 Green: Contact within 30 days
- 🟡 Yellow: Contact 30-60 days ago
- 🟠 Orange: Contact 60-90 days ago
- 🔴 Red: No contact in 90+ days

...
```

### 🆕 Step 7.6: Interactive In-App Tutorials (NEW)

**New Component**: `src/components/Tutorial/InteractiveTutorial.js`

```javascript
import Joyride from 'react-joyride';

const tutorialSteps = [
  {
    target: '.genogram-canvas',
    content: 'This is the network map. It shows all family connections for this child.',
    disableBeacon: true,
  },
  {
    target: '.quick-add-button',
    content: 'Click here to quickly add a new family member or resource.',
  },
  {
    target: '.activity-filter',
    content: 'Use these filters to focus on active or inactive network members.',
  },
  {
    target: '.search-button',
    content: 'Search for potential family connections using multiple data sources.',
  },
  {
    target: '.export-button',
    content: 'Export your network data or generate reports for court.',
  }
];

const InteractiveTutorial = () => {
  const [runTutorial, setRunTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(
    localStorage.getItem('tutorial_completed') === 'true'
  );
  
  useEffect(() => {
    if (!hasSeenTutorial) {
      // Auto-start tutorial for new users after 2 seconds
      setTimeout(() => setRunTutorial(true), 2000);
    }
  }, [hasSeenTutorial]);
  
  const handleTutorialCallback = (data) => {
    const { status } = data;
    
    if (status === 'finished' || status === 'skipped') {
      setRunTutorial(false);
      localStorage.setItem('tutorial_completed', 'true');
      setHasSeenTutorial(true);
    }
  };
  
  return (
    <>
      {/* Help button to restart tutorial */}
      <IconButton 
        onClick={() => setRunTutorial(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <HelpOutlineIcon />
      </IconButton>
      
      <Joyride
        steps={tutorialSteps}
        run={runTutorial}
        continuous
        showSkipButton
        callback={handleTutorialCallback}
        styles={{
          options: {
            primaryColor: '#1976d2',
            zIndex: 10000,
          }
        }}
      />
    </>
  );
};
```

### 🆕 Step 7.7: Training Video Scripts (NEW)

**File**: `docs/training-videos/video-scripts.md`

Create scripts for 5-10 training videos:

1. **Getting Started (5 min)**
   - Login and navigation
   - Dashboard overview
   - Basic concepts
   
2. **Creating a Genogram (8 min)**
   - Adding family members
   - Creating relationships
   - Understanding symbols and colors
   
3. **Family Finding Workflows (10 min)**
   - Searching for connections
   - Evaluating search results
   - Adding potential connections
   - Confirming connections
   
4. **Contact Logging (6 min)**
   - Manual contact entry
   - Auto-logging via email/SMS
   - Scheduling follow-ups
   - Viewing contact history
   
5. **Generating Reports (7 min)**
   - PDF genogram reports
   - Reasonable efforts reports
   - Exporting data (CSV/Excel)
   
6. **Supervision Features (9 min)** (FOR SUPERVISORS)
   - Supervisor dashboard
   - Setting priorities
   - Reviewing caseload
   - Using flags and alerts
   
7. **Mobile Usage (5 min)**
   - Installing PWA
   - Field data entry
   - Photo capture
   - Offline mode
   
8. **Advanced Features (8 min)**
   - Network health analytics
   - Predictive placement scoring
   - Audit logs
   - Search source configuration

### 🆕 Step 7.8: Testing Plan Documentation (NEW)

**File**: `docs/testing-plan.md`

```markdown
# Family Finder Testing Plan

## 1. Testing Strategy

### Test Coverage Goals
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Load testing with 1000+ concurrent users
- **Security Tests**: OWASP Top 10

## 2. Unit Testing

### Tools
- Jest for JavaScript/React
- React Testing Library for component tests

### Coverage Requirements
| Category | Target Coverage |
|----------|----------------|
| Services | 90% |
| Components | 80% |
| Utils | 95% |
| API Routes | 85% |

### Example Tests
```javascript
describe('NetworkMember', () => {
  it('should create a new network member', async () => {
    const member = await NetworkMember.create({
      childId: 'test-child-1',
      name: 'John Doe',
      relationshipToChild: 'uncle'
    });
    
    expect(member._id).toBeDefined();
    expect(member.name).toBe('John Doe');
  });
  
  it('should calculate days since last contact', () => {
    const member = {
      lastContactAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    };
    
    const days = getDaysSinceLastContact(member);
    expect(days).toBe(45);
  });
});
```

## 3. E2E Testing

### Tools
- Cypress for end-to-end tests

### Critical Workflows to Test
1. User login and authentication
2. Create a new child case
3. Add network members
4. Search for connections
5. Log a contact
6. Generate PDF report
7. Export data
8. Supervisor dashboard view

### Example Cypress Test
```javascript
describe('Family Finding Workflow', () => {
  beforeEach(() => {
    cy.login('caseworker@test.com', 'password');
    cy.visit('/child/test-child-1/family-finder');
  });
  
  it('should search and add a network member', () => {
    // Open search
    cy.get('[data-testid="search-button"]').click();
    
    // Enter search query
    cy.get('[data-testid="search-input"]').type('Jane Smith');
    cy.get('[data-testid="search-submit"]').click();
    
    // Wait for results
    cy.get('[data-testid="search-results"]').should('be.visible');
    
    // Add first result to network
    cy.get('[data-testid="add-to-network"]').first().click();
    
    // Verify member appears in genogram
    cy.get('.genogram-canvas').should('contain', 'Jane Smith');
  });
});
```

## 4. Performance Testing

### Scenarios
- 100 concurrent users viewing dashboards
- 50 users creating network members simultaneously
- 25 users generating PDF reports concurrently

### Acceptance Criteria
- P95 response time < 500ms for API calls
- Page load time < 2 seconds
- PDF generation < 5 seconds

## 5. Security Testing

### Tests to Perform
- SQL injection attempts
- XSS attacks
- CSRF protection
- Authentication bypass attempts
- Authorization checks
- Data exposure via API
- Rate limiting

## 6. UAT Checklist

See separate UAT checklist document mapped to RFP requirements.
```

### 🆕 Step 7.9: UAT Checklist (NEW)

**File**: `docs/uat-checklist.md`

```markdown
# User Acceptance Testing Checklist

Map each RFP requirement to testable criteria.

## RFP §4.5.2.1 - Name-Based Search Engine

| Test ID | Requirement | Test Steps | Pass/Fail | Notes |
|---------|-------------|------------|-----------|-------|
| UAT-001 | Search returns relevant results | 1. Navigate to search<br>2. Enter "John Smith"<br>3. Verify results contain similar names | [ ] | |
| UAT-002 | Source provenance disclosed | 1. Perform search<br>2. Verify each result shows data source | [ ] | |
| UAT-003 | Multiple sources queried | 1. Check search source config<br>2. Verify 2+ sources enabled<br>3. Perform search<br>4. Confirm results from multiple sources | [ ] | |

## RFP §4.5.2.2 - Contact Maintenance & Merge

| Test ID | Requirement | Test Steps | Pass/Fail | Notes |
|---------|-------------|------------|-----------|-------|
| UAT-010 | Create contact | 1. Click "Add Member"<br>2. Fill in details<br>3. Save<br>4. Verify appears in network | [ ] | |
| UAT-011 | Update contact | 1. Edit existing member<br>2. Change phone number<br>3. Save<br>4. Verify change persisted | [ ] | |
| UAT-012 | Merge duplicates | 1. Identify duplicate<br>2. Click merge<br>3. Resolve conflicts<br>4. Confirm merge successful | [ ] | |
| UAT-013 | Provenance maintained | 1. View member details<br>2. Check "Source" field<br>3. Verify provenance shown | [ ] | |

## RFP §4.5.2.3 - Auto & Manual Contact Logs

| Test ID | Requirement | Test Steps | Pass/Fail | Notes |
|---------|-------------|------------|-----------|-------|
| UAT-020 | Manual contact log | 1. Select member<br>2. Click "Log Contact"<br>3. Enter details<br>4. Save<br>5. Verify in timeline | [ ] | |
| UAT-021 | Auto-log email | 1. Send email to member<br>2. Wait 1 minute<br>3. Check contact log<br>4. Verify auto-logged | [ ] | |
| UAT-022 | Search contacts | 1. Use contact search<br>2. Enter keyword<br>3. Verify results match | [ ] | |
| UAT-023 | Attachments | 1. Log contact<br>2. Upload file<br>3. Save<br>4. Verify file accessible | [ ] | |

## RFP §4.5.2.4 - Interactive Genogram

| Test ID | Requirement | Test Steps | Pass/Fail | Notes |
|---------|-------------|------------|-----------|-------|
| UAT-030 | Visualize network | 1. Open child case<br>2. View genogram<br>3. Verify all members shown | [ ] | |
| UAT-031 | Color-coded activity | 1. Check node colors<br>2. Verify: green=<30d, yellow=30-60d, orange=60-90d, red=>90d | [ ] | |
| UAT-032 | Role badges | 1. View genogram<br>2. Verify role badges visible on nodes | [ ] | |
| UAT-033 | 30/60/90 filters | 1. Click filter dropdown<br>2. Select "Active <30 days"<br>3. Verify only green nodes shown<br>4. Repeat for other filters | [ ] | |
| UAT-034 | Add/edit relationships | 1. Add new relationship line<br>2. Edit relationship type<br>3. Delete relationship<br>4. Verify all work | [ ] | |

## RFP §4.5.2.5 - Dashboard & Analytics

| Test ID | Requirement | Test Steps | Pass/Fail | Notes |
|---------|-------------|------------|-----------|-------|
| UAT-040 | Network Health Index | 1. View child dashboard<br>2. Verify NHI displayed<br>3. Check calculation logic | [ ] | |
| UAT-041 | Key metrics | 1. Check dashboard<br>2. Verify metrics: total members, active %, contacts, etc. | [ ] | |
| UAT-042 | Reasonable efforts report | 1. Click "Generate Report"<br>2. Verify report includes all required sections<br>3. Check completeness | [ ] | |
| UAT-043 | Export CSV | 1. Click Export > CSV<br>2. Verify file downloads<br>3. Open in Excel<br>4. Check data accuracy | [ ] | |
| UAT-044 | Export Excel | 1. Click Export > Excel<br>2. Verify multiple sheets created<br>3. Check data completeness | [ ] | |
| UAT-045 | Supervisor dashboard | 1. Login as supervisor<br>2. View caseload<br>3. Verify all cases shown<br>4. Check metrics accuracy | [ ] | |

## RFP §4.5.2.6 - Audit Logs

| Test ID | Requirement | Test Steps | Pass/Fail | Notes |
|---------|-------------|------------|-----------|-------|
| UAT-050 | Immutable audit | 1. Make change to member<br>2. View audit log<br>3. Verify entry created<br>4. Attempt to modify audit log (should fail) | [ ] | |
| UAT-051 | Before/after diffs | 1. View audit entry<br>2. Verify shows old and new values | [ ] | |
| UAT-052 | Search audit logs | 1. Use audit search<br>2. Filter by user, date, action<br>3. Verify results correct | [ ] | |
| UAT-053 | Export audit logs | 1. Click export<br>2. Verify audit log file downloads | [ ] | |

## RFP §4.5.2.7 - Mobile Access

| Test ID | Requirement | Test Steps | Pass/Fail | Notes |
|---------|-------------|------------|-----------|-------|
| UAT-060 | Responsive layout | 1. Open on mobile device<br>2. Verify all pages render correctly | [ ] | |
| UAT-061 | Quick actions | 1. Test quick add on mobile<br>2. Test contact logging<br>3. Verify usability | [ ] | |
| UAT-062 | Offline mode | 1. Enable airplane mode<br>2. Make changes<br>3. Re-enable connectivity<br>4. Verify sync | [ ] | |
| UAT-063 | Photo capture | 1. Log contact on mobile<br>2. Take photo<br>3. Verify photo attached | [ ] | |

... Continue for all requirements
```

### 🆕 Step 7.10: Deployment Documentation (NEW)

**File**: `docs/deployment-guide.md`

```markdown
# Deployment Guide

## Prerequisites
- Azure account with appropriate permissions
- Azure CLI installed
- Node.js 18+ and npm
- Git

## Environment Setup

### 1. Azure Resources
Create the following resources:
- App Service Plan (Production tier)
- Web App (Node 18 LTS)
- Cosmos DB account (MongoDB API)
- Azure Service Bus (for events)
- Application Insights (monitoring)
- Key Vault (secrets management)

### 2. Configuration

Set environment variables:
```bash
az webapp config appsettings set \
  --resource-group family-finder-rg \
  --name family-finder-app \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="<cosmos-connection-string>" \
    JWT_SECRET="<secret-from-keyvault>" \
    API_BASE_URL="https://api.safegenerations.com"
```

### 3. Build and Deploy

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build frontend
npm run build

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group family-finder-rg \
  --name family-finder-app \
  --src ./build.zip
```

## CI/CD Pipeline

Use Azure DevOps YAML pipeline:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
    
- script: npm install
  displayName: 'Install dependencies'
  
- script: npm run test
  displayName: 'Run tests'
  
- script: npm run build
  displayName: 'Build application'
  
- task: ArchiveFiles@2
  inputs:
    rootFolderOrFile: '$(System.DefaultWorkingDirectory)/build'
    includeRootFolder: false
    archiveFile: '$(Build.ArtifactStagingDirectory)/build.zip'
    
- task: AzureWebApp@1
  inputs:
    azureSubscription: 'SafeGenerations-Prod'
    appName: 'family-finder-app'
    package: '$(Build.ArtifactStagingDirectory)/build.zip'
```

## Monitoring

Set up Application Insights dashboards:
- Response times
- Error rates
- User activity
- API usage

## Backup and Recovery

- Database: Automated backups every 24 hours
- Retention: 30 days
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 24 hours
```

**Testing Checkpoints (Phase 7):**
- [ ] 🆕 OpenAPI documentation complete and accessible
- [ ] 🆕 All user guides written and reviewed
- [ ] 🆕 Interactive tutorials work for new users
- [ ] 🆕 Training video scripts completed
- [ ] 🆕 Testing plan covers all critical paths
- [ ] 🆕 UAT checklist maps to all RFP requirements
- [ ] 🆕 Deployment guide tested on staging environment

---

## .