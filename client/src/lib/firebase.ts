import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
const storage = getStorage(app);

console.log('Firebase initialized successfully!');

export { app, auth, storage };