import { useCallback } from 'react';
import type { XPEvent, XPSource } from '../types';
import { awardXP, getXPHistory } from '../services/xpService';

export interface AwardXPParams {
  uid: string;
  source: XPSource;
  amount: number;
  reason: string;
  tradeId?: string;
}

export function useXP() {
  const award = useCallback(
    async (
      params: AwardXPParams
    ): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> => {
      const { uid, ...xpParams } = params;
      return awardXP(uid, xpParams);
    },
    []
  );

  const getHistory = useCallback(async (uid: string): Promise<XPEvent[]> => {
    return getXPHistory(uid);
  }, []);

  return {
    awardXP: award,
    getXPHistory: getHistory,
  };
}
