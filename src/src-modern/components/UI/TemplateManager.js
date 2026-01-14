import React, { useState } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { summarizeFilters, compareFilterSummaries } from '../../utils/filterSummary';

const TemplateManager = ({ currentFilters, onApplyTemplate, onClose }) => {
  const { state, actions } = useGenogram();
  const { filterTemplates } = state;
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', filters: null });

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ name: '', description: '', filters: currentFilters });
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setFormData({ name: template.name, description: template.description, filters: template.filters });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (editingId) {
      actions.updateFilterTemplate(editingId, {
        name: formData.name,
        description: formData.description,
        filters: formData.filters
      });
      setEditingId(null);
    } else {
      actions.addFilterTemplate(formData.name, formData.description, formData.filters);
      setIsCreating(false);
    }
    
    setFormData({ name: '', description: '', filters: null });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', description: '', filters: null });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      actions.deleteFilterTemplate(id);
    }
  };

  const formatFilters = (filters) => summarizeFilters(filters);

  const sortedTemplates = [...filterTemplates].sort((a, b) => {
    return (b.usageCount || 0) - (a.usageCount || 0);
  });

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.modalTitle}>Filter Templates</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.content}>
          {(isCreating || editingId) ? (
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Children Under 5 in Foster Care"
                  style={styles.input}
                  autoFocus
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this template is used for..."
                  style={styles.textarea}
                  rows={3}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Filters</label>
                <div style={styles.filtersPreview}>
                  {formatFilters(formData.filters || {})}
                </div>
              </div>

              <div style={styles.formActions}>
                <button onClick={handleCancel} style={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleSave} style={styles.saveButton}>
                  {editingId ? 'Update' : 'Save'} Template
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.toolbar}>
                <button onClick={handleCreate} style={styles.createButton}>
                  + New Template
                </button>
                <div style={styles.templateCount}>
                  {filterTemplates.length} template{filterTemplates.length !== 1 ? 's' : ''}
                </div>
              </div>

              {filterTemplates.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📋</div>
                  <div style={styles.emptyText}>No templates saved</div>
                  <div style={styles.emptySubtext}>
                    Create templates to save commonly used filter combinations
                  </div>
                </div>
              ) : (
                <div style={styles.templateList}>
                  {sortedTemplates.map((template) => {
                    const comparison = compareFilterSummaries(currentFilters, template.filters);
                    const hasDifferences =
                      comparison.additions.length > 0 || comparison.removals.length > 0;

                    return (
                      <div key={template.id} style={styles.templateCard}>
                      <div style={styles.templateHeader}>
                        <div style={styles.templateName}>{template.name}</div>
                        <div style={styles.templateActions}>
                          {template.usageCount > 0 && (
                            <span style={styles.usageCount} title="Times used">
                              {template.usageCount}×
                            </span>
                          )}
                          <button
                            onClick={() => onApplyTemplate(template)}
                            style={styles.applyButton}
                            title="Apply template"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handleEdit(template)}
                            style={styles.iconButton}
                            title="Edit template"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            style={styles.iconButton}
                            title="Delete template"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      {template.description && (
                        <div style={styles.templateDescription}>
                          {template.description}
                        </div>
                      )}
                      
                      <div style={styles.templateFilters}>
                        {formatFilters(template.filters)}
                      </div>

                        <div style={styles.templateDiff}>
                          {hasDifferences ? (
                            <>
                              {comparison.additions.length > 0 && (
                                <div style={styles.diffRow}>
                                  <span style={{ ...styles.diffLabel, color: '#047857' }}>Adds</span>
                                  <span style={styles.diffValue}>
                                    {comparison.additions.join(' • ')}
                                  </span>
                                </div>
                              )}
                              {comparison.removals.length > 0 && (
                                <div style={styles.diffRow}>
                                  <span style={{ ...styles.diffLabel, color: '#b91c1c' }}>Removes</span>
                                  <span style={styles.diffValue}>
                                    {comparison.removals.join(' • ')}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={styles.diffNoChanges}>Matches current filters</div>
                          )}
                        </div>
                      
                      <div style={styles.templateFooter}>
                        <span style={styles.templateDate}>
                          Created {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  createButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  templateCount: {
    fontSize: '13px',
    color: '#6b7280',
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  templateCard: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  templateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  templateName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  templateActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  usageCount: {
    fontSize: '12px',
    color: '#6b7280',
    padding: '2px 6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
  },
  applyButton: {
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  templateDescription: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  templateFilters: {
    fontSize: '12px',
    color: '#9ca3af',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  templateFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateDate: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  templateDiff: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px dashed #e5e7eb',
    marginBottom: '8px',
  },
  diffRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#374151',
  },
  diffLabel: {
    fontWeight: '600',
    minWidth: '64px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontSize: '11px',
  },
  diffValue: {
    flex: 1,
    lineHeight: 1.4,
  },
  diffNoChanges: {
    fontSize: '12px',
    color: '#047857',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  filtersPreview: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  saveButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#9ca3af',
    maxWidth: '300px',
  },
};

export default TemplateManager;
