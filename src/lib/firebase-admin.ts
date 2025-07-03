import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// Log environment variables (without sensitive data)
console.log('Firebase Admin Environment Variables:', {
  projectId: process.env.FIREBASE_PROJECT_ID || '(missing)',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '(set)' : '(missing)',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? '(set)' : '(missing)',
  privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
  privateKeySample: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50) + '...',
});

const apps = getApps();

// Validate environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error('Missing FIREBASE_PROJECT_ID environment variable');
  throw new Error('Missing FIREBASE_PROJECT_ID environment variable');
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('Missing FIREBASE_CLIENT_EMAIL environment variable');
  throw new Error('Missing FIREBASE_CLIENT_EMAIL environment variable');
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error('Missing FIREBASE_PRIVATE_KEY environment variable');
  throw new Error('Missing FIREBASE_PRIVATE_KEY environment variable');
}

// Handle the private key properly - it might come in with escaped newlines
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// If the key doesn't contain actual newlines but has \n, replace them
if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

// If the key doesn't start with BEGIN PRIVATE KEY, something is wrong
if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
  console.error('Invalid private key format:', {
    keyLength: privateKey.length,
    keySample: privateKey.substring(0, 50) + '...',
    hasNewlines: privateKey.includes('\n'),
    hasEscapedNewlines: privateKey.includes('\\n'),
  });
  throw new Error('Invalid private key format');
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey,
};

let firebaseAdmin;
try {
  firebaseAdmin = apps.length === 0 
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : apps[0];
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  console.error('Service Account details:', {
    projectId: serviceAccount.projectId,
    clientEmail: serviceAccount.clientEmail,
    privateKeyLength: privateKey.length,
    privateKeySample: privateKey.substring(0, 50) + '...',
  });
  throw new Error('Failed to initialize Firebase Admin');
}

let adminDb: Firestore;
try {
  adminDb = getFirestore(firebaseAdmin);
  console.log('Firebase Admin Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firestore:', error);
  throw new Error('Failed to initialize Firestore');
}

let adminAuth: Auth;
try {
  adminAuth = getAuth(firebaseAdmin);
  console.log('Firebase Admin Auth initialized successfully');
} catch (error) {
  console.error('Error initializing Auth:', error);
  throw new Error('Failed to initialize Auth');
}

export { adminDb, adminAuth }; 