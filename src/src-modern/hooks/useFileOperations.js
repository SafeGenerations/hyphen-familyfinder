// src/src-modern/hooks/useFileOperations.js
import { useCallback } from 'react';
import { useGenogram } from '../contexts/GenogramContext';
import { useCanvasOperations } from './useCanvasOperations';
import { trackExport, trackSave, trackEvent, trackError } from '../../utils/analytics';
import { convertForeignObjects } from '../../utils/fileIO';
import { getEmbedInstance, isEmbedded } from '../../utils/embedIntegration';
import { NodeType } from '../constants/nodeTypes';

const VALID_NODE_TYPES = new Set(Object.values(NodeType));

const sanitizeRecordObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    if (entryValue === undefined) return acc;

    if (Array.isArray(entryValue)) {
      acc[key] = entryValue.map((item) =>
        item && typeof item === 'object' ? { ...item } : item
      );
    } else if (entryValue && typeof entryValue === 'object') {
      acc[key] = { ...entryValue };
    } else {
      acc[key] = entryValue;
    }

    return acc;
  }, {});
};

export const useFileOperations = () => {
  const { state, actions } = useGenogram();
  const { fitToCanvas } = useCanvasOperations();

  // Helper function to generate default filename
  const getDefaultFileName = useCallback(() => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const familyName = state.people.length > 0 ? state.people[0].name.split(' ').pop() : 'Family';
    return `${familyName}_Genogram_${dateStr}`;
  }, [state.people]);

  // Calculate bounds based on application state as fallback
  const computeStateBounds = useCallback(() => {
    // Calculate bounds based on actual object positions (same as fitToCanvas)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let hasObjects = false;

    // Include all people
    state.people.forEach(person => {
      hasObjects = true;
      const personSize = 60; // Default person size
      minX = Math.min(minX, person.x);
      maxX = Math.max(maxX, person.x + personSize);
      minY = Math.min(minY, person.y);
      maxY = Math.max(maxY, person.y + personSize);
    });

    // Include all text boxes
    state.textBoxes.forEach(textBox => {
      hasObjects = true;
      minX = Math.min(minX, textBox.x);
      maxX = Math.max(maxX, textBox.x + (textBox.width || 150));
      minY = Math.min(minY, textBox.y);
      maxY = Math.max(maxY, textBox.y + (textBox.height || 50));
    });

    // Include all households
    state.households.forEach(household => {
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

    // If no objects, return default bounds
    if (!hasObjects) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }

    const width = maxX - minX;
    const height = maxY - minY;

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }

    return { 
      x: minX, 
      y: minY, 
      width, 
      height 
    };
  }, [state.people, state.textBoxes, state.households]);

  // Get clean SVG with proper bounds - updated to support transparency
  const getCleanSVG = useCallback((transparent = false) => {
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

    // Use state bounds for accurate content-only export
    let bbox = computeStateBounds();

    // Ensure we have valid bounds
    if (!bbox || !isFinite(bbox.x) || !isFinite(bbox.y) || bbox.width <= 0 || bbox.height <= 0) {
      console.error('Invalid bounds:', bbox);
      bbox = { x: 0, y: 0, width: 800, height: 600 };
    }

    // Add reasonable padding to ensure nothing is cut off
    const padding = 30; // Reduced padding since bounds are now more accurate
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
      'pattern[id*="grid"]', // Remove grid patterns
      '[style*="cursor: pointer"]' // Remove interactive cursor styles
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
  }, [computeStateBounds]);

  // Convert SVG to Canvas for high quality rendering - updated to support transparency
  const svgToCanvas = useCallback(async (svgElement, width, height, scale = 2, transparent = false) => {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas with high DPI
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size with scaling for high DPI
        canvas.width = Math.ceil(width * scale);
        canvas.height = Math.ceil(height * scale);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // Clear canvas (transparent) or fill with white
        if (transparent) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Scale context for high DPI
        ctx.scale(scale, scale);

        // Convert SVG to string
        const svgString = new XMLSerializer().serializeToString(svgElement);
        console.log('SVG string length:', svgString.length);
        
        // Create image and load SVG
        const img = new Image();
        
        img.onload = () => {
          try {
            console.log('Image loaded, drawing to canvas');
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(img.src);
            resolve(canvas);
          } catch (error) {
            console.error('Error drawing image:', error);
            URL.revokeObjectURL(img.src);
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          console.error('Image load error:', error);
          URL.revokeObjectURL(img.src);
          reject(new Error('Failed to load SVG image'));
        };

        // Create blob URL
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      } catch (error) {
        console.error('Error in svgToCanvas:', error);
        reject(error);
      }
    });
  }, []);

  // Copy canvas to clipboard - keep with white background for better compatibility
  const copyCanvasToClipboard = useCallback(async () => {
    // Check if we're embedded
    if (isEmbedded()) {
      console.log('📋 Clipboard operation blocked in embedded mode');
      return false;
    }
    
    try {
      const cleanSVG = getCleanSVG(false); // White background for clipboard
      if (!cleanSVG) {
        console.error('No SVG content found');
        trackEvent('copy_to_clipboard', 'file_operations', 'no_content');
        return false;
      }

      const canvas = await svgToCanvas(cleanSVG.svg, cleanSVG.width, cleanSVG.height, 2, false);
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            trackEvent('copy_to_clipboard', 'file_operations', 'blob_failed');
            resolve(false);
            return;
          }

          try {
            // Use the modern Clipboard API if available
            if (navigator.clipboard && window.ClipboardItem) {
              const item = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              console.log('✅ Genogram copied to clipboard!');
              
              // Track successful copy
              trackEvent('copy_to_clipboard', 'file_operations', 'success');
              
              // Show user feedback
              const notification = document.createElement('div');
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              `;
              notification.textContent = '✅ Copied to clipboard!';
              document.body.appendChild(notification);
              
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 3000);
              
              resolve(true);
            } else {
              console.warn('Clipboard API not available');
              trackEvent('copy_to_clipboard', 'file_operations', 'api_unavailable');
              resolve(false);
            }
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            trackEvent('copy_to_clipboard', 'file_operations', `error:${err.message}`);
            resolve(false);
          }
        }, 'image/png', 0.95);
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      trackError(error.message, 'copy_to_clipboard');
      return false;
    }
  }, [getCleanSVG, svgToCanvas]);

  const handleSave = useCallback(async () => {
    // Flush any pending audit logs before saving
    if (actions.flushPendingAudits) {
      await actions.flushPendingAudits();
    }
    
    // Check if we're embedded
    const embedInstance = getEmbedInstance();
    if (isEmbedded() && embedInstance) {
      console.log('📤 Sending genogram data to parent window');
      await embedInstance.saveToParent();
      return true;
    }
    
    // Copy to clipboard BEFORE saving (only in non-embedded mode)
    if (!isEmbedded()) {
      await copyCanvasToClipboard();
    }
    
    // Generate filename
    const fileName = state.fileName === 'Untitled Genogram' 
      ? getDefaultFileName() 
      : state.fileName.replace(/\.[^/.]+$/, ''); // Strip any extension

    const data = {
      people: state.people,
      relationships: state.relationships,
      households: state.households,
      placements: state.placements || [],
      textBoxes: state.textBoxes,
      metadata: state.metadata || {},
      customAttributes: state.customAttributes || [],
      tagDefinitions: state.tagDefinitions || [],
      filterTemplates: state.filterTemplates || [],
      fileName: fileName,
      version: '2.0',
      savedAt: new Date().toISOString()
    };

    let jsonString = '';
    try {
      jsonString = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error('Failed to prepare data for saving:', err);
      trackError(err.message, 'save');
      alert('Save failed: ' + err.message);
      return false;
    }

    const jsonBlob = new Blob([jsonString], { type: 'application/json' });

    try {
      // Use File System Access API if available (Chrome, Edge)
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${fileName}.geno`,
          types: [
            {
              description: 'Genogram File',
              accept: { 'application/json': ['.geno'] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonBlob);
        await writable.close();
        
        // Update filename from what user actually saved
        actions.setFileName(handle.name);
        actions.setDirty(false);
        
        // Track successful save
        trackSave('manual');
        trackEvent('save_method', 'file_operations', 'file_system_api');
        
        return true;
      } else {
        // Fallback for browsers without File System Access API
        const filename = window.prompt('Enter file name', `${fileName}.geno`);
        if (filename === null) return false; // User cancelled

        const url = URL.createObjectURL(jsonBlob);
        try {
          const link = document.createElement('a');
          link.href = url;
          link.download = filename.endsWith('.geno') ? filename : `${filename}.geno`;
          link.click();
        } finally {
          URL.revokeObjectURL(url);
        }
        
        actions.setFileName(filename.endsWith('.geno') ? filename : `${filename}.geno`);
        actions.setDirty(false);
        
        // Track successful save
        trackSave('manual');
        trackEvent('save_method', 'file_operations', 'download_fallback');
        
        return true;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Save cancelled');
        trackEvent('save_cancelled', 'file_operations');
      } else {
        console.error('Save failed:', error);
        trackError(error.message, 'save');
        alert('Save failed: ' + error.message);
      }
      return false;
    }
  }, [state, actions, getDefaultFileName, copyCanvasToClipboard]);

  const handleLoad = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.geno';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target.result);
          const sanitizePoint = (pt) => ({ x: Number(pt.x) || 0, y: Number(pt.y) || 0 });
          const sanitizePerson = (p) => {
            const type = VALID_NODE_TYPES.has(p?.type) ? p.type : NodeType.PERSON;
            const generationValue = Number(p.generation);

            const sanitized = {
              id: p.id,
              name: p.name || '',
              gender: p.gender || 'female',
              age: p.age || '',
              birthDate: p.birthDate || '',
              deathDate: p.deathDate || '',
              isDeceased: !!p.isDeceased,
              deceasedSymbol: typeof p.deceasedSymbol === 'string' ? p.deceasedSymbol : 'halo',
              deceasedGentleTreatment: typeof p.deceasedGentleTreatment === 'string'
                ? p.deceasedGentleTreatment
                : 'none',
              isPregnant: !!p.isPregnant,
              dueDate: p.dueDate || '',
              gestationalWeeks: p.gestationalWeeks || '',
              pregnancyNotes: p.pregnancyNotes || '',
              x: Number(p.x) || 0,
              y: Number(p.y) || 0,
              generation: Number.isFinite(generationValue) ? generationValue : 0,
              specialStatus: p.specialStatus ?? null,
              sexualOrientation: p.sexualOrientation || 'not-specified',
              networkMember: !!p.networkMember,
              role: p.role || '',
              notes: p.notes || '',
              notesRichText: typeof p.notesRichText === 'string' ? p.notesRichText : '',
              networkNotes: typeof p.networkNotes === 'string' ? p.networkNotes : '',
              type,
              typeData: sanitizeRecordObject(p.typeData),
              visualStyle: sanitizeRecordObject(p.visualStyle),
              caseData: sanitizeRecordObject(p.caseData)
            };

            if (typeof p.customIcon === 'string' && p.customIcon.trim().length > 0) {
              sanitized.customIcon = p.customIcon;
            }

            if (Array.isArray(p.attributes)) {
              sanitized.attributes = [...p.attributes];
            }

            if (Array.isArray(p.medicalConditions)) {
              sanitized.medicalConditions = [...p.medicalConditions];
            }

            return sanitized;
          };
          const sanitizeRel = (r) => ({
            id: r.id,
            from: r.from,
            to: r.to,
            type: r.type || 'marriage',
            color: r.color || '#000000',
            lineStyle: r.lineStyle || 'default',
            startDate: r.startDate || '',
            endDate: r.endDate || '',
            isActive: r.isActive !== false,
            abbr: r.abbr || '',
            notes: r.notes || '',
            bubblePosition: typeof r.bubblePosition === 'number' ? r.bubblePosition : 0.5,
            attributes: Array.isArray(r.attributes) ? r.attributes : []
          });
          const sanitizeHousehold = (h) => ({
            id: h.id,
            name: h.name || '',
            color: h.color || '#6366f1',
            points: Array.isArray(h.points) ? h.points.map(sanitizePoint) : [],
            notes: h.notes || ''
          });
          const sanitizeText = (t) => ({
            id: t.id,
            x: Number(t.x) || 0,
            y: Number(t.y) || 0,
            width: Number(t.width) || 150,
            height: Number(t.height) || 50,
            html: t.html || ''
          });

          const data = {
            people: Array.isArray(raw.people) ? raw.people.map(sanitizePerson) : [],
            relationships: Array.isArray(raw.relationships) ? raw.relationships.map(sanitizeRel) : [],
            households: Array.isArray(raw.households) ? raw.households.map(sanitizeHousehold) : [],
            placements: Array.isArray(raw.placements) ? raw.placements : [],
            textBoxes: Array.isArray(raw.textBoxes) ? raw.textBoxes.map(sanitizeText) : [],
            metadata: sanitizeRecordObject(raw.metadata),
            customAttributes: Array.isArray(raw.customAttributes) ? raw.customAttributes : [],
            tagDefinitions: Array.isArray(raw.tagDefinitions) ? raw.tagDefinitions : [],
            filterTemplates: Array.isArray(raw.filterTemplates) ? raw.filterTemplates : [],
            fileName: raw.fileName || file.name
          };

          actions.loadData(data);
          actions.setFileName(file.name);

          // Automatically fit to canvas after loading (with delay to ensure DOM updates)
          setTimeout(() => {
            fitToCanvas();
          }, 500);

          // Track successful load
          trackEvent('load_genogram', 'file_operations', 'success');
          trackEvent('genogram_stats', 'file_operations', `people:${data.people.length},relationships:${data.relationships.length}`);
        } catch (error) {
          alert('Error loading file: ' + error.message);
          trackError(error.message, 'load');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }, [actions, fitToCanvas]);

  const handleExportSVG = useCallback(async () => {
    // Check if we're embedded
    const embedInstance = getEmbedInstance();
    if (isEmbedded() && embedInstance) {
      console.log('📤 Requesting SVG export via postMessage');
      embedInstance.exportSVGToParent();
      return;
    }
    
    // Generate filename
    const fileName = state.fileName === 'Untitled Genogram' 
      ? getDefaultFileName() 
      : state.fileName.replace(/\.[^/.]+$/, ''); // Strip any extension

    try {
      const cleanSVG = getCleanSVG(true); // Use transparent background for SVG
      if (!cleanSVG) {
        alert('No content to export. Please add at least one person to the genogram.');
        trackEvent('export_error', 'file_operations', 'svg:no_content');
        return;
      }

      const svgString = new XMLSerializer().serializeToString(cleanSVG.svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

      // Copy to clipboard first (only in non-embedded mode)
      if (!isEmbedded()) {
        await copyCanvasToClipboard();
      }

      // Use File System Access API if available
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${fileName}.svg`,
          types: [
            {
              description: 'SVG Image',
              accept: { 'image/svg+xml': ['.svg'] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        // Track successful export
        trackExport('svg');
      } else {
        // Fallback
        const url = URL.createObjectURL(blob);
        try {
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}.svg`;
          a.click();
        } finally {
          URL.revokeObjectURL(url);
        }
        
        // Track successful export
        trackExport('svg');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Export cancelled');
        trackEvent('export_cancelled', 'file_operations', 'svg');
      } else {
        console.error('Export failed:', error);
        trackError(error.message, 'export_svg');
        alert('Export failed: ' + error.message);
      }
    }
  }, [state.fileName, getDefaultFileName, getCleanSVG, copyCanvasToClipboard]);

  const handleExportPNG = useCallback(async () => {
    // Check if we're embedded
    const embedInstance = getEmbedInstance();
    if (isEmbedded() && embedInstance) {
      console.log('📤 Requesting PNG export via postMessage');
      embedInstance.exportPNGToParent();
      return;
    }
    
    // Generate filename
    const fileName = state.fileName === 'Untitled Genogram' 
      ? getDefaultFileName() 
      : state.fileName.replace(/\.[^/.]+$/, '');

    try {
      const cleanSVG = getCleanSVG(true); // Use transparent background
      if (!cleanSVG) {
        alert('No content to export. Please add at least one person to the genogram.');
        trackEvent('export_error', 'file_operations', 'png:no_content');
        return;
      }

      // Create high-quality canvas with transparency
      const canvas = await svgToCanvas(cleanSVG.svg, cleanSVG.width, cleanSVG.height, 2, true);
      
      // Copy to clipboard first (with white background for compatibility) - only in non-embedded mode
      if (!isEmbedded()) {
        await copyCanvasToClipboard();
      }

      // Download as PNG with transparency
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to create image');
          trackEvent('export_error', 'file_operations', 'png:blob_failed');
          return;
        }

        // Use File System Access API if available
        if (window.showSaveFilePicker) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: `${fileName}.png`,
              types: [
                {
                  description: 'PNG Image',
                  accept: { 'image/png': ['.png'] }
                }
              ]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            // Track successful export
            trackExport('png');
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error('PNG save failed:', error);
              trackError(error.message, 'export_png');
            } else {
              trackEvent('export_cancelled', 'file_operations', 'png');
            }
          }
        } else {
          // Fallback download
          const url = URL.createObjectURL(blob);
          try {
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.png`;
            a.click();
          } finally {
            URL.revokeObjectURL(url);
          }
          
          // Track successful export
          trackExport('png');
        }
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('Error exporting PNG:', error);
      trackError(error.message, 'export_png');
      alert('Error exporting image. Please try again.');
    }
  }, [state.fileName, getDefaultFileName, getCleanSVG, svgToCanvas, copyCanvasToClipboard]);

  const handleExportPDF = useCallback(async () => {
    const embedInstance = getEmbedInstance();
    if (isEmbedded() && embedInstance) {
      console.log('📄 PDF export is not yet supported in embedded mode. Triggering SVG export instead.');
      embedInstance.exportSVGToParent?.();
      trackEvent('export_pdf', 'file_operations', 'embedded_svg_fallback');
      return;
    }

    const fileName = state.fileName === 'Untitled Genogram'
      ? getDefaultFileName()
      : state.fileName.replace(/\.[^/.]+$/, '');

    try {
      const cleanSVG = getCleanSVG(false);
      if (!cleanSVG) {
        alert('No content to export. Please add at least one person to the genogram.');
        trackEvent('export_error', 'file_operations', 'pdf:no_content');
        return;
      }

      const canvas = await svgToCanvas(cleanSVG.svg, cleanSVG.width, cleanSVG.height, 2, false);
      const imageData = canvas.toDataURL('image/png', 0.95);

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const metrics = [
        { label: 'People', value: state.people.length },
        { label: 'Relationships', value: state.relationships.length },
        { label: 'Households', value: state.households.length },
        { label: 'Text Notes', value: state.textBoxes.length }
      ];

      const focusPerson = state.people.find(person => person.id === state.focusedNodeId);
      const stripHtml = (value) => (value || '').replace(/<[^>]*>/g, '').trim();
      const capturedNotes = state.textBoxes
        .map(box => stripHtml(box.html))
        .filter(Boolean)
        .slice(0, 3);

      const reportRoot = document.createElement('div');
      reportRoot.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif";
      reportRoot.style.padding = '24px';
      reportRoot.style.maxWidth = '960px';
      reportRoot.style.margin = '0 auto';
      reportRoot.style.color = '#1f2937';
      reportRoot.style.lineHeight = '1.5';

      const title = document.createElement('h1');
      title.textContent = 'Genogram Summary Report';
      title.style.margin = '0 0 4px';
      title.style.fontSize = '26px';
      title.style.fontWeight = '600';
      reportRoot.appendChild(title);

      const subtitle = document.createElement('p');
      subtitle.textContent = `${fileName}.geno`;
      subtitle.style.margin = '0 0 16px';
      subtitle.style.color = '#6b7280';
      subtitle.style.fontSize = '14px';
      reportRoot.appendChild(subtitle);

      const metaRow = document.createElement('div');
      metaRow.style.display = 'flex';
      metaRow.style.flexWrap = 'wrap';
      metaRow.style.gap = '16px';
      metaRow.style.marginBottom = '20px';

      const generatedOn = document.createElement('div');
      generatedOn.textContent = `Generated on ${new Date().toLocaleString()}`;
      generatedOn.style.fontSize = '12px';
      generatedOn.style.color = '#4b5563';
      metaRow.appendChild(generatedOn);

      if (focusPerson) {
        const focusChip = document.createElement('div');
        focusChip.textContent = `Focus Mode: ${focusPerson.name}`;
        focusChip.style.fontSize = '12px';
        focusChip.style.color = '#4b5563';
        focusChip.style.padding = '4px 8px';
        focusChip.style.borderRadius = '999px';
        focusChip.style.background = '#ede9fe';
        focusChip.style.border = '1px solid #c4b5fd';
        metaRow.appendChild(focusChip);
      }

      if (state.highlightNetwork) {
        const highlightChip = document.createElement('div');
        highlightChip.textContent = 'Highlight Network Enabled';
        highlightChip.style.fontSize = '12px';
        highlightChip.style.color = '#4b5563';
        highlightChip.style.padding = '4px 8px';
        highlightChip.style.borderRadius = '999px';
        highlightChip.style.background = '#fce7f3';
        highlightChip.style.border = '1px solid #f9a8d4';
        metaRow.appendChild(highlightChip);
      }

      reportRoot.appendChild(metaRow);

      const metricGrid = document.createElement('div');
      metricGrid.style.display = 'grid';
      metricGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
      metricGrid.style.gap = '12px';
      metricGrid.style.marginBottom = '24px';

      metrics.forEach(({ label, value }) => {
        const card = document.createElement('div');
        card.style.borderRadius = '12px';
        card.style.border = '1px solid #e5e7eb';
        card.style.padding = '12px';
        card.style.background = '#f9fafb';

        const metricLabel = document.createElement('div');
        metricLabel.textContent = label;
        metricLabel.style.fontSize = '12px';
        metricLabel.style.color = '#6b7280';

        const metricValue = document.createElement('div');
        metricValue.textContent = value.toString();
        metricValue.style.fontSize = '20px';
        metricValue.style.fontWeight = '600';
        metricValue.style.color = '#2563eb';
        metricValue.style.marginTop = '6px';

        card.appendChild(metricLabel);
        card.appendChild(metricValue);
        metricGrid.appendChild(card);
      });

      reportRoot.appendChild(metricGrid);

      if (capturedNotes.length > 0) {
        const notesHeading = document.createElement('h2');
        notesHeading.textContent = 'Key Notes';
        notesHeading.style.fontSize = '16px';
        notesHeading.style.margin = '0 0 8px';
        notesHeading.style.color = '#111827';
        reportRoot.appendChild(notesHeading);

        const notesList = document.createElement('ul');
        notesList.style.margin = '0 0 20px 16px';
        notesList.style.padding = '0';
        notesList.style.color = '#374151';

        capturedNotes.forEach(note => {
          const item = document.createElement('li');
          item.textContent = note;
          item.style.marginBottom = '6px';
          notesList.appendChild(item);
        });

        reportRoot.appendChild(notesList);
      }

      const figure = document.createElement('div');
      figure.style.borderRadius = '16px';
      figure.style.border = '1px solid #e5e7eb';
      figure.style.overflow = 'hidden';
      figure.style.background = '#ffffff';

      const image = document.createElement('img');
      image.src = imageData;
      image.alt = 'Genogram diagram preview';
      image.style.width = '100%';
      image.style.display = 'block';

      figure.appendChild(image);
      reportRoot.appendChild(figure);

      if (state.people && state.people.length > 0) {
        const relationshipLookup = new Map();
        state.relationships?.forEach((rel) => {
          if (rel && rel.id) {
            relationshipLookup.set(rel.id, rel);
          }
        });

        const peopleById = new Map(state.people.map((person) => [person.id, person]));
        const sortedPeople = [...state.people].sort((a, b) => {
          const nameA = (a?.name || '').toLowerCase();
          const nameB = (b?.name || '').toLowerCase();
          if (!nameA && !nameB) return 0;
          if (!nameA) return 1;
          if (!nameB) return -1;
          return nameA.localeCompare(nameB);
        });

        const titleCase = (value) => {
          if (!value) return 'Not specified';
          return value
            .toString()
            .replace(/[_-]+/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
        };

        const formatText = (value) => {
          if (value === 0) return '0';
          if (value === false) return 'No';
          return value ? String(value) : 'Not specified';
        };

        const formatBoolean = (value) => (value ? 'Yes' : 'No');

        const formatDate = (value) => {
          if (!value) return 'Not specified';
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            return value;
          }
          return date.toLocaleDateString();
        };

        // Household Table Section
        if (state.households && state.households.length > 0) {
          const householdSection = document.createElement('section');
          householdSection.style.pageBreakBefore = 'always';
          householdSection.style.marginTop = '32px';

          const householdHeading = document.createElement('h2');
          householdHeading.textContent = 'Households';
          householdHeading.style.fontSize = '20px';
          householdHeading.style.margin = '0 0 12px';
          householdHeading.style.color = '#111827';
          householdSection.appendChild(householdHeading);

          const householdIntro = document.createElement('p');
          householdIntro.textContent = `This genogram contains ${state.households.length} household${state.households.length !== 1 ? 's' : ''}. Members are listed for each household below.`;
          householdIntro.style.fontSize = '12px';
          householdIntro.style.color = '#4b5563';
          householdIntro.style.margin = '0 0 20px';
          householdSection.appendChild(householdIntro);

          state.households.forEach((household, index) => {
            const householdCard = document.createElement('div');
            householdCard.style.border = '1px solid #e5e7eb';
            householdCard.style.borderRadius = '16px';
            householdCard.style.padding = '20px';
            householdCard.style.background = '#ffffff';
            householdCard.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
            householdCard.style.marginTop = index === 0 ? '0' : '20px';
            householdCard.style.pageBreakInside = 'avoid';

            const householdHeader = document.createElement('h3');
            householdHeader.textContent = household.name || `Household ${index + 1}`;
            householdHeader.style.margin = '0 0 16px';
            householdHeader.style.fontSize = '16px';
            householdHeader.style.fontWeight = '600';
            householdHeader.style.color = '#111827';
            householdCard.appendChild(householdHeader);

            // Get household members
            const members = (household.members || [])
              .map(memberId => peopleById.get(memberId))
              .filter(Boolean)
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            if (members.length === 0) {
              const emptyMsg = document.createElement('p');
              emptyMsg.textContent = 'No members assigned to this household.';
              emptyMsg.style.fontSize = '12px';
              emptyMsg.style.color = '#9ca3af';
              emptyMsg.style.fontStyle = 'italic';
              householdCard.appendChild(emptyMsg);
            } else {
              const memberTable = document.createElement('table');
              memberTable.style.width = '100%';
              memberTable.style.borderCollapse = 'collapse';
              memberTable.style.fontSize = '12px';

              const thead = document.createElement('thead');
              const headerRow = document.createElement('tr');
              headerRow.style.backgroundColor = '#f3f4f6';
              
              ['Name', 'Age', 'Gender', 'Role', 'Status'].forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                th.style.padding = '8px 10px';
                th.style.textAlign = 'left';
                th.style.fontWeight = '600';
                th.style.fontSize = '11px';
                th.style.color = '#374151';
                th.style.borderBottom = '2px solid #e5e7eb';
                headerRow.appendChild(th);
              });
              thead.appendChild(headerRow);
              memberTable.appendChild(thead);

              const tbody = document.createElement('tbody');
              members.forEach(member => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #f3f4f6';
                
                const nameCell = document.createElement('td');
                nameCell.textContent = member.name || 'Unnamed';
                nameCell.style.padding = '8px 10px';
                nameCell.style.fontWeight = '500';
                nameCell.style.color = '#111827';
                row.appendChild(nameCell);
                
                const ageCell = document.createElement('td');
                ageCell.textContent = formatText(member.age);
                ageCell.style.padding = '8px 10px';
                ageCell.style.color = '#4b5563';
                row.appendChild(ageCell);
                
                const genderCell = document.createElement('td');
                genderCell.textContent = titleCase(member.gender);
                genderCell.style.padding = '8px 10px';
                genderCell.style.color = '#4b5563';
                row.appendChild(genderCell);
                
                const roleCell = document.createElement('td');
                roleCell.textContent = titleCase(member.role);
                roleCell.style.padding = '8px 10px';
                roleCell.style.color = '#6366f1';
                roleCell.style.fontWeight = '500';
                row.appendChild(roleCell);
                
                const statusCell = document.createElement('td');
                statusCell.textContent = titleCase(member.specialStatus);
                statusCell.style.padding = '8px 10px';
                statusCell.style.color = '#059669';
                statusCell.style.fontWeight = '500';
                row.appendChild(statusCell);
                
                tbody.appendChild(row);
              });
              memberTable.appendChild(tbody);
              householdCard.appendChild(memberTable);
            }

            householdSection.appendChild(householdCard);
          });

          reportRoot.appendChild(householdSection);
        }

        // Network Members Section
        const networkMembers = state.people.filter(person => person.networkMember);
        if (networkMembers && networkMembers.length > 0) {
          const networkSection = document.createElement('section');
          networkSection.style.pageBreakBefore = 'always';
          networkSection.style.marginTop = '32px';

          const networkHeading = document.createElement('h2');
          networkHeading.textContent = 'Network Members';
          networkHeading.style.fontSize = '20px';
          networkHeading.style.margin = '0 0 12px';
          networkHeading.style.color = '#111827';
          networkSection.appendChild(networkHeading);

          const networkIntro = document.createElement('p');
          networkIntro.textContent = `This genogram contains ${networkMembers.length} network member${networkMembers.length !== 1 ? 's' : ''} - individuals from external data sources or extended family networks.`;
          networkIntro.style.fontSize = '12px';
          networkIntro.style.color = '#4b5563';
          networkIntro.style.margin = '0 0 20px';
          networkSection.appendChild(networkIntro);

          const networkCard = document.createElement('div');
          networkCard.style.border = '1px solid #e5e7eb';
          networkCard.style.borderRadius = '16px';
          networkCard.style.padding = '20px';
          networkCard.style.background = '#ffffff';
          networkCard.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
          networkCard.style.pageBreakInside = 'avoid';

          const sortedNetworkMembers = [...networkMembers].sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
          );

          const networkTable = document.createElement('table');
          networkTable.style.width = '100%';
          networkTable.style.borderCollapse = 'collapse';
          networkTable.style.fontSize = '12px';

          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          headerRow.style.backgroundColor = '#f3f4f6';
          
          ['Name', 'Age', 'Gender', 'Role', 'Source', 'Confidence'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.padding = '8px 10px';
            th.style.textAlign = 'left';
            th.style.fontWeight = '600';
            th.style.fontSize = '11px';
            th.style.color = '#374151';
            th.style.borderBottom = '2px solid #e5e7eb';
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          networkTable.appendChild(thead);

          const tbody = document.createElement('tbody');
          sortedNetworkMembers.forEach(member => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #f3f4f6';
            
            const nameCell = document.createElement('td');
            nameCell.textContent = member.name || 'Unnamed';
            nameCell.style.padding = '8px 10px';
            nameCell.style.fontWeight = '500';
            nameCell.style.color = '#111827';
            row.appendChild(nameCell);
            
            const ageCell = document.createElement('td');
            ageCell.textContent = formatText(member.age);
            ageCell.style.padding = '8px 10px';
            ageCell.style.color = '#4b5563';
            row.appendChild(ageCell);
            
            const genderCell = document.createElement('td');
            genderCell.textContent = titleCase(member.gender);
            genderCell.style.padding = '8px 10px';
            genderCell.style.color = '#4b5563';
            row.appendChild(genderCell);
            
            const roleCell = document.createElement('td');
            roleCell.textContent = titleCase(member.role);
            roleCell.style.padding = '8px 10px';
            roleCell.style.color = '#6366f1';
            roleCell.style.fontWeight = '500';
            row.appendChild(roleCell);
            
            const sourceCell = document.createElement('td');
            sourceCell.textContent = member.searchMetadata?.source || 'Unknown';
            sourceCell.style.padding = '8px 10px';
            sourceCell.style.color = '#059669';
            sourceCell.style.fontSize = '11px';
            row.appendChild(sourceCell);
            
            const confidenceCell = document.createElement('td');
            const confidence = member.searchMetadata?.confidence;
            confidenceCell.textContent = confidence ? `${confidence}%` : '—';
            confidenceCell.style.padding = '8px 10px';
            confidenceCell.style.color = '#d97706';
            confidenceCell.style.fontWeight = '500';
            row.appendChild(confidenceCell);
            
            tbody.appendChild(row);
          });
          networkTable.appendChild(tbody);
          networkCard.appendChild(networkTable);
          networkSection.appendChild(networkCard);

          reportRoot.appendChild(networkSection);
        }

        const detailSection = document.createElement('section');
        detailSection.style.pageBreakBefore = 'always';
        detailSection.style.marginTop = '32px';

        const detailHeading = document.createElement('h2');
        detailHeading.textContent = 'Person Details';
        detailHeading.style.fontSize = '20px';
        detailHeading.style.margin = '0 0 12px';
        detailHeading.style.color = '#111827';
        detailSection.appendChild(detailHeading);

        const detailIntro = document.createElement('p');
        detailIntro.textContent = 'Each genogram node is listed below with core demographic and clinical context for reference.';
        detailIntro.style.fontSize = '12px';
        detailIntro.style.color = '#4b5563';
        detailIntro.style.margin = '0 0 20px';
        detailSection.appendChild(detailIntro);

        const addNameFromId = (set, id) => {
          if (!id) return;
          const referenced = peopleById.get(id);
          if (referenced) {
            set.add(referenced.name || `Unnamed (${id})`);
          }
        };

        sortedPeople.forEach((person, index) => {
          const card = document.createElement('div');
          card.style.border = '1px solid #e5e7eb';
          card.style.borderRadius = '16px';
          card.style.padding = '20px';
          card.style.background = '#ffffff';
          card.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
          card.style.marginTop = index === 0 ? '0' : '28px';
          card.style.pageBreakInside = 'avoid';
          card.style.pageBreakBefore = index === 0 ? 'auto' : 'always';

          const header = document.createElement('div');
          header.style.display = 'flex';
          header.style.flexDirection = 'column';
          header.style.gap = '4px';

          const nameHeading = document.createElement('h3');
          nameHeading.textContent = person?.name || 'Unnamed Person';
          nameHeading.style.margin = '0';
          nameHeading.style.fontSize = '18px';
          nameHeading.style.fontWeight = '600';
          nameHeading.style.color = '#111827';
          header.appendChild(nameHeading);

          const subline = document.createElement('div');
          subline.style.display = 'flex';
          subline.style.flexWrap = 'wrap';
          subline.style.gap = '12px';
          subline.style.fontSize = '12px';
          subline.style.color = '#4b5563';

          let hasSecondaryMeta = false;

          if (person?.role) {
            const roleChip = document.createElement('span');
            roleChip.textContent = `Role: ${titleCase(person.role)}`;
            subline.appendChild(roleChip);
            hasSecondaryMeta = true;
          }

          if (person?.specialStatus) {
            const statusChip = document.createElement('span');
            statusChip.textContent = `Status: ${titleCase(person.specialStatus)}`;
            subline.appendChild(statusChip);
            hasSecondaryMeta = true;
          }

          if (hasSecondaryMeta) {
            header.appendChild(subline);
          }
          card.appendChild(header);

          const detailGrid = document.createElement('div');
          detailGrid.style.display = 'grid';
          detailGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
          detailGrid.style.gap = '12px';
          detailGrid.style.marginTop = '16px';

          const addDetail = (label, value) => {
            const wrapper = document.createElement('div');
            const labelEl = document.createElement('div');
            labelEl.textContent = label;
            labelEl.style.fontSize = '11px';
            labelEl.style.textTransform = 'uppercase';
            labelEl.style.letterSpacing = '0.06em';
            labelEl.style.color = '#6b7280';
            labelEl.style.marginBottom = '4px';

            const valueEl = document.createElement('div');
            valueEl.textContent = value;
            valueEl.style.fontSize = '14px';
            valueEl.style.color = '#111827';
            valueEl.style.fontWeight = '500';

            wrapper.appendChild(labelEl);
            wrapper.appendChild(valueEl);
            detailGrid.appendChild(wrapper);
          };

          addDetail('Age', formatText(person?.age));
          addDetail('Gender', titleCase(person?.gender));
          addDetail('Birth Date', formatDate(person?.birthDate));
          addDetail('Death Date', formatDate(person?.deathDate));
          addDetail('Deceased', formatBoolean(person?.isDeceased));
          addDetail('Network Member', formatBoolean(person?.networkMember));
          addDetail('Pregnant', formatBoolean(person?.isPregnant));

          if (person?.dueDate || person?.gestationalWeeks) {
            addDetail('Due Date', formatDate(person?.dueDate));
            addDetail('Gestational Weeks', formatText(person?.gestationalWeeks));
          }

          if (person?.sexualOrientation) {
            addDetail('Orientation', titleCase(person.sexualOrientation));
          }

          if (person?.notesRichText || person?.notes) {
            const notesWrapper = document.createElement('div');
            notesWrapper.style.gridColumn = '1 / -1';

            const labelEl = document.createElement('div');
            labelEl.textContent = 'Notes';
            labelEl.style.fontSize = '11px';
            labelEl.style.textTransform = 'uppercase';
            labelEl.style.letterSpacing = '0.06em';
            labelEl.style.color = '#6b7280';
            labelEl.style.marginBottom = '4px';

            const valueEl = document.createElement('div');
            const noteText = stripHtml(person?.notesRichText) || person?.notes || 'None provided';
            valueEl.textContent = noteText;
            valueEl.style.fontSize = '13px';
            valueEl.style.color = '#1f2937';
            valueEl.style.whiteSpace = 'pre-wrap';

            notesWrapper.appendChild(labelEl);
            notesWrapper.appendChild(valueEl);
            detailGrid.appendChild(notesWrapper);
          }

          // Build detailed connections table
          const connections = [];
          
          // Helper to get relationship abbreviation
          const getRelAbbrev = (type) => {
            const abbrevMap = {
              'married': 'M', 'partnered': 'PTR', 'divorced': 'DIV', 'separated': 'SEP',
              'widowed': 'WID', 'engaged': 'ENG', 'dating': 'DAT', 'cohabiting': 'COH',
              'biological': 'BIO', 'adoptive': 'ADPT', 'step': 'STEP', 'foster': 'FST',
              'sibling': 'SIB', 'half-sibling': 'HALF', 'friend': 'FR', 'professional': 'PROF'
            };
            return abbrevMap[type?.toLowerCase()] || type?.substring(0, 3).toUpperCase() || '—';
          };
          
          // Helper to format relationship attributes
          const getRelAttributes = (rel) => {
            const attrs = [];
            if (rel.connectionStatus) attrs.push(titleCase(rel.connectionStatus));
            if (rel.relationshipQuality) attrs.push(`Quality: ${titleCase(rel.relationshipQuality)}`);
            if (rel.contactFrequency) attrs.push(`Contact: ${titleCase(rel.contactFrequency)}`);
            if (rel.startDate) attrs.push(`Since: ${formatDate(rel.startDate)}`);
            if (rel.endDate) attrs.push(`Ended: ${formatDate(rel.endDate)}`);
            if (rel.notes) attrs.push(rel.notes);
            return attrs.length > 0 ? attrs.join(', ') : '—';
          };
          
          // Helper to get placement status
          const getPlacementStatus = (childId, caregiverId) => {
            const placement = state.placements?.find(p => 
              p.childId === childId && p.caregiverId === caregiverId
            );
            return placement ? titleCase(placement.status) : '—';
          };

          state.relationships?.forEach((rel) => {
            if (!rel) return;

            if (rel.type === 'child') {
              const parentRel = relationshipLookup.get(rel.from);
              if (!parentRel) return;

              if (rel.to === person?.id) {
                // This person is the child
                const parent1 = peopleById.get(parentRel.from);
                const parent2 = peopleById.get(parentRel.to);
                
                if (parent1) {
                  connections.push({
                    name: parent1.name || 'Unnamed',
                    type: 'Parent',
                    abbrev: 'PAR',
                    attributes: getRelAttributes(parentRel),
                    placement: getPlacementStatus(person.id, parent1.id)
                  });
                }
                if (parent2) {
                  connections.push({
                    name: parent2.name || 'Unnamed',
                    type: 'Parent',
                    abbrev: 'PAR',
                    attributes: getRelAttributes(parentRel),
                    placement: getPlacementStatus(person.id, parent2.id)
                  });
                }
                return;
              }

              if (parentRel.from === person?.id || parentRel.to === person?.id) {
                // This person is a parent
                const child = peopleById.get(rel.to);
                if (child) {
                  connections.push({
                    name: child.name || 'Unnamed',
                    type: 'Child',
                    abbrev: 'CHD',
                    attributes: getRelAttributes(parentRel),
                    placement: getPlacementStatus(child.id, person.id)
                  });
                }
                return;
              }

              return;
            }

            if (rel.from === person?.id || rel.to === person?.id) {
              const otherId = rel.from === person?.id ? rel.to : rel.from;
              const otherPerson = peopleById.get(otherId);
              if (otherPerson) {
                connections.push({
                  name: otherPerson.name || 'Unnamed',
                  type: titleCase(rel.type || 'Relationship'),
                  abbrev: getRelAbbrev(rel.type),
                  attributes: getRelAttributes(rel),
                  placement: getPlacementStatus(otherId, person.id)
                });
              }
            }
          });

          if (connections.length > 0) {
            const connectionsWrapper = document.createElement('div');
            connectionsWrapper.style.gridColumn = '1 / -1';
            connectionsWrapper.style.marginTop = '12px';

            const labelEl = document.createElement('div');
            labelEl.textContent = 'Relationships & Connections';
            labelEl.style.fontSize = '11px';
            labelEl.style.textTransform = 'uppercase';
            labelEl.style.letterSpacing = '0.06em';
            labelEl.style.color = '#6b7280';
            labelEl.style.marginBottom = '8px';
            labelEl.style.fontWeight = '600';

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.fontSize = '11px';
            table.style.marginTop = '4px';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f3f4f6';
            
            ['Connected Person', 'Relationship Type', 'Abbrev.', 'Relationship Attributes', 'Placement Status'].forEach(header => {
              const th = document.createElement('th');
              th.textContent = header;
              th.style.padding = '6px 8px';
              th.style.textAlign = 'left';
              th.style.fontWeight = '600';
              th.style.fontSize = '10px';
              th.style.color = '#374151';
              th.style.borderBottom = '2px solid #e5e7eb';
              if (header === 'Abbrev.') th.style.textAlign = 'center';
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            connections.sort((a, b) => a.name.localeCompare(b.name)).forEach(conn => {
              const row = document.createElement('tr');
              row.style.borderBottom = '1px solid #f3f4f6';
              
              const nameCell = document.createElement('td');
              nameCell.textContent = conn.name;
              nameCell.style.padding = '6px 8px';
              nameCell.style.fontWeight = '500';
              nameCell.style.color = '#111827';
              row.appendChild(nameCell);
              
              const typeCell = document.createElement('td');
              typeCell.textContent = conn.type;
              typeCell.style.padding = '6px 8px';
              typeCell.style.color = '#6366f1';
              typeCell.style.fontWeight = '500';
              row.appendChild(typeCell);
              
              const abbrevCell = document.createElement('td');
              abbrevCell.textContent = conn.abbrev;
              abbrevCell.style.padding = '6px 8px';
              abbrevCell.style.textAlign = 'center';
              abbrevCell.style.fontWeight = '600';
              abbrevCell.style.color = '#8b5cf6';
              row.appendChild(abbrevCell);
              
              const attrsCell = document.createElement('td');
              attrsCell.textContent = conn.attributes;
              attrsCell.style.padding = '6px 8px';
              attrsCell.style.fontSize = '10px';
              attrsCell.style.color = '#6b7280';
              row.appendChild(attrsCell);
              
              const placementCell = document.createElement('td');
              placementCell.textContent = conn.placement;
              placementCell.style.padding = '6px 8px';
              placementCell.style.fontSize = '10px';
              placementCell.style.color = '#059669';
              placementCell.style.fontWeight = '500';
              row.appendChild(placementCell);
              
              tbody.appendChild(row);
            });
            table.appendChild(tbody);

            connectionsWrapper.appendChild(labelEl);
            connectionsWrapper.appendChild(table);
            detailGrid.appendChild(connectionsWrapper);
          }

          card.appendChild(detailGrid);
          detailSection.appendChild(card);
        });

        reportRoot.appendChild(detailSection);
      }

      document.body.appendChild(reportRoot);

      try {
        const pdfOptions = {
          margin: [0.5, 0.5, 0.75, 0.5],
          filename: `${fileName}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const buildWorker = () => html2pdf().set(pdfOptions).from(reportRoot);

        const attemptNativeSave = async (blob) => {
          if (typeof window === 'undefined' || typeof window.showSaveFilePicker !== 'function') {
            return 'unsupported';
          }

          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: `${fileName}.pdf`,
              types: [
                {
                  description: 'PDF Document',
                  accept: { 'application/pdf': ['.pdf'] }
                }
              ]
            });

            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return 'saved';
          } catch (pickerError) {
            if (pickerError?.name === 'AbortError' || pickerError?.name === 'NotAllowedError') {
              return 'cancelled';
            }
            console.warn('Native save dialog failed, falling back to automatic download.', pickerError);
            return 'failed';
          }
        };

        let exportComplete = false;

        if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
          try {
            const pdfBlob = await buildWorker().outputPdf('blob');
            const pickerResult = await attemptNativeSave(pdfBlob);

            if (pickerResult === 'saved') {
              trackExport('pdf');
              trackEvent('export_pdf', 'file_operations', 'success_native_dialog');
              exportComplete = true;
            } else if (pickerResult === 'cancelled') {
              trackEvent('export_cancelled', 'file_operations', 'pdf_native_dialog');
              return;
            }
          } catch (pickerError) {
            console.warn('Unable to use native save dialog, falling back to automatic download.', pickerError);
          }
        }

        if (!exportComplete) {
          await buildWorker().save();
          trackExport('pdf');
          trackEvent('export_pdf', 'file_operations', 'success');
        }
      } finally {
        document.body.removeChild(reportRoot);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      trackError(error.message, 'export_pdf');
      alert('Export to PDF failed. Please try again.');
    }
  }, [state, getDefaultFileName, getCleanSVG, svgToCanvas]);

  return {
    handleSave,
    handleLoad,
    handleExportSVG,
    handleExportPNG,
    handleExportPDF,
    copyCanvasToClipboard,
    getCleanSVG
  };
};