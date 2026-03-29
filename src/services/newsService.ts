import {
  doc,
  getDoc,
  setDoc,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MorningBrief, Portfolio } from '../types';
import { getCompanyNews, getMarketNews } from './marketService';
import { generateMorningBriefAI, buildMorningBrief } from './mentorService';

// ─── In-memory demo cache ─────────────────────────
const _briefCache = new Map<string, MorningBrief>();

export function getCachedBrief(uid: string): MorningBrief | null {
  const key = `${uid}-${new Date().toISOString().split('T')[0]}`;
  return _briefCache.get(key) ?? null;
}

// ─── Get Today's Brief ────────────────────────────

export async function getMorningBrief(uid: string): Promise<MorningBrief | null> {
  const cacheKey = `${uid}-${new Date().toISOString().split('T')[0]}`;
  const cached = _briefCache.get(cacheKey);
  if (cached) return cached;

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const briefRef = doc(db, 'users', uid, 'briefs', today);
    const snap = await getDoc(briefRef);
    if (!snap.exists()) return null;
    const brief = { id: snap.id, ...snap.data() } as MorningBrief;
    _briefCache.set(cacheKey, brief);
    return brief;
  } catch (err) {
    console.error('getMorningBrief error:', err);
    return null;
  }
}

// ─── Generate and Save Morning Brief ─────────────

export async function generateAndSaveMorningBrief(
  uid: string,
  portfolio: Portfolio,
  level: number
): Promise<MorningBrief> {
  const today = new Date().toISOString().split('T')[0];

  // Fetch news for each position
  const allPositionNews = await Promise.all(
    portfolio.positions.map((p) =>
      getCompanyNews(p.ticker, 2).catch(() => [])
    )
  );
  const positionNews = allPositionNews.flat();

  // Fetch general market news
  const marketNews = await getMarketNews().catch(() => []);

  // Generate AI brief
  const aiResult = await generateMorningBriefAI({
    uid,
    portfolio,
    level,
    news: positionNews,
    marketNews,
  });

  // Build MorningBrief document
  const briefData = buildMorningBrief(uid, aiResult, [...positionNews, ...marketNews]);

  // Save to Firestore: users/{uid}/briefs/{YYYY-MM-DD}
  const briefRef = doc(db, 'users', uid, 'briefs', today);
  await setDoc(briefRef, briefData);

  const brief = { id: today, ...briefData };
  _briefCache.set(`${uid}-${today}`, brief);
  return brief;
}

// suppress unused import warning
void collection;
void Timestamp;
