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

// ─── Get Today's Brief ────────────────────────────

export async function getMorningBrief(uid: string): Promise<MorningBrief | null> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const briefRef = doc(db, 'users', uid, 'briefs', today);
    const snap = await getDoc(briefRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as MorningBrief;
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

  return { id: today, ...briefData };
}

// suppress unused import warning
void collection;
void Timestamp;
