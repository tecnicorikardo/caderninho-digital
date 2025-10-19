// src/config/firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSgstRe719NjNr0AIHkApOzOvBm-kv1go",
  authDomain: "web-gestao-37a85.firebaseapp.com",
  projectId: "web-gestao-37a85",
  storageBucket: "web-gestao-37a85.appspot.com",
  messagingSenderId: "360273086290",
  appId: "1:360273086290:web:0f47316af2dbd156039c8b",
  measurementId: "G-S9D85DW3W2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
