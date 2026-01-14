// src/components/Search/PersonSearchModal.js
import React, { useState, useMemo } from 'react';
import Draggable from 'react-draggable';
import { X, Search, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { ConnectionStatus, PlacementStatus, FosterCareStatus } from '../../constants/connectionStatus';

const PersonSearchModal = ({ onClose, focusedChildId = null }) => {
  const { state, actions } = useGenogram();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'caregivers', 'relatives', 'community'
  const nodeRef = React.useRef(null);
  
  // Search within current genogram people
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    return state.people
      .filter(person => {
        // Skip if already connected to focused child (if specified)
        if (focusedChildId) {
          const isConnected = state.relationships.some(rel =>
            (rel.from === focusedChildId && rel.to === person.id) ||
            (rel.to === focusedChildId && rel.from === person.id)
          );
          if (isConnected) return false;
        }
        
        // Text search
        const matchesSearch = 
          person.firstName?.toLowerCase().includes(query) ||
          person.lastName?.toLowerCase().includes(query) ||
          person.name?.toLowerCase().includes(query) ||
          person.contactInfo?.phones?.some(p => p.number?.includes(query)) ||
          person.contactInfo?.emails?.some(e => e.address?.toLowerCase().includes(query)) ||
          person.contactInfo?.addresses?.some(a => 
            a.city?.toLowerCase().includes(query) ||
            a.state?.toLowerCase().includes(query) ||
            a.zip?.includes(query)
          );
        
        if (!matchesSearch) return false;
        
        // Filter by type
        if (filterBy === 'caregivers') {
          return person.fosterCareStatus && 
                 person.fosterCareStatus !== FosterCareStatus.NOT_APPLICABLE;
        } else if (filterBy === 'relatives') {
          return person.isNetworkMember && person.networkRole?.toLowerCase().includes('family');
        } else if (filterBy === 'community') {
          return person.isNetworkMember && !person.networkRole?.toLowerCase().includes('family');
        }
        
        return true;
      })
      .slice(0, 20); // Limit results
  }, [searchQuery, state.people, state.relationships, focusedChildId, filterBy]);
  
  const handleAddConnection = (personId, connectionType) => {
    if (!focusedChildId) {
      // If no focused child, just close and let user manually connect
      actions.selectPerson(personId);
      onClose();
      return;
    }
    
    // Create connection based on type
    if (connectionType === 'placement') {
      actions.addPlacement({
        childId: focusedChildId,
        caregiverId: personId,
        placementStatus: PlacementStatus.POTENTIAL_TEMPORARY,
        discoveryMetadata: {
          discoveryDate: new Date().toISOString(),
          discoverySource: 'Internal Search',
          discoveryNotes: 'Found via search modal'
        }
      });
    } else {
      // Create relationship
      actions.addRelationship({
        from: focusedChildId,
        to: personId,
        type: connectionType || 'support',
        connectionStatus: ConnectionStatus.POTENTIAL,
        discoveryDate: new Date().toISOString(),
        discoverySource: 'Internal Search',
        discoveryNotes: 'Found via search modal'
      });
    }
    
    onClose();
  };
  
  const getPersonDisplayName = (person) => {
    if (person.name) return person.name;
    if (person.firstName || person.lastName) {
      return `${person.firstName || ''} ${person.lastName || ''}`.trim();
    }
    return 'Unnamed Person';
  };
  
  const getPersonTypeInfo = (person) => {
    if (person.fosterCareStatus && person.fosterCareStatus !== FosterCareStatus.NOT_APPLICABLE) {
      return {
        type: 'Foster Caregiver',
        icon: '👨‍👩‍👧‍👦',
        color: '#f59e0b'
      };
    } else if (person.isNetworkMember) {
      return {
        type: person.networkRole || 'Network Member',
        icon: '🔗',
        color: '#8b5cf6'
      };
    } else {
      return {
        type: 'Person',
        icon: '👤',
        color: '#6b7280'
      };
    }
  };
  
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
        cancel="button, input"
      >
        <div
          ref={nodeRef}
          style={{
            position: 'fixed',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div
            className="drag-handle"
            style={{
              padding: '24px',
              borderBottom: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'move',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              🔍 Search Network
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
              {focusedChildId 
                ? 'Find potential connections and caregivers' 
                : 'Search existing people in your genogram'
              }
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
        
        {/* Search Controls */}
        <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, or address..."
              autoFocus
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                Filter By
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All People</option>
                <option value="caregivers">Foster Caregivers</option>
                <option value="relatives">Relatives</option>
                <option value="community">Community Supports</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {!searchQuery.trim() ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Start typing to search</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                Search by name, phone number, email, or address
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>No results found</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map((person) => {
                const typeInfo = getPersonTypeInfo(person);
                const age = person.birthYear ? new Date().getFullYear() - person.birthYear : null;
                
                return (
                  <div
                    key={person.id}
                    style={{
                      background: '#fafafa',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '16px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                    }}
                  >
                    {/* Person Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                            {getPersonDisplayName(person)}
                          </span>
                          {age && (
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>
                              ({age}y)
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: typeInfo.color + '20',
                            color: typeInfo.color,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          {typeInfo.icon} {typeInfo.type}
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                      {person.contactInfo?.phones?.[0] && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Phone size={12} />
                          {person.contactInfo.phones[0].number}
                        </div>
                      )}
                      {person.contactInfo?.emails?.[0] && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Mail size={12} />
                          {person.contactInfo.emails[0].address}
                        </div>
                      )}
                      {person.contactInfo?.addresses?.[0] && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={12} />
                          {person.contactInfo.addresses[0].city}, {person.contactInfo.addresses[0].state}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    {focusedChildId && (
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                        {(person.fosterCareStatus === FosterCareStatus.LICENSED || 
                          person.fosterCareStatus === FosterCareStatus.ACTIVE) && (
                          <button
                            onClick={() => handleAddConnection(person.id, 'placement')}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                          >
                            🏠 Consider for Placement
                          </button>
                        )}
                        <button
                          onClick={() => handleAddConnection(person.id, 'support')}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
                        >
                          🔗 Add as Connection
                        </button>
                      </div>
                    )}
                    
                    {!focusedChildId && (
                      <button
                        onClick={() => handleAddConnection(person.id, null)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#6366f1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginTop: '12px',
                          borderTop: '1px solid #e5e7eb',
                          paddingTop: '12px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            {searchQuery.trim() && (
              <>
                Showing {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} 
                {searchResults.length >= 20 && ' (limited to 20)'}
              </>
            )}
          </div>
        </div>
      </div>
      </Draggable>
      
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

export default PersonSearchModal;
