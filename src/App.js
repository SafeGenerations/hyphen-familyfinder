// src/App.js
import React, { useState, useEffect } from 'react';
import ModernGenogramApp from './src-modern/ModernGenogramApp';
import TermsModal from './TermsModal';
import './App.css';
import './src-modern/styles/embed.css'; // Import embed styles

function App() {
  const [agreed, setAgreed] = useState(
    localStorage.getItem('genogram_terms_agreed') === 'true'
  );

  // Check if we're in embed mode
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbedMode = urlParams.get('embed') === 'true';
  const isCompactEmbed = isEmbedMode && urlParams.get('compact') === 'true';
  const themeParam = urlParams.get('theme');
  // New: allow moving the toggle to avoid covering the genogram name
  const togglePosParam = (urlParams.get('togglePos') || 'br').toLowerCase();
  const togglePosClass = ['tr', 'br', 'tl', 'bl'].includes(togglePosParam) ? `pos-${togglePosParam}` : 'pos-br';

  // Toast for user feedback on mode switch
  const [modeToast, setModeToast] = useState('');
  useEffect(() => {
    if (!modeToast) return;
    const t = setTimeout(() => setModeToast(''), 1400);
    return () => clearTimeout(t);
  }, [modeToast]);

  // Determine initial interaction mode (URL > localStorage > capability)
  const [interactionMode, setInteractionMode] = useState(() => {
    const qpMode = (urlParams.get('interaction') || urlParams.get('mode') || '').toLowerCase();
    if (qpMode === 'touch' || qpMode === 'desktop') return qpMode;
    const stored = localStorage.getItem('genogram_interaction_mode');
    if (stored === 'touch' || stored === 'desktop') return stored;
    const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return touchCapable ? 'touch' : 'desktop';
  });

  // Reflect interaction mode globally (classes, attribute, localStorage, event)
  useEffect(() => {
    document.body.classList.remove('touch-mode', 'desktop-mode');
    document.body.classList.add(`${interactionMode}-mode`);
    document.body.setAttribute('data-interaction', interactionMode);
    document.body.setAttribute('data-pointer', interactionMode === 'touch' ? 'coarse' : 'fine');

    // Mirror on <html> for broader CSS hooks
    document.documentElement.classList.remove('touch-mode', 'desktop-mode');
    document.documentElement.classList.add(`${interactionMode}-mode`);
    document.documentElement.setAttribute('data-interaction', interactionMode);
    document.documentElement.setAttribute('data-pointer', interactionMode === 'touch' ? 'coarse' : 'fine');

    window.__interactionMode = interactionMode;
    window.__isTouchPreferred = interactionMode === 'touch';
    localStorage.setItem('genogram_interaction_mode', interactionMode);
    window.dispatchEvent(
      new CustomEvent('interaction-mode-changed', { detail: { mode: interactionMode } })
    );
  }, [interactionMode]);

  // Minimal styles for the toggle (once)
  useEffect(() => {
    const styleId = 'interaction-toggle-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .interaction-toggle {
        position: fixed;
        z-index: 1000;
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,0.15);
        background: var(--gb-toggle-bg, #fff);
        color: var(--gb-toggle-fg, #333);
        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        cursor: pointer;
        user-select: none;
        opacity: 0.9;
      }
      /* Safe-area aware positions (default bottom-right) */
      .interaction-toggle.pos-br { bottom: calc(12px + env(safe-area-inset-bottom)); right: calc(12px + env(safe-area-inset-right)); top: auto; left: auto; }
      .interaction-toggle.pos-tr { top: calc(12px + env(safe-area-inset-top)); right: calc(12px + env(safe-area-inset-right)); bottom: auto; left: auto; }
      .interaction-toggle.pos-bl { bottom: calc(12px + env(safe-area-inset-bottom)); left: calc(12px + env(safe-area-inset-left)); top: auto; right: auto; }
      .interaction-toggle.pos-tl { top: calc(12px + env(safe-area-inset-top)); left: calc(12px + env(safe-area-inset-left)); bottom: auto; right: auto; }

      body[data-theme="dark"] .interaction-toggle {
        background: var(--gb-toggle-bg-dark, #1e1e1e);
        color: var(--gb-toggle-fg-dark, #eee);
        border-color: rgba(255,255,255,0.18);
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      }
      body.embed-mode.compact .interaction-toggle { display: none !important; }
      @media (pointer: coarse) {
        .interaction-toggle { padding: 10px 14px; font-size: 14px; }
      }
      @media print { .interaction-toggle { display: none !important; } }

      /* Touch-friendly defaults for canvases/SVG when in touch mode */
      body[data-interaction="touch"] svg { touch-action: pan-x pan-y; }
      body[data-interaction="touch"] * { -webkit-tap-highlight-color: transparent; }

      /* Small toast for mode feedback */
      .interaction-toast {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: calc(56px + env(safe-area-inset-bottom));
        z-index: 1000;
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 12px;
        background: rgba(0,0,0,0.75);
        color: #fff;
        pointer-events: none;
        opacity: 0;
        transition: opacity 150ms ease;
      }
      .interaction-toast.show { opacity: 1; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    // Apply embed mode class to body
    if (isEmbedMode) {
      document.body.classList.add('embed-mode');

      // Compact mode
      if (isCompactEmbed) {
        document.body.classList.add('compact');
      }

      // Apply theme if specified
      if (themeParam) {
        document.body.setAttribute('data-theme', themeParam);
      }

      // Send ready signal to parent
      window.parent.postMessage({ type: 'genogram-ready' }, '*');

      // Listen for export requests from parent
      const handleMessage = (event) => {
        // In production, validate event.origin
        if (event.data.type === 'request-export') {
          if (window.__embedIntegration) {
            window.__embedIntegration.exportSVGToParent();
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    } else {
      document.body.classList.remove('embed-mode', 'compact');
      document.body.removeAttribute('data-theme');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('embed-mode', 'compact');
      document.body.removeAttribute('data-theme');
    };
  }, [isEmbedMode, isCompactEmbed, themeParam]);

  const handleAgree = () => {
    localStorage.setItem('genogram_terms_agreed', 'true');
    setAgreed(true);
  };

  // Update URL param, notify parent (embed), and toggle mode
  const toggleInteractionMode = () => {
    setInteractionMode((prev) => {
      const next = prev === 'touch' ? 'desktop' : 'touch';
      // Persist in URL without reload so other parts that read URL can react
      const params = new URLSearchParams(window.location.search);
      params.set('interaction', next);
      const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
      // Optional global hook for consumers
      if (typeof window.__onInteractionModeChanged === 'function') {
        try { window.__onInteractionModeChanged(next); } catch (_) {}
      }
      // Notify parent when embedded
      if (isEmbedMode && window.parent) {
        window.parent.postMessage({ type: 'interaction-mode-changed', mode: next }, '*');
      }
      // Toast feedback
      setModeToast(next === 'touch' ? 'Touch mode' : 'Desktop mode');
      return next;
    });
  };

  const showInteractionToggle = !isCompactEmbed;

  return (
    <>
      {/* Floating interaction mode toggle */}
      {showInteractionToggle && (
        <button
          className={`interaction-toggle ${togglePosClass}`}
          type="button"
          onClick={toggleInteractionMode}
          aria-label={`Switch to ${interactionMode === 'touch' ? 'desktop' : 'touch'} mode`}
          title={`Switch to ${interactionMode === 'touch' ? 'desktop' : 'touch'} mode`}
        >
          {interactionMode === 'touch' ? 'Switch to Desktop' : 'Switch to Touch'}
        </button>
      )}

      {/* Brief visual feedback on mode change */}
      {modeToast && <div className={`interaction-toast show`}>{modeToast} enabled</div>}

      {/* Analytics moved to index.js to avoid duplication */}
      <ModernGenogramApp key={`mode-${interactionMode}`} interactionMode={interactionMode} />
      {/* Don't show terms modal in embed mode */}
      {!isEmbedMode && <TermsModal show={!agreed} onAgree={handleAgree} />}
    </>
  );
}

export default App;