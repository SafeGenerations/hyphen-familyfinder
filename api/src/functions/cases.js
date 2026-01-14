const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

// File-based storage for development
const STORAGE_DIR = path.join(__dirname, '../../.dev-data');
const CASES_FILE = path.join(STORAGE_DIR, 'cases.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// In-memory store
let casesStore = [];

// Load existing cases on startup
if (fs.existsSync(CASES_FILE)) {
  try {
    const data = fs.readFileSync(CASES_FILE, 'utf8');
    casesStore = JSON.parse(data);
    console.log(`📂 Loaded ${casesStore.length} cases from storage`);
  } catch (error) {
    console.error('Error loading cases:', error);
    casesStore = [];
  }
} else {
  console.log('📝 No existing cases found, initializing with sample data');

  // Initialize with sample cases
  casesStore = [
    {
      _id: 'CASE-001',
      caseId: 'CASE-CASE-001',
      childName: 'Child case-001',
      priority: 'low',
      status: 'active',
      networkHealth: 8,
      networkMembers: { active: 13, inactive: 4, total: 17 },
      flags: [],
      lastUpdated: new Date('2025-10-20').toISOString(),
      genogramData: null,
      createdAt: new Date('2025-10-01').toISOString()
    },
    {
      _id: 'CASE-002',
      caseId: 'CASE-CASE-002',
      childName: 'Marcus Johnson',
      priority: 'low',
      status: 'active',
      networkHealth: 10,
      networkMembers: { active: 3, inactive: 0, total: 3 },
      flags: [],
      lastUpdated: new Date('2025-10-19').toISOString(),
      genogramData: null,
      createdAt: new Date('2025-09-15').toISOString()
    },
    {
      _id: 'CASE-003',
      caseId: 'CASE-CASE-003',
      childName: 'Sofia Rodriguez',
      priority: 'high',
      status: 'active',
      networkHealth: 3,
      networkMembers: { active: 1, inactive: 2, total: 3 },
      flags: ['low health', 'inactive member', 'no placement option'],
      lastUpdated: new Date('2025-10-19').toISOString(),
      genogramData: null,
      createdAt: new Date('2025-08-10').toISOString()
    },
    {
      _id: 'CASE-004',
      caseId: 'CASE-CASE-004',
      childName: 'Tyler Bennett',
      priority: 'medium',
      status: 'active',
      networkHealth: 6,
      networkMembers: { active: 2, inactive: 1, total: 3 },
      flags: [],
      lastUpdated: new Date('2025-10-19').toISOString(),
      genogramData: null,
      createdAt: new Date('2025-07-20').toISOString()
    }
  ];

  saveToFile();
}

// Helper to save data to file
function saveToFile() {
  try {
    fs.writeFileSync(CASES_FILE, JSON.stringify(casesStore, null, 2));
  } catch (error) {
    console.error('Error saving cases to file:', error);
  }
}

// Calculate priority based on health and flags
function calculatePriority(caseData) {
  const { networkHealth = 5, flags = [] } = caseData;

  if (flags.some(f => ['inactive member', 'low health', 'no placement option'].includes(f))) {
    return 'high';
  }

  if (networkHealth <= 3) return 'high';
  if (networkHealth <= 6 || flags.length > 0) return 'medium';
  return 'low';
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Combined handler for /api/cases (GET list, POST create)
app.http('casesCollection', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'cases',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return { status: 204, headers };
    }

    try {
      if (request.method === 'GET') {
        const url = new URL(request.url);
        const priority = url.searchParams.get('priority');
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');
        const hasFlags = url.searchParams.get('hasFlags');

        let filtered = [...casesStore];

        // Apply filters
        if (priority && priority !== 'all') {
          filtered = filtered.filter(c => c.priority === priority);
        }

        if (status && status !== 'all') {
          filtered = filtered.filter(c => c.status === status);
        }

        if (hasFlags === 'true') {
          filtered = filtered.filter(c => c.flags && c.flags.length > 0);
        }

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(c =>
            c.childName.toLowerCase().includes(searchLower) ||
            c.caseId.toLowerCase().includes(searchLower)
          );
        }

        // Sort by priority (high > medium > low) then by last updated
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        });

        return {
          status: 200,
          headers,
          body: JSON.stringify(filtered)
        };
      } else {
        // POST create
        const body = await request.json();

        const newCase = {
          _id: `CASE-${Date.now()}`,
          caseId: body.caseId || `CASE-${Date.now()}`,
          childName: body.childName,
          priority: body.priority || calculatePriority(body),
          status: body.status || 'active',
          networkHealth: body.networkHealth || 5,
          networkMembers: body.networkMembers || { active: 0, inactive: 0, total: 0 },
          flags: body.flags || [],
          lastUpdated: new Date().toISOString(),
          genogramData: body.genogramData || null,
          createdAt: new Date().toISOString()
        };

        casesStore.push(newCase);
        saveToFile();

        context.log(`✅ Created case: ${newCase.caseId}`);

        return {
          status: 201,
          headers,
          body: JSON.stringify(newCase)
        };
      }
    } catch (error) {
      context.error('Error in cases collection:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
});

