import { useState, useEffect, useCallback } from 'react';
import type { MorningBrief, Portfolio } from '../types';
import { getMorningBrief, generateAndSaveMorningBrief } from '../services/newsService';

export function useNewsBrief(uid: string, portfolio?: Portfolio | null, level?: number) {
  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrief = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const existing = await getMorningBrief(uid);
      setBrief(existing);
    } catch (err) {
      console.error('useNewsBrief loadBrief error:', err);
      setError('Failed to load morning brief');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  const refresh = useCallback(async () => {
    if (!uid || !portfolio) {
      console.warn('useNewsBrief refresh: uid and portfolio are required');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const generated = await generateAndSaveMorningBrief(uid, portfolio, level ?? 1);
      setBrief(generated);
    } catch (err) {
      console.error('useNewsBrief refresh error:', err);
      setError('Failed to generate morning brief');
    } finally {
      setLoading(false);
    }
  }, [uid, portfolio, level]);

  const generateIfMissing = useCallback(async () => {
    if (brief) return; // Already have today's brief
    if (!portfolio) return;
    await refresh();
  }, [brief, portfolio, refresh]);

  return {
    brief,
    loading,
    error,
    refresh,
    generateIfMissing,
  };
}
