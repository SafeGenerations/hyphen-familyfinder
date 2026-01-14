// src/src-modern/services/searchSources.js
// Lightweight API client for managing external search provider configuration.
// Uses the same fetch approach as the existing feedback API utilities.

const SEARCH_SOURCES_ENDPOINT = '/api/search/sources';
const STUB_STORAGE_KEY = 'genogram_search_sources_stub';
const REMOVED_STUB_IDS = new Set(['safegeneration-outreach']);

const defaultStubSources = [
  {
    id: 'gilmore-girls-demo',
    name: 'Stars Hollow Community Network (Demo)',
    description: 'Demo dataset featuring Lorelai and Rory Gilmore\'s Stars Hollow network. Enable to prioritize the scripted demo search results.',
    type: 'Demo Scenario',
    priority: 0,
    enabled: false,
    costPerSearch: null,
    termsUrl: 'https://example.com/stars-hollow-network-terms',
    icon: '🌟',
    sampleData: {
      scenario: 'Gilmore Girls Demo',
      caseId: 'GG-2000-01',
      focusFamily: 'Gilmore',
      description: 'Injects curated Stars Hollow contacts into Network Search so the Gilmore Girls storyline appears first when the source is enabled.',
      highlightContacts: [
        {
          name: 'Lorelai Gilmore',
          role: 'Primary Caregiver',
          recommendation: 'Use to demonstrate how metadata can activate scripted search experiences.'
        },
        {
          name: 'Luke Danes',
          role: 'Support Network',
          recommendation: 'Toggle this source on to surface Luke and other Stars Hollow residents immediately.'
        }
      ],
      usageNotes: [
        'Best used for product demos and training sessions.',
        'Disable after demo to return to randomized mock search results.',
        'Pairs with case metadata caseId "GG-2000-01" for automatic activation.'
      ]
    }
  },
  {
    id: 'clearview-data',
    name: 'ClearView Data Cooperative',
    description: 'Nationwide utility, credit header, and public records aggregation.',
    type: 'Data Co-op',
    priority: 1,
    enabled: true,
    costPerSearch: 1.5,
    termsUrl: 'https://example.com/clearview-terms',
    sampleData: {
      fullName: 'Jordan Elise Monroe',
      gender: 'Female',
      dateOfBirth: '1989-07-18',
      age: 36,
      currentAddress: {
        line1: '4827 Willow Bend Ct',
        city: 'Raleigh',
        state: 'NC',
        postalCode: '27606'
      },
      previousAddresses: [
        {
          line1: '2130 Southland Dr',
          city: 'Charlotte',
          state: 'NC',
          postalCode: '28273',
          years: '2016-2022'
        }
      ],
      phoneNumbers: [
        { number: '(919) 555-0134', type: 'Mobile', confidence: 0.92 },
        { number: '(704) 555-2270', type: 'Previous', confidence: 0.68 }
      ],
      emails: ['jordan.monroe89@examplemail.com'],
      householdMembers: [
        { name: 'Caleb Monroe', relationship: 'Spouse' },
        { name: 'Parker Monroe', relationship: 'Child' }
      ],
      lastSeen: '2025-05-02'
    }
  },
  {
    id: 'safegenerations-gpa-ks',
    name: 'SafeGenerations GPA (KS)',
    description: 'Live integration with the Kansas Guided Practice Application tenant managed by SafeGenerations.',
    type: 'Platform Integration',
    priority: 2,
    enabled: true,
    costPerSearch: null,
    termsUrl: 'https://example.com/sg-gpa-ks-terms',
    sampleData: {
      gpaInstance: 'ks-guidedpractice',
      environment: 'production',
      datasetScope: ['case-notes', 'placement-history', 'contact-logs', 'tribal-engagement'],
      lastSync: '2025-10-12T02:14:00Z',
      queryModes: ['person-id', 'family-group-id', 'placement-id'],
      webhookEndpoint: 'https://gpa.ks.saferoutes.safegenerations.org/api/hooks/family-finder',
      authentication: {
        type: 'mutual_tls',
        certificateRotationDays: 90,
        backupApiKey: '********-KS-ROTATES-QUARTERLY'
      },
      piiCoverage: {
        phoneNumbers: true,
        addresses: true,
        email: true,
        emergencyContacts: true
      },
      supportContacts: [
        { name: 'Darius Nguyen', role: 'Integration Owner', email: 'darius.nguyen@safegenerations.org' },
        { name: 'KS GPA Helpdesk', role: 'On-call', email: 'helpdesk@gpa.ks.gov' }
      ],
      notes: 'Requires Family Finder request codes issued by KS DCF supervisors. Syncs nightly plus on-demand webhook fan-out.'
    }
  },
  {
    id: 'heartland-outreach-network',
    name: 'Heartland Outreach Network',
    description: 'Regional partner team specializing in kinship outreach, door knocks, and sustained follow-up campaigns.',
    type: 'Human Outreach',
    priority: 3,
    enabled: true,
    costPerSearch: 35,
    termsUrl: 'https://example.com/heartland-outreach-terms',
    sampleData: {
      coordinator: 'Lenora Whitfield',
      coverageStates: ['KS', 'MO', 'NE'],
      escalationEmail: 'escalations@heartlandoutreach.org',
      serviceWindow: 'Mon-Sat 08:00-19:00 Central Time',
      averageFirstContactHours: 26,
      contactAttempts: {
        phone: true,
        sms: true,
        socialMedia: true,
        inPerson: true
      },
      reportingPortal: 'https://portal.heartlandoutreach.org/family-finder',
      statusUpdates: ['Initial call placed', 'Left door hanger', 'Neighbor interview scheduled'],
      successRateRolling90Days: 0.64,
      notes: 'Requires release of information (ROI) uploaded before dispatch. Additional mileage fees for visits beyond 75 miles from Kansas City hub.'
    }
  },
  {
    id: 'social-courts',
    name: 'Social Courts Network',
    description: 'Siblings, foster placements, and legal guardians from partner jurisdictions.',
    type: 'Court Data',
    priority: 4,
    enabled: false,
    costPerSearch: 0.75,
    termsUrl: 'https://example.com/social-courts-terms',
    sampleData: {
      caseNumber: 'SCN-2024-117482',
      subject: {
        fullName: 'Devin Marcus Lang',
        gender: 'Male',
        dateOfBirth: '2005-11-09'
      },
      guardians: [
        {
          name: 'Andrea Lang',
          relationship: 'Legal Guardian',
          address: {
            line1: '1180 Harbor View Rd',
            city: 'Savannah',
            state: 'GA',
            postalCode: '31419'
          },
          phone: '(912) 555-0471'
        }
      ],
      placements: [
        {
          facility: 'Chatham County Transitional Home',
          startDate: '2023-08-14',
          status: 'Active'
        }
      ],
      alerts: ['Pending court review scheduled 2025-11-03']
    }
  }
];

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readStubSources = () => {
  if (!isBrowser()) {
    return defaultStubSources;
  }

  try {
    const stored = localStorage.getItem(STUB_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((item) => !REMOVED_STUB_IDS.has(getStubId(item)));

        const merged = defaultStubSources.map((fallback) => {
          const fallbackId = getStubId(fallback);
          const match = sanitized.find((item) => getStubId(item) === fallbackId);
          if (match) {
            return { ...fallback, ...match };
          }
          return fallback;
        });

        const customSources = sanitized.filter((item) => {
          const itemId = getStubId(item);
          return itemId && !defaultStubSources.some((fallback) => getStubId(fallback) === itemId);
        });
        const result = [...merged, ...customSources];
        writeStubSources(result);
        return result;
      }
    }
  } catch (error) {
    console.warn('Failed to parse stubbed search sources, falling back to defaults.', error);
  }

  return defaultStubSources;
};

