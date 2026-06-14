import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBnzZAk3L0lgjYx5etjLXIl5s5RYGWhDdk",
  authDomain: "secretsapp-6dd0c.firebaseapp.com",
  projectId: "secretsapp-6dd0c",
  storageBucket: "secretsapp-6dd0c.appspot.com",
  messagingSenderId: "370445604275",
  appId: "1:370445604275:web:ff9450706290c4926527c6",
  measurementId: "G-1TPPMKYBRJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { sendPasswordResetEmail };

// Firebase Authentication API endpoints
export const FIREBASE_API_KEY = firebaseConfig.apiKey;
export const FIREBASE_SIGNUP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
export const FIREBASE_SIGNIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
