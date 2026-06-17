import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const stateDocRef = db ? doc(db, 'copaFacil', 'mainState') : null;

export const isFirebaseEnabled = () => Boolean(stateDocRef);

export const loadFirebaseState = async () => {
  if (!stateDocRef) return null;
  const snapshot = await getDoc(stateDocRef);
  if (!snapshot.exists()) return null;
  return snapshot.data()?.state || null;
};

export const saveFirebaseState = async (state) => {
  if (!stateDocRef) return;
  await setDoc(
    stateDocRef,
    {
      state,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const subscribeFirebaseState = (onState) => {
  if (!stateDocRef) return () => {};
  return onSnapshot(stateDocRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const cloudState = snapshot.data()?.state;
    if (cloudState) onState(cloudState);
  });
};
