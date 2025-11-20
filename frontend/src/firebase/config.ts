
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCqhT65CAS_xboOgQTNqbXaJeLd0fg3CS8",
  authDomain: "ace-playground-2eeca.firebaseapp.com",
  projectId: "ace-playground-2eeca",
  storageBucket: "ace-playground-2eeca.firebasestorage.app",
  messagingSenderId: "546476200851",
  appId: "1:546476200851:web:bfaf56f515a83a68c54e66",
  measurementId: "G-9WQ7BNT5C1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);


export default app;