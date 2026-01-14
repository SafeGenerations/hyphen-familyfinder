// src/src-modern/components/UI/TagManager.js
import React, { useState } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { X, Plus, Edit2, Trash2, Tag as TagIcon, Check, Sparkles } from 'lucide-react';

const TAG_COLORS = [
  { name: 'Red', value: '#EF4444', light: '#FEE2E2' },
  { name: 'Orange', value: '#F97316', light: '#FFEDD5' },
  { name: 'Amber', value: '#F59E0B', light: '#FEF3C7' },
  { name: 'Yellow', value: '#EAB308', light: '#FEF9C3' },
  { name: 'Lime', value: '#84CC16', light: '#ECFCCB' },
  { name: 'Green', value: '#10B981', light: '#D1FAE5' },
  { name: 'Emerald', value: '#059669', light: '#D1FAE5' },
  { name: 'Teal', value: '#14B8A6', light: '#CCFBF1' },
  { name: 'Cyan', value: '#06B6D4', light: '#CFFAFE' },
  { name: 'Sky', value: '#0EA5E9', light: '#E0F2FE' },
  { name: 'Blue', value: '#3B82F6', light: '#DBEAFE' },
  { name: 'Indigo', value: '#6366F1', light: '#E0E7FF' },
  { name: 'Violet', value: '#8B5CF6', light: '#EDE9FE' },
  { name: 'Purple', value: '#A855F7', light: '#F3E8FF' },
  { name: 'Fuchsia', value: '#D946EF', light: '#FAE8FF' },
  { name: 'Pink', value: '#EC4899', light: '#FCE7F3' },
  { name: 'Rose', value: '#F43F5E', light: '#FFE4E6' },
  { name: 'Slate', value: '#64748B', light: '#F1F5F9' },
];

const TagManager = ({ isOpen, onClose }) => {
  const { state, actions } = useGenogram();
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState({ name: '', color: TAG_COLORS[5].value, description: '' });

  const handleCreateTag = () => {
    if (!newTag.name.trim()) return;
    
    const tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newTag.name.trim(),
      color: newTag.color,
      description: newTag.description.trim(),
      createdAt: new Date().toISOString()
    };
    
    actions.addTagDefinition(tag);
    setNewTag({ name: '', color: TAG_COLORS[5].value, description: '' });
  };

  const handleUpdateTag = () => {
    if (!editingTag || !editingTag.name.trim()) return;
    
    actions.updateTagDefinition(editingTag.id, {
      name: editingTag.name.trim(),
      color: editingTag.color,
      description: editingTag.description.trim()
    });
    setEditingTag(null);
  };

  const handleDeleteTag = (tagId) => {
    const usageCount = getTagUsageCount(tagId);
    const message = usageCount > 0
      ? `Delete this tag? It will be removed from ${usageCount} ${usageCount === 1 ? 'person' : 'people'}.`
      : 'Delete this tag?';
    
    if (window.confirm(message)) {
      actions.deleteTagDefinition(tagId);
    }
  };

  const getTagUsageCount = (tagId) => {
    return state.people.filter(person => person.tags?.includes(tagId)).length;
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        overflowY: 'auto',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '600px',
          minHeight: '400px',
          margin: '0 auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
          padding: '20px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TagIcon size={22} />
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Tag Manager</h2>
            </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                <X size={18} />
              </button>
            </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', minHeight: 0 }}>
          {/* Create New Tag Card */}
          <div style={{
            background: 'linear-gradient(135deg, #F5F7FA 0%, #C3CFE2 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid rgba(102, 126, 234, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={16} style={{ color: '#667EEA' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                Create New Tag
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Tag Name Input */}
              <div>
                <label style={{ 
                  display: 'flex', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Tag Name
                  <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  placeholder="e.g., Priority Contact, Foster Parent"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                />
              </div>
              
              {/* Color Picker */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px'
                }}>
                  Color
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(9, 1fr)',
                  gap: '6px',
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '2px solid #E5E7EB'
                }}>
                  {TAG_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setNewTag({ ...newTag, color: color.value })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: color.value,
                        border: newTag.color === color.value ? '2px solid #1F2937' : '1px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        transition: 'border 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={color.name}
                    >
                      {newTag.color === color.value && (
                        <Check size={14} style={{ color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateTag}
                disabled={!newTag.name.trim()}
                style={{
                  width: '100%',
                  background: newTag.name.trim() ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' : '#E5E7EB',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newTag.name.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (newTag.name.trim()) e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                <Plus size={16} />
                Create Tag
              </button>
            </div>
          </div>

          {/* Existing Tags */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                Your Tags ({state.tagDefinitions.length})
              </h3>
            </div>
            
            {state.tagDefinitions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 20px',
                backgroundColor: '#F9FAFB',
                borderRadius: '12px',
                border: '2px dashed #E5E7EB'
              }}>
                <TagIcon size={40} style={{ color: '#D1D5DB', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>No tags yet. Create one above to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {state.tagDefinitions.map(tag => {
                  const usageCount = getTagUsageCount(tag.id);
                  return (
                    <div
                      key={tag.id}
                      style={{
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {editingTag?.id === tag.id ? (
                        // Edit Mode
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <input
                            type="text"
                            value={editingTag.name}
                            onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #667EEA',
                              borderRadius: '8px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                            gap: '6px'
                          }}>
                            {TAG_COLORS.map(color => (
                              <button
                                key={color.value}
                                onClick={() => setEditingTag({ ...editingTag, color: color.value })}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: color.value,
                                  border: editingTag.color === color.value ? '3px solid #1F2937' : '2px solid rgba(0,0,0,0.1)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {editingTag.color === color.value && <Check size={16} style={{ color: 'white' }} />}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={editingTag.description}
                            onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                            placeholder="Description (optional)"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #E5E7EB',
                              borderRadius: '8px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={handleUpdateTag}
                              style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: '#F3F4F6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: tag.color,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 2px 6px ${tag.color}50`
                          }}>
                            <TagIcon size={18} style={{ color: 'white' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', marginBottom: '2px' }}>
                              {tag.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              {usageCount === 0 ? 'Not used' : `${usageCount} ${usageCount === 1 ? 'person' : 'people'}`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              onClick={() => setEditingTag({ ...tag })}
                              style={{
                                padding: '6px',
                                backgroundColor: '#F3F4F6',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                              }}
                              title="Edit tag"
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#E5E7EB'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                            >
                              <Edit2 size={14} style={{ color: '#6B7280' }} />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              style={{
                                padding: '6px',
                                backgroundColor: '#FEE2E2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                              }}
                              title="Delete tag"
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#FECACA'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#FEE2E2'}
                            >
                              <Trash2 size={14} style={{ color: '#EF4444' }} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1F2937'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagManager;
