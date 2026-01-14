// networkSearchService.js - Mock Azure Network Search Service
// Simulates searching external databases for potential family connections

import { getSourceById } from './searchSources';

const GILMORE_SOURCE_ID = 'gilmore-girls-demo';

export const MOCK_DATABASE_SOURCES = [
  { id: 'vital-records', name: 'State Vital Records', icon: '📋' },
  { id: 'census', name: 'Census Data', icon: '📊' },
  { id: 'child-welfare', name: 'Child Welfare System', icon: '👶' },
  { id: 'court-records', name: 'Court Records', icon: '⚖️' },
  { id: 'social-services', name: 'Social Services', icon: '🤝' },
  { id: 'school-records', name: 'School Records', icon: '🎓' },
  { id: GILMORE_SOURCE_ID, name: 'Stars Hollow Community Network', icon: '🌟' }
];

export const RELATIONSHIP_TYPES = [
  'Parent', 'Child', 'Sibling', 'Grandparent', 'Grandchild',
  'Aunt/Uncle', 'Niece/Nephew', 'Cousin', 'Spouse/Partner',
  'Family Friend', 'Support Network', 'Community Partner', 'Mentor', 'Educator'
];

// Generate realistic mock names
const FIRST_NAMES = {
  male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'],
  female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen']
};

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

const CITIES = [
  'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth'
];

const STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];

const RELIGIONS = [
  'Christian', 'Christian', 'Christian', // More common
  'Catholic', 'Catholic',
  'Non-denominational', 'Non-denominational',
  'Baptist', 'Methodist', 'Lutheran',
  'Jewish', 'Muslim', 'Hindu', 'Buddhist',
  'Spiritual but not religious',
  'No religious affiliation',
  'Prefer not to say'
];

const LANGUAGES = [
  ['English'],
  ['English'],
  ['English'],
  ['English', 'Spanish'],
  ['English', 'Spanish'],
  ['Spanish', 'English'],
  ['English', 'Mandarin'],
  ['English', 'French'],
  ['English', 'Vietnamese'],
  ['English', 'Arabic'],
  ['English', 'Tagalog'],
  ['English', 'Korean'],
  ['English', 'German'],
  ['English', 'Russian'],
  ['Spanish'],
  ['Mandarin', 'English']
];

// Generate a random person record
function generateMockPerson(basePerson, relationshipType) {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = FIRST_NAMES[gender][Math.floor(Math.random() * FIRST_NAMES[gender].length)];
  const lastName = relationshipType.includes('Parent') || relationshipType.includes('Sibling')
    ? basePerson.name.split(' ').pop() // Same last name for parents/siblings
    : LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  
  const age = basePerson.age
    ? (() => {
        const baseAge = parseInt(basePerson.age, 10);
        switch (relationshipType) {
          case 'Parent': 
            return Math.min(60, baseAge + 25 + Math.floor(Math.random() * 20));
          case 'Child': 
            return Math.max(0, baseAge - 25 - Math.floor(Math.random() * 15));
          case 'Sibling': 
            return Math.max(20, baseAge + Math.floor(Math.random() * 15) - 7);
          case 'Grandparent': 
            return Math.min(75, baseAge + 45 + Math.floor(Math.random() * 20));
          case 'Grandchild': 
            return Math.max(0, baseAge - 50 - Math.floor(Math.random() * 15));
          case 'Spouse/Partner': 
            return baseAge + Math.floor(Math.random() * 6) - 3;
          case 'Aunt/Uncle':
            return Math.min(55, baseAge + 15 + Math.floor(Math.random() * 20));
          case 'Cousin':
            return Math.max(20, Math.min(55, baseAge + Math.floor(Math.random() * 20) - 10));
          default: 
            return Math.max(25, Math.min(55, baseAge + Math.floor(Math.random() * 20) - 10));
        }
      })()
    : Math.floor(Math.random() * 35) + 25;

  const kinshipScore = relationshipType === 'Parent' ? 95 : 
                       relationshipType === 'Grandparent' ? 90 :
                       relationshipType === 'Sibling' ? 85 :
                       relationshipType === 'Aunt/Uncle' ? 80 :
                       relationshipType === 'Cousin' ? 70 : 60;
  
  const culturalFitScore = Math.floor(Math.random() * 20) + 80;
  const commitmentScore = Math.floor(Math.random() * 30) + 70;
  const supportSystemScore = Math.floor(Math.random() * 30) + 70;
  const trainingScore = Math.floor(Math.random() * 40) + 60;
  
  const matchScore = Math.round(
    (kinshipScore * 0.35) + 
    (culturalFitScore * 0.20) + 
    (commitmentScore * 0.25) + 
    (supportSystemScore * 0.15) + 
    (trainingScore * 0.05)
  );
  
  const distance = Math.floor(Math.random() * 500) + 1;
  
  const willingnessLevels = ['High', 'High', 'Medium', 'Medium', 'Low', 'Unknown'];
  const willingness = willingnessLevels[Math.floor(Math.random() * willingnessLevels.length)];

  const religion = RELIGIONS[Math.floor(Math.random() * RELIGIONS.length)];
  const languages = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    age,
    gender: gender === 'male' ? 'M' : 'F',
    relationshipType,
    religion,
    languages,
    city: CITIES[Math.floor(Math.random() * CITIES.length)],
    state: STATES[Math.floor(Math.random() * STATES.length)],
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    lastContact: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    source: MOCK_DATABASE_SOURCES[Math.floor(Math.random() * MOCK_DATABASE_SOURCES.length)],
    confidence: Math.floor(Math.random() * 30) + 70,
    notes: generateNotes(),
    matchScore,
    kinshipScore,
    culturalFitScore,
    commitmentScore,
    supportSystemScore,
    trainingScore,
    distance,
    willingness
  };
}

