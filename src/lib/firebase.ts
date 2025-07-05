'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Create dummy implementations for server-side
const dummyAuth = {
  currentUser: null,
  onAuthStateChanged: () => {},
  signOut: async () => {},
  signInWithPopup: async () => ({ user: null }),
};

const dummyFirestore = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: false,
        data: () => ({}),
      }),
    }),
  }),
};

const dummyStorage = {
  ref: () => ({
    put: async () => {},
    getDownloadURL: async () => '',
  }),
};

// Function to determine the best authDomain to use
const getBestAuthDomain = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
  }

  const hostname = window.location.hostname;

  // For production domains, use the current hostname directly
  if (
    hostname === 'earnstallions.xyz' ||
    hostname === 'www.earnstallions.xyz' ||
    hostname === 'earnstallions.com'
  ) {
    return hostname;
  }

  // For localhost, use the default Firebase authDomain
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log Firebase config for debugging (without sensitive data)
if (typeof window !== 'undefined') {
  console.log('Firebase authDomain:', firebaseConfig.authDomain);
  console.log('Current origin:', window.location.origin);
  console.log('Current hostname:', window.location.hostname);
}

// Initialize Firebase only on the client side
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

if (typeof window !== 'undefined') {
  try {
    // Log initialization attempt
    console.log('Initializing Firebase...');
    console.log('Firebase Config:', {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });

    // Initialize Firebase
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized');
    } else {
      app = getApps()[0];
      console.log('Using existing Firebase app');
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();

    // Set auth persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('Auth persistence set to local'))
      .catch((error) => console.error('Auth persistence error:', error));

    // Configure Google provider
    googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
    googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    console.log('Firebase services initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
} else {
  // Server-side initialization with dummy implementations
  console.log('Using dummy Firebase implementations for server-side rendering');
  auth = dummyAuth as unknown as Auth;
  db = dummyFirestore as unknown as Firestore;
  storage = dummyStorage as unknown as FirebaseStorage;
  googleProvider = new GoogleAuthProvider();
}

export { auth, db, googleProvider, storage };
