const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const algosdk = require("algosdk");
const { hashBrief } = require("../services/hashing");
const { buildAppCallTxn, buildPayTxn, submitSignedTxn } = require("../services/algorand");
const { createBounty, getBounty, updateBounty, getAllBounties, createTransaction } = require("../services/firebase");
const { updateTrustScore } = require("../services/trustScore");

// POST /create
router.post("/create", async (req, res) => {
  try {
    const { title, description, reward, deadline, sponsorAddress } = req.body;
    const briefHash = hashBrief(description);
    const isDemoAddress = sponsorAddress && sponsorAddress.startsWith("DEMO_");
    
    if (isDemoAddress) {
      // Skip blockchain for demo addresses
      res.json({
        success: true,
        briefHash,
        unsignedAppCallTxn: null,
        unsignedPayTxn: null
      });
      return;
    }
    
    // Dynamically calculate app address to prevent module caching race conditions
    const APP_ID = parseInt(process.env.APP_ID || "0");
    const APP_ADDRESS = APP_ID !== 0 ? algosdk.getApplicationAddress(APP_ID) : "MOCK_APP_ADDRESS";

    let appCallTxn = await buildAppCallTxn(sponsorAddress, "lock", [briefHash, deadline]);
    let payTxn = await buildPayTxn(sponsorAddress, APP_ADDRESS, reward);
    
    // Group the transactions atomically
    algosdk.assignGroupID([appCallTxn, payTxn]);
    
    res.json({
      success: true,
      briefHash,
      unsignedAppCallTxn: Buffer.from(appCallTxn.toByte()).toString('base64'),
      unsignedPayTxn: Buffer.from(payTxn.toByte()).toString('base64')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /confirm
router.post("/confirm", async (req, res) => {
  try {
    const { signedGroupTxnBase64, bountyData } = req.body;
    let txId = "mock_tx_confirm";
    try {
       txId = await submitSignedTxn(signedGroupTxnBase64);
    } catch(e) {
       console.warn("Algorand connection not set up properly, continuing with mock txId :", e.message);
    }
    
    const bountyId = uuidv4();
    const newBounty = {
        id: bountyId,
        sponsorAddress: bountyData.sponsorAddress,
        title: bountyData.title,
        description: bountyData.description,
        briefHash: bountyData.briefHash,
        amount: bountyData.reward,
        deadline: bountyData.deadline,
        status: "open",
        txId,
        appId: process.env.APP_ID,
        createdAt: new Date().toISOString()
    };
    
    await createBounty(newBounty);
    
    await createTransaction({
        id: uuidv4(),
        bountyId,
        action: "bounty_created", // Required string
        actor: bountyData.sponsorAddress,
        txId,
        amount: bountyData.reward,
        timestamp: newBounty.createdAt
    });
    
    res.json({ success: true, bounty: newBounty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /open
router.get("/open", async (req, res) => {
  try {
    const all = await getAllBounties();
    const open = all.filter(b => b.status === "open");
    res.json(open);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /mine
router.get("/mine", async (req, res) => {
  try {
    const address = req.query.address;
    const all = await getAllBounties();
    const mine = all.filter(b => b.sponsorAddress === address);
    res.json(mine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id
router.get("/:id", async (req, res) => {
  try {
    const bounty = await getBounty(req.params.id);
    if (!bounty) return res.status(404).json({ error: "Bounty not found" });
    res.json(bounty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/approve
router.post("/:id/approve", async (req, res) => {
  try {
    const bounty = await getBounty(req.params.id);
    const { sponsorAddress, contributorAddress, mockSignedSubmit = false } = req.body;
    const isDemoAddress = sponsorAddress && sponsorAddress.startsWith("DEMO_");
    
    if (bounty.status !== "submitted") {
        return res.status(400).json({ error: "Bounty must be in submitted status" });
    }
    
    let unsignedTxnBase64 = null;
    if (!isDemoAddress) {
      const appCallTxn = await buildAppCallTxn(sponsorAddress, "approve", []);
      unsignedTxnBase64 = Buffer.from(appCallTxn.toByte()).toString('base64');
    }
    
    if (mockSignedSubmit || isDemoAddress) {
         await updateBounty(bounty.id, { status: "approved" });
         await updateTrustScore(contributorAddress, 10, "bounty_completed");
         await updateTrustScore(sponsorAddress, 5, "bounty_settled");
         await createTransaction({
             id: uuidv4(),
             bountyId: bounty.id,
             action: "submission_approved",
             actor: sponsorAddress,
             txId: isDemoAddress ? "demo_approval_txid" : "mock_approval_txid",
             amount: bounty.amount,
             timestamp: new Date().toISOString()
         });
    }

    res.json({
        success: true,
        message: "Sign this transaction to approve",
        unsignedAppCallTxn: unsignedTxnBase64
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/claim-refund
router.post("/:id/claim-refund", async (req, res) => {
  try {
    const bounty = await getBounty(req.params.id);
    const { sponsorAddress } = req.body;
    
    if (bounty.status !== "open") {
        return res.status(400).json({ error: "Bounty must be open" });
    }
    
    await updateBounty(bounty.id, { status: "refunded" });
    
    await createTransaction({
        id: uuidv4(),
        bountyId: bounty.id,
        action: "refund_claimed",
        actor: sponsorAddress,
        txId: "mock_refund_txid",
        amount: bounty.amount,
        timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: "Refund claimed" });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
