const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

// File-based storage for development (no database needed)
const STORAGE_DIR = path.join(__dirname, '../../.dev-data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'audit-logs.json');

// In-memory store
let auditLogsStore = [];

// Configuration
const RETENTION_DAYS = 90; // Keep logs for 90 days
const MAX_LOGS = 10000; // Maximum number of logs to keep

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Clean old logs (older than retention period)
function cleanOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  
  const originalCount = auditLogsStore.length;
  auditLogsStore = auditLogsStore.filter(log => {
    return new Date(log.timestamp) > cutoffDate;
  });
  
  // If still too many logs, keep only the most recent MAX_LOGS
  if (auditLogsStore.length > MAX_LOGS) {
    auditLogsStore.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    auditLogsStore = auditLogsStore.slice(0, MAX_LOGS);
  }
  
  const removedCount = originalCount - auditLogsStore.length;
  if (removedCount > 0) {
    console.log(`🧹 Cleaned ${removedCount} old audit logs (retention: ${RETENTION_DAYS} days)`);
    saveToFile();
  }
}

// Load existing audit logs on startup
if (fs.existsSync(STORAGE_FILE)) {
  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    auditLogsStore = JSON.parse(data);
    console.log(`📂 Loaded ${auditLogsStore.length} audit logs from storage`);
    
    // Clean old logs on startup
    cleanOldLogs();
  } catch (error) {
    console.error('Error loading audit logs:', error);
    auditLogsStore = [];
  }
} else {
  console.log('📝 No existing audit logs found, starting fresh');
}

// Save to file
function saveToFile() {
  try {
    // Optimize storage: for logs older than 30 days, remove full state data
    // Keep only the diff and metadata for historical records
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const optimizedLogs = auditLogsStore.map(log => {
      const logDate = new Date(log.timestamp);
      
      // If log is older than 30 days, reduce detail
      if (logDate < thirtyDaysAgo) {
        return {
          _id: log._id,
          userId: log.userId,
          userName: log.userName,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          diff: log.diff, // Keep the diff
          timestamp: log.timestamp,
          metadata: log.metadata,
          // Remove full beforeState and afterState to save space
          _archived: true
        };
      }
      
      // Recent logs keep full detail
      return log;
    });
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(optimizedLogs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving audit logs:', error);
  }
}

// Calculate diff between before and after states
function calculateDiff(before, after) {
  const diff = {};
  
  if (!before) return { _all: { old: null, new: after } };
  if (!after) return { _all: { old: before, new: null } };
  
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        old: before[key],
        new: after[key]
      };
    }
  }
  
  return diff;
}

// GET/POST /api/audit - Search/filter audit logs (GET) or create new entry (POST)
app.http('auditMain', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'audit',
  handler: async (request, context) => {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return { status: 204, headers };
    }

    // Route to appropriate handler based on method
    if (request.method === 'GET') {
      return handleAuditSearch(request, context, headers);
    } else if (request.method === 'POST') {
      return handleAuditCreate(request, context, headers);
    }
  }
});

// Handler for GET /api/audit - Search and filter audit logs
async function handleAuditSearch(request, context, headers) {
  context.log('🔍 Searching audit logs');

    try {
      const url = new URL(request.url);
      const params = url.searchParams;

      // Extract query parameters
      const entityType = params.get('entityType') || 'all';
      const entityId = params.get('entityId');
      const action = params.get('action') || 'all';
      const userId = params.get('userId') || 'all';
      const dateRange = params.get('dateRange') || '30days';
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '50');

      // Calculate date filter
      let dateFilter = new Date(0); // Beginning of time
      const now = new Date();
      switch (dateRange) {
        case '7days':
          dateFilter = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          dateFilter = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          dateFilter = new Date(now - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          dateFilter = new Date(0);
          break;
      }

      // Filter audit logs
      let filtered = auditLogsStore.filter(log => {
        // Date filter
        if (new Date(log.timestamp) < dateFilter) return false;
        
        // Entity type filter
        if (entityType !== 'all' && log.entityType !== entityType) return false;
        
        // Entity ID filter
        if (entityId && log.entityId !== entityId) return false;
        
        // Action filter
        if (action !== 'all') {
          const logAction = log.action.toLowerCase();
          if (action === 'created' && !logAction.includes('post') && !logAction.includes('create')) return false;
          if (action === 'updated' && !logAction.includes('put') && !logAction.includes('patch') && !logAction.includes('update')) return false;
          if (action === 'deleted' && !logAction.includes('delete')) return false;
        }
        
        // User filter
        if (userId !== 'all' && log.userId !== userId) return false;
        
        return true;
      });

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Paginate
      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        status: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: paginated,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        })
      };
    } catch (error) {
      context.error('Error searching audit logs:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
}

// Handler for POST /api/audit - Create audit log entry
async function handleAuditCreate(request, context, headers) {
  context.log('📝 Creating audit log entry');

    try {
      const body = await request.json();
      const {
        userId = 'anonymous',
        userName = 'Anonymous User',
        action,
        entityType,
        entityId,
        beforeState = null,
        afterState = null,
        metadata = {}
      } = body;

      // Validate required fields
      if (!action || !entityType) {
        return {
          status: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Missing required fields: action, entityType'
          })
        };
      }

      // Calculate diff
      const diff = calculateDiff(beforeState, afterState);

      // Create audit log entry
      const auditLog = {
        _id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userName,
        action,
        entityType,
        entityId: entityId || null,
        beforeState,
        afterState,
        diff,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          source: 'frontend'
        },
        createdAt: new Date().toISOString()
      };

      // Store in memory
      auditLogsStore.push(auditLog);

      // Save to file
      saveToFile();

      context.log(`✅ Audit log created: ${action} on ${entityType}`);

      return {
        status: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Audit log entry created',
          data: auditLog,
          total: auditLogsStore.length
        })
      };
    } catch (error) {
      context.error('Error creating audit log:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
}

// GET /api/audit/stats - Get audit log statistics
app.http('auditStats', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'audit/stats',
  handler: async (request, context) => {
    context.log('📊 Getting audit log stats');

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return { status: 204, headers };
    }

    try {
      // Calculate stats
      const stats = {
        total: auditLogsStore.length,
        byAction: {},
        byEntityType: {},
        byUser: {},
        recent: auditLogsStore
          .slice()
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10)
      };

      auditLogsStore.forEach(log => {
        // By action
        const actionType = log.action.toLowerCase().includes('post') || log.action.toLowerCase().includes('create') 
          ? 'created' 
          : log.action.toLowerCase().includes('delete') 
            ? 'deleted' 
            : 'updated';
        stats.byAction[actionType] = (stats.byAction[actionType] || 0) + 1;

        // By entity type
        stats.byEntityType[log.entityType] = (stats.byEntityType[log.entityType] || 0) + 1;

        // By user
        stats.byUser[log.userName] = (stats.byUser[log.userName] || 0) + 1;
      });

      return {
        status: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: stats
        })
      };
    } catch (error) {
      context.error('Error getting audit stats:', error);
      return {
        status: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }
});
