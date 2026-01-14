# Genogram Person Entity Schema

Complete schema for the Person entity in the Genogram Builder application. This schema represents the current implementation and includes recommendations for future growth.

## Core Schema Structure

```typescript
interface Person {
  // ============================================
  // REQUIRED CORE FIELDS
  // ============================================
  id: string;                    // Unique identifier (generated: timestamp + random)
  type: 'person';                 // Node type identifier (always 'person' for Person entities)
  name: string;                   // Full name (display name)
  
  // ============================================
  // IDENTITY & DEMOGRAPHICS
  // ============================================
  firstName?: string;             // First/given name (optional, can be derived from name)
  lastName?: string;              // Last/family name (optional, can be derived from name)
  maidenName?: string;            // Maiden name (typically for married women)
  
  gender: string;                 // Gender identity (see Gender Values below)
  sexualOrientation?: string;      // Sexual orientation (see SexualOrientation Values below)
  
  // ============================================
  // LIFE EVENTS & DATES
  // ============================================
  birthDate?: string;             // ISO date string (YYYY-MM-DD) or empty string
  dateOfBirth?: string;           // Alternative field name (ISO date string)
  age?: number | string;          // Age in years (can be calculated from birthDate/deathDate)
  
  isDeceased: boolean;             // Whether person is deceased (default: false)
  deathDate?: string;             // ISO date string (YYYY-MM-DD) or empty string
  dateOfDeath?: string;           // Alternative field name (ISO date string)
  
  deceasedSymbol?: string;        // Symbol for deceased person (see DeceasedSymbol Values below)
  deceasedGentleTreatment?: string; // Gentle treatment option (see DeceasedGentleTreatment Values below)
  
  // ============================================
  // PREGNANCY INFORMATION
  // ============================================
  isPregnant?: boolean;           // Currently pregnant (only applicable for non-male genders)
  dueDate?: string;               // Expected due date (ISO date string)
  gestationalWeeks?: number;      // Weeks of pregnancy (0-42)
  pregnancyNotes?: string;         // Notes about pregnancy
  
  // ============================================
  // SPECIAL STATUS
  // ============================================
  specialStatus?: string | null;  // Special family status (see SpecialStatus Values below)
  
  // ============================================
  // VISUAL & DISPLAY PROPERTIES
  // ============================================
  x: number;                      // X coordinate on canvas (required for positioning)
  y: number;                      // Y coordinate on canvas (required for positioning)
  zIndex?: number;                // Display order/layer (higher = on top, default: 0)
  
  shape?: string;                 // Shape override (see Shape Values below)
  color?: string;                 // Color override (hex color code, e.g., "#3b82f6")
  size?: number;                  // Size override (pixels, typically 25-40)
  
  generation?: number;             // Generation level (0 = root generation, negative = older, positive = younger)
  
  // ============================================
  // NETWORK MEMBER FIELDS
  // ============================================
  networkMember?: boolean;        // Whether person is a network member (non-family, e.g., caseworker, therapist)
  role?: string;                  // Role/title (e.g., "Therapist", "Case Worker", "Teacher")
  networkNotes?: string;          // Notes specific to network members
  
  // ============================================
  // NOTES & DOCUMENTATION
  // ============================================
  notes?: string;                 // General notes (plain text)
  notesRichText?: string;         // Rich text formatted notes (HTML or markdown)
  caseNotes?: string;             // Case-specific notes (legacy field, consider using notes or caseLog)
  
  // ============================================
  // CONTACT INFORMATION
  // ============================================
  contactInfo?: {
    phones?: Array<{
      id: number | string;        // Unique identifier for this phone entry
      type: 'mobile' | 'home' | 'work' | 'other';
      number: string;              // Phone number
      notes?: string;              // Additional notes (e.g., "best time to call", "preferred contact")
    }>;
    emails?: Array<{
      id: number | string;        // Unique identifier for this email entry
      type: 'personal' | 'work' | 'other';
      address: string;            // Email address
      notes?: string;              // Additional notes
    }>;
    addresses?: Array<{
      id: number | string;        // Unique identifier for this address entry
      type: 'home' | 'work' | 'previous' | 'other';
      street?: string;            // Street address
      city?: string;              // City
      state?: string;             // State/province
      zip?: string;               // ZIP/postal code
      notes?: string;              // Additional notes
    }>;
  };
  
  // ============================================
  // CASE LOG / ACTIVITY LOG
  // ============================================
  caseLog?: Array<{
    id: number | string;          // Unique identifier for log entry
    date: string;                 // ISO date string (YYYY-MM-DD)
    type: 'note' | 'phone' | 'email' | 'visit' | 'meeting' | 'assessment';
    subject?: string;             // Brief subject/title
    details?: string;              // Detailed notes
    worker?: string;               // Worker/staff name who created entry
  }>;
  
  // ============================================
  // TAGS SYSTEM
  // ============================================
  tags?: string[];               // Array of tag IDs (references to tagDefinitions)
  
  // ============================================
  // CHILD WELFARE CASE MANAGEMENT
  // ============================================
  careStatus?: string;            // Care status (see CareStatus Values below)
  caseData?: {
    removalDate?: string | null;  // Date child was removed (ISO date string)
    caseGoal?: string | null;     // Permanency goal (see CaseGoal Values below)
    permanencyTimeline?: string | null; // Target permanency date (ISO date string)
    caseworker?: string;           // Assigned caseworker name
    caseNumber?: string;          // Case number identifier
  };
  
  // ============================================
  // FOSTER CARE CAREGIVER INFORMATION
  // ============================================
  fosterCareStatus?: string;      // Foster care status (see FosterCareStatus Values below)
  fosterCareData?: {
    licenseNumber?: string;       // Foster care license number
    licenseExpiration?: string | null; // License expiration date (ISO date string)
    licenseType?: string | null;  // License type (see LicenseType Values below)
    maxChildren?: number | null;  // Maximum capacity (typically 1-10)
    currentChildren?: number;    // Current number of placements (default: 0)
    ageRangeMin?: number | null;  // Minimum age preference (0-21)
    ageRangeMax?: number | null;  // Maximum age preference (0-21)
    specialNeeds?: boolean;       // Able to care for children with special needs
    notes?: string;                // Additional notes about foster care capacity
  };
  
  // ============================================
  // EXTENSIBILITY & CUSTOM DATA
  // ============================================
  typeData?: Record<string, any>; // Flexible object for type-specific custom data
  contacts?: any[];               // Legacy contacts array (deprecated, use contactInfo)
}
```

