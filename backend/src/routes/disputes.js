const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { buildAppCallTxn } = require("../services/algorand");
const { createDispute, getDispute, updateDispute, updateBounty, createTransaction } = require("../services/mongo");
const { updateTrustScore } = require("../services/trustScore");
const { getAllUsers } = require("../services/mongo"); 

// POST /:bountyId/raise
router.post("/:bountyId/raise", async (req, res) => {
  try {
    const { bountyId } = req.params;
    const { sponsorAddress, reason } = req.body;
    
    let validatorsAccs = ["VAL1", "VAL2", "VAL3"]; 
    try {
        const users = await getAllUsers();
        const staked = users.filter(u => u.isStaked === true && u.role === "validator");
        const shuffled = staked.sort(() => 0.5 - Math.random());
        validatorsAccs = shuffled.slice(0, 3).map(v => v.walletAddress);
        if (validatorsAccs.length < 3) throw new Error("Not enough staked validators");
    } catch(e) {
        console.warn("Using mock validators:", e.message);
    }

    const bounty = await updateBounty(bountyId, { status: "disputed" }); // we need the bounty object for appId
    // Actually we should get it first
    const { getBounty } = require("../services/mongo");
    const bountyObj = await getBounty(bountyId);
    
    if (!isDemoAddress && !bountyObj.appId) throw new Error("Bounty missing appId");
    
    const appCallTxn = await buildAppCallTxn(sponsorAddress, "dispute", validatorsAccs, bountyObj.appId);
    const disputeId = uuidv4();
    
    await createDispute({
        id: disputeId,
        bountyId,
        raisedBy: sponsorAddress,
        reason,
        validators: validatorsAccs,
        votes: { approve: 0, reject: 0 },
        voterAddresses: [], // Maps address -> true/false locally
        voters: [], // Detailed voter objects
        status: "open",
        createdAt: new Date().toISOString()
    });

    await updateBounty(bountyId, { status: "disputed" });
    
    await createTransaction({
        id: uuidv4(),
        bountyId,
        action: "dispute_raised",
        actor: sponsorAddress,
        txId: "mock_dispute_txid",
        amount: 0,
        timestamp: new Date().toISOString()
    });

    res.json({
        success: true,
        unsignedAppCallTxn: Buffer.from(appCallTxn.toByte()).toString("base64"),
        disputeId,
        selectedValidators: validatorsAccs
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:disputeId/vote
router.post("/:disputeId/vote", async (req, res) => {
  try {
    const { validatorAddress, approve } = req.body; // approve is boolean
    const disputeId = req.params.disputeId;
    
    const dispute = await getDispute(disputeId);
    if (!dispute) return res.status(404).json({ error: "Dispute not found" });
    
    if (dispute.voterAddresses && dispute.voterAddresses.includes(validatorAddress)) {
        return res.status(400).json({ error: "Already voted" });
    }
    
    const voteType = approve ? 'approve' : 'reject';
    dispute.votes[voteType] += 1;
    if(!dispute.voterAddresses) dispute.voterAddresses = [];
    if(!dispute.voters) dispute.voters = [];
    
    dispute.voterAddresses.push(validatorAddress);
    dispute.voters.push({ address: validatorAddress, approved: approve });
    
    await updateDispute(disputeId, {
        votes: dispute.votes,
        voterAddresses: dispute.voterAddresses,
        voters: dispute.voters
    });
    
    await createTransaction({
        id: uuidv4(),
        bountyId: dispute.bountyId,
        action: "vote_cast",
        actor: validatorAddress,
        txId: "mock_vote_txid",
        amount: 0,
        timestamp: new Date().toISOString()
    });
    
    // Check execution
    if (dispute.votes.approve >= 2 || dispute.votes.reject >= 2) {
        const isApprovedByMajority = dispute.votes.approve >= 2;
        await updateDispute(disputeId, { status: "resolved", outcome: isApprovedByMajority ? "approved" : "rejected" });
        await updateBounty(dispute.bountyId, { status: isApprovedByMajority ? "approved" : "refunded" });
        
        await createTransaction({
            id: uuidv4(),
            bountyId: dispute.bountyId,
            action: "dispute_resolved",
            actor: "ValidatorConsensus",
            txId: "mock_resolved_txid",
            amount: 0, // Should be bounty amount but mapped earlier
            timestamp: new Date().toISOString()
        });

        // Resolve Trust Scores via the algorithm
        const contributorMock = "CONTRIBUTOR_MOCK"; // Usually fetched from bounty doc
        const sponsorAddr = dispute.raisedBy;
        
        if (isApprovedByMajority) {
             // Contributor wins
             await updateTrustScore(contributorMock, 5, "dispute_won");
             await updateTrustScore(sponsorAddr, -15, "dispute_lost_unfair");
        } else {
             // Sponsor wins
             await updateTrustScore(sponsorAddr, 5, "dispute_won");
             await updateTrustScore(contributorMock, -15, "dispute_lost_poor_work");
        }

        // Reward logic for validators
        for (const voter of dispute.voters) {
             const wasCorrect = voter.approved === isApprovedByMajority;
             if (wasCorrect) {
                 await updateTrustScore(voter.address, 3, "correct_vote");
             } else {
                 await updateTrustScore(voter.address, -5, "incorrect_vote");
             }
        }
    }
    
    res.json({ success: true, votes: dispute.votes, resolved: dispute.votes.approve >= 2 || dispute.votes.reject >= 2 });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /open
router.get("/open", async (req, res) => {
  try {
    // Basic mock / fetch all and filter
    const disputes = [
      {
          id: "mock_disp_123",
          bountyId: "mock_bounty_789",
          reason: "The Logo did not match the brief instructions.",
          originalBrief: "A beautiful pixel art logo of an eagle.",
          submissionHash: "QmHashMock123456",
          votes: { approve: 0, reject: 1 },
          voterAddresses: []
      }
    ]; 
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
