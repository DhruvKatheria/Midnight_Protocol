const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// In-memory database (with file persistence as backup)
const dbPath = path.join(__dirname, "../../data");
const ensureDataDir = () => {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
};

// Initialize data structures
let data = {
  bounties: {},
  submissions: {},
  disputes: {},
  transactions: {},
  users: {},
};

// Load data from disk if it exists
const loadFromDisk = () => {
  try {
    ensureDataDir();
    const filePath = path.join(dbPath, "data.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(fileData);
      console.log("✅ Data loaded from disk");
      return;
    }
  } catch (err) {
    console.warn("⚠️ Could not load data from disk:", err.message);
  }
  console.log("ℹ️ Starting with empty database");
};

// Save data to disk
const saveToDisk = () => {
  try {
    ensureDataDir();
    const filePath = path.join(dbPath, "data.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("⚠️ Could not save data to disk:", err.message);
  }
};

// Load initial data
loadFromDisk();

// ========== USERS ==========
async function createUser(uid, userData) {
  try {
    data.users[uid] = {
      uid,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveToDisk();
    return { success: true, uid };
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
}

async function getUser(uid) {
  try {
    return data.users[uid] || null;
  } catch (err) {
    console.error("Error fetching user:", err);
    throw err;
  }
}

async function updateUser(uid, updates) {
  try {
    if (data.users[uid]) {
      data.users[uid] = {
        ...data.users[uid],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToDisk();
    }
    return { success: true };
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
}

// ========== BOUNTIES ==========
async function createBounty(bountyData) {
  try {
    const bountyId = bountyData.id || uuidv4();
    data.bounties[bountyId] = {
      ...bountyData,
      id: bountyId,
      createdAt: bountyData.createdAt || new Date().toISOString(),
      updatedAt: bountyData.updatedAt || new Date().toISOString(),
    };
    saveToDisk();
    console.log("✅ Bounty created:", bountyId);
    return bountyId;
  } catch (err) {
    console.error("Error creating bounty:", err);
    throw err;
  }
}

async function getBounty(bountyId) {
  try {
    return data.bounties[bountyId] || null;
  } catch (err) {
    console.error("Error fetching bounty:", err);
    throw err;
  }
}

async function getBountiesByCreator(creatorUid) {
  try {
    return Object.values(data.bounties).filter(
      (b) => b.sponsorUid === creatorUid || b.sponsorWallet === creatorUid
    );
  } catch (err) {
    console.error("Error fetching creator bounties:", err);
    throw err;
  }
}

async function getAllBounties() {
  try {
    return Object.values(data.bounties).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch (err) {
    console.error("Error fetching all bounties:", err);
    throw err;
  }
}

async function updateBounty(bountyId, updates) {
  try {
    if (data.bounties[bountyId]) {
      data.bounties[bountyId] = {
        ...data.bounties[bountyId],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToDisk();
    }
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
    data.submissions[submissionId] = {
      ...submissionData,
      id: submissionId,
      createdAt: submissionData.createdAt || new Date().toISOString(),
      updatedAt: submissionData.updatedAt || new Date().toISOString(),
    };
    saveToDisk();
    return submissionId;
  } catch (err) {
    console.error("Error creating submission:", err);
    throw err;
  }
}

async function getSubmissionsByBounty(bountyId) {
  try {
    return Object.values(data.submissions).filter(
      (s) => s.bountyId === bountyId
    );
  } catch (err) {
    console.error("Error fetching submissions:", err);
    throw err;
  }
}

async function updateSubmission(submissionId, updates) {
  try {
    if (data.submissions[submissionId]) {
      data.submissions[submissionId] = {
        ...data.submissions[submissionId],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToDisk();
    }
    return { success: true };
  } catch (err) {
    console.error("Error updating submission:", err);
    throw err;
  }
}

// ========== DISPUTES ==========
async function createDispute(disputeData) {
  try {
    const disputeId = uuidv4();
    data.disputes[disputeId] = {
      ...disputeData,
      id: disputeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveToDisk();
    return disputeId;
  } catch (err) {
    console.error("Error creating dispute:", err);
    throw err;
  }
}

async function getDispute(disputeId) {
  try {
    return data.disputes[disputeId] || null;
  } catch (err) {
    console.error("Error fetching dispute:", err);
    throw err;
  }
}

async function getDisputesByBounty(bountyId) {
  try {
    return Object.values(data.disputes).filter((d) => d.bountyId === bountyId);
  } catch (err) {
    console.error("Error fetching disputes:", err);
    throw err;
  }
}

async function updateDispute(disputeId, updates) {
  try {
    if (data.disputes[disputeId]) {
      data.disputes[disputeId] = {
        ...data.disputes[disputeId],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToDisk();
    }
    return { success: true };
  } catch (err) {
    console.error("Error updating dispute:", err);
    throw err;
  }
}

// ========== TRANSACTIONS ==========
async function createTransaction(txnData) {
  try {
    const txnId = uuidv4();
    data.transactions[txnId] = {
      ...txnData,
      id: txnId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveToDisk();
    return txnId;
  } catch (err) {
    console.error("Error creating transaction:", err);
    throw err;
  }
}

async function getTransaction(txnId) {
  try {
    return data.transactions[txnId] || null;
  } catch (err) {
    console.error("Error fetching transaction:", err);
    throw err;
  }
}

async function getTransactionsByUser(uid) {
  try {
    return Object.values(data.transactions).filter(
      (t) => t.fromUid === uid || t.toUid === uid
    );
  } catch (err) {
    console.error("Error fetching transactions:", err);
    throw err;
  }
}

async function getTransactionsByBounty(bountyId) {
  try {
    return Object.values(data.transactions).filter((t) => t.bountyId === bountyId);
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
  
  // Bounties
  createBounty,
  getBounty,
  getBountiesByCreator,
  getAllBounties,
  updateBounty,
  
  // Submissions
  createSubmission,
  getSubmissionsByBounty,
  updateSubmission,
  
  // Disputes
  createDispute,
  getDispute,
  getDisputesByBounty,
  updateDispute,
  
  // Transactions
  createTransaction,
  getTransaction,
  getTransactionsByUser,
  getTransactionsByBounty,
};

