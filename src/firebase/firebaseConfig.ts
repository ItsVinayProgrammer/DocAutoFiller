import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = [
  ['apiKey', firebaseConfig.apiKey],
  ['authDomain', firebaseConfig.authDomain],
  ['projectId', firebaseConfig.projectId],
  ['storageBucket', firebaseConfig.storageBucket],
  ['messagingSenderId', firebaseConfig.messagingSenderId],
  ['appId', firebaseConfig.appId],
] as const;

const missingKeys = requiredKeys.filter(([, value]) => value.startsWith('YOUR_'));
export const isFirebaseConfigured = missingKeys.length === 0;

const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const db = firebaseApp ? getFirestore(firebaseApp) : null;
