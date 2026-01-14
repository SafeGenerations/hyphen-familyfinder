// Complete RelationshipEditPanel.js with all line styles restored
import React, { useState } from 'react';
import { Trash2, Info, ChevronDown, ChevronRight, AlertTriangle, Shield, Heart, DollarSign, Eye, Zap, Tag, X } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { REL_ABBREVIATIONS, RELATIONSHIP_TYPES, RELATIONSHIP_DESCRIPTIONS } from '../../utils/relationshipConstants';
import { RELATIONSHIP_ATTRIBUTES, getAttributeById, COMMON_ATTRIBUTE_ICONS } from '../../utils/relationshipAttributes';
import { ConnectionStatus, getConnectionStatusConfig, DISCOVERY_SOURCE_OPTIONS, PlacementStatus, getPlacementStatusConfig, PLACEMENT_STATUS_OPTIONS } from '../../constants/connectionStatus';

const RelationshipEditPanel = () => {
  const { state, actions } = useGenogram();
  const { selectedRelationship, people } = state;
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedSections, setExpandedSections] = useState({
    lineStyle: false,
    advanced: false,
    documentation: false
  });

  // Custom attribute creation state
  const [showCustomAttributeForm, setShowCustomAttributeForm] = useState(false);
  const [customAttrLabel, setCustomAttrLabel] = useState('');
  const [customAttrIcon, setCustomAttrIcon] = useState('•');
  const [customAttrColor, setCustomAttrColor] = useState('#64748b');

  if (!selectedRelationship) return null;

  const updateRelationship = (updates) => {
    actions.updateRelationship(selectedRelationship.id, updates);
  };

  // Get custom attributes from state (stored globally)
  const customAttributes = state.customAttributes || [];

  // Handle custom attribute creation
  const handleCreateCustomAttribute = () => {
    if (!customAttrLabel.trim()) return;

    const newCustomAttr = {
      id: `custom-${Date.now()}`,
      label: customAttrLabel.trim(),
      icon: customAttrIcon,
      color: customAttrColor,
      isCustom: true
    };

    // Add to global custom attributes
    const updatedCustomAttrs = [...customAttributes, newCustomAttr];
    actions.setCustomAttributes(updatedCustomAttrs);

    // Add to current relationship
    const currentAttrs = selectedRelationship.attributes || [];
    updateRelationship({ attributes: [...currentAttrs, newCustomAttr.id] });

    // Reset form
    setCustomAttrLabel('');
    setCustomAttrIcon('•');
    setCustomAttrColor('#64748b');
    setShowCustomAttributeForm(false);
  };

  const fromPerson = people.find(p => p.id === selectedRelationship.from);
  const toPerson = people.find(p => p.id === selectedRelationship.to);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Enhanced Line Style Preview Functions
  const renderLineStylePreview = (styleValue, color) => {
    const x1 = 5, y1 = 8, x2 = 60, y2 = 8;
    let strokeDasharray = '';
    
    if (styleValue !== 'default') {
      const lineStyles = {
        'solid': '', 'dashed': '6,4', 'dotted': '2,2', 'long-dash': '12,6',
        'dash-dot': '8,4,2,4', 'dash-dot-dot': '8,4,2,4,2,4', 'long-short': '12,3,3,3',
        'sparse-dots': '2,8', 'dense-dots': '1,3'
      };
      strokeDasharray = lineStyles[styleValue] || '';
    }
    
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeDasharray={strokeDasharray} />;
  };

  const renderEnhancedLineStylePreview = (styleValue, color) => {
    const x1 = 5, y1 = 10, x2 = 60, y2 = 10;
    
    switch (styleValue) {
      case 'double-line':
        return (
          <>
            <line x1={x1} y1={y1-2} x2={x2} y2={y2-2} stroke={color} strokeWidth="2" />
            <line x1={x1} y1={y1+2} x2={x2} y2={y2+2} stroke={color} strokeWidth="2" />
          </>
        );
      case 'toxic-zigzag':
        const toxicPath = `M ${x1} ${y1} L ${x1+8} ${y1-4} L ${x1+16} ${y1+4} L ${x1+24} ${y1-4} L ${x1+32} ${y1+4} L ${x1+40} ${y1-4} L ${x1+48} ${y1+4} L ${x2} ${y2}`;
        return <path d={toxicPath} stroke={color} strokeWidth="2" fill="none" />;
      case 'wavy':
        const wavePath = `M ${x1} ${y1} Q ${x1+12} ${y1-4} ${x1+24} ${y1} Q ${x1+36} ${y1+4} ${x1+48} ${y1} Q ${x1+54} ${y1-2} ${x2} ${y2}`;
        return <path d={wavePath} stroke={color} strokeWidth="2" fill="none" />;
      case 'triple-line':
        return (
          <>
            <line x1={x1} y1={y1-3} x2={x2} y2={y2-3} stroke={color} strokeWidth="1" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" />
            <line x1={x1} y1={y1+3} x2={x2} y2={y2+3} stroke={color} strokeWidth="1" />
          </>
        );
      case 'angular-warning':
        return (
          <>
            <path d={`M ${x1} ${y1} L ${x1+10} ${y1+3} L ${x1+20} ${y1-2} L ${x1+30} ${y1+4} L ${x1+40} ${y1-3} L ${x1+50} ${y1+2} L ${x2} ${y2}`} stroke="#dc2626" strokeWidth="2" fill="none" />
            <polygon points={`${(x1+x2)/2},${y1-4} ${(x1+x2)/2-3},${y1+2} ${(x1+x2)/2+3},${y1+2}`} fill="#dc2626" />
            <text x={(x1+x2)/2} y={y1} textAnchor="middle" style={{ fontSize: '6px', fill: '#ffffff', fontWeight: 'bold' }}>!</text>
          </>
        );
      case 'on-off-segments':
        return (
          <>
            <line x1={x1} y1={y1} x2={x1+12} y2={y2} stroke={color} strokeWidth="2" />
            <line x1={x1+16} y1={y1} x2={x1+28} y2={y2} stroke={color} strokeWidth="2" strokeDasharray="4,2" />
            <line x1={x1+32} y1={y1} x2={x1+44} y2={y2} stroke={color} strokeWidth="2" />
            <line x1={x1+48} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeDasharray="4,2" />
          </>
        );
      case 'curved-arrow':
        const midX = (x1 + x2) / 2;
        const midY = y1 - 6;
        return (
          <>
            <path d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`} stroke={color} strokeWidth="2" fill="none" />
            <polygon points={`${x2-4},${y2-2} ${x2},${y2} ${x2-4},${y2+2}`} fill={color} />
          </>
        );
      case 'gentle-curve':
        const supportMidX = (x1 + x2) / 2;
        const supportMidY = y1 - 4;
        return <path d={`M ${x1} ${y1} Q ${supportMidX} ${supportMidY} ${x2} ${y2}`} stroke={color} strokeWidth="2" fill="none" />;
      case 'parallel':
        return (
          <>
            <line x1={x1} y1={y1-2} x2={x2} y2={y2-2} stroke={color} strokeWidth="2" />
            <line x1={x1} y1={y1+2} x2={x2} y2={y2+2} stroke={color} strokeWidth="2" />
          </>
        );
      case 'shield':
        return (
          <>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />
            <path d={`M ${(x1+x2)/2-4} ${y1-6} L ${(x1+x2)/2+4} ${y1-6} L ${(x1+x2)/2+4} ${y1+2} L ${(x1+x2)/2} ${y1+6} L ${(x1+x2)/2-4} ${y1+2} Z`} fill="#10b981" stroke="#ffffff" strokeWidth="1" />
          </>
        );
      case 'heart-arrow':
        return (
          <>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />
            <polygon points={`${x2-4},${y2-2} ${x2},${y2} ${x2-4},${y2+2}`} fill={color} />
            <text x={x1+15} y={y1-2} textAnchor="middle" style={{ fontSize: '8px', fill: '#ec4899' }}>♥</text>
          </>
        );
      case 'dollar-signs':
        return (
          <>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeDasharray="6,3" />
            <text x={x1+15} y={y1-2} textAnchor="middle" style={{ fontSize: '8px', fill: '#10b981', fontWeight: 'bold' }}>$</text>
            <text x={x1+35} y={y1-2} textAnchor="middle" style={{ fontSize: '8px', fill: '#10b981', fontWeight: 'bold' }}>$</text>
          </>
        );
      case 'supervision-eye':
        return (
          <>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeDasharray="4,4" />
            <ellipse cx={(x1+x2)/2} cy={y1} rx="6" ry="3" fill="#ffffff" stroke={color} strokeWidth="1" />
            <circle cx={(x1+x2)/2} cy={y1} r="2" fill={color} />
          </>
        );
      default:
        return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />;
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic', icon: Heart },
    { id: 'visual', label: 'Visual', icon: Zap },
    { id: 'clinical', label: 'Clinical', icon: Shield },
    { id: 'notes', label: 'Notes', icon: Info }
  ];

  const isRiskyRelationship = ['abusive', 'toxic', 'manipulative'].includes(selectedRelationship.type);
  const isDirectionalRelationship = ['manipulative', 'caregiver', 'protective', 'financial-dependency', 'abusive'].includes(selectedRelationship.type);
  const isProfessionalRelationship = ['supervised-contact', 'protective', 'caregiver'].includes(selectedRelationship.type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with relationship info */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: 'white'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
          {selectedRelationship.type.charAt(0).toUpperCase() + selectedRelationship.type.slice(1).replace('-', ' ')}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          <strong>{fromPerson?.name || 'Unknown'}</strong>
          <span style={{ margin: '0 8px', color: '#94a3b8' }}>↔</span>
          <strong>{toPerson?.name || 'Unknown'}</strong>
        </div>
        {isRiskyRelationship && (
          <div style={{
            marginTop: '8px',
            padding: '6px 10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={14} />
            High-risk relationship type
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: '#fafbfc'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 8px',
                backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#6366f1' : '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Relationship Type */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Relationship Type
              </label>
              <select
                value={selectedRelationship.type}
                onChange={(e) => updateRelationship({ 
                  type: e.target.value,
                  abbr: REL_ABBREVIATIONS[e.target.value] || ''
                })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {RELATIONSHIP_TYPES.map(category => (
                  <optgroup key={category.group} label={category.group}>
                    {category.types.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              
              {RELATIONSHIP_DESCRIPTIONS[selectedRelationship.type] && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#0369a1'
                }}>
                  {RELATIONSHIP_DESCRIPTIONS[selectedRelationship.type]}
                </div>
              )}
            </div>

            {/* Connection Status (Family Finding) */}
            {(() => {
              const connectionStatus = selectedRelationship.connectionStatus || ConnectionStatus.CONFIRMED;
              const statusConfig = getConnectionStatusConfig(connectionStatus);
              const isPotential = connectionStatus !== ConnectionStatus.CONFIRMED;
              
              return (
                <div style={{
                  padding: '16px',
                  backgroundColor: isPotential ? '#fef3c7' : '#f0fdf4',
                  border: `2px solid ${statusConfig.color}40`,
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Connection Status
                    </label>
                    <div style={{
                      padding: '4px 12px',
                      backgroundColor: statusConfig.color + '20',
                      border: `1px solid ${statusConfig.color}`,
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: statusConfig.color
                    }}>
                      {statusConfig.label}
                    </div>
                  </div>
                  
                  <select
                    value={connectionStatus}
                    onChange={(e) => updateRelationship({ connectionStatus: e.target.value })}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      marginBottom: '12px'
                    }}
                  >
                    <option value={ConnectionStatus.CONFIRMED}>✅ Confirmed Connection</option>
                    <option value={ConnectionStatus.POTENTIAL}>🔍 Potential Connection</option>
                    <option value={ConnectionStatus.EXPLORING}>🔎 Actively Exploring</option>
                    <option value={ConnectionStatus.RULED_OUT}>❌ Ruled Out</option>
                  </select>

                  {isPotential && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Discovery Source
                        </label>
                        <select
                          value={selectedRelationship.discoverySource || ''}
                          onChange={(e) => updateRelationship({ discoverySource: e.target.value })}
                          style={{
                            width: '100%',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '13px',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="">Select source...</option>
                          {DISCOVERY_SOURCE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Discovery Notes
                        </label>
                        <textarea
                          value={selectedRelationship.discoveryNotes || ''}
                          onChange={(e) => updateRelationship({ discoveryNotes: e.target.value })}
                          placeholder="Notes about how this connection was discovered..."
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '13px',
                            backgroundColor: 'white',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {connectionStatus === ConnectionStatus.POTENTIAL && (
                        <button
                          onClick={() => {
                            const { promoteConnectionToConfirmed } = actions;
                            promoteConnectionToConfirmed(selectedRelationship.id);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          ✅ Confirm This Connection
                        </button>
                      )}
                    </>
                  )}

                  {selectedRelationship.discoveryDate && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      Discovered: {new Date(selectedRelationship.discoveryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Placement Status Section for Child Welfare */}
            {(() => {
              const placementStatus = selectedRelationship.placementStatus;
              const statusConfig = placementStatus ? getPlacementStatusConfig(placementStatus) : null;

              return (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '12px',
                  border: '2px solid #bfdbfe'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px' }}>🏠</span>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e40af' }}>
                      Placement Status
                    </h3>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Track placement suitability for child welfare case planning
                  </div>

                  {/* Badge preview */}
                  {statusConfig && placementStatus !== 'not_applicable' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: `2px solid ${statusConfig.color}`
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: statusConfig.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {statusConfig.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>
                          {statusConfig.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {statusConfig.description}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Placement status dropdown */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Placement Status
                    </label>
                    <select
                      value={placementStatus || 'not_applicable'}
                      onChange={(e) => updateRelationship({ placementStatus: e.target.value || null })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {PLACEMENT_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Placement notes */}
                  {placementStatus && placementStatus !== 'not_applicable' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Placement Notes
                      </label>
                      <textarea
                        value={selectedRelationship.placementNotes || ''}
                        onChange={(e) => updateRelationship({ placementNotes: e.target.value })}
                        placeholder="Home study status, safety concerns, barriers, strengths..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          backgroundColor: 'white',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Relationship Attributes/Tags */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Tag size={16} style={{ color: '#64748b' }} />
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Relationship Attributes
                </label>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  Add dynamics, safety concerns, or qualities to this relationship
                </div>

                {/* Currently selected attributes */}
                {selectedRelationship.attributes && selectedRelationship.attributes.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '6px'
                  }}>
                    {selectedRelationship.attributes.map(attrId => {
                      const attr = getAttributeById(attrId, customAttributes);
                      if (!attr) return null;
                      return (
                        <div
                          key={attrId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: attr.color + '15',
                            border: `1px solid ${attr.color}40`,
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: attr.color,
                            fontWeight: '500'
                          }}
                        >
                          <span>{attr.icon}</span>
                          <span>{attr.label}</span>
                          <button
                            onClick={() => {
                              const newAttrs = selectedRelationship.attributes.filter(a => a !== attrId);
                              updateRelationship({ attributes: newAttrs });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              color: attr.color,
                              opacity: 0.7
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add attribute dropdown */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const currentAttrs = selectedRelationship.attributes || [];
                      if (!currentAttrs.includes(e.target.value)) {
                        updateRelationship({
                          attributes: [...currentAttrs, e.target.value]
                        });
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">+ Add attribute...</option>
                  {Object.keys(RELATIONSHIP_ATTRIBUTES).map(categoryKey => {
                    const category = RELATIONSHIP_ATTRIBUTES[categoryKey];
                    return (
                      <optgroup key={categoryKey} label={category.label}>
                        {category.attributes.map(attr => (
                          <option
                            key={attr.id}
                            value={attr.id}
                            disabled={selectedRelationship.attributes?.includes(attr.id)}
                          >
                            {attr.icon} {attr.label}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  {/* Custom attributes section in dropdown */}
                  {customAttributes.length > 0 && (
                    <optgroup label="🎨 Your Custom Attributes">
                      {customAttributes.map(attr => (
                        <option
                          key={attr.id}
                          value={attr.id}
                          disabled={selectedRelationship.attributes?.includes(attr.id)}
                        >
                          {attr.icon} {attr.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Custom Attribute Creation Button/Form */}
                <div style={{ marginTop: '8px' }}>
                  {!showCustomAttributeForm ? (
                    <button
                      onClick={() => setShowCustomAttributeForm(true)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#64748b',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>+</span>
                      <span>Create Custom Attribute</span>
                    </button>
                  ) : (
                    <div style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      marginTop: '8px'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                        Create Custom Attribute
                      </div>

                      {/* Label */}
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={customAttrLabel}
                          onChange={(e) => setCustomAttrLabel(e.target.value)}
                          placeholder="e.g., Culturally Sensitive"
                          maxLength={30}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      {/* Icon and Color Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        {/* Icon Selector */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            Icon
                          </label>
                          <select
                            value={customAttrIcon}
                            onChange={(e) => setCustomAttrIcon(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '13px'
                            }}
                          >
                            {COMMON_ATTRIBUTE_ICONS.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>

                        {/* Color Picker */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            Color
                          </label>
                          <input
                            type="color"
                            value={customAttrColor}
                            onChange={(e) => setCustomAttrColor(e.target.value)}
                            style={{
                              width: '100%',
                              height: '32px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      <div style={{
                        marginBottom: '10px',
                        padding: '8px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Preview:</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          backgroundColor: customAttrColor + '15',
                          border: `1px solid ${customAttrColor}40`,
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: customAttrColor,
                          fontWeight: '500'
                        }}>
                          <span>{customAttrIcon}</span>
                          <span>{customAttrLabel || 'Your Label'}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleCreateCustomAttribute}
                          disabled={!customAttrLabel.trim()}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            background: customAttrLabel.trim() ? '#3b82f6' : '#cbd5e1',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: customAttrLabel.trim() ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Create & Add
                        </button>
                        <button
                          onClick={() => {
                            setShowCustomAttributeForm(false);
                            setCustomAttrLabel('');
                            setCustomAttrIcon('•');
                            setCustomAttrColor('#64748b');
                          }}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            background: 'white',
                            color: '#64748b',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={selectedRelationship.startDate || ''}
                  onChange={(e) => updateRelationship({ startDate: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {(!selectedRelationship.isActive || ['separation', 'divorce', 'nullity', 'cutoff'].includes(selectedRelationship.type)) && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={selectedRelationship.endDate || ''}
                    onChange={(e) => updateRelationship({ endDate: e.target.value })}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Active Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <input
                type="checkbox"
                id="active"
                checked={selectedRelationship.isActive}
                onChange={(e) => updateRelationship({ isActive: e.target.checked })}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="active" style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Currently active relationship
              </label>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              {selectedRelationship.type === 'marriage' && (
                <button
                  onClick={() => updateRelationship({ type: 'separation', isActive: false })}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  → Separated
                </button>
              )}
              
              {selectedRelationship.type === 'separation' && (
                <>
                  <button
                    onClick={() => updateRelationship({ type: 'marriage', isActive: true })}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    ↺ Reconciled
                  </button>
                  <button
                    onClick={() => updateRelationship({ type: 'divorce', isActive: false })}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    → Divorced
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Color */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Color & Abbreviation
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px', alignItems: 'end' }}>
                <input
                  type="color"
                  value={selectedRelationship.color || '#000000'}
                  onChange={(e) => updateRelationship({ color: e.target.value })}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={selectedRelationship.abbr || ''}
                  onChange={(e) => updateRelationship({ abbr: e.target.value })}
                  placeholder="Abbreviation"
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Line Style - Collapsible */}
            <div>
              <button
                onClick={() => toggleSection('lineStyle')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                <span>Line Style Options</span>
                {expandedSections.lineStyle ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {expandedSections.lineStyle && (
                <div style={{
                  marginTop: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: 'white'
                }}>
                  {/* Basic Patterns */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                      Basic Patterns
                    </div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      {[
                        { value: 'default', label: 'Default' },
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' },
                        { value: 'long-dash', label: 'Long Dash' },
                        { value: 'dash-dot', label: 'Dash Dot' },
                        { value: 'dash-dot-dot', label: 'Dash Dot Dot' },
                        { value: 'long-short', label: 'Long Short' },
                        { value: 'sparse-dots', label: 'Sparse Dots' },
                        { value: 'dense-dots', label: 'Dense Dots' }
                      ].map(style => (
                        <button
                          key={style.value}
                          onClick={() => updateRelationship({ lineStyle: style.value })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 10px',
                            backgroundColor: (selectedRelationship.lineStyle || 'default') === style.value ? '#e0e7ff' : 'white',
                            border: (selectedRelationship.lineStyle || 'default') === style.value ? '1px solid #6366f1' : '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <svg width="40" height="12">
                            {renderLineStylePreview(style.value, '#374151')}
                          </svg>
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Styles */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                      Enhanced Styles
                    </div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      {[
                        { value: 'double-line', label: 'Double Line', icon: '══' },
                        { value: 'toxic-zigzag', label: 'Toxic Zigzag', icon: '⚡' },
                        { value: 'wavy', label: 'Wavy', icon: '〰️' },
                        { value: 'triple-line', label: 'Triple Line', icon: '≡' },
                        { value: 'angular-warning', label: 'Warning', icon: '⚠️' },
                        { value: 'on-off-segments', label: 'On/Off', icon: '⚪⚫' },
                        { value: 'curved-arrow', label: 'Curved Arrow', icon: '↗️' },
                        { value: 'gentle-curve', label: 'Gentle Curve', icon: '〜' },
                        { value: 'parallel', label: 'Parallel Lines', icon: '||' },
                        { value: 'shield', label: 'Shield', icon: '🛡️' },
                        { value: 'heart-arrow', label: 'Heart Arrow', icon: '💘' },
                        { value: 'dollar-signs', label: 'Dollar Signs', icon: '💲' },
                        { value: 'supervision-eye', label: 'Supervision', icon: '👁️' }
                      ].map(style => (
                        <button
                          key={style.value}
                          onClick={() => updateRelationship({ lineStyle: style.value })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 10px',
                            backgroundColor: (selectedRelationship.lineStyle || 'default') === style.value ? '#e0e7ff' : 'white',
                            border: (selectedRelationship.lineStyle || 'default') === style.value ? '1px solid #6366f1' : '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <svg width="40" height="16">
                            {renderEnhancedLineStylePreview(style.value, '#374151')}
                          </svg>
                          <span>{style.icon} {style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clinical' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Risk Assessment */}
            {isRiskyRelationship && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#dc2626', marginBottom: '8px' }}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Risk Assessment
                </label>
                <select
                  value={selectedRelationship.riskLevel || 'medium'}
                  onChange={(e) => updateRelationship({ riskLevel: e.target.value })}
                  style={{
                    width: '100%',
                    border: '2px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    backgroundColor: '#fef2f2'
                  }}
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                  <option value="immediate">⚠️ Immediate Danger</option>
                </select>
                
                {selectedRelationship.riskLevel === 'immediate' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px',
                    backgroundColor: '#fef2f2',
                    border: '2px solid #dc2626',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    ⚠️ IMMEDIATE DANGER: Consider safety planning and professional intervention
                  </div>
                )}
              </div>
            )}

            {/* Intensity */}
            {['conflict', 'toxic', 'abusive', 'dependency', 'codependent', 'manipulative'].includes(selectedRelationship.type) && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Intensity Level
                </label>
                <select
                  value={selectedRelationship.intensity || 'moderate'}
                  onChange={(e) => updateRelationship({ intensity: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
            )}

            {/* Direction */}
            {isDirectionalRelationship && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Relationship Direction
                </label>
                <select
                  value={selectedRelationship.direction || 'from-to'}
                  onChange={(e) => updateRelationship({ direction: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                >
                  <option value="from-to">{fromPerson?.name} → {toPerson?.name}</option>
                  <option value="to-from">{toPerson?.name} → {fromPerson?.name}</option>
                  <option value="mutual">Mutual/Both Ways</option>
                </select>
              </div>
            )}

            {/* Professional Involvement */}
            {isProfessionalRelationship && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  <Shield size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Professional Involvement
                </label>
                <input
                  type="text"
                  value={selectedRelationship.professionalInvolvement || ''}
                  onChange={(e) => updateRelationship({ professionalInvolvement: e.target.value })}
                  placeholder="e.g., Social Worker, Court Order, CPS..."
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Relationship Notes
              </label>
              <textarea
                value={selectedRelationship.notes || ''}
                onChange={(e) => updateRelationship({ notes: e.target.value })}
                placeholder="Document observations, patterns, incidents..."
                style={{
                  width: '100%',
                  height: '120px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Intervention History */}
            {['abusive', 'supervised-contact', 'protective', 'toxic'].includes(selectedRelationship.type) && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Intervention History
                </label>
                <textarea
                  value={selectedRelationship.interventionHistory || ''}
                  onChange={(e) => updateRelationship({ interventionHistory: e.target.value })}
                  placeholder="Document professional interventions, court orders, therapy sessions..."
                  style={{
                    width: '100%',
                    height: '100px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with Delete */}
      <div style={{ 
        padding: '16px 20px', 
        borderTop: '1px solid #f1f5f9',
        backgroundColor: 'white'
      }}>
        <button
          onClick={() => {
            actions.setDeleteConfirmation({
              type: 'relationship',
              title: 'Delete Relationship',
              message: `Delete this ${selectedRelationship.type.replace('-', ' ')} relationship?`,
              onConfirm: () => {
                actions.deleteRelationship(selectedRelationship.id);
                actions.setDeleteConfirmation(null);
              },
              onCancel: () => actions.setDeleteConfirmation(null)
            });
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <Trash2 size={16} />
          Delete Relationship
        </button>
      </div>
    </div>
  );
};

export default RelationshipEditPanel;