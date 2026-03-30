'use client';

import { useState, useCallback } from 'react';
import type { ClassroomData } from '@/types';

interface ClassroomState {
  data: ClassroomData | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

export function useClassroom(idToken: string | null) {
  const [state, setState] = useState<ClassroomState>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const fetchClassroom = useCallback(async () => {
    if (!idToken) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/classroom', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: ClassroomData = await response.json();
      setState({ data, loading: false, error: null, lastFetched: new Date() });
    } catch (err) {
      console.error('Classroom fetch error:', err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'לא הצלחנו לטעון את המשימות מ-Google Classroom' 
      }));
    }
  }, [idToken]);

  return { ...state, fetchClassroom };
}
