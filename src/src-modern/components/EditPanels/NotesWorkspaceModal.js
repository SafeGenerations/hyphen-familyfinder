import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {
  $getRoot,
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND
} from 'lexical';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

const NOTE_SNIPPETS = [
  {
    id: 'worries',
    label: 'Worries',
    content: 'Worries:\n- '
  },
  {
    id: 'working-well',
    label: 'Working Well',
    content: 'Working Well:\n- '
  },
  {
    id: 'needs-to-happen',
    label: 'Needs to Happen',
    content: '*Needs to happen:*\n- '
  }
];

const NOTE_STAMPS = [
  { id: 'urgent', label: 'Urgent follow-up', text: '[Urgent] Reach out this week.' },
  { id: 'share', label: 'Share with team', text: '[Share] Bring to next team meeting.' },
  { id: 'celebrate', label: 'Celebrate win', text: '[Celebrate] Highlight success with family.' }
];

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const convertPlainTextToHtml = (value = '') => {
  const trimmed = value == null ? '' : `${value}`;
  if (trimmed.trim().length === 0) {
    return '<p><br /></p>';
  }

  const paragraphs = trimmed.split(/\n{2,}/);
  return paragraphs
    .map((paragraph) => {
      const safe = escapeHtml(paragraph);
      return `<p>${safe.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
};

const modalRoot = typeof document !== 'undefined' ? document.body : null;

const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();

  const applyFormat = useCallback((format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }, [editor]);

  const insertList = useCallback((type) => {
    if (type === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      return;
    }
    if (type === 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      return;
    }
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  }, [editor]);

  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <button type="button" onClick={handleUndo} style={toolbarButtonStyle}>Undo</button>
      <button type="button" onClick={handleRedo} style={toolbarButtonStyle}>Redo</button>
      <button type="button" onClick={() => applyFormat('bold')} style={toolbarButtonStyle}>Bold</button>
      <button type="button" onClick={() => applyFormat('italic')} style={toolbarButtonStyle}>Italic</button>
      <button type="button" onClick={() => applyFormat('underline')} style={toolbarButtonStyle}>Underline</button>
      <button type="button" onClick={() => insertList('bullet')} style={toolbarButtonStyle}>• List</button>
      <button type="button" onClick={() => insertList('number')} style={toolbarButtonStyle}>1. List</button>
      <button type="button" onClick={() => insertList('none')} style={toolbarButtonStyle}>Plain</button>
    </div>
  );
};

const toolbarButtonStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '999px',
  backgroundColor: '#f8fafc',
  color: '#1f2937',
  fontSize: '12px',
  fontWeight: 600,
  padding: '6px 14px',
  cursor: 'pointer'
};

const SnippetsPanel = () => {
  const [editor] = useLexicalComposerContext();

  const insertText = useCallback((content) => {
    let scrollTargetKey = null;

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(content + '\n');

        const anchorNode = selection.anchor.getNode();
        const topLevelNode = anchorNode.getTopLevelElementOrThrow();
        scrollTargetKey = topLevelNode.getKey();
      }
    });

    if (scrollTargetKey) {
      requestAnimationFrame(() => {
        const targetElement = editor.getElementByKey(scrollTargetKey);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  }, [editor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {NOTE_SNIPPETS.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            onClick={() => insertText(snippet.content)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              color: '#1f2937',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {snippet.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {NOTE_STAMPS.map((stamp) => (
          <button
            key={stamp.id}
            type="button"
            onClick={() => insertText(`${stamp.text} `)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '999px',
              padding: '8px 14px',
              backgroundColor: '#f1f5f9',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1f2937',
              cursor: 'pointer'
            }}
          >
            {stamp.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const editorTheme = {
  paragraph: 'notes-paragraph',
  text: {
    bold: 'notes-bold',
    italic: 'notes-italic',
    underline: 'notes-underline'
  },
  list: {
    listitem: 'notes-listitem',
    listitemChecked: 'notes-listitem-checked',
    listitemUnchecked: 'notes-listitem-unchecked',
    checklist: 'notes-checklist',
    ul: 'notes-ul',
    ol: 'notes-ol'
  }
};

const styleTag = `
.notes-modal-editor {
  min-height: 320px;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid #cbd5f5;
  outline: none;
  background-color: #ffffff;
  font-size: 15px;
  line-height: 1.65;
  color: #0f172a;
  max-height: 480px;
  overflow-y: auto;
}
.notes-modal-editor:focus {
  box-shadow: 0 0 0 2px #c7d2fe;
}
.notes-paragraph {
  margin: 0 0 12px 0;
}
.notes-bold {
  font-weight: 700;
}
.notes-italic {
  font-style: italic;
}
.notes-underline {
  text-decoration: underline;
}
.notes-ul {
  padding-left: 24px;
  margin: 0 0 12px 0;
}
.notes-ol {
  padding-left: 24px;
  margin: 0 0 12px 0;
}
.notes-listitem {
  margin-bottom: 6px;
}
`;

const GlobalStyles = () => (
  <style>
    {styleTag}
  </style>
);

const NotesWorkspaceModal = ({
  isOpen,
  initialValue,
  onChange,
  onSave,
  onDismiss,
  nodeLabel
}) => {
  const [pendingDismiss, setPendingDismiss] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, onDismiss]);

  const initialHtml = useMemo(() => {
    if (initialValue?.html && initialValue.html.trim().length > 0) {
      return initialValue.html;
    }
    if (initialValue?.text && initialValue.text.trim().length > 0) {
      return convertPlainTextToHtml(initialValue.text);
    }
    return '<p></p>';
  }, [initialValue]);

  const handleEditorChange = useCallback((editorState, editor) => {
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor);
      const text = $getRoot().getTextContent();
      onChange?.({ html, text });
    });
  }, [onChange]);

  const initialConfig = useMemo(() => ({
    namespace: 'notes-workspace',
    theme: editorTheme,
    onError(error) {
      throw error;
    },
    nodes: [ListNode, ListItemNode],
    editorState: (editor) => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        if (initialHtml) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);

          if (nodes.length > 0) {
            let appended = false;
            nodes.forEach((node) => {
              if ($isElementNode(node)) {
                root.append(node);
                appended = true;
                return;
              }

              if ($isTextNode(node) && node.getTextContent().trim().length > 0) {
                const paragraph = $createParagraphNode();
                paragraph.append(node);
                root.append(paragraph);
                appended = true;
              }
            });

            if (appended) {
              root.select();
              return;
            }
          }
        }

        root.append($createParagraphNode());
        root.select();
      });
    }
  }), [initialHtml]);

  if (!isOpen || !modalRoot) {
    return null;
  }

  const showConfirm = pendingDismiss;

  const handleDismissRequest = () => {
    setPendingDismiss(true);
  };

  const handleExitWithoutSaving = () => {
    setPendingDismiss(false);
    onDismiss();
  };

  const handleContinueEditing = () => {
    setPendingDismiss(false);
  };

  const handleSaveAndExit = () => {
    setPendingDismiss(false);
    onSave();
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px'
    }}>
      <div style={{
        width: 'min(960px, 100%)',
        backgroundColor: '#f8fafc',
        borderRadius: '20px',
        boxShadow: '0 24px 60px -20px rgba(30, 41, 59, 0.45)',
        border: '1px solid #dbeafe',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'hidden'
      }}>
        <GlobalStyles />
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #dbeafe',
          background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Notes workspace for {nodeLabel.toLowerCase()}
          </div>
          <div style={{ fontSize: '13px', color: '#334155', marginTop: '6px', maxWidth: '640px' }}>
            Capture detailed narrative, case notes, and planning context. Edits save directly back to the selected record when you hit Save.
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
          padding: '24px 28px',
          overflowY: 'auto'
        }}>
          <LexicalComposer initialConfig={initialConfig}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ToolbarPlugin />
              <div style={{ position: 'relative' }}>
                <RichTextPlugin
                  contentEditable={(
                    <ContentEditable className="notes-modal-editor" />
                  )}
                  placeholder={(
                    <div style={{
                      position: 'absolute',
                      top: '18px',
                      left: '20px',
                      color: '#94a3b8',
                      fontSize: '15px'
                    }}>
                      Start typing to document context, meetings, and next steps...
                    </div>
                  )}
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </div>
              <HistoryPlugin />
              <ListPlugin />
              <AutoFocusPlugin />
              <OnChangePlugin onChange={handleEditorChange} ignoreSelectionChange={false} />
              <SnippetsPanel />
            </div>
          </LexicalComposer>
        </div>

        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid #dbeafe',
          backgroundColor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Tip: Use snippets to jump-start structure, then fill in narrative details.
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleDismissRequest}
              style={{
                border: '1px solid #cbd5f5',
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                fontSize: '13px',
                fontWeight: 600,
                padding: '12px 24px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              style={{
                border: 'none',
                borderRadius: '999px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                padding: '12px 28px',
                cursor: 'pointer',
                boxShadow: '0 18px 38px -18px rgba(79, 70, 229, 0.6)'
              }}
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: 'min(460px, 100%)',
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 20px 45px -20px rgba(15, 23, 42, 0.35)',
            border: '1px solid #dbeafe',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            padding: '24px 26px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Exit without saving?
              </div>
              <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                You have unsaved updates in this workspace. Choose how you’d like to proceed.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSaveAndExit}
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px 18px',
                  cursor: 'pointer'
                }}
              >
                Save and Exit
              </button>
              <button
                type="button"
                onClick={handleContinueEditing}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px 18px',
                  cursor: 'pointer'
                }}
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={handleExitWithoutSaving}
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: '#e2e8f0',
                  color: '#0f172a',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '12px 18px',
                  cursor: 'pointer'
                }}
              >
                Exit Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, modalRoot);
};

export default NotesWorkspaceModal;
