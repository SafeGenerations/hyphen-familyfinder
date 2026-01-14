// In AddChildDropdown.js, update the component with smart positioning:

import React, { useState, useEffect, useRef } from 'react';
import { X, HelpCircle, UserPlus, Link2, Heart } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useChildActions } from '../../hooks/useChildActions';
import { usePersonActions } from '../../hooks/usePersonActions';

const AddChildDropdown = ({ person, partnerRelationships, onClose }) => {
  const { state } = useGenogram();
  const { people } = state;
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  
  const { 
    createChildWithUnknownParent,
    createSingleParentAdoption,
    selectPartnerRelationship
  } = useChildActions();
  const { createSpouse, startConnectionFromPerson } = usePersonActions();

  // Calculate dropdown position after it renders
  useEffect(() => {
    if (dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      const parentRect = dropdown.parentElement.getBoundingClientRect();
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate available space
      const spaceBelow = viewportHeight - parentRect.bottom;
      const spaceAbove = parentRect.top;
      const spaceRight = viewportWidth - parentRect.left;
      const spaceLeft = parentRect.right;
      
      let style = {
        position: 'absolute',
        zIndex: 50,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minWidth: '280px',
        maxWidth: '400px',
        maxHeight: '400px',
        overflowY: 'auto'
      };
      
      // Vertical positioning
      if (spaceBelow >= rect.height || spaceBelow > spaceAbove) {
        // Position below
        style.top = '100%';
        style.marginTop = '8px';
      } else {
        // Position above
        style.bottom = '100%';
        style.marginBottom = '8px';
      }
      
      // Horizontal positioning
      if (spaceRight >= rect.width) {
        // Align to left edge
        style.left = '0';
      } else if (spaceLeft >= rect.width) {
        // Align to right edge
        style.right = '0';
      } else {
        // Center it if possible
        style.left = '50%';
        style.transform = 'translateX(-50%)';
      }
      
      // Ensure dropdown doesn't go off screen
      if (rect.width > viewportWidth * 0.9) {
        style.width = `${viewportWidth * 0.9}px`;
      }
      
      setDropdownStyle(style);
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleUnknownParent = () => {
    createChildWithUnknownParent(person);
    onClose();
  };

  const handleNewPartner = () => {
    createSpouse();
    onClose();
  };

  const handleConnectExisting = () => {
    startConnectionFromPerson('partner');
    onClose();
  };

  const handleSingleAdoption = () => {
    createSingleParentAdoption(person);
    onClose();
  };

  const handleSelectPartnership = (rel) => {
    selectPartnerRelationship(rel, person);
    onClose();
  };

  return (
    <div ref={dropdownRef} style={dropdownStyle}>
      <div style={styles.header}>
        <span style={styles.title}>Add Child Options</span>
        <button onClick={onClose} style={styles.closeButton}>
          <X size={16} color="#6b7280" />
        </button>
      </div>

      <div style={styles.content}>
        {partnerRelationships.length === 0 ? (
          <NoPartnersOptions 
            onUnknownParent={handleUnknownParent}
            onNewPartner={handleNewPartner}
            onConnectExisting={handleConnectExisting}
            onSingleAdoption={handleSingleAdoption}
          />
        ) : (
          <ExistingPartnersOptions
            partnerRelationships={partnerRelationships}
            person={person}
            people={people}
            onSelectPartnership={handleSelectPartnership}
            onUnknownParent={handleUnknownParent}
          />
        )}
      </div>
    </div>
  );
};

// ... rest of the component (NoPartnersOptions, ExistingPartnersOptions, OptionButton, styles) remains the same ...

const NoPartnersOptions = ({ onUnknownParent, onNewPartner, onConnectExisting, onSingleAdoption }) => (
  <>
    <div style={{ 
      padding: '8px 12px', 
      fontSize: '12px', 
      color: '#10b981',
      fontWeight: '500',
      backgroundColor: '#d1fae5',
      borderRadius: '6px',
      marginBottom: '8px',
      textAlign: 'center'
    }}>
      ✨ One-click: Creates partner + child instantly!
    </div>
    
    <OptionButton
      icon={HelpCircle}
      iconColor="#6b7280"
      title="Unknown Co-parent + Child"
      subtitle="Creates unknown parent and adds a child"
      onClick={onUnknownParent}
    />
    <OptionButton
      icon={UserPlus}
      iconColor="#6366f1"
      title="New Partner"
      subtitle="Create a new partner to have children with"
      onClick={onNewPartner}
    />
    <OptionButton
      icon={Link2}
      iconColor="#8b5cf6"
      title="Connect to Existing"
      subtitle="Link to someone already in the diagram"
      onClick={onConnectExisting}
    />
    <OptionButton
      icon={Heart}
      iconColor="#06b6d4"
      title="Single Parent Adoption + Child"
      subtitle="Creates adopted child instantly"
      onClick={onSingleAdoption}
    />
  </>
);

const ExistingPartnersOptions = ({ partnerRelationships, person, people, onSelectPartnership, onUnknownParent }) => (
  <>
    <div style={styles.sectionLabel}>
      Select which relationship to add a child to:
    </div>
    
    {partnerRelationships.map(rel => {
      const partner = people.find(p => 
        p.id === (rel.from === person.id ? rel.to : rel.from)
      );
      
      return (
        <OptionButton
          key={rel.id}
          icon={Heart}
          iconColor={rel.color || '#6366f1'}
          title={`${rel.type.charAt(0).toUpperCase() + rel.type.slice(1)} with ${partner?.name || 'Unknown'}`}
          subtitle={rel.startDate ? `Since ${new Date(rel.startDate).getFullYear()}` : null}
          onClick={() => onSelectPartnership(rel)}
        />
      );
    })}
    
    <div style={styles.divider}>Or create a new relationship:</div>
    
    <OptionButton
      icon={HelpCircle}
      iconColor="#6b7280"
      title="Add Another Unknown Co-parent"
      subtitle="Child from a different relationship"
      onClick={onUnknownParent}
    />
  </>
);

const OptionButton = ({ icon: Icon, iconColor, title, subtitle, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.optionButton,
        backgroundColor: isHovered ? '#f3f4f6' : '#f9fafb'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon size={20} color={iconColor} />
      <div>
        <div style={styles.optionTitle}>{title}</div>
        {subtitle && <div style={styles.optionSubtitle}>{subtitle}</div>}
      </div>
    </button>
  );
};

const styles = {
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    marginTop: '8px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: 50,
    overflow: 'hidden'
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  closeButton: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  content: {
    padding: '8px'
  },
  sectionLabel: {
    padding: '8px 12px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px'
  },
  divider: {
    padding: '8px 12px',
    fontSize: '12px',
    color: '#6b7280',
    borderTop: '1px solid #f3f4f6',
    marginTop: '8px'
  },
  optionButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
    marginBottom: '8px',
    transition: 'all 0.2s'
  },
  optionTitle: {
    fontWeight: '500'
  },
  optionSubtitle: {
    fontSize: '12px',
    color: '#6b7280'
  }
};

export default AddChildDropdown;