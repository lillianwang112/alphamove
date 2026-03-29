import { useCallback } from 'react';
import type { Trade, TradeAction, MoveRating } from '../types';
import {
  executeBuyTrade,
  executeSellTrade,
  getRecentTrades,
  getTrade,
  updateTradeAnalysis,
} from '../services/tradeService';

export interface ExecuteTradeParams {
  uid: string;
  ticker: string;
  companyName: string;
  action: TradeAction;
  shares: number;
  price: number;
  thesis: string;
  mentorPreTradeAnalysis: string;
}

export function useTrade() {
  const executeTrade = useCallback(async (params: ExecuteTradeParams): Promise<Trade> => {
    const { uid, action, ...tradeParams } = params;

    if (action === 'buy') {
      return executeBuyTrade(uid, tradeParams);
    } else {
      return executeSellTrade(uid, tradeParams);
    }
  }, []);

  const getPendingTrades = useCallback(async (uid: string): Promise<Trade[]> => {
    const trades = await getRecentTrades(uid, 50);
    return trades.filter((t) => t.status === 'pending_mentor');
  }, []);

  const cancelTrade = useCallback(async (tradeId: string): Promise<void> => {
    // For paper trading MVP, trades execute immediately.
    // Cancel is a no-op; trades can't truly be cancelled post-execution.
    void tradeId;
    console.warn('cancelTrade: trades execute immediately in MVP — cancel not supported');
  }, []);

  const applyPostAnalysis = useCallback(
    async (
      uid: string,
      tradeId: string,
      analysis: string,
      moveRating: MoveRating,
      xpEarned: number
    ): Promise<void> => {
      return updateTradeAnalysis(uid, tradeId, analysis, moveRating, xpEarned);
    },
    []
  );

  const fetchRecentTrades = useCallback(
    async (uid: string, limitCount?: number): Promise<Trade[]> => {
      return getRecentTrades(uid, limitCount);
    },
    []
  );

  const fetchTrade = useCallback(
    async (uid: string, tradeId: string): Promise<Trade | null> => {
      return getTrade(uid, tradeId);
    },
    []
  );

  return {
    executeTrade,
    getPendingTrades,
    cancelTrade,
    applyPostAnalysis,
    fetchRecentTrades,
    fetchTrade,
  };
}
