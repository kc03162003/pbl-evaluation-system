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
  const adminSnap = await getDoc(doc(db, 'admin', 'globalData'));
  if (adminSnap.exists()) {
    console.log(JSON.stringify(adminSnap.data().studentsList, null, 2));
  } else {
    console.log("No admin data found");
  }
  
  const draft26 = await getDoc(doc(db, 'evaluations', 'level2_26'));
  if (draft26.exists()) {
    console.log("26's draft:", JSON.stringify(draft26.data(), null, 2));
  } else {
    console.log("26 has no draft");
  }
  process.exit(0);
}

check();
