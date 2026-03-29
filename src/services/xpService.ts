import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { XPEvent, XPSource } from '../types';
import { XP_THRESHOLDS, LEVEL_CONFIGS } from '../config/constants';
import { getUserData, updateUserData } from './portfolioService';

// ─── Level Calculation ────────────────────────────

export function calculateLevel(totalXP: number): { level: number; xpToNextLevel: number } {
  let level = 1;

  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  // Cap at max level
  level = Math.min(level, LEVEL_CONFIGS.length);

  // XP needed for next level
  const nextLevelIdx = level; // 0-indexed, so level 1 → index 1
  const xpToNextLevel =
    nextLevelIdx < XP_THRESHOLDS.length
      ? XP_THRESHOLDS[nextLevelIdx] - totalXP
      : 0; // Already at max level

  return { level, xpToNextLevel: Math.max(0, xpToNextLevel) };
}

// ─── Award XP ─────────────────────────────────────

export interface AwardXPParams {
  source: XPSource;
  amount: number;
  reason: string;
  tradeId?: string;
}

export async function awardXP(
  uid: string,
  params: AwardXPParams
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const { source, amount, reason, tradeId } = params;

  const userData = await getUserData(uid);
  if (!userData) throw new Error('User not found');

  const oldLevel = userData.level;
  const newXP = userData.xp + amount;
  const { level: newLevel, xpToNextLevel } = calculateLevel(newXP);
  const leveledUp = newLevel > oldLevel;

  // Update user XP and level
  await updateUserData(uid, {
    xp: newXP,
    level: newLevel,
    xpToNextLevel,
  });

  // Record XP event
  const xpEvent: Omit<XPEvent, 'id'> = {
    uid,
    source,
    amount,
    reason,
    tradeId,
    createdAt: Timestamp.now(),
  };

  const xpEventsRef = collection(db, 'users', uid, 'xpEvents');
  const eventDocRef = doc(xpEventsRef);
  await setDoc(eventDocRef, xpEvent);

  return { newXP, newLevel, leveledUp };
}

// ─── Get XP History ───────────────────────────────

export async function getXPHistory(uid: string): Promise<XPEvent[]> {
  try {
    const xpEventsRef = collection(db, 'users', uid, 'xpEvents');
    const q = query(xpEventsRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as XPEvent));
  } catch (err) {
    console.error('getXPHistory error:', err);
    return [];
  }
}

// ─── Check Daily Trade Count ──────────────────────

export async function getTodayTradeCount(uid: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    // Count XP events from trade_outcome today
    const xpEventsRef = collection(db, 'users', uid, 'xpEvents');
    const snap = await getDocs(xpEventsRef);
    const todayTradeXP = snap.docs.filter((d) => {
      const data = d.data() as XPEvent;
      return (
        data.source === 'trade_outcome' &&
        data.createdAt.toMillis() >= todayTimestamp.toMillis()
      );
    });

    return todayTradeXP.length;
  } catch (err) {
    console.error('getTodayTradeCount error:', err);
    return 0;
  }
}

// suppress unused import warning
void updateDoc;
