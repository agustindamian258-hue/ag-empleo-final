// src/app/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, logEvent } from "firebase/analytics";

const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

const missing = requiredEnvVars.filter((k) => !import.meta.env[k]);
if (missing.length > 0) {
  console.error("[AG Empleo] Variables de entorno faltantes:", missing);
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             ?? "",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         ?? "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          ?? "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              ?? "",
  measurementId:     "G-M5G5ED0YC6",
};

const app = initializeApp(firebaseConfig);

export const auth      = getAuth(app);
export const provider  = new GoogleAuthProvider();
export const db        = getFirestore(app);
export const storage   = getStorage(app);
export const analytics = getAnalytics(app);
export { logEvent };
