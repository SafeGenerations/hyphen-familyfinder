// ===== FILE: src-modern/hooks/useTextBoxInteraction.js =====
import { useCallback, useState } from 'react';
import { useGenogram } from '../contexts/GenogramContext';

export const useTextBoxInteraction = (textBox) => {
  const { actions } = useGenogram();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.target.isContentEditable) return;
    e.stopPropagation();
    // Set up for dragging
  }, []);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    actions.selectTextBox(textBox);
  }, [textBox, actions]);

  const handleResizeMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: textBox.width,
      height: textBox.height
    });
  }, [textBox]);

  return {
    handleMouseDown,
    handleClick,
    handleResizeMouseDown
  };
};
