/**
 * Firebase Authentication and Database Initialization Script
 * 
 * This script:
 * 1. Creates sample users in Firebase Authentication
 * 2. Creates corresponding user documents in Firestore
 * 3. Initializes bounties and submissions collections
 * 
 * IMPORTANT: This script requires admin access to Firebase. 
 * You need to generate a service account key from the Firebase console.
 */

// Firebase Admin SDK
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Load service account credentials
let serviceAccount;
try {
  // Skip this check during build processes
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    console.log('Running in Vercel production environment, skipping Firebase admin initialization');
    process.exit(0);
  }
  
  serviceAccount = require('../firebase-service-account.json');
} catch (error) {
  console.error('Error loading service account file:');
  console.error('Please create a firebase-service-account.json file in the project root.');
  console.error('You can generate this file from the Firebase console:');
  console.error('  1. Go to Project Settings > Service accounts');
  console.error('  2. Click "Generate new private key"');
  console.error('  3. Save the file as firebase-service-account.json in the project root');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping Firebase admin initialization in production environment');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

// Sample users
const sampleUsers = [
  {
    email: 'sponsor@example.com',
    password: 'password123',
    displayName: 'Sample Sponsor',
    role: 'sponsor',
    profileData: {
      firstName: 'Sample',
      lastName: 'Sponsor',
      username: 'samplesponsor',
    },
    wallet: {
      address: 'GDEMO000000000000000000000000000000000SPONSOR',
      publicKey: 'GDEMO000000000000000000000000000000000SPONSOR',
      network: 'TESTNET'
    }
  },
  {
    email: 'talent@example.com',
    password: 'password123',
    displayName: 'Sample Talent',
    role: 'talent',
    profileData: {
      firstName: 'Sample',
      lastName: 'Talent',
      username: 'sampletalent',
    },
    wallet: {
      address: 'GDEMO000000000000000000000000000000000TALENT',
      publicKey: 'GDEMO000000000000000000000000000000000TALENT',
      network: 'TESTNET'
    }
  }
];

// Sample bounties
const sampleBounties = [
  {
    id: '1001', // This would be the document ID
    title: 'Build a Stellar Wallet Integration',
    description: `# Project Overview
Build a reusable component that allows users to connect their Stellar wallets to our application.

# Requirements
- Support for Freighter, Albedo, and xBull wallets
- Proper error handling
- Clean UI/UX
- TypeScript implementation

# Deliverables
- React component
- Documentation
- Unit tests

# Timeline
- 2 weeks from acceptance`,
    category: 'DEVELOPMENT',
    skills: ['React', 'TypeScript', 'Stellar'],
    status: 'OPEN',
    reward: {
      amount: '1000',
      asset: 'USDC',
    },
    distribution: [{ percentage: 100, position: 1 }],
    owner: 'GDEMO000000000000000000000000000000000SPONSOR',
    submissionDeadline: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '1002', // This would be the document ID
    title: 'Design a UI Kit for Blockchain Application',
    description: `# Project Overview
Create a comprehensive UI kit for blockchain applications.

# Requirements
- Modern design language
- Dark and light themes
- Component library for common blockchain elements
- Figma deliverable

# Deliverables
- Figma file with all components
- Design system documentation
- Asset export

# Timeline
- 3 weeks from acceptance`,
    category: 'DESIGN',
    skills: ['UI Design', 'Figma', 'Blockchain'],
    status: 'OPEN',
    reward: {
      amount: '1500',
      asset: 'USDC',
    },
    distribution: [{ percentage: 100, position: 1 }],
    owner: 'GDEMO000000000000000000000000000000000SPONSOR',
    submissionDeadline: Date.now() + 1000 * 60 * 60 * 24 * 21, // 21 days from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample submissions
const sampleSubmissions = [
  {
    bountyId: '1001',
    userId: '', // Will be filled with actual UID after user creation
    applicantAddress: 'GDEMO000000000000000000000000000000000TALENT',
    content: 'I have implemented the wallet integration as requested. Check out the repository for the complete solution.',
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Check if a collection is empty
 */
async function isCollectionEmpty(collectionPath) {
  try {
    const snapshot = await db.collection(collectionPath).limit(1).get();
    return snapshot.empty;
  } catch (error) {
    console.error(`Error checking if ${collectionPath} is empty:`, error);
    return true; // Assume empty on error
  }
}

/**
 * Create a user in Firebase Authentication and Firestore
 */
async function createUser(userData) {
  try {
    // Check if user already exists
    try {
      const userRecord = await auth.getUserByEmail(userData.email);
      console.log(`User ${userData.email} already exists with UID: ${userRecord.uid}`);
      return userRecord.uid;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // User doesn't exist, continue with creation
    }

    // Create user in Authentication
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
    });

    const uid = userRecord.uid;
    console.log(`Created auth user: ${userData.email} with UID: ${uid}`);

    // Create user document in Firestore
    await db.collection('users').doc(uid).set({
      uid,
      email: userData.email,
      role: userData.role,
      profileData: userData.profileData,
      wallet: userData.wallet,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });

    console.log(`Created Firestore document for user: ${userData.email}`);
    return uid;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error);
    throw error;
  }
}

/**
 * Initialize users collection with sample users
 */
async function initializeUsers() {
  try {
    const isEmpty = await isCollectionEmpty('users');
    if (!isEmpty) {
      console.log('Users collection already contains documents. Skipping user initialization.');
      return {};
    }

    console.log('Initializing users in Authentication and Firestore...');
    
    const userIds = {};
    for (const userData of sampleUsers) {
      const uid = await createUser(userData);
      userIds[userData.email] = uid;
    }
    
    console.log('Users initialization completed successfully.');
    return userIds;
  } catch (error) {
    console.error('Error initializing users:', error);
    return {};
  }
}

/**
 * Initialize bounties collection
 */
async function initializeBounties() {
  try {
    const isEmpty = await isCollectionEmpty('bounties');
    if (!isEmpty) {
      console.log('Bounties collection already contains documents. Skipping bounty initialization.');
      return;
    }

    console.log('Initializing bounties collection...');
    
    for (const bounty of sampleBounties) {
      const { id, ...bountyData } = bounty;
      await db.collection('bounties').doc(id).set(bountyData);
      console.log(`Created bounty: ${bounty.title} (ID: ${id})`);
    }
    
    console.log('Bounties initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing bounties:', error);
  }
}

/**
 * Initialize submissions collection
 */
async function initializeSubmissions(userIds) {
  try {
    const isEmpty = await isCollectionEmpty('submissions');
    if (!isEmpty) {
      console.log('Submissions collection already contains documents. Skipping submission initialization.');
      return;
    }

    console.log('Initializing submissions collection...');
    
    // Add user IDs to submissions
    const submissionsWithIds = sampleSubmissions.map(submission => {
      if (submission.applicantAddress === 'GDEMO000000000000000000000000000000000TALENT') {
        submission.userId = userIds['talent@example.com'] || '';
      }
      return submission;
    });
    
    for (const submission of submissionsWithIds) {
      const docRef = db.collection('submissions').doc();
      await docRef.set(submission);
      console.log(`Created submission for bounty: ${submission.bountyId} (ID: ${docRef.id})`);
    }
    
    console.log('Submissions initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing submissions:', error);
  }
}

/**
 * Main initialization function
 */
async function initializeFirebase() {
  console.log('Starting Firebase initialization...');
  
  try {
    // Initialize users and get their IDs
    const userIds = await initializeUsers();
    
    // Initialize other collections
    await initializeBounties();
    await initializeSubmissions(userIds);
    
    console.log('\nFirebase initialization completed successfully!');
    console.log('\nYou can now use the application with the following credentials:');
    console.log('- Sponsor: sponsor@example.com / password123');
    console.log('- Talent: talent@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during Firebase initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeFirebase(); 