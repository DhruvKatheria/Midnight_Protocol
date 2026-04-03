const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const algosdk = require("algosdk");
const { hashBrief } = require("../services/hashing");
const { buildAppCallTxn, buildPayTxn, submitSignedTxn, deployBountyContract } = require("../services/algorand");
const {
  createBounty,
  getBounty,
  updateBounty,
  getAllBounties,
  createTransaction,
  getSubmissionsByBounty,
  updateSubmission,
} = require("../services/mongo");
const {
  applyContributorTrustForOutcome,
  applySponsorTrustForOutcome,
} = require("../services/trustScore");

// POST /create
router.post("/create", async (req, res) => {
  try {
    const { title, description, reward, deadline, sponsorAddress, sponsorEmail } = req.body;
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
    
    let APP_ID, APP_ADDRESS;
    if (!isDemoAddress) {
      const deployed = await deployBountyContract();
      APP_ID = deployed.appId;
      APP_ADDRESS = deployed.appAddress;
    } else {
      APP_ID = 0;
      APP_ADDRESS = "MOCK_APP_ADDRESS";
    }

    let appCallTxn = await buildAppCallTxn(sponsorAddress, "lock", [briefHash, deadline], APP_ID);
    let payTxn = await buildPayTxn(sponsorAddress, APP_ADDRESS, reward);
    
    // Group the transactions atomically — payTxn MUST be Gtxn[0] (contract asserts Gtxn[0] is Payment)
    algosdk.assignGroupID([payTxn, appCallTxn]);
    
    res.json({
      success: true,
      briefHash,
      appId: APP_ID,
      unsignedPayTxn: Buffer.from(payTxn.toByte()).toString('base64'),
      unsignedAppCallTxn: Buffer.from(appCallTxn.toByte()).toString('base64')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /confirm
router.post("/confirm", async (req, res) => {
  try {
    const { signedGroupTxnBase64, bountyData } = req.body;
    
    // Submit the signed transaction group to the Algorand blockchain
    const txId = await submitSignedTxn(signedGroupTxnBase64);
    console.log("✅ Blockchain transaction confirmed:", txId);
    
    const bountyId = uuidv4();
    const newBounty = {
        id: bountyId,
        sponsorAddress: bountyData.sponsorAddress,
      sponsorEmail: bountyData.sponsorEmail || null,
        title: bountyData.title,
        description: bountyData.description,
        briefHash: bountyData.briefHash,
        amount: bountyData.reward,
        deadline: bountyData.deadline,
        status: "open",
        txId,
        appId: bountyData.appId,
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
    const {
      sponsorAddress,
      sponsorEmail,
      contributorAddress,
      contributorEmail,
      mockSignedSubmit = false,
    } = req.body;
    const isDemoAddress = sponsorAddress && sponsorAddress.startsWith("DEMO_");

    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }
    
    if (bounty.status !== "submitted") {
        return res.status(400).json({ error: "Bounty must be in submitted status" });
    }
    
    let unsignedTxnBase64 = null;
    let trustChanges = null;
    if (!isDemoAddress) {
      const appCallTxn = await buildAppCallTxn(sponsorAddress, "approve", [], bounty.appId);
      unsignedTxnBase64 = Buffer.from(appCallTxn.toByte()).toString('base64');
    }

    const subs = await getSubmissionsByBounty(bounty.id);
    const latestSub = [...subs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    if (mockSignedSubmit || isDemoAddress) {
         const decisionAt = new Date();
         const sponsorReviewOutcome = subs.length > 1
           ? "approved_after_revision"
           : "approved_first_submission";

         await updateBounty(bounty.id, {
           status: "approved",
           sponsorDecisionAt: decisionAt,
           resolvedAt: decisionAt,
           hadDispute: false,
           reviewOutcome: sponsorReviewOutcome,
         });
         
         // Cascade status properly to submissions
         for (let s of subs) {
             await updateSubmission(s.id, { status: "approved" });
         }

         const contributorIdentity = contributorEmail
           || latestSub?.contributorEmail
           || contributorAddress
           || latestSub?.contributorAddress;

         const sponsorIdentity = sponsorEmail
           || bounty.sponsorEmail
           || sponsorAddress
           || bounty.sponsorAddress;

         const contributorTrust = await applyContributorTrustForOutcome({
           contributorIdentity,
           bountyValueAlgo: bounty.amount,
           deadline: bounty.deadline,
           submissionAt: latestSub?.createdAt || bounty.firstSubmittedAt,
           disputeOutcome: "none",
         });

         const sponsorTrust = await applySponsorTrustForOutcome({
           sponsorIdentity,
           bountyValueAlgo: bounty.amount,
           submissionAt: latestSub?.createdAt || bounty.firstSubmittedAt,
           decisionAt,
           outcome: sponsorReviewOutcome,
           submissionCount: subs.length,
         });

         await createTransaction({
             id: uuidv4(),
             bountyId: bounty.id,
             action: "submission_approved",
             actor: sponsorAddress,
             txId: isDemoAddress ? "demo_approval_txid" : "mock_approval_txid",
             amount: bounty.amount,
             timestamp: decisionAt.toISOString(),
             trustDeltaContributor: contributorTrust?.delta,
             trustDeltaSponsor: sponsorTrust?.delta,
             trustFormulaSnapshot: {
               contributor: contributorTrust?.formulaSnapshot || null,
               sponsor: sponsorTrust?.formulaSnapshot || null,
             },
         });

         trustChanges = {
           contributor: contributorTrust
             ? {
                 oldScore: contributorTrust.oldScore,
                 newScore: contributorTrust.newScore,
                 delta: contributorTrust.delta,
               }
             : null,
           sponsor: sponsorTrust
             ? {
                 oldScore: sponsorTrust.oldScore,
                 newScore: sponsorTrust.newScore,
                 delta: sponsorTrust.delta,
               }
             : null,
         };
    }

    res.json({
        success: true,
        message: "Sign this transaction to approve",
        unsignedAppCallTxn: unsignedTxnBase64,
        trustChanges,
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
