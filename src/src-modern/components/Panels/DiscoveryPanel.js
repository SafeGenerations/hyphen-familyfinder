// src/components/Panels/DiscoveryPanel.js
import React, { useMemo } from 'react';
import { X, Calendar, User, MapPin, FileText, CheckCircle } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { ConnectionStatus, getConnectionStatusConfig } from '../../constants/connectionStatus';

const DiscoveryPanel = ({ onClose }) => {
  const { state, actions } = useGenogram();
  const { relationships, people } = state;

  // Get all potential/exploring connections with their metadata
  const discoveries = useMemo(() => {
    return relationships
      .filter(r => 
        r.connectionStatus === ConnectionStatus.POTENTIAL || 
        r.connectionStatus === ConnectionStatus.EXPLORING
      )
      .map(rel => {
        const fromPerson = people.find(p => p.id === rel.from);
        const toPerson = people.find(p => p.id === rel.to);
        const statusConfig = getConnectionStatusConfig(rel.connectionStatus);
        
        return {
          id: rel.id,
          relationship: rel,
          fromPerson,
          toPerson,
          statusConfig,
          discoveryDate: rel.discoveryDate,
          discoverySource: rel.discoverySource,
          discoveryNotes: rel.discoveryNotes
        };
      })
      .sort((a, b) => {
        // Sort by discovery date, newest first
        if (!a.discoveryDate && !b.discoveryDate) return 0;
        if (!a.discoveryDate) return 1;
        if (!b.discoveryDate) return -1;
        return new Date(b.discoveryDate) - new Date(a.discoveryDate);
      });
  }, [relationships, people]);

  const handlePromoteToConfirmed = (relationshipId) => {
    const relationship = relationships.find(r => r.id === relationshipId);
    if (!relationship) return;

    actions.updateRelationship(relationshipId, {
      connectionStatus: ConnectionStatus.CONFIRMED,
      discoveryNotes: (relationship.discoveryNotes || '') + 
        `\n[Confirmed on ${new Date().toLocaleDateString()}]`
    });
  };

  const handleRuleOut = (relationshipId) => {
    const relationship = relationships.find(r => r.id === relationshipId);
    if (!relationship) return;

    actions.updateRelationship(relationshipId, {
      connectionStatus: ConnectionStatus.RULED_OUT,
      discoveryNotes: (relationship.discoveryNotes || '') + 
        `\n[Ruled out on ${new Date().toLocaleDateString()}]`
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Discovery Tracking
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
            {discoveries.length} potential connection{discoveries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {discoveries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#9ca3af'
          }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', margin: 0 }}>No pending discoveries</p>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              Use the search feature to find potential family connections
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {discoveries.map(discovery => (
              <div
                key={discovery.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Status Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    backgroundColor: discovery.statusConfig.color + '20',
                    color: discovery.statusConfig.color,
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {discovery.statusConfig.icon} {discovery.statusConfig.label}
                  </span>
                </div>

                {/* People Involved */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    <User size={14} />
                    {discovery.fromPerson?.name || 'Unknown'} 
                    <span style={{ color: '#9ca3af' }}>→</span> 
                    {discovery.toPerson?.name || 'Unknown'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                    marginLeft: '20px'
                  }}>
                    {discovery.relationship.type.charAt(0).toUpperCase() + 
                     discovery.relationship.type.slice(1).replace('-', ' ')}
                  </div>
                </div>

                {/* Discovery Details */}
                {discovery.discoveryDate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '6px'
                  }}>
                    <Calendar size={12} />
                    Discovered: {new Date(discovery.discoveryDate).toLocaleDateString()}
                  </div>
                )}

                {discovery.discoverySource && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '6px'
                  }}>
                    <MapPin size={12} />
                    Source: {discovery.discoverySource}
                  </div>
                )}

                {discovery.discoveryNotes && (
                  <div style={{
                    fontSize: '12px',
                    color: '#4b5563',
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    borderLeft: '3px solid #e5e7eb'
                  }}>
                    {discovery.discoveryNotes}
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <button
                    onClick={() => handlePromoteToConfirmed(discovery.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '7px 12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                  >
                    <CheckCircle size={14} />
                    Confirm
                  </button>
                  <button
                    onClick={() => actions.selectRelationship(discovery.relationship)}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRuleOut(discovery.id)}
                    style={{
                      padding: '7px 12px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  >
                    Rule Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {discoveries.length > 0 && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Summary by Status
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                {discoveries.filter(d => d.relationship.connectionStatus === ConnectionStatus.POTENTIAL).length}
              </span>
              <span style={{ color: '#6b7280' }}> Potential</span>
            </div>
            <div>
              <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                {discoveries.filter(d => d.relationship.connectionStatus === ConnectionStatus.EXPLORING).length}
              </span>
              <span style={{ color: '#6b7280' }}> Exploring</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryPanel;
