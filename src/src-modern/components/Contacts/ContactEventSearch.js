// src/src-modern/components/Contacts/ContactEventSearch.js
// UI component for searching and filtering contact events

import React, { useState, useEffect, useCallback } from 'react';
import {
  searchContactEvents,
  getContactEventStats,
  formatContactEvent,
  getContactTypeDisplay,
  getDirectionDisplay,
  exportContactEvents
} from '../../services/contactEventService';
import './ContactEventSearch.css';

export default function ContactEventSearch({ childId, memberId, onSelectEvent }) {
  const [filters, setFilters] = useState({
    childId: childId || '',
    memberId: memberId || '',
    contactType: '',
    direction: '',
    startDate: '',
    endDate: '',
    keyword: '',
    provider: '',
    page: 1,
    limit: 50,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  // Load contact events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchContactEvents(filters);
      setResults(response.data.map(formatContactEvent));
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await getContactEventStats({
        childId: filters.childId,
        memberId: filters.memberId,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [filters.childId, filters.memberId, filters.startDate, filters.endDate]);

  // Initial load
  useEffect(() => {
    loadEvents();
    loadStats();
  }, [loadEvents, loadStats]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page on filter change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle sort
  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await exportContactEvents(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contact-events-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    }
  };

  // Reset filters
  const handleReset = () => {
    setFilters({
      childId: childId || '',
      memberId: memberId || '',
      contactType: '',
      direction: '',
      startDate: '',
      endDate: '',
      keyword: '',
      provider: '',
      page: 1,
      limit: 50,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="contact-event-search">
      <div className="search-header">
        <h2>Contact Event History</h2>
        <div className="header-actions">
          <button onClick={() => setShowFilters(!showFilters)} className="toggle-filters-btn">
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button onClick={handleExport} className="export-btn" disabled={loading || results.length === 0}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Contacts</div>
          </div>
          {stats.byType.map(item => {
            const display = getContactTypeDisplay(item.type);
            return (
              <div key={item.type} className="stat-card">
                <div className="stat-icon">{display.icon}</div>
                <div className="stat-value">{item.count}</div>
                <div className="stat-label">{display.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Contact Type</label>
              <select
                value={filters.contactType}
                onChange={(e) => handleFilterChange('contactType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="phone">Phone</option>
                <option value="visit">Visit</option>
                <option value="letter">Letter</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Direction</label>
              <select
                value={filters.direction}
                onChange={(e) => handleFilterChange('direction', e.target.value)}
              >
                <option value="">All Directions</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Provider</label>
              <select
                value={filters.provider}
                onChange={(e) => handleFilterChange('provider', e.target.value)}
              >
                <option value="">All Providers</option>
                <option value="manual">Manual Entry</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
                <option value="twilio">Twilio</option>
              </select>
            </div>

            <div className="filter-group filter-keyword">
              <label>Keyword Search</label>
              <input
                type="text"
                placeholder="Search notes, subject, body..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={handleReset} className="reset-btn">
              Reset Filters
            </button>
            <button onClick={loadEvents} className="search-btn">
              🔍 Search
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Results Table */}
      <div className="results-section">
        {loading ? (
          <div className="loading-indicator">Loading contact events...</div>
        ) : results.length === 0 ? (
          <div className="no-results">No contact events found matching your criteria.</div>
        ) : (
          <>
            <table className="results-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('timestamp')} className="sortable">
                    Date/Time {filters.sortBy === 'timestamp' && (filters.sortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th onClick={() => handleSort('contactType')} className="sortable">
                    Type {filters.sortBy === 'contactType' && (filters.sortOrder === 'desc' ? '▼' : '▲')}
                  </th>
                  <th>Direction</th>
                  <th>Member</th>
                  <th>Details</th>
                  <th>Provider</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(event => {
                  const typeDisplay = getContactTypeDisplay(event.type);
                  const directionDisplay = getDirectionDisplay(event.direction);

                  return (
                    <tr key={event.id} onClick={() => onSelectEvent && onSelectEvent(event)}>
                      <td className="timestamp-cell">
                        {event.timestamp.toLocaleDateString()}
                        <br />
                        <span className="time">{event.timestamp.toLocaleTimeString()}</span>
                      </td>
                      <td className="type-cell">
                        <span className="type-badge" style={{ backgroundColor: typeDisplay.color }}>
                          {typeDisplay.icon} {typeDisplay.label}
                        </span>
                      </td>
                      <td className="direction-cell">
                        {directionDisplay.icon} {directionDisplay.label}
                      </td>
                      <td className="member-cell">
                        {event.member ? (
                          <>
                            <div className="member-name">{event.member.name}</div>
                            <div className="member-relationship">{event.member.relationship}</div>
                          </>
                        ) : (
                          <span className="no-member">Unknown</span>
                        )}
                      </td>
                      <td className="details-cell">
                        {event.type === 'email' && (
                          <>
                            <div><strong>To:</strong> {event.details.to}</div>
                            <div><strong>Subject:</strong> {event.details.subject}</div>
                          </>
                        )}
                        {event.type === 'sms' && (
                          <>
                            <div><strong>To:</strong> {event.details.to}</div>
                            <div className="sms-preview">{event.details.body?.substring(0, 50)}...</div>
                          </>
                        )}
                        {!['email', 'sms'].includes(event.type) && (
                          <div>—</div>
                        )}
                      </td>
                      <td className="provider-cell">{event.provider}</td>
                      <td className="notes-cell">
                        {event.notes ? (
                          <div className="notes-preview" title={event.notes}>
                            {event.notes.substring(0, 60)}
                            {event.notes.length > 60 && '...'}
                          </div>
                        ) : (
                          <span className="no-notes">—</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent && onSelectEvent(event);
                          }}
                          className="view-btn"
                          title="View Details"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="page-btn"
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.pages}
                  <span className="total-count"> ({pagination.total} total)</span>
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="page-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
