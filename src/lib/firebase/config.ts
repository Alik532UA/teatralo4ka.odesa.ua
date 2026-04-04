import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Ці дані ви знайдете в Firebase Console -> Project Settings -> Web App
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "teatralo4ka-odesa-ua.firebaseapp.com",
  projectId: "teatralo4ka-odesa-ua",
  storageBucket: "teatralo4ka-odesa-ua.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