## Enum Values

### Gender Values
```typescript
type Gender = 
  | 'male'              // Male (Square shape)
  | 'female'            // Female (Circle shape)
  | 'non-binary'        // Non-Binary (Diamond shape)
  | 'transgender-male'  // Transgender Male
  | 'transgender-female' // Transgender Female
  | 'genderfluid'       // Genderfluid (Triangle shape)
  | 'agender'           // Agender (Hexagon shape)
  | 'unknown';          // Unknown (Question mark)
```

### SexualOrientation Values
```typescript
type SexualOrientation =
  | 'not-specified'     // Default/not specified
  | 'heterosexual'
  | 'gay'
  | 'lesbian'
  | 'bisexual'
  | 'pansexual'
  | 'asexual'
  | 'queer'
  | 'questioning'
  | 'other';
```

### SpecialStatus Values
```typescript
type SpecialStatus =
  | null                // No special status
  | 'adopted'           // Adopted child
  | 'foster'            // Foster child
  | 'unborn';           // Unborn/Fetus
```

### DeceasedSymbol Values
```typescript
type DeceasedSymbol =
  // Gentle Treatments
  | 'none'              // Standard (no symbol)
  | 'soft-outline'      // Soft dashed outline
  
  // Light & Celestial
  | 'halo'              // Halo above (default)
  | 'star'              // Star above
  | 'sparkle'           // Sparkle above
  
  // Remembrance Badges
  | 'classic-x'         // X through symbol
  | 'heart'             // Heart badge
  | 'flower'            // Flower badge
  | 'butterfly'         // Butterfly badge
  | 'ribbon'            // Ribbon badge
  | 'candle'            // Candle badge
  | 'angel'             // Angel wings badge
  | 'infinity'          // Infinity symbol
  
  // Faith & Spiritual
  | 'cross'             // Christian cross
  | 'praying-hands'     // Praying hands
  | 'crescent-star'      // Islamic crescent and star
  | 'star-of-david'     // Jewish Star of David
  | 'dharma-wheel';     // Buddhist dharma wheel
```

### DeceasedGentleTreatment Values
```typescript
type DeceasedGentleTreatment =
  | 'none'              // No gentle treatment
  | 'soft-outline';     // Soft dashed outline
```

