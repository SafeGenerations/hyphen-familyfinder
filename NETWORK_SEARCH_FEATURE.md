# Network Search Feature Implementation

## Overview
Implemented a comprehensive **Person Network Search** feature that allows caseworkers to search external databases for potential family connections. When you click on a person node, a new search icon chip appears that opens a powerful search interface with simulated Azure database queries.

## What Was Built

### 1. **Network Search Service** (`networkSearchService.js`)
Mock Azure database search service with realistic simulated data:
- **6 Data Sources**: State Vital Records, Census Data, Child Welfare System, Court Records, Social Services, School Records
- **9 Relationship Types**: Parent, Child, Sibling, Grandparent, Grandchild, Aunt/Uncle, Niece/Nephew, Cousin, Spouse/Partner
- **Smart Mock Data Generation**: 
  - Age-appropriate relationships (parents 25+ years older, etc.)
  - Realistic names, phone numbers, emails, addresses
  - Confidence scores (70-100%)
  - Last contact dates, record IDs
  - Contextual notes ("Phone number updated 6 months ago", etc.)
- **API Functions**:
  - `searchNetworkConnections(person, filters)` - Main search with filters
  - `getDataSources()` - Available database sources
  - `getRelationshipTypes()` - Available relationship types
  - `exportResultsToCSV(results)` - Export results to CSV file

### 2. **Network Search Modal** (`NetworkSearchModal.js`)
Full-featured search interface with professional UI:

**Search Interface:**
- Auto-search on modal open
- Real-time filter updates
- Loading states with spinner
- Empty states with helpful messages
- 10-25 mock results per search

**Advanced Filtering:**
- **Relationship Types**: Multi-select chips (all 9 types)
- **Data Sources**: Multi-select chips (all 6 sources)
- **Confidence Threshold**: Slider (0-100%)
- **Max Results**: Configurable limit
- Filter toggle button with badge showing active count

**Results Display:**
- Card-based list with hover effects
- Selected state highlighting
- Confidence badges (color-coded: Green 90%+, Blue 80-89%, Amber 70-79%)
- Quick info: Name, age, gender, location, data source
- Two-button actions per result:
  - "Add to Genogram" - Quick add button
  - "View Details" - Opens detail panel

**Details Panel:**
- Slides out from right side
- **Confidence Score**: Visual bar with percentage and label (Very High/High/Medium/Low)
- **Basic Information**: Age, gender, relationship type, record ID
- **Contact Information**: Phone, email, address with icons
- **Data Source**: Source icon, name, last updated date
- **Notes**: Full notes text
- **Large "Add to Genogram" button** at bottom

**Export Functionality:**
- CSV export with all fields
- Filename includes person name and date
- Downloads immediately

### 3. **Context Integration**
Added state management to `GenogramContext.js`:
- **State**: `searchingNetworkFor` - Person currently being searched
- **Action**: `setSearchingNetworkFor(person)` - Open/close modal
- **Reducer**: `SET_SEARCHING_NETWORK_FOR` case

