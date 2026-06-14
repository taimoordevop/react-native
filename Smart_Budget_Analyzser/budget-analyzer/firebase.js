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