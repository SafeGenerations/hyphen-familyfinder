// Enhanced export functionality for embedded mode
// Supports both direct downloads and postMessage communication

import { trackEvent } from './analytics';
import { getGlobalGenogramState } from './embedIntegration';
import { convertForeignObjects } from './fileIO';

// Advanced state-based bounds calculation (same as non-embedded version)
function computeBounds(genogramData) {
  // Calculate bounds based on actual object positions (same as computeStateBounds from useFileOperations)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let hasObjects = false;

  // Include all people with proper size calculation
  if (genogramData.people && Array.isArray(genogramData.people)) {
    genogramData.people.forEach(person => {
      if (person && typeof person.x === 'number' && typeof person.y === 'number' && isFinite(person.x) && isFinite(person.y)) {
        hasObjects = true;
        const personSize = 60; // Default person size
        minX = Math.min(minX, person.x);
        maxX = Math.max(maxX, person.x + personSize);
        minY = Math.min(minY, person.y);
        maxY = Math.max(maxY, person.y + personSize);
      }
    });
  }

  // Include all text boxes with proper dimensions
  if (genogramData.textBoxes && Array.isArray(genogramData.textBoxes)) {
    genogramData.textBoxes.forEach(textBox => {
      if (textBox && typeof textBox.x === 'number' && typeof textBox.y === 'number' && isFinite(textBox.x) && isFinite(textBox.y)) {
        hasObjects = true;
        const width = textBox.width || 150;
        const height = textBox.height || 50;
        minX = Math.min(minX, textBox.x);
        maxX = Math.max(maxX, textBox.x + width);
        minY = Math.min(minY, textBox.y);
        maxY = Math.max(maxY, textBox.y + height);
      }
    });
  }

  // Include all households with proper point calculation
  if (genogramData.households && Array.isArray(genogramData.households)) {
    genogramData.households.forEach(household => {
      if (household && household.points && Array.isArray(household.points) && household.points.length > 0) {
        hasObjects = true;
        household.points.forEach(point => {
          if (point && typeof point.x === 'number' && typeof point.y === 'number' && isFinite(point.x) && isFinite(point.y)) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }
        });
      }
    });
  }

  // Include relationships to account for their visual bounds (enhanced calculation)
  if (genogramData.relationships && Array.isArray(genogramData.relationships)) {
    genogramData.relationships.forEach(relationship => {
      if (relationship && relationship.from && relationship.to) {
        // Find the connected people
        const person1 = genogramData.people?.find(p => p.id === relationship.from);
        const person2 = genogramData.people?.find(p => p.id === relationship.to);
        
        if (person1 && person2 && 
            typeof person1.x === 'number' && typeof person1.y === 'number' && 
            typeof person2.x === 'number' && typeof person2.y === 'number' &&
            isFinite(person1.x) && isFinite(person1.y) && 
            isFinite(person2.x) && isFinite(person2.y)) {
          
          hasObjects = true;
          
          // For child relationships, account for the drop point
          if (relationship.type === 'child') {
            const parentRel = genogramData.relationships?.find(r => r.id === relationship.from);
            if (parentRel) {
              const p1 = genogramData.people?.find(p => p.id === parentRel.from);
              const p2 = genogramData.people?.find(p => p.id === parentRel.to);
              if (p1 && p2) {
                const bubble = parentRel.bubblePosition || 0.5;
                const midX = p1.x + (p2.x - p1.x) * bubble;
                const midY = p1.y + (p2.y - p1.y) * bubble;
                const dropY = midY + 60;
                
                // Include the drop point in bounds calculation
                minX = Math.min(minX, midX);
                maxX = Math.max(maxX, midX);
                minY = Math.min(minY, midY);
                maxY = Math.max(maxY, dropY);
              }
            }
          }
          
          // For regular relationships, include both people's positions
          minX = Math.min(minX, person1.x, person2.x);
          maxX = Math.max(maxX, person1.x + 60, person2.x + 60); // Add person size
          minY = Math.min(minY, person1.y, person2.y);
          maxY = Math.max(maxY, person1.y + 60, person2.y + 60); // Add person size
        }
      }
    });
  }

  // If no objects, return default bounds
  if (!hasObjects) {
    console.log('No valid objects found, using default bounds');
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  const width = maxX - minX;
  const height = maxY - minY;

  // Validate bounds and return fallback if invalid
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
    console.warn('Invalid bounds calculated, using default bounds:', { minX, minY, width, height });
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  // Ensure minimum size
  const minSize = 100;
  const finalWidth = Math.max(width, minSize);
  const finalHeight = Math.max(height, minSize);

  console.log('Computed bounds:', { x: minX, y: minY, width: finalWidth, height: finalHeight });
  return { x: minX, y: minY, width: finalWidth, height: finalHeight };
}

