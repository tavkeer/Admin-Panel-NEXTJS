// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: 'AIzaSyD4z6C2BQSj2Lew0jdZCNm7_xjCWhXOIKo',
    appId: '1:293506595326:web:0ca979f485b4a7635f28af',
    messagingSenderId: '293506595326',
    projectId: 'shehjaar-b0692',
    authDomain: 'shehjaar-b0692.firebaseapp.com',
    storageBucket: 'shehjaar-b0692.firebasestorage.app',
    measurementId: 'G-R121K3YGTL',
};

const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
export const db = getFirestore(app);
