// firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj3MVKJ-GPukefQ-WzY87TChD30Ee15LU",
  authDomain: "gradproject-e8c49.firebaseapp.com",
  projectId: "gradproject-e8c49",
  storageBucket: "gradproject-e8c49.appspot.com",
  messagingSenderId: "109500800802",
  appId: "1:109500800802:web:62548601ac5b05fe964f7b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const FIREBASE_DB = getFirestore(app);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// console.log('====================================');
// console.log("Firebase configuration completed");
// console.log('====================================');

export { app, FIREBASE_DB, auth };