### 4. **UI Chip on Person Nodes** (`Person.js`)
New search button positioned below delete button:
- **Icon**: Magnifying glass (SVG rendered)
- **Color**: Blue (#3b82f6) to distinguish from red delete button
- **Position**: Top-right area, 20px below delete button
- **Only shows for PERSON nodes** (not organizations, resources, etc.)
- Clickable area: 15px radius (touch-friendly)
- Visual button: 10px radius circle with icon
- Drop shadow for depth

### 5. **Integration** (`ModernGenogramApp.js`)
- Imported `NetworkSearchModal` component
- Rendered in both mobile and desktop layouts
- Controlled by `searchingNetworkFor` state
- Modal closes when person is set to null

## Key Features

### 🎯 User Workflow
1. **Select a person node** on the genogram
2. **Click the search icon chip** (blue magnifying glass)
3. **Modal opens** and automatically searches
4. **Review results** - sorted by confidence score
5. **Click result card** to view details
6. **Adjust filters** if needed and re-search
7. **Add person to genogram** with one click

### 📊 Smart Data Handling
When adding a person from search results:
- **Auto-positions** near source person (150px right, 100px down)
- **Preserves contact info**: Phone, email, address from search
- **Creates case log entry**: Documents the search source and confidence
- **Marks as network member**: Sets `networkMember: true` flag
- **Suggests next step**: Alert tells user to create relationship

### 🎨 Professional UI/UX
- **Modern gradient backgrounds**
- **Smooth animations** (fade in, slide up)
- **Color-coded confidence** (green/blue/amber/gray)
- **Responsive design** (desktop, tablet, mobile)
- **Touch-friendly** buttons (min 44px)
- **Accessibility** features (aria labels, keyboard nav)
- **Loading states** with helpful hints
- **Empty states** with clear CTAs

### 🔍 Advanced Search Capabilities
- **Multi-criteria filtering**
- **Live filter updates**
- **Confidence-based sorting**
- **Source-specific queries**
- **Relationship-type filtering**
- **Export to CSV**
- **Batch result display** (up to 50 results)

## Technical Architecture

### Data Flow
```
Person Click → setSearchingNetworkFor(person) → NetworkSearchModal opens
→ Auto-triggers searchNetworkConnections(person, filters)
→ Mock service returns 10-25 results
→ Results sorted by confidence
→ User clicks "Add to Genogram"
→ addPerson() with enhanced data
→ Modal closes
```

### File Structure
```
src/src-modern/
├── services/
│   └── networkSearchService.js      (205 lines)
├── components/
│   ├── NetworkSearchModal.js        (466 lines)
│   ├── NetworkSearchModal.css       (719 lines)
│   └── Shapes/
│       └── Person.js                (added search chip)
├── contexts/
│   └── GenogramContext.js           (added state/actions)
└── ModernGenogramApp.js             (integrated modal)
```

### Mock Data Examples
**Generated Person:**
```javascript
{
  firstName: 'Michael',
  lastName: 'Smith',
  fullName: 'Michael Smith',
  age: 42,
  gender: 'M',
  relationshipType: 'Sibling',
  city: 'San Diego',
  state: 'CA',
  phone: '(619) 555-1234',
  email: 'michael.smith@email.com',
  lastContact: '2025-09-15',
  source: { id: 'census', name: 'Census Data', icon: '📊' },
  confidence: 87,
  notes: 'Phone number updated 6 months ago'
}
```

## Future Enhancements (Real Implementation)

### Replace Mock Service with Azure Cognitive Search:
```javascript
// Real implementation
import { SearchClient, AzureKeyCredential } from '@azure/search-documents';

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT,
  process.env.AZURE_SEARCH_INDEX,
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY)
);

export async function searchNetworkConnections(person, filters) {
  const searchQuery = buildSearchQuery(person, filters);
  const results = await searchClient.search(searchQuery, {
    filter: buildFilter(filters),
    select: ['firstName', 'lastName', 'age', 'gender', 'phone', 'email'],
    top: filters.maxResults || 50,
    includeTotalCount: true
  });
  
  return results.results.map(transformResult);
}
```

### Add Real Data Sources:
- State child welfare databases (SACWIS, CCWIS)
- Public records (birth/death certificates)
- Court systems (family court orders)
- School enrollment records
- Healthcare records (with consent)
- Social services case files

### Enhanced Features:
- **Relationship auto-creation**: Suggest relationship type from search
- **Bulk import**: Add multiple family members at once
- **Confidence tuning**: ML-based matching with feedback loop
- **Search history**: Save searches for later review
- **Duplicate detection**: Warn if person already in genogram
- **Privacy controls**: HIPAA-compliant data handling
- **Audit logging**: Track all searches for compliance

## Testing the Feature

### Manual Test Steps:
1. Start the app: `npm start`
2. Create a person node or select existing person
3. Look for **blue magnifying glass icon** below delete button
4. Click the search icon
5. Modal opens with loading spinner
6. Results appear (10-25 mock records)
7. Click a result card to see details
8. Adjust filters (relationship types, sources, confidence)
9. Click "Search" to re-query
10. Click "Add to Genogram" on any result
11. Verify person appears on canvas with contact info
12. Check case log for search entry

### Expected Behavior:
- ✅ Search chip only shows for PERSON nodes when selected
- ✅ Modal opens centered on screen
- ✅ Search runs automatically on open
- ✅ Results sorted by confidence (highest first)
- ✅ Filters affect result count
- ✅ Details panel shows on click
- ✅ Export creates CSV file
- ✅ Added person has contact info populated
- ✅ Case log documents the search source

## Documentation References
- See `CASE_MANAGEMENT_FEATURES.md` for related case management features
- Contact info structure matches existing `contactInfo` schema
- Case log structure matches existing `caseLog` schema
- Network member flag integrates with existing network highlighting

## Notes for Production

### Security Considerations:
- Add authentication for search API
- Implement rate limiting (prevent abuse)
- Log all searches for audit trail
- Encrypt PII in transit and at rest
- Require consent for data access
- Implement role-based access control

### Performance Optimization:
- Add search result caching (5-minute TTL)
- Implement pagination for large result sets
- Use debouncing for filter changes
- Lazy load detail panel data
- Consider web workers for CSV export

### UX Improvements:
- Add keyboard shortcuts (Cmd+F for search)
- Implement search result highlighting
- Add "Recent searches" quick access
- Show search in progress in toolbar
- Add toast notifications for success/errors

## Commit Message
```
feat: Add person network search with external database integration

- Created networkSearchService.js with mock Azure database queries
- Built NetworkSearchModal with advanced filtering and result display
- Added search chip to person nodes (blue magnifying glass icon)
- Integrated setSearchingNetworkFor state into GenogramContext
- Added CSV export functionality for search results
- Implemented confidence-based result ranking
- Auto-populates contact info when adding from search results
- Supports 6 data sources and 9 relationship types
- Mobile and desktop responsive design
- Ready for Azure Cognitive Search integration

Files changed:
- src/src-modern/services/networkSearchService.js (new)
- src/src-modern/components/NetworkSearchModal.js (new)
- src/src-modern/components/NetworkSearchModal.css (new)
- src/src-modern/contexts/GenogramContext.js (modified)
- src/src-modern/components/Shapes/Person.js (modified)
- src/src-modern/ModernGenogramApp.js (modified)
```