// Check if we're in embedded mode
export const isEmbeddedMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('embed') === 'true' || window.self !== window.top;
};

// Helper function to trigger direct download from iframe
function downloadFile(content, filename, mimeType) {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    trackEvent('embed_direct_download', 'export', mimeType);
    return true;
  } catch (error) {
    console.error('Direct download failed:', error);
    trackEvent('embed_direct_download_error', 'export', error.message);
    return false;
  }
}

/* eslint-disable-next-line no-unused-vars */
// Get genogram data from context or global state
function getGenogramData() {
  // Try to get from global function first
  const globalState = getGlobalGenogramState();
  if (globalState && (globalState.people || globalState.relationships || globalState.households || globalState.textBoxes)) {
    return {
      people: globalState.people || [],
      relationships: globalState.relationships || [],
      households: globalState.households || [],
      textBoxes: globalState.textBoxes || [],
      fileName: globalState.fileName || 'genogram',
      version: '2.0'
    };
  }
  
  // Try to get from embed integration directly
  const embedInstance = window.__embedIntegration;
  if (embedInstance?.genogramState) {
    const state = embedInstance.genogramState;
    // Ensure we have valid data
    if (state && (state.people || state.relationships || state.households || state.textBoxes)) {
      return {
        people: state.people || [],
        relationships: state.relationships || [],
        households: state.households || [],
        textBoxes: state.textBoxes || [],
        fileName: state.fileName || 'genogram',
        version: '2.0'
      };
    }
  }
  
  // Try to get from React context directly if embed integration isn't working
  try {
    // Look for React context in the DOM
    const reactRoot = document.querySelector('#root') || document.querySelector('[data-reactroot]');
    if (reactRoot && reactRoot._reactInternalInstance) {
      // This is a more direct approach to get React state
      console.log('Attempting to access React state directly');
    }
  } catch (error) {
    console.warn('Could not access React state directly:', error);
  }
  
  // Fallback to window.genogramData if available
  if (window.genogramData) {
    return window.genogramData;
  }
  
  // Last resort - try to extract data from the DOM
  try {
    const people = [];
    const relationships = [];
    const households = [];
    const textBoxes = [];
    
    // Try to extract people from DOM
    const personElements = document.querySelectorAll('[data-person-id]');
    personElements.forEach(el => {
      const personId = el.getAttribute('data-person-id');
      const transform = el.getAttribute('transform');
      if (transform) {
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          people.push({
            id: personId,
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
            name: el.querySelector('text')?.textContent || 'Unknown'
          });
        }
      }
    });
    
    // Try to extract text boxes from DOM
    const textBoxElements = document.querySelectorAll('[data-textbox-id]');
    textBoxElements.forEach(el => {
      const textBoxId = el.getAttribute('data-textbox-id');
      const transform = el.getAttribute('transform');
      if (transform) {
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          textBoxes.push({
            id: textBoxId,
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
            width: 150,
            height: 50
          });
        }
      }
    });
    
    if (people.length > 0 || textBoxes.length > 0) {
      console.log('Extracted data from DOM:', { people, textBoxes });
      return {
        people,
        relationships,
        households,
        textBoxes,
        fileName: 'genogram',
        version: '2.0'
      };
    }
  } catch (error) {
    console.warn('Could not extract data from DOM:', error);
  }
  
  // Final fallback - return empty data
  console.warn('No genogram data found, using empty fallback');
  return {
    people: [],
    relationships: [],
    households: [],
    textBoxes: [],
    fileName: 'genogram'
  };
}

