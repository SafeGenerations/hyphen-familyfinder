// src/src-modern/components/UI/ChildConnectionOptionsModal.js
import React from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useResponsive } from '../../utils/responsive';
import { X, HelpCircle, UserPlus, Heart, Baby } from 'lucide-react';

const ChildConnectionOptionsModal = () => {
  const { state, actions } = useGenogram();
  const { childConnectionOptions } = state;
  const { breakpoint } = useResponsive();

  if (!childConnectionOptions || !childConnectionOptions.isOpen) return null;

  const { parentPerson, childPerson, availablePartners } = childConnectionOptions;

  const handleOptionClick = (optionType, relationship = null) => {
    actions.handleChildConnectionOption(optionType, parentPerson, childPerson, relationship);
  };

  const handleClose = () => {
    actions.handleChildConnectionOption('cancel');
  };

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const contentStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: isMobile ? '90%' : '500px',
    width: '100%',
    maxHeight: isMobile ? '90%' : '80%',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937'
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px'
  };

  const optionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'all 0.2s',
    backgroundColor: '#fafbfc'
  };

  const optionHoverStyle = {
    ...optionStyle,
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db'
  };

  const iconStyle = {
    width: '24px',
    height: '24px',
    flexShrink: 0
  };

  const optionTextStyle = {
    flex: 1
  };

  const optionTitleStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  };

  const optionDescStyle = {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px'
  };

  const renderOptions = () => {
    const options = [];

    if (availablePartners.length === 0) {
      // No existing partners - show all options
      options.push(
        <div key="unknown" style={optionStyle} onClick={() => handleOptionClick('unknown')}>
          <HelpCircle style={{...iconStyle, color: '#6b7280'}} />
          <div style={optionTextStyle}>
            <div style={optionTitleStyle}>Unknown Co-parent</div>
            <div style={optionDescStyle}>
              Creates an unknown co-parent and connects {childPerson.name} as their child
            </div>
          </div>
        </div>
      );

      options.push(
        <div key="newPartner" style={optionStyle} onClick={() => handleOptionClick('newPartner')}>
          <UserPlus style={{...iconStyle, color: '#3b82f6'}} />
          <div style={optionTextStyle}>
            <div style={optionTitleStyle}>New Partner</div>
            <div style={optionDescStyle}>
              Creates a new partner for {parentPerson.name} and connects {childPerson.name} as their child
            </div>
          </div>
        </div>
      );

      options.push(
        <div key="singleAdoption" style={optionStyle} onClick={() => handleOptionClick('singleAdoption')}>
          <Heart style={{...iconStyle, color: '#06b6d4'}} />
          <div style={optionTextStyle}>
            <div style={optionTitleStyle}>Single Parent Adoption</div>
            <div style={optionDescStyle}>
              Creates a single parent adoption relationship for {parentPerson.name} and {childPerson.name}
            </div>
          </div>
        </div>
      );
    } else {
      // Multiple existing partners - show selection options
      options.push(
        <div key="partners-header" style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '12px'
        }}>
          Select which relationship to connect {childPerson.name} to:
        </div>
      );

      availablePartners.forEach((relationship, index) => {
        const partner = state.people.find(p => 
          p.id === (relationship.from === parentPerson.id ? relationship.to : relationship.from)
        );
        
        options.push(
          <div key={`partner-${index}`} style={optionStyle} onClick={() => handleOptionClick('selectPartner', relationship)}>
            <Baby style={{...iconStyle, color: '#8b5cf6'}} />
            <div style={optionTextStyle}>
              <div style={optionTitleStyle}>
                {parentPerson.name} & {partner?.name || 'Unknown'}
              </div>
              <div style={optionDescStyle}>
                {relationship.type} relationship • Connect {childPerson.name} as their child
              </div>
            </div>
          </div>
        );
      });

      // Add the "new options" as well
      options.push(
        <div key="divider" style={{
          borderTop: '1px solid #e5e7eb',
          margin: '16px 0',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            padding: '0 8px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Or create new relationship
          </div>
        </div>
      );

      options.push(
        <div key="unknown-multi" style={optionStyle} onClick={() => handleOptionClick('unknown')}>
          <HelpCircle style={{...iconStyle, color: '#6b7280'}} />
          <div style={optionTextStyle}>
            <div style={optionTitleStyle}>Unknown Co-parent</div>
            <div style={optionDescStyle}>
              Creates an unknown co-parent and connects {childPerson.name} as their child
            </div>
          </div>
        </div>
      );

      options.push(
        <div key="newPartner-multi" style={optionStyle} onClick={() => handleOptionClick('newPartner')}>
          <UserPlus style={{...iconStyle, color: '#3b82f6'}} />
          <div style={optionTextStyle}>
            <div style={optionTitleStyle}>New Partner</div>
            <div style={optionDescStyle}>
              Creates a new partner for {parentPerson.name} and connects {childPerson.name} as their child
            </div>
          </div>
        </div>
      );
    }

    return options;
  };

  return (
    <div style={modalStyle} onClick={handleClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>Connect Child to Parent</div>
            <div style={subtitleStyle}>
              How should {childPerson.name} be connected to {parentPerson.name}?
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          </button>
        </div>

        <div>
          {renderOptions()}
        </div>
      </div>
    </div>
  );
};

export default ChildConnectionOptionsModal; 