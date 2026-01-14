// src/AdminAuditLogsPage.js
// Admin page for viewing and searching audit logs

import React, { useState, useEffect } from 'react';
import { searchAuditLogs, getAuditStats } from './src-modern/services/auditService';
import AdminLayout from './AdminLayout';
import './AdminAuditLogsPage.css';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    action: 'all',
    entityType: 'all',
    dateRange: '30days',
    page: 1,
    limit: 50
  });

  // Load audit logs
  const loadAuditLogs = React.useCallback(async () => {
    setLoading(true);
    const result = await searchAuditLogs(filters);
    if (result.success) {
      setLogs(result.data || []);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const loadStats = React.useCallback(async () => {
    const result = await getAuditStats();
    if (result.success) {
      setStats(result.data);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const formatActionType = (action) => {
    if (action.includes('CREATE') || action.toLowerCase().includes('post')) return 'Created';
    if (action.includes('UPDATE') || action.toLowerCase().includes('put') || action.toLowerCase().includes('patch')) return 'Updated';
    if (action.includes('DELETE')) return 'Deleted';
    return action;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDiffCount = (diff) => {
    if (!diff) return 0;
    return Object.keys(diff).length;
  };

  return (
    <AdminLayout>
      <div className="admin-audit-logs-page">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p className="page-description">
          View all changes made to genogram data. Track who made changes, when, and see before/after states.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Audit Entries</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byAction?.created || 0}</div>
            <div className="stat-label">Created</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byAction?.updated || 0}</div>
            <div className="stat-label">Updated</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byAction?.deleted || 0}</div>
            <div className="stat-label">Deleted</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Action Type</label>
          <select 
            value={filters.action} 
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Entity Type</label>
          <select 
            value={filters.entityType} 
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Person">Person</option>
            <option value="Relationship">Relationship</option>
            <option value="Household">Household</option>
            <option value="Placement">Placement</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <select 
            value={filters.dateRange} 
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <button onClick={loadAuditLogs} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No audit logs found</h3>
            <p>Try making some changes to the genogram to see audit logs appear here.</p>
          </div>
        ) : (
          <table className="audit-logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Changes</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="timestamp-cell">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="user-cell">
                    {log.userName}
                  </td>
                  <td className="action-cell">
                    <span className={`action-badge action-${formatActionType(log.action).toLowerCase()}`}>
                      {formatActionType(log.action)}
                    </span>
                  </td>
                  <td className="entity-type-cell">
                    {log.entityType}
                  </td>
                  <td className="entity-id-cell">
                    <code>{log.entityId ? log.entityId.substring(0, 8) : 'N/A'}</code>
                  </td>
                  <td className="changes-cell">
                    {getDiffCount(log.diff) > 0 ? (
                      <span className="changes-count">
                        {getDiffCount(log.diff)} field{getDiffCount(log.diff) !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="no-changes">—</span>
                    )}
                  </td>
                  <td className="details-cell">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="audit-detail-modal" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Audit Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="close-btn">
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Metadata Section */}
              <div className="detail-section">
                <h4>Metadata</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">User:</span>
                    <span className="value">{selectedLog.userName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Action:</span>
                    <span className="value">{formatActionType(selectedLog.action)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Timestamp:</span>
                    <span className="value">{formatTimestamp(selectedLog.timestamp)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Entity Type:</span>
                    <span className="value">{selectedLog.entityType}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="label">Entity ID:</span>
                    <span className="value"><code>{selectedLog.entityId}</code></span>
                  </div>
                  {selectedLog.metadata?.name && (
                    <div className="detail-item full-width">
                      <span className="label">Name:</span>
                      <span className="value">{selectedLog.metadata.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Changes Section */}
              {selectedLog.diff && Object.keys(selectedLog.diff).length > 0 && (
                <div className="detail-section">
                  <h4>Changes ({Object.keys(selectedLog.diff).length})</h4>
                  <div className="changes-table-container">
                    <table className="changes-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Before</th>
                          <th>After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedLog.diff).map(([field, change]) => (
                          <tr key={field}>
                            <td className="field-name"><strong>{field}</strong></td>
                            <td className="old-value">
                              <code>{JSON.stringify(change.old, null, 2)}</code>
                            </td>
                            <td className="new-value">
                              <code>{JSON.stringify(change.new, null, 2)}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Full State Sections */}
              <div className="detail-section">
                <details>
                  <summary>
                    <strong>Before State</strong> (Full JSON)
                  </summary>
                  <pre className="json-display">
                    {JSON.stringify(selectedLog.beforeState, null, 2)}
                  </pre>
                </details>
              </div>

              <div className="detail-section">
                <details>
                  <summary>
                    <strong>After State</strong> (Full JSON)
                  </summary>
                  <pre className="json-display">
                    {JSON.stringify(selectedLog.afterState, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedLog(null)} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
