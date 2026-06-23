import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export const getStudentEvaluations = async (studentId) => {
  const evals = { l1: null, l2: null, l3: null };
  for (let i = 1; i <= 3; i++) {
    const docSnap = await getDoc(doc(db, 'evaluations', `level${i}_${studentId}`));
    if (docSnap.exists()) {
      evals[`l${i}`] = docSnap.data().value;
    }
  }
  return evals;
};

export const saveEvaluation = async (key, value) => {
  await setDoc(doc(db, 'evaluations', key), { value }, { merge: true });
};

export const getAdminData = async () => {
  const docSnap = await getDoc(doc(db, 'admin', 'global'));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const saveAdminData = async (data) => {
  await setDoc(doc(db, 'admin', 'global'), data, { merge: true });
};

export const getUserStatus = async (userId) => {
  const docSnap = await getDoc(doc(db, 'userStatus', String(userId)));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const saveUserStatus = async (userId, data) => {
  await setDoc(doc(db, 'userStatus', String(userId)), data, { merge: true });
};

export const getAllEvaluations = async () => {
  const snapshot = await getDocs(collection(db, 'evaluations'));
  const data = {};
  snapshot.forEach(doc => {
    data[doc.id] = doc.data().value;
  });
  return data;
};
