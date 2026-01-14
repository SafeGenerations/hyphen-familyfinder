# Cross-Origin Security Fix for Genogram Builder

## Overview

This document describes the security fixes implemented to resolve cross-origin errors when the Genogram Builder is embedded as an iframe in external applications.

## The Problem

When embedded as an iframe, the genogram app encountered these browser security errors:

1. **File System Access API Blocked**
   ```
   DOMException: Failed to execute 'showSaveFilePicker' on 'Window': 
   Cross origin sub frames aren't allowed to show a file picker.
   ```

2. **Clipboard API Blocked**
   ```
   DOMException: The Clipboard API has been blocked because of a permissions policy
   ```

These APIs are restricted in cross-origin iframes for security reasons, preventing malicious sites from accessing user files or clipboard without permission.

## The Solution

We've implemented a comprehensive solution that:
- ✅ Detects when the app is running in embedded mode
- ✅ Replaces blocked APIs with postMessage communication
- ✅ Updates UI to reflect embedded functionality
- ✅ Maintains full functionality in standalone mode

## Implementation Details

### 1. **Detection of Embedded Mode**

The app now detects embedded mode using:
```javascript
const isEmbedded = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('embed') === 'true' || window.self !== window.top;
};
```

### 2. **File Operations Hook Updates**

**File:** `src/src-modern/hooks/useFileOperations.js`

Modified to check embedded mode and use postMessage:
```javascript
const handleSave = useCallback(async () => {
  // Check if we're embedded
  const embedInstance = getEmbedInstance();
  if (isEmbedded() && embedInstance) {
    console.log('📤 Sending genogram data to parent window');
    embedInstance.saveToParent();
    return true;
  }
  
  // Normal save flow for non-embedded mode
  // ... existing file picker code
});
```

### 3. **PostMessage Integration**

**File:** `src/utils/embedIntegration.js`

Handles all communication with parent window:
- Sends genogram data instead of using file picker
- Exports SVG/PNG via postMessage
- Listens for commands from parent

### 4. **UI Adaptations**

**Files:** 
- `src/src-modern/components/UI/FloatingToolbar.js`
- `src/src-modern/components/UI/ResponsiveFloatingToolbar.js`

Buttons now show appropriate text:
- "Save to Note" instead of "Save File"
- "Export to Parent" instead of "Download"
- Load/New buttons hidden in embedded mode

### 5. **Parent Window Integration**

Example of how parent applications handle the messages:

```javascript
// Listen for save data
window.addEventListener('message', (event) => {
  if (event.data.type === 'GENOGRAM_SAVE') {
    // Save to your backend or rich text editor
    const genogramData = event.data.data;
    saveToDatabase(genogramData);
  }
  
  if (event.data.type === 'GENOGRAM_EXPORT_SVG') {
    // Handle SVG export
    const svgContent = event.data.svg;
    insertIntoRichTextEditor(svgContent);
  }
});
```

## Files Modified

1. **`src/src-modern/hooks/useFileOperations.js`**
   - Added embedded mode detection
   - Modified save/export functions to use postMessage
   - Disabled clipboard operations in embedded mode

2. **`src/utils/embedIntegration.js`**
   - Already had postMessage handlers
   - Fixed SVG/PNG export methods

3. **`src/src-modern/components/UI/FloatingToolbar.js`**
   - Added embedded mode detection
   - Changed button labels based on mode
   - Hide certain buttons in embedded mode

4. **`src/src-modern/components/UI/ResponsiveFloatingToolbar.js`**
   - Same changes as FloatingToolbar

5. **`src/App.js`**
   - Added message listener for export requests
   - Sends ready signal to parent

## Testing

### Test Page
Use `public/test-embed-security-fixed.html` to test the implementation:

```bash
# Start the genogram app
npm start

# Open the test page
open public/test-embed-security-fixed.html
```

### What to Test

1. **Save Operation**
   - Click "Save to Note" button
   - Verify no file picker error
   - Verify parent receives data

2. **Export Operation**
   - Click "Export to Parent" button
   - Verify no clipboard error
   - Verify parent receives SVG

3. **Load Data**
   - Send LOAD_GENOGRAM message
   - Verify data loads correctly

## Usage Example

### For Case Management Apps

```html
<!-- Embed the genogram -->
<iframe 
  id="genogram-editor"
  src="https://genogram.apps.safegenerations.org?embed=true"
  width="100%"
  height="600"
></iframe>

<script>
// Handle messages from genogram
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://genogram.apps.safegenerations.org') return;
  
  switch (event.data.type) {
    case 'GENOGRAM_SAVE':
      // Insert into your rich text editor
      const data = event.data.data;
      quillEditor.insertEmbed(index, 'genogram', {
        data: data,
        timestamp: new Date()
      });
      break;
      
    case 'GENOGRAM_EXPORT_SVG':
      // Handle SVG export
      const svg = event.data.svg;
      displayGenogramPreview(svg);
      break;
  }
});

// Load existing genogram
function loadGenogram(data) {
  const iframe = document.getElementById('genogram-editor');
  iframe.contentWindow.postMessage({
    type: 'LOAD_GENOGRAM',
    data: data
  }, '*');
}
</script>
```

## Benefits

1. **No Security Errors**: All operations work smoothly without browser restrictions
2. **Better Integration**: Parent app has full control over data handling
3. **Improved UX**: Clear button labels indicate embedded functionality
4. **Backward Compatible**: Standalone mode still works exactly as before

## Future Enhancements

- Add encryption for sensitive data in postMessage
- Implement origin whitelist configuration
- Add more granular permissions for embedded mode
- Support for collaborative editing features

## Support

If you encounter any issues with the embedded integration:

1. Check browser console for errors
2. Verify you're using `?embed=true` parameter
3. Ensure proper origin validation in production
4. Contact support@safegenerations.org for help 