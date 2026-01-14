// src/utils/embedEnhancements.js
import { getEmbedInstance } from './embedIntegration';

/**
 * Advanced embed features that can be enabled optionally
 */
export class EmbedEnhancements {
  constructor(genogramContext) {
    this.context = genogramContext;
    this.autoSaveInterval = null;
    this.collaborationEnabled = false;
    this.readOnlyMode = false;
  }

  /**
   * Enable real-time auto-save to parent
   */
  enableAutoSave(intervalMs = 5000) {
    const embedInstance = getEmbedInstance();
    if (!embedInstance) return;

    this.disableAutoSave(); // Clear any existing interval
    
    this.autoSaveInterval = setInterval(() => {
      const { state } = this.context;
      if (state.isDirty) {
        embedInstance.saveToParent();
        this.context.actions.setDirty(false);
      }
    }, intervalMs);
  }

  /**
   * Disable auto-save
   */
  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Enable read-only mode
   */
  setReadOnlyMode(readOnly) {
    this.readOnlyMode = readOnly;
    
    // Update UI to reflect read-only state
    if (readOnly) {
      document.body.classList.add('read-only-mode');
      // Disable all editing actions
      this.disableEditingActions();
    } else {
      document.body.classList.remove('read-only-mode');
      this.enableEditingActions();
    }
  }

  /**
   * Disable editing actions in read-only mode
   */
  disableEditingActions() {
    // Override action creators to prevent modifications
    const { actions } = this.context;
    const originalActions = { ...actions };
    
    const readOnlyActions = [
      'addPerson', 'updatePerson', 'deletePerson',
      'addRelationship', 'updateRelationship', 'deleteRelationship',
      'addHousehold', 'updateHousehold', 'deleteHousehold',
      'addTextBox', 'updateTextBox', 'deleteTextBox'
    ];
    
    readOnlyActions.forEach(action => {
      if (actions[action]) {
        actions[action] = () => {
          this.showReadOnlyNotification();
        };
      }
    });
    
    // Store original actions for restoration
    this._originalActions = originalActions;
  }

  /**
   * Re-enable editing actions
   */
  enableEditingActions() {
    if (this._originalActions) {
      Object.assign(this.context.actions, this._originalActions);
    }
  }

  /**
   * Show read-only notification
   */
  showReadOnlyNotification() {
    const notification = document.createElement('div');
    notification.className = 'embed-notification read-only';
    notification.textContent = 'This genogram is in read-only mode';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Enable collaboration features
   */
  enableCollaboration(userId, userName) {
    this.collaborationEnabled = true;
    this.userId = userId;
    this.userName = userName;
    
    // Add collaboration cursor tracking
    this.setupCursorTracking();
    
    // Add user presence indicator
    this.addPresenceIndicator();
  }

  /**
   * Setup cursor tracking for collaboration
   */
  setupCursorTracking() {
    const canvas = document.getElementById('genogram-canvas');
    if (!canvas) return;
    
    let lastCursorUpdate = 0;
    const CURSOR_UPDATE_THROTTLE = 100; // ms
    
    canvas.addEventListener('pointermove', (e) => {
      const now = Date.now();
      if (now - lastCursorUpdate < CURSOR_UPDATE_THROTTLE) return;
      
      lastCursorUpdate = now;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Send cursor position to parent
      const embedInstance = getEmbedInstance();
      if (embedInstance) {
        embedInstance.notifyParentOfChange('cursor_move', {
          userId: this.userId,
          userName: this.userName,
          x: x,
          y: y
        });
      }
    });
  }

  /**
   * Add presence indicator for collaboration
   */
  addPresenceIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'collaboration-presence';
    indicator.innerHTML = `
      <div class="presence-dot"></div>
      <span>${this.userName} (You)</span>
    `;
    document.body.appendChild(indicator);
  }

