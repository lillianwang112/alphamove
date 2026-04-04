import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getWatchlist(uid: string): Promise<string[]> {
  const ref = doc(db, 'users', uid, 'prefs', 'watchlist');
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data().tickers as string[]) || [];
}

export async function setWatchlist(uid: string, tickers: string[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'prefs', 'watchlist');
  await setDoc(ref, { tickers });
}

export async function addToWatchlist(uid: string, ticker: string): Promise<void> {
  const current = await getWatchlist(uid);
  if (current.includes(ticker)) return;
  await setWatchlist(uid, [...current, ticker]);
}

export async function removeFromWatchlist(uid: string, ticker: string): Promise<void> {
  const current = await getWatchlist(uid);
  await setWatchlist(uid, current.filter((t) => t !== ticker));
}
