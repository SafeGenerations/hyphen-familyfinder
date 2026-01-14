# Genogram Builder - Technical Architecture Documentation

**Version:** 2.0  
**Last Updated:** October 20, 2025  
**Target Audience:** Development Team, Compliance Team, Technical Leadership

---

## Executive Summary

The Genogram Builder is a React-based web application for creating, editing, and managing family genograms (family tree diagrams with relationship and placement information). The application features a modern SVG-based canvas, comprehensive state management, and multi-modal user interfaces (desktop, tablet, mobile, and embedded modes).

**Key Technologies:**
- React 18 (Functional Components, Hooks)
- SVG Canvas with D3-inspired rendering
- Context API for state management
- Azure Functions for serverless backend
- Lucide React for iconography

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Desktop    │  │   Tablet     │  │   Mobile     │              │
│  │  Interface   │  │  Interface   │  │  Interface   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                   ┌────────▼─────────┐                               │
│                   │  Hybrid Wrapper  │                               │
│                   │   (Responsive)   │                               │
│                   └────────┬─────────┘                               │
│                            │                                          │
│         ┌──────────────────┴──────────────────┐                     │
│         │                                       │                     │
│  ┌──────▼──────┐                      ┌───────▼────────┐           │
│  │   Embed     │                      │   Standalone   │           │
│  │    Mode     │                      │      Mode      │           │
│  └─────────────┘                      └────────────────┘           │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│                      APPLICATION CORE                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              ModernGenogramApp (Root)                       │  │
│  │  • Route Management (React Router)                          │  │
│  │  • Mode Detection (Desktop/Tablet/Mobile/Embed)             │  │
│  │  • Global Event Handlers                                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │           GenogramContext (State Management)                │  │
│  │  • People, Relationships, Households, TextBoxes             │  │
│  │  • Selection State                                          │  │
│  │  • Canvas State (Zoom, Pan, Grid)                           │  │
│  │  • UI State (Modals, Panels, Menus)                         │  │
│  │  • History (Undo/Redo Stack)                                │  │
│  │  • Clipboard                                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│                       FEATURE MODULES                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Canvas    │  │   Editing   │  │  Discovery  │              │
│  │  Rendering  │  │   Panels    │  │   & Search  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Relationship│  │  Household  │  │   Reports   │              │
│  │  Management │  │  Management │  │   & Export  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Placement  │  │   Contact   │  │  Analytics  │              │
│  │   Tracking  │  │  Tracking   │  │  Dashboard  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│                      DATA & SERVICES LAYER                         │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   File I/O  │  │   Network   │  │  Feedback   │              │
│  │   (.geno)   │  │   Search    │  │     API     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Export    │  │  Analytics  │  │   Embed     │              │
│  │ PNG/SVG/PDF │  │   Tracking  │  │ Integration │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│                       BACKEND SERVICES                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │          Azure Functions (Serverless API)                   │  │
│  │                                                              │  │
│  │  • POST /api/feedback  - User feedback submission           │  │
│  │  • Future: Authentication, Data Sync, etc.                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Components Architecture

### 2.1 State Management (GenogramContext)