function generateNotes() {
  const notes = [
    'Last known address verified',
    'Phone number updated 6 months ago',
    'Email bounced - needs verification',
    'Currently enrolled in services',
    'Has legal guardian appointed',
    'Placement pending court approval',
    'Active case manager assigned',
    'Recent contact attempted',
    'Successful outreach last month',
    'No recent contact - phone disconnected'
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

// Simulate network latency
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getSourceIdentifier = (source) => source?.id ?? source?._id ?? source?.slug ?? source?.sourceId ?? null;

const resolveGilmoreSourceDetails = (sourceConfig) => {
  const fallback = MOCK_DATABASE_SOURCES.find((entry) => entry.id === GILMORE_SOURCE_ID) || {
    id: GILMORE_SOURCE_ID,
    name: 'Stars Hollow Community Network',
    icon: '🌟'
  };

  if (!sourceConfig) {
    return fallback;
  }

  const resolvedId = getSourceIdentifier(sourceConfig) || fallback.id;

  return {
    id: resolvedId,
    name: sourceConfig.name || fallback.name,
    icon: sourceConfig.icon || fallback.icon,
    type: sourceConfig.type || 'Demo Scenario'
  };
};

const filtersIncludeSource = (sourceId, filters) => {
  if (!sourceId) {
    return false;
  }

  const filterSources = filters?.sources;
  if (!Array.isArray(filterSources) || filterSources.length === 0) {
    return true;
  }

  return filterSources.includes(sourceId);
};

const search = async (caseId, filters) => {
  console.log('Performing network search for case:', caseId, 'with filters:', filters);
  await delay(500 + Math.floor(Math.random() * 1000)); // Simulate API latency

  const gilmoreConfig = getSourceById(GILMORE_SOURCE_ID);
  const gilmoreEnabled = Boolean(gilmoreConfig && gilmoreConfig.enabled !== false);
  const gilmoreIncluded = filtersIncludeSource(GILMORE_SOURCE_ID, filters);
  const gilmoreDetails = resolveGilmoreSourceDetails(gilmoreConfig);

  // --- GILMORE GIRLS DEMO OVERRIDE ---
  if (caseId === 'GG-2000-01') {
    return generateStarsHollowNetwork(filters, gilmoreDetails);
  }
  // --- END OVERRIDE ---

  // Original mock data logic
  const baseResults = [];
  const numResults = Math.floor(Math.random() * (40 - 25 + 1)) + 25;

  for (let i = 0; i < numResults; i++) {
    const relationshipType = RELATIONSHIP_TYPES[Math.floor(Math.random() * RELATIONSHIP_TYPES.length)];
    const mockPerson = generateMockPerson({ name: 'Unknown', age: 35 }, relationshipType);

    baseResults.push({
      id: `search-result-${Date.now()}-${i}`,
      ...mockPerson,
      matchScore: mockPerson.confidence,
      recordId: `REC${Math.floor(Math.random() * 100000)}`,
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }

  let filteredResults = baseResults;
  if (filters?.relationship) {
    filteredResults = filteredResults.filter(p =>
      p.relationshipType.toLowerCase().includes(filters.relationship.toLowerCase())
    );
  }

  if (filters?.relationshipTypes?.length) {
    const allowed = filters.relationshipTypes.map(type => type.toLowerCase());
    filteredResults = filteredResults.filter(p => allowed.includes(p.relationshipType.toLowerCase()));
  }

  const baseResponse = {
    results: filteredResults.sort((a, b) => b.matchScore - a.matchScore),
    totalCount: filteredResults.length,
    facets: {},
  };

  if (gilmoreEnabled && gilmoreIncluded) {
    const gilmoreResponse = generateStarsHollowNetwork(filters, gilmoreDetails);
    const combinedResults = [
      ...gilmoreResponse.results,
      ...baseResponse.results.filter((result) => result.source?.id !== GILMORE_SOURCE_ID)
    ];

    return {
      results: combinedResults,
      totalCount: combinedResults.length,
      facets: gilmoreResponse.facets || baseResponse.facets,
    };
  }

  return baseResponse;
};

/**
 * Generates a mock network of Stars Hollow residents for the Gilmore Girls demo
 * with richly populated records so the UI never shows "unknown" values.
 */
const generateStarsHollowNetwork = (filters, sourceDetails) => {
  const gilmoreSource = sourceDetails || resolveGilmoreSourceDetails(getSourceById(GILMORE_SOURCE_ID));

  const starsHollowResidents = [
    {
      name: 'Lorelai Gilmore',
      gender: 'F',
      age: 36,
      birthDate: '1968-04-25',
      relationshipType: 'Parent',
      relationshipLabel: 'Mother',
      occupation: 'Owner, Dragonfly Inn',
      employer: 'Dragonfly Inn',
      languages: ['English'],
      religion: 'Non-denominational Christian',
      address: { line1: '32 Maple Avenue', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0114',
      altPhone: '(860) 555-0165',
      email: 'lorelai.gilmore@dragonflyinn.com',
      availability: 'Weekdays after 6 PM; weekends flexible',
      strengths: ['Primary caregiver', 'Stable housing', 'Strong advocacy skills'],
      notes: 'Primary caregiver for Rory with deep ties across Stars Hollow and Hartford.',
      kinshipScore: 98,
      culturalFitScore: 96,
      commitmentScore: 100,
      supportSystemScore: 92,
      trainingScore: 88,
      distanceMiles: 1,
      willingnessLevel: 'High',
      communityRoles: ['Local business owner', 'Town fundraiser organizer'],
      supportCapacity: 'Can host short-term stays and coordinate transportation.',
      engagementHistory: [
        { date: '2025-09-14', summary: 'Hosted support meeting at Dragonfly Inn', outcome: 'Generated updated contact map.' },
        { date: '2025-10-02', summary: 'Coordinated academic follow-up with Rory', outcome: 'Confirmed Yale support plan.' }
      ]
    },
    {
      name: 'Rory Gilmore',
      gender: 'F',
      age: 21,
      birthDate: '1984-10-08',
      relationshipType: 'Child',
      relationshipLabel: 'Daughter',
      occupation: 'Student Journalist',
      employer: 'Yale Daily News',
      languages: ['English', 'Spanish (conversational)'],
      religion: 'Catholic (cultural)',
      address: { line1: 'Yale University, Branford College', city: 'New Haven', state: 'CT', postalCode: '06511' },
      phone: '(203) 555-0145',
      altPhone: '(860) 555-0135',
      email: 'rory.gilmore@yale.edu',
      availability: 'Weekday afternoons; limited evenings around coursework',
      strengths: ['Academic excellence', 'Organizational skills', 'Reliable communication'],
      notes: 'Maintains contact lists and documentation for ongoing outreach.',
      kinshipScore: 95,
      culturalFitScore: 94,
      commitmentScore: 92,
      supportSystemScore: 88,
      trainingScore: 82,
      distanceMiles: 32,
      willingnessLevel: 'High',
      communityRoles: ['Student journalist', 'Volunteer tutor'],
      supportCapacity: 'Provides research, writing, and outreach scheduling support.',
      engagementHistory: [
        { date: '2025-09-22', summary: 'Compiled extended family research dossier', outcome: 'Shared 12 new vetted contacts.' },
        { date: '2025-10-05', summary: 'Interviewed Yale dean regarding leave options', outcome: 'Confirmed academic flexibility if placement changes.' }
      ]
    },
    {
      name: 'Emily Gilmore',
      gender: 'F',
      age: 63,
      birthDate: '1942-02-20',
      relationshipType: 'Grandparent',
      relationshipLabel: 'Grandmother',
      occupation: 'Philanthropist',
      employer: 'Gilmore Trust',
      languages: ['English', 'French'],
      religion: 'Episcopalian',
      address: { line1: '1200 Elm Street', city: 'Hartford', state: 'CT', postalCode: '06103' },
      phone: '(860) 555-0200',
      altPhone: '(860) 555-0212',
      email: 'emily.gilmore@gilmoretrust.org',
      availability: 'Weekdays before 3 PM; evenings by appointment',
      strengths: ['Financial resources', 'Formal advocacy experience', 'Established social network'],
      notes: 'Highly connected across Hartford society; prefers structured communication and agendas.',
      kinshipScore: 90,
      culturalFitScore: 85,
      commitmentScore: 87,
      supportSystemScore: 93,
      trainingScore: 78,
      distanceMiles: 18,
      willingnessLevel: 'Medium',
      communityRoles: ['Hospital charity chair', 'Hartford Historical Society board member'],
      supportCapacity: 'Underwrites services and opens access to specialized providers.',
      engagementHistory: [
        { date: '2025-08-30', summary: 'Hosted dinner with family support team', outcome: 'Committed to covering legal consultation fees.' },
        { date: '2025-10-01', summary: 'Coordinated with Hartford Women\'s League', outcome: 'Secured mentorship placements.' }
      ]
    },
    {
      name: 'Richard Gilmore',
      gender: 'M',
      age: 65,
      birthDate: '1940-06-07',
      relationshipType: 'Grandparent',
      relationshipLabel: 'Grandfather',
      occupation: 'Retired Insurance Executive',
      employer: 'Gilmore Trust',
      languages: ['English'],
      religion: 'Episcopalian',
      address: { line1: '1200 Elm Street', city: 'Hartford', state: 'CT', postalCode: '06103' },
      phone: '(860) 555-0220',
      altPhone: '(860) 555-0250',
      email: 'richard.gilmore@gilmoretrust.org',
      availability: 'Weekdays 9 AM - 4 PM',
      strengths: ['Financial literacy', 'Mentorship for higher education', 'Transportation resources'],
      notes: 'Provides structured support and mentorship; advocates with financial institutions.',
      kinshipScore: 88,
      culturalFitScore: 84,
      commitmentScore: 90,
      supportSystemScore: 95,
      trainingScore: 80,
      distanceMiles: 18,
      willingnessLevel: 'High',
      communityRoles: ['Rotary Club treasurer', 'Adjunct lecturer at Yale School of Management'],
      supportCapacity: 'Guides college financing, guardianship planning, and scholarship searches.',
      engagementHistory: [
        { date: '2025-09-10', summary: 'Reviewed college financial aid options with Rory', outcome: 'Outlined scholarship backstops.' },
        { date: '2025-10-08', summary: 'Called Hartford College Prep about mentors', outcome: 'Secured two alumni mentors.' }
      ]
    },
    {
      name: 'Luke Danes',
      gender: 'M',
      age: 38,
      birthDate: '1967-10-14',
      relationshipType: 'Spouse/Partner',
      relationshipLabel: 'Partner',
      occupation: 'Owner, Luke\'s Diner',
      employer: 'Luke\'s Diner',
      languages: ['English'],
      religion: 'Spiritual',
      address: { line1: '15 Town Square', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0101',
      altPhone: '(860) 555-0190',
      email: 'luke.danes@lukesdiner.com',
      availability: 'Daily 6 AM - 2 PM; limited evenings after closing duties',
      strengths: ['Dependable presence', 'Provides warm meals', 'Transportation support'],
      notes: 'Offers steady presence, hot meals, and practical solutions for day-to-day needs.',
      kinshipScore: 92,
      culturalFitScore: 90,
      commitmentScore: 94,
      supportSystemScore: 85,
      trainingScore: 75,
      distanceMiles: 0.5,
      willingnessLevel: 'High',
      communityRoles: ['Local business owner', 'Town council sounding board'],
      supportCapacity: 'Provides safe meeting space and early-morning check-ins.',
      engagementHistory: [
        { date: '2025-09-05', summary: 'Opened diner for early strategy session', outcome: 'Generated updated kinship tree.' },
        { date: '2025-10-06', summary: 'Drove Lorelai to Hartford meeting', outcome: 'Ensured on-time arrival for legal consultation.' }
      ]
    },
    {
      name: 'Sookie St. James',
      gender: 'F',
      age: 36,
      birthDate: '1969-05-12',
      relationshipType: 'Family Friend',
      relationshipLabel: 'Best Friend',
      occupation: 'Executive Chef',
      employer: 'Dragonfly Inn',
      languages: ['English'],
      religion: 'Catholic',
      address: { line1: '44 Peach Orchard Lane', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0102',
      altPhone: '(860) 555-0188',
      email: 'sookie.stjames@dragonflyinn.com',
      availability: 'Afternoons after prep; Sundays all day',
      strengths: ['Meal prep support', 'Event coordination', 'Emotional encouragement'],
      notes: 'Creates safe, joyful spaces through food; organizes support schedules.',
      kinshipScore: 82,
      culturalFitScore: 93,
      commitmentScore: 88,
      supportSystemScore: 86,
      trainingScore: 72,
      distanceMiles: 2,
      willingnessLevel: 'High',
      communityRoles: ['Community fundraiser chef', 'Parent volunteer'],
      supportCapacity: 'Delivers prepared meals and coordinates respite coverage for caregivers.',
      engagementHistory: [
        { date: '2025-09-18', summary: 'Prepped freezer meals for busy school week', outcome: 'Stabilized family routines.' },
        { date: '2025-10-03', summary: 'Organized bake sale for travel fund', outcome: 'Raised $1,200 for travel expenses.' }
      ]
    },
    {
      name: 'Jackson Belleville',
      gender: 'M',
      age: 37,
      birthDate: '1968-12-01',
      relationshipType: 'Family Friend',
      relationshipLabel: 'Family Friend',
      occupation: 'Community Agriculture Director',
      employer: 'Connecticut Cooperative Extension',
      languages: ['English'],
      religion: 'Lutheran',
      address: { line1: '44 Peach Orchard Lane', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0175',
      altPhone: '(860) 555-0178',
      email: 'jackson.belleville@ctcooperative.gov',
      availability: 'Weekdays after 4 PM; Saturdays 10 AM - 2 PM',
      strengths: ['Transportation resources', 'Youth mentorship', 'Budget planning'],
      notes: 'Provides produce deliveries and coordinates 4-H mentorship placements.',
      kinshipScore: 78,
      culturalFitScore: 88,
      commitmentScore: 84,
      supportSystemScore: 80,
      trainingScore: 70,
      distanceMiles: 2,
      willingnessLevel: 'High',
      communityRoles: ['Selectman', 'Agricultural liaison'],
      supportCapacity: 'Offers farm-to-table food support and operational planning expertise.',
      engagementHistory: [
        { date: '2025-09-25', summary: 'Delivered fresh produce for support circle', outcome: 'Enabled community meal prep rotation.' },
        { date: '2025-10-04', summary: 'Arranged internship with county extension', outcome: 'Secured hands-on learning opportunity for youth.' }
      ]
    },
    {
      name: 'Lane Kim',
      gender: 'F',
      age: 21,
      birthDate: '1984-03-11',
      relationshipType: 'Family Friend',
      relationshipLabel: 'Chosen Sister',
      occupation: 'Co-Owner & Drummer, Hep Alien',
      employer: 'Hep Alien',
      languages: ['English', 'Korean'],
      religion: 'Seventh-day Adventist (cultural)',
      address: { line1: '12 Church Street', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0130',
      altPhone: '(860) 555-0131',
      email: 'lane.kim@hepalienmusic.com',
      availability: 'Evenings after 7 PM; tour schedule varies',
      strengths: ['Trusted peer support', 'Music therapy', 'Crisis response'],
      notes: 'Provides immediate peer contact and creative outlets for stress relief.',
      kinshipScore: 97,
      culturalFitScore: 95,
      commitmentScore: 90,
      supportSystemScore: 86,
      trainingScore: 74,
      distanceMiles: 1,
      willingnessLevel: 'High',
      communityRoles: ['Youth band leader', 'Community event sound tech'],
      supportCapacity: 'Offers on-call peer companionship and creative engagement activities.',
      engagementHistory: [
        { date: '2025-09-12', summary: 'Led late-night peer check-in', outcome: 'De-escalated academic stress.' },
        { date: '2025-10-07', summary: 'Organized music session for community fair', outcome: 'Raised morale and participation.' }
      ]
    },
    {
      name: 'Hye-Sook Kim',
      gender: 'F',
      age: 55,
      birthDate: '1950-07-19',
      relationshipType: 'Support Network',
      relationshipLabel: 'Lane\'s Mother',
      occupation: 'Owner, Kim Antiques',
      employer: 'Kim Antiques',
      languages: ['Korean', 'English'],
      religion: 'Seventh-day Adventist',
      address: { line1: '12 Church Street', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0105',
      altPhone: '(860) 555-0194',
      email: 'mrs.kim@kimantiques.com',
      availability: 'Weekdays 10 AM - 6 PM; Sundays after church',
      strengths: ['Cultural continuity', 'Faith-based guidance', 'Structured environments'],
      notes: 'Ensures cultural traditions are respected and offers structured mentorship for youth.',
      kinshipScore: 70,
      culturalFitScore: 92,
      commitmentScore: 75,
      supportSystemScore: 83,
      trainingScore: 68,
      distanceMiles: 1,
      willingnessLevel: 'Medium',
      communityRoles: ['Church elder', 'Cultural liaison'],
      supportCapacity: 'Provides structured mentorship, faith-based programming, and translation support.',
      engagementHistory: [
        { date: '2025-09-08', summary: 'Hosted cultural heritage night at Kim Antiques', outcome: 'Strengthened intergenerational ties.' },
        { date: '2025-10-09', summary: 'Coordinated church volunteer roster', outcome: 'Added four respite caregivers.' }
      ]
    },
    {
      name: 'Michel Gerard',
      gender: 'M',
      age: 34,
      birthDate: '1971-01-23',
      relationshipType: 'Support Network',
      relationshipLabel: 'Family Friend',
      occupation: 'Hotel Manager',
      employer: 'Dragonfly Inn',
      languages: ['French', 'English'],
      religion: 'Catholic',
      address: { line1: '89 Morning Dove Way', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0170',
      altPhone: '(860) 555-0171',
      email: 'michel.gerard@dragonflyinn.com',
      availability: 'Weekdays 7 AM - 3 PM; Sundays limited',
      strengths: ['Logistics coordination', 'Travel arrangements', 'Documentation accuracy'],
      notes: 'Meticulous planner who ensures follow-through on every detail.',
      kinshipScore: 72,
      culturalFitScore: 90,
      commitmentScore: 82,
      supportSystemScore: 80,
      trainingScore: 76,
      distanceMiles: 1.5,
      willingnessLevel: 'Medium',
      communityRoles: ['Hospitality liaison', 'Language support for visitors'],
      supportCapacity: 'Manages travel logistics, itineraries, and translation for French-speaking relatives.',
      engagementHistory: [
        { date: '2025-09-16', summary: 'Booked last-minute hotel rooms for visiting family', outcome: 'Ensured relatives had immediate lodging.' },
        { date: '2025-10-02', summary: 'Compiled documentation for court review', outcome: 'Delivered organized evidence packet.' }
      ]
    },
    {
      name: 'Paris Geller',
      gender: 'F',
      age: 21,
      birthDate: '1984-09-19',
      relationshipType: 'Mentor',
      relationshipLabel: 'Academic Ally',
      occupation: 'Pre-med Student',
      employer: 'Yale University',
      languages: ['English', 'French (conversational)'],
      religion: 'Jewish (cultural)',
      address: { line1: 'Yale University, Davenport College', city: 'New Haven', state: 'CT', postalCode: '06520' },
      phone: '(203) 555-0158',
      altPhone: '(203) 555-0159',
      email: 'paris.geller@yale.edu',
      availability: 'M/W/F evenings after 7 PM; Sundays 2 PM - 6 PM',
      strengths: ['Academic planning', 'Health advocacy', 'Crisis leadership'],
      notes: 'Direct, intensely loyal advocate who secures resources and pushes for excellence.',
      kinshipScore: 80,
      culturalFitScore: 91,
      commitmentScore: 89,
      supportSystemScore: 78,
      trainingScore: 85,
      distanceMiles: 34,
      willingnessLevel: 'High',
      communityRoles: ['Pre-med society leader', 'Habitat for Humanity volunteer'],
      supportCapacity: 'Coaches academic benchmarks and coordinates health navigation.',
      engagementHistory: [
        { date: '2025-09-20', summary: 'Drafted academic resilience plan with Rory', outcome: 'Set milestone roadmap through graduation.' },
        { date: '2025-10-04', summary: 'Escorted Rory to Yale health services', outcome: 'Obtained expedited counseling appointment.' }
      ]
    },
    {
      name: 'Doyle McMaster',
      gender: 'M',
      age: 22,
      birthDate: '1983-07-30',
      relationshipType: 'Support Network',
      relationshipLabel: 'Peer Advocate',
      occupation: 'Investigative Journalist',
      employer: 'Stamford Gazette',
      languages: ['English'],
      religion: 'Catholic',
      address: { line1: '21 Harbor View Road', city: 'Stamford', state: 'CT', postalCode: '06902' },
      phone: '(475) 555-0182',
      altPhone: '(475) 555-0183',
      email: 'doyle.mcmaster@stamfordgazette.com',
      availability: 'Weekends; remote research support on weekdays',
      strengths: ['Investigative research', 'Media amplification', 'Policy analysis'],
      notes: 'Provides rapid research support and media strategy consultation.',
      kinshipScore: 74,
      culturalFitScore: 85,
      commitmentScore: 80,
      supportSystemScore: 75,
      trainingScore: 72,
      distanceMiles: 62,
      willingnessLevel: 'Medium',
      communityRoles: ['Press coalition member', 'Policy roundtable contributor'],
      supportCapacity: 'Develops briefing packets, fact-checks narratives, and coordinates press outreach.',
      engagementHistory: [
        { date: '2025-09-28', summary: 'Published community spotlight on support network', outcome: 'Raised local volunteer interest by 40%.' },
        { date: '2025-10-06', summary: 'Drafted policy memo for Hartford delegation', outcome: 'Secured follow-up meeting with state officials.' }
      ]
    },
    {
      name: 'Miss Patty',
      gender: 'F',
      age: 58,
      birthDate: '1947-11-02',
      relationshipType: 'Support Network',
      relationshipLabel: 'Community Matriarch',
      occupation: 'Dance Studio Owner',
      employer: 'Miss Patty\'s School of Ballet and Talent',
      languages: ['English', 'Spanish (basic)'],
      religion: 'Catholic',
      address: { line1: '4 Town Square', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0108',
      altPhone: '(860) 555-0180',
      email: 'miss.patty@starshollow.com',
      availability: 'Afternoons 1 PM - 5 PM; evenings for rehearsals',
      strengths: ['Gathering community', 'Storytelling for engagement', 'Emergency childcare'],
      notes: 'Knows every family history and can mobilize volunteers overnight.',
      kinshipScore: 76,
      culturalFitScore: 90,
      commitmentScore: 82,
      supportSystemScore: 88,
      trainingScore: 70,
      distanceMiles: 0.3,
      willingnessLevel: 'High',
      communityRoles: ['Town festival emcee', 'Community fundraiser host'],
      supportCapacity: 'Runs contact tree, organizes practice space, and coordinates childcare coverage.',
      engagementHistory: [
        { date: '2025-09-11', summary: 'Hosted fall festival planning session', outcome: 'Recruited 18 volunteers for outreach.' },
        { date: '2025-10-10', summary: 'Provided emergency childcare during Hartford trip', outcome: 'Enabled uninterrupted court appearance.' }
      ]
    },
    {
      name: 'Babette Dell',
      gender: 'F',
      age: 56,
      birthDate: '1949-03-04',
      relationshipType: 'Support Network',
      relationshipLabel: 'Neighbor',
      occupation: 'Retired Singer',
      employer: 'Self',
      languages: ['English'],
      religion: 'Jewish (cultural)',
      address: { line1: '30 Maple Avenue', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0106',
      altPhone: '(860) 555-0199',
      email: 'babette.dell@starshollow.com',
      availability: 'Daytimes; late-night phone support',
      strengths: ['Neighborhood watch', 'Emotional coaching', 'Pet care'],
      notes: 'First to know when someone needs support; keeps community informed.',
      kinshipScore: 78,
      culturalFitScore: 88,
      commitmentScore: 86,
      supportSystemScore: 84,
      trainingScore: 68,
      distanceMiles: 0.2,
      willingnessLevel: 'High',
      communityRoles: ['Neighborhood coordinator', 'Animal rescue volunteer'],
      supportCapacity: 'Runs check-in calls and keeps emergency supplies for rapid deployment.',
      engagementHistory: [
        { date: '2025-09-02', summary: 'Checked in with Lorelai during transition', outcome: 'Documented early warning signs for stress.' },
        { date: '2025-10-07', summary: 'Watered plants and handled mail during Hartford trip', outcome: 'Maintained home stability.' }
      ]
    },
    {
      name: 'Morey Dell',
      gender: 'M',
      age: 57,
      birthDate: '1948-08-29',
      relationshipType: 'Support Network',
      relationshipLabel: 'Neighbor',
      occupation: 'Jazz Musician',
      employer: 'Self',
      languages: ['English'],
      religion: 'Jewish (cultural)',
      address: { line1: '30 Maple Avenue', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0107',
      altPhone: '(860) 555-0140',
      email: 'morey.dell@starshollow.com',
      availability: 'Evenings after 6 PM; Sundays all day',
      strengths: ['Calming presence', 'Transportation support', 'Home repairs'],
      notes: 'Provides quiet, steady backup for Babette and neighbors needing practical help.',
      kinshipScore: 74,
      culturalFitScore: 87,
      commitmentScore: 82,
      supportSystemScore: 80,
      trainingScore: 65,
      distanceMiles: 0.2,
      willingnessLevel: 'Medium',
      communityRoles: ['Community jazz ensemble leader', 'Volunteer driver'],
      supportCapacity: 'Offers rides, assists with minor repairs, and provides calming music therapy.',
      engagementHistory: [
        { date: '2025-09-06', summary: 'Drove Lorelai to Hartford hearing', outcome: 'Ensured reliable transportation.' },
        { date: '2025-10-03', summary: 'Set up sound system for support gathering', outcome: 'Improved accessibility for hybrid participants.' }
      ]
    },
    {
      name: 'Kirk Gleason',
      gender: 'M',
      age: 32,
      birthDate: '1973-01-18',
      relationshipType: 'Community Partner',
      relationshipLabel: 'Town Utility',
      occupation: 'Freelance Everything',
      employer: 'Self',
      languages: ['English'],
      religion: 'Methodist',
      address: { line1: '112 Old Farm Road', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0101',
      altPhone: '(860) 555-0103',
      email: 'kirk.gleason@starshollow.com',
      availability: 'Varies by job; always on call for emergencies',
      strengths: ['Odd-job wizardry', 'Rapid flyering', 'Security guard experience'],
      notes: 'Can adapt to any role needed; eager to assist with logistical support.',
      kinshipScore: 70,
      culturalFitScore: 83,
      commitmentScore: 78,
      supportSystemScore: 75,
      trainingScore: 62,
      distanceMiles: 1,
      willingnessLevel: 'High',
      communityRoles: ['Town handyman', 'Festival security'],
      supportCapacity: 'Posts notices, escorts visitors, and fills last-minute staffing gaps.',
      engagementHistory: [
        { date: '2025-09-09', summary: 'Distributed visitation flyers overnight', outcome: 'Reached 100% of local kiosks by morning.' },
        { date: '2025-10-05', summary: 'Served as evening escort after meeting', outcome: 'Ensured safe walk home.' }
      ]
    },
    {
      name: 'Taylor Doose',
      gender: 'M',
      age: 55,
      birthDate: '1950-08-11',
      relationshipType: 'Community Partner',
      relationshipLabel: 'Town Selectman',
      occupation: 'Selectman & Market Owner',
      employer: 'Town of Stars Hollow / Doose\'s Market',
      languages: ['English'],
      religion: 'Presbyterian',
      address: { line1: '1 Town Square', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0102',
      altPhone: '(860) 555-0192',
      email: 'taylor.doose@starshollow.gov',
      availability: 'Weekdays 9 AM - 5 PM; Saturdays 9 AM - Noon',
      strengths: ['Permitting authority', 'Budget oversight', 'Storehouse access'],
      notes: 'Bureaucratic but deeply committed to town order and resource distribution.',
      kinshipScore: 68,
      culturalFitScore: 82,
      commitmentScore: 76,
      supportSystemScore: 78,
      trainingScore: 70,
      distanceMiles: 0.1,
      willingnessLevel: 'Medium',
      communityRoles: ['Town selectman', 'Business association chair'],
      supportCapacity: 'Approves special permits, unlocks town storage, and coordinates budget approvals.',
      engagementHistory: [
        { date: '2025-09-15', summary: 'Fast-tracked gazebo permit for support rally', outcome: 'Approved within 12 hours.' },
        { date: '2025-10-01', summary: 'Authorized emergency supply release', outcome: 'Provided heaters and blankets for visiting family.' }
      ]
    },
    {
      name: 'Gypsy (Petronella)',
      gender: 'F',
      age: 45,
      birthDate: '1960-02-08',
      relationshipType: 'Community Partner',
      relationshipLabel: 'Mechanic',
      occupation: 'Owner, Gypsy\'s Garage',
      employer: 'Gypsy\'s Garage',
      languages: ['English', 'Spanish (conversational)'],
      religion: 'Catholic',
      address: { line1: '67 Mechanics Row', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0112',
      altPhone: '(860) 555-0198',
      email: 'gypsy@gypsysgarage.com',
      availability: 'Weekdays 8 AM - 6 PM; emergency hotline after hours',
      strengths: ['Vehicle readiness', 'Emergency pickups', 'Safety inspections'],
      notes: 'Keeps every vehicle running and offers emergency pickup within 20 minutes.',
      kinshipScore: 72,
      culturalFitScore: 87,
      commitmentScore: 84,
      supportSystemScore: 82,
      trainingScore: 78,
      distanceMiles: 1,
      willingnessLevel: 'High',
      communityRoles: ['Emergency mechanic', 'Parade logistics support'],
      supportCapacity: 'Ensures transport safety, loaner vans, and rush repairs for travel.',
      engagementHistory: [
        { date: '2025-09-21', summary: 'Serviced vehicle before Hartford trip', outcome: 'Prevented breakdown and delays.' },
        { date: '2025-10-08', summary: 'Provided emergency ride from bus depot', outcome: 'Avoided missed court appearance.' }
      ]
    },
    {
      name: 'Andrew Johnson',
      gender: 'M',
      age: 52,
      birthDate: '1953-12-05',
      relationshipType: 'Community Partner',
      relationshipLabel: 'Bookstore Owner',
      occupation: 'Owner, Stars Hollow Books',
      employer: 'Stars Hollow Books',
      languages: ['English'],
      religion: 'Unitarian Universalist',
      address: { line1: '18 Town Square', city: 'Stars Hollow', state: 'CT', postalCode: '06516' },
      phone: '(860) 555-0113',
      altPhone: '(860) 555-0184',
      email: 'andrew@starshollowbooks.com',
      availability: 'Weekdays 10 AM - 7 PM; Sundays Noon - 5 PM',
      strengths: ['Genealogical research', 'Quiet study space', 'Resource lending'],
      notes: 'Curates historical records and offers after-hours library access.',
      kinshipScore: 66,
      culturalFitScore: 85,
      commitmentScore: 78,
      supportSystemScore: 74,
      trainingScore: 68,
      distanceMiles: 0.3,
      willingnessLevel: 'Medium',
      communityRoles: ['Library board member', 'Local historian'],
      supportCapacity: 'Hosts study nights, lends archives, and digitizes historical materials.',
      engagementHistory: [
        { date: '2025-09-17', summary: 'Opened bookstore for evening research session', outcome: 'Completed three pedigree updates.' },
        { date: '2025-10-05', summary: 'Digitized town census from 1970s', outcome: 'Added 26 archival matches to search index.' }
      ]
    },
    {
      name: 'Jess Mariano',
      gender: 'M',
      age: 22,
      birthDate: '1983-09-05',
      relationshipType: 'Support Network',
      relationshipLabel: 'Extended Family',
      occupation: 'Author & Small Press Editor',
      employer: 'Truncheon Press',
      languages: ['English'],
      religion: 'Agnostic',
      address: { line1: '109 Bethlehem Pike', city: 'Philadelphia', state: 'PA', postalCode: '19118' },
      phone: '(215) 555-0110',
      altPhone: '(215) 555-0196',
      email: 'jess.mariano@truncheonpress.com',
      availability: 'Remote availability; in-person quarterly',
      strengths: ['Creative coaching', 'Literacy mentorship', 'Candid feedback'],
      notes: 'Understands Rory deeply; provides honest perspective and writing mentorship.',
      kinshipScore: 75,
      culturalFitScore: 87,
      commitmentScore: 80,
      supportSystemScore: 72,
      trainingScore: 70,
      distanceMiles: 240,
      willingnessLevel: 'Medium',
      communityRoles: ['Youth writing mentor', 'Independent press liaison'],
      supportCapacity: 'Offers manuscript feedback and shares publishing resources with youth writers.',
      engagementHistory: [
        { date: '2025-09-24', summary: 'Hosted virtual writing workshop', outcome: 'Published four student essays online.' },
        { date: '2025-10-07', summary: 'Sent curated reading list to Rory', outcome: 'Improved stress management through journaling.' }
      ]
    },
    {
      name: 'Liz Danes',
      gender: 'F',
      age: 40,
      birthDate: '1964-05-19',
      relationshipType: 'Extended Family',
      relationshipLabel: 'Sister-in-law',
      occupation: 'Artisan Jewelry Maker',
      employer: 'Renaissance Fairs of Connecticut',
      languages: ['English'],
      religion: 'Spiritual',
      address: { line1: 'Traveling Artisan Coop', city: 'New London', state: 'CT', postalCode: '06320' },
      phone: '(475) 555-0122',
      altPhone: '(475) 555-0197',
      email: 'liz.danes@ctrenaissance.org',
      availability: 'Weekdays in off-season; limited during fair weeks',
      strengths: ['Creative outreach', 'Youth engagement', 'Extended family contact'],
      notes: 'Reconnects distant relatives and brings creative programming to events.',
      kinshipScore: 73,
      culturalFitScore: 82,
      commitmentScore: 70,
      supportSystemScore: 68,
      trainingScore: 60,
      distanceMiles: 72,
      willingnessLevel: 'Medium',
      communityRoles: ['Artisan mentor', 'Festival organizer'],
      supportCapacity: 'Hosts creative workshops and builds rapport with traveling communities.',
      engagementHistory: [
        { date: '2025-09-19', summary: 'Connected Rory with traveling artisan network', outcome: 'Discovered new paternal relatives.' },
        { date: '2025-10-06', summary: 'Hosted jewelry-making circle for youth', outcome: 'Boosted attendance at community center.' }
      ]
    },
    {
      name: 'April Nardini',
      gender: 'F',
      age: 13,
      birthDate: '1992-01-27',
      relationshipType: 'Sibling',
      relationshipLabel: 'Half-Sister',
      occupation: 'Student Scientist',
      employer: 'Stars Hollow Middle School / Science Club',
      languages: ['English', 'Spanish (immersion program)'],
      religion: 'Catholic (cultural)',
      address: { line1: '28 Ferry Street', city: 'Hartford', state: 'CT', postalCode: '06106' },
      phone: '(860) 555-0150',
      altPhone: '(860) 555-0151',
      email: 'april.nardini@hartfordstudents.net',
      availability: 'School days 3 PM - 6 PM; weekends variable',
      strengths: ['STEM tutoring', 'Logical problem-solving', 'Youth peer support'],
      notes: 'Excited to connect with siblings; brings engineering mindset to challenges.',
      kinshipScore: 88,
      culturalFitScore: 90,
      commitmentScore: 78,
      supportSystemScore: 72,
      trainingScore: 65,
      distanceMiles: 16,
      willingnessLevel: 'High',
      communityRoles: ['Science fair champion', 'Mathletes co-captain'],
      supportCapacity: 'Offers tutoring sessions and prototyping assistance for school projects.',
      engagementHistory: [
        { date: '2025-09-27', summary: 'Video call with Rory and Lorelai', outcome: 'Mapped shared interests for future visits.' },
        { date: '2025-10-08', summary: 'Built portable whiteboard for study sessions', outcome: 'Improved remote tutoring setup.' }
      ]
    },
    {
      name: 'Logan Huntzberger',
      gender: 'M',
      age: 23,
      birthDate: '1982-07-05',
      relationshipType: 'Support Network',
      relationshipLabel: 'Former Partner',
      occupation: 'Media Ventures Associate',
      employer: 'Huntzberger Media Group',
      languages: ['English', 'French'],
      religion: 'Episcopalian',
      address: { line1: '50 Park Avenue', city: 'New York', state: 'NY', postalCode: '10016' },
      phone: '(212) 555-0111',
      altPhone: '(212) 555-0193',
      email: 'logan.huntzberger@huntzbergermedia.com',
      availability: 'Weeknights after 8 PM; frequent travel',
      strengths: ['Access to capital', 'Media amplification', 'Professional networking'],
      notes: 'Offers strategic introductions and resources when aligned with Rory\'s needs.',
      kinshipScore: 60,
      culturalFitScore: 84,
      commitmentScore: 68,
      supportSystemScore: 70,
      trainingScore: 75,
      distanceMiles: 128,
      willingnessLevel: 'Medium',
      communityRoles: ['Media sponsor', 'Philanthropy liaison'],
      supportCapacity: 'Funds technology upgrades and unlocks media coverage for advocacy campaigns.',
      engagementHistory: [
        { date: '2025-09-30', summary: 'Hosted networking brunch for scholarship fund', outcome: 'Secured commitments from two donors.' },
        { date: '2025-10-03', summary: 'Leant portable broadcast kit for event streaming', outcome: 'Enabled remote participation for alumni.' }
      ]
    },
    {
      name: 'Christopher Hayden',
      gender: 'M',
      age: 37,
      birthDate: '1968-03-18',
      relationshipType: 'Parent',
      relationshipLabel: 'Father',
      occupation: 'Tech Startup Consultant',
      employer: 'Hayden Ventures',
      languages: ['English'],
      religion: 'Catholic',
      address: { line1: '190 Commonwealth Avenue', city: 'Boston', state: 'MA', postalCode: '02116' },
      phone: '(617) 555-0146',
      altPhone: '(617) 555-0147',
      email: 'christopher.hayden@haydenventures.com',
      availability: 'Every other weekend; weekday calls before 9 AM',
      strengths: ['Financial support', 'Technology setup', 'Boarding school connections'],
      notes: 'Provides financial contributions and technology upgrades, though engagement can be sporadic.',
      kinshipScore: 72,
      culturalFitScore: 78,
      commitmentScore: 65,
      supportSystemScore: 70,
      trainingScore: 68,
      distanceMiles: 150,
      willingnessLevel: 'Medium',
      communityRoles: ['Angel investor', 'Mentor for emerging entrepreneurs'],
      supportCapacity: 'Covers tuition gaps, offers tech donations, and connects to college admissions counselors.',
      engagementHistory: [
        { date: '2025-09-07', summary: 'Paid for upgraded laptop and software', outcome: 'Improved Rory\'s remote coursework access.' },
        { date: '2025-10-05', summary: 'Introduced Rory to Boston alumni network', outcome: 'Established three mentorship pairings.' }
      ]
    }
  ];

  const results = starsHollowResidents.map((resident, index) => {
    const [firstName, ...lastParts] = resident.name.split(' ');
    const lastName = lastParts.join(' ') || resident.name;
    const weightedScore = Math.round(
      resident.kinshipScore * 0.35 +
      resident.culturalFitScore * 0.2 +
      resident.commitmentScore * 0.2 +
      resident.supportSystemScore * 0.15 +
      resident.trainingScore * 0.1
    );

    return {
      id: `sh-contact-${index}`,
      recordId: `STARS-${String(index + 1).padStart(3, '0')}`,
      firstName,
      lastName,
      fullName: resident.name,
      relationshipType: resident.relationshipType,
      relationship: resident.relationshipLabel,
      scenario: 'gilmore-girls-demo',
      matchScore: weightedScore,
      kinshipScore: resident.kinshipScore,
      culturalFitScore: resident.culturalFitScore,
      commitmentScore: resident.commitmentScore,
      supportSystemScore: resident.supportSystemScore,
      trainingScore: resident.trainingScore,
      distance: resident.distanceMiles,
      willingness: resident.willingnessLevel,
      confidence: Math.min(99, Math.round((resident.kinshipScore + resident.culturalFitScore) / 2)),
      age: resident.age,
      gender: resident.gender,
      phone: resident.phone,
      altPhone: resident.altPhone,
      email: resident.email,
      city: resident.address.city,
      state: resident.address.state,
      notes: resident.notes,
      source: gilmoreSource,
      lastUpdated: resident.engagementHistory?.[0]?.date || '2025-09-01',
      details: {
        occupation: resident.occupation,
        employer: resident.employer,
        availability: resident.availability,
        strengths: resident.strengths,
        communityRoles: resident.communityRoles,
        supportCapacity: resident.supportCapacity,
        languages: resident.languages,
        religion: resident.religion,
        address: resident.address,
        engagementHistory: resident.engagementHistory,
        birthDate: resident.birthDate
      }
    };
  });

  let filteredResults = results;

  if (filters?.relationship) {
    const relationshipFilter = filters.relationship.toLowerCase();
    filteredResults = filteredResults.filter((person) =>
      person.relationshipType.toLowerCase().includes(relationshipFilter) ||
      person.relationship.toLowerCase().includes(relationshipFilter)
    );
  }

  if (filters?.relationshipTypes?.length) {
    const allowed = filters.relationshipTypes.map((type) => type.toLowerCase());
    filteredResults = filteredResults.filter((person) =>
      allowed.includes(person.relationshipType.toLowerCase())
    );
  }

  if (filters?.willingnessLevels?.length) {
    const allowedLevels = filters.willingnessLevels.map((level) => level.toLowerCase());
    filteredResults = filteredResults.filter((person) =>
      allowedLevels.includes(person.willingness.toLowerCase())
    );
  }

  return {
    results: filteredResults.sort((a, b) => b.matchScore - a.matchScore),
    totalCount: filteredResults.length,
    facets: {},
  };
};

export const getRelationshipTypes = () => RELATIONSHIP_TYPES;
export const getDataSources = () => MOCK_DATABASE_SOURCES;

export function exportResultsToCSV(results = []) {
  const headers = ['Name', 'Relationship', 'Age', 'Gender', 'City', 'State', 'Phone', 'Email', 'Confidence', 'Source', 'Notes'];

  if (!Array.isArray(results) || results.length === 0) {
    return headers.join(',');
  }

  const rows = results.map((result) => [
    result.fullName || [result.firstName, result.lastName].filter(Boolean).join(' '),
    result.relationship || result.relationshipType || '',
    result.age ?? '',
    result.gender ?? '',
    result.city ?? '',
    result.state ?? '',
    result.phone ?? '',
    result.email ?? '',
    typeof result.confidence === 'number' ? `${result.confidence}%` : '',
    result.source?.name ?? result.source?.id ?? '',
    result.notes ?? '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((value) => {
          const stringVal =
            value == null
              ? ''
              : typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
          const escaped = stringVal.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

const networkSearchService = {
  search,
};

export default networkSearchService;
