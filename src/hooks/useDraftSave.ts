import { useState, useEffect } from 'react';

export function useDraftSave<T>(key: string, initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    try {
      return saved ? JSON.parse(saved) : initialState;
    } catch (e) {
      console.error("Error parsing draft from localStorage", e);
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