```
┌──────────────────────────────────────────────────────────────────┐
│                      GenogramContext                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  STATE TREE:                                                      │
│  ├─ Core Data                                                     │
│  │  ├─ people: Array<Person>                                     │
│  │  ├─ relationships: Array<Relationship>                        │
│  │  ├─ households: Array<Household>                              │
│  │  ├─ textBoxes: Array<TextBox>                                 │
│  │  └─ placements: Array<Placement>                              │
│  │                                                                 │
│  ├─ Selection State                                               │
│  │  ├─ selectedPerson: Person | null                             │
│  │  ├─ selectedRelationship: Relationship | null                 │
│  │  ├─ selectedHousehold: Household | null                       │
│  │  ├─ selectedTextBox: TextBox | null                           │
│  │  ├─ selectedPlacement: Placement | null                       │
│  │  └─ selectedNodes: Set<string> (Multi-select)                 │
│  │                                                                 │
│  ├─ Canvas State                                                  │
│  │  ├─ zoom: number (0.1 - 3.0)                                  │
│  │  ├─ pan: { x, y }                                             │
│  │  ├─ snapToGrid: boolean                                       │
│  │  ├─ gridSize: number (default 20)                             │
│  │  └─ isDrawingHousehold: boolean                               │
│  │                                                                 │
│  ├─ UI State                                                      │
│  │  ├─ sidePanelOpen: boolean                                    │
│  │  ├─ contextMenu: { x, y, type } | null                       │
│  │  ├─ deleteConfirmation: { type, id } | null                  │
│  │  ├─ showBulkEditPanel: boolean                                │
│  │  ├─ searchModalOpen: boolean                                  │
│  │  ├─ filterPanelOpen: boolean                                  │
│  │  └─ mobileMenuOpen: boolean                                   │
│  │                                                                 │
│  ├─ History                                                       │
│  │  ├─ past: Array<State> (Undo stack)                          │
│  │  ├─ future: Array<State> (Redo stack)                        │
│  │  └─ historyIndex: number                                      │
│  │                                                                 │
│  ├─ Clipboard                                                     │
│  │  └─ clipboard: { type, data } | null                          │
│  │                                                                 │
│  └─ Configuration                                                 │
│     ├─ customAttributes: Object                                   │
│     ├─ tagDefinitions: Array<Tag>                                │
│     ├─ filterTemplates: Array<FilterTemplate>                    │
│     └─ searchHistory: Array<SearchQuery>                         │
│                                                                    │
│  ACTIONS (150+ action methods):                                   │
│  ├─ CRUD Operations (add/update/delete)                          │
│  ├─ Selection Management                                          │
│  ├─ Canvas Operations                                             │
│  ├─ Relationship Creation                                         │
│  ├─ History Management (undo/redo)                               │
│  ├─ Clipboard (copy/paste)                                       │
│  └─ Layer Management (z-index)                                   │
│                                                                    │
│  REDUCER: Pure function handles 80+ action types                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Canvas Rendering Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    GenogramCanvas (SVG)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  INPUT: state.people, relationships, households, textBoxes        │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  1. SORTING BY Z-INDEX                                      │  │
│  │     • Sort all items by zIndex property                     │  │
│  │     • Lower values render first (behind)                    │  │
│  │     • Higher values render last (in front)                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  2. RENDER HOUSEHOLDS                                       │  │
│  │     Component: <Household />                                │  │
│  │     • Path generation (curved or straight)                  │  │
│  │     • Border style & color                                  │  │
│  │     • Label positioning (top/center/bottom/left/right)      │  │
│  │     • Member detection (15px buffer)                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  3. RENDER RELATIONSHIPS                                    │  │
│  │     Component: <Relationship />                             │  │
│  │     • Line type (married/partnered/divorced/separated)      │  │
│  │     • Connection badges (optional)                          │  │
│  │     • Relationship bubbles (child indicators)               │  │
│  │     • Date labels                                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  4. RENDER PEOPLE                                           │  │
│  │     Component: <Person />                                   │  │
│  │     • Shape (circle, square, diamond)                       │  │
│  │     • Gender styling                                        │  │
│  │     • Deceased symbols (15 types)                           │  │
│  │     • Custom icons & badges                                 │  │
│  │     • Name labels                                           │  │
│  │     • Selection indicators                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  5. RENDER TEXT BOXES                                       │  │
│  │     Component: <TextBox />                                  │  │
│  │     • Positioned text annotations                           │  │
│  │     • Rich text formatting                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  6. OVERLAYS & INTERACTIONS                                 │  │
│  │     • Connection preview lines                              │  │
│  │     • Selection boxes                                       │  │
│  │     • Drag indicators                                       │  │
│  │     • Context menus                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  OUTPUT: Complete SVG scene rendered to DOM                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 Component Hierarchy

```
ModernGenogramApp
├─ Router
│  ├─ / (Main Canvas)
│  ├─ /family-finder (Feature Landing)
│  ├─ /family-finder/cases (Case Management)
│  └─ /family-finder/case/:id (Case Detail)
│
├─ HybridInterfaceWrapper (Responsive Detection)
│  ├─ Desktop Interface
│  │  ├─ Toolbar
│  │  ├─ GenogramCanvas
│  │  ├─ EditPanels (Person/Relationship/Household/TextBox)
│  │  ├─ ContextMenu
│  │  └─ Modals
│  │
│  ├─ Tablet Interface
│  │  ├─ TabletToolbar
│  │  ├─ GenogramCanvas (touch-optimized)
│  │  ├─ FloatingActionButtons
│  │  └─ BottomSheet Panels
│  │
│  └─ Mobile Interface
│     ├─ MobileHeader
│     ├─ GenogramCanvas (pan/zoom)
│     ├─ MobileDrawer
│     └─ BottomNavigation
│
├─ UI Components
│  ├─ NetworkSearchModal (Person search)
│  ├─ PersonSearchModal (Internal search)
│  ├─ FilterPanel (Node filtering)
│  ├─ BulkEditPanel (Multi-edit)
│  ├─ DiscoveryPanel (Recommendations)
│  ├─ AnalyticsPanel (Stats)
│  ├─ BannerPromo (Promotional)
│  ├─ Feedback (User feedback)
│  ├─ TutorialModal (Onboarding)
│  └─ TermsModal (Legal)
│
├─ Dashboard Components
│  ├─ SupervisorDashboard
│  ├─ ChildDashboard
│  └─ AnalyticsPanel
│
├─ Reports & Export
│  ├─ PDFReportGenerator
│  ├─ ExportPNG
│  ├─ ExportSVG
│  └─ CaseNotesCopier
│
└─ Embed Integration
   ├─ EmbedSaveToolbar
   └─ EmbedEnhancements