### CareStatus Values
```typescript
type CareStatus =
  | 'not_applicable'    // Not involved in child welfare system
  | 'at_risk'           // Child at risk, receiving preventive services
  | 'needs_placement'   // Child requires immediate placement
  | 'in_care';          // Child currently in state custody
```

### CaseGoal Values
```typescript
type CaseGoal =
  | 'reunification'     // Goal: Return to biological parents
  | 'adoption'          // Goal: Adoption
  | 'guardianship'      // Goal: Legal guardianship
  | 'appla'             // Another Planned Permanent Living Arrangement
  | 'emancipation';     // Goal: Emancipation (for older youth)
```

### FosterCareStatus Values
```typescript
type FosterCareStatus =
  | 'not_applicable'    // Not a foster care resource
  | 'interested'        // Expressed interest in becoming foster parent
  | 'in_process'        // Licensing application in progress
  | 'licensed'         // Licensed and available for placement
  | 'active'           // Currently caring for foster child(ren)
  | 'inactive';        // License inactive or expired
```

### LicenseType Values
```typescript
type LicenseType =
  | 'foster'           // Standard Foster Care
  | 'fost_adopt'       // Foster-to-Adopt
  | 'respite'          // Respite Care
  | 'kinship'          // Kinship/Relative Care
  | 'therapeutic';     // Therapeutic Foster Care
```

### Shape Values
```typescript
type Shape =
  | 'person-gendered'   // Default (based on gender)
  | 'square'            // Square (typically male)
  | 'circle'            // Circle (typically female)
  | 'diamond'           // Diamond (non-binary)
  | 'triangle'         // Triangle (genderfluid)
  | 'hexagon'           // Hexagon (agender)
  | 'rounded-rect';    // Rounded rectangle (organizations)
```

## Default Values

When creating a new Person, these defaults are applied:

```typescript
{
  id: generateId(),                    // timestamp + random string
  name: `Person ${people.length + 1}`, // Default name
  type: 'person',
  gender: 'female',                    // Default gender
  age: '',                             // Empty string
  birthDate: '',                       // Empty string
  deathDate: '',                       // Empty string
  deceasedSymbol: 'halo',             // Default deceased symbol
  deceasedGentleTreatment: 'none',     // Default gentle treatment
  isDeceased: false,
  x: 300 + Math.random() * 200,        // Random position
  y: 200 + Math.random() * 200,        // Random position
  generation: 0,                       // Root generation
  specialStatus: null,
  sexualOrientation: 'not-specified',
  networkMember: false,
  role: '',
  notes: '',
  notesRichText: '',
  caseLog: [],
  tags: [],
  contactInfo: {
    phones: [],
    emails: [],
    addresses: []
  },
  careStatus: 'not_applicable',
  caseData: {
    removalDate: null,
    caseGoal: null,
    permanencyTimeline: null,
    caseworker: '',
    caseNumber: ''
  },
  fosterCareStatus: 'not_applicable',
  fosterCareData: {
    licenseNumber: '',
    licenseExpiration: null,
    licenseType: null,
    maxChildren: null,
    currentChildren: 0,
    ageRangeMin: null,
    ageRangeMax: null,
    specialNeeds: false,
    notes: ''
  }
}
```

## Field Relationships & Dependencies

1. **Age Calculation**: `age` can be calculated from `birthDate` and `deathDate` (if `isDeceased` is true). If `birthDate` is provided, age should be recalculated when `deathDate` changes.

2. **Pregnancy Fields**: `isPregnant`, `dueDate`, `gestationalWeeks`, and `pregnancyNotes` are only applicable when `gender !== 'male'`.

3. **Deceased Fields**: `deathDate`, `deceasedSymbol`, and `deceasedGentleTreatment` are only relevant when `isDeceased === true`.

4. **Case Data**: `caseData` fields are primarily relevant when `careStatus` is `'in_care'` or `'needs_placement'`.

5. **Foster Care Data**: `fosterCareData` fields are relevant when `fosterCareStatus` is `'licensed'`, `'active'`, or `'in_process'`.

6. **Network Member**: When `networkMember === true`, `role` and `networkNotes` become more relevant.

7. **Child Welfare Age Restriction**: Child welfare status options (`careStatus`, `caseData`) are typically not applicable for individuals over 26 years old.

## Future Considerations & Recommendations

### Recommended Additions

