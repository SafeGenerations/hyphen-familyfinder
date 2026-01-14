// src/components/UI/FilterPanel.js
import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { X, Filter, User, Calendar, Tag, Heart, Clock } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { CareStatus, FosterCareStatus } from '../../constants/connectionStatus';
import { ACTIVITY_FILTERS, ACTIVITY_FILTER_META, ACTIVITY_FILTER_ORDER } from '../../constants/activityFilters';
import { getDaysSinceLastContact } from '../../utils/activityMetrics';
import SearchHistoryPanel from './SearchHistoryPanel';
import TemplateManager from './TemplateManager';

const createDefaultFilters = () => ({
  nodeType: 'all', // 'all', 'person', 'custom'
  careStatus: 'all',
  fosterCareStatus: 'all',
  connectionStatus: 'all',
  networkMember: 'all', // 'all', 'yes', 'no'
  ageRange: { min: '', max: '' },
  showDeceased: true,
  gender: 'all', // 'all', 'male', 'female', 'other'
  activity: ACTIVITY_FILTERS.ALL
});

const FilterPanel = ({ onClose }) => {
  const { state, actions } = useGenogram();
  const [activeTab, setActiveTab] = useState('filters'); // 'filters', 'history', 'templates'
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const nodeRef = React.useRef(null);
  const [filters, setFilters] = useState(createDefaultFilters);
  const activityLegend = ACTIVITY_FILTER_ORDER.filter((key) => key !== ACTIVITY_FILTERS.ALL)
    .map((key) => ACTIVITY_FILTER_META[key]);

  const applyFilters = () => {
    const activitySetting = filters.activity ?? ACTIVITY_FILTERS.ALL;

    // Apply filters to visible nodes
    const filtered = state.people.filter(person => {
      // Node type filter
      if (filters.nodeType !== 'all' && person.type !== filters.nodeType) return false;
      
      // Get age from the age field (already calculated and stored)
      const age = person.age ? parseInt(person.age) : null;
      
      // Care status filter - automatically exclude people over 26 from child welfare status filter
      if (filters.careStatus !== 'all') {
        // If filtering by a specific child welfare status, exclude people over 26
        if (age !== null && age > 26) {
          // People over 26 can't match child welfare status filters (except "Not Applicable")
          if (filters.careStatus !== CareStatus.NOT_APPLICABLE) {
            return false;
          }
        }
        // Apply the filter normally for people 26 and under, or if no age
        if (person.careStatus !== filters.careStatus) return false;
      }
      
      // Foster care status filter
      if (filters.fosterCareStatus !== 'all' && person.fosterCareStatus !== filters.fosterCareStatus) return false;
      
      // Network member filter
      if (filters.networkMember === 'yes' && !person.networkMember) return false;
      if (filters.networkMember === 'no' && person.networkMember) return false;

      if (activitySetting !== ACTIVITY_FILTERS.ALL) {
        if (!person.networkMember) return false;

        const daysSinceContact = getDaysSinceLastContact(person);
        const effectiveDays = typeof daysSinceContact === 'number' ? daysSinceContact : Number.POSITIVE_INFINITY;

        switch (activitySetting) {
          case ACTIVITY_FILTERS.ACTIVE_30:
            if (effectiveDays > 30) return false;
            break;
          case ACTIVITY_FILTERS.ACTIVE_60:
            if (effectiveDays <= 30 || effectiveDays > 60) return false;
            break;
          case ACTIVITY_FILTERS.ACTIVE_90:
            if (effectiveDays <= 60 || effectiveDays > 90) return false;
            break;
          case ACTIVITY_FILTERS.INACTIVE_90:
            if (effectiveDays <= 90) return false;
            break;
          default:
            break;
        }
      }
      
      // Deceased filter
      if (!filters.showDeceased && person.deceased) return false;
      
      // Gender filter
      if (filters.gender !== 'all' && person.gender !== filters.gender) return false;
      
      // Age range filter
      if (filters.ageRange.min || filters.ageRange.max) {
        if (age === null) return false;
        if (filters.ageRange.min && age < parseInt(filters.ageRange.min)) return false;
        if (filters.ageRange.max && age > parseInt(filters.ageRange.max)) return false;
      }
      
      return true;
    });

    // Store filtered IDs
    actions.setFilteredNodes(filtered.map(p => p.id));
    
    // Add to search history
    actions.addToSearchHistory({
      ...filters,
      ageRange: { ...filters.ageRange }
    });
    
    onClose();
  };

  const clearFilters = () => {
    setFilters(createDefaultFilters());
    actions.setFilteredNodes(null); // Show all
  };

  const handleApplyFromHistory = (historicFilters) => {
    const defaults = createDefaultFilters();
    setFilters({
      ...defaults,
      ...historicFilters,
      ageRange: {
        ...defaults.ageRange,
        ...(historicFilters?.ageRange || {})
      }
    });
    setActiveTab('filters');
  };

  const handleApplyTemplate = (template) => {
    const defaults = createDefaultFilters();
    setFilters({
      ...defaults,
      ...template.filters,
      ageRange: {
        ...defaults.ageRange,
        ...(template.filters?.ageRange || {})
      }
    });
    actions.incrementTemplateUsage(template.id);
    setShowTemplateManager(false);
    setActiveTab('filters');
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'showDeceased') return !value;
    if (key === 'ageRange') return value.min || value.max;
    return value !== 'all';
  }).length;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      
      {/* Draggable Modal */}
      <Draggable 
        nodeRef={nodeRef}
        handle=".drag-handle"
        defaultPosition={{x: 0, y: 0}}
        cancel="button"
      >
        <div
          ref={nodeRef}
          style={{
            position: 'fixed',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: '16px',
            width: '600px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            cursor: 'default',
            zIndex: 1001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="drag-handle"
            style={{
              padding: '24px 24px 0',
              borderBottom: '2px solid #e5e7eb',
              cursor: 'move',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={20} />
                Family Finder
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}` : 'No filters applied'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '6px',
                color: '#6b7280'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('filters')}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: activeTab === 'filters' ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'filters' ? '3px solid #6366f1' : '3px solid transparent',
                fontSize: '14px',
                fontWeight: activeTab === 'filters' ? '600' : '500',
                color: activeTab === 'filters' ? '#6366f1' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Filters
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: activeTab === 'history' ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'history' ? '3px solid #6366f1' : '3px solid transparent',
                fontSize: '14px',
                fontWeight: activeTab === 'history' ? '600' : '500',
                color: activeTab === 'history' ? '#6366f1' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: activeTab === 'templates' ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'templates' ? '3px solid #6366f1' : '3px solid transparent',
                fontSize: '14px',
                fontWeight: activeTab === 'templates' ? '600' : '500',
                color: activeTab === 'templates' ? '#6366f1' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Templates
            </button>
          </div>
        </div>

        {/* Filters Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'filters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Network Member - TOP PRIORITY */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
              border: '2px solid #a855f7',
              borderRadius: '12px'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '15px', 
                fontWeight: '700', 
                color: '#581c87', 
                marginBottom: '12px' 
              }}>
                <Tag size={18} />
                Network Member
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#7e22ce',
                  background: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>KEY FILTER</span>
              </label>
              <select
                value={filters.networkMember}
                onChange={(e) => setFilters({ ...filters, networkMember: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #a855f7',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="all">All People</option>
                <option value="yes">Network Members Only</option>
                <option value="no">Non-Network Only</option>
              </select>
              <div style={{ 
                marginTop: '10px', 
                padding: '10px 12px', 
                background: 'white', 
                borderRadius: '6px',
                fontSize: '12px',
                color: '#7e22ce',
                lineHeight: '1.4'
              }}>
                💡 <strong>Tip:</strong> This filter completely hides nodes. The "Highlight Network" toolbar button dims non-network members but keeps them visible.
              </div>
            </div>

            {/* Engagement Activity */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
              border: '2px solid #facc15',
              borderRadius: '12px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#92400e',
                marginBottom: '12px'
              }}>
                <Clock size={18} />
                Engagement Activity
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#b45309',
                  background: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>RECENCY</span>
              </label>
              <select
                value={filters.activity ?? ACTIVITY_FILTERS.ALL}
                onChange={(e) => setFilters({ ...filters, activity: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #facc15',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                {ACTIVITY_FILTER_ORDER.map((key) => {
                  const meta = ACTIVITY_FILTER_META[key];
                  return (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  );
                })}
              </select>
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#b45309',
                lineHeight: '1.5',
                display: 'grid',
                gap: '6px'
              }}>
                {activityLegend.map((meta) => (
                  <div key={meta.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '999px',
                      backgroundColor: meta.color,
                      display: 'inline-block'
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, color: '#92400e' }}>{meta.label}</span>
                      <span style={{ color: '#b45309' }}>{meta.description}</span>
                    </div>
                  </div>
                ))}
                <div>
                  Tracks the last documented contact logged in the case activity log or synced from outreach tools.
                </div>
              </div>
            </div>
            
            {/* Foster Care Status - PRIMARY FILTER */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '2px solid #0ea5e9',
              borderRadius: '12px'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '15px', 
                fontWeight: '700', 
                color: '#0c4a6e', 
                marginBottom: '12px' 
              }}>
                <Heart size={18} />
                Foster Care Status
              </label>
              <select
                value={filters.fosterCareStatus}
                onChange={(e) => setFilters({ ...filters, fosterCareStatus: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #0ea5e9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="all">All Statuses</option>
                <option value={FosterCareStatus.NOT_APPLICABLE}>Not Applicable</option>
                <option value={FosterCareStatus.INTERESTED}>Interested</option>
                <option value={FosterCareStatus.IN_PROCESS}>In Process</option>
                <option value={FosterCareStatus.LICENSED}>Licensed</option>
                <option value={FosterCareStatus.ACTIVE}>Active</option>
                <option value={FosterCareStatus.INACTIVE}>Inactive</option>
              </select>
              <div style={{ 
                marginTop: '10px', 
                padding: '10px 12px', 
                background: 'white', 
                borderRadius: '6px',
                fontSize: '12px',
                color: '#0369a1',
                lineHeight: '1.4'
              }}>
                💡 <strong>Quick filters:</strong> Use "Licensed" or "Active" to find potential caregivers for placement.
              </div>
            </div>

            {/* Care Status */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                <Tag size={16} />
                Child Welfare Status
              </label>
              <select
                value={filters.careStatus}
                onChange={(e) => setFilters({ ...filters, careStatus: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses</option>
                <option value={CareStatus.NOT_APPLICABLE}>Not Applicable</option>
                <option value={CareStatus.IN_CARE}>In Care</option>
                <option value={CareStatus.NEEDS_PLACEMENT}>Needs Placement</option>
                <option value={CareStatus.AT_RISK}>At Risk</option>
              </select>
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 10px', 
                background: '#fef3c7', 
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#78350f',
                lineHeight: '1.4'
              }}>
                ℹ️ <strong>Note:</strong> People over 26 years old are automatically excluded from child welfare status filters (except "Not Applicable").
              </div>
            </div>

            {/* Gender */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                <User size={16} />
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Age Range */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                <Calendar size={16} />
                Age Range
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.ageRange.min}
                  onChange={(e) => setFilters({ ...filters, ageRange: { ...filters.ageRange, min: e.target.value } })}
                  style={{
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <span style={{ color: '#6b7280' }}>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.ageRange.max}
                  onChange={(e) => setFilters({ ...filters, ageRange: { ...filters.ageRange, max: e.target.value } })}
                  style={{
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Deceased Toggle */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.showDeceased}
                  onChange={(e) => setFilters({ ...filters, showDeceased: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Show deceased persons
                </span>
              </label>
            </div>
          </div>
          )}

          {activeTab === 'history' && (
            <SearchHistoryPanel 
              onApplyFilters={handleApplyFromHistory}
              currentFilters={filters}
            />
          )}

          {activeTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#6b7280' }}>
                  Save commonly used filter combinations as templates for quick access.
                </p>
                <button
                  onClick={() => setShowTemplateManager(true)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ffffff',
                    backgroundColor: '#6366f1',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
                >
                  Manage Templates
                </button>
              </div>
              
              {state.filterTemplates.length > 0 && (
                <div>
                  <h3 style={{ 
                    margin: '0 0 12px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    Quick Apply
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {state.filterTemplates.slice(0, 5).map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = '#6366f1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#111827',
                          marginBottom: '4px'
                        }}>
                          {template.name}
                        </div>
                        {template.description && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {template.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '2px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          background: '#f9fafb'
        }}>
          <button
            onClick={clearFilters}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'white',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            Clear All
          </button>
          <button
            onClick={applyFilters}
            style={{
              flex: 2,
              padding: '12px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
          >
            Apply Filters
          </button>
        </div>
      </div>
      </Draggable>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <TemplateManager
          currentFilters={filters}
          onApplyTemplate={handleApplyTemplate}
          onClose={() => setShowTemplateManager(false)}
        />
      )}

      {/* Animation */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default FilterPanel;
