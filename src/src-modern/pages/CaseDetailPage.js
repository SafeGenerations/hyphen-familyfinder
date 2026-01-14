// Case Detail Page - Family Finder with Network Visualization
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Filter, Search, Download, Phone, MessageSquare,
  Calendar, Users, CheckCircle, AlertCircle, Clock, User, MapPin, Plus
} from 'lucide-react';
import { getCase } from '../services/caseService';
import { searchContactEvents } from '../services/contactEventService';
import { getNetworkGraph } from '../services/networkDataService';
import './CaseDetailPage.css';

const CaseDetailPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('network'); // network, list, analytics, activity

  useEffect(() => {
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      // Load case data
      const data = await getCase(caseId);
      setCaseData(data);

      // Load network graph data
      try {
        const networkGraph = await getNetworkGraph(caseId);
        setNetworkData(networkGraph);
      } catch (netErr) {
        console.error('Error loading network:', netErr);
        setNetworkData({ nodes: [], edges: [], summary: null });
      }

      // Load recent activities for this case
      try {
        const contactData = await searchContactEvents({
          childId: caseId,
          limit: 10
        });
        setActivities(contactData.data || []);
      } catch (actErr) {
        console.error('Error loading activities:', actErr);
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading case:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthLabel = (health) => {
    if (health >= 12) return 'Excellent';
    if (health >= 8) return 'Healthy';
    if (health >= 5) return 'Moderate';
    return 'Needs Attention';
  };

  const getHealthColor = (health) => {
    if (health >= 12) return '#10b981';
    if (health >= 8) return '#3b82f6';
    if (health >= 5) return '#f59e0b';
    return '#dc2626';
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `about ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'email': return <Mail size={16} />;
      case 'phone': case 'call': return <Phone size={16} />;
      case 'sms': return <MessageSquare size={16} />;
      case 'meeting': return <Calendar size={16} />;
      default: return <User size={16} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return { icon: <CheckCircle size={16} />, color: '#10b981', bg: '#d1fae5' };
      case 'warming': return { icon: <Clock size={16} />, color: '#f59e0b', bg: '#fef3c7' };
      case 'pending': return { icon: <Clock size={16} />, color: '#f59e0b', bg: '#fef3c7' };
      case 'cold':
      case 'inactive': return { icon: <AlertCircle size={16} />, color: '#ef4444', bg: '#fee2e2' };
      default: return { icon: <CheckCircle size={16} />, color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  // Calculate positions for network members in a circular layout around the child
  const calculateNodePositions = (nodes) => {
    if (!nodes || nodes.length === 0) return [];

    const centerX = 300;
    const centerY = 275;
    const radius = 180;

    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
      return {
        ...node,
        id: node._id || node.id,
        name: node.name || `${node.firstName || ''} ${node.lastName || ''}`.trim(),
        role: node.relationshipToChild || node.role || 'Unknown',
        status: node.activityState || node.status || 'active',
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  };

  // Use real network data from API, with fallback to empty array
  const networkMembers = calculateNodePositions(networkData?.nodes || []);

  const childNode = { id: 'child', name: caseData?.childName || 'Child', role: 'Child', x: 300, y: 275 };

  if (loading) {
    return <div className="cd-loading">Loading case details...</div>;
  }

  if (!caseData) {
    return <div className="cd-error">Case not found</div>;
  }

  return (
    <div className="case-detail-page">
      {/* Header */}
      <div className="cd-header">
        <div className="cd-header-left">
          <button className="cd-back-button" onClick={() => navigate('/family-finder/cases')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Family Finder</h1>
            <p>{caseData.childName} - Case {caseData.caseId}</p>
          </div>
        </div>
        <div className="cd-header-right">
          <button className="cd-action-button">
            <Mail size={18} />
            Email All
          </button>
          <button className="cd-action-button">
            <Filter size={18} />
            Filters
          </button>
          <button className="cd-action-button">
            <Search size={18} />
            Search
          </button>
          <button className="cd-action-button">
            <Download size={18} />
            Export
          </button>
          <button className="cd-quick-contact">
            <Phone size={18} />
            Quick Contact
          </button>
          <button className="cd-add-member" onClick={() => navigate(`/family-finder/cases/${caseId}/add-member`)}>
            <Plus size={18} />
            Add Member
          </button>
        </div>
      </div>

      {/* Health Dashboard */}
      <div className="cd-health-dashboard">
        <div className="cd-health-card">
          <div className="cd-health-score" style={{ color: getHealthColor(networkData?.summary?.metrics?.score || caseData.networkHealth || 0) }}>
            {networkData?.summary?.metrics?.score || caseData.networkHealth || 0}<span>/15</span>
          </div>
          <div className="cd-health-label">
            <CheckCircle size={20} style={{ color: getHealthColor(networkData?.summary?.metrics?.score || caseData.networkHealth || 0) }} />
            Network Health Index<br />
            <strong style={{ color: getHealthColor(networkData?.summary?.metrics?.score || caseData.networkHealth || 0) }}>
              {getHealthLabel(networkData?.summary?.metrics?.score || caseData.networkHealth || 0)}
            </strong>
          </div>
        </div>

        <div className="cd-stat-card">
          <div className="cd-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <CheckCircle size={24} />
          </div>
          <div className="cd-stat-content">
            <div className="cd-stat-value">{networkData?.summary?.metrics?.activeCount || caseData.networkMembers?.active || 0}</div>
            <div className="cd-stat-label">Active Connections</div>
          </div>
        </div>

        <div className="cd-stat-card">
          <div className="cd-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertCircle size={24} />
          </div>
          <div className="cd-stat-content">
            <div className="cd-stat-value">{networkData?.summary?.activityBuckets?.cold || caseData.networkMembers?.inactive || 0}</div>
            <div className="cd-stat-label">Needs Follow-up</div>
          </div>
        </div>

        <div className="cd-stat-card">
          <div className="cd-stat-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}>
            <Users size={24} />
          </div>
          <div className="cd-stat-content">
            <div className="cd-stat-value">{networkData?.summary?.counts?.members || caseData.networkMembers?.total || 0}</div>
            <div className="cd-stat-label">Total Network</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cd-main-content">
        {/* Left: Network Map */}
        <div className="cd-network-section">
          <div className="cd-section-header">
            <div className="cd-tabs">
              <button 
                className={`cd-tab ${activeTab === 'network' ? 'active' : ''}`}
                onClick={() => setActiveTab('network')}
              >
                <MapPin size={16} />
                Network Map
              </button>
              <button 
                className={`cd-tab ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                <Users size={16} />
                List View
              </button>
              <button 
                className={`cd-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
              <button 
                className={`cd-tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                Activity
              </button>
            </div>
          </div>

          {activeTab === 'network' && (
            <div className="cd-network-map">
              <div className="cd-map-legend">
                <div className="cd-legend-item">
                  <div className="cd-legend-dot" style={{ background: '#10b981' }}></div>
                  <span>Active ({networkData?.summary?.activityBuckets?.active || caseData.networkMembers?.active || 0})</span>
                </div>
                <div className="cd-legend-item">
                  <div className="cd-legend-dot" style={{ background: '#f59e0b' }}></div>
                  <span>Warming ({networkData?.summary?.activityBuckets?.warming || 0})</span>
                </div>
                <div className="cd-legend-item">
                  <div className="cd-legend-dot" style={{ background: '#ef4444' }}></div>
                  <span>Cold ({networkData?.summary?.activityBuckets?.cold || 0})</span>
                </div>
              </div>

              <svg className="cd-network-svg" viewBox="0 0 600 550">
                {/* Connection lines */}
                {networkMembers.map(member => (
                  <line
                    key={`line-${member.id}`}
                    x1={childNode.x}
                    y1={childNode.y}
                    x2={member.x}
                    y2={member.y}
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                ))}

                {/* Network member nodes */}
                {networkMembers.map(member => {
                  const statusInfo = getStatusIcon(member.status);
                  return (
                    <g key={member.id}>
                      <circle
                        cx={member.x}
                        cy={member.y}
                        r="32"
                        fill={statusInfo.bg}
                        stroke={statusInfo.color}
                        strokeWidth="3"
                        className="cd-node"
                      />
                      <foreignObject
                        x={member.x - 30}
                        y={member.y + 40}
                        width="60"
                        height="50"
                      >
                        <div className="cd-node-label">
                          {member.name.split(' ')[0]}<br />
                          {member.name.split(' ')[1]}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}

                {/* Child node (pinned to center) */}
                <g>
                  <circle
                    cx={childNode.x}
                    cy={childNode.y}
                    r="40"
                    fill="#3b82f6"
                    className="cd-child-node"
                  />
                  <text
                    x={childNode.x}
                    y={childNode.y}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="600"
                    dy="5"
                  >
                    {(caseData?.childName || 'Child').split(' ')[0]}
                  </text>
                  <foreignObject
                    x={childNode.x - 30}
                    y={childNode.y + 50}
                    width="60"
                    height="30"
                  >
                    <div className="cd-node-label" style={{ fontWeight: 600 }}>
                      {childNode.name}
                    </div>
                  </foreignObject>
                </g>

                {/* Empty state message */}
                {networkMembers.length === 0 && (
                  <text
                    x="300"
                    y="450"
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize="14"
                  >
                    No network members yet. Add members to build the network.
                  </text>
                )}
              </svg>

              <div className="cd-map-tip">
                💡 Tip: Right-click any node to open context menu. Pinned nodes represent the focus child(ren).
              </div>
            </div>
          )}
        </div>

        {/* Right: Recent Activity */}
        <div className="cd-activity-section">
          <h3>Recent Activity</h3>
          <div className="cd-activity-list">
            {activities.length > 0 ? (
              activities.map((activity, index) => {
                const icon = getActivityIcon(activity.type);
                return (
                  <div key={index} className="cd-activity-item">
                    <div className="cd-activity-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                      {icon}
                    </div>
                    <div className="cd-activity-content">
                      <div className="cd-activity-title">
                        <strong>{activity.contactName || 'Unknown Contact'}:</strong> {activity.subject || 'No subject'}
                      </div>
                      <div className="cd-activity-time">{formatRelativeTime(activity.timestamp || activity.date)}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="cd-activity-item">
                  <div className="cd-activity-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    <Phone size={16} />
                  </div>
                  <div className="cd-activity-content">
                    <div className="cd-activity-title">
                      <strong>Jennifer White:</strong> Introduce Network...
                    </div>
                    <div className="cd-activity-time">about 7 hours ago</div>
                  </div>
                </div>

                <div className="cd-activity-item">
                  <div className="cd-activity-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                    <Phone size={16} />
                  </div>
                  <div className="cd-activity-content">
                    <div className="cd-activity-title">
                      <strong>Robert Johnson:</strong> Checked in on the...
                    </div>
                    <div className="cd-activity-time">about 9 hours ago</div>
                  </div>
                </div>

                <div className="cd-activity-item">
                  <div className="cd-activity-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <MessageSquare size={16} />
                  </div>
                  <div className="cd-activity-content">
                    <div className="cd-activity-title">
                      <strong>Thomas Garcia:</strong> Intro to the network
                    </div>
                    <div className="cd-activity-time">about 12 hours ago</div>
                  </div>
                </div>

                <div className="cd-activity-item">
                  <div className="cd-activity-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                    <Calendar size={16} />
                  </div>
                  <div className="cd-activity-content">
                    <div className="cd-activity-title">
                      <strong>Dr. James Wilson:</strong> Therapist check...
                    </div>
                    <div className="cd-activity-time">1 day ago</div>
                  </div>
                </div>

                <div className="cd-activity-item">
                  <div className="cd-activity-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    <Phone size={16} />
                  </div>
                  <div className="cd-activity-content">
                    <div className="cd-activity-title">
                      <strong>Jennifer White:</strong> Went over the...
                    </div>
                    <div className="cd-activity-time">2 days ago</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailPage;
