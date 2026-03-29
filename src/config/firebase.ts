import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAGR5gRW8aLs6DnSASdIViJLFpKVIs5utw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'alpha-move.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'alpha-move',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'alpha-move.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '458365638189',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:458365638189:web:e363bf2a69402d14be8aa4',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
