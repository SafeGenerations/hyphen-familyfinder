// src/src-modern/components/UI/AddChildButton.js
import React from 'react';
import { Baby } from 'lucide-react';
import { useChildActions } from '../../hooks/useChildActions';
import { useResponsive } from '../../utils/responsive';
import AddChildDropdown from './AddChildDropdown';
import BottomSheet from '../EditPanels/BottomSheet';

const AddChildButton = ({ person }) => {
  console.log('AddChildButton rendered for person:', person?.name);
  
  const { 
    showChildOptions, 
    setShowChildOptions, 
    getPartnerRelationships,
    selectPartnerRelationship
  } = useChildActions();
  
  const { breakpoint, dimensions } = useResponsive();
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  
  if (!person) return null;
  
  const partnerRelationships = getPartnerRelationships(person.id);
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== ADD CHILD BUTTON CLICKED ===');
    console.log('Person:', person);
    console.log('Partner relationships:', partnerRelationships);
    
    if (partnerRelationships.length === 0) {
      // No partners - show options
      console.log('No partners found, showing dropdown');
      setShowChildOptions(true);
    } else if (partnerRelationships.length === 1) {
      // One partner - directly select that relationship
      console.log('One partner found, selecting relationship');
      selectPartnerRelationship(partnerRelationships[0]);
    } else {
      // Multiple partners - show selection
      console.log('Multiple partners found, showing dropdown');
      setShowChildOptions(true);
    }
  };
  
  console.log('showChildOptions state:', showChildOptions);
  
  // Mobile styles
  const mobileStyles = {
    button: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: dimensions.baseSpacing * 0.75,
      padding: `${dimensions.baseSpacing}px ${dimensions.baseSpacing * 1.25}px`,
      backgroundColor: '#d1fae5',
      color: '#10b981',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontSize: `${dimensions.baseFontSize}px`,
      fontWeight: '500',
      position: 'relative',
      minHeight: dimensions.minTouchTarget,
      transition: 'all 0.2s',
      WebkitTapHighlightColor: 'transparent'
    },
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      backgroundColor: '#6366f1',
      color: 'white',
      borderRadius: '50%',
      width: isMobile ? '20px' : '18px',
      height: isMobile ? '20px' : '18px',
      fontSize: isMobile ? '12px' : '11px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600'
    }
  };
  
  // Mobile - render with BottomSheet
  if (isMobile && showChildOptions) {
    return (
      <>
        <button
          onClick={handleClick}
          style={mobileStyles.button}
        >
          <Baby size={isMobile ? 20 : 16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Add Child</span>
          {partnerRelationships.length > 1 && (
            <span style={mobileStyles.badge}>
              {partnerRelationships.length}
            </span>
          )}
        </button>
        
        <BottomSheet
          isOpen={showChildOptions}
          onClose={() => setShowChildOptions(false)}
          title="Add Child"
        >
          <AddChildDropdown
            person={person}
            partnerRelationships={partnerRelationships}
            onClose={() => {
              console.log('Closing dropdown');
              setShowChildOptions(false);
            }}
            isMobile={true}
          />
        </BottomSheet>
      </>
    );
  }
  
  // Desktop - render with dropdown
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        style={isMobile ? mobileStyles.button : styles.button}
        onMouseEnter={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#a7f3d0')}
        onMouseLeave={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#d1fae5')}
      >
        <Baby size={isMobile ? 20 : 16} />
        Add Child
        {partnerRelationships.length > 1 && (
          <span style={isMobile ? mobileStyles.badge : styles.badge}>
            {partnerRelationships.length}
          </span>
        )}
      </button>

      {showChildOptions && !isMobile && (
        <>
          {console.log('Rendering AddChildDropdown')}
          <AddChildDropdown
            person={person}
            partnerRelationships={partnerRelationships}
            onClose={() => {
              console.log('Closing dropdown');
              setShowChildOptions(false);
            }}
            isMobile={false}
          />
        </>
      )}
    </div>
  );
};

const styles = {
  button: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#d1fae5',
    color: '#10b981',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    position: 'relative',
    transition: 'background-color 0.2s'
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#6366f1',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600'
  }
};

export default AddChildButton;