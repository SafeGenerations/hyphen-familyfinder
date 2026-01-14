// api/src/functions/contacts.js
const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

// File-based storage for development (persists across server restarts)
const STORAGE_FILE = path.join(__dirname, '../../.dev-data/contact-events.json');

// Ensure storage directory exists
const storageDir = path.dirname(STORAGE_FILE);
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Load existing data or initialize empty array
let contactEventsStore = [];
if (fs.existsSync(STORAGE_FILE)) {
  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    contactEventsStore = JSON.parse(data);
    console.log(`📂 Loaded ${contactEventsStore.length} contact events from storage`);
  } catch (err) {
    console.error('Error loading contact events:', err);
    contactEventsStore = [];
  }
}

// Helper to save data to file
function saveToFile() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(contactEventsStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving contact events:', err);
  }
}

// Contact Events Search
app.http('contactsSearch', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'contacts/search',
  handler: async (request, context) => {
    context.log('Contact events search request received (MOCK MODE - No DB)');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    try {
      const params = Object.fromEntries(request.query.entries());
      const { page = '1', limit = '50', sortBy = 'timestamp', sortOrder = 'desc' } = params;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      // Filter events based on query params
      let filteredEvents = [...contactEventsStore];
      
      if (params.childId) {
        filteredEvents = filteredEvents.filter(e => e.childId === params.childId);
      }
      if (params.contactType) {
        filteredEvents = filteredEvents.filter(e => e.contactType === params.contactType);
      }
      if (params.direction) {
        filteredEvents = filteredEvents.filter(e => e.direction === params.direction);
      }

      // Sort events
      filteredEvents.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (sortOrder === 'desc') {
          return aVal > bVal ? -1 : 1;
        }
        return aVal > bVal ? 1 : -1;
      });

      // Paginate
      const total = filteredEvents.length;
      const pages = Math.ceil(total / limitNum);
      const start = (pageNum - 1) * limitNum;
      const paginatedEvents = filteredEvents.slice(start, start + limitNum);

      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        jsonBody: {
          success: true,
          data: paginatedEvents,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages
          },
          filters: params
        }
      };
    } catch (error) {
      context.error('Contact events search error:', error);
      return {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        jsonBody: {
          error: 'Internal server error',
          message: error.message
        }
      };
    }
  }
});

// Contact Events Statistics
app.http('contactsStats', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'contacts/stats',
  handler: async (request, context) => {
    context.log('Contact events stats request received (MOCK MODE - No DB)');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    // Calculate stats from in-memory store
    const total = contactEventsStore.length;
    
    // Group by type
    const byType = {};
    const byDirection = {};
    const byProvider = {};
    const byMonth = {};
    
    contactEventsStore.forEach(event => {
      // By type
      byType[event.contactType] = (byType[event.contactType] || 0) + 1;
      
      // By direction
      byDirection[event.direction] = (byDirection[event.direction] || 0) + 1;
      
      // By provider
      const provider = event.metadata?.provider || 'unknown';
      byProvider[provider] = (byProvider[provider] || 0) + 1;
      
      // By month
      const date = new Date(event.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    });
    
    // Find most recent contact
    const mostRecent = contactEventsStore.length > 0
      ? contactEventsStore.reduce((latest, event) => 
          new Date(event.timestamp) > new Date(latest.timestamp) ? event : latest
        )
      : null;

    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      jsonBody: {
        success: true,
        stats: {
          total,
          byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
          byDirection: Object.entries(byDirection).map(([direction, count]) => ({ direction, count })),
          byProvider: Object.entries(byProvider).map(([provider, count]) => ({ provider, count })),
          byMonth: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
          mostRecentContact: mostRecent?.timestamp || null
        },
        filters: {}
      }
    };
  }
});

// Create Contact Event
app.http('createContactEvent', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'contacts',
  handler: async (request, context) => {
    context.log('Create contact event request received (MOCK MODE - No DB)');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
    }

    try {
      const eventData = await request.json();
      context.log('Contact event data:', eventData);

      // Check for duplicate based on caseLogId if provided
      if (eventData.metadata?.caseLogId) {
        const existingEvent = contactEventsStore.find(
          e => e.metadata?.caseLogId === eventData.metadata.caseLogId
        );
        
        if (existingEvent) {
          context.log(`⚠️ Duplicate detected - updating existing event ${existingEvent._id}`);
          // Update existing event instead of creating duplicate
          Object.assign(existingEvent, {
            ...eventData,
            _id: existingEvent._id, // Keep original ID
            createdAt: existingEvent.createdAt, // Keep original creation time
            updatedAt: new Date().toISOString()
          });
          saveToFile();
          
          return {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            jsonBody: {
              success: true,
              data: existingEvent,
              message: 'Contact event updated (deduplicated)'
            }
          };
        }
      }

      // Store in file (persists across restarts)
      const newEvent = {
        _id: Date.now().toString(),
        ...eventData,
        createdAt: new Date().toISOString()
      };
      
      contactEventsStore.push(newEvent);
      saveToFile();
      context.log(`✅ Stored contact event. Total events: ${contactEventsStore.length}`);

      return {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        jsonBody: {
          success: true,
          data: newEvent,
          message: `Contact event saved to file (${contactEventsStore.length} total events)`
        }
      };
    } catch (error) {
      context.error('Create contact event error:', error);
      return {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        jsonBody: {
          success: false,
          error: 'Internal server error',
          message: error.message
        }
      };
    }
  }
});
