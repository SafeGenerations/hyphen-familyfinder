import React from 'react';
import { Users, Plus, Download, Upload, Grid3X3, Save as SaveIcon, Lasso, Maximize2, FilePlus, Eye, Tag, Home, FileText } from 'lucide-react';

const buttonBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '12px 8px',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  minWidth: '110px',
  height: '56px',
  lineHeight: '1.2',
  whiteSpace: 'normal',
  textAlign: 'center'
};

const Toolbar = ({
  peopleCount,
  relationshipCount,
  networkMemberCount,
  onAddPerson,
  onAddTextBox,
  onNew,
  isDrawingHousehold,
  toggleHouseholdDrawing,
  autoArrange,
  fitToCanvas,
  snapToGrid,
  toggleSnap,
  highlightNetwork,
  toggleHighlight,
  showConnectionBadges,
  toggleConnectionBadges,
  showPlacementBadges,
  togglePlacementBadges,
  exportSvg,
  exportData,
  exportPDF,
  importData,
  checkMailingListSignup,
  fileName
}) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/Genogram Logo Bug Only.png"
          alt="Genogram Logo"
          style={{ width: '90px', height: '90px', borderRadius: '12px' }}
        />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Genogram Builder</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
            {`Create detailed family relationship maps • People: ${peopleCount} • Relationships: ${relationshipCount} • Network Members: ${networkMemberCount}`}
          </p>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>File: {fileName}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          id="add-person-button"
          title="Add a person and edit their details in the person menu on the right sidebar"
          onClick={onAddPerson}
          style={{ ...buttonBase, backgroundColor: '#3b82f6', color: 'white' }}
        >
          <Plus size={18} />Add Person
        </button>
        <button
          id="add-text-button"
          title="Add a free text box to the canvas"
          onClick={onAddTextBox}
          style={{ ...buttonBase, backgroundColor: '#e5e7eb', color: '#374151' }}
        >
          <Plus size={18} />Add Text
        </button>
        <button
          id="household-button"
          title="Draw a household area by lassoing people who live together"
          onClick={toggleHouseholdDrawing}
          style={{ ...buttonBase, backgroundColor: isDrawingHousehold ? '#6366f1' : 'white', color: isDrawingHousehold ? 'white' : '#64748b', border: isDrawingHousehold ? 'none' : '1px solid #e2e8f0' }}
        >
          <Lasso size={18} />Draw Household
        </button>
        <button onClick={autoArrange} style={{ ...buttonBase, backgroundColor: '#8b5cf6', color: 'white' }}><Users size={18} />Auto Arrange</button>
        <button onClick={fitToCanvas} style={{ ...buttonBase, backgroundColor: '#0ea5e9', color: 'white' }}><Maximize2 size={18} />Fit</button>
        <button onClick={toggleSnap} style={{ ...buttonBase, backgroundColor: snapToGrid ? '#10b981' : 'white', color: snapToGrid ? 'white' : '#64748b', border: snapToGrid ? 'none' : '1px solid #e2e8f0' }}><Grid3X3 size={18} />Grid</button>
        <button onClick={toggleHighlight} style={{ ...buttonBase, backgroundColor: highlightNetwork ? '#10b981' : 'white', color: highlightNetwork ? 'white' : '#64748b', border: highlightNetwork ? 'none' : '1px solid #e2e8f0' }}><Eye size={18} />Highlight Network</button>
        <button 
          onClick={toggleConnectionBadges} 
          title="Show/hide connection status badges (potential, exploring, ruled out)"
          style={{ ...buttonBase, backgroundColor: showConnectionBadges ? '#f59e0b' : 'white', color: showConnectionBadges ? 'white' : '#64748b', border: showConnectionBadges ? 'none' : '1px solid #e2e8f0' }}
        >
          <Tag size={18} />Connection Status
        </button>
        <button 
          onClick={togglePlacementBadges}
          title="Show/hide placement status badges (temporary, permanent, ruled out)"
          style={{ ...buttonBase, backgroundColor: showPlacementBadges ? '#3b82f6' : 'white', color: showPlacementBadges ? 'white' : '#64748b', border: showPlacementBadges ? 'none' : '1px solid #e2e8f0' }}
        >
          <Home size={18} />Placement Status
        </button>
        <button
          id="svg-button"
          title="Export your Genogram as an image file (SVG) to use in other applications"
          onClick={() => checkMailingListSignup(exportSvg)}
          style={{ ...buttonBase, backgroundColor: '#f59e0b', color: 'white' }}
        >
          <Download size={18} />Download Image
        </button>
        <button
          id="pdf-button"
          title="Generate a comprehensive PDF report with diagram and detailed information"
          onClick={() => checkMailingListSignup(exportPDF)}
          style={{ ...buttonBase, backgroundColor: '#8b5cf6', color: 'white' }}
        >
          <FileText size={18} />PDF Report
        </button>
        <button
          id="save-button"
          title="Save your work as a .geno file on your computer that you can open later to edit the genogram in this app"
          onClick={() => checkMailingListSignup(exportData)}
          style={{ ...buttonBase, backgroundColor: '#10b981', color: 'white' }}
        >
          <SaveIcon size={18} />SAVE
        </button>
        <button
          id="new-button"
          title="Start a new blank genogram"
          onClick={onNew}
          style={{ ...buttonBase, backgroundColor: '#ef4444', color: 'white' }}
        >
          <FilePlus size={18} />New
        </button>
        <label title="Open a saved Genogram created in this app" style={{ ...buttonBase, backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}><Upload size={18} />Open<input type="file" accept=".geno,.json" onChange={(e) => checkMailingListSignup(() => importData(e))} style={{ display: 'none' }} /></label>
      </div>
    </div>
  </div>
);

export default Toolbar;
