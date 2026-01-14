import React, { useMemo, useState } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { ConnectionStatus, PlacementStatus, CareStatus, FosterCareStatus, PLACEMENT_STATUS_CONFIG, CONNECTION_STATUS_CONFIG, FOSTER_CARE_STATUS_CONFIG } from '../../constants/connectionStatus';

const DiscoveryPanel = ({ onClose }) => {
  const { state, actions } = useGenogram();
  
  // CHILD-CENTRIC APPROACH: Filter by children needing placement
  const childrenNeedingPlacement = useMemo(() => {
    return state.people.filter(person => 
      person.careStatus === CareStatus.IN_CARE || 
      person.careStatus === CareStatus.NEEDS_PLACEMENT
    );
  }, [state.people]);
  
  // Group placements by child
  const childrenWithPlacements = useMemo(() => {
    return childrenNeedingPlacement.map(child => {
      // Get all placement options for this child
      const placements = state.placements.filter(p => 
        p.childId === child.id &&
        (p.placementStatus === PlacementStatus.POTENTIAL_TEMPORARY ||
         p.placementStatus === PlacementStatus.POTENTIAL_PERMANENT)
      );
      
      // BACKWARD COMPATIBILITY: Check relationships for legacy placement data
      const legacyPlacements = state.relationships.filter(rel =>
        rel.to === child.id &&
        (rel.placementStatus === PlacementStatus.POTENTIAL_TEMPORARY ||
         rel.placementStatus === PlacementStatus.POTENTIAL_PERMANENT)
      );
      
      // Get connections for this child (support network)
      const connections = state.relationships.filter(rel =>
        (rel.from === child.id || rel.to === child.id) &&
        (rel.connectionStatus === ConnectionStatus.POTENTIAL ||
         rel.connectionStatus === ConnectionStatus.EXPLORING)
      );
      
      return {
        child,
        placements,
        legacyPlacements,
        connections,
        totalOptions: placements.length + legacyPlacements.length + connections.length
      };
    }).filter(item => item.totalOptions > 0); // Only show children with pending options
  }, [childrenNeedingPlacement, state.placements, state.relationships]);
  
  // Available Foster Caregivers - Track all in the foster care pipeline
  const availableCaregivers = useMemo(() => {
    return state.people.filter(person =>
      person.fosterCareStatus === FosterCareStatus.INTERESTED ||
      person.fosterCareStatus === FosterCareStatus.IN_PROCESS ||
      person.fosterCareStatus === FosterCareStatus.LICENSED ||
      person.fosterCareStatus === FosterCareStatus.ACTIVE
    ).map(caregiver => {
      // Calculate availability
      const maxChildren = caregiver.fosterCareData?.maxChildren || 0;
      const currentChildren = caregiver.fosterCareData?.currentChildren || 0;
      const available = maxChildren - currentChildren;
      
      return {
        caregiver,
        available,
        isAvailable: available > 0
      };
    });
  }, [state.people]);
  
  const [matchDropdownOpen, setMatchDropdownOpen] = useState(null);
  
  const handleMatchToChild = (caregiverId, childId) => {
    // Create a placement consideration
    actions.createPlacementConsideration(childId, caregiverId, {
      placementStatus: PlacementStatus.POTENTIAL_TEMPORARY,
      discoveryMetadata: {
        discoveryDate: new Date().toISOString(),
        discoverySource: 'Manual Match',
        discoveryNotes: 'Matched from available caregiver pool'
      }
    });
    setMatchDropdownOpen(null);
  };
  
  const getPersonName = (personId) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return 'Unknown';
    return person.name || 'Unknown';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };
  
  const handleConfirmPlacement = (placement) => {
    const newStatus = placement.placementStatus === PlacementStatus.POTENTIAL_PERMANENT 
      ? PlacementStatus.CURRENT_PERMANENT 
      : PlacementStatus.CURRENT_TEMPORARY;
    
    actions.updatePlacement(placement.id, {
      placementStatus: newStatus,
      discoveryMetadata: {
        ...placement.discoveryMetadata,
        approvalDate: new Date().toISOString()
      }
    });
  };
  
  const handleConfirmLegacyPlacement = (relationship) => {
    const newStatus = relationship.placementStatus === PlacementStatus.POTENTIAL_PERMANENT 
      ? PlacementStatus.CURRENT_PERMANENT 
      : PlacementStatus.CURRENT_TEMPORARY;
    
    actions.updateRelationship(relationship.id, {
      placementStatus: newStatus,
      discoveryMetadata: {
        ...relationship.discoveryMetadata,
        approvalDate: new Date().toISOString()
      }
    });
  };
  
  const handleConfirmConnection = (relationship) => {
    actions.updateRelationship(relationship.id, {
      connectionStatus: ConnectionStatus.CONFIRMED,
      discoveryMetadata: {
        ...relationship.discoveryMetadata,
        confirmationDate: new Date().toISOString()
      }
    });
  };
  
  const handleRuleOutPlacement = (placement) => {
    actions.updatePlacement(placement.id, {
      placementStatus: PlacementStatus.RULED_OUT,
      discoveryMetadata: {
        ...placement.discoveryMetadata,
        ruledOutDate: new Date().toISOString()
      }
    });
  };
  
  const handleRuleOutLegacy = (relationship) => {
    actions.updateRelationship(relationship.id, {
      placementStatus: PlacementStatus.RULED_OUT,
      discoveryMetadata: {
        ...relationship.discoveryMetadata,
        ruledOutDate: new Date().toISOString()
      }
    });
  };
  
  const handleRuleOutConnection = (relationship) => {
    actions.updateRelationship(relationship.id, {
      connectionStatus: ConnectionStatus.RULED_OUT,
      discoveryMetadata: {
        ...relationship.discoveryMetadata,
        ruledOutDate: new Date().toISOString()
      }
    });
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '420px',
      height: '100vh',
      background: 'white',
      boxShadow: '-2px 0 12px rgba(0,0,0,0.15)',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #e5e7eb',
        background: 'linear-gradient(to bottom, #f9fafb, white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            🏠 Placement Tracking
          </h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            {childrenWithPlacements.length} child{childrenWithPlacements.length !== 1 ? 'ren' : ''} needing placement
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            borderRadius: '6px',
            color: '#6b7280',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#1f2937';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {childrenWithPlacements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#9ca3af'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ margin: '0 auto 16px', opacity: 0.5 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>No children needing placement</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              Mark a child as "In Care" or "Needs Placement" to track placement options here
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {childrenWithPlacements.map(({ child, placements, legacyPlacements, connections }) => (
              <div
                key={child.id}
                style={{
                  background: '#fafffe',
                  border: '2px solid #3b82f6',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                }}
              >
                {/* Child Header */}
                <div style={{
                  marginBottom: '14px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e0e7ff'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      👤 {child.name || 'Unnamed Child'}
                    </h3>
                    <span style={{
                      background: '#3b82f6',
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {child.careStatus === CareStatus.IN_CARE ? 'In Care' : 'Needs Placement'}
                    </span>
                  </div>
                  {child.caseData?.caseGoal && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Goal: {child.caseData.caseGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  )}
                </div>
                
                {/* Placement Options */}
                {placements.length > 0 && (
                  <div style={{ marginBottom: connections.length > 0 || legacyPlacements.length > 0 ? '16px' : '0' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#059669',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🏠 Placement Options ({placements.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {placements.map(placement => {
                        const config = PLACEMENT_STATUS_CONFIG[placement.placementStatus];
                        return (
                          <div
                            key={placement.id}
                            style={{
                              background: 'white',
                              border: `1px solid ${config.color}40`,
                              borderRadius: '8px',
                              padding: '10px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              marginBottom: '8px'
                            }}>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                                  → {getPersonName(placement.caregiverId)}
                                </div>
                                <div style={{
                                  display: 'inline-block',
                                  background: `${config.color}20`,
                                  color: config.color,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '700'
                                }}>
                                  {config.icon} {config.label}
                                </div>
                              </div>
                            </div>
                            {placement.discoveryMetadata?.discoveryDate && (
                              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                                📅 {formatDate(placement.discoveryMetadata.discoveryDate)}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleConfirmPlacement(placement)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => actions.setSelectedPlacement(placement.id)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✎ Edit
                              </button>
                              <button
                                onClick={() => handleRuleOutPlacement(placement)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Rule Out
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Legacy Placements */}
                {legacyPlacements.length > 0 && (
                  <div style={{ marginBottom: connections.length > 0 ? '16px' : '0' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#8b5cf6',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🏠 Legacy Placements ({legacyPlacements.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {legacyPlacements.map(rel => {
                        const config = PLACEMENT_STATUS_CONFIG[rel.placementStatus];
                        return (
                          <div
                            key={rel.id}
                            style={{
                              background: 'white',
                              border: `1px solid ${config.color}40`,
                              borderRadius: '8px',
                              padding: '10px'
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                              → {getPersonName(rel.from)}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleConfirmLegacyPlacement(rel)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => actions.selectRelationship(rel)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✎ Edit
                              </button>
                              <button
                                onClick={() => handleRuleOutLegacy(rel)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Rule Out
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Connections (Support Network) */}
                {connections.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#f59e0b',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🔗 Support Connections ({connections.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {connections.map(rel => {
                        const config = CONNECTION_STATUS_CONFIG[rel.connectionStatus];
                        const otherPersonId = rel.from === child.id ? rel.to : rel.from;
                        return (
                          <div
                            key={rel.id}
                            style={{
                              background: 'white',
                              border: `1px solid ${config.color}40`,
                              borderRadius: '8px',
                              padding: '10px'
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                              ↔ {getPersonName(otherPersonId)}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleConfirmConnection(rel)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Confirm
                              </button>
                              <button
                                onClick={() => actions.selectRelationship(rel)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✎ Edit
                              </button>
                              <button
                                onClick={() => handleRuleOutConnection(rel)}
                                style={{
                                  flex: 1,
                                  padding: '5px 10px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Rule Out
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Available Caregivers Section */}
        {availableCaregivers.length > 0 && (
          <>
            {/* Divider */}
            <div style={{
              margin: '32px 0 24px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div style={{ flex: 1, height: '2px', background: '#fde68a' }} />
              <span>👨‍👩‍👧‍👦 Foster Care Pipeline</span>
              <div style={{ flex: 1, height: '2px', background: '#fde68a' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {availableCaregivers.map(({ caregiver, available, isAvailable }) => {
                const config = FOSTER_CARE_STATUS_CONFIG[caregiver.fosterCareStatus];
                const data = caregiver.fosterCareData || {};
                
                return (
                  <div
                    key={caregiver.id}
                    style={{
                      background: '#fefce8',
                      border: '2px solid #fbbf24',
                      borderRadius: '12px',
                      padding: '14px',
                      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
                    }}
                  >
                    {/* Caregiver Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #fde68a'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                          {getPersonName(caregiver.id)}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: config.color,
                            color: config.textColor || '#1f2937'
                          }}
                        >
                          {config.icon} {config.label}
                        </span>
                      </div>
                      {isAvailable && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#15803d',
                          background: '#d1fae5',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          ✓ {available} Spot{available !== 1 ? 's' : ''} Available
                        </span>
                      )}
                    </div>
                    
                    {/* Caregiver Details */}
                    <div style={{ fontSize: '12px', color: '#374151', marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {data.licenseType && (
                          <div>
                            <strong>License Type:</strong> {data.licenseType.replace(/_/g, '-')}
                          </div>
                        )}
                        {data.licenseNumber && (
                          <div>
                            <strong>License #:</strong> {data.licenseNumber}
                          </div>
                        )}
                        {data.maxChildren > 0 && (
                          <div>
                            <strong>Capacity:</strong> {data.currentChildren || 0}/{data.maxChildren}
                          </div>
                        )}
                        {(data.ageRangeMin !== null || data.ageRangeMax !== null) && (
                          <div>
                            <strong>Age Range:</strong> {data.ageRangeMin || 0}-{data.ageRangeMax || 21}
                          </div>
                        )}
                        {data.licenseExpiration && (
                          <div>
                            <strong>Expires:</strong> {new Date(data.licenseExpiration).toLocaleDateString()}
                          </div>
                        )}
                        {data.specialNeeds && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <strong style={{ color: '#7c3aed' }}>✓ Special Needs Capable</strong>
                          </div>
                        )}
                      </div>
                      {data.notes && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fde68a' }}>
                          <strong>Notes:</strong> {data.notes}
                        </div>
                      )}
                    </div>
                    
                    {/* Match to Child Action - Only for licensed/active with capacity */}
                    {isAvailable && 
                     (caregiver.fosterCareStatus === FosterCareStatus.LICENSED || 
                      caregiver.fosterCareStatus === FosterCareStatus.ACTIVE) && 
                     childrenWithPlacements.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setMatchDropdownOpen(
                            matchDropdownOpen === caregiver.id ? null : caregiver.id
                          )}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>🔗 Match to Child</span>
                          <span style={{ fontSize: '10px' }}>
                            {matchDropdownOpen === caregiver.id ? '▲' : '▼'}
                          </span>
                        </button>
                        
                        {matchDropdownOpen === caregiver.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            background: 'white',
                            border: '2px solid #fbbf24',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 100,
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                            {childrenWithPlacements.map(({ child }) => (
                              <button
                                key={child.id}
                                onClick={() => handleMatchToChild(caregiver.id, child.id)}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  textAlign: 'left',
                                  background: 'white',
                                  border: 'none',
                                  borderBottom: '1px solid #fde68a',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fffbeb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                  {child.firstName || 'Unknown'} {child.lastName || ''}
                                </div>
                                {child.caseData?.caseGoal && (
                                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                    Goal: {child.caseData.caseGoal}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* Footer - updated to show both children and caregivers */}
      {(childrenWithPlacements.length > 0 || availableCaregivers.length > 0) && (
        <div style={{
          padding: '16px 20px',
          borderTop: '2px solid #e5e7eb',
          background: 'linear-gradient(to top, #f9fafb, white)',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
            Discovery Summary
          </div>
          <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
            {childrenWithPlacements.length > 0 && (
              <>
                <div>Children needing placement: <strong>{childrenWithPlacements.length}</strong></div>
                <div>Total placement options: <strong>
                  {childrenWithPlacements.reduce((sum, c) => sum + c.placements.length + c.legacyPlacements.length, 0)}
                </strong></div>
                <div>Support connections: <strong>
                  {childrenWithPlacements.reduce((sum, c) => sum + c.connections.length, 0)}
                </strong></div>
              </>
            )}
            {availableCaregivers.length > 0 && (
              <>
                {childrenWithPlacements.length > 0 && (
                  <div style={{ margin: '8px 0', height: '1px', background: '#e5e7eb' }} />
                )}
                <div>Foster care pipeline: <strong>{availableCaregivers.length}</strong></div>
                <div>Licensed/Active caregivers: <strong>
                  {availableCaregivers.filter(c => 
                    c.caregiver.fosterCareStatus === FosterCareStatus.LICENSED || 
                    c.caregiver.fosterCareStatus === FosterCareStatus.ACTIVE
                  ).length}
                </strong></div>
                <div>Total capacity available: <strong>
                  {availableCaregivers.reduce((sum, c) => sum + c.available, 0)} spots
                </strong></div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Slide-in animation */}
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default DiscoveryPanel;
