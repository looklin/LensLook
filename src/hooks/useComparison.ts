import { useState, useCallback } from 'react';

export interface ComparisonItem {
  id: number;
  dataUrl: string;
  name: string;
  modelId: string;
  timestamp: number;
}

export function useComparison() {
  const [items, setItems] = useState<ComparisonItem[]>([]);

  const addItem = useCallback((dataUrl: string, name: string, modelId: string) => {
    const newItem: ComparisonItem = {
      id: Date.now(),
      dataUrl,
      name,
      modelId,
      timestamp: Date.now(),
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    clearItems,
  };
}