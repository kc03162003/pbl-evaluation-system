import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useDebounce } from 'react-use';

export function useDraft(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isFirstRender = useRef(true);

  // Initial fetch from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        if (key.endsWith('_31')) {
          const item = window.localStorage.getItem(key);
          if (item && isMounted) setValue(JSON.parse(item));
          return;
        }

        const docRef = doc(db, 'evaluations', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setValue(docSnap.data().value);
        } else {
          // Fallback to localStorage if no cloud data
          const item = window.localStorage.getItem(key);
          if (item && isMounted) setValue(JSON.parse(item));
        }
      } catch (error) {
        console.warn(`Error reading Firestore key "${key}":`, error);
        const item = window.localStorage.getItem(key);
        if (item && isMounted) setValue(JSON.parse(item));
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [key]);

  // Debounced save to Firestore
  useDebounce(
    async () => {
      if (!isLoaded || isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      try {
        if (!key.endsWith('_31')) {
          const docRef = doc(db, 'evaluations', key);
          await setDoc(docRef, { value }, { merge: true });
        }
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting Firestore key "${key}":`, error);
      }
    },
    2000,
    [value, isLoaded]
  );

  return [value, setValue, isLoaded];
}
