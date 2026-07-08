import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc, setDoc } from "firebase/firestore";

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

async function fix26() {
  try {
    const docRef = doc(db, 'evaluations', 'level2_26');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.value && Array.isArray(data.value.peerEvals)) {
        // Remove ALL records related to 23
        const newPeerEvals = data.value.peerEvals.filter(pe => String(pe.id) !== "23");
        data.value.peerEvals = newPeerEvals;
        await setDoc(docRef, data);
        console.log("Successfully purged 23 from 26's draft.");
      }
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

fix26();
