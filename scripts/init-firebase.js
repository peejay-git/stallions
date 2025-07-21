/**
 * Firebase Database Initialization Script
 * 
 * This script initializes the Firebase Firestore database with the required collections:
 * - users
 * - bounties
 * - submissions
 * 
 * It also adds sample data to get you started.
 */

// Import Firebase modules
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  getDocs,
  query,
  limit
} = require('firebase/firestore');

// Using hardcoded Firebase config instead of environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDr9yY-e7k_XN7y6bUFunyhgr8s1tj8UWM",
  authDomain: "stalliona-c3993.firebaseapp.com",
  projectId: "stalliona-c3993",
  storageBucket: "stalliona-c3993.firebasestorage.app",
  messagingSenderId: "687163256973",
  appId: "1:687163256973:web:2e76908eb3edac674572c4",
  measurementId: "G-R37E4G5Y3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data
const sampleUsers = [
  {
    uid: 'sample-sponsor-123',
    email: 'sponsor@example.com',
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
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    uid: 'sample-talent-456',
    email: 'talent@example.com',
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
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  }
];

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

const sampleSubmissions = [
  {
    bountyId: '1001',
    userId: 'sample-talent-456',
    applicantAddress: 'GDEMO000000000000000000000000000000000TALENT',
    content: 'I have implemented the wallet integration as requested. Check out the repository for the complete solution.',
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Check if a collection already has documents
 */
async function isCollectionEmpty(collectionName) {
  try {
    const querySnapshot = await getDocs(query(collection(db, collectionName), limit(1)));
    return querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking if ${collectionName} is empty:`, error);
    return true; // Assume empty on error
  }
}

/**
 * Initialize the users collection
 */
async function initializeUsers() {
  try {
    const isEmpty = await isCollectionEmpty('users');
    if (!isEmpty) {
      console.log('Users collection already contains documents. Skipping initialization.');
      return;
    }

    console.log('Initializing users collection...');
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log(`Created sample user: ${user.role} (${user.email})`);
    }
    console.log('Users collection initialized successfully.');
  } catch (error) {
    console.error('Error initializing users collection:', error);
  }
}

/**
 * Initialize the bounties collection
 */
async function initializeBounties() {
  try {
    const isEmpty = await isCollectionEmpty('bounties');
    if (!isEmpty) {
      console.log('Bounties collection already contains documents. Skipping initialization.');
      return;
    }

    console.log('Initializing bounties collection...');
    for (const bounty of sampleBounties) {
      const { id, ...bountyData } = bounty;
      await setDoc(doc(db, 'bounties', id), bountyData);
      console.log(`Created sample bounty: ${bounty.title} (ID: ${id})`);
    }
    console.log('Bounties collection initialized successfully.');
  } catch (error) {
    console.error('Error initializing bounties collection:', error);
  }
}

/**
 * Initialize the submissions collection
 */
async function initializeSubmissions() {
  try {
    const isEmpty = await isCollectionEmpty('submissions');
    if (!isEmpty) {
      console.log('Submissions collection already contains documents. Skipping initialization.');
      return;
    }

    console.log('Initializing submissions collection...');
    for (const submission of sampleSubmissions) {
      await setDoc(doc(db, 'submissions', `sample-submission-${Date.now()}`), submission);
      console.log(`Created sample submission for bounty: ${submission.bountyId}`);
    }
    console.log('Submissions collection initialized successfully.');
  } catch (error) {
    console.error('Error initializing submissions collection:', error);
  }
}

/**
 * Main initialization function
 */
async function initializeFirebase() {
  console.log('Starting Firebase database initialization...');
  
  try {
    // Initialize collections with sample data
    await initializeUsers();
    await initializeBounties();
    await initializeSubmissions();
    
    console.log('Firebase database initialization completed successfully!');
    console.log('\nYou can now use the application with the following sample accounts:');
    console.log('- Sponsor: sponsor@example.com');
    console.log('- Talent: talent@example.com');
    console.log('\nNote: These are just document entries in Firestore. To actually login with these accounts,');
    console.log('you would need to create matching users in Firebase Authentication.');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

// Run the initialization
initializeFirebase(); 