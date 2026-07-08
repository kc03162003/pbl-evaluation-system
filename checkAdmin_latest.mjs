import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmjHcNVcBnZP6wGZye1cOuwhbgR028gFs",
  authDomain: "alba-a3861.firebaseapp.com",
  projectId: "alba-a3861",
  storageBucket: "alba-a3861.firebasestorage.app",
  messagingSenderId: "133561460813",
  appId: "1:133561460813:web:200fd7c428716872f3d404",
  measurementId: "G-SBLEQDZBZ4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const adminSnap = await getDoc(doc(db, 'admin', 'global'));
  if (adminSnap.exists()) {
    const list = adminSnap.data().studentsList;
    console.log("Latest Students List:", JSON.stringify(list));
  }
  process.exit(0);
}

check();
