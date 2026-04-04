import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  where,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PublicThesis, MoveRating, TradeAction, ReactionType } from '../types';

const THESES_COL = 'publicTheses';

// ─── Publish a thesis after trade confirmation ────

export async function publishThesis(params: {
  uid: string;
  displayName: string;
  ticker: string;
  companyName: string;
  action: TradeAction;
  thesis: string;
  moveRating: MoveRating | null;
  xpEarned: number;
  tradeId?: string;
}): Promise<string> {
  // Don't publish empty/placeholder theses
  if (!params.thesis || params.thesis.trim().length < 10) return '';

  const data: Omit<PublicThesis, 'id'> = {
    uid: params.uid,
    displayName: params.displayName || 'Anonymous',
    ticker: params.ticker,
    companyName: params.companyName,
    action: params.action,
    thesis: params.thesis.trim(),
    moveRating: params.moveRating,
    xpEarned: params.xpEarned,
    reactions: {},
    reactionCounts: { agree: 0, interesting: 0, learned: 0 },
    createdAt: Timestamp.now(),
    isAIGenerated: false,
    tradeId: params.tradeId,
  };

  const ref = await addDoc(collection(db, THESES_COL), data);
  return ref.id;
}

// ─── Update move rating after post-trade analysis ─

export async function updateThesisMoveRating(thesisId: string, moveRating: MoveRating, xpEarned: number): Promise<void> {
  if (!thesisId) return;
  await updateDoc(doc(db, THESES_COL, thesisId), { moveRating, xpEarned });
}

// ─── Fetch feed (latest or top rated) ────────────

export async function fetchFeed(opts: {
  sortBy: 'latest' | 'top';
  ticker?: string;
  pageSize?: number;
}): Promise<PublicThesis[]> {
  const { sortBy, ticker, pageSize = 30 } = opts;

  let q = query(
    collection(db, THESES_COL),
    sortBy === 'latest'
      ? orderBy('createdAt', 'desc')
      : orderBy('reactionCounts.agree', 'desc'),
    firestoreLimit(pageSize)
  );

  if (ticker) {
    q = query(
      collection(db, THESES_COL),
      where('ticker', '==', ticker),
      orderBy('createdAt', 'desc'),
      firestoreLimit(pageSize)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicThesis));
}

// ─── Toggle reaction ──────────────────────────────

export async function toggleReaction(
  thesisId: string,
  uid: string,
  reaction: ReactionType
): Promise<void> {
  const ref = doc(db, THESES_COL, thesisId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as PublicThesis;
  const reactions = { ...data.reactions };
  const counts = { ...data.reactionCounts };

  const existing = reactions[uid];

  if (existing === reaction) {
    // Remove reaction
    delete reactions[uid];
    counts[reaction] = Math.max(0, (counts[reaction] ?? 0) - 1);
  } else {
    // Remove old reaction if any
    if (existing) {
      counts[existing] = Math.max(0, (counts[existing] ?? 0) - 1);
    }
    // Add new reaction
    reactions[uid] = reaction;
    counts[reaction] = (counts[reaction] ?? 0) + 1;
  }

  await updateDoc(ref, { reactions, reactionCounts: counts });
}

// ─── Publish AI-generated example thesis ─────────

export async function publishAIThesis(params: {
  ticker: string;
  companyName: string;
  action: TradeAction;
  thesis: string;
}): Promise<void> {
  // Check if we already have a recent AI thesis for this ticker+action (within 24h)
  const q = query(
    collection(db, THESES_COL),
    where('isAIGenerated', '==', true),
    where('ticker', '==', params.ticker),
    where('action', '==', params.action),
    orderBy('createdAt', 'desc'),
    firestoreLimit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const latest = snap.docs[0].data() as PublicThesis;
    const age = Date.now() - latest.createdAt.toMillis();
    if (age < 24 * 60 * 60 * 1000) return; // Skip if less than 24h old
  }

  await addDoc(collection(db, THESES_COL), {
    uid: 'alpha-ai',
    displayName: 'Alpha',
    ticker: params.ticker,
    companyName: params.companyName,
    action: params.action,
    thesis: params.thesis,
    moveRating: 'great' as MoveRating,
    xpEarned: 0,
    reactions: {},
    reactionCounts: { agree: 0, interesting: 0, learned: 0 },
    createdAt: Timestamp.now(),
    isAIGenerated: true,
  });
}

// ─── Leaderboard ──────────────────────────────────

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  totalTrades: number;
  avgScore: number;
  bestRating: MoveRating;
  totalXP: number;
}

const RATING_SCORE: Record<string, number> = {
  brilliant: 100, great: 75, good: 50, inaccuracy: 30, mistake: 15, blunder: 5,
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, THESES_COL),
    where('isAIGenerated', '==', false),
    where('moveRating', '!=', null),
    orderBy('moveRating'),
    firestoreLimit(200)
  );
  const snap = await getDocs(q);
  const theses = snap.docs.map((d) => d.data() as PublicThesis);

  // Group by uid
  const byUser: Record<string, { displayName: string; scores: number[]; xp: number; ratings: MoveRating[] }> = {};
  for (const t of theses) {
    if (!t.moveRating || t.uid === 'alpha-ai') continue;
    if (!byUser[t.uid]) byUser[t.uid] = { displayName: t.displayName, scores: [], xp: 0, ratings: [] };
    byUser[t.uid].scores.push(RATING_SCORE[t.moveRating] ?? 0);
    byUser[t.uid].xp += t.xpEarned;
    byUser[t.uid].ratings.push(t.moveRating);
  }

  return Object.entries(byUser)
    .filter(([, v]) => v.scores.length >= 1)
    .map(([uid, v]) => ({
      uid,
      displayName: v.displayName,
      totalTrades: v.scores.length,
      avgScore: v.scores.reduce((a, b) => a + b, 0) / v.scores.length,
      bestRating: v.ratings.reduce((best, r) =>
        (RATING_SCORE[r] ?? 0) > (RATING_SCORE[best] ?? 0) ? r : best
      ),
      totalXP: v.xp,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 20);
}
