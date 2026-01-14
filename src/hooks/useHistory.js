import { useState, useCallback } from 'react';

const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const save = useCallback((newState) => {
    const state = JSON.parse(JSON.stringify(newState));
    setHistory(prev => {
      const newHistory = prev.slice(0, index + 1);
      newHistory.push(state);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setIndex(prev => Math.min(prev + 1, 49));
  }, [index]);

  const undo = useCallback(() => {
    setIndex(prev => (prev > 0 ? prev - 1 : 0));
  }, []);

  const redo = useCallback(() => {
    setIndex(prev => prev + 1);
  }, []);

  return { history, index, save, undo, redo };
};

export default useHistory;