// Export as SVG with both download and postMessage
export async function exportAsSVG(options = {}) {
  try {
    // Get the SVG element
    const canvasElement = document.querySelector('#genogram-canvas svg');
    const svgElement = canvasElement || document.querySelector('svg');
    
    if (!svgElement) {
      console.error('No SVG element found');
      return false;
    }
    
    const genogramData = getGenogramData();
    const filename = `${genogramData.fileName || 'genogram'}.svg`;
    
    // Calculate bounds based on actual content using sophisticated state-based calculation
    const bounds = computeBounds(genogramData);
    const padding = 30;
    
    // Create a clean SVG with proper bounds
    const svgClone = svgElement.cloneNode(true);
    
    // Remove any UI-specific styles (same as non-embedded version)
    svgClone.style.cursor = '';
    svgClone.removeAttribute('width');
    svgClone.removeAttribute('height');
    
    // Convert text boxes for safe export
    convertForeignObjects(svgClone);
    
    // Get the main group that contains all the genogram content
    const mainGroup = svgClone.querySelector('g[transform]');
    
    // Remove transform from main group to prevent pan/zoom affecting export
    if (mainGroup) {
      mainGroup.removeAttribute('transform');
    }
    
    // Remove UI-specific elements
    const selectorsToRemove = [
      '[data-grid-background]',
      '[data-ui-element]',
      '.selection-handle',
      '.resize-handle',
      '.grid-background',
      '.grid-line',
      'pattern[id*="grid"]',
      '[style*="cursor: pointer"]' // Remove interactive cursor styles
    ];
    
    selectorsToRemove.forEach(selector => {
      const elements = svgClone.querySelectorAll(selector);
      elements.forEach(el => {
        if (selector.includes('cursor')) {
          el.style.cursor = '';
        } else {
          el.remove();
        }
      });
    });
    
    // Set viewBox based on calculated bounds
    const viewBoxX = bounds.x - padding;
    const viewBoxY = bounds.y - padding;
    const viewBoxWidth = bounds.width + (padding * 2);
    const viewBoxHeight = bounds.height + (padding * 2);
    
    svgClone.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
    svgClone.setAttribute('width', viewBoxWidth);
    svgClone.setAttribute('height', viewBoxHeight);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    
    // Export using internal function
    return await exportAsSVG_internal(svgString, genogramData, filename, viewBoxWidth, viewBoxHeight, options);
  } catch (error) {
    console.error('SVG export failed:', error);
    trackEvent('embed_export_error', 'export', `svg:${error.message}`);
    return false;
  }
}

// Internal function to handle the actual export
async function exportAsSVG_internal(svgString, genogramData, filename, width, height, options = {}) {
  const { directDownload = true, sendToParent = true } = options;
  
  // mark as used when conditionally wired at runtime
  void directDownload; void sendToParent;
  
  try {
    
    // Try direct download if enabled
    if (directDownload && isEmbeddedMode()) {
      const success = downloadFile(svgString, filename, 'image/svg+xml;charset=utf-8');
      if (!success) {
        console.warn('Direct download failed, will try postMessage');
      }
    }
    
    // Send to parent if enabled
    if (sendToParent && window.parent !== window) {
      window.parent.postMessage({
        type: 'GENOGRAM_EXPORT',
        format: 'svg',
        data: genogramData,
        content: svgString,
        filename: filename,
        width: width,
        height: height
      }, '*');
    }
    
    return true;
  } catch (error) {
    console.error('SVG export internal failed:', error);
    trackEvent('embed_export_error', 'export', `svg:${error.message}`);
    return false;
  }
}

