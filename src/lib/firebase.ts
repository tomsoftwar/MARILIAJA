import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// All site features use the same Firebase project and the default Firestore database.
const app = getApps().find(existing => existing.name === '[DEFAULT]')
  || initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
