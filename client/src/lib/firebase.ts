import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Log the environment variables being used
console.log('Firebase Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Firebase App ID:', import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 5) + '...');
console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 5) + '...');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`, 
  messagingSenderId: "111111111111", // Required by some Firebase versions
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is valid
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error("Firebase configuration is incomplete. Please check your environment variables.");
  console.error("Missing:", {
    apiKey: !firebaseConfig.apiKey,
    projectId: !firebaseConfig.projectId,
    appId: !firebaseConfig.appId
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase initialized successfully!');

export { app, auth, db, storage };