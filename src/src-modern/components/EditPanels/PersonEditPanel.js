// src/components/EditPanels/PersonEditPanel.js
import React, { useRef, useEffect, useState } from 'react';
import { Heart, Users, X, Trash2, Link2, Baby, UserX, Phone, Mail, MapPin, Plus, FileText, Calendar, User } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { usePersonActions } from '../../hooks/usePersonActions';
import { calculateAge } from '../../utils/age';
import { normalizeDeceasedSelection } from '../../utils/deceasedSymbolHelpers';
import { CareStatus, CARE_STATUS_OPTIONS, CASE_GOAL_OPTIONS, FosterCareStatus, FOSTER_CARE_STATUS_OPTIONS, LICENSE_TYPE_OPTIONS } from '../../constants/connectionStatus';
import DeceasedSymbolPicker from '../common/DeceasedSymbolPicker';
import AddChildButton from '../UI/AddChildButton';
import { createContactEvent } from '../../services/contactEventService';

const PersonEditPanel = () => {
  const { state, actions } = useGenogram();
  const { selectedPerson, relationships, tagDefinitions } = state;
  const { 
    createSpouse, 
    createParents, 
    createChild,
    startConnectionFromPerson,
    deleteSelectedPerson,
    disconnectChildFromParents
  } = usePersonActions();
  
  const [activeTab, setActiveTab] = useState('basic');
  const nameInputRef = useRef(null);
  const ageInputRef = useRef(null);
  const contactEventSyncTimerRef = useRef(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (selectedPerson && nameInputRef.current && activeTab === 'basic') {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [selectedPerson?.id, activeTab]);

  // Force re-render when tagDefinitions change
  useEffect(() => {
    forceUpdate({});
  }, [tagDefinitions.length, tagDefinitions]);

  if (!selectedPerson) return null;

  const { symbol: deceasedSymbolValue, gentle: deceasedGentleValue } = normalizeDeceasedSelection(selectedPerson);

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter' && ageInputRef.current) {
      e.preventDefault();
      ageInputRef.current.focus();
      // Don't try to select text in number input - just focus it
      ageInputRef.current.select();
    }
  };

  const updatePerson = (updates) => {
    actions.updatePerson(selectedPerson.id, updates);
  };

  const hasParents = relationships.some(r => r.type === 'child' && r.to === selectedPerson.id);

  // Tab styles
  const tabButtonStyle = (isActive) => ({
    flex: 1,
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: isActive ? '#6366f1' : '#6b7280',
    backgroundColor: isActive ? '#eef2ff' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => setActiveTab('basic')}
          style={tabButtonStyle(activeTab === 'basic')}
        >
          <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Basic
        </button>
        <button
          onClick={() => setActiveTab('caselog')}
          style={tabButtonStyle(activeTab === 'caselog')}
        >
          <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Case Log
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          style={tabButtonStyle(activeTab === 'contacts')}
        >
          <Phone size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Contacts
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'caselog' && renderCaseLogTab()}
        {activeTab === 'contacts' && renderContactsTab()}
      </div>
    </div>
  );

  function renderBasicTab() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Name */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Full Name
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={selectedPerson.name}
          onChange={(e) => updatePerson({ name: e.target.value })}
          onKeyDown={handleNameKeyDown}
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            backgroundColor: '#f9fafb'
          }}
        />
      </div>

      {/* Gender Identity */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Gender Identity
        </label>
        <select
          id="gender-identity-select"
          value={selectedPerson.gender}
          onChange={(e) => updatePerson({ gender: e.target.value })}
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            backgroundColor: '#f9fafb'
          }}
        >
          <option value="male">Male (Square)</option>
          <option value="female">Female (Circle)</option>
          <option value="non-binary">Non-Binary (Diamond)</option>
          <option value="transgender-male">Transgender Male</option>
          <option value="transgender-female">Transgender Female</option>
          <option value="genderfluid">Genderfluid (Triangle)</option>
          <option value="agender">Agender (Hexagon)</option>
          <option value="unknown">Unknown (?)</option>
        </select>
      </div>

      {/* Sexual Orientation */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Sexual Orientation
        </label>
        <select
          value={selectedPerson.sexualOrientation || 'not-specified'}
          onChange={(e) => updatePerson({ sexualOrientation: e.target.value })}
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            backgroundColor: '#f9fafb'
          }}
        >
          <option value="not-specified">Not Specified</option>
          <option value="heterosexual">Heterosexual</option>
          <option value="gay">Gay</option>
          <option value="lesbian">Lesbian</option>
          <option value="bisexual">Bisexual</option>
          <option value="pansexual">Pansexual</option>
          <option value="asexual">Asexual</option>
          <option value="queer">Queer</option>
          <option value="questioning">Questioning</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Birth Date and Age */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Birth Date
          </label>
          <input
            type="date"
            value={selectedPerson.birthDate || ''}
            onChange={(e) => {
              const updates = { birthDate: e.target.value };
              if (e.target.value) {
                const ageYears = calculateAge(
                  e.target.value,
                  selectedPerson.deathDate,
                  selectedPerson.isDeceased
                );
                updates.age = ageYears;
              }
              updatePerson(updates);
            }}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              backgroundColor: '#f9fafb'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Age
          </label>
          <input
            ref={ageInputRef}
            type="number"
            value={selectedPerson.age || ''}
            onChange={(e) => updatePerson({ age: e.target.value })}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              backgroundColor: '#f9fafb'
            }}
          />
        </div>
      </div>

      {/* Deceased checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
        <input
          type="checkbox"
          id="deceased"
          checked={selectedPerson.isDeceased}
          onChange={(e) => {
            const checked = e.target.checked;
            const updates = { isDeceased: checked };
            if (checked && !selectedPerson.deceasedSymbol) {
              updates.deceasedSymbol = 'halo';
            }
            updatePerson(updates);
          }}
          style={{ width: '16px', height: '16px' }}
        />
        <label htmlFor="deceased" style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Person is deceased
        </label>
      </div>

      {/* Date Deceased (appears when deceased is checked) */}
      {selectedPerson.isDeceased && (
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Date Deceased
          </label>
          <input
            type="date"
            value={selectedPerson.deathDate || ''}
            onChange={(e) => {
              const updates = { deathDate: e.target.value };
              if (selectedPerson.birthDate && e.target.value) {
                const ageYears = calculateAge(
                  selectedPerson.birthDate,
                  e.target.value,
                  true
                );
                updates.age = ageYears;
              }
              updatePerson(updates);
            }}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              backgroundColor: '#f9fafb'
            }}
          />
        </div>
      )}

      {selectedPerson.isDeceased && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Remembrance symbol</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Optional</span>
          </div>
          <DeceasedSymbolPicker
            symbolValue={deceasedSymbolValue}
            gentleValue={deceasedGentleValue}
            onChange={(symbol, gentle) =>
              updatePerson({
                deceasedSymbol: symbol,
                deceasedGentleTreatment: gentle
              })
            }
          />
        </div>
      )}

      {/* Special Status */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Special Status
        </label>
        <select
          value={selectedPerson.specialStatus || 'none'}
          onChange={(e) => updatePerson({ specialStatus: e.target.value === 'none' ? null : e.target.value })}
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            backgroundColor: '#f9fafb'
          }}
        >
          <option value="none">None</option>
          <option value="adopted">Adopted</option>
          <option value="foster">Foster</option>
          <option value="unborn">Unborn/Fetus</option>
        </select>
      </div>

      {/* Pregnancy Status - Available for all genders except male */}
      {selectedPerson.gender !== 'male' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px' }}>
            <input
              type="checkbox"
              id="is-pregnant"
              checked={selectedPerson.isPregnant || false}
              onChange={(e) => updatePerson({ isPregnant: e.target.checked })}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="is-pregnant" style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
              Currently Pregnant
            </label>
          </div>

          {/* Pregnancy Details */}
          {selectedPerson.isPregnant && (
            <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#92400e', marginBottom: '6px' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={selectedPerson.dueDate || ''}
                    onChange={(e) => updatePerson({ dueDate: e.target.value })}
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#92400e', marginBottom: '6px' }}>
                    Weeks
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="42"
                    value={selectedPerson.gestationalWeeks || ''}
                    onChange={(e) => updatePerson({ gestationalWeeks: e.target.value })}
                    placeholder="e.g., 28"
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#92400e', marginBottom: '6px' }}>
                  Pregnancy Notes
                </label>
                <textarea
                  value={selectedPerson.pregnancyNotes || ''}
                  onChange={(e) => updatePerson({ pregnancyNotes: e.target.value })}
                  placeholder="e.g., twins expected, high-risk pregnancy..."
                  style={{
                    width: '100%',
                    height: '60px',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: 'white',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Network Member */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
        <input
          type="checkbox"
          id="network-member"
          checked={selectedPerson.networkMember || false}
          onChange={(e) => updatePerson({ networkMember: e.target.checked })}
          style={{ width: '16px', height: '16px' }}
        />
        <label htmlFor="network-member" style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
          Network Member
        </label>
      </div>

      {/* Role and Notes (if network member) */}
      {selectedPerson.networkMember && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Role
            </label>
            <input
              type="text"
              value={selectedPerson.role || ''}
              onChange={(e) => updatePerson({ role: e.target.value })}
              placeholder="e.g., Therapist, Case Worker..."
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Network Notes
            </label>
            <textarea
              value={selectedPerson.networkNotes || ''}
              onChange={(e) => updatePerson({ networkNotes: e.target.value })}
              style={{
                width: '100%',
                height: '80px',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                resize: 'vertical'
              }}
            />
          </div>
        </>
      )}

      {/* Tags Section */}
      <div style={{ padding: '16px', backgroundColor: '#fef9c3', borderRadius: '12px', border: '2px solid #f59e0b' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🏷️</span> Tags
        </h4>
        
        {tagDefinitions.length === 0 ? (
          <div style={{ 
            padding: '12px', 
            background: 'white', 
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            No tags created yet. Use the Tags button in the toolbar to create tags.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Current Tags */}
            {selectedPerson.tags && selectedPerson.tags.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>
                  Current Tags:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedPerson.tags.map(tagId => {
                    const tagDef = tagDefinitions.find(t => t.id === tagId);
                    if (!tagDef) return null;
                    return (
                      <div
                        key={tagId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: tagDef.color,
                          color: 'white',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {tagDef.name}
                        <button
                          onClick={() => actions.removeTagFromPerson(selectedPerson.id, tagId)}
                          style={{
                            background: 'rgba(255,255,255,0.3)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '12px',
                            lineHeight: '1'
                          }}
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Available Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>
                {selectedPerson.tags && selectedPerson.tags.length > 0 ? 'Add More:' : 'Available Tags:'}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tagDefinitions
                  .filter(tag => !selectedPerson.tags?.includes(tag.id))
                  .map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => actions.addTagToPerson(selectedPerson.id, tag.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        backgroundColor: 'white',
                        border: `2px solid ${tag.color}`,
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: tag.color,
                        cursor: 'pointer'
                      }}
                      title={tag.description || tag.name}
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: tag.color
                      }} />
                      {tag.name}
                    </button>
                  ))}
                {tagDefinitions.every(tag => selectedPerson.tags?.includes(tag.id)) && (
                  <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                    All tags applied
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Care Status - Child Welfare Case Management */}
      <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '2px solid #3b82f6' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🏠</span> Child Welfare Status
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Age Check - Hide child welfare options for people over 26 */}
          {(() => {
            // Use the age field directly if available
            const age = selectedPerson.age ? parseInt(selectedPerson.age) : null;
            const isOver26 = age !== null && age > 26;
            
            if (isOver26) {
              return (
                <div style={{ 
                  padding: '12px', 
                  background: '#fef3c7', 
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#78350f',
                  lineHeight: '1.5'
                }}>
                  ℹ️ <strong>Note:</strong> This person is {age} years old. Child welfare status options are not applicable for individuals over 26.
                </div>
              );
            }
            
            return (
              <>
                {/* Care Status Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Care Status
                  </label>
                  <select
                    value={selectedPerson.careStatus || CareStatus.NOT_APPLICABLE}
                    onChange={(e) => updatePerson({ careStatus: e.target.value })}
                    style={{
                      width: '100%',
                      border: '1px solid #93c5fd',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      backgroundColor: 'white',
                      fontWeight: '500'
                    }}
                  >
                    {CARE_STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            );
          })()}
          
          {/* Case Data Fields - Only show if child is in care or needs placement */}
          {(selectedPerson.careStatus === CareStatus.IN_CARE || 
            selectedPerson.careStatus === CareStatus.NEEDS_PLACEMENT) && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Removal Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Removal Date
                  </label>
                  <input
                    type="date"
                    value={selectedPerson.caseData?.removalDate || ''}
                    onChange={(e) => updatePerson({ 
                      caseData: { ...selectedPerson.caseData, removalDate: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                
                {/* Permanency Timeline */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Permanency Date
                  </label>
                  <input
                    type="date"
                    value={selectedPerson.caseData?.permanencyTimeline || ''}
                    onChange={(e) => updatePerson({ 
                      caseData: { ...selectedPerson.caseData, permanencyTimeline: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
              
              {/* Case Goal */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Case Goal
                </label>
                <select
                  value={selectedPerson.caseData?.caseGoal || ''}
                  onChange={(e) => updatePerson({ 
                    caseData: { ...selectedPerson.caseData, caseGoal: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Goal...</option>
                  {CASE_GOAL_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Caseworker Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Caseworker
                </label>
                <input
                  type="text"
                  value={selectedPerson.caseData?.caseworker || ''}
                  onChange={(e) => updatePerson({ 
                    caseData: { ...selectedPerson.caseData, caseworker: e.target.value }
                  })}
                  placeholder="e.g., Jane Smith"
                  style={{
                    width: '100%',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              
              {/* Case Number */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Case Number
                </label>
                <input
                  type="text"
                  value={selectedPerson.caseData?.caseNumber || ''}
                  onChange={(e) => updatePerson({ 
                    caseData: { ...selectedPerson.caseData, caseNumber: e.target.value }
                  })}
                  placeholder="e.g., CPS-2025-001"
                  style={{
                    width: '100%',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Foster Care Caregiver Status */}
      <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>👨‍👩‍👧‍👦</span> Foster Care Status
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Foster Care Status Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Foster Care Status
            </label>
            <select
              value={selectedPerson.fosterCareStatus || FosterCareStatus.NOT_APPLICABLE}
              onChange={(e) => updatePerson({ fosterCareStatus: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                backgroundColor: 'white',
                fontWeight: '500'
              }}
            >
              {FOSTER_CARE_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* License Data Fields - Show if licensed or active */}
          {(selectedPerson.fosterCareStatus === FosterCareStatus.LICENSED || 
            selectedPerson.fosterCareStatus === FosterCareStatus.ACTIVE ||
            selectedPerson.fosterCareStatus === FosterCareStatus.IN_PROCESS) && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* License Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    License Number
                  </label>
                  <input
                    type="text"
                    value={selectedPerson.fosterCareData?.licenseNumber || ''}
                    onChange={(e) => updatePerson({ 
                      fosterCareData: { ...selectedPerson.fosterCareData, licenseNumber: e.target.value }
                    })}
                    placeholder="FC-2025-001"
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                
                {/* License Expiration */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    License Expires
                  </label>
                  <input
                    type="date"
                    value={selectedPerson.fosterCareData?.licenseExpiration || ''}
                    onChange={(e) => updatePerson({ 
                      fosterCareData: { ...selectedPerson.fosterCareData, licenseExpiration: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
              
              {/* License Type */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  License Type
                </label>
                <select
                  value={selectedPerson.fosterCareData?.licenseType || ''}
                  onChange={(e) => updatePerson({ 
                    fosterCareData: { ...selectedPerson.fosterCareData, licenseType: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Type...</option>
                  {LICENSE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Max Children */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedPerson.fosterCareData?.maxChildren || ''}
                    onChange={(e) => updatePerson({ 
                      fosterCareData: { ...selectedPerson.fosterCareData, maxChildren: parseInt(e.target.value) || null }
                    })}
                    placeholder="3"
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                
                {/* Current Children */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Current Placements
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={selectedPerson.fosterCareData?.currentChildren || 0}
                    onChange={(e) => updatePerson({ 
                      fosterCareData: { ...selectedPerson.fosterCareData, currentChildren: parseInt(e.target.value) || 0 }
                    })}
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
              
              {/* Age Range */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Age Range Preference
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="21"
                    value={selectedPerson.fosterCareData?.ageRangeMin || ''}
                    onChange={(e) => updatePerson({ 
                      fosterCareData: { ...selectedPerson.fosterCareData, ageRangeMin: parseInt(e.target.value) || null }
                    })}
                    placeholder="Min"
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>to</span>
                  <input
                    type="number"
                    min="0"
                    max="21"
                    value={selectedPerson.fosterCareData?.ageRangeMax || ''}
                    onChange={(e) => updatePerson({ 
                      fosterCareData: { ...selectedPerson.fosterCareData, ageRangeMax: parseInt(e.target.value) || null }
                    })}
                    placeholder="Max"
                    style={{
                      width: '100%',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
              
              {/* Special Needs Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="special-needs"
                  checked={selectedPerson.fosterCareData?.specialNeeds || false}
                  onChange={(e) => updatePerson({ 
                    fosterCareData: { ...selectedPerson.fosterCareData, specialNeeds: e.target.checked }
                  })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="special-needs" style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  Able to care for children with special needs
                </label>
              </div>
              
              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Notes
                </label>
                <textarea
                  value={selectedPerson.fosterCareData?.notes || ''}
                  onChange={(e) => updatePerson({ 
                    fosterCareData: { ...selectedPerson.fosterCareData, notes: e.target.value }
                  })}
                  placeholder="Additional information about this foster caregiver..."
                  style={{
                    width: '100%',
                    height: '60px',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    resize: 'vertical'
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
          Display Order
        </h4>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => actions.bringToFront('person', selectedPerson.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
            title="Bring this person to front (Page Up)"
          >
            ⬆️ Front
          </button>
          
          <button
            onClick={() => actions.sendToBack('person', selectedPerson.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
            title="Send this person to back (Page Down)"
          >
            ⬇️ Back
          </button>
        </div>
        
        <div style={{
          padding: '10px 12px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#1e40af',
          marginBottom: '20px'
        }}>
          💡 Use <kbd style={{ padding: '2px 6px', background: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Page Up</kbd> / <kbd style={{ padding: '2px 6px', background: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Page Down</kbd> or <kbd style={{ padding: '2px 6px', background: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Tab</kbd> to navigate overlapping items
        </div>

        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
          Quick Actions
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={createSpouse}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#e0e7ff',
              color: '#6366f1',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Heart size={16} />
            Add Spouse/Partner
          </button>

          <button
            onClick={() => startConnectionFromPerson('marriage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#ede9fe',
              color: '#8b5cf6',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Link2 size={16} />
            Connect to Another Person
          </button>

          {!hasParents && (
            <button
              onClick={createParents}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Users size={16} />
              Create Parents
            </button>
          )}
          
          {hasParents && (
            <button
              onClick={disconnectChildFromParents}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <UserX size={16} />
              Disconnect from Parents
            </button>
          )}
          {console.log('PersonEditPanel rendering, selectedPerson:', selectedPerson)}
          {console.log('AddChildButton imported?', typeof AddChildButton)}

          <AddChildButton person={selectedPerson} />

          <button 
            onClick={deleteSelectedPerson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginTop: '8px'
            }}
          >
            <Trash2 size={16} />
            Delete Person
          </button>
        </div>
      </div>
    </div>
    );
  }

  function renderCaseLogTab() {
    const caseLog = selectedPerson.caseLog || [];

    const addLogEntry = async () => {
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'note',
        subject: '',
        details: '',
        worker: ''
      };
      
      console.log('➕ Adding new case log entry:', newEntry);
      
      updatePerson({ 
        caseLog: [...caseLog, newEntry] 
      });
    };

    const updateLogEntry = async (entryId, updates) => {
      const entry = caseLog.find(e => e.id === entryId);
      const updatedEntry = { ...entry, ...updates };
      
      const updatedLog = caseLog.map(e => 
        e.id === entryId ? updatedEntry : e
      );
      
      console.log('📝 Updating case log entry:', entryId, 'Updates:', updates);
      
      updatePerson({ caseLog: updatedLog });

      // Debounce API sync - only sync after user stops typing for 1 second
      const trackableTypes = ['phone', 'email', 'visit', 'meeting'];
      const shouldSync = trackableTypes.includes(updatedEntry.type) && 
                        updatedEntry.date && 
                        (updatedEntry.subject || updatedEntry.details);
      
      if (shouldSync) {
        // Clear previous timer
        if (contactEventSyncTimerRef.current) {
          clearTimeout(contactEventSyncTimerRef.current);
        }
        
        // Set new timer - sync after 1 second of no changes
        contactEventSyncTimerRef.current = setTimeout(async () => {
          try {
            const contactEventData = {
              childId: selectedPerson.id,
              memberId: null,
              contactType: updatedEntry.type,
              direction: 'outbound',
              timestamp: new Date(updatedEntry.date).toISOString(),
              notes: `${updatedEntry.subject ? updatedEntry.subject + ': ' : ''}${updatedEntry.details || ''}`.trim(),
              metadata: {
                provider: 'manual',
                worker: updatedEntry.worker || 'Unknown',
                caseLogId: entryId,
                source: 'case-log'
              }
            };

            console.log('📤 Syncing to Contact Events API (debounced, caseLogId:', entryId, ')');
            const result = await createContactEvent(contactEventData);
            console.log('✅ Contact event synced!', result.message);
          } catch (error) {
            console.error('❌ Failed to sync contact event:', error);
          }
        }, 1000); // Wait 1 second after last keystroke
      }
    };

    const deleteLogEntry = (entryId) => {
      const updatedLog = caseLog.filter(entry => entry.id !== entryId);
      updatePerson({ caseLog: updatedLog });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            Case Activity Log
          </h3>
          <button
            onClick={addLogEntry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#6366f1',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            Add Entry
          </button>
        </div>

        {caseLog.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#9ca3af',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #e5e7eb'
          }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px' }}>No case log entries yet.</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Click "Add Entry" to record interactions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...caseLog].reverse().map((entry) => (
              <div key={entry.id} style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateLogEntry(entry.id, { date: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    />
                    <select
                      value={entry.type}
                      onChange={(e) => updateLogEntry(entry.id, { type: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        flex: 1
                      }}
                    >
                      <option value="note">Note</option>
                      <option value="phone">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="visit">Home Visit</option>
                      <option value="meeting">Meeting</option>
                      <option value="assessment">Assessment</option>
                    </select>
                  </div>
                  <button
                    onClick={() => deleteLogEntry(entry.id)}
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    title="Delete entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Subject (e.g., Initial contact, Follow-up visit)"
                  value={entry.subject}
                  onChange={(e) => updateLogEntry(entry.id, { subject: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    marginBottom: '8px'
                  }}
                />

                <textarea
                  placeholder="Details and notes..."
                  value={entry.details}
                  onChange={(e) => updateLogEntry(entry.id, { details: e.target.value })}
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    resize: 'vertical',
                    marginBottom: '8px'
                  }}
                />

                <input
                  type="text"
                  placeholder="Worker/Staff name"
                  value={entry.worker}
                  onChange={(e) => updateLogEntry(entry.id, { worker: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderContactsTab() {
    const contactInfo = selectedPerson.contactInfo || {
      phones: [],
      emails: [],
      addresses: []
    };

    const addPhone = () => {
      const updated = {
        ...contactInfo,
        phones: [...(contactInfo.phones || []), { id: Date.now(), type: 'mobile', number: '', notes: '' }]
      };
      updatePerson({ contactInfo: updated });
    };

    const updatePhone = (phoneId, updates) => {
      const updated = {
        ...contactInfo,
        phones: contactInfo.phones.map(p => p.id === phoneId ? { ...p, ...updates } : p)
      };
      updatePerson({ contactInfo: updated });
    };

    const deletePhone = (phoneId) => {
      const updated = {
        ...contactInfo,
        phones: contactInfo.phones.filter(p => p.id !== phoneId)
      };
      updatePerson({ contactInfo: updated });
    };

    const addEmail = () => {
      const updated = {
        ...contactInfo,
        emails: [...(contactInfo.emails || []), { id: Date.now(), type: 'personal', address: '', notes: '' }]
      };
      updatePerson({ contactInfo: updated });
    };

    const updateEmail = (emailId, updates) => {
      const updated = {
        ...contactInfo,
        emails: contactInfo.emails.map(e => e.id === emailId ? { ...e, ...updates } : e)
      };
      updatePerson({ contactInfo: updated });
    };

    const deleteEmail = (emailId) => {
      const updated = {
        ...contactInfo,
        emails: contactInfo.emails.filter(e => e.id !== emailId)
      };
      updatePerson({ contactInfo: updated });
    };

    const addAddress = () => {
      const updated = {
        ...contactInfo,
        addresses: [...(contactInfo.addresses || []), { 
          id: Date.now(), 
          type: 'home', 
          street: '', 
          city: '', 
          state: '', 
          zip: '', 
          notes: '' 
        }]
      };
      updatePerson({ contactInfo: updated });
    };

    const updateAddress = (addressId, updates) => {
      const updated = {
        ...contactInfo,
        addresses: contactInfo.addresses.map(a => a.id === addressId ? { ...a, ...updates } : a)
      };
      updatePerson({ contactInfo: updated });
    };

    const deleteAddress = (addressId) => {
      const updated = {
        ...contactInfo,
        addresses: contactInfo.addresses.filter(a => a.id !== addressId)
      };
      updatePerson({ contactInfo: updated });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Phone Numbers Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} />
              Phone Numbers
            </h3>
            <button
              onClick={addPhone}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {(!contactInfo.phones || contactInfo.phones.length === 0) ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No phone numbers added.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contactInfo.phones.map(phone => (
                <div key={phone.id} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select
                      value={phone.type}
                      onChange={(e) => updatePhone(phone.id, { type: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="mobile">Mobile</option>
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone.number}
                      onChange={(e) => updatePhone(phone.id, { number: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    />
                    <button
                      onClick={() => deletePhone(phone.id)}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Notes (e.g., preferred contact, best time to call)"
                    value={phone.notes}
                    onChange={(e) => updatePhone(phone.id, { notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Addresses Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} />
              Email Addresses
            </h3>
            <button
              onClick={addEmail}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {(!contactInfo.emails || contactInfo.emails.length === 0) ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No email addresses added.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contactInfo.emails.map(email => (
                <div key={email.id} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select
                      value={email.type}
                      onChange={(e) => updateEmail(email.id, { type: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email.address}
                      onChange={(e) => updateEmail(email.id, { address: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    />
                    <button
                      onClick={() => deleteEmail(email.id)}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={email.notes}
                    onChange={(e) => updateEmail(email.id, { notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Physical Addresses Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} />
              Physical Addresses
            </h3>
            <button
              onClick={addAddress}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {(!contactInfo.addresses || contactInfo.addresses.length === 0) ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No physical addresses added.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contactInfo.addresses.map(address => (
                <div key={address.id} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <select
                      value={address.type}
                      onChange={(e) => updateAddress(address.id, { type: e.target.value })}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="previous">Previous</option>
                      <option value="other">Other</option>
                    </select>
                    <button
                      onClick={() => deleteAddress(address.id)}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: 'none',
                        cursor: 'pointer',
                        marginLeft: 'auto'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={address.street}
                    onChange={(e) => updateAddress(address.id, { street: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => updateAddress(address.id, { city: e.target.value })}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={address.state}
                      onChange={(e) => updateAddress(address.id, { state: e.target.value })}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="ZIP"
                      value={address.zip}
                      onChange={(e) => updateAddress(address.id, { zip: e.target.value })}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={address.notes}
                    onChange={(e) => updateAddress(address.id, { notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default PersonEditPanel;