// Export as PNG with both download and postMessage
export async function exportAsPNG(options = {}) {
  const { directDownload = true, sendToParent = true, scale = 2 } = options;
  
  try {
    const canvasElement = document.querySelector('#genogram-canvas svg');
    const svgElement = canvasElement || document.querySelector('svg');
    
    if (!svgElement) {
      console.error('No SVG element found');
      return false;
    }
    
    const genogramData = getGenogramData();
    const filename = `${genogramData.fileName || 'genogram'}.png`;
    
    // Calculate bounds based on actual content using sophisticated state-based calculation
    const bounds = computeBounds(genogramData);
    const padding = 30;
    
    // Create a clean SVG with proper bounds
    const svgClone = svgElement.cloneNode(true);
    
    // Remove any UI-specific styles (same as non-embedded version)
    svgClone.style.cursor = '';
    svgClone.removeAttribute('width');
    svgClone.removeAttribute('height');
    
    // Convert text boxes for safe export
    convertForeignObjects(svgClone);
    
    // Get the main group that contains all the genogram content
    const mainGroup = svgClone.querySelector('g[transform]');
    
    // Remove transform from main group to prevent pan/zoom affecting export
    if (mainGroup) {
      mainGroup.removeAttribute('transform');
    }
    
    // Remove UI-specific elements
    const selectorsToRemove = [
      '[data-grid-background]',
      '[data-ui-element]',
      '.selection-handle',
      '.resize-handle',
      '.grid-background',
      '.grid-line',
      'pattern[id*="grid"]',
      '[style*="cursor: pointer"]' // Remove interactive cursor styles
    ];
    
    selectorsToRemove.forEach(selector => {
      const elements = svgClone.querySelectorAll(selector);
      elements.forEach(el => {
        if (selector.includes('cursor')) {
          el.style.cursor = '';
        } else {
          el.remove();
        }
      });
    });
    
    // Set viewBox based on calculated bounds
    const viewBoxX = bounds.x - padding;
    const viewBoxY = bounds.y - padding;
    const viewBoxWidth = bounds.width + (padding * 2);
    const viewBoxHeight = bounds.height + (padding * 2);
    
    svgClone.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
    svgClone.setAttribute('width', viewBoxWidth);
    svgClone.setAttribute('height', viewBoxHeight);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    
    // Create canvas and convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with scaling
    canvas.width = viewBoxWidth * scale;
    canvas.height = viewBoxHeight * scale;
    
    // Scale context
    ctx.scale(scale, scale);
    
    // Convert to PNG
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, viewBoxWidth, viewBoxHeight);
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error('Failed to create PNG blob');
            resolve(false);
            return;
          }
          
          // Export using internal function
          const success = await exportAsPNG_internal(blob, genogramData, filename, canvas.width, canvas.height, options);
          resolve(success);
        }, 'image/png', 0.95);
      };
      
      img.onerror = () => {
        console.error('Failed to load SVG for PNG conversion');
        resolve(false);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    });
    
  } catch (error) {
    console.error('PNG export failed:', error);
    trackEvent('embed_export_error', 'export', `png:${error.message}`);
    return false;
  }
}

// Internal function to handle the actual export for PNG
async function exportAsPNG_internal(blob, genogramData, filename, width, height, options = {}) {
  const { directDownload = true, sendToParent = true } = options;
  
  // mark as used when conditionally wired at runtime
  void directDownload; void sendToParent;
  
  try {
    // Try direct download if enabled
    if (directDownload && isEmbeddedMode()) {
      const reader = new FileReader();
      reader.onloadend = function() {
        const base64 = reader.result.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        downloadFile(bytes, filename, 'image/png');
      };
      reader.readAsDataURL(blob);
    }
    
    // Send to parent if enabled
    if (sendToParent && window.parent !== window) {
      const reader = new FileReader();
      reader.onloadend = function() {
        window.parent.postMessage({
          type: 'GENOGRAM_EXPORT',
          format: 'png',
          data: genogramData,
          dataUrl: reader.result,
          filename: filename,
          width: width,
          height: height
        }, '*');
      };
      reader.readAsDataURL(blob);
    }
    
    return true;
  } catch (error) {
    console.error('PNG export internal failed:', error);
    trackEvent('embed_export_error', 'export', `png:${error.message}`);
    return false;
  }
}

// Export as JSON (data only)
export async function exportAsJSON(options = {}) {
  const { directDownload = true, sendToParent = true, pretty = true } = options;
  
  try {
    const genogramData = getGenogramData();
    const exportData = {
      ...genogramData,
      metadata: {
        exportDate: new Date().toISOString(),
        version: genogramData.version || '2.0',
        exportedFrom: 'embedded-genogram-builder'
      }
    };
    
    const jsonString = pretty 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
    
    const filename = `${genogramData.fileName || 'genogram'}-data.json`;
    
    // Try direct download if enabled
    if (directDownload && isEmbeddedMode()) {
      const success = downloadFile(jsonString, filename, 'application/json');
      if (!success) {
        console.warn('Direct download failed, will try postMessage');
      }
    }
    
    // Send to parent if enabled
    if (sendToParent && window.parent !== window) {
      window.parent.postMessage({
        type: 'GENOGRAM_EXPORT',
        format: 'json',
        data: exportData,
        content: jsonString,
        filename: filename
      }, '*');
    }
    
    trackEvent('embed_export', 'export', 'json');
    return true;
  } catch (error) {
    console.error('JSON export failed:', error);
    trackEvent('embed_export_error', 'export', `json:${error.message}`);
    return false;
  }
}