```

---

## 3. Data Models

### 3.1 Core Entities

#### Person
```typescript
interface Person {
  id: string;                    // Unique identifier
  x: number;                     // Canvas X position
  y: number;                     // Canvas Y position
  zIndex: number;                // Layer order (default: 0)
  
  // Identity
  name: string;                  // Display name
  firstName?: string;
  lastName?: string;
  maidenName?: string;
  gender?: 'male' | 'female' | 'other';
  
  // Demographics
  dateOfBirth?: string;          // ISO date
  dateOfDeath?: string;          // ISO date
  age?: number;
  isDeceased?: boolean;
  deceasedSymbol?: string;       // 15 symbol types
  
  // Visual
  shape?: 'circle' | 'square' | 'diamond';
  color?: string;                // Hex color
  size?: number;                 // Radius/width
  icon?: string;                 // Custom icon
  showBadge?: boolean;
  
  // Relationships
  children?: string[];           // Child IDs
  
  // Case Management
  caseNotes?: string;
  caseStatus?: string;
  tags?: string[];               // Tag IDs
  
  // Contact Tracking
  contacts?: Contact[];
  
  // Placement Tracking
  currentPlacement?: string;     // Placement ID
  placementHistory?: string[];   // Placement IDs
  
  // Extensibility
  customAttributes?: Record<string, any>;
}
```

#### Relationship
```typescript
interface Relationship {
  id: string;
  from: string;                  // Person ID
  to: string;                    // Person ID
  
  type: 'married' | 'partnered' | 'divorced' | 
        'separated' | 'engaged' | 'deceased-spouse' |
        'parent-child' | 'biological' | 'adopted' |
        'foster' | 'step' | 'guardian' | 'sibling';
  
  status?: 'active' | 'ended' | 'unknown';
  
  // Dates
  startDate?: string;            // ISO date
  endDate?: string;              // ISO date
  
  // Children
  children?: string[];           // Person IDs
  childOrder?: Record<string, number>;
  
  // Visual
  showBadge?: boolean;
  color?: string;
  
  notes?: string;
}
```

#### Household
```typescript
interface Household {
  id: string;
  name: string;
  zIndex: number;                // Layer order
  
  // Boundary
  points: Point[];               // Polygon vertices
  
  // Visual Style
  borderStyle: 'curved' | 'straight';
  smoothness: number;            // 0-0.5 for curve intensity
  color: string;                 // Border color
  labelColor?: string;           // Text color
  labelPosition: 'top' | 'center' | 'bottom' | 'left' | 'right';
  
  // Members (auto-calculated with 15px buffer)
  members: string[];             // Person IDs inside boundary
  
  notes?: string;
}
```

#### TextBox
```typescript
interface TextBox {
  id: string;
  x: number;
  y: number;
  zIndex: number;
  
  text: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
}
```

#### Placement
```typescript
interface Placement {
  id: string;
  personId: string;
  
  type: 'foster' | 'kinship' | 'group-home' | 
        'residential' | 'adoptive' | 'independent' | 'other';
  
