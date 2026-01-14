import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { User, Users, LifeBuoy, MapPin, Star } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { NodeType, NODE_TYPE_OPTIONS, getNodeTypeConfig } from '../../constants/nodeTypes';
import { NODE_ICON_LIBRARY, NODE_ICON_CATEGORIES } from '../../constants/nodeIcons';
import PersonEditPanel from './PersonEditPanel';
import NotesWorkspaceModal from './NotesWorkspaceModal';

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const convertPlainTextToHtml = (value = '') => {
  const trimmed = value == null ? '' : `${value}`;
  if (trimmed.trim().length === 0) {
    return '<p><br /></p>';
  }

  const paragraphs = trimmed.split(/\n{2,}/);
  return paragraphs
    .map((paragraph) => {
      const safe = escapeHtml(paragraph);
      return `<p>${safe.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
};
const NODE_TYPE_ICONS = {
  [NodeType.PERSON]: User,
  [NodeType.ORGANIZATION]: Users,
  [NodeType.SERVICE_RESOURCE]: LifeBuoy,
  [NodeType.PLACE_LOCATION]: MapPin,
  [NodeType.CUSTOM]: Star
};

const FieldLabel = ({ children, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{children}</span>
    {hint && (
      <span style={{ fontSize: '12px', color: '#6b7280' }}>
        {hint}
      </span>
    )}
  </div>
);

const Input = ({ style, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      ...style
    }}
  />
);

const TextArea = ({ style, ...props }) => (
  <textarea
    {...props}
    style={{
      width: '100%',
      minHeight: '120px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      resize: 'vertical',
      ...style
    }}
  />
);

const Section = ({ children, style }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    ...style
  }}>
    {children}
  </div>
);

const NodeEditPanel = () => {
  const { state, actions } = useGenogram();
  const { selectedPerson } = state;
  const [activeTab, setActiveTab] = useState('basic');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [notesWorkspaceOpen, setNotesWorkspaceOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState({ html: '', text: '' });
  const [notesInitialValue, setNotesInitialValue] = useState({ html: '', text: '' });
  const selectedNodeId = selectedPerson?.id;
  const nodeType = selectedPerson?.type || NodeType.PERSON;
  const noteValue = selectedPerson?.notes || '';
  const noteRichValue = selectedPerson?.notesRichText || '';

  useEffect(() => {
    setActiveTab('basic');
  }, [selectedNodeId]);

  useEffect(() => {
    setIconPickerOpen(false);
    setIconSearch('');
  }, [selectedNodeId, nodeType]);
  const updateNode = useCallback((updates) => {
    if (!selectedNodeId) return;
    actions.updatePerson(selectedNodeId, updates);
  }, [actions, selectedNodeId]);

  useEffect(() => {
    setNotesWorkspaceOpen(false);
  }, [selectedNodeId]);

  useEffect(() => {
    if (!notesWorkspaceOpen) {
      const htmlValue = noteRichValue && noteRichValue.trim().length > 0
        ? noteRichValue
        : convertPlainTextToHtml(noteValue);

      setNotesDraft({
        html: noteRichValue,
        text: noteValue
      });

      setNotesInitialValue({
        html: htmlValue,
        text: noteValue
      });
    }
  }, [notesWorkspaceOpen, noteRichValue, noteValue]);

  const handleOpenNotesWorkspace = useCallback(() => {
    const htmlValue = noteRichValue && noteRichValue.trim().length > 0
      ? noteRichValue
      : convertPlainTextToHtml(noteValue);

    const initialState = {
      html: htmlValue,
      text: noteValue
    };

    setNotesDraft(initialState);
    setNotesInitialValue(initialState);
    setNotesWorkspaceOpen(true);
  }, [noteRichValue, noteValue]);

  const handleWorkspaceChange = useCallback((nextValue) => {
    setNotesDraft(nextValue);
  }, []);

  const handleWorkspaceSave = useCallback(() => {
    updateNode({ notes: notesDraft.text, notesRichText: notesDraft.html });
    setNotesInitialValue(notesDraft);
    setNotesWorkspaceOpen(false);
  }, [notesDraft, updateNode]);

  const handleWorkspaceDismiss = useCallback(() => {
    setNotesWorkspaceOpen(false);
    setNotesDraft({
      html: noteRichValue,
      text: noteValue
    });
    setNotesInitialValue({
      html: noteRichValue && noteRichValue.trim().length > 0
        ? noteRichValue
        : convertPlainTextToHtml(noteValue),
      text: noteValue
    });
  }, [noteRichValue, noteValue]);


  const typeData = useMemo(() => selectedPerson?.typeData || {}, [selectedPerson?.typeData]);
  const visualStyle = selectedPerson?.visualStyle || {};

  if (!selectedPerson) {
    return null;
  }

  const updateTypeData = (field, value) => {
    updateNode({ typeData: { [field]: value } });
  };

  const updateVisualStyle = (field, value) => {
    updateNode({ visualStyle: { ...visualStyle, [field]: value } });
  };

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    if (newType === nodeType) return;

    updateNode({
      type: newType,
      typeData: {},
      visualStyle: { ...visualStyle, shape: undefined, icon: undefined }
    });
    setActiveTab('basic');
  };

  const renderNodeTypeSelector = () => (
    <div>
      <FieldLabel>Node Type</FieldLabel>
      <div style={{ position: 'relative' }}>
        <select
          value={nodeType}
          onChange={handleTypeChange}
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 48px 12px 16px',
            fontSize: '14px',
            backgroundColor: '#f9fafb',
            appearance: 'none'
          }}
        >
          {NODE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none'
        }}>
          {(() => {
            const Icon = NODE_TYPE_ICONS[nodeType] || Users;
            return <Icon size={18} color="#64748b" />;
          })()}
        </div>
      </div>
    </div>
  );

  const renderTabNavigation = () => {
    const tabs = [
      { id: 'basic', label: 'Basic' },
      { id: 'visual', label: 'Visual' },
      { id: 'notes', label: 'Notes' }
    ];

    return (
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: activeTab === tab.id ? '#ffffff' : '#f8fafc',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab.id ? '#6366f1' : '#64748b',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderOrganizationBasic = () => (
    <Section>
      <div>
        <FieldLabel>Organization Name</FieldLabel>
        <Input
          value={selectedPerson.name || ''}
          onChange={(e) => updateNode({ name: e.target.value })}
          placeholder="e.g., Safe Generations"
        />
      </div>
      <div>
        <FieldLabel>Organization Type</FieldLabel>
        <Input
          value={typeData.organizationType || ''}
          onChange={(e) => updateTypeData('organizationType', e.target.value)}
          placeholder="e.g., Child Welfare Agency"
        />
      </div>
      <div>
        <FieldLabel>Primary Contact Person</FieldLabel>
        <Input
          value={typeData.contactPerson || ''}
          onChange={(e) => updateTypeData('contactPerson', e.target.value)}
          placeholder="Name & role"
        />
      </div>
      <div>
        <FieldLabel>Phone</FieldLabel>
        <Input
          value={typeData.phone || ''}
          onChange={(e) => updateTypeData('phone', e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <FieldLabel>Address</FieldLabel>
        <TextArea
          value={typeData.address || ''}
          onChange={(e) => updateTypeData('address', e.target.value)}
          placeholder="Street, City, State, ZIP"
        />
      </div>
      <div>
        <FieldLabel>Hours / Availability</FieldLabel>
        <Input
          value={typeData.hours || ''}
          onChange={(e) => updateTypeData('hours', e.target.value)}
          placeholder="Mon-Fri 9am-5pm"
        />
      </div>
    </Section>
  );

  const renderServiceResourceBasic = () => (
    <Section>
      <div>
        <FieldLabel>Resource Name</FieldLabel>
        <Input
          value={selectedPerson.name || ''}
          onChange={(e) => updateNode({ name: e.target.value })}
          placeholder="e.g., Community Food Bank"
        />
      </div>
      <div>
        <FieldLabel>Service Type</FieldLabel>
        <Input
          value={typeData.serviceType || ''}
          onChange={(e) => updateTypeData('serviceType', e.target.value)}
          placeholder="Food Assistance, Housing Support..."
        />
      </div>
      <div>
        <FieldLabel hint="Who qualifies?">Eligibility</FieldLabel>
        <TextArea
          value={typeData.eligibility || ''}
          onChange={(e) => updateTypeData('eligibility', e.target.value)}
          placeholder="Income guidelines, referral requirements..."
        />
      </div>
      <div>
        <FieldLabel>Cost</FieldLabel>
        <Input
          value={typeData.cost || ''}
          onChange={(e) => updateTypeData('cost', e.target.value)}
          placeholder="Free, Sliding Scale, Insurance Required..."
        />
      </div>
      <div>
        <FieldLabel>Availability</FieldLabel>
        <TextArea
          value={typeData.availability || ''}
          onChange={(e) => updateTypeData('availability', e.target.value)}
          placeholder="Waitlists, hours, appointment process..."
        />
      </div>
    </Section>
  );

  const renderPlaceLocationBasic = () => (
    <Section>
      <div>
        <FieldLabel>Location Name</FieldLabel>
        <Input
          value={selectedPerson.name || ''}
          onChange={(e) => updateNode({ name: e.target.value })}
          placeholder="e.g., Family Home, School"
        />
      </div>
      <div>
        <FieldLabel>Address</FieldLabel>
        <TextArea
          value={typeData.address || ''}
          onChange={(e) => updateTypeData('address', e.target.value)}
          placeholder="Street, City, accessibility notes"
        />
      </div>
      <div>
        <FieldLabel>Location Type</FieldLabel>
        <Input
          value={typeData.locationType || ''}
          onChange={(e) => updateTypeData('locationType', e.target.value)}
          placeholder="Home, School, Shelter..."
        />
      </div>
      <div>
        <FieldLabel hint="Separate with commas">Accessibility Features</FieldLabel>
        <Input
          value={Array.isArray(typeData.accessibilityFeatures) ? typeData.accessibilityFeatures.join(', ') : (typeData.accessibilityFeatures || '')}
          onChange={(e) => {
            const value = e.target.value.split(',').map((item) => item.trim()).filter(Boolean);
            updateTypeData('accessibilityFeatures', value);
          }}
          placeholder="Ramp, elevator, interpreter services..."
        />
      </div>
    </Section>
  );

  const renderCustomBasic = () => (
    <Section>
      <div>
        <FieldLabel>Display Name</FieldLabel>
        <Input
          value={selectedPerson.name || ''}
          onChange={(e) => updateNode({ name: e.target.value })}
          placeholder="Give this node a label"
        />
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <TextArea
          value={typeData.description || ''}
          onChange={(e) => updateTypeData('description', e.target.value)}
          placeholder="Describe what this custom node represents"
        />
      </div>
      <div>
        <FieldLabel hint="Comma separated">Tags</FieldLabel>
        <Input
          value={Array.isArray(typeData.customTags) ? typeData.customTags.join(', ') : (typeData.customTags || '')}
          onChange={(e) => {
            const value = e.target.value.split(',').map((item) => item.trim()).filter(Boolean);
            updateTypeData('customTags', value);
          }}
          placeholder="Support, Protective Factor, Key Ally..."
        />
      </div>
    </Section>
  );

  const renderBasicTab = () => {
    switch (nodeType) {
      case NodeType.PERSON:
        return <PersonEditPanel />;
      case NodeType.ORGANIZATION:
        return renderOrganizationBasic();
      case NodeType.SERVICE_RESOURCE:
        return renderServiceResourceBasic();
      case NodeType.PLACE_LOCATION:
        return renderPlaceLocationBasic();
      case NodeType.CUSTOM:
      default:
        return renderCustomBasic();
    }
  };

  const renderVisualTab = () => {
    const config = getNodeTypeConfig(nodeType);
    const activeShape = visualStyle.shape || 'auto';
    const iconValue = (visualStyle.icon || '').toLowerCase();
    const currentIconEntry = NODE_ICON_LIBRARY.find((entry) => entry.value === iconValue);
  const showIconPicker = nodeType !== NodeType.PERSON;
    const query = iconSearch.trim().toLowerCase();
    const filteredCategories = NODE_ICON_CATEGORIES.map((category) => ({
      ...category,
      icons: category.icons.filter((entry) => {
        if (!query) return true;
        return (
          entry.value.includes(query) ||
          entry.label.toLowerCase().includes(query) ||
          entry.tags?.some((tag) => tag.includes(query))
        );
      })
    })).filter((category) => (query ? category.icons.length > 0 : true));

    return (
      <Section>
        <div>
          <FieldLabel>Accent Color</FieldLabel>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="color"
              value={visualStyle.color || '#3b82f6'}
              onChange={(e) => updateVisualStyle('color', e.target.value)}
              style={{
                width: '48px',
                height: '48px',
                border: '1px solid #cbd5f5',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            />
            <Input
              value={visualStyle.color || '#3b82f6'}
              onChange={(e) => updateVisualStyle('color', e.target.value)}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Shape</FieldLabel>
          <select
            value={activeShape}
            onChange={(e) => updateVisualStyle('shape', e.target.value === 'auto' ? undefined : e.target.value)}
            style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              backgroundColor: '#f9fafb'
            }}
          >
            <option value="auto">Auto ({config.defaultShape || 'type-based'})</option>
            <option value="square">Square</option>
            <option value="circle">Circle</option>
            <option value="diamond">Diamond</option>
            <option value="rounded-rect">Rounded Rectangle</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>
        <div>
          <FieldLabel>Icon (optional)</FieldLabel>
          <Input
            value={visualStyle.icon || ''}
            onChange={(e) => updateVisualStyle('icon', e.target.value)}
            placeholder="Paste emoji or input short text or use Icon Picker Below"
          />
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
            Example: heart, ⭐, 🏥 — shown inside or beside the object
          </div>
          {showIconPicker && (
            <div style={{ marginTop: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {currentIconEntry ? (
                      <currentIconEntry.Icon size={22} strokeWidth={1.5} />
                    ) : (
                      <span style={{ fontSize: '18px', color: '#64748b' }}>∅</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
                      {currentIconEntry ? currentIconEntry.label : 'No icon selected'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {currentIconEntry ? currentIconEntry.name : 'Choose an icon for this custom node'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIconPickerOpen((prev) => !prev)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #6366f1',
                      backgroundColor: iconPickerOpen ? '#6366f1' : '#ffffff',
                      color: iconPickerOpen ? '#ffffff' : '#4f46e5',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {iconPickerOpen ? 'Close Picker' : 'Browse Icons'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateVisualStyle('icon', '')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              {iconPickerOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Input
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search icons (community, care, shelter...)"
                    style={{ fontSize: '13px', padding: '10px 12px', borderRadius: '10px' }}
                  />
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '10px',
                    maxHeight: '240px',
                    overflowY: 'auto'
                  }}>
                    {filteredCategories.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                        No icons match that search.
                      </div>
                    )}
                    {filteredCategories.map((category) => (
                      <div key={category.id} style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {category.label}
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                          gap: '10px'
                        }}>
                          {category.icons.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => {
                                updateVisualStyle('icon', entry.value);
                                setIconPickerOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px 10px',
                                borderRadius: '10px',
                                border: iconValue === entry.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                backgroundColor: iconValue === entry.value ? '#eef2ff' : '#ffffff',
                                gap: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              <entry.Icon size={24} strokeWidth={1.8} />
                              <span style={{ fontSize: '12px', color: '#1f2937', fontWeight: 500, textAlign: 'center' }}>
                                {entry.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>
    );
  };

  const renderNotesTab = () => {
    const nodeLabel = getNodeTypeConfig(nodeType)?.label || 'Node';
    const hasNotes = (noteValue && noteValue.trim().length > 0) || (noteRichValue && noteRichValue.trim().length > 0);
    const previewHtml = hasNotes
      ? (noteRichValue && noteRichValue.trim().length > 0 ? noteRichValue : convertPlainTextToHtml(noteValue))
      : convertPlainTextToHtml('No notes captured yet. Open the workspace to document meetings, insights, and next steps.');

    return (
      <Section style={{ gap: '20px', minHeight: '440px' }}>
        <div style={{
          border: '1px solid #dbe0ea',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 22px 48px -28px rgba(15, 23, 42, 0.35)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Recent Notes Overview
            </div>
            {hasNotes && (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Saved from workspace
              </span>
            )}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#334155',
            lineHeight: 1.62,
            minHeight: '300px',
            maxHeight: '520px',
            overflowY: 'auto',
            paddingRight: '8px'
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleOpenNotesWorkspace}
            style={{
              border: 'none',
              borderRadius: '999px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              padding: '12px 22px',
              cursor: 'pointer',
              boxShadow: '0 10px 25px -10px rgba(79, 70, 229, 0.45)'
            }}
          >
            Open Notes Workspace
          </button>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Open the full-page editor to add rich updates, then return here for a quick read-through.
          </span>
        </div>

        <div style={{
          backgroundColor: '#f1f5f9',
          borderRadius: '14px',
          border: '1px solid #d7e3f3',
          padding: '16px 18px',
          fontSize: '12px',
          color: '#475569',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Workspace highlights</span>
          <span>- Full-page editor tailored for ongoing notes and planning.</span>
          <span>- Quick formatting, snippets, and stamps designed for social work documentation.</span>
          <span>- Saved notes stay printable alongside the {nodeLabel.toLowerCase()} record.</span>
        </div>
      </Section>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {renderNodeTypeSelector()}
      {renderTabNavigation()}
      <div>
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'visual' && renderVisualTab()}
        {activeTab === 'notes' && renderNotesTab()}
      </div>

      <NotesWorkspaceModal
        isOpen={notesWorkspaceOpen}
        initialValue={notesInitialValue}
        onChange={handleWorkspaceChange}
        onSave={handleWorkspaceSave}
        onDismiss={handleWorkspaceDismiss}
        nodeLabel={getNodeTypeConfig(nodeType)?.label || 'Node'}
      />
    </div>
  );
};

export default NodeEditPanel;
