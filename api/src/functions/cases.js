const { app } = require('@azure/functions');
const { getCollection, generateId } = require('../db/mongodb');

// Sample cases for database initialization
const SAMPLE_CASES = [
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
      const cases = await getCollection('cases');

      if (request.method === 'GET') {
        const url = new URL(request.url);
        const priority = url.searchParams.get('priority');
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');
        const hasFlags = url.searchParams.get('hasFlags');

        const query = {};
        if (priority && priority !== 'all') query.priority = priority;
        if (status && status !== 'all') query.status = status;
        if (hasFlags === 'true') query['flags.0'] = { $exists: true };

        let data = await cases.find(query).toArray();

        // Initialize with sample data if empty
        if (data.length === 0 && !priority && !status && !hasFlags && !search) {
          for (const sample of SAMPLE_CASES) {
            await cases.insertOne(sample);
          }
          data = SAMPLE_CASES;
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          data = data.filter(c =>
            c.childName.toLowerCase().includes(searchLower) ||
            c.caseId.toLowerCase().includes(searchLower)
          );
        }

        // Sort by priority then by last updated
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        data.sort((a, b) => {
          const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        });

        return { status: 200, headers, body: JSON.stringify(data) };
      } else {
        // POST create
        const body = await request.json();
        const newCase = {
          _id: generateId('case'),
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

        await cases.insertOne(newCase);
        context.log(`Created case: ${newCase.caseId}`);
        return { status: 201, headers, body: JSON.stringify(newCase) };
      }
    } catch (error) {
      context.error('Error in cases collection:', error);
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
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
      const cases = await getCollection('cases');

      if (request.method === 'GET') {
        const caseItem = await cases.findOne({ $or: [{ _id: id }, { caseId: id }] });
        if (!caseItem) {
          return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Case not found' }) };
        }
        return { status: 200, headers, body: JSON.stringify(caseItem) };
      } else if (request.method === 'PATCH') {
        const updates = await request.json();
        updates.lastUpdated = new Date().toISOString();

        // Recalculate priority if health or flags changed
        if (updates.networkHealth !== undefined || updates.flags !== undefined) {
          const existing = await cases.findOne({ $or: [{ _id: id }, { caseId: id }] });
          if (existing) {
            const merged = { ...existing, ...updates };
            updates.priority = calculatePriority(merged);
          }
        }

        const result = await cases.updateOne({ $or: [{ _id: id }, { caseId: id }] }, { $set: updates });
        if (result.modifiedCount === 0) {
          return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Case not found' }) };
        }

        const updated = await cases.findOne({ $or: [{ _id: id }, { caseId: id }] });
        context.log(`Updated case: ${id}`);
        return { status: 200, headers, body: JSON.stringify(updated) };
      } else {
        // DELETE
        const result = await cases.deleteOne({ $or: [{ _id: id }, { caseId: id }] });
        if (result.deletedCount === 0) {
          return { status: 404, headers, body: JSON.stringify({ success: false, error: 'Case not found' }) };
        }
        context.log(`Deleted case: ${id}`);
        return { status: 200, headers, body: JSON.stringify({ success: true }) };
      }
    } catch (error) {
      context.error('Error in cases item:', error);
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
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
      const cases = await getCollection('cases');
      const all = await cases.find({}).toArray();

      const stats = {
        total: all.length,
        byPriority: {
          high: all.filter(c => c.priority === 'high').length,
          medium: all.filter(c => c.priority === 'medium').length,
          low: all.filter(c => c.priority === 'low').length
        },
        byStatus: {
          active: all.filter(c => c.status === 'active').length,
          inactive: all.filter(c => c.status === 'inactive').length,
          closed: all.filter(c => c.status === 'closed').length
        },
        withFlags: all.filter(c => c.flags && c.flags.length > 0).length,
        avgNetworkHealth: all.length > 0
          ? (all.reduce((sum, c) => sum + (c.networkHealth || 0), 0) / all.length).toFixed(1)
          : 0
      };

      return { status: 200, headers, body: JSON.stringify(stats) };
    } catch (error) {
      context.error('Error calculating stats:', error);
      return { status: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }
});