  /**
   * Show remote user cursor
   */
  showRemoteCursor(userId, userName, x, y, color = '#ff6b6b') {
    let cursor = document.getElementById(`cursor-${userId}`);
    
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = `cursor-${userId}`;
      cursor.className = 'remote-cursor';
      cursor.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M0 0 L0 14 L4 10 L7 15 L9 14 L6 9 L11 9 Z" fill="${color}"/>
        </svg>
        <span class="cursor-label">${userName}</span>
      `;
      cursor.style.position = 'absolute';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '9999';
      document.body.appendChild(cursor);
    }
    
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    
    // Remove cursor after inactivity
    clearTimeout(cursor.hideTimeout);
    cursor.hideTimeout = setTimeout(() => {
      cursor.remove();
    }, 5000);
  }

  /**
   * Export genogram with watermark
   */
  async exportWithWatermark(text = 'DRAFT') {
    const { getCleanSVG } = await import('../src-modern/hooks/useFileOperations');
    const cleanSVG = getCleanSVG(true);
    
    if (cleanSVG) {
      // Add watermark to SVG
      const watermark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      watermark.setAttribute('x', '50%');
      watermark.setAttribute('y', '50%');
      watermark.setAttribute('text-anchor', 'middle');
      watermark.setAttribute('font-size', '48');
      watermark.setAttribute('font-weight', 'bold');
      watermark.setAttribute('fill', 'rgba(0,0,0,0.1)');
      watermark.setAttribute('transform', 'rotate(-45)');
      watermark.textContent = text;
      
      cleanSVG.svg.appendChild(watermark);
      
      return new XMLSerializer().serializeToString(cleanSVG.svg);
    }
  }

  /**
   * Enable touch gestures for mobile embed
   */
  enableTouchGestures() {
    const canvas = document.getElementById('genogram-canvas');
    if (!canvas) return;
    
    // Add pinch-to-zoom support
    let lastDistance = 0;
    
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastDistance = this.getTouchDistance(e.touches);
      }
    });
    
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = this.getTouchDistance(e.touches);
        const scale = distance / lastDistance;
        
        if (scale > 0.5 && scale < 2) {
          const { state, actions } = this.context;
          const newZoom = Math.max(0.1, Math.min(5, state.zoom * scale));
          actions.setZoom(newZoom);
        }
        
        lastDistance = distance;
      }
    });
  }

  /**
   * Calculate distance between two touch points
   */
  getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Add custom toolbar for embed mode
   */
  addEmbedToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'embed-toolbar';
    toolbar.innerHTML = `
      <button onclick="embedEnhancements.quickSave()" title="Quick Save (Ctrl+S)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2v12h12V4.5L11.5 2H2zm10 10H4v-2h8v2zm0-4H4V4h4v3h4v1z"/>
        </svg>
      </button>
      <button onclick="embedEnhancements.zoomIn()" title="Zoom In">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 6H8V4H6v2H4v2h2v2h2V8h2V6z"/>
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button onclick="embedEnhancements.zoomOut()" title="Zoom Out">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 6h6v2H4z"/>
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button onclick="embedEnhancements.fitToScreen()" title="Fit to Screen">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2h4v2H4v2H2V2zm10 0v4h2V2h-4v2h2zm-8 8H2v4h4v-2H4v-2zm8 2v2h-2v2h4v-4h-2z"/>
        </svg>
      </button>
    `;
    
    document.body.appendChild(toolbar);
  }

  /**
   * Quick save action
   */
  quickSave() {
    const embedInstance = getEmbedInstance();
    if (embedInstance) {
      embedInstance.saveToParent();
      this.showSaveNotification();
    }
  }

  /**
   * Show save notification
   */
  showSaveNotification() {
    const notification = document.createElement('div');
    notification.className = 'embed-notification save-success';
    notification.textContent = 'Genogram saved!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  /**
   * Zoom controls
   */
  zoomIn() {
    const { state, actions } = this.context;
    actions.setZoom(Math.min(5, state.zoom * 1.2));
  }

  zoomOut() {
    const { state, actions } = this.context;
    actions.setZoom(Math.max(0.1, state.zoom / 1.2));
  }

  fitToScreen() {
    const { actions } = this.context;
    if (actions.fitToCanvas) {
      actions.fitToCanvas();
    }
  }

  /**
   * Clean up enhancements
   */
  destroy() {
    this.disableAutoSave();
    
    // Remove any UI elements added by enhancements
    const elements = document.querySelectorAll(
      '.embed-toolbar, .collaboration-presence, .remote-cursor'
    );
    elements.forEach(el => el.remove());
  }
}

// Create global instance for toolbar buttons
window.embedEnhancements = null;

export const initializeEmbedEnhancements = (genogramContext) => {
  if (!window.embedEnhancements) {
    window.embedEnhancements = new EmbedEnhancements(genogramContext);
  }
  return window.embedEnhancements;
}; 