// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyDQ6Yc-AYYTF4Go8OMVdVV_XW_WU9VNjz4",
  authDomain: "mariliaja2.firebaseapp.com",
  projectId: "mariliaja2",
  storageBucket: "mariliaja2.firebasestorage.app",
  messagingSenderId: "142169144680",
  appId: "1:142169144680:web:999dc3cd647a62b83ceadd",
  measurementId: "G-GWB7F7P6WE"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
