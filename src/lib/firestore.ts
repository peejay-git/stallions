'use client';

import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore/lite';

// Export the db instance
export { db };

// Export Firestore functions
export {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  type QueryConstraint,
  type Timestamp,
}; 