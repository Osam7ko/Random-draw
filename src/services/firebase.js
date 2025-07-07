import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⚠️ غيّر هذه البيانات حسب مشروعك في Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDTgL93UKYKaByn4znZcur4BUhy4-zrGb0",
  authDomain: "rafflenumbers-7193f.firebaseapp.com",
  projectId: "rafflenumbers-7193f",
  storageBucket: "rafflenumbers-7193f.firebasestorage.app",
  messagingSenderId: "1029234565913",
  appId: "1:1029234565913:web:3c4ee6bd20e89331db5b88",
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Reference to the collection
const numbersCollection = collection(db, "raffleNumbers");

export { db, numbersCollection, auth };
