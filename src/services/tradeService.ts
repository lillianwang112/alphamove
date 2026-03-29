import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Trade, TradeAction, MoveRating } from '../types';
import {
  addOrUpdatePosition,
  reduceOrRemovePosition,
  getUserData,
  updateUserData,
} from './portfolioService';

// ─── Execute Buy Trade ────────────────────────────

export interface BuyTradeParams {
  ticker: string;
  companyName: string;
  shares: number;
  price: number;
  thesis: string;
  mentorPreTradeAnalysis: string;
}

export async function executeBuyTrade(uid: string, params: BuyTradeParams): Promise<Trade> {
  const { ticker, companyName, shares, price, thesis, mentorPreTradeAnalysis } = params;
  const totalValue = shares * price;

  // Verify user has enough cash
  const userData = await getUserData(uid);
  if (!userData) throw new Error('User not found');
  if (userData.currentCash < totalValue) {
    throw new Error(`Insufficient cash. Need $${totalValue.toFixed(2)}, have $${userData.currentCash.toFixed(2)}`);
  }

  const now = Timestamp.now();

  // Add/update position
  await addOrUpdatePosition(uid, {
    ticker,
    companyName,
    shares,
    avgCostBasis: price,
    currentPrice: price,
    marketValue: shares * price,
    totalReturn: 0,
    totalReturnPct: 0,
    openedAt: now,
  });

  // Deduct cash and increment trade count
  await updateUserData(uid, {
    currentCash: userData.currentCash - totalValue,
    totalTrades: (userData.totalTrades || 0) + 1,
    lastActiveAt: now,
  });

  // Create trade record
  const trade: Omit<Trade, 'id'> = {
    uid,
    ticker,
    companyName,
    action: 'buy' as TradeAction,
    shares,
    priceAtExecution: price,
    totalValue,
    status: 'executed',
    thesis,
    mentorPreTradeAnalysis,
    mentorPostTradeAnalysis: '',
    moveRating: 'good',
    xpEarned: 0,
    createdAt: now,
    executedAt: now,
  };

  const tradesRef = collection(db, 'users', uid, 'trades');
  const tradeDocRef = doc(tradesRef);
  await setDoc(tradeDocRef, trade);

  return { id: tradeDocRef.id, ...trade };
}

// ─── Execute Sell Trade ───────────────────────────

export interface SellTradeParams {
  ticker: string;
  companyName: string;
  shares: number;
  price: number;
  thesis: string;
  mentorPreTradeAnalysis: string;
}

export async function executeSellTrade(uid: string, params: SellTradeParams): Promise<Trade> {
  const { ticker, companyName, shares, price, thesis, mentorPreTradeAnalysis } = params;
  const totalValue = shares * price;

  const userData = await getUserData(uid);
  if (!userData) throw new Error('User not found');

  const now = Timestamp.now();

  // Reduce or remove position
  await reduceOrRemovePosition(uid, ticker, shares, price);

  // Add proceeds to cash and increment trade count
  await updateUserData(uid, {
    currentCash: userData.currentCash + totalValue,
    totalTrades: (userData.totalTrades || 0) + 1,
    lastActiveAt: now,
  });

  // Create trade record
  const trade: Omit<Trade, 'id'> = {
    uid,
    ticker,
    companyName,
    action: 'sell' as TradeAction,
    shares,
    priceAtExecution: price,
    totalValue,
    status: 'executed',
    thesis,
    mentorPreTradeAnalysis,
    mentorPostTradeAnalysis: '',
    moveRating: 'good',
    xpEarned: 0,
    createdAt: now,
    executedAt: now,
  };

  const tradesRef = collection(db, 'users', uid, 'trades');
  const tradeDocRef = doc(tradesRef);
  await setDoc(tradeDocRef, trade);

  return { id: tradeDocRef.id, ...trade };
}

// ─── Update Trade with Post-Analysis ─────────────

export async function updateTradeAnalysis(
  uid: string,
  tradeId: string,
  analysis: string,
  moveRating: MoveRating,
  xpEarned: number
): Promise<void> {
  try {
    const tradeRef = doc(db, 'users', uid, 'trades', tradeId);
    await updateDoc(tradeRef, {
      mentorPostTradeAnalysis: analysis,
      moveRating,
      xpEarned,
      status: 'confirmed',
    });
  } catch (err) {
    console.error('updateTradeAnalysis error:', err);
    throw err;
  }
}

// ─── Get Recent Trades ────────────────────────────

export async function getRecentTrades(uid: string, limitCount = 20): Promise<Trade[]> {
  try {
    const tradesRef = collection(db, 'users', uid, 'trades');
    const q = query(tradesRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trade));
  } catch (err) {
    console.error('getRecentTrades error:', err);
    return [];
  }
}

// ─── Get Single Trade ─────────────────────────────

export async function getTrade(uid: string, tradeId: string): Promise<Trade | null> {
  try {
    const tradeRef = doc(db, 'users', uid, 'trades', tradeId);
    const snap = await getDoc(tradeRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Trade;
  } catch (err) {
    console.error('getTrade error:', err);
    return null;
  }
}
