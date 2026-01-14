# Case Management Features - Phase 1

## Overview
Added CRM-style case management capabilities to person nodes, enabling social workers to track all interactions and maintain comprehensive contact information for each person in the genogram.

## Implementation Date
Added: Q1 2025 (Phase 1 of hybrid approach)

## Features Added

### 1. Tabbed Interface in PersonEditPanel
Replaced single-form layout with a modern tabbed interface:
- **Basic Tab**: All existing person fields (demographics, relationships, quick actions)
- **Case Log Tab**: Timeline of interactions and case notes
- **Contacts Tab**: Phone numbers, emails, and physical addresses

### 2. Case Log Tab
**Purpose**: Track all interactions with family members for case documentation

**Features**:
- Chronological timeline of case activities (newest first)
- Entry types: Note, Phone Call, Email, Home Visit, Meeting, Assessment
- Each entry includes:
  - Date (date picker)
  - Type (dropdown)
  - Subject line
  - Detailed notes (expandable textarea)
  - Worker/staff name
- Add/delete entries with inline editing
- Empty state with helpful prompt

**Data Structure** (`person.caseLog`):
```javascript
{
  id: Number,           // Unique timestamp ID
  date: String,         // ISO date string (YYYY-MM-DD)
  type: String,         // 'note'|'phone'|'email'|'visit'|'meeting'|'assessment'
  subject: String,      // Brief subject line
  details: String,      // Full notes
  worker: String        // Name of worker/staff
}
```

### 3. Contacts Tab
**Purpose**: Maintain comprehensive contact information for each person

**Features**:
- **Phone Numbers**: Multiple phones with type designation (Mobile/Home/Work/Other)
- **Email Addresses**: Multiple emails with type designation (Personal/Work/Other)
- **Physical Addresses**: Full address records with type (Home/Work/Previous/Other)
- Each contact type includes notes field for context
- Add/delete individual contacts with inline editing
- Empty states for each section

**Data Structure** (`person.contactInfo`):
```javascript
{
  phones: [
    {
      id: Number,       // Unique timestamp ID
      type: String,     // 'mobile'|'home'|'work'|'other'
      number: String,   // Phone number
      notes: String     // e.g., "preferred contact", "best time: evenings"
    }
  ],
  emails: [
    {
      id: Number,       // Unique timestamp ID
      type: String,     // 'personal'|'work'|'other'
      address: String,  // Email address
      notes: String     // Additional context
    }
  ],
  addresses: [
    {
      id: Number,       // Unique timestamp ID
      type: String,     // 'home'|'work'|'previous'|'other'
      street: String,   // Street address
      city: String,     // City
      state: String,    // State
      zip: String,      // ZIP code
      notes: String     // Additional context
    }
  ]
}
```

## Technical Implementation

### Files Modified

#### 1. `PersonEditPanel.js`
- Added tab state management with `useState('basic')`
- Implemented tab navigation UI with icons and active state styling
- Refactored existing form into `renderBasicTab()` function
- Added `renderCaseLogTab()` with full CRUD operations
- Added `renderContactsTab()` with sections for phones/emails/addresses
- Imported new icons: `Phone`, `Mail`, `MapPin`, `Plus`, `FileText`, `Calendar`, `User`

#### 2. `GenogramContext.js`
- Extended `ensureNodeDefaults()` to initialize:
  - `caseLog: []` (empty array)
  - `contactInfo: { phones: [], emails: [], addresses: [] }` (empty structure)
- Backward compatibility: Existing person nodes without these fields get defaults
- Data persists via localStorage auto-save and .geno file format

## UI Design

### Tab Navigation
- Sticky header with 3 tabs
- Active tab: Indigo color (#6366f1), bottom border, light background
- Icons for each tab: User, FileText, Phone
- Smooth transitions on tab change

### Case Log Design
- Light gray card background (#f9fafb) for each entry
- Horizontal layout: Date picker + Type dropdown + Delete button
- Subject input prominent (14px, bold)
- Details textarea expandable (80px default, vertical resize)
- Worker name input at bottom (smaller, 13px)
- Newest entries at top (reversed array)

### Contacts Design
- Three sections with headers and icons
- Light blue "Add" buttons (#dbeafe background, #1e40af text)
- Each contact in gray card with inline editing
- Type dropdowns on left, delete button on right
- Address fields in responsive grid (City | State | ZIP)
- Empty states with italic gray text

## Data Persistence

### Auto-Save
- All changes trigger `updatePerson()` which:
  1. Updates person in `people` array
  2. Sets `isDirty: true` flag
  3. Triggers localStorage auto-save
  
### File Format
- `.geno` files include `caseLog` and `contactInfo` in person objects
- Backward compatible: Old files load correctly with empty defaults

### Migration
- No migration needed - defaults added at load time in `ensureNodeDefaults()`
- Existing genograms continue to work without modification

## Use Cases

### Social Worker Scenario 1: Initial Contact
1. Open person's edit panel
2. Switch to "Case Log" tab
3. Click "Add Entry"
4. Select type: "Phone Call"
5. Enter subject: "Initial contact - discussed placement options"
6. Add detailed notes about conversation
7. Enter worker name
8. Auto-saves immediately

### Social Worker Scenario 2: Contact Information
1. Open person's edit panel
2. Switch to "Contacts" tab
3. Click "Add" under Phone Numbers
4. Select type: "Mobile"
5. Enter phone number
6. Add notes: "Preferred contact, available weekdays after 5pm"
7. Repeat for multiple phones/emails/addresses
8. All information available for future reference

### Case Review Scenario
1. Open person's edit panel
2. Case Log shows complete interaction history
3. Contacts tab provides all contact methods
4. Quick reference for case planning and court reports

## Future Enhancements (Phase 2 - Modal)

Planned features for full modal implementation:
- **Document Management**: Attach PDFs, images, court documents
- **Calendar Integration**: Schedule and track meetings/visits
- **Advanced Search**: Filter case log by date range, type, worker
- **Export Case Report**: Generate PDF summary of all interactions
- **Case Timeline**: Visual timeline view of case progression
- **Reminders**: Set follow-up reminders for specific cases
- **Tags/Categories**: Organize case log entries with custom tags

## Testing Checklist

- [x] Tab navigation works smoothly
- [x] Case log entries can be added/edited/deleted
- [x] Contact information persists correctly
- [x] Backward compatibility with existing genograms
- [x] Auto-save triggers on all changes
- [x] Empty states display correctly
- [x] All form inputs work as expected
- [x] No console errors or warnings
- [ ] Test with large case logs (50+ entries)
- [ ] Mobile responsive testing
- [ ] Accessibility (keyboard navigation, screen readers)

## Notes

- Current implementation uses inline editing (no modals)
- Optimized for quick data entry during case work
- Follows existing UI patterns from RelationshipEditPanel tabs
- Icon library: Lucide React (already in project)
- Colors match existing indigo/blue theme
- Ready for expansion to full modal in Phase 2

## Related Files

- `PersonEditPanel.js` - Main implementation
- `GenogramContext.js` - Data structure and defaults
- `CLAUDE_CODE_INSTRUCTIONS.md` - Will be updated with Phase 2.6 details

## Branch Info

- Feature branch: `family-finder-a` (current)
- This work adds to connection/placement status tracking
- Ready for testing and user feedback