const writeStubSources = (sources) => {
  if (!isBrowser()) {
    return;
  }

  try {
    const sanitized = Array.isArray(sources)
      ? sources.filter((item) => !REMOVED_STUB_IDS.has(getStubId(item)))
      : sources;
    localStorage.setItem(STUB_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.warn('Failed to persist stubbed search sources.', error);
  }
};

export const getCachedSearchSources = () => readStubSources();

export const getActiveSearchSources = () => readStubSources().filter((source) => source.enabled !== false);

export const getSourceById = (sourceId) => {
  if (!sourceId) {
    return null;
  }

  const sources = readStubSources();
  return sources.find((source) => getStubId(source) === sourceId) || null;
};

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

const toJSON = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Invalid JSON response from search sources API');
  }
};

const ensureOk = async (response) => {
  if (!response.ok) {
    const payload = await toJSON(response).catch(() => null);
    const message = payload?.message || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return response;
};

export const fetchSearchSources = async (signal) => {
  try {
    const res = await fetch(SEARCH_SOURCES_ENDPOINT, {
      method: 'GET',
      headers: defaultHeaders,
      signal
    });
    await ensureOk(res);
    const data = await toJSON(res);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    // Empty array from API is acceptable but fall back to stubs for dev visibility.
    return readStubSources();
  } catch (error) {
    // Provide stub data when the API endpoint is unavailable (local dev / offline).
    console.warn('Using stubbed search sources due to API error:', error);
    return readStubSources();
  }
};

export const updateSearchSource = async (sourceId, updates) => {
  if (!sourceId) {
    throw new Error('sourceId is required for update');
  }

  try {
    const res = await fetch(`${SEARCH_SOURCES_ENDPOINT}/${encodeURIComponent(sourceId)}`, {
      method: 'PATCH',
      headers: defaultHeaders,
      body: JSON.stringify(updates)
    });
    await ensureOk(res);
    return toJSON(res);
  } catch (error) {
    console.warn('Updating stubbed search source due to API error:', error);
    const current = readStubSources();
    const next = current.map((source) => {
      if (getStubId(source) === sourceId) {
        return { ...source, ...updates };
      }
      return source;
    });
    writeStubSources(next);
    return next.find((source) => getStubId(source) === sourceId) || null;
  }
};

export const refreshSearchSources = async () => {
  // Provide a convenience helper that simply re-fetches. This mirrors future plans for cache busting.
  return fetchSearchSources();
};

const searchSourcesService = {
  fetchSearchSources,
  updateSearchSource,
  refreshSearchSources
};

export default searchSourcesService;

function getStubId(source) {
  return source?.id ?? source?._id ?? source?.slug;
}
