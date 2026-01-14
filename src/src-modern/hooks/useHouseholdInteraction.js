// ===== FILE: src-modern/hooks/useHouseholdInteraction.js =====
import { useCallback, useState } from 'react';
import { useGenogram } from '../contexts/GenogramContext';

export const useHouseholdInteraction = (household) => {
  const { state, actions } = useGenogram();
  const [draggingHousehold, setDraggingHousehold] = useState(false);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleBorderMouseDown = useCallback((e) => {
    e.stopPropagation();
    setDraggingHousehold(true);
    // Set up drag offset calculation
  }, []);

  const handleBorderClick = useCallback((e) => {
    e.stopPropagation();
    actions.selectHousehold(household);
  }, [household, actions]);

  const handleBorderRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / state.zoom;
    const y = (e.clientY - rect.top) / state.zoom;
    
    actions.setContextMenu({
      type: 'household',
      household: household,
      x: e.clientX,
      y: e.clientY,
      canvasX: x,
      canvasY: y
    });
  }, [household, state.zoom, actions]);

  const handlePointMouseDown = useCallback((e, pointIndex) => {
    e.stopPropagation();
    setDraggingPoint(pointIndex);
  }, []);

  const handlePointRightClick = useCallback((e, pointIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    actions.setContextMenu({
      type: 'household',
      household: household,
      pointIndex: pointIndex,
      x: e.clientX,
      y: e.clientY
    });
  }, [household, actions]);

  return {
    handleBorderMouseDown,
    handleBorderClick,
    handleBorderRightClick,
    handlePointMouseDown,
    handlePointRightClick
  };
};