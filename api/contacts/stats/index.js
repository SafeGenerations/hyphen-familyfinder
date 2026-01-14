// api/contacts/stats/index.js
// Azure Function to get contact event statistics

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
  context.log('Contact events stats request received');

  try {
    const db = await connectToDatabase();
    const contactEvents = db.collection('contact_events');

    const { childId, memberId, startDate, endDate } = req.query;

    // Build base filter
    const filter = {};
    if (childId) filter.childId = childId;
    if (memberId) filter.memberId = memberId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Aggregate statistics
    const stats = await contactEvents.aggregate([
      { $match: filter },
      {
        $facet: {
          byType: [
            { $group: { _id: '$contactType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byDirection: [
            { $group: { _id: '$direction', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byProvider: [
            { $group: { _id: '$metadata.provider', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byMonth: [
            {
              $group: {
                _id: {
                  year: { $year: '$timestamp' },
                  month: { $month: '$timestamp' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
          ],
          total: [
            { $count: 'count' }
          ],
          recent: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            { $project: { timestamp: 1 } }
          ]
        }
      }
    ]).toArray();

    const result = stats[0];

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        stats: {
          total: result.total[0]?.count || 0,
          byType: result.byType.map(item => ({ type: item._id, count: item.count })),
          byDirection: result.byDirection.map(item => ({ direction: item._id, count: item.count })),
          byProvider: result.byProvider.map(item => ({ provider: item._id, count: item.count })),
          byMonth: result.byMonth.map(item => ({
            year: item._id.year,
            month: item._id.month,
            count: item.count
          })),
          mostRecentContact: result.recent[0]?.timestamp || null
        },
        filters: { childId, memberId, startDate, endDate }
      }
    };
  } catch (error) {
    context.log.error('Contact events stats error:', error);
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
