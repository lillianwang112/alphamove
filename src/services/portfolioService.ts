import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, Position, Portfolio } from '../types';

// ─── User CRUD ────────────────────────────────────

export async function getUserData(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as User;
  } catch (err) {
    console.error('getUserData error:', err);
    return null;
  }
}

export async function updateUserData(uid: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, updates as Record<string, unknown>);
    } else {
      await setDoc(userRef, updates);
    }
  } catch (err) {
    console.error('updateUserData error:', err);
    throw err;
  }
}

// ─── Position CRUD ────────────────────────────────

export async function getPositions(uid: string): Promise<Position[]> {
  try {
    const positionsRef = collection(db, 'users', uid, 'positions');
    const q = query(positionsRef, orderBy('openedAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Position));
  } catch (err) {
    console.error('getPositions error:', err);
    return [];
  }
}

export async function addOrUpdatePosition(
  uid: string,
  positionData: Omit<Position, 'id'>
): Promise<string> {
  try {
    const positionsRef = collection(db, 'users', uid, 'positions');
    const snap = await getDocs(positionsRef);

    // Find existing position by ticker
    const existing = snap.docs.find((d) => (d.data() as Position).ticker === positionData.ticker);

    if (existing) {
      const old = existing.data() as Position;
      // Weighted average cost basis
      const totalShares = old.shares + positionData.shares;
      const newAvgCostBasis =
        (old.shares * old.avgCostBasis + positionData.shares * positionData.avgCostBasis) /
        totalShares;

      const updated: Partial<Position> = {
        shares: totalShares,
        avgCostBasis: newAvgCostBasis,
        currentPrice: positionData.currentPrice,
        marketValue: totalShares * positionData.currentPrice,
        totalReturn: totalShares * positionData.currentPrice - totalShares * newAvgCostBasis,
        totalReturnPct: (positionData.currentPrice - newAvgCostBasis) / newAvgCostBasis,
      };

      await updateDoc(existing.ref, updated as Record<string, unknown>);
      return existing.id;
    } else {
      // Create new position
      const newDocRef = doc(positionsRef);
      const newPosition: Omit<Position, 'id'> = {
        ...positionData,
        openedAt: positionData.openedAt || Timestamp.now(),
      };
      await setDoc(newDocRef, newPosition);
      return newDocRef.id;
    }
  } catch (err) {
    console.error('addOrUpdatePosition error:', err);
    throw err;
  }
}

export async function reduceOrRemovePosition(
  uid: string,
  ticker: string,
  sharesToSell: number,
  currentPrice: number
): Promise<void> {
  try {
    const positionsRef = collection(db, 'users', uid, 'positions');
    const snap = await getDocs(positionsRef);
    const existing = snap.docs.find((d) => (d.data() as Position).ticker === ticker);

    if (!existing) throw new Error(`Position not found for ticker: ${ticker}`);

    const old = existing.data() as Position;
    const remainingShares = old.shares - sharesToSell;

    if (remainingShares <= 0) {
      await deleteDoc(existing.ref);
    } else {
      const updated: Partial<Position> = {
        shares: remainingShares,
        currentPrice,
        marketValue: remainingShares * currentPrice,
        totalReturn: remainingShares * currentPrice - remainingShares * old.avgCostBasis,
        totalReturnPct: (currentPrice - old.avgCostBasis) / old.avgCostBasis,
      };
      await updateDoc(existing.ref, updated as Record<string, unknown>);
    }
  } catch (err) {
    console.error('reduceOrRemovePosition error:', err);
    throw err;
  }
}

export async function removePosition(uid: string, positionId: string): Promise<void> {
  try {
    const posRef = doc(db, 'users', uid, 'positions', positionId);
    await deleteDoc(posRef);
  } catch (err) {
    console.error('removePosition error:', err);
    throw err;
  }
}

// ─── Portfolio Calculation ────────────────────────

export function calculatePortfolio(
  positions: Position[],
  currentCash: number,
  startingCapital: number
): Portfolio {
  const totalInvested = positions.reduce((sum, p) => sum + p.shares * p.avgCostBasis, 0);
  const totalPositionsValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalValue = totalPositionsValue + currentCash;

  const allTimeReturn = totalValue - startingCapital;
  const allTimeReturnPct = startingCapital > 0 ? allTimeReturn / startingCapital : 0;

  // dayChange requires prevClose data — refreshed when prices update
  const dayChange = 0;
  const dayChangePct = 0;

  return {
    positions,
    totalValue,
    totalInvested,
    dayChange,
    dayChangePct,
    allTimeReturn,
    allTimeReturnPct,
  };
}