1. **Name Variations**
   ```typescript
   preferredName?: string;        // Nickname or preferred name
   middleName?: string;         // Middle name
   suffix?: string;             // Name suffix (Jr., Sr., III, etc.)
   previousNames?: string[];    // Previous names (e.g., after marriage)
   ```

2. **Extended Demographics**
   ```typescript
   ethnicity?: string[];        // Array of ethnicities
   race?: string[];             // Array of races
   languages?: string[];        // Languages spoken
   religion?: string;           // Religious affiliation
   ```

3. **Medical & Health Information**
   ```typescript
   medicalConditions?: Array<{
     id: string;
     condition: string;
     diagnosisDate?: string;
     notes?: string;
   }>;
   medications?: Array<{
     id: string;
     name: string;
     dosage?: string;
     notes?: string;
   }>;
   allergies?: string[];
   ```

4. **Education & Employment**
   ```typescript
   education?: {
     highestLevel?: string;     // e.g., "high-school", "bachelors", "masters"
     currentSchool?: string;
     grade?: string;
   };
   employment?: {
     employer?: string;
     position?: string;
     status?: 'employed' | 'unemployed' | 'retired' | 'student';
   };
   ```

5. **Legal & Documentation**
   ```typescript
   legalStatus?: {
     citizenship?: string;
     immigrationStatus?: string;
     ssn?: string;              // Social Security Number (encrypted)
     driverLicense?: string;
   };
   ```

6. **Extended Contact Methods**
   ```typescript
   contactInfo: {
     // ... existing fields
     socialMedia?: Array<{
       platform: string;        // e.g., "facebook", "instagram", "twitter"
       username: string;
       url?: string;
     }>;
     emergencyContacts?: Array<{
       name: string;
       relationship: string;
       phone: string;
       priority: number;
     }>;
   };
   ```

7. **Relationships Metadata**
   ```typescript
   relationshipMetadata?: {
     primaryGuardian?: string;  // Person ID
     legalGuardian?: string[];  // Array of Person IDs
     emergencyContacts?: string[]; // Array of Person IDs
   };
   ```

8. **Timeline & History**
   ```typescript
   timeline?: Array<{
     id: string;
     date: string;
     event: string;
     description?: string;
     type: 'birth' | 'death' | 'marriage' | 'divorce' | 'placement' | 'other';
   }>;
   ```

9. **Privacy & Permissions**
   ```typescript
   privacy?: {
     shareWithFamily?: boolean;
     shareWithCaseworkers?: boolean;
     dataRetentionPolicy?: string;
     consentDate?: string;
   };
   ```

10. **Attachments & Media**
    ```typescript
    attachments?: Array<{
      id: string;
      type: 'photo' | 'document' | 'video' | 'audio';
      url: string;
      thumbnail?: string;
      uploadedAt: string;
      uploadedBy?: string;
    }>;
    ```

11. **Metadata & Audit**
    ```typescript
    metadata?: {
      createdAt: string;        // ISO timestamp
      createdBy?: string;       // User ID
      updatedAt: string;        // ISO timestamp
      updatedBy?: string;       // User ID
      version?: number;         // Version number for optimistic locking
      source?: string;          // Data source (e.g., "manual", "import", "api")
    };
    ```

12. **Search & Discovery**
    ```typescript
    discovery?: {
      source?: string;          // How person was discovered
      discoveredDate?: string;
      verified?: boolean;
      verificationDate?: string;
      verificationMethod?: string;
    };
    ```

13. **Custom Attributes**
    ```typescript
    customAttributes?: Record<string, any>; // Flexible key-value store for custom fields
    ```

### Data Validation Rules

1. **Date Validation**
   - `birthDate` should be a valid ISO date string (YYYY-MM-DD)
   - `deathDate` should be after `birthDate` if both are provided
   - `dueDate` should be in the future if `isPregnant === true`

2. **Age Validation**
   - `age` should be a positive number or empty string
   - If `birthDate` is provided, `age` should match calculated age

3. **Required Fields**
   - `id`, `name`, `type`, `gender`, `x`, `y` are required
   - All other fields are optional

4. **Enum Validation**
   - `gender`, `sexualOrientation`, `careStatus`, etc. should match valid enum values

5. **Contact Validation**
   - Email addresses should be valid email format
   - Phone numbers should follow a consistent format
   - Addresses should have at least city and state if provided

### Performance Considerations

