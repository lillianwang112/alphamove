import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth, googleProvider } from '../config/firebase';
import { getUserData, updateUserData } from '../services/portfolioService';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        let userData = await getUserData(fbUser.uid);
        if (!userData) {
          // Create new user record
          userData = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || (fbUser.isAnonymous ? 'Guest' : 'Investor'),
            email: fbUser.email || '',
            createdAt: Timestamp.now(),
            onboardingComplete: false,
            startingCapital: 0,
            currentCash: 0,
            level: 1,
            xp: 0,
            xpToNextLevel: 200,
            totalTrades: 0,
            streak: 0,
            lastActiveAt: Timestamp.now(),
          };
          await updateUserData(fbUser.uid, userData);
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('signIn error:', err);
      throw err;
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error('signInAsGuest error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error('signOut error:', err);
      throw err;
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await updateUserData(user.uid, updates);
  };

  return {
    user,
    firebaseUser,
    loading,
    signIn,
    signInAsGuest,
    signOut,
    updateUser,
    isGuest: firebaseUser?.isAnonymous ?? false,
  };
}
