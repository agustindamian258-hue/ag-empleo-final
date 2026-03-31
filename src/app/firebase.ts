// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBG0WZu-uyC1EOBk0-j2dCp8cRY3SCaiuA",
  authDomain: "ag-empleo-final1.firebaseapp.com",
  projectId: "ag-empleo-final1",
  storageBucket: "ag-empleo-final1.firebasestorage.app",
  messagingSenderId: "906358738062",
  appId: "1:906358738062:web:b9afdb2c96f0b835418ddf",
  measurementId: "G-M5G5ED0YC6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