1. **Indexing**: Consider indexing on:
   - `id` (primary key)
   - `name` (for search)
   - `tags` (for filtering)
   - `careStatus` (for child welfare queries)
   - `fosterCareStatus` (for resource queries)

2. **Normalization**: Consider normalizing:
   - Contact information (separate table)
   - Case log entries (separate table with foreign key)
   - Tags (many-to-many relationship)

3. **Caching**: Consider caching:
   - Calculated age values
   - Relationship counts
   - Tag memberships

## Example Person Object

```json
{
  "id": "person-12345",
  "type": "person",
  "name": "Emily Wilson",
  "firstName": "Emily",
  "lastName": "Wilson",
  "gender": "female",
  "sexualOrientation": "not-specified",
  "birthDate": "2010-03-22",
  "age": 15,
  "isDeceased": false,
  "x": 100,
  "y": 400,
  "zIndex": 0,
  "generation": 2,
  "specialStatus": null,
  "networkMember": false,
  "notes": "High school sophomore. Excellent student despite family challenges.",
  "tags": ["foster-care", "honors-student", "therapy"],
  "contactInfo": {
    "phones": [
      {
        "id": "phone-1",
        "type": "mobile",
        "number": "555-0123",
        "notes": "Preferred contact method"
      }
    ],
    "emails": [],
    "addresses": []
  },
  "caseLog": [
    {
      "id": "log-1",
      "date": "2025-10-17",
      "type": "visit",
      "subject": "Weekly therapy session",
      "details": "Emily expressing desire to return home.",
      "worker": "Jessica Rodriguez"
    }
  ],
  "careStatus": "in_care",
  "caseData": {
    "removalDate": "2024-03-15",
    "caseGoal": "reunification",
    "permanencyTimeline": "2026-03-15",
    "caseworker": "Jessica Rodriguez",
    "caseNumber": "2024-WF-1234"
  },
  "fosterCareStatus": "not_applicable"
}
```

## Relationships Schema

Relationships connect people in the genogram. There are two main types: **parent relationships** (between two people) and **child relationships** (connecting children to parent relationships).

### Parent Relationship Schema

```typescript
interface Relationship {
  // ============================================
  // REQUIRED CORE FIELDS
  // ============================================
  id: string;                      // Unique identifier
  type: string;                   // Relationship type (see RelationshipType Values below)
  from: string;                   // Person ID (first person)
  to: string;                     // Person ID (second person)
  
  // ============================================
  // STATUS & TIMELINE
  // ============================================
  status?: 'active' | 'ended';    // Relationship status (default: 'active')
  startDate?: string;              // ISO date string (YYYY-MM-DD) - when relationship began
  endDate?: string;                // ISO date string (YYYY-MM-DD) - when relationship ended (if ended)
  
  // ============================================
  // CHILDREN (for parent relationships)
  // ============================================
  children?: string[];             // Array of Person IDs who are children of this relationship
  childOrder?: Record<string, number>; // Map of child Person ID to birth order (0-based)
  
  // ============================================
  // VISUAL PROPERTIES
  // ============================================
  color?: string;                  // Line color (hex code, e.g., "#ec4899")
  lineStyle?: string;              // Line style ('solid' | 'dashed' | 'dotted' | 'default')
  showBadge?: boolean;            // Whether to show relationship badge/label
  
  // ============================================
  // ATTRIBUTES & METADATA
  // ============================================
  attributes?: string[];           // Array of relationship attribute IDs (see RelationshipAttributes below)
  notes?: string;                  // Notes about the relationship
  
  // ============================================
  // EXTENSIBILITY
  // ============================================
  metadata?: Record<string, any>;  // Additional custom metadata
}
```

### Child Relationship Schema

Child relationships connect children to their parent relationships. They have a special structure:

```typescript
interface ChildRelationship {
  id: string;                      // Unique identifier
  type: 'child';                   // Always 'child' for child relationships
  from: string;                    // Parent Relationship ID (references Relationship.id)
  to: string;                      // Child Person ID
  
  color?: string;                  // Line color (inherited from parent relationship)
  lineStyle?: string;              // Line style ('default' | 'dashed' | 'dotted')
  startDate?: string;              // ISO date string - when child relationship began
  endDate?: string;                // ISO date string - when child relationship ended (e.g., adoption)
  isActive?: boolean;              // Whether relationship is currently active (default: true)
  notes?: string;                  // Notes about the child relationship
}
```

### RelationshipType Values

