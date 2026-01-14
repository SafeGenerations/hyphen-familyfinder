// src/utils/embedIntegration.js
import { trackEvent } from './analytics';
import { setupEmbeddedExportHandlers } from './embedExportEnhanced';
import { convertForeignObjects } from './fileIO';

export class EmbedIntegration {
  constructor(genogramContext) {
    this.context = genogramContext;
    this.isEmbedded = this.detectEmbedMode();
    this.parentOrigin = '*'; // Will be set to specific origin in production
    this.allowedOrigins = this.getAllowedOrigins();
    
    // Make instance globally available for enhanced export
    window.__embedIntegration = this;
    
    if (this.isEmbedded) {
      this.setupMessageHandlers();
      this.notifyParentReady();
      
      // Setup enhanced export handlers and such
      setupEmbeddedExportHandlers();
    }
  }

  detectEmbedMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('embed') === 'true' || window.self !== window.top;
  }

  getAllowedOrigins() {
    // In production, replace with actual allowed origins
    const origins = process.env.REACT_APP_ALLOWED_EMBED_ORIGINS?.split(',') || [];
    return origins.length > 0 ? origins : ['*'];
  }
  
  get genogramState() {
    return this.context?.state || {};
  }

  // State-based bounds calculation (exact same logic as non-embedded computeStateBounds)
  computeBounds(genogramData) {
    try {
      // Calculate bounds based on actual object positions (same as fitToCanvas)
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let hasObjects = false;

      // Include all people
      if (genogramData.people && Array.isArray(genogramData.people)) {
        genogramData.people.forEach(person => {
          hasObjects = true;
          const personSize = 60; // Default person size
          minX = Math.min(minX, person.x);
          maxX = Math.max(maxX, person.x + personSize);
          minY = Math.min(minY, person.y);
          maxY = Math.max(maxY, person.y + personSize);
        });
      }

      // Include all text boxes
      if (genogramData.textBoxes && Array.isArray(genogramData.textBoxes)) {
        genogramData.textBoxes.forEach(textBox => {
          hasObjects = true;
          minX = Math.min(minX, textBox.x);
          maxX = Math.max(maxX, textBox.x + (textBox.width || 150));
          minY = Math.min(minY, textBox.y);
          maxY = Math.max(maxY, textBox.y + (textBox.height || 50));
        });
      }

      // Include all households
      if (genogramData.households && Array.isArray(genogramData.households)) {
        genogramData.households.forEach(household => {
          if (household.points && household.points.length > 0) {
            hasObjects = true;
            household.points.forEach(point => {
              minX = Math.min(minX, point.x);
              maxX = Math.max(maxX, point.x);
              minY = Math.min(minY, point.y);
              maxY = Math.max(maxY, point.y);
            });
          }
        });
      }

      // If no objects, return default bounds
      if (!hasObjects) {
        console.log('No valid objects found in embedded bounds calculation, using default bounds');
        return { x: 0, y: 0, width: 800, height: 600 };
      }

      const width = maxX - minX;
      const height = maxY - minY;

      // Validate bounds and return fallback if invalid
      if (!isFinite(minX) || !isFinite(minY) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
        console.warn('Invalid bounds calculated in embedded integration, using default bounds:', { minX, minY, width, height });
        return { x: 0, y: 0, width: 800, height: 600 };
      }

      console.log('Embedded bounds calculated:', { x: minX, y: minY, width, height });
      return { x: minX, y: minY, width, height };
    } catch (error) {
      console.error('Error calculating bounds in embedded integration:', error);
      return { x: 0, y: 0, width: 800, height: 600 };
    }
  }

  setupMessageHandlers() {
    window.addEventListener('message', (event) => {
      // Security check
      if (this.allowedOrigins[0] !== '*' && !this.allowedOrigins.includes(event.origin)) {
        console.warn('Rejected message from unauthorized origin:', event.origin);
        return;
      }

      this.handleMessage(event);
    });

    // Add keyboard shortcuts for embedded mode
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              // Shift+Ctrl+S = Enhanced save with local copy
              this.saveWithLocalCopy();
            } else {
              // Ctrl+S = Basic save to parent
              this.saveToParent();
            }
            break;
          case 'Enter':
            if (e.shiftKey) {
              e.preventDefault();
              this.saveAndClose();
            }
            break;
          default:
            break;
        }
      }
    });
  }

  handleMessage(event) {
    const { type, data } = event.data || {};
    const { state, actions } = this.context;

    switch (type) {
      case 'LOAD_GENOGRAM':
        if (data && this.validateGenogramData(data)) {
          actions.loadData(data);
          
          // Auto-fit to canvas after loading data in embed mode
          setTimeout(() => {
            // Get the canvas operations from the genogram context
            const canvasElement = document.getElementById('genogram-canvas');
            if (canvasElement && window.genogramCanvasOperations?.fitToCanvas) {
              window.genogramCanvasOperations.fitToCanvas();
            }
          }, 200);
          
          trackEvent('embed_load', 'integration', 'success');
        }
        break;

      case 'REQUEST_SAVE':
        this.saveToParent();
        break;
        
      case 'REQUEST_ENHANCED_SAVE':
        this.saveWithLocalCopy();
        break;

      case 'request-export':
        // Handle lowercase message type (Option 2 from requirements)
        if (data && data.format === 'svg') {
          console.log('📤 Parent requested SVG export via request-export');
          this.exportSVGWithData();
        }
        break;

      case 'REQUEST_EXPORT_SVG':
        this.exportSVGToParent();
        break;

      case 'REQUEST_EXPORT_PNG':
        this.exportPNGToParent();
        break;

      case 'SET_THEME':
        if (data.theme) {
          this.applyTheme(data.theme);
        }
        break;

      case 'FOCUS_PERSON':
        if (data.personId) {
          const person = state.people.find(p => p.id === data.personId);
          if (person) {
            actions.selectPerson(person);
            this.centerOnPerson(person);
          }
        }
        break;

      case 'ADD_PERSON':
        if (data.person) {
          actions.addPerson(data.person);
        }
        break;

      case 'UPDATE_SETTINGS':
        if (data.settings) {
          this.updateSettings(data.settings);
        }
        break;

      default:
        break;
    }
  }

  validateGenogramData(data) {
    // Basic validation
    return (
      data &&
      Array.isArray(data.people) &&
      Array.isArray(data.relationships) &&
      (!data.households || Array.isArray(data.households)) &&
      (!data.textBoxes || Array.isArray(data.textBoxes))
    );
  }

  notifyParentReady() {
    window.parent.postMessage({
      type: 'GENOGRAM_READY',
      version: '2.0',
      features: [
        'save',
        'export-svg',
        'export-png',
        'real-time-updates',
        'keyboard-shortcuts'
      ]
    }, this.parentOrigin);
  }

  // Get clean SVG with proper bounds (exact same logic as non-embedded version)
  getCleanSVG(data, transparent = false) {
    try {
      // Find the genogram canvas SVG specifically
      const canvasElement = document.querySelector('#genogram-canvas svg');
      const svgElement = canvasElement || document.querySelector('svg');
      
      if (!svgElement) {
        console.error('No SVG element found');
        return null;
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);
      
      // Remove any UI-specific styles
      svgClone.style.cursor = '';
      svgClone.removeAttribute('width');
      svgClone.removeAttribute('height');
      
      // Convert text boxes for safe export
      convertForeignObjects(svgClone);
      
      // Get the main group that contains all the genogram content
      const mainGroup = svgClone.querySelector('g[transform]');

      if (!mainGroup) {
        console.error('No main group with transform found in SVG');
        return null;
      }

      // Remove transform from main group to prevent pan/zoom affecting export
      // This is critical for accurate bounds calculation and proper SVG export
      mainGroup.removeAttribute('transform');

      // Use state bounds for accurate content-only export
      let bbox = this.computeBounds(data);

      // Ensure we have valid bounds
      if (!bbox || !isFinite(bbox.x) || !isFinite(bbox.y) || bbox.width <= 0 || bbox.height <= 0) {
        console.error('Invalid bounds:', bbox);
        bbox = { x: 0, y: 0, width: 800, height: 600 };
      }

      // Add reasonable padding to ensure nothing is cut off
      const padding = 30;
      const contentMinX = bbox.x - padding;
      const contentMinY = bbox.y - padding;
      const contentWidth = bbox.width + (padding * 2);
      const contentHeight = bbox.height + (padding * 2);

      // Create a new SVG for export
      const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      exportSvg.setAttribute('viewBox', `${contentMinX} ${contentMinY} ${contentWidth} ${contentHeight}`);
      exportSvg.setAttribute('width', contentWidth);
      exportSvg.setAttribute('height', contentHeight);
      exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      exportSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      // Only add white background if not transparent
      if (!transparent) {
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', contentMinX);
        bg.setAttribute('y', contentMinY);
        bg.setAttribute('width', contentWidth);
        bg.setAttribute('height', contentHeight);
        bg.setAttribute('fill', 'white');
        exportSvg.appendChild(bg);
      }

      // Copy all content from the original group without any transforms
      const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Copy children from the main group
      Array.from(mainGroup.children).forEach(child => {
        if (child.nodeType === 1) { // Element node
          // Skip grid background and UI elements - also skip entire grid group
          if (child.getAttribute('data-grid-background') || 
              child.getAttribute('data-ui-element') ||
              child.classList?.contains('selection-handle') ||
              child.classList?.contains('resize-handle') ||
              child.classList?.contains('grid-background') ||
              child.classList?.contains('grid-line') ||
              // Skip the entire grid group (contains defs and rect)
              (child.tagName === 'g' && child.style.pointerEvents === 'none' && 
               child.querySelector('.grid-background'))) {
            return;
          }
          
          const clonedChild = child.cloneNode(true);
          contentGroup.appendChild(clonedChild);
        }
      });
      
      exportSvg.appendChild(contentGroup);

      // Clean up any remaining UI elements
      const selectorsToRemove = [
        '[data-grid-background]',
        '[data-ui-element]',
        '.selection-handle',
        '.resize-handle',
        '.grid-background',
        '.grid-line',
        'pattern[id*="grid"]',
        '[style*="cursor: pointer"]'
      ];
      
      selectorsToRemove.forEach(selector => {
        const elements = exportSvg.querySelectorAll(selector);
        elements.forEach(el => {
          if (selector.includes('cursor')) {
            el.style.cursor = '';
          } else {
            el.remove();
          }
        });
      });

      return {
        svg: exportSvg,
        width: contentWidth,
        height: contentHeight
      };
    } catch (error) {
      console.error('Error creating clean SVG:', error);
      return null;
    }
  }

  async saveToParent() {
    const { state } = this.context;
    const data = {
      people: state.people,
      relationships: state.relationships,
      households: state.households,
      textBoxes: state.textBoxes,
      fileName: state.fileName,
      version: '2.0',
      savedAt: new Date().toISOString()
    };

    try {
      const cleanSVG = this.getCleanSVG(data, false); // White background for save
      if (!cleanSVG) {
        console.error('Failed to generate clean SVG for save');
        // Still send the save message without SVG as fallback
        window.parent.postMessage({
          type: 'GENOGRAM_SAVE',
          data: data,
          isDirty: state.isDirty
        }, this.parentOrigin);
        return;
      }

      const svgString = new XMLSerializer().serializeToString(cleanSVG.svg);

      // Send the save message WITH the SVG
      window.parent.postMessage({
        type: 'GENOGRAM_SAVE',
        data: data,
        svg: svgString,
        isDirty: state.isDirty || false
      }, this.parentOrigin);

      trackEvent('embed_save', 'integration', 'success_with_svg');
    } catch (error) {
      console.error('Error generating SVG for save:', error);
      // Fallback: send without SVG
      window.parent.postMessage({
        type: 'GENOGRAM_SAVE',
        data: data,
        isDirty: state.isDirty
      }, this.parentOrigin);
      trackEvent('embed_save', 'integration', 'success_without_svg');
    }
  }

  // Enhanced save with local download option
  async saveWithLocalCopy() {
    const { state } = this.context;
    const data = {
      people: state.people,
      relationships: state.relationships,
      households: state.households,
      textBoxes: state.textBoxes,
      fileName: state.fileName,
      version: '2.0',
      savedAt: new Date().toISOString()
    };

    try {
      // 1. Save to parent (existing functionality)
      await this.saveToParent();
      
      // 2. Copy to clipboard (embedded-safe version)
      await this.copyToClipboardEmbedded();
      
      // 3. Offer local download
      await this.downloadLocalGeno(data);
      
      // Show success notification
      this.showNotification('✅ Saved! Data sent to parent app, copied to clipboard, and downloaded locally.', 'success');
      
      trackEvent('embed_save_enhanced', 'integration', 'complete');
    } catch (error) {
      console.error('Enhanced save failed:', error);
      trackEvent('embed_save_enhanced', 'integration', `error:${error.message}`);
      // Fallback to basic save
      await this.saveToParent();
      this.showNotification('⚠️ Saved to parent app, but local features unavailable.', 'warning');
    }
  }

  // Embed-safe clipboard copy using text/plain with genogram data
  async copyToClipboardEmbedded() {
    try {
      const { state } = this.context;
      const data = {
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes,
        fileName: state.fileName,
        version: '2.0',
        savedAt: new Date().toISOString()
      };

      // Try to copy SVG data as text (works better in embedded mode)
      const cleanSVG = this.getCleanSVG(data, false);
      if (cleanSVG) {
        const svgString = new XMLSerializer().serializeToString(cleanSVG.svg);
        
        // Use the older document.execCommand approach which works better in iframes
        const textArea = document.createElement('textarea');
        textArea.value = svgString;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          const success = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (success) {
            console.log('✅ SVG copied to clipboard (embedded mode)');
            trackEvent('embed_clipboard_copy', 'integration', 'svg_success');
            return true;
          }
        } catch (err) {
          document.body.removeChild(textArea);
          console.log('execCommand failed, trying navigator.clipboard');
        }
      }

      // Fallback: try modern clipboard API with plain text
      if (navigator.clipboard && navigator.clipboard.writeText) {
        const dataString = JSON.stringify(data, null, 2);
        await navigator.clipboard.writeText(dataString);
        console.log('✅ Genogram data copied to clipboard as JSON');
        trackEvent('embed_clipboard_copy', 'integration', 'json_success');
        return true;
      }

      console.log('📋 Clipboard not available in embedded mode');
      return false;
    } catch (error) {
      console.error('Clipboard copy failed in embedded mode:', error);
      trackEvent('embed_clipboard_copy', 'integration', `error:${error.message}`);
      return false;
    }
  }

  // Download .geno file locally
  async downloadLocalGeno(data) {
    try {
      const fileName = `${data.fileName || 'genogram'}.geno`;
      const jsonString = JSON.stringify(data, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Local .geno file downloaded:', fileName);
      trackEvent('embed_local_download', 'integration', 'geno_success');
      return true;
    } catch (error) {
      console.error('Local download failed:', error);
      trackEvent('embed_local_download', 'integration', `error:${error.message}`);
      return false;
    }
  }

  // Show user notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `embed-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }

  saveAndClose() {
    this.saveToParent();
    window.parent.postMessage({
      type: 'GENOGRAM_CLOSE_REQUESTED'
    }, this.parentOrigin);
  }

  async exportSVGWithData() {
    try {
      // Use consistent data source - same as saveToParent
      const { state } = this.context;
      const data = {
        people: state.people || [],
        relationships: state.relationships || [],
        households: state.households || [],
        textBoxes: state.textBoxes || [],
        fileName: state.fileName || 'Untitled Genogram',
        fileVersion: state.fileVersion || '',
        fileDate: new Date().toISOString()
      };

      const cleanSVG = this.getCleanSVG(data, true); // Transparent background for SVG export
      if (!cleanSVG) {
        console.error('Failed to generate clean SVG for export');
        return;
      }

      const svgString = new XMLSerializer().serializeToString(cleanSVG.svg);

      // Send GENOGRAM_EXPORT_SVG message as specified in Option 2
      window.parent.postMessage({
        type: 'GENOGRAM_EXPORT_SVG',
        data: data,
        svg: svgString,
        width: '100%',
        height: '100%'
      }, this.parentOrigin);
      
      trackEvent('embed_export', 'integration', 'svg_with_data');
    } catch (error) {
      console.error('Failed to export SVG with data:', error);
      trackEvent('embed_export_error', 'integration', `svg_with_data:${error.message}`);
    }
  }

  async exportSVGToParent() {
    try {
      // Use consistent data source - same as saveToParent
      const { state } = this.context;
      const data = {
        people: state.people || [],
        relationships: state.relationships || [],
        households: state.households || [],
        textBoxes: state.textBoxes || [],
        fileName: state.fileName || 'genogram',
        version: '2.0',
        savedAt: new Date().toISOString()
      };
      
      const cleanSVG = this.getCleanSVG(data, true); // Transparent background for SVG export
      if (!cleanSVG) {
        console.error('Failed to generate clean SVG for export');
        return;
      }

      const svgString = new XMLSerializer().serializeToString(cleanSVG.svg);
      
      window.parent.postMessage({
        type: 'GENOGRAM_EXPORT_SVG',
        svg: svgString,
        width: cleanSVG.width,
        height: cleanSVG.height,
        data: data
      }, this.parentOrigin);
      
      trackEvent('embed_export', 'integration', 'svg');
    } catch (error) {
      console.error('Failed to export SVG:', error);
      trackEvent('embed_export_error', 'integration', `svg:${error.message}`);
    }
  }

  async exportPNGToParent() {
    try {
      // Use consistent data source - same as saveToParent
      const { state } = this.context;
      const data = {
        people: state.people || [],
        relationships: state.relationships || [],
        households: state.households || [],
        textBoxes: state.textBoxes || [],
        fileName: state.fileName || 'genogram',
        version: '2.0',
        savedAt: new Date().toISOString()
      };

      const cleanSVG = this.getCleanSVG(data, true); // Transparent background for PNG export
      if (!cleanSVG) {
        console.error('Failed to generate clean SVG for PNG export');
        return;
      }

      const svgString = new XMLSerializer().serializeToString(cleanSVG.svg);

      // Convert the cleaned SVG to PNG using the properly calculated bounds
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; // High quality
        canvas.width = cleanSVG.width * scale;
        canvas.height = cleanSVG.height * scale;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, cleanSVG.width, cleanSVG.height);
        
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            window.parent.postMessage({
              type: 'GENOGRAM_EXPORT_PNG',
              dataUrl: reader.result,
              width: canvas.width,
              height: canvas.height,
              data: data
            }, this.parentOrigin);
          };
          reader.readAsDataURL(blob);
        }, 'image/png', 0.95);
      };
      
      img.onerror = (error) => {
        console.error('Failed to load SVG for PNG conversion:', error);
        trackEvent('embed_export_error', 'integration', `png:image_load_failed`);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      
      trackEvent('embed_export', 'integration', 'png');
    } catch (error) {
      console.error('Failed to export PNG:', error);
      trackEvent('embed_export_error', 'integration', `png:${error.message}`);
    }
  }

  centerOnPerson(person) {
    const { actions } = this.context;
    // Calculate pan to center the person
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    actions.setPan({
      x: viewportWidth / 2 - person.x,
      y: viewportHeight / 2 - person.y
    });
  }

  applyTheme(theme) {
    // Apply custom theme colors
    if (theme.background) {
      document.body.style.backgroundColor = theme.background;
    }
    if (theme.primary) {
      document.documentElement.style.setProperty('--primary-color', theme.primary);
    }
    if (theme.secondary) {
      document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    }
  }

  updateSettings(settings) {
    const { actions } = this.context;
    
    if (settings.snapToGrid !== undefined) {
      actions.toggleSnapToGrid();
    }
    if (settings.highlightNetwork !== undefined) {
      actions.toggleHighlightNetwork();
    }
  }

  // Send updates to parent when genogram changes
  notifyParentOfChange(changeType, data) {
    if (!this.isEmbedded) return;

    window.parent.postMessage({
      type: 'GENOGRAM_CHANGED',
      changeType,
      data,
      timestamp: new Date().toISOString()
    }, this.parentOrigin);
  }

  // Cleanup
  destroy() {
    // Remove event listeners if needed
  }
}

// Singleton instance
let embedInstance = null;

export const initializeEmbedIntegration = (genogramContext) => {
  if (!embedInstance) {
    embedInstance = new EmbedIntegration(genogramContext);
  }
  return embedInstance;
};

export const getEmbedInstance = () => embedInstance;

export const isEmbedded = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('embed') === 'true' || window.self !== window.top;
};

// Export function to get global genogram state for use by other modules
export const getGlobalGenogramState = () => {
  if (embedInstance && embedInstance.genogramState) {
    return embedInstance.genogramState;
  }
  
  // Fallback: try to get from window if embed instance isn't available
  if (window.__embedIntegration && window.__embedIntegration.genogramState) {
    return window.__embedIntegration.genogramState;
  }
  
  return null;
};