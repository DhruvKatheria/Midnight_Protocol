const User = require("../models/User");
const Bounty = require("../models/Bounty");
const Submission = require("../models/Submission");
const Dispute = require("../models/Dispute");
const Transaction = require("../models/Transaction");
const { v4: uuidv4 } = require("uuid");

// ========== USERS ==========
async function createUser(uid, userData) {
  try {
    const user = new User({ uid, ...userData });
    await user.save();
    return { success: true, uid };
  } catch (err) {
    if (err.code === 11000) return { success: true, uid }; // Ignore duplicate errors if re-creating
    console.error("Error creating user:", err);
    throw err;
  }
}

async function getUser(uid) {
  try {
    return await User.findOne({ uid }).lean();
  } catch (err) {
    console.error("Error fetching user:", err);
    throw err;
  }
}

async function updateUser(uid, updates) {
  try {
    await User.findOneAndUpdate({ uid }, updates);
    return { success: true };
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
}

async function getAllUsers() {
  try {
    return await User.find().lean();
  } catch (err) {
    console.error("Error fetching all users:", err);
    throw err;
  }
}

// ========== BOUNTIES ==========
async function createBounty(bountyData) {
  try {
    const bountyId = bountyData.id || uuidv4();
    const bounty = new Bounty({ ...bountyData, id: bountyId });
    await bounty.save();
    return bountyId;
  } catch (err) {
    console.error("Error creating bounty:", err);
    throw err;
  }
}

async function getBounty(bountyId) {
  try {
    return await Bounty.findOne({ id: bountyId }).lean();
  } catch (err) {
    console.error("Error fetching bounty:", err);
    throw err;
  }
}

async function getBountiesByCreator(creatorUid) {
  try {
    return await Bounty.find({
      $or: [{ sponsorUid: creatorUid }, { sponsorWallet: creatorUid }, { sponsorAddress: creatorUid }]
    }).lean();
  } catch (err) {
    console.error("Error fetching creator bounties:", err);
    throw err;
  }
}

async function getAllBounties() {
  try {
    return await Bounty.find().sort({ createdAt: -1 }).lean();
  } catch (err) {
    console.error("Error fetching all bounties:", err);
    throw err;
  }
}

async function updateBounty(bountyId, updates) {
  try {
    await Bounty.findOneAndUpdate({ id: bountyId }, updates);
    return { success: true };
  } catch (err) {
    console.error("Error updating bounty:", err);
    throw err;
  }
}

// ========== SUBMISSIONS ==========
async function createSubmission(submissionData) {
  try {
    const submissionId = submissionData.id || uuidv4();
    const submission = new Submission({ ...submissionData, id: submissionId });
    await submission.save();
    return submissionId;
  } catch (err) {
    console.error("Error creating submission:", err);
    throw err;
  }
}

async function getSubmissionsByUser(address) {
  try {
    return await Submission.find({ contributorAddress: address }).lean();
  } catch (err) {
    console.error("Error fetching submissions by user:", err);
    throw err;
  }
}

async function getSubmissionsByBounty(bountyId) {
  try {
    return await Submission.find({ bountyId }).lean();
  } catch (err) {
    console.error("Error fetching submissions:", err);
    throw err;
  }
}

async function updateSubmission(submissionId, updates) {
  try {
    await Submission.findOneAndUpdate({ id: submissionId }, updates);
    return { success: true };
  } catch (err) {
    console.error("Error updating submission:", err);
    throw err;
  }
}

// ========== DISPUTES ==========
async function createDispute(disputeData) {
  try {
    const disputeId = disputeData.id || uuidv4();
    const dispute = new Dispute({ ...disputeData, id: disputeId });
    await dispute.save();
    return disputeId;
  } catch (err) {
    console.error("Error creating dispute:", err);
    throw err;
  }
}

async function getDispute(disputeId) {
  try {
    return await Dispute.findOne({ id: disputeId }).lean();
  } catch (err) {
    console.error("Error fetching dispute:", err);
    throw err;
  }
}

async function getDisputesByBounty(bountyId) {
  try {
    return await Dispute.find({ bountyId }).lean();
  } catch (err) {
    console.error("Error fetching disputes:", err);
    throw err;
  }
}

async function getAllOpenDisputes() {
  try {
    return await Dispute.find({ status: "open" }).lean();
  } catch (err) {
    console.error("Error fetching open disputes:", err);
    throw err;
  }
}

async function getDisputesByValidator(address) {
  try {
    return await Dispute.find({
      validators: address,
      status: "open"
    }).lean();
  } catch (err) {
    console.error("Error fetching assigned disputes:", err);
    throw err;
  }
}

async function updateDispute(disputeId, updates) {
  try {
    await Dispute.findOneAndUpdate({ id: disputeId }, updates);
    return { success: true };
  } catch (err) {
    console.error("Error updating dispute:", err);
    throw err;
  }
}

// ========== TRANSACTIONS ==========
async function createTransaction(txnData) {
  try {
    const txnId = txnData.id || uuidv4();
    const transaction = new Transaction({ ...txnData, id: txnId });
    await transaction.save();
    return txnId;
  } catch (err) {
    console.error("Error creating transaction:", err);
    throw err;
  }
}

async function getTransaction(txnId) {
  try {
    return await Transaction.findOne({ id: txnId }).lean();
  } catch (err) {
    console.error("Error fetching transaction:", err);
    throw err;
  }
}

async function getAllTransactions() {
  try {
    return await Transaction.find().sort({ timestamp: -1 }).lean();
  } catch (err) {
    console.error("Error fetching all transactions:", err);
    throw err;
  }
}

async function getTransactionsByUser(uid) {
  try {
    return await Transaction.find({
      $or: [{ fromUid: uid }, { toUid: uid }, { actor: uid }]
    }).lean();
  } catch (err) {
    console.error("Error fetching transactions:", err);
    throw err;
  }
}

async function getTransactionsByBounty(bountyId) {
  try {
    return await Transaction.find({ bountyId }).lean();
  } catch (err) {
    console.error("Error fetching transactions:", err);
    throw err;
  }
}

module.exports = {
  // Users
  createUser,
  getUser,
  updateUser,
  getAllUsers,

  // Bounties
  createBounty,
  getBounty,
  getBountiesByCreator,
  getAllBounties,
  updateBounty,

  // Submissions
  createSubmission,
  getSubmissionsByBounty,
  getSubmissionsByUser,
  updateSubmission,

  // Disputes
  createDispute,
  getDispute,
  getDisputesByBounty,
  getDisputesByValidator,
  getAllOpenDisputes,
  updateDispute,

  // Transactions
  createTransaction,
  getTransaction,
  getAllTransactions,
  getTransactionsByUser,
  getTransactionsByBounty,
};