// Combined handler for /api/cases/{id} (GET, PATCH, DELETE)
app.http('casesItem', {
  methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'cases/{id}',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return { status: 204, headers };
    }

    const id = request.params.id;

    try {
      if (request.method === 'GET') {
        const caseItem = casesStore.find(c => c._id === id || c.caseId === id);

        if (!caseItem) {
          return {
            status: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Case not found' })
          };
        }

        return {
          status: 200,
          headers,
          body: JSON.stringify(caseItem)
        };
      } else if (request.method === 'PATCH') {
        const updates = await request.json();
        const index = casesStore.findIndex(c => c._id === id || c.caseId === id);

        if (index === -1) {
          return {
            status: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Case not found' })
          };
        }

        // Apply updates
        casesStore[index] = {
          ...casesStore[index],
          ...updates,
          lastUpdated: new Date().toISOString()
        };

        // Recalculate priority if health or flags changed
        if (updates.networkHealth !== undefined || updates.flags !== undefined) {
          casesStore[index].priority = calculatePriority(casesStore[index]);
        }

        saveToFile();

        context.log(`✅ Updated case: ${casesStore[index].caseId}`);

        return {
          status: 200,
          headers,
          body: JSON.stringify(casesStore[index])
        };
      } else {
        // DELETE
        const index = casesStore.findIndex(c => c._id === id || c.caseId === id);

        if (index === -1) {
          return {
            status: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Case not found' })
          };
        }

        const deleted = casesStore.splice(index, 1)[0];
        saveToFile();

        context.log(`🗑️ Deleted case: ${deleted.caseId}`);

        return {
          status: 200,
          headers,
          body: JSON.stringify({ success: true, deleted })
        };
      }
    } catch (error) {
      context.error('Error in cases item:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
});

// GET /api/cases/stats - Get case statistics
app.http('casesStats', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'cases/stats',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return { status: 204, headers };
    }

    try {
      const stats = {
        total: casesStore.length,
        byPriority: {
          high: casesStore.filter(c => c.priority === 'high').length,
          medium: casesStore.filter(c => c.priority === 'medium').length,
          low: casesStore.filter(c => c.priority === 'low').length
        },
        byStatus: {
          active: casesStore.filter(c => c.status === 'active').length,
          inactive: casesStore.filter(c => c.status === 'inactive').length,
          closed: casesStore.filter(c => c.status === 'closed').length
        },
        withFlags: casesStore.filter(c => c.flags && c.flags.length > 0).length,
        avgNetworkHealth: casesStore.length > 0
          ? (casesStore.reduce((sum, c) => sum + (c.networkHealth || 0), 0) / casesStore.length).toFixed(1)
          : 0
      };

      return {
        status: 200,
        headers,
        body: JSON.stringify(stats)
      };
    } catch (error) {
      context.error('Error calculating stats:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
});
