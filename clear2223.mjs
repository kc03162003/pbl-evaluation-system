import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

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

async function clearData() {
  const ids = [22, 23];
  for (const id of ids) {
    try {
      await deleteDoc(doc(db, 'userStatus', String(id)));
      await deleteDoc(doc(db, 'evaluations', `level1_${id}`));
      await deleteDoc(doc(db, 'evaluations', `level2_${id}`));
      await deleteDoc(doc(db, 'evaluations', `level3_${id}`));
      console.log(`Cleared data for student ${id}`);
    } catch (e) {
      console.error(`Error clearing ${id}:`, e);
    }
  }
  process.exit(0);
}

clearData();
