// Database seeding script
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    const initialTrustScore = Number(process.env.INITIAL_TRUST_SCORE || 50);

    // Seed Users Collection
    const usersData = [
      {
        uid: 'user_sponsor_001',
        walletAddress: 'SPONSOR1ADDRESS',
        email: 'sponsor@settlechain.com',
        name: 'John Sponsor',
        role: 'sponsor',
        trustScore: initialTrustScore,
        totalBountiesCreated: 5,
        totalSubmissions: 0,
        totalEarned: 0,
        profileHash: crypto.createHash('sha256').update('sponsor_profile').digest('hex'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: 'user_contributor_001',
        walletAddress: 'CONTRIBUTOR1ADDRESS',
        email: 'contributor@settlechain.com',
        name: 'Jane Developer',
        role: 'contributor',
        trustScore: initialTrustScore,
        totalBountiesCreated: 0,
        totalSubmissions: 12,
        totalEarned: 5000,
        profileHash: crypto.createHash('sha256').update('contributor_profile').digest('hex'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uid: 'user_validator_001',
        walletAddress: 'VALIDATOR1ADDRESS',
        email: 'validator@settlechain.com',
        name: 'Alice Validator',
        role: 'validator',
        trustScore: initialTrustScore,
        totalBountiesCreated: 0,
        totalSubmissions: 0,
        totalEarned: 1500,
        profileHash: crypto.createHash('sha256').update('validator_profile').digest('hex'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const user of usersData) {
      await db.collection('users').doc(user.uid).set(user);
      console.log(`Seeded user: ${user.name}`);
    }

    // Seed Bounties Collection
    const bountiesData = [
      {
        id: 'bounty_001',
        sponsorUid: 'user_sponsor_001',
        title: 'Smart Contract Security Audit',
        description: 'Audit the escrow smart contract for security vulnerabilities',
        amount: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'open',
        criteria: ['Security report', 'Vulnerability list', 'Recommendations'],
        submissions: [],
        selectedWinner: null,
        contentHash: crypto.createHash('sha256').update('bounty_content_001').digest('hex'),
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'bounty_002',
        sponsorUid: 'user_sponsor_001',
        title: 'API Documentation',
        description: 'Create comprehensive API documentation',
        amount: 500,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'in_review',
        criteria: ['Complete documentation', 'Code examples', 'Usage guide'],
        submissions: ['submission_001'],
        selectedWinner: 'user_contributor_001',
        contentHash: crypto.createHash('sha256').update('bounty_content_002').digest('hex'),
        transactionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const bounty of bountiesData) {
      await db.collection('bounties').doc(bounty.id).set(bounty);
      console.log(`Seeded bounty: ${bounty.title}`);
    }

    // Seed Submissions Collection
    const submissionsData = [
      {
        id: 'submission_001',
        bountyId: 'bounty_002',
        contributorUid: 'user_contributor_001',
        content: 'API documentation content here',
        ipfsHash: 'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        status: 'approved',
        score: 95,
        feedback: 'Excellent documentation with clear examples',
        contentHash: crypto.createHash('sha256').update('submission_content_001').digest('hex'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const submission of submissionsData) {
      await db.collection('submissions').doc(submission.id).set(submission);
      console.log(`Seeded submission: ${submission.id}`);
    }

    // Seed Transactions Collection
    const transactionsData = [
      {
        id: 'txn_001',
        type: 'bounty_creation',
        fromUid: 'user_sponsor_001',
        toUid: 'escrow_account',
        amount: 1000,
        bountyId: 'bounty_001',
        submissionId: null,
        txnHash: 'ALGO_TXN_HASH_001',
        status: 'confirmed',
        confirmationBlock: 1000000,
        metadata: {},
        createdAt: new Date(),
        confirmedAt: new Date(),
      },
      {
        id: 'txn_002',
        type: 'payment',
        fromUid: 'escrow_account',
        toUid: 'user_contributor_001',
        amount: 500,
        bountyId: 'bounty_002',
        submissionId: 'submission_001',
        txnHash: 'ALGO_TXN_HASH_002',
        status: 'confirmed',
        confirmationBlock: 1000100,
        metadata: {},
        createdAt: new Date(),
        confirmedAt: new Date(),
      },
    ];

    for (const txn of transactionsData) {
      await db.collection('transactions').doc(txn.id).set(txn);
      console.log(`Seeded transaction: ${txn.id}`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
