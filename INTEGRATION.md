# Genogram Builder Integration Guide

This guide explains how to integrate the Genogram Builder into your application, particularly for case management systems using QuillJS or similar rich text editors.

## Available Environments

- **Production**: https://genogram.apps.safegenerations.org
- **Development (dev-breakable)**: https://green-tree-0cc12f61e-devbreakable.westus2.6.azurestaticapps.net/

Use the development environment for testing new features before they're released to production.

## Table of Contents
- [Quick Start](#quick-start)
- [Integration Methods](#integration-methods)
- [iframe Integration](#iframe-integration)
- [QuillJS Integration](#quilljs-integration)
- [API Reference](#api-reference)
- [Security Considerations](#security-considerations)
- [Advanced Features](#advanced-features)

## Quick Start

The simplest way to integrate the Genogram Builder is via iframe:

```html
<iframe 
  src="https://genogram.apps.safegenerations.org?embed=true" 
  width="100%" 
  height="600"
  allow="clipboard-write"
></iframe>
```

## Integration Methods

### 1. iframe Integration (Recommended)

**Advantages:**
- Simple to implement
- No build dependencies
- Isolated environment
- Easy updates

**Basic Setup:**

```javascript
// Create iframe
const iframe = document.createElement('iframe');
iframe.src = 'https://genogram.apps.safegenerations.org?embed=true';
iframe.style.width = '100%';
iframe.style.height = '600px';
iframe.allow = 'clipboard-write';
document.getElementById('genogram-container').appendChild(iframe);

// Listen for messages
window.addEventListener('message', (event) => {
  // Verify origin in production
  if (event.origin !== 'https://genogram.apps.safegenerations.org') return;
  
  switch (event.data.type) {
    case 'GENOGRAM_READY':
      console.log('Genogram loaded');
      break;
    case 'GENOGRAM_SAVE':
      console.log('Genogram data:', event.data.data);
      break;
  }
});

// Send data to genogram
iframe.contentWindow.postMessage({
  type: 'LOAD_GENOGRAM',
  data: existingGenogramData
}, 'https://genogram.apps.safegenerations.org');
```

### 2. Direct Component Integration

If you have access to the source code:

```javascript
import { GenogramProvider } from './genogram-builder/src-modern/contexts/GenogramContext';
import ModernGenogramApp from './genogram-builder/src-modern/ModernGenogramApp';

function MyApp() {
  return (
    <GenogramProvider>
      <ModernGenogramApp />
    </GenogramProvider>
  );
}
```

## QuillJS Integration

### Custom Quill Module

```javascript
import Quill from 'quill';

// Define custom blot for genogram
const BlockEmbed = Quill.import('blots/block/embed');

class GenogramBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-genogram', JSON.stringify(value.data));
    
    // Create preview container
    const container = document.createElement('div');
    container.className = 'genogram-preview';
    container.innerHTML = `
      <img src="${value.svg}" alt="Genogram" />
      <button class="edit-genogram">Edit Genogram</button>
    `;
    
    node.appendChild(container);
    return node;
  }
  
  static value(node) {
    return {
      data: JSON.parse(node.getAttribute('data-genogram')),
      svg: node.querySelector('img')?.src
    };
  }
}

GenogramBlot.blotName = 'genogram';
GenogramBlot.tagName = 'div';
GenogramBlot.className = 'ql-genogram';

Quill.register(GenogramBlot);

// Genogram handler
class GenogramHandler {
  constructor(quill) {
    this.quill = quill;
    this.modal = null;
    
    // Add toolbar button
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('genogram', this.showGenogramEditor.bind(this));
    
    // Handle clicks on existing genograms
    quill.root.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-genogram')) {
        const blot = Quill.find(e.target.closest('.ql-genogram'));
        if (blot) {
          this.editGenogram(blot);
        }
      }
    });
  }
  
  showGenogramEditor(existingData = null) {
    // Create modal
    this.modal = document.createElement('div');
    this.modal.className = 'genogram-modal';
    this.modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Genogram Editor</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <iframe 
            id="genogram-iframe"
            src="https://genogram.apps.safegenerations.org?embed=true"
            style="width: 100%; height: 70vh; border: none;"
            allow="clipboard-write"
          ></iframe>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
    
    // Setup iframe communication
    const iframe = this.modal.querySelector('#genogram-iframe');
    
    // Handle close
    this.modal.querySelector('.close-modal').onclick = () => {
      this.closeModal();
    };
    
    // Wait for iframe to load
    iframe.onload = () => {
      if (existingData) {
        iframe.contentWindow.postMessage({
          type: 'LOAD_GENOGRAM',
          data: existingData
        }, '*');
      }
    };
    
    // Listen for save
    this.messageHandler = (event) => {
      if (event.data.type === 'GENOGRAM_SAVE') {
        this.insertGenogram(event.data.data);
        this.closeModal();
      }
    };
    
    window.addEventListener('message', this.messageHandler);
  }
  
  editGenogram(blot) {
    const value = GenogramBlot.value(blot.domNode);
    this.showGenogramEditor(value.data);
  }
  
  insertGenogram(data) {
    // Request SVG export
    const iframe = this.modal.querySelector('#genogram-iframe');
    
    // Listen for SVG export
    const svgHandler = (event) => {
      if (event.data.type === 'GENOGRAM_EXPORT_SVG') {
        const range = this.quill.getSelection(true);
        this.quill.insertEmbed(range.index, 'genogram', {
          data: data,
          svg: `data:image/svg+xml;base64,${btoa(event.data.svg)}`
        });
        
        window.removeEventListener('message', svgHandler);
      }
    };
    
    window.addEventListener('message', svgHandler);
    iframe.contentWindow.postMessage({ type: 'REQUEST_EXPORT_SVG' }, '*');
  }
  
  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
  }
}

// Initialize Quill with genogram support
const quill = new Quill('#editor', {
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['genogram'], // Add genogram button
        ['clean']
      ]
    }
  },
  theme: 'snow'
});

// Add genogram handler
new GenogramHandler(quill);
```

### Toolbar Button

Add the genogram button to your Quill toolbar:

```html
<div id="toolbar">
  <button class="ql-genogram" title="Insert Genogram">
    <svg viewBox="0 0 18 18">
      <circle cx="6" cy="6" r="3" stroke="currentColor" fill="none"/>
      <circle cx="12" cy="6" r="3" stroke="currentColor" fill="none"/>
      <line x1="6" y1="9" x2="9" y2="14" stroke="currentColor"/>
      <line x1="12" y1="9" x2="9" y2="14" stroke="currentColor"/>
    </svg>
  </button>
</div>
```

## API Reference

### URL Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `embed` | boolean | false | Enable embed mode |
| `theme` | string | 'light' | Color theme ('light', 'dark') |
| `compact` | boolean | false | Compact mode for small containers |
| `readonly` | boolean | false | Disable editing |

### PostMessage API

#### Messages to Genogram

**Load Data:**
```javascript
iframe.contentWindow.postMessage({
  type: 'LOAD_GENOGRAM',
  data: {
    people: [...],
    relationships: [...],
    households: [...],
    textBoxes: [...]
  }
}, origin);
```

**Request Save:**
```javascript
iframe.contentWindow.postMessage({
  type: 'REQUEST_SAVE'
}, origin);
```

**Request Enhanced Save:** (New!)
```javascript
iframe.contentWindow.postMessage({
  type: 'REQUEST_ENHANCED_SAVE'
}, origin);
```

**Request Export:**
```javascript
// Request SVG export
iframe.contentWindow.postMessage({
  type: 'REQUEST_EXPORT_SVG'
}, origin);

// Request PNG export
iframe.contentWindow.postMessage({
  type: 'REQUEST_EXPORT_PNG'
}, origin);
```

**Set Theme:**
```javascript
iframe.contentWindow.postMessage({
  type: 'SET_THEME',
  data: { theme: 'dark' }
}, origin);
```

**Focus Person:**
```javascript
iframe.contentWindow.postMessage({
  type: 'FOCUS_PERSON',
  data: { personId: '123' }
}, origin);
```

#### Messages from Genogram

**Ready:**
```javascript
{
  type: 'GENOGRAM_READY',
  version: '2.0',
  features: ['save', 'export-svg', 'export-png']
}
```

**Save Data:**
```javascript
{
  type: 'GENOGRAM_SAVE',
  data: {
    people: [...],
    relationships: [...],
    households: [...],
    textBoxes: [...],
    version: '2.0',
    savedAt: '2024-01-20T10:30:00Z'
  },
  isDirty: false
}
```

**Export Results:**
```javascript
// SVG Export
{
  type: 'GENOGRAM_EXPORT_SVG',
  svg: '<svg>...</svg>',
  width: 800,
  height: 600,
  data: {
    people: [...],
    relationships: [...],
    households: [...],
    textBoxes: [...],
    fileName: 'genogram.geno',
    version: '2.0',
    savedAt: '2024-01-20T10:30:00Z'
  }
}

// PNG Export
{
  type: 'GENOGRAM_EXPORT_PNG',
  dataUrl: 'data:image/png;base64,...',
  width: 1600,
  height: 1200,
  data: {
    people: [...],
    relationships: [...],
    households: [...],
    textBoxes: [...],
    fileName: 'genogram.geno',
    version: '2.0',
    savedAt: '2024-01-20T10:30:00Z'
  }
}
```

## Security Considerations

### 1. Origin Validation

Always validate the origin of postMessage events:

```javascript
window.addEventListener('message', (event) => {
  const allowedOrigins = [
    'https://genogram.apps.safegenerations.org',
    'http://localhost:3000' // Development only
  ];
  
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('Rejected message from:', event.origin);
    return;
  }
  
  // Process message
});
```

### 2. Content Security Policy

Add appropriate CSP headers:

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src https://genogram.apps.safegenerations.org;">
```

### 3. Data Validation

Always validate data before sending to the genogram:

```javascript
function validateGenogramData(data) {
  return (
    data &&
    Array.isArray(data.people) &&
    Array.isArray(data.relationships) &&
    data.people.every(p => p.id && typeof p.x === 'number' && typeof p.y === 'number')
  );
}
```

### 4. Cross-Origin Security Fixes

The genogram app has been updated to handle cross-origin security restrictions when embedded as an iframe:

#### Problem: Browser Security Restrictions
When embedded in an iframe, these APIs are blocked by browser security policies:
- **File System Access API** (`window.showSaveFilePicker`) - Blocked in cross-origin iframes
- **Clipboard API** (`navigator.clipboard`) - Requires permissions that iframes don't have

#### Solution: PostMessage Communication
All file operations now detect embedded mode and use `postMessage` instead:

```javascript
// In the genogram app (automatically handled)
if (isEmbedded()) {
  // Send data to parent instead of using file picker
  window.parent.postMessage({
    type: 'GENOGRAM_SAVE',
    data: genogramData
  }, '*');
} else {
  // Normal save flow for standalone app
  window.showSaveFilePicker(...);
}
```

#### What This Means for Integration:
1. **No Security Errors**: Save/export operations won't throw cross-origin errors
2. **UI Adaptation**: Buttons show appropriate text ("Save to Note" vs "Save File")
3. **Seamless Experience**: Users won't see security warnings or blocked operations

#### Testing the Security Fixes:
Use the provided test page (`test-embed-security-fixed.html`) to verify:
- Save operations work without file picker errors
- Export functions without clipboard API errors
- All data is transmitted via postMessage

## Enhanced Save Features (New!)

The genogram builder now includes enhanced save capabilities for embedded mode that provide users with multiple save options:

### Save Options Available

1. **Basic Save** (existing) - Saves to parent application only
2. **Enhanced Save** (new) - Saves to parent + downloads locally + copies to clipboard
3. **Local Download** (new) - Downloads .geno file to user's computer
4. **Clipboard Copy** (new) - Copies genogram data to clipboard (iframe-safe)

### User Interface

When embedded, users see an enhanced save toolbar that provides:

- **Main Save Button**: Quick save to parent (hover for more options)
- **Save Everything**: Enhanced save with all features
- **Download Local**: Direct .geno file download
- **Copy to Clipboard**: Copy genogram data to clipboard
- **Save to Parent**: Basic save to parent application only

### Keyboard Shortcuts

- `Ctrl+S` (or `Cmd+S`): Basic save to parent
- `Shift+Ctrl+S` (or `Shift+Cmd+S`): Enhanced save with local copy and clipboard

### Enhanced Features

#### 1. Local File Downloads
Users can download .geno files directly from the embedded iframe:

```javascript
// Works around cross-origin iframe restrictions
// Uses blob URLs and programmatic downloads
iframe.contentWindow.postMessage({
  type: 'REQUEST_EXPORT',
  format: 'geno',
  options: {
    directDownload: true,
    sendToParent: false
  }
}, origin);
```

#### 2. Clipboard Copy (Iframe-Safe)
Copies genogram data to clipboard using iframe-compatible methods:

```javascript
// Falls back through multiple clipboard APIs
// Works in most browsers within iframes
const embedInstance = getEmbedInstance();
await embedInstance.copyToClipboardEmbedded();
```

#### 3. Smart Notifications
Users receive feedback about save operations with styled notifications:
- Success: Green notifications for completed operations
- Warning: Yellow notifications for partial failures
- Info: Blue notifications for general feedback

### Integration Examples

#### Request Enhanced Save from Parent

```javascript
// Trigger enhanced save (parent + local + clipboard)
iframe.contentWindow.postMessage({
  type: 'REQUEST_ENHANCED_SAVE'
}, origin);

// Listen for completion
window.addEventListener('message', (event) => {
  if (event.data.type === 'GENOGRAM_SAVE') {
    console.log('Enhanced save completed');
    console.log('Data:', event.data.data);
    console.log('SVG included:', !!event.data.svg);
  }
});
```

#### Auto-Save with Local Backup

```javascript
// Set up auto-save that also creates local backups
setInterval(() => {
  iframe.contentWindow.postMessage({
    type: 'REQUEST_ENHANCED_SAVE'
  }, origin);
}, 300000); // Every 5 minutes
```

### Benefits for Host Applications

1. **User Choice**: Users can choose how they want to save their work
2. **Data Redundancy**: Multiple save methods ensure no data loss
3. **Better UX**: Clear feedback and multiple options improve user experience
4. **Backward Compatible**: Existing integrations continue to work unchanged

### Testing

Use the test page `test-embed-enhanced-save.html` to verify enhanced save functionality:

```bash
# Start the genogram app
npm start

# Open the enhanced save test page
open public/test-embed-enhanced-save.html
```

The test page demonstrates:
- All save options working
- Keyboard shortcuts
- Error handling and fallbacks
- Message passing between parent and iframe

## Advanced Features

### 1. Auto-Save Integration

```javascript
// Enable auto-save every 30 seconds
let autoSaveInterval = setInterval(() => {
  iframe.contentWindow.postMessage({
    type: 'REQUEST_SAVE'
  }, origin);
}, 30000);

// Handle save response
window.addEventListener('message', (event) => {
  if (event.data.type === 'GENOGRAM_SAVE') {
    // Save to your backend
    saveToDatabase(event.data.data);
  }
});
```

### 2. Collaborative Editing

```javascript
// Send cursor positions
iframe.contentWindow.postMessage({
  type: 'SHOW_REMOTE_CURSOR',
  data: {
    userId: 'user123',
    userName: 'John Doe',
    x: 100,
    y: 200,
    color: '#ff6b6b'
  }
}, origin);
```

### 3. Custom Themes

```javascript
iframe.contentWindow.postMessage({
  type: 'SET_THEME',
  data: {
    theme: {
      background: '#1a1a1a',
      primary: '#3b82f6',
      secondary: '#8b5cf6'
    }
  }
}, origin);
```

### 4. Export with Watermark

```javascript
iframe.contentWindow.postMessage({
  type: 'REQUEST_EXPORT_SVG',
  data: {
    watermark: 'CONFIDENTIAL'
  }
}, origin);
```

## Troubleshooting

### Common Issues

1. **iframe not loading:**
   - Check CSP headers
   - Ensure HTTPS in production
   - Verify origin permissions

2. **Messages not received:**
   - Check origin validation
   - Verify message structure
   - Check browser console for errors

3. **Export not working:**
   - Ensure clipboard permissions
   - Check for popup blockers
   - Verify export data size

### Debug Mode

Add `?debug=true` to enable debug logging:

```html
<iframe src="https://genogram.apps.safegenerations.org?embed=true&debug=true">
```

## Enhanced Export Features (New!)

The genogram builder now includes enhanced export capabilities for embedded mode that support both direct downloads and postMessage communication.

### Direct Download from iframe

When embedded, the genogram can now trigger downloads directly without requiring parent window intervention:

```javascript
// The genogram app exposes these functions globally in embedded mode
iframe.contentWindow.embedExport.svg({ directDownload: true });
iframe.contentWindow.embedExport.png({ directDownload: true });
iframe.contentWindow.embedExport.json({ directDownload: true });
iframe.contentWindow.embedExport.geno({ directDownload: true });
```

### New Unified Export Message Format

All exports now support a unified message format:

```javascript
{
  type: 'GENOGRAM_EXPORT',
  format: 'svg' | 'png' | 'json' | 'geno',
  data: {
    people: [...],
    relationships: [...],
    households: [...],
    textBoxes: [...]
  },
  content: '...',        // SVG string or JSON string
  dataUrl: '...',        // For PNG exports
  filename: 'genogram.svg',
  width: 800,
  height: 600
}
```

### Request Export with Options

You can now request exports with specific options:

```javascript
iframe.contentWindow.postMessage({
  type: 'REQUEST_EXPORT',
  format: 'svg',
  options: {
    directDownload: true,    // Trigger download in iframe
    sendToParent: true,      // Send data via postMessage
    scale: 2,                // For PNG exports (default: 2)
    pretty: true             // For JSON exports (default: true)
  }
}, '*');
```

### JSON Export Format

New JSON export format for data-only exports:

```javascript
{
  people: [...],
  relationships: [...],
  households: [...],
  textBoxes: [...],
  metadata: {
    exportDate: '2024-01-20T10:30:00Z',
    version: '2.0',
    exportedFrom: 'embedded-genogram-builder'
  }
}
```

### Testing Enhanced Exports

A test page is available at `/test-embed-enhanced-export.html` to demonstrate all the new export features.

## Support

- **Documentation:** [GitHub Repository](https://github.com/SafeGenerations/genogram-builder)
- **Issues:** [GitHub Issues](https://github.com/SafeGenerations/genogram-builder/issues)
- **Email:** support@safegenerations.org 