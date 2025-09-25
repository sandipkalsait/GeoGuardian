import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  RecaptchaVerifier,
} from "firebase/auth";
import type { User, UserCredential, Unsubscribe } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig as Record<string, any>);

// Realtime DB
export const db = getDatabase(app);

// Firestore
export const firestore = getFirestore(app);

// Auth
export const auth = getAuth(app);

// Anonymous login
export const signInAnon = async (): Promise<UserCredential> => signInAnonymously(auth);

// Listen for auth changes
export const onAuthChange = (callback: (user: User | null) => void): Unsubscribe =>
  onAuthStateChanged(auth, callback);

// reCAPTCHA verifier types
export type RecaptchaOptions = {
  size?: "invisible" | "normal" | "compact";
  callback?: (response: string) => void;
  expiredCallback?: () => void;
};

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

// reCAPTCHA verifier
export const getRecaptchaVerifier = (
  container: string | HTMLElement,
  options: RecaptchaOptions = {}
): RecaptchaVerifier => {
  if (!window.recaptchaVerifier) {
    // some firebase typings expect different overloads; use `any` casts to interop safely
    window.recaptchaVerifier = new RecaptchaVerifier(
      container as any,
      {
        size: options.size ?? "invisible",
        callback: options.callback ?? (() => {}),
        "expired-callback": options.expiredCallback ?? (() => {}),
      } as any,
      auth as any
    );
    // render returns a Promise<number> but it's ok to not await here
    void window.recaptchaVerifier.render();
  }
  return window.recaptchaVerifier;
};

export default app;