```typescript
type RelationshipType =
  // 💕 Romantic Relationships
  | 'marriage'              // Legal marriage or committed partnership
  | 'engagement'            // Engaged to be married
  | 'cohabitation'          // Living together unmarried
  | 'partner'               // Romantic partner
  | 'dating'                // Dating relationship
  | 'love-affair'           // Romantic affair
  | 'secret-affair'         // Secret romantic relationship
  | 'single-encounter'      // One-time romantic or intimate encounter
  
  // 💔 Ended Relationships
  | 'separation'            // Separated but not divorced
  | 'divorce'               // Legally divorced
  | 'nullity'               // Marriage annulled
  | 'widowed'               // Spouse deceased
  
  // 👨‍👩‍👧‍👦 Family Relationships
  | 'sibling'               // Brother or sister relationship
  | 'adoption'              // Adopted child relationship
  | 'step-relationship'    // Step-family relationship
  
  // 🧠 Emotional Relationships
  | 'close'                // Very close emotional bond
  | 'distant'              // Emotionally distant or estranged
  | 'conflict'              // Frequent conflict or tension
  | 'cutoff'                // No contact or communication
  | 'fused'                // Enmeshed or overly close
  | 'indifferent'          // Apathetic or neutral
  | 'hostile'              // Openly hostile or aggressive
  | 'hate'                 // Strong negative feelings
  | 'best-friends'         // Very close friendship
  | 'love'                 // Strong loving bond
  
  // ⚡ Complex Dynamics
  | 'toxic'                // Harmful or destructive relationship
  | 'on-off'               // Unstable, breaks up and reunites
  | 'complicated'          // Complex, hard to define
  | 'dependency'           // One person dependent on other
  | 'codependent'          // Mutually dependent in unhealthy way
  | 'manipulative'         // One person manipulates the other (directional)
  | 'supportive'           // Healthy supportive relationship
  | 'competitive'          // Competitive dynamic between parties
  
  // 🚨 Social Services
  | 'abusive'              // Physical, emotional, or other abuse
  | 'protective'           // One person protects the other
  | 'caregiver'            // Caregiving relationship
  | 'financial-dependency' // Financial dependence
  | 'supervised-contact';  // Contact requires supervision
```

### Parent Relationship Types (Can Have Children)

Not all relationship types can have children. The following types can have child relationships:

```typescript
const PARENT_RELATIONSHIP_TYPES = [
  // Romantic relationships
  'marriage', 'partner', 'cohabitation', 'engagement', 'dating',
  'love-affair', 'secret-affair', 'single-encounter',
  
  // Ended relationships (can still have children from when together)
  'divorce', 'separation', 'nullity', 'widowed',
  
  // Complex dynamics
  'complicated', 'on-off', 'toxic', 'dependency', 'codependent',
  
  // Special family relationships
  'adoption', 'step-relationship',
  
  // Emotional relationships that might have children
  'close', 'love', 'best-friends',
  
  // Social services relationships
  'caregiver', 'supportive'
];
```

### Relationship Attributes

Relationships can have multiple attributes that provide additional context:

```typescript
type RelationshipAttribute =
  // ⚠️ Safety & Risk
  | 'violent'              // Violent relationship
  | 'abusive'              // Abusive relationship
  | 'controlling'          // Controlling behavior
  | 'manipulative'         // Manipulative behavior
  | 'neglectful'           // Neglectful relationship
  
  // 💚 Positive Dynamics
  | 'supportive'           // Supportive relationship
  | 'protective'           // Protective relationship
  | 'nurturing'            // Nurturing relationship
  | 'loving'               // Loving relationship
  | 'close'                // Close relationship
  
  // ⚠️ Negative Dynamics (non-violent)
  | 'toxic'                // Toxic relationship
  | 'conflictual'          // Conflictual relationship
  | 'distant'              // Distant relationship
  | 'hostile'              // Hostile relationship
  | 'codependent'          // Codependent relationship
  
  // ⚖️ Power Dynamics
  | 'dominant'             // Dominant partner
  | 'submissive'           // Submissive partner
  | 'financial-control'    // Financial control
  | 'emotional-dependency' // Emotional dependency
  
  // 💬 Communication
  | 'poor-communication'   // Poor communication
  | 'open'                 // Open communication
  | 'avoidant'             // Avoidant communication
  
  // 👨‍⚕️ Professional/Supervised
  | 'supervised'           // Supervised contact
  | 'court-ordered'        // Court ordered
  | 'therapeutic';         // Therapeutic relationship
```

