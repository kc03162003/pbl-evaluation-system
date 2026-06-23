import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmjHcNVcBnZP6wGZye1cOuwhbgR028gFs",
  authDomain: "alba-a3861.firebaseapp.com",
  projectId: "alba-a3861",
  storageBucket: "alba-a3861.firebasestorage.app",
  messagingSenderId: "133561460813",
  appId: "1:133561460813:web:200fd7c428716872f3d404"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const group1 = [16, 17, 22, 25, 26, 27];
const group2 = [1, 11, 17, 18, 24, 20];
const group3 = [15, 19, 21, 22, 30];
const group4 = [2, 3, 12, 14, 6];
const group5 = [8, 4, 10, 4, 13];
const group6 = [29, 28, 9, 5];

const studentsList = [];
group1.forEach(id => studentsList.push({ id, group: 1 }));
group2.forEach(id => studentsList.push({ id, group: 2 }));
group3.forEach(id => studentsList.push({ id, group: 3 }));
group4.forEach(id => studentsList.push({ id, group: 4 }));
group5.forEach(id => studentsList.push({ id, group: 5 }));
group6.forEach(id => studentsList.push({ id, group: 6 }));

async function seed() {
  try {
    const docRef = doc(db, 'admin', 'global');
    await setDoc(docRef, { studentsList }, { merge: true });
    console.log("Successfully seeded studentsList to Firestore!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed:", error);
    process.exit(1);
  }
}

seed();
