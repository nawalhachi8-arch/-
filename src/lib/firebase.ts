// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkcuVszamn7laJZ1xWFl6LZQJM6OVg4Ho",
  authDomain: "flexyearn.firebaseapp.com",
  projectId: "flexyearn",
  storageBucket: "flexyearn.firebasestorage.app",
  messagingSenderId: "440741865536",
  appId: "1:440741865536:web:70c96f5f5bfce095fa57a5"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

export { app, db };
