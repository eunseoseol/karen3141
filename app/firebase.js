
// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdq6KCKGE9mFzSqzFpsW7z6g7x84x-zBY",
  authDomain: "eunseo-seol-31035.firebaseapp.com",
  projectId: "eunseo-seol-31035",
  storageBucket: "eunseo-seol-31035.appspot.com",
  messagingSenderId: "827389788008",
  appId: "1:827389788008:web:aab3195649830c08c8e0dd",
  measurementId: "G-GNQ3M4M15E"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);


export { db, auth, storage };
