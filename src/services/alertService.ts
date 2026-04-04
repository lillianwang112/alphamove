import {
  collection, doc, addDoc, getDocs, deleteDoc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PriceAlert {
  id: string;
  ticker: string;
  companyName: string;
  targetPrice: number;
  direction: 'above' | 'below';
  currentPriceAtSet: number;
  createdAt: Timestamp;
  triggered: boolean;
}

export async function getAlerts(uid: string): Promise<PriceAlert[]> {
  const q = query(collection(db, 'users', uid, 'alerts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert));
}

export async function addAlert(uid: string, alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'alerts'), {
    ...alert,
    createdAt: Timestamp.now(),
    triggered: false,
  });
  return ref.id;
}

export async function deleteAlert(uid: string, alertId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'alerts', alertId));
}

export async function checkAlerts(uid: string, prices: Record<string, number>): Promise<PriceAlert[]> {
  const alerts = await getAlerts(uid);
  const triggered: PriceAlert[] = [];
  for (const alert of alerts) {
    if (alert.triggered) continue;
    const price = prices[alert.ticker];
    if (price == null) continue;
    if (alert.direction === 'above' && price >= alert.targetPrice) triggered.push(alert);
    if (alert.direction === 'below' && price <= alert.targetPrice) triggered.push(alert);
  }
  return triggered;
}