### Relationship Default Values

```typescript
{
  id: generateId(),
  type: 'marriage',              // Default relationship type
  from: person1Id,
  to: person2Id,
  status: 'active',              // Default status
  children: [],                  // Empty array
  childOrder: {},                // Empty object
  color: '#ec4899',             // Default color (pink for marriage)
  lineStyle: 'default',
  showBadge: false,
  attributes: [],
  notes: ''
}
```

## Placements Schema

Placements represent child welfare placements (foster care, kinship care, etc.):

```typescript
interface Placement {
  id: string;                    // Unique identifier
  personId: string;               // Child Person ID
  caregiverId?: string;           // Caregiver Person ID (optional, may be multiple caregivers)
  
  type: 'foster' | 'kinship' | 'group-home' | 'residential' | 'adoption' | 'guardianship';
  
  // Location Information
  address?: string;               // Street address
  city?: string;                  // City
  state?: string;                 // State/province
  zip?: string;                   // ZIP/postal code
  
  // Provider Information
  providerName?: string;          // Name of provider/caregiver
  providerContact?: string;       // Contact information
  
  // Timeline
  startDate?: string;             // ISO date string - placement start date
  endDate?: string;              // ISO date string - placement end date (if ended)
  isActive: boolean;              // Whether placement is currently active
  
  // Case Management
  placementStatus?: string;       // See PlacementStatus Values below
  reason?: string;                // Reason for placement
  notes?: string;                 // Additional notes
  
  // Metadata
  caseNumber?: string;            // Associated case number
  caseworker?: string;            // Assigned caseworker
}
```

### PlacementStatus Values

```typescript
type PlacementStatus =
  | 'not_applicable'        // Not a placement option
  | 'potential_temporary'   // Being evaluated for temporary placement
  | 'potential_permanent'  // Being evaluated for permanent placement
  | 'current_temporary'    // Child currently in temporary placement
  | 'current_permanent'    // Child currently in permanent placement
  | 'ruled_out';           // Determined unsuitable for placement
```

## Households Schema

Households represent groups of people living together (foster homes, kinship homes, etc.):

```typescript
interface Household {
  id: string;                    // Unique identifier
  name: string;                   // Household name/label
  
  // Visual Properties
  points: Array<{                // Array of points defining polygon boundary
    x: number;
    y: number;
  }>;
  zIndex?: number;               // Display order/layer
  borderStyle?: 'straight' | 'curved'; // Border style
  smoothness?: number;           // Smoothness factor (0-1) for curved borders
  color?: string;                // Border color (hex code)
  labelColor?: string;           // Label text color
  labelPosition?: 'top' | 'bottom' | 'left' | 'right'; // Label position
  
  // Members
  members?: string[];             // Array of Person IDs in this household (calculated automatically)
  
  // Metadata
  notes?: string;                // Notes about the household
  type?: string;                 // Household type (e.g., 'foster-home', 'kinship-home', 'group-home')
}
```

## Complete Genogram Data Structure

The complete genogram file structure includes all entities:

```typescript
interface GenogramData {
  version: string;                // Schema version (e.g., "2.0")
  
  metadata?: {
    created?: string;            // ISO timestamp
    modified?: string;            // ISO timestamp
    author?: string;             // Author name
    description?: string;        // Description
    caseId?: string;             // Case identifier
  };
  
  people: Person[];              // Array of all people
  relationships: Relationship[]; // Array of all relationships (parent relationships)
  placements?: Placement[];      // Array of all placements
  households?: Household[];      // Array of all households
  textBoxes?: TextBox[];         // Array of text boxes (for annotations)
  
  // Tag System
  tagDefinitions?: Array<{
    id: string;
    name: string;
    color: string;               // Hex color code
    category?: string;           // Category (e.g., 'status', 'role', 'concern')
    description?: string;
  }>;
  
  // Search & Filter
  searchHistory?: Array<{
    id: string;
    filters: Record<string, any>;
    timestamp: string;
  }>;
  
  filterTemplates?: Array<{
    id: string;
    name: string;
    description?: string;
    filters: Record<string, any>;
    createdAt?: string;
    usageCount?: number;
  }>;
  
  // Custom Attributes
  customAttributes?: Record<string, any>;
}
```

## Relationship Examples

### Example 1: Marriage with Children

