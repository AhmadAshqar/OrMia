import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration directly from your provided code
const firebaseConfig = {
  apiKey: "AIzaSyDMtrj39cj85SBaycm-G9WBRwsANRgm7KM",
  authDomain: "ormia-798c7.firebaseapp.com",
  projectId: "ormia-798c7",
  storageBucket: "ormia-798c7.appspot.com",
  messagingSenderId: "682692386052",
  appId: "1:682692386052:web:a8ebaf7158ff7fc0b50451",
  measurementId: "G-BG8JZ3RDTN"
};

console.log('Initializing Firebase with direct configuration for project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Try to enable offline persistence for better reliability
try {
  enableIndexedDbPersistence(db)
    .then(() => console.log('Firestore persistence enabled successfully'))
    .catch(err => console.warn('Firestore persistence not available:', err.code));
} catch (err) {
  console.warn('Error setting up Firestore persistence:', err);
}

console.log('Firebase initialized successfully!');

export { app, auth, db, storage };