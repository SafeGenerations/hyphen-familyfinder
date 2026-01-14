import React, { useState } from 'react';
import { Save, Download, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { getEmbedInstance } from '../../../utils/embedIntegration';

const EmbedSaveToolbar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBasicSave = async () => {
    setIsLoading(true);
    try {
      const embedIntegration = getEmbedInstance();
      if (embedIntegration) {
        await embedIntegration.saveToParent();
      }
    } catch (error) {
      console.error('Basic save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancedSave = async () => {
    setIsLoading(true);
    try {
      const embedIntegration = getEmbedInstance();
      if (embedIntegration) {
        await embedIntegration.saveWithLocalCopy();
      }
    } catch (error) {
      console.error('Enhanced save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalDownload = async () => {
    setIsLoading(true);
    try {
      const embedIntegration = getEmbedInstance();
      if (embedIntegration && window.embedExport) {
        await window.embedExport.geno({ directDownload: true, sendToParent: false });
      }
    } catch (error) {
      console.error('Local download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsLoading(true);
    try {
      const embedIntegration = getEmbedInstance();
      if (embedIntegration) {
        const success = await embedIntegration.copyToClipboardEmbedded();
        if (success) {
          embedIntegration.showNotification('✅ Copied to clipboard!', 'success');
        } else {
          embedIntegration.showNotification('⚠️ Clipboard not available', 'warning');
        }
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    transition: 'all 0.2s ease',
    minWidth: '120px',
    justifyContent: 'flex-start'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end'
      }}
    >
      {/* Expanded options */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '200px'
          }}
        >
          <button
            onClick={handleEnhancedSave}
            style={{
              ...primaryButtonStyle,
              backgroundColor: '#10b981'
            }}
            disabled={isLoading}
            title="Save to parent app, copy to clipboard, and download locally"
          >
            <Save size={16} />
            Save Everything
          </button>

          <button
            onClick={handleLocalDownload}
            style={secondaryButtonStyle}
            disabled={isLoading}
            title="Download .geno file to your computer"
          >
            <Download size={16} />
            Download Local
          </button>

          <button
            onClick={handleCopyToClipboard}
            style={secondaryButtonStyle}
            disabled={isLoading}
            title="Copy genogram data to clipboard"
          >
            <Copy size={16} />
            Copy to Clipboard
          </button>

          <button
            onClick={handleBasicSave}
            style={secondaryButtonStyle}
            disabled={isLoading}
            title="Save to parent application only"
          >
            <Save size={16} />
            Save to Parent
          </button>
        </div>
      )}

      {/* Main save button */}
      <button
        onClick={isExpanded ? () => setIsExpanded(false) : handleBasicSave}
        onMouseEnter={() => !isExpanded && setIsExpanded(true)}
        style={{
          ...primaryButtonStyle,
          fontSize: '16px',
          fontWeight: '600',
          padding: '12px 20px',
          gap: '10px'
        }}
        disabled={isLoading}
        title="Save to parent application (Ctrl+S) • Hover for more options"
      >
        <Save size={18} />
        Save
        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {/* Click outside to close */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1
          }}
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default EmbedSaveToolbar; 