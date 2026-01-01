// src/config/firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbYh9oAV4H5EPZJytRZq4HM4DG7q0iYIc",
  authDomain: "bloquinhodigital.firebaseapp.com",
  projectId: "bloquinhodigital",
  storageBucket: "bloquinhodigital.firebasestorage.app",
  messagingSenderId: "16911555826",
  appId: "1:16911555826:web:addd018a6120ee67ef846b",
  measurementId: "G-K6H8VS1F95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);