```json
{
  "id": "rel-parents",
  "type": "marriage",
  "from": "dad-robert",
  "to": "mom-jennifer",
  "status": "active",
  "startDate": "2005-08-20",
  "children": ["child-emily", "child-michael", "child-sophia"],
  "childOrder": {
    "child-emily": 0,
    "child-michael": 1,
    "child-sophia": 2
  },
  "color": "#ec4899",
  "showBadge": true,
  "notes": "Married couple with three children"
}
```

### Example 2: Divorced Relationship

```json
{
  "id": "rel-parents-divorced",
  "type": "divorce",
  "from": "dad-robert",
  "to": "mom-jennifer",
  "status": "ended",
  "startDate": "2005-08-20",
  "endDate": "2020-03-15",
  "children": ["child-emily", "child-michael", "child-sophia"],
  "childOrder": {
    "child-emily": 0,
    "child-michael": 1,
    "child-sophia": 2
  },
  "color": "#dc2626",
  "showBadge": true,
  "notes": "Divorced but co-parenting"
}
```

### Example 3: Child Relationship

```json
{
  "id": "rel-child-emily",
  "type": "child",
  "from": "rel-parents",
  "to": "child-emily",
  "color": "#ec4899",
  "lineStyle": "default",
  "isActive": true
}
```

### Example 4: Relationship with Attributes

```json
{
  "id": "rel-sibling",
  "type": "sibling",
  "from": "person-1",
  "to": "person-2",
  "status": "active",
  "attributes": ["close", "supportive"],
  "notes": "Very close siblings, supportive relationship"
}
```

### Example 5: Placement

```json
{
  "id": "placement-emily-foster",
  "personId": "child-emily",
  "caregiverId": "foster-parent-karen",
  "type": "foster",
  "address": "1234 Oak Street",
  "city": "Springfield",
  "state": "IL",
  "startDate": "2024-03-15",
  "providerName": "Karen Thompson",
  "providerContact": "555-0123",
  "notes": "Therapeutic foster placement",
  "isActive": true,
  "reason": "Parent substance abuse and mental health crisis",
  "placementStatus": "current_temporary"
}
```

## Relationship Rules & Constraints

1. **Child Relationships**: 
   - `type` must be `'child'`
   - `from` must reference a parent Relationship ID (not a Person ID)
   - `to` must reference a Person ID (the child)
   - Only parent relationships (see PARENT_RELATIONSHIP_TYPES) can have child relationships

2. **Parent Relationships**:
   - `from` and `to` must both be Person IDs
   - `type` cannot be `'child'`
   - Can have multiple children via child relationships

3. **Status**:
   - `status: 'ended'` relationships can still have children (from when they were together)
   - `endDate` should be provided when `status: 'ended'`

4. **Child Order**:
   - `childOrder` maps child Person IDs to birth order (0-based)
   - Used for visual ordering of children

5. **Directional Relationships**:
   - Most relationships are bidirectional
   - `manipulative` is directional (from manipulator to manipulated)

## Migration Notes

When migrating from older versions:

1. **Legacy Fields**: `dateOfBirth` and `dateOfDeath` may exist alongside `birthDate` and `deathDate`. Prefer the newer field names.

2. **Contacts Array**: Old `contacts` array should be migrated to `contactInfo` structure.

3. **Case Notes**: `caseNotes` field can be migrated to `notes` or `caseLog` entries.

4. **Name Parsing**: If only `name` exists, consider parsing into `firstName` and `lastName` if needed.

5. **Default Values**: Ensure all optional fields have proper defaults when loading legacy data.

6. **Child Relationships**: Older versions may store children directly in parent relationships. Migrate to separate child relationship records.

## API Integration Considerations

When integrating with external APIs or building a backend:

1. **Field Mapping**: Map between internal schema and external API formats
2. **Validation**: Validate all enum values and date formats
3. **Privacy**: Encrypt sensitive fields (SSN, medical info) at rest
4. **Audit Trail**: Track all changes to person and relationship data
5. **Permissions**: Implement field-level permissions (who can edit what)
6. **Versioning**: Consider versioning records for history tracking
7. **Soft Deletes**: Consider soft delete pattern rather than hard deletes
8. **Referential Integrity**: Ensure Person IDs referenced in relationships exist
9. **Cascading Deletes**: Define behavior when a Person is deleted (should relationships be deleted or orphaned?)
10. **Graph Traversal**: Consider indexing for efficient relationship queries (find all descendants, ancestors, etc.)

