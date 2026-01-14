// My Families Dashboard - Case Management Overview
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Download, Users, AlertTriangle, TrendingUp, Flag } from 'lucide-react';
import { getCases, getCaseStats } from '../services/caseService';
import './MyFamiliesDashboard.css';

const MyFamiliesDashboard = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priority: 'all',
    search: ''
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesData, statsData] = await Promise.all([
        getCases(filters),
        getCaseStats()
      ]);
      setCases(casesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };



  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-badge-high';
      case 'medium': return 'priority-badge-medium';
      case 'low': return 'priority-badge-low';
      default: return 'priority-badge-default';
    }
  };

  const getHealthColor = (health) => {
    if (health >= 7) return '#10b981';
    if (health >= 4) return '#f59e0b';
    return '#dc2626';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="my-families-dashboard">
      {/* Header */}
      <div className="mf-header">
        <div className="mf-header-left">
          <button className="mf-back-button" onClick={() => navigate('/family-finder')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>My Families</h1>
            <p>Caseload Overview & Priority Management</p>
          </div>
        </div>
        <div className="mf-header-right">
          <button className="mf-action-button">
            <Filter size={18} />
            Filters
          </button>
          <button className="mf-action-button">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mf-stats-grid">
          <div className="mf-stat-card">
            <div className="mf-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <Users size={24} />
            </div>
            <div className="mf-stat-content">
              <div className="mf-stat-label">Total Cases</div>
              <div className="mf-stat-value">{stats.total}</div>
            </div>
          </div>

          <div className="mf-stat-card">
            <div className="mf-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="mf-stat-content">
              <div className="mf-stat-label">High Priority</div>
              <div className="mf-stat-value">{stats.byPriority.high}</div>
            </div>
          </div>

          <div className="mf-stat-card">
            <div className="mf-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <TrendingUp size={24} />
            </div>
            <div className="mf-stat-content">
              <div className="mf-stat-label">Avg Network Health</div>
              <div className="mf-stat-value">{stats.avgNetworkHealth}</div>
            </div>
          </div>

          <div className="mf-stat-card">
            <div className="mf-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Flag size={24} />
            </div>
            <div className="mf-stat-content">
              <div className="mf-stat-label">Cases with Flags</div>
              <div className="mf-stat-value">{stats.withFlags}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mf-filter-tabs">
        <button
          className={`mf-filter-tab ${filters.priority === 'all' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, priority: 'all' })}
        >
          All Cases ({stats?.total || 0})
        </button>
        <button
          className={`mf-filter-tab ${filters.priority === 'high' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, priority: 'high' })}
        >
          High Priority ({stats?.byPriority.high || 0})
        </button>
        <button
          className={`mf-filter-tab ${filters.priority === 'medium' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, priority: 'medium' })}
        >
          Medium Priority ({stats?.byPriority.medium || 0})
        </button>
        <button
          className={`mf-filter-tab ${filters.priority === 'low' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, priority: 'low' })}
        >
          Low Priority ({stats?.byPriority.low || 0})
        </button>
      </div>

      {/* Cases List */}
      <div className="mf-cases-list">
        {loading ? (
          <div className="mf-loading">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="mf-empty">No cases found</div>
        ) : (
          cases.map((caseItem) => (
            <div
              key={caseItem._id}
              className="mf-case-card"
              onClick={() => navigate(`/family-finder/cases/${caseItem._id}`)}
            >
              <div className="mf-case-header">
                <div className="mf-case-title-row">
                  <h3>{caseItem.childName}</h3>
                  <span className={`mf-priority-badge ${getPriorityBadgeClass(caseItem.priority)}`}>
                    {caseItem.priority.toUpperCase()}
                  </span>
                </div>
                <div className="mf-case-id">{caseItem.caseId}</div>
              </div>

              <div className="mf-case-metrics">
                <div className="mf-metric">
                  <div className="mf-metric-label">Network Health</div>
                  <div className="mf-metric-value">
                    <div
                      className="mf-health-bar"
                      style={{
                        background: `linear-gradient(90deg, ${getHealthColor(caseItem.networkHealth)} ${caseItem.networkHealth * 10}%, #e5e7eb ${caseItem.networkHealth * 10}%)`
                      }}
                    >
                      <span style={{ color: getHealthColor(caseItem.networkHealth) }}>
                        {caseItem.networkHealth}/10
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mf-metric">
                  <div className="mf-metric-label">Network Members</div>
                  <div className="mf-metric-value">
                    <span className="mf-members-active">{caseItem.networkMembers.active} Active</span>
                    <span className="mf-members-inactive">{caseItem.networkMembers.inactive} Inactive</span>
                  </div>
                </div>

                <div className="mf-metric">
                  <div className="mf-metric-label">Flags</div>
                  <div className="mf-metric-value">
                    {caseItem.flags && caseItem.flags.length > 0 ? (
                      caseItem.flags.map((flag, index) => (
                        <span key={index} className="mf-flag-badge">{flag}</span>
                      ))
                    ) : (
                      <span className="mf-no-flags">No issues</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mf-case-footer">
                <div className="mf-case-meta">
                  {caseItem.networkMembers.total} total network members
                </div>
                <button className="mf-view-details">View Details</button>
              </div>

              <div className="mf-case-updated">
                Last Updated {formatDate(caseItem.lastUpdated)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyFamiliesDashboard;