  // Location
  address?: string;
  city?: string;
  state?: string;
  
  // Dates
  startDate: string;
  endDate?: string;
  
  // Details
  providerName?: string;
  providerContact?: string;
  notes?: string;
  
  // Status
  isActive: boolean;
  reason?: string;
}
```

### 3.2 Supporting Entities

#### Contact Event
```typescript
interface Contact {
  id: string;
  personId: string;
  
  date: string;                  // ISO datetime
  type: 'phone' | 'email' | 'in-person' | 'video' | 'other';
  duration?: number;             // Minutes
  
  notes?: string;
  outcome?: string;
  followUpNeeded?: boolean;
  nextContactDate?: string;
}
```

#### Tag Definition
```typescript
interface TagDefinition {
  id: string;
  name: string;
  color: string;
  category?: string;
  description?: string;
}
```

#### Filter Template
```typescript
interface FilterTemplate {
  id: string;
  name: string;
  description?: string;
  
  filters: {
    gender?: string[];
    ageRange?: [number, number];
    deceased?: boolean;
    tags?: string[];
    caseStatus?: string[];
    hasChildren?: boolean;
    inHousehold?: boolean;
  };
  
  usageCount: number;
}
```

---

## 4. Feature Modules

### 4.1 Canvas Operations

**File:** `src/src-modern/hooks/useCanvasOperations.js`

**Capabilities:**
- Auto-arrange (force-directed layout)
- Fit to canvas (zoom/pan to show all)
- Grid snapping (20px grid)
- Zoom controls (0.1x - 3.0x)
- Pan controls (mouse drag, space+drag)
- Export to PNG/SVG/PDF

**Algorithms:**
- Force-directed layout for auto-arrange
- Ray-casting for household membership
- Polygon expansion for 15px buffer zone
- Bézier curve generation for smooth borders

### 4.2 Relationship Management

**Files:** 
- `src/src-modern/hooks/usePersonActions.js`
- `src/src-modern/contexts/GenogramContext.js`

**Relationship Types:**
1. **Couple Relationships:**
   - Married (double line)
   - Partnered (single line)
   - Divorced (double line with slash)
   - Separated (single line with slash)
   - Deceased spouse (special styling)

2. **Parent-Child Relationships:**
   - Biological
   - Adopted (dashed line)
   - Foster (dotted line)
   - Step-parent
   - Guardian

3. **Sibling Relationships:**
   - Full siblings
   - Half-siblings
   - Step-siblings

**Child Connection Logic:**
- Single-parent families
- Two-parent families
- Unknown parent (creates placeholder)
- Adoption (to existing relationship)
- Multi-generational connections

### 4.3 Household Management

**Files:**
- `src/src-modern/components/Shapes/Household.js`
- `src/src-modern/utils/householdUtils.js`

**Drawing Process:**
1. User clicks "Add Household"
2. Click canvas to add points (min 3)
3. Press Enter or click first point to close
4. Automatic member detection runs

**Member Detection Algorithm:**
```javascript
// Ray-casting algorithm with 15px buffer
function isPointInPolygon(point, polygon, buffer = 15) {
  // 1. Expand polygon outward from center by buffer distance
  const expandedPolygon = expandPolygon(polygon, buffer);
  
  // 2. Cast ray from point to infinity
  // 3. Count intersections with polygon edges
  // 4. Odd count = inside, Even count = outside
}

