// src/AdminActivityLogTable.js
import React, { useState, useEffect, useCallback } from 'react';
import { searchAuditLogs } from './src-modern/services/auditService';
import { searchContactEvents } from './src-modern/services/contactEventService';
import AdminLayout from './AdminLayout';
import './AdminActivityLogTable.css';

const AdminActivityLogTable = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: 'all',
    activityType: 'all', // all, audit, contact
    dateRange: '30',
    searchTerm: '',
    page: 1,
    limit: 100
  });
  const [stats, setStats] = useState({
    totalActivities: 0,
    auditLogs: 0,
    contactEvents: 0,
    todayCount: 0
  });
  
  // Table sorting
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Load and merge activities from both sources
  const loadActivities = useCallback(async () => {
    setLoading(true);
    console.log('🔄 Loading activities with filters:', filters);
    try {
      // First, load the current genogram data to get person names
      let personNames = {};
      try {
        // Load from the actual auto-save key used by the app
        const savedData = localStorage.getItem('genogram_autosave');
        
        if (savedData) {
          const genogramData = JSON.parse(savedData);
          console.log(`✅ Found genogram data in localStorage (genogram_autosave)`);
          
          const people = genogramData.people || [];
          console.log(`📦 Found ${people.length} people in genogram data`);
          
          personNames = people.reduce((acc, person) => {
            if (person.id) {
              acc[person.id] = person.name || 'Unnamed Person';
              console.log(`  - ${person.id}: ${person.name}`);
            }
            return acc;
          }, {});
        } else {
          console.warn('⚠️ No genogram data found in localStorage (genogram_autosave)');
          console.log('💡 Tip: Open the main genogram editor and make a change to trigger auto-save');
        }
      } catch (err) {
        console.error('❌ Error loading person names from genogram data:', err);
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (filters.dateRange !== 'all') {
        startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1); // 1 year for 'all'
      }

      // Fetch audit logs
      let auditPromise = Promise.resolve({ success: true, data: [] });
      if (filters.activityType === 'all' || filters.activityType === 'audit') {
        const auditParams = {
          entityType: filters.entityType === 'all' ? 'all' : filters.entityType,
          entityId: null,
          action: 'all',
          userId: 'all',
          dateRange: filters.dateRange === 'all' ? 'all' : `${filters.dateRange}days`,
          page: 1,
          limit: 1000
        };
        console.log('📤 Fetching audit logs with params:', auditParams);
        auditPromise = searchAuditLogs(auditParams);
      }

      // Fetch contact events
      let contactPromise = Promise.resolve({ success: true, data: [] });
      if (filters.activityType === 'all' || filters.activityType === 'contact') {
        const contactParams = {
          entityType: filters.entityType === 'all' ? null : filters.entityType,
          dateRange: filters.dateRange === 'all' ? null : { start: startDate.toISOString(), end: endDate.toISOString() }
        };
        console.log('📤 Fetching contact events with params:', contactParams);
        contactPromise = searchContactEvents(contactParams);
      }

      const [auditResult, contactResult] = await Promise.all([auditPromise, contactPromise]);

      console.log('📥 Fetched:', {
        auditLogs: auditResult.data?.length || 0,
        contactEvents: contactResult.data?.length || 0,
        personNamesLoaded: Object.keys(personNames).length
      });

      // Transform audit logs to unified format
      const auditActivities = (auditResult.data || []).map((log, index) => {
        const name = log.metadata?.name || personNames[log.entityId] || log.entityId || 'Unknown';
        return {
          id: `audit-${log._id || log.id || index}`,
          type: 'audit',
          timestamp: log.timestamp,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          entityName: name,
          user: log.userName || log.userId || 'System',
          description: getAuditDescription(log),
          metadata: log.metadata
        };
      });

      // Transform contact events to unified format
      const contactActivities = (contactResult.data || []).map((event, index) => {
        const childId = event.childId || event.memberId || event.entityId;
        const name = personNames[childId] || event.metadata?.name || 'Unknown Person';
        // Use createdAt as the actual timestamp (timestamp field is just a date)
        const actualTimestamp = event.createdAt || event.timestamp;
        return {
          id: `contact-${event._id || event.id || index}`,
          type: 'contact',
          timestamp: actualTimestamp,
          action: event.contactType || event.eventType,
          entityType: 'Person',
          entityId: childId,
          entityName: name,
          user: event.metadata?.worker || event.createdBy || 'System',
          description: event.notes || '',
          direction: event.direction,
          metadata: event.metadata
        };
      });

      // Merge and sort
      let merged = [...auditActivities, ...contactActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Deduplicate by ID (in case API returns duplicates)
      const seen = new Set();
      merged = merged.filter(activity => {
        if (seen.has(activity.id)) {
          return false;
        }
        seen.add(activity.id);
        return true;
      });
      
      console.log(`✅ After deduplication: ${merged.length} unique activities`);

      // Apply search filter
      let filtered = merged;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = merged.filter(activity => 
          activity.entityName?.toLowerCase().includes(term) ||
          activity.description?.toLowerCase().includes(term) ||
          activity.user.toLowerCase().includes(term) ||
          activity.entityId?.toLowerCase().includes(term)
        );
      }

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayActivities = filtered.filter(a => new Date(a.timestamp) >= today);

      setStats({
        totalActivities: filtered.length,
        auditLogs: auditActivities.length,
        contactEvents: contactActivities.length,
        todayCount: todayActivities.length
      });

      setActivities(filtered);

    } catch (error) {
      console.error('❌ Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Helper to format audit descriptions
  const getAuditDescription = (log) => {
    if (log.action === 'UPDATE_PERSON' && log.metadata?.updatedFields) {
      const fields = log.metadata.updatedFields;
      // Limit to first 5 fields to keep description concise
      const displayFields = fields.slice(0, 5).join(', ');
      const more = fields.length > 5 ? ` +${fields.length - 5} more` : '';
      return `Modified: ${displayFields}${more}`;
    }
    if (log.action === 'DELETE_PERSON') return 'Removed from system';
    if (log.action === 'CREATE_PERSON') return 'Added to genogram';
    return log.action.replace(/_/g, ' ').toLowerCase();
  };

  // Sort activities
  const sortedActivities = React.useMemo(() => {
    return [...activities].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortColumn) {
        case 'timestamp':
          aVal = new Date(a.timestamp);
          bVal = new Date(b.timestamp);
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'action':
          aVal = a.action;
          bVal = b.action;
          break;
        case 'entity':
          aVal = a.entityName;
          bVal = b.entityName;
          break;
        case 'user':
          aVal = a.user;
          bVal = b.user;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activities, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeIcon = (type) => {
    return type === 'audit' ? '📝' : '📞';
  };

  const getActionIcon = (action, type) => {
    if (type === 'audit') {
      if (action.includes('CREATE')) return '➕';
      if (action.includes('UPDATE')) return '✏️';
      if (action.includes('DELETE')) return '🗑️';
      return '📝';
    }
    // Contact events
    switch (action) {
      case 'email': return '📧';
      case 'sms': return '💬';
      case 'phone': return '📞';
      case 'visit': return '🏠';
      case 'meeting': return '🤝';
      default: return '📋';
    }
  };

  return (
    <AdminLayout>
      <div className="admin-activity-log-page">
      <div className="page-header">
        <h1>Activity Log</h1>
        <p>Track all system changes and contact events</p>
        <button onClick={() => loadActivities()} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="activity-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalActivities}</div>
            <div className="stat-label">Total Activities</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{stats.auditLogs}</div>
            <div className="stat-label">Audit Logs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📞</div>
          <div className="stat-content">
            <div className="stat-value">{stats.contactEvents}</div>
            <div className="stat-label">Contact Events</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.todayCount}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="activity-filters">
        <div className="filter-group">
          <label>Activity Type</label>
          <select 
            value={filters.activityType} 
            onChange={(e) => setFilters({ ...filters, activityType: e.target.value, page: 1 })}
          >
            <option value="all">All Activities</option>
            <option value="audit">Audit Logs Only</option>
            <option value="contact">Contact Events Only</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Entity Type</label>
          <select 
            value={filters.entityType} 
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value, page: 1 })}
          >
            <option value="all">All Types</option>
            <option value="Person">Person</option>
            <option value="Relationship">Relationship</option>
            <option value="Household">Household</option>
            <option value="Placement">Placement</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Time Period</label>
          <select 
            value={filters.dateRange} 
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, page: 1 })}
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by name, user, or entity ID..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {/* Activity Table */}
      <div className="activity-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading activity log...</p>
          </div>
        ) : sortedActivities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Activities Found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <table className="activity-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('timestamp')} className="sortable">
                  Date/Time {getSortIcon('timestamp')}
                </th>
                <th onClick={() => handleSort('type')} className="sortable">
                  Type {getSortIcon('type')}
                </th>
                <th onClick={() => handleSort('action')} className="sortable">
                  Action {getSortIcon('action')}
                </th>
                <th onClick={() => handleSort('entity')} className="sortable">
                  Who/What {getSortIcon('entity')}
                </th>
                <th>Description</th>
                <th onClick={() => handleSort('user')} className="sortable">
                  Worker {getSortIcon('user')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="timestamp-cell">
                    {formatTimestamp(activity.timestamp)}
                  </td>
                  <td className="type-cell">
                    <span className={`type-badge ${activity.type}`}>
                      {getTypeIcon(activity.type)} {activity.type}
                    </span>
                  </td>
                  <td className="action-cell">
                    <span className="action-badge">
                      {getActionIcon(activity.action, activity.type)}
                      {' '}
                      {activity.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    {activity.direction && (
                      <span className={`direction-badge ${activity.direction}`}>
                        {activity.direction === 'outbound' ? '↗️' : '↙️'}
                      </span>
                    )}
                  </td>
                  <td className="entity-cell">
                    <div className="entity-info">
                      <strong>{activity.entityName}</strong>
                      <span className="entity-type">{activity.entityType}</span>
                    </div>
                  </td>
                  <td className="description-cell">
                    {activity.description}
                  </td>
                  <td className="user-cell">
                    {activity.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-footer">
        <div className="showing-info">
          Showing {sortedActivities.length} of {stats.totalActivities} activities
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminActivityLogTable;
