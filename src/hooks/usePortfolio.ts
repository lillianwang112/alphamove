import { useState, useEffect, useCallback } from 'react';
import type { Portfolio, Position } from '../types';
import {
  getPositions,
  calculatePortfolio,
  updateUserData,
} from '../services/portfolioService';
import { getQuote } from '../services/marketService';
import { getUserData } from '../services/portfolioService';

export function usePortfolio(uid: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const [rawPositions, userData] = await Promise.all([
        getPositions(uid),
        getUserData(uid),
      ]);

      const currentCash = userData?.currentCash ?? 0;
      const startingCapital = userData?.startingCapital ?? 0;

      const computed = calculatePortfolio(rawPositions, currentCash, startingCapital);
      setPositions(rawPositions);
      setPortfolio(computed);
    } catch (err) {
      console.error('loadPortfolio error:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const refreshPrices = useCallback(async () => {
    if (!uid || positions.length === 0) return;
    try {
      const userData = await getUserData(uid);
      const currentCash = userData?.currentCash ?? 0;
      const startingCapital = userData?.startingCapital ?? 0;

      // Fetch latest quotes for all positions in parallel
      const quoteResults = await Promise.allSettled(
        positions.map((p) => getQuote(p.ticker))
      );

      let totalDayChange = 0;

      const updatedPositions: Position[] = positions.map((pos, idx) => {
        const result = quoteResults[idx];
        if (result.status !== 'fulfilled') return pos;

        const quote = result.value;
        const marketValue = pos.shares * quote.price;
        const totalReturn = marketValue - pos.shares * pos.avgCostBasis;
        const totalReturnPct = (quote.price - pos.avgCostBasis) / pos.avgCostBasis;
        const dayChange = pos.shares * (quote.price - quote.prevClose);
        totalDayChange += dayChange;

        return {
          ...pos,
          currentPrice: quote.price,
          marketValue,
          totalReturn,
          totalReturnPct,
        };
      });

      const totalPositionsValue = updatedPositions.reduce((sum, p) => sum + p.marketValue, 0);
      const totalValue = totalPositionsValue + currentCash;
      const allTimeReturn = totalValue - startingCapital;
      const allTimeReturnPct = startingCapital > 0 ? allTimeReturn / startingCapital : 0;
      const dayChangePct = totalValue > 0 ? totalDayChange / (totalValue - totalDayChange) : 0;

      const refreshedPortfolio: Portfolio = {
        positions: updatedPositions,
        totalValue,
        totalInvested: updatedPositions.reduce((sum, p) => sum + p.shares * p.avgCostBasis, 0),
        dayChange: totalDayChange,
        dayChangePct,
        allTimeReturn,
        allTimeReturnPct,
      };

      setPositions(updatedPositions);
      setPortfolio(refreshedPortfolio);

      // Persist updated prices to Firestore (fire and forget)
      updatedPositions.forEach(async (pos) => {
        try {
          const { updateDoc, collection } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          const positionsRef = collection(db, 'users', uid, 'positions');
          const { getDocs } = await import('firebase/firestore');
          const snap = await getDocs(positionsRef);
          const posDoc = snap.docs.find((d) => d.data().ticker === pos.ticker);
          if (posDoc) {
            await updateDoc(posDoc.ref, {
              currentPrice: pos.currentPrice,
              marketValue: pos.marketValue,
              totalReturn: pos.totalReturn,
              totalReturnPct: pos.totalReturnPct,
            });
          }
        } catch {
          // Non-critical: price persistence failed silently
        }
      });

      // Update user's lastActiveAt
      await updateUserData(uid, { lastActiveAt: (await import('firebase/firestore')).Timestamp.now() });
    } catch (err) {
      console.error('refreshPrices error:', err);
    }
  }, [uid, positions]);

  return {
    portfolio,
    positions,
    loading,
    refreshPrices,
    reload: loadPortfolio,
  };
}
