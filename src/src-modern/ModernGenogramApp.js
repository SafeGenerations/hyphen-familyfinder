// src/src-modern/ModernGenogramApp.js
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GenogramProvider, useGenogram } from './contexts/GenogramContext';
import './styles/responsive.css';
import { useResponsive } from './utils/responsive';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import HybridInterfaceWrapper from './components/HybridInterfaceWrapper';
import TabletInterface from './components/TabletInterface/TabletInterface';
import GenogramCanvas from './components/Canvas/GenogramCanvas';
import FloatingToolbar from './components/UI/FloatingToolbar';
import SidePanel from './components/UI/SidePanel';
import QuickAddModal from './components/UI/QuickAddModal';
import ContextMenu from './components/UI/ContextMenu';
import DeleteConfirmationModal from './components/UI/DeleteConfirmationModal';
import ConnectionIndicator from './components/UI/ConnectionIndicator';
import HouseholdDrawingIndicator from './components/UI/HouseholdDrawingIndicator';
import PromoSidebar from './components/UI/PromoSidebar';
import GuidedTour from './components/UI/GuidedTour';
import Feedback from './components/UI/Feedback';
import HelpButton from './components/UI/HelpButton';
import SelectionIndicator from './components/UI/SelectionIndicator';
import BulkEditPanel from './components/UI/BulkEditPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';
import promoConfig from './config/promoConfig';
import NewPersonModal from './components/UI/NewPersonModal';
import ChildConnectionOptionsModal from './components/UI/ChildConnectionOptionsModal';

// Mobile components
import MobileToolbar from './components/UI/MobileToolbar';
import MobileEditPanel from './components/EditPanels/MobileEditPanel';
import QuickEditModal from './components/UI/QuickEditModal';
import MobileRadialMenu from './components/UI/MobileRadialMenu';
import NetworkSearchModal from './components/NetworkSearchModal';
import DiscoveryPanel from './components/UI/DiscoveryPanel';
import AnalyticsPanel from './components/Dashboard/AnalyticsPanel';
import PersonSearchModal from './components/Search/PersonSearchModal';

// Import embed integration
import { initializeEmbedIntegration, isEmbedded } from '../utils/embedIntegration';
import { useCanvasOperations } from './hooks/useCanvasOperations';
import EmbedSaveToolbar from './components/UI/EmbedSaveToolbar';

