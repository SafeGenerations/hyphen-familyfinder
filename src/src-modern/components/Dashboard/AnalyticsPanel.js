import React, { useMemo, useState, useEffect } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import ChildDashboard from './ChildDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import { findChildCandidates } from '../../utils/analytics';

const AnalyticsPanel = ({ onClose }) => {
  const { state } = useGenogram();
  const childOptions = useMemo(() => findChildCandidates(state.people), [state.people]);
  const [activeTab, setActiveTab] = useState('child');
  const [selectedChildId, setSelectedChildId] = useState(() => childOptions[0]?.id || null);

  useEffect(() => {
    if (childOptions.length === 0) {
      setSelectedChildId(null);
      return;
    }
    if (!selectedChildId || !childOptions.some((child) => child.id === selectedChildId)) {
      setSelectedChildId(childOptions[0].id);
    }
  }, [childOptions, selectedChildId]);

  const renderChildSelector = () => {
    if (childOptions.length === 0) {
      return (
        <div style={{ fontSize: '13px', color: '#94a3b8', padding: '16px' }}>
          Add a child with case data or age information to view analytics.
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }} htmlFor="analytics-child-select">
          Child focus
        </label>
        <select
          id="analytics-child-select"
          value={selectedChildId || ''}
          onChange={(event) => setSelectedChildId(event.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5f5',
            fontSize: '14px',
            color: '#1e293b',
            background: 'white'
          }}
        >
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name || 'Unnamed Child'}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '430px',
      height: '100vh',
      background: '#f8fafc',
      boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.12)',
      zIndex: 35,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #e2e8f0'
    }}>
      <div style={{
        padding: '22px',
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.1em' }}>Analytics</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>Family Finder Dashboards</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Track engagement, network health, and placement readiness</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'white',
            border: '1px solid #cbd5f5',
            color: '#475569',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
          aria-label="Close analytics panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', padding: '12px 22px', gap: '8px', borderBottom: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => setActiveTab('child')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'child' ? '#eef2ff' : 'transparent',
            color: activeTab === 'child' ? '#4338ca' : '#64748b',
            fontWeight: activeTab === 'child' ? 700 : 600,
            fontSize: '13px',
            transition: 'background 0.2s'
          }}
        >
          Child Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('family')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'family' ? '#eef2ff' : 'transparent',
            color: activeTab === 'family' ? '#4338ca' : '#64748b',
            fontWeight: activeTab === 'family' ? 700 : 600,
            fontSize: '13px',
            transition: 'background 0.2s'
          }}
        >
          Family (Hyphae)
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {activeTab === 'child' && (
          <>
            {renderChildSelector()}
            {selectedChildId && <ChildDashboard childId={selectedChildId} />}
          </>
        )}
        {activeTab === 'family' && (
          <SupervisorDashboard />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
