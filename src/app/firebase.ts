import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBG0WZu-uyC1EOBk0-j2dCp8cRY3SCaiuA",
  authDomain: "ag-empleo-final1.firebaseapp.com",
  projectId: "ag-empleo-final1",
  storageBucket: "ag-empleo-final1.firebasestorage.app",
  messagingSenderId: "906358738062",
  appId: "1:906358738062:web:b9afdb2c96f0b835418ddf",
};

const app = initializeApp(firebaseConfig);

// 🔐 Auth (login Google)
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// 🧠 Base de datos
export const db = getFirestore(app);
