// api/contacts/search/index.js
// Azure Function to search and filter contact events

const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.COSMOS_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  cachedDb = client.db('family-finder');
  return cachedDb;
}

module.exports = async function (context, req) {
  context.log('Contact events search request received');

  try {
    const db = await connectToDatabase();
    const contactEvents = db.collection('contact_events');
    const members = db.collection('network_members');

    // Extract query parameters
    const {
      childId,
      memberId,
      contactType,
      direction,
      startDate,
      endDate,
      keyword,
      provider,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};

    if (childId) {
      filter.childId = childId;
    }

    if (memberId) {
      filter.memberId = memberId;
    }

    if (contactType) {
      // Support comma-separated list: "email,sms"
      const types = contactType.split(',').map(t => t.trim());
      filter.contactType = types.length === 1 ? types[0] : { $in: types };
    }

    if (direction) {
      filter.direction = direction;
    }

    if (provider) {
      filter['metadata.provider'] = provider;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Keyword search in notes and metadata
    if (keyword) {
      filter.$or = [
        { notes: { $regex: keyword, $options: 'i' } },
        { 'metadata.subject': { $regex: keyword, $options: 'i' } },
        { 'metadata.body': { $regex: keyword, $options: 'i' } },
        { 'metadata.to': { $regex: keyword, $options: 'i' } },
        { 'metadata.from': { $regex: keyword, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const totalCount = await contactEvents.countDocuments(filter);
    const results = await contactEvents
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Enrich results with member information
    const enrichedResults = await Promise.all(
      results.map(async (event) => {
        if (!event.memberId) return event;

        const member = await members.findOne({ _id: event.memberId });
        return {
          ...event,
          member: member ? {
            _id: member._id,
            firstName: member.firstName,
            lastName: member.lastName,
            relationship: member.relationship,
            email: member.email,
            phone: member.phone
          } : null
        };
      })
    );

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: enrichedResults,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        },
        filters: {
          childId,
          memberId,
          contactType,
          direction,
          startDate,
          endDate,
          keyword,
          provider
        }
      }
    };
  } catch (error) {
    context.log.error('Contact events search error:', error);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Internal server error',
        message: error.message
      }
    };
  }
};