// Internal component that uses the context
const GenogramAppContent = ({ 
  deviceType: overrideDeviceType, 
  isTablet: overrideIsTablet, 
  isMobile: overrideIsMobile,
  isDesktop: overrideIsDesktop,
  isHybrid 
}) => {
  const { state, actions } = useGenogram();
  const { dimensions, breakpoint } = useResponsive();
  const deviceDetection = useDeviceDetection();
  const { fitToCanvas } = useCanvasOperations();
  const [showTutorial, setShowTutorial] = React.useState(false);
  
  // Track if we've done initial autofit
  const hasInitialFitRef = React.useRef(false);
  
  // Check if embedded
  const embedMode = isEmbedded();
  
  // Make fitToCanvas globally available for embed mode
  React.useEffect(() => {
    window.genogramCanvasOperations = { fitToCanvas };
    return () => {
      delete window.genogramCanvasOperations;
    };
  }, [fitToCanvas]);
  
  const [showPromo, setShowPromo] = React.useState(() => {
    // Don't show promo in embed mode
    if (embedMode || !promoConfig.showPromo) return false;
    
    // Check if current promo version has been dismissed
    const dismissedVersion = localStorage.getItem('genogram_promo_dismissed_version');
    const currentVersion = promoConfig.version;
    
    // Show promo if no version dismissed or if current version is newer
    return dismissedVersion !== currentVersion;
  });

  // Initialize embed integration
  useEffect(() => {
    if (embedMode) {
      const embedIntegration = initializeEmbedIntegration({ state, actions });
      
      // Listen for changes and notify parent
      const handleChange = () => {
        embedIntegration.notifyParentOfChange('state_update', {
          people: state.people,
          relationships: state.relationships
        });
      };
      
      // Cleanup on unmount
      return () => {
        if (embedIntegration) {
          embedIntegration.destroy();
        }
      };
    }
  }, [embedMode, state, actions]);

  // Use override values from HybridInterfaceWrapper if provided
  const deviceType = overrideDeviceType || deviceDetection.deviceType;
  const isTablet = overrideIsTablet !== undefined ? overrideIsTablet : deviceDetection.isTablet;
  const isMobile = overrideIsMobile !== undefined ? overrideIsMobile : deviceDetection.isMobile;
  const isDesktop = overrideIsDesktop !== undefined ? overrideIsDesktop : deviceDetection.isDesktop;

  // Combine device detection with responsive breakpoints
  const isMobileView = isMobile || breakpoint === 'xs' || breakpoint === 'sm';
  const isTabletView = isTablet && !isMobileView;

  // Initialize tutorial (desktop only and not in embed mode)
  useEffect(() => {
    if (!embedMode && localStorage.getItem('genogram_tutorial_seen') !== 'true' && !isMobileView && !isTabletView) {
      setShowTutorial(true);
    }
  }, [embedMode, isMobileView, isTabletView]);

  // Setup keyboard shortcuts (disabled on mobile, tablet, and embed mode has its own)
  useKeyboardShortcuts(isMobileView || isTabletView || embedMode);

  // Setup auto-save (disabled in embed mode as parent handles saving)
  useAutoSave(embedMode ? 0 : 30000); // 0 disables auto-save

  // Auto-fit to canvas when content is first available
  useEffect(() => {
    // Check if we have content and haven't done initial fit yet
    const hasContent = state.people.length > 0 || state.textBoxes.length > 0 || state.households.length > 0;
    
    if (hasContent && !hasInitialFitRef.current) {
      hasInitialFitRef.current = true;
      
      // Small delay to ensure canvas is rendered
      const timeoutId = setTimeout(() => {
        const canvasElement = document.getElementById('genogram-canvas');
        if (canvasElement) {
          fitToCanvas();
        }
      }, 500); // Delay to ensure proper rendering
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.people, state.textBoxes, state.households, fitToCanvas, state.people.length]);

  // Handle beforeunload (not in embed mode)
  useEffect(() => {
    if (embedMode) return;
    
    const handleBeforeUnload = (e) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty, embedMode]);

  const shouldShowPromo = !embedMode &&
                         !state.selectedPerson && 
                         !state.selectedRelationship && 
                         !state.selectedHousehold && 
                         !state.selectedTextBox && 
                         !state.sidePanelOpen && 
                         showPromo &&
                         !isMobileView &&
                         !isTabletView;

  // Check if we should show stats and full logo
  const showStats = !isMobileView && !embedMode;
  const showFullLogo = !isMobileView && !embedMode;

  // TABLET LAYOUT
  if (isTabletView) {
    return <TabletInterface />;
  }

  // MOBILE LAYOUT
  if (isMobileView) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        background: '#fafbfc',
        position: 'relative'
      }}>
        {/* Mobile Interface - includes header, canvas, and toolbar */}
        <MobileToolbar />

        {/* Mobile Modals */}
        <QuickAddModal />
        <DeleteConfirmationModal />
        <MobileRadialMenu />
        <NewPersonModal />
        <ChildConnectionOptionsModal />
        <NetworkSearchModal />
        
        {/* Mobile Edit Panel (full screen when item selected and panel should be open) */}
        {state.sidePanelOpen && (state.selectedPerson || state.selectedRelationship || 
          state.selectedHousehold || state.selectedTextBox) && (
          <MobileEditPanel />
        )}
        
        {/* ContextMenu for desktop devices with small screens */}
        {isDesktop && <ContextMenu />}
      </div>
    );
  }

  // DESKTOP LAYOUT (with touch enhancements if hybrid)
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#fafbfc',
      // Add touch-friendly sizing for hybrid devices
      '--button-min-size': isHybrid ? '44px' : '36px',
      '--click-padding': isHybrid ? '12px' : '8px'
    }}>
      {/* Responsive Header - hide in embed mode */}
      {!embedMode && (
        <div style={{ 
          background: 'linear-gradient(to right, #ffffff, #f8fafc)', 
          borderBottom: '1px solid #e2e8f0', 
          padding: `${dimensions.baseSpacing * 0.8}px ${dimensions.baseSpacing}px`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          minHeight: `${dimensions.headerHeight}px`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: dimensions.baseSpacing,
            flexWrap: 'wrap'
          }}>
            {/* Logo and Title */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: showFullLogo ? '12px' : '8px',
              minWidth: 0,
              flex: '1 1 auto'
            }}>
              <img 
                src="/Genogram Logo Bug Only.png" 
                alt="Genogram Builder" 
                style={{ 
                  height: dimensions.headerHeight * 0.55, 
                  width: 'auto',
                  flexShrink: 0
                }}
              />
              {showFullLogo && (
                <div>
                  <h1 style={{ 
                    fontSize: `${dimensions.baseFontSize + 4}px`, 
                    fontWeight: '700', 
                    color: '#1e293b',
                    margin: 0,
                    letterSpacing: '-0.025em'
                  }}>
                    Genogram Builder
                  </h1>
                  <p style={{ 
                    fontSize: `${dimensions.baseFontSize - 3}px`, 
                    color: '#64748b',
                    margin: 0,
                    marginTop: '2px'
                  }}>
                    Create detailed family relationship maps
                  </p>
                </div>
              )}
            </div>

            {/* Stats - hidden on mobile */}
            {showStats && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: dimensions.baseSpacing,
                paddingLeft: dimensions.baseSpacing,
                borderLeft: '1px solid #e2e8f0',
                flexShrink: 0
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: `${dimensions.baseFontSize + 4}px`, 
                    fontWeight: '600', 
                    color: '#6366f1' 
                  }}>
                    {state.people.length}
                  </div>
                  <div style={{ 
                    fontSize: `${dimensions.baseFontSize - 4}px`, 
                    color: '#64748b' 
                  }}>
                    People
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: `${dimensions.baseFontSize + 4}px`, 
                    fontWeight: '600', 
                    color: '#8b5cf6' 
                  }}>
                    {state.relationships.length}
                  </div>
                  <div style={{ 
                    fontSize: `${dimensions.baseFontSize - 4}px`, 
                    color: '#64748b' 
                  }}>
                    Relationships
                  </div>
                </div>
                {state.people.filter(p => p.networkMember).length > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: `${dimensions.baseFontSize + 4}px`, 
                      fontWeight: '600', 
                      color: '#10b981' 
                    }}>
                      {state.people.filter(p => p.networkMember).length}
                    </div>
                    <div style={{ 
                      fontSize: `${dimensions.baseFontSize - 4}px`, 
                      color: '#64748b' 
                    }}>
                      Network
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <Link
                to="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  background: '#eef2ff',
                  color: '#4338ca',
                  textDecoration: 'none',
                  fontSize: `${dimensions.baseFontSize - 2}px`,
                  fontWeight: 600
                }}
              >
                Admin Console
              </Link>

              {/* File info - simplified on mobile */}
              <div style={{
                textAlign: 'right',
                flexShrink: 0,
                minWidth: 0
              }}>
                <div style={{
                  fontSize: `${dimensions.baseFontSize - 3}px`,
                  fontWeight: '500',
                  color: '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: breakpoint === 'xs' ? '100px' : '200px'
                }}>
                  {state.fileName}
                </div>
                {state.isDirty && (
                  <div style={{
                    fontSize: `${dimensions.baseFontSize - 5}px`,
                    color: '#94a3b8'
                  }}>
                    • Unsaved changes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <GenogramCanvas />
        <FloatingToolbar />
        <SidePanel />
        {state.discoveryPanelOpen && (
          <DiscoveryPanel onClose={() => actions.setDiscoveryPanelOpen(false)} />
        )}
        {state.analyticsPanelOpen && (
          <AnalyticsPanel onClose={() => actions.setAnalyticsPanelOpen(false)} />
        )}
        {shouldShowPromo && (
          <PromoSidebar 
            show={true} 
            onClose={() => {
              localStorage.setItem('genogram_promo_dismissed_version', promoConfig.version);
              setShowPromo(false);
            }} 
          />
        )}
      </div>
      
      {/* Footer - hide in embed mode */}
      {!embedMode && (
        <div style={{
          textAlign: 'center',
          padding: `${dimensions.compactSpacing}px 0`,
          fontSize: `${dimensions.baseFontSize - 4}px`,
          color: '#64748b',
          background: 'white',
          borderTop: '1px solid #e2e8f0'
        }}>
          Powered by{' '}
          <img
            src="/sg_logo_bug_only.png"
            alt="SafeGenerations"
            style={{ 
              height: breakpoint === 'xs' ? '20px' : '24px', 
              verticalAlign: 'middle', 
              margin: '0 4px'
            }}
          />
          SafeGenerations
        </div>
      )}

      {/* Modals and Overlays */}
      <QuickAddModal />
      <ContextMenu />
      <DeleteConfirmationModal />
      <SelectionIndicator />
      {state.showBulkEditPanel && state.selectedNodes.length > 0 && (
        <BulkEditPanel onClose={() => actions.setShowBulkEditPanel(false)} />
      )}
      {!embedMode && <GuidedTour show={showTutorial} onClose={() => setShowTutorial(false)} />}
      <NewPersonModal />
      <ChildConnectionOptionsModal />
      <NetworkSearchModal />
      {state.searchModalOpen && (
        <PersonSearchModal onClose={() => actions.setSearchModalOpen(false)} />
      )}
      
      {/* Fixed positioned elements - hide some in embed mode */}
      {!embedMode && <HelpButton onShowTutorial={() => setShowTutorial(true)} />}
      {!embedMode && <Feedback />}
      
      {/* Add embed save button */}
      {embedMode && (
        <EmbedSaveToolbar />
      )}
    </div>
  );
};

// Main component that provides the context
const ModernGenogramApp = () => {
  return (
    <GenogramProvider>
      <HybridInterfaceWrapper>
        <GenogramAppContent />
      </HybridInterfaceWrapper>
      <QuickEditModal />  
    </GenogramProvider>
  );
};

export default ModernGenogramApp;