// Export as .geno file (proprietary format)
export async function exportAsGeno(options = {}) {
  const { directDownload = true, sendToParent = true } = options;
  
  try {
    const genogramData = getGenogramData();
    const exportData = {
      ...genogramData,
      savedAt: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `${genogramData.fileName || 'genogram'}.geno`;
    
    // Try direct download if enabled
    if (directDownload && isEmbeddedMode()) {
      const success = downloadFile(jsonString, filename, 'application/json');
      if (!success) {
        console.warn('Direct download failed, will try postMessage');
      }
    }
    
    // Send to parent if enabled
    if (sendToParent && window.parent !== window) {
      window.parent.postMessage({
        type: 'GENOGRAM_EXPORT',
        format: 'geno',
        data: exportData,
        content: jsonString,
        filename: filename
      }, '*');
    }
    
    trackEvent('embed_export', 'export', 'geno');
    return true;
  } catch (error) {
    console.error('Geno export failed:', error);
    trackEvent('embed_export_error', 'export', `geno:${error.message}`);
    return false;
  }
}

// Setup function to initialize embedded export handlers
export function setupEmbeddedExportHandlers() {
  if (!isEmbeddedMode()) {
    console.log('Not in embedded mode, skipping enhanced export setup');
    return;
  }
  
  console.log('Setting up enhanced embedded export handlers');
  
  // Make functions globally available for easy access
  window.embedExport = {
    svg: exportAsSVG,
    png: exportAsPNG,
    json: exportAsJSON,
    geno: exportAsGeno,
    isEmbedded: isEmbeddedMode
  };
  
  // Intercept export button clicks
  document.addEventListener('click', async function(e) {
    // Check if we're clicking on an export-related button
    const target = e.target.closest('button');
    if (!target) return;
    
    const text = target.textContent?.toLowerCase() || '';
    const title = target.title?.toLowerCase() || '';
    const combined = text + ' ' + title;
    
    // Only intercept in embedded mode
    if (!isEmbeddedMode()) return;
    
    // Check for export-related keywords
    if (combined.includes('export') || combined.includes('download')) {
      console.log('Intercepted export click:', combined);
      
      if (combined.includes('svg')) {
        e.preventDefault();
        e.stopPropagation();
        await exportAsSVG();
      } else if (combined.includes('png') || combined.includes('image')) {
        e.preventDefault();
        e.stopPropagation();
        await exportAsPNG();
      } else if (combined.includes('json') || combined.includes('data')) {
        e.preventDefault();
        e.stopPropagation();
        await exportAsJSON();
      } else if (combined.includes('save') || combined.includes('geno')) {
        // For save operations, we might want different behavior
        // Let the normal save flow continue but also offer download
        setTimeout(() => exportAsGeno({ sendToParent: false }), 100);
      }
    }
  }, true); // Use capture phase to intercept before React handlers
  
  // Listen for export requests from parent
  window.addEventListener('message', async function(e) {
    if (e.data.type === 'REQUEST_EXPORT') {
      const format = e.data.format || 'svg';
      const options = { 
        directDownload: false, 
        sendToParent: true,
        ...e.data.options 
      };
      
      switch (format.toLowerCase()) {
        case 'svg':
          await exportAsSVG(options);
          break;
        case 'png':
          await exportAsPNG(options);
          break;
        case 'json':
          await exportAsJSON(options);
          break;
        case 'geno':
          await exportAsGeno(options);
          break;
        default:
          console.error('Unknown export format:', format);
      }
    }
  });
}

// Auto-initialize if document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEmbeddedExportHandlers);
} else {
  setupEmbeddedExportHandlers();
}