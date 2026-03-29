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

// Module-level cache — survives tab switches within the same session
let _cachedUser: User | null = null;
let _cachedFirebaseUser: FirebaseUser | null = null;
let _authResolved = false;

export function useAuth() {
  const [user, setUser] = useState<User | null>(_cachedUser);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(_cachedFirebaseUser);
  const [loading, setLoading] = useState(!_authResolved);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      _cachedFirebaseUser = fbUser;
      setFirebaseUser(fbUser);
      if (fbUser) {
        let userData = await getUserData(fbUser.uid);
        if (!userData) {
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
        } else {
          // Streak logic: increment if last active was yesterday, reset if older
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const lastActive = userData.lastActiveAt?.toDate?.() ?? new Date(0);
          const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
          const daysDiff = Math.round((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));

          let newStreak = userData.streak ?? 0;
          if (daysDiff === 1) {
            newStreak = newStreak + 1;
          } else if (daysDiff > 1) {
            newStreak = 1;
          }
          // daysDiff === 0 means same day → no change

          if (daysDiff >= 1) {
            const streakUpdates = { streak: newStreak, lastActiveAt: Timestamp.now() };
            await updateUserData(fbUser.uid, streakUpdates);
            userData = { ...userData, ...streakUpdates };
          }
        }
        _cachedUser = userData;
        setUser(userData);
      } else {
        _cachedUser = null;
        setUser(null);
      }
      _authResolved = true;
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
      _cachedUser = null;
      _cachedFirebaseUser = null;
      _authResolved = false;
      setUser(null);
      setFirebaseUser(null);
      // Clear onboarding localStorage so next guest session goes through onboarding
      window.localStorage.removeItem('alphamove.wizardSeen');
      window.localStorage.removeItem('alphamove.tourSeen');
    } catch (err) {
      console.error('signOut error:', err);
      throw err;
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...updates };
    _cachedUser = updated;
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