function expandPolygon(polygon, buffer) {
  // Calculate polygon center
  const center = calculateCenter(polygon);
  
  // Move each point away from center
  return polygon.map(point => {
    const vector = point - center;
    const distance = length(vector);
    const ratio = (distance + buffer) / distance;
    return center + (vector * ratio);
  });
}
```

**Visual Customization:**
- Border style: Curved (Bézier) or Straight
- Curve intensity: 0-0.5 smoothness
- Border color
- Label color (independent)
- Label position: 5 options

### 4.4 Layer Management (Z-Index)

**Files:**
- `src/src-modern/contexts/GenogramContext.js`
- `src/src-modern/components/Canvas/GenogramCanvas.js`

**Implementation:**
- All items (people, households, textBoxes) have `zIndex` property
- Default: 0
- Higher values render on top
- Canvas sorts before rendering

**User Controls:**
- Keyboard: Page Up (bring front), Page Down (send back)
- Edit panels: "Display Order" section with Front/Back buttons
- Tab navigation: Cycles through items by z-index order

### 4.5 Copy/Paste System

**Files:**
- `src/src-modern/contexts/GenogramContext.js`
- `src/src-modern/hooks/useKeyboardShortcuts.js`

**Clipboard Structure:**
```javascript
{
  type: 'person' | 'household' | 'textBox',
  data: { ...originalItem }
}
```

**Paste Behavior:**
- Generates new unique ID
- Offsets position (50px or context menu location)
- Appends "(Copy)" to names
- Households: clears member list
- People: preserves all attributes

**Access Methods:**
1. Keyboard: Ctrl+C / Ctrl+V
2. Context menu: "Copy [Type]" / "Paste Here"

### 4.6 Network Search & Discovery

**Files:**
- `src/src-modern/components/NetworkSearchModal.js`
- `src/src-modern/components/Search/PersonSearchModal.js`

**Search Sources:**
1. FastPeopleSearch (default)
2. WhitePages
3. TruePeopleSearch
4. Spokeo
5. Intelius
6. BeenVerified
7. PeopleFinders
8. Instant Checkmate

**Features:**
- Multi-source search
- Result aggregation
- Quick-add to genogram
- Search history tracking
- Relationship suggestions

### 4.7 Contact & Placement Tracking

**Contact Tracking:**
- Event logging (date, type, duration, notes)
- Follow-up reminders
- Contact history per person
- Searchable contact log

**Placement Tracking:**
- Current placement indicator
- Placement history
- Provider information
- Date ranges
- Placement type categorization
- Visual badges on canvas

### 4.8 Analytics & Reporting

**Analytics:**
- Person count
- Relationship statistics
- Household composition
- Age distribution
- Placement statistics
- Contact frequency metrics

**Reports:**
- PDF generation (jsPDF)
- Genogram visualization export
- Case notes compilation
- Contact logs
- Placement history
- Customizable templates

---

## 5. Technical Specifications

### 5.1 Browser Compatibility

**Minimum Requirements:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- ES6+ JavaScript
- SVG 1.1
- Canvas API
- LocalStorage
- File API
- Clipboard API (for Ctrl+C/V)

### 5.2 Performance Characteristics

**Target Performance:**
- Load time: < 2 seconds (first paint)
- Canvas render: 60 FPS with < 200 nodes
- Interaction latency: < 16ms (1 frame)
- Undo/Redo: < 100ms

**Optimization Strategies:**
- React.memo for expensive components
- useCallback for event handlers
- Virtual rendering for large datasets
- Debounced auto-save
- Lazy loading for modals
- SVG sprite sheets for icons

**Memory Management:**
- History stack limited to 50 states
- Automatic cleanup of deleted items
- Efficient state updates (immutable patterns)

### 5.3 Data Persistence

**Client-Side:**
- LocalStorage for preferences
- File-based (.geno JSON format)
- Browser download for exports

**File Format (.geno):**
```json
{
  "version": "2.0",
  "metadata": {
    "created": "ISO datetime",
    "modified": "ISO datetime",
    "author": "string"
  },
  "people": [...],
  "relationships": [...],
  "households": [...],
  "textBoxes": [...],
  "placements": [...],
  "customAttributes": {...},
  "tagDefinitions": [...],
  "filterTemplates": [...]
}
```

### 5.4 Security Considerations

**Data Privacy:**
- All data client-side (no server storage)
- No automatic cloud sync
- User controls all exports
- LocalStorage sandboxed per domain

**Input Validation:**
- All user input sanitized
- XSS prevention (React escaping)
- File type validation on import
- JSON schema validation

**Embedded Mode Security:**
- PostMessage API for communication
- Origin checking on messages
- CSP-compatible
- Iframe sandbox attributes

---

## 6. Integration Points

### 6.1 Embed Integration

**Files:**
- `src/utils/embedIntegration.js`
- `src/utils/embedEnhancements.js`

**API Methods:**
```javascript
// Load data into embedded genogram
window.GenogramEmbed.loadData(jsonData)

// Get current genogram data
const data = window.GenogramEmbed.getData()

// Export as SVG
const svg = window.GenogramEmbed.exportSVG()

