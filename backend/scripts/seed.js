require("dotenv").config();
const { createUser, createBounty, createSubmission, createDispute, createTransaction } = require("../src/services/firebase");
const { v4: uuidv4 } = require("uuid");

async function seed() {
  console.log("🌱 Starting Comprehensive SettleChain Database Seed...");

  try {
    const sponsorAddress = process.env.SPONSOR_WALLET || "SPONSOR_MOCK";
    const contributorAddress = process.env.CONTRIBUTOR_WALLET || "CONTRIBUTOR_MOCK";
    const val1 = process.env.VALIDATOR1_WALLET || "VAL1_MOCK";
    const val2 = process.env.VALIDATOR2_WALLET || "VAL2_MOCK";

    // 1. Seed Users
    await createUser(sponsorAddress, { walletAddress: sponsorAddress, role: "sponsor", trustScore: 80, isStaked: false, createdAt: new Date().toISOString() });
    await createUser(contributorAddress, { walletAddress: contributorAddress, role: "contributor", trustScore: 60, isStaked: false, createdAt: new Date().toISOString() });
    await createUser(val1, { walletAddress: val1, role: "validator", trustScore: 90, isStaked: true, stakeAmount: 10, createdAt: new Date().toISOString() });
    await createUser(val2, { walletAddress: val2, role: "validator", trustScore: 95, isStaked: true, stakeAmount: 10, createdAt: new Date().toISOString() });

    console.log("✅ 4 Users seeded.");

    const activeBountyId = uuidv4();
    const resolvedBountyId = uuidv4();

    // 2. Open Bounty (With Submission)
    await createBounty({
      id: activeBountyId,
      sponsorAddress: sponsorAddress,
      title: "Design Frontend Navigation",
      description: "Looking for an expert to design a Vite landing page.",
      briefHash: "mock_hash_12345",
      amount: 150000000, // 150 ALGO
      deadline: Math.floor(Date.now()/1000) + 86400 * 7,
      status: "submitted",
      txId: "mock_tx_lock_1",
      appId: process.env.APP_ID || "1",
      createdAt: new Date().toISOString()
    });
    
    await createSubmission({
      id: uuidv4(),
      bountyId: activeBountyId,
      contributorAddress: contributorAddress,
      workUrl: "https://ipfs.io/ipfs/mock_cid_active",
      workHash: "mock_work_hash_1",
      status: "pending",
      commitmentHash: "mock_work_hash_1",
      createdAt: new Date().toISOString()
    });

    // 3. Resolved Dispute Bounty
    await createBounty({
      id: resolvedBountyId,
      sponsorAddress: sponsorAddress,
      title: "Smart Contract Audit",
      description: "Need PyTeal logic verified.",
      briefHash: "mock_hash_67890",
      amount: 400000000, // 400 ALGO
      deadline: Math.floor(Date.now()/1000) - 86400,
      status: "approved",
      txId: "mock_tx_lock_2",
      appId: process.env.APP_ID || "1",
      createdAt: new Date().toISOString()
    });

    await createDispute({
      id: uuidv4(),
      bountyId: resolvedBountyId,
      raisedBy: sponsorAddress,
      reason: "Missed the inner transaction loop vulnerability.",
      validators: [val1, val2],
      originalBrief: "Need PyTeal logic verified.",
      submissionHash: "QmAudidHash123",
      votes: { approve: 2, reject: 0 }, // Contributor won
      voterAddresses: [val1, val2],
      voters: [{address: val1, approved: true}, {address: val2, approved: true}],
      status: "resolved",
      outcome: "approved",
      createdAt: new Date().toISOString()
    });

    // 4. Transaction log mapping
    await createTransaction({ id: uuidv4(), bountyId: resolvedBountyId, action: "bounty_created", actor: sponsorAddress, txId: "tx_111", amount: 400000000, timestamp: new Date().toISOString() });
    await createTransaction({ id: uuidv4(), bountyId: activeBountyId, action: "bounty_created", actor: sponsorAddress, txId: "tx_222", amount: 150000000, timestamp: new Date().toISOString() });
    await createTransaction({ id: uuidv4(), bountyId: activeBountyId, action: "work_submitted", actor: contributorAddress, txId: "tx_333", amount: 0, timestamp: new Date().toISOString() });

    console.log("✅ Bounties, Submissions, Disputes, and Audit Timelines seeded.");
    console.log("🎉 Seeding completely finished. Ready for presentation.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
