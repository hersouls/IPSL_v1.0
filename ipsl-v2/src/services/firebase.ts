import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAq9phKxBeC_VI11hM1BLFVBW55cnWsc8A',
  authDomain: 'ipsl-v1.firebaseapp.com',
  projectId: 'ipsl-v1',
  storageBucket: 'ipsl-v1.firebasestorage.app',
  messagingSenderId: '440542648742',
  appId: '1:440542648742:web:798dc85b7cce5220411767',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