// Event listeners
window.addEventListener('genogram:ready', handler)
window.addEventListener('genogram:change', handler)
window.addEventListener('genogram:save', handler)
```

**PostMessage Protocol:**
```javascript
// Parent → Iframe
{
  type: 'LOAD_DATA',
  payload: { people, relationships, ... }
}

// Iframe → Parent
{
  type: 'DATA_CHANGED',
  payload: { people, relationships, ... }
}

{
  type: 'REQUEST_SAVE',
  payload: { format: 'json' | 'svg' | 'png' }
}
```

### 6.2 Backend API

**Azure Functions:**
```
POST /api/feedback
  Body: { email, message, rating, userAgent }
  Response: { success: boolean, message: string }
```

**Future Endpoints (Planned):**
- Authentication (OAuth2)
- Data sync
- Team collaboration
- Template library
- Analytics aggregation

---

## 7. Development Workflow

### 7.1 Project Structure

```
genogram-builder/
├── public/              # Static assets
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── src-modern/      # Main application code
│   │   ├── components/  # React components
│   │   │   ├── Canvas/
│   │   │   ├── EditPanels/
│   │   │   ├── Shapes/
│   │   │   ├── UI/
│   │   │   ├── Dashboard/
│   │   │   └── Reports/
│   │   │
│   │   ├── contexts/    # Context providers
│   │   │   └── GenogramContext.js
│   │   │
│   │   ├── hooks/       # Custom hooks
│   │   │   ├── useKeyboardShortcuts.js
│   │   │   ├── useCanvasOperations.js
│   │   │   ├── useFileOperations.js
│   │   │   └── ...
│   │   │
│   │   ├── utils/       # Utility functions
│   │   │   ├── householdUtils.js
│   │   │   ├── geometry.js
│   │   │   └── ...
│   │   │
│   │   ├── styles/      # CSS files
│   │   └── pages/       # Route pages
│   │
│   ├── utils/           # Legacy utilities
│   ├── components/      # Legacy components
│   ├── App.js
│   └── index.js
│
├── api/                 # Azure Functions
│   ├── feedback/
│   │   ├── function.json
│   │   └── index.js
│   ├── host.json
│   └── package.json
│
├── build/               # Production build
├── scripts/             # Build/deploy scripts
├── package.json
└── README.md
```

### 7.2 Build & Deploy

**Development:**
```bash
npm install
npm start              # Run dev server (port 3000)
npm run build          # Production build
```

**Azure Functions:**
```bash
cd api
npm install
func start             # Local function host
```

**Deployment:**
- Frontend: Azure Static Web Apps
- Backend: Azure Functions
- Branch: `family-finder-a` (feature branch)
- Main: `main` branch

---

## 8. Accessibility (WCAG 2 AA Compliance)

**Current Status:** ~30% compliant

**Required Improvements:**

### 8.1 Critical Issues
1. Missing form labels (`<label>` or `aria-label`)
2. Clickable divs (should be `<button>`)
3. Color contrast (4.5:1 minimum)
4. Focus indicators (keyboard navigation)
5. Heading hierarchy (`<h1>`, `<h2>`, `<h3>`)

### 8.2 Implementation Plan
- Add `htmlFor` to all form labels
- Convert interactive divs to semantic buttons
- Fix color contrast for text
- Add `:focus-visible` styles globally
- Implement skip navigation links
- Add ARIA landmarks (`role="main"`, etc.)
- Canvas descriptions (`<title>`, `<desc>` in SVG)
- Modal focus trapping
- Live regions for status updates

### 8.3 Testing Requirements
- Keyboard-only navigation test
- NVDA/JAWS screen reader test
- Color contrast analyzer (WebAIM)
- axe DevTools (automated testing)
- WAVE tool (online scanner)

---

## 9. Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| **Ctrl+C** | Copy selected item |
| **Ctrl+V** | Paste from clipboard |
| **Ctrl+Z** | Undo |
| **Ctrl+Shift+Z** | Redo |
| **Ctrl+S** | Save |
| **Ctrl+O** | Open file |
| **Delete** | Delete selected item |
| **Escape** | Cancel/Close modal |
| **Tab** | Navigate to next item (by z-index) |
| **Shift+Tab** | Navigate to previous item |
| **Page Up** | Bring selected item to front |
| **Page Down** | Send selected item to back |
| **Alt+P** | Add person |
| **Alt+R** | Add relationship |
| **Alt+H** | Add household |
| **Alt+T** | Add text box |
| **Alt+F** | Fit to canvas |
| **Alt+A** | Auto-arrange |
| **Alt+G** | Toggle grid |
| **Space+Drag** | Pan canvas |

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Utility functions (`householdUtils.js`, `geometry.js`)
- Data transformations
- State reducer logic

### 10.2 Integration Tests
- Context provider behavior
- Hook interactions
- Component rendering

### 10.3 E2E Tests (Future)
- User workflows
- Canvas interactions
- Data persistence
- Export functions

### 10.4 Manual Testing Checklist
- [ ] Create person, edit attributes
- [ ] Create relationships (all types)
- [ ] Draw household, verify members
- [ ] Copy/paste items
- [ ] Undo/redo operations
- [ ] Z-index ordering
- [ ] Export PNG/SVG/PDF
- [ ] Save/load .geno files
- [ ] Keyboard navigation
- [ ] Mobile responsiveness
- [ ] Embed integration

---

## 11. Known Limitations & Future Enhancements

### 11.1 Current Limitations
1. No server-side data storage
2. No real-time collaboration
3. Limited accessibility compliance
4. No mobile app (web-only)
5. Canvas keyboard navigation limited
6. No version control for files
7. No template library

### 11.2 Planned Enhancements
1. **Authentication & User Accounts**
   - OAuth2 integration
   - Cloud storage sync
   - Multi-device access

2. **Collaboration Features**
   - Real-time editing
   - Comments/annotations
   - Share links
   - Permission management

3. **Advanced Analytics**
   - Pattern detection
   - Risk assessment
   - Predictive insights
   - Custom report builder

4. **Mobile Apps**
   - iOS native app
   - Android native app
   - Offline mode

5. **Integration Ecosystem**
   - Case management systems
   - Electronic health records
   - Court reporting tools
   - Social services platforms

6. **AI/ML Features**
   - Auto-suggest relationships
   - Data validation
   - Anomaly detection
   - Natural language queries

---

## 12. Compliance & Security

### 12.1 Data Protection
- **HIPAA Considerations:** Client-side only (no PHI transmission)
- **GDPR:** User controls all data, right to delete
- **COPPA:** No data collection from minors

### 12.2 Audit Trail
- Action history (undo stack)
- Export timestamps
- File metadata tracking

### 12.3 Security Recommendations
1. Use HTTPS in production
2. Implement CSP headers
3. Regular dependency updates
4. Security audit before 1.0 release
5. Penetration testing
6. Third-party security review

---

## 13. Support & Documentation

### 13.1 User Documentation
- In-app tutorial (TutorialModal)
- Help button with tooltips
- Keyboard shortcuts reference
- Video tutorials (planned)

### 13.2 Developer Documentation
- Code comments (JSDoc style)
- README files
- Architecture documents (this file)
- API documentation

### 13.3 Support Channels
- GitHub Issues
- Feedback form (in-app)
- Email support (planned)
- Community forum (planned)

---

## Appendix A: Glossary

- **Genogram:** A graphical representation of family relationships and medical history
- **Canvas:** The SVG drawing surface where genograms are rendered
- **Node:** A person or entity on the genogram
- **Edge:** A relationship line connecting nodes
- **Household:** A boundary shape grouping related people
- **Z-Index:** Layer ordering (which items appear in front/behind)
- **Snap to Grid:** Align items to 20px grid for clean layout
- **Ray Casting:** Algorithm to detect if point is inside polygon
- **Buffer Zone:** 15px invisible expansion of household boundary

---

## Appendix B: Version History

**Version 2.0** (October 2025)
- Z-index layer management
- Tab navigation
- Copy/paste functionality
- Household buffer zone (15px)
- Display Order UI controls

**Version 1.9** (September 2025)
- Household border customization
- Label positioning
- Improved member detection

**Version 1.8** (August 2025)
- Family Finder features
- Placement tracking
- Contact logging
- Analytics dashboard

**Version 1.5** (July 2025)
- Tablet interface
- Mobile responsiveness
- Embed mode enhancements

---

**End of Technical Architecture Document**

For questions or clarifications, contact the development team.
