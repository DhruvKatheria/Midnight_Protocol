const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { buildAppCallTxn } = require("../services/algorand");
const { 
  createDispute, 
  getDispute, 
  getDisputesByValidator, 
  updateDispute, 
  updateBounty, 
  createTransaction, 
  getAllOpenDisputes, 
  getDisputesByBounty, 
  getBounty, 
  getAllUsers,
  getSubmissionsByBounty,
  updateSubmission
} = require("../services/mongo");
const {
  updateTrustScore,
  applyContributorTrustForOutcome,
  applySponsorTrustForOutcome,
  resetContributorStreakOnDispute,
} = require("../services/trustScore");

function normalizeIdentity(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function collectUserIdentities(user) {
  return [
    user?.uid,
    user?.walletAddress,
    user?.address,
    user?.email,
  ]
    .map(normalizeIdentity)
    .filter(Boolean);
}

// POST /:bountyId/raise
router.post("/:bountyId/raise", async (req, res) => {
  try {
    const { bountyId } = req.params;
    const { sponsorAddress, reason, sponsorEmail, contributorEmail } = req.body;

    const bountyObj = await getBounty(bountyId);
    if (!bountyObj) throw new Error("Bounty not found");

    const submissions = await getSubmissionsByBounty(bountyId);

    // Seed participant identities from request + bounty + latest submission inputs.
    const participantIdentitySeed = new Set(
      [
        sponsorAddress,
        sponsorEmail,
        bountyObj?.sponsorEmail,
        bountyObj?.sponsorAddress,
        bountyObj?.sponsorWallet,
        bountyObj?.sponsorUid,
      ]
        .map(normalizeIdentity)
        .filter(Boolean)
    );

    // Contributor is taken from latest submission (fallback to bounty-level contributorAddress if present).
    const latestSub = submissions && submissions.length > 0 ? submissions[submissions.length - 1] : null;
    const contributorAddress = latestSub?.contributorAddress || bountyObj?.contributorAddress;
    const normalizedContributor = normalizeIdentity(contributorAddress);
    if (normalizedContributor) {
      participantIdentitySeed.add(normalizedContributor);
    }

    const normalizedContributorEmail = normalizeIdentity(contributorEmail || latestSub?.contributorEmail);
    if (normalizedContributorEmail) {
      participantIdentitySeed.add(normalizedContributorEmail);
    }

    const contributorIdentityForTrust = contributorEmail
      || latestSub?.contributorEmail
      || contributorAddress;

    if (contributorIdentityForTrust) {
      await resetContributorStreakOnDispute(contributorIdentityForTrust);
    }

    const allUsers = await getAllUsers();

    const blockedEmails = new Set(
      [
        sponsorEmail,
        bountyObj?.sponsorEmail,
        contributorEmail,
        latestSub?.contributorEmail,
      ]
        .map(normalizeIdentity)
        .filter(Boolean)
    );

    // Expand participant identities to include linked email/uid/wallet fields.
    const participantIdentities = new Set(participantIdentitySeed);
    for (const user of allUsers) {
      const identities = collectUserIdentities(user);
      if (identities.some((id) => participantIdentitySeed.has(id))) {
        identities.forEach((id) => participantIdentities.add(id));
      }
    }

    // Filter eligible validators (anyone but participants)
    let eligibleValidators = allUsers.filter((u) => {
      const candidateEmail = normalizeIdentity(u?.email);
      if (!candidateEmail) return false;
      if (blockedEmails.has(candidateEmail)) return false;

      const identities = collectUserIdentities(u);
      const isParticipant = identities.some((id) => participantIdentities.has(id));
      return !isParticipant;
    });

    // Shuffle and pick 3
    let validatorsAccs = [];
    let selectedValidators = [];
    if (eligibleValidators.length >= 3) {
        selectedValidators = eligibleValidators
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
        validatorsAccs = selectedValidators.map(u => u.uid || u.address);
    } else {
      // Fallback if not enough users in DB
      validatorsAccs = eligibleValidators.map((u) => u.uid || u.address);
      selectedValidators = [...eligibleValidators];

      const usedValidatorIds = new Set(validatorsAccs.map(normalizeIdentity));
      let placeholderCounter = 1;

      while (validatorsAccs.length < 3) {
        const candidate = placeholderCounter <= 3 ? `VAL${placeholderCounter}` : `VAL_PLACEHOLDER_${placeholderCounter}`;
        placeholderCounter += 1;

        const normalizedCandidate = normalizeIdentity(candidate);
        if (participantIdentities.has(normalizedCandidate) || usedValidatorIds.has(normalizedCandidate)) {
          continue;
        }

        validatorsAccs.push(candidate);
        selectedValidators.push({ uid: candidate, email: "placeholder@system.io" });
        usedValidatorIds.add(normalizedCandidate);
      }
    }

    console.log("==========================================");
    console.log("⚖️ DISPUTE RAISED: Selecting Validators");
    console.log("Bounty ID:", bountyId);
    console.log("Selected Validators (Jury):");
    selectedValidators.forEach((v, idx) => {
        console.log(`${idx + 1}. [${v.uid}] - Email: ${v.email || 'N/A'}`);
    });
    console.log("==========================================");

    const isDemoAddress = sponsorAddress && sponsorAddress.startsWith("DEMO_");
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
      voterAddresses: [],
      voters: [],
      status: "open",
      createdAt: new Date().toISOString()
    });

    await updateBounty(bountyId, {
      status: "disputed",
      hadDispute: true,
      reviewOutcome: "dispute_open",
    });
    const subs = await getSubmissionsByBounty(bountyId);
    for (let s of subs) {
      await updateSubmission(s.id, { status: "disputed" });
    }

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

// GET /assigned
router.get("/assigned", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const disputes = await getDisputesByValidator(address);

    const detailedDisputes = await Promise.all(disputes.map(async (d) => {
      const bounty = await getBounty(d.bountyId);
      const subs = await getSubmissionsByBounty(d.bountyId);
      // Find the latest submission or the one from the participant
      const latestSub = subs[subs.length - 1];

      return {
        ...d,
        bountyTitle: bounty?.title || "Unknown Bounty",
        bountyDescription: bounty?.description || "No description",
        originalBrief: bounty?.briefHash || "N/A",
        submissionHash: latestSub?.workHash || "N/A",
        submissionContent: latestSub?.workContent || "N/A"
      };
    }));

    res.json(detailedDisputes || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:disputeId/vote
router.post("/:disputeId/vote", async (req, res) => {
  try {
    const { validatorAddress, approve } = req.body; // approve is boolean
    const disputeId = req.params.disputeId;
    let trustChanges = null;

    const dispute = await getDispute(disputeId);
    if (!dispute) return res.status(404).json({ error: "Dispute not found" });

    if (dispute.voterAddresses && dispute.voterAddresses.includes(validatorAddress)) {
      return res.status(400).json({ error: "Already voted" });
    }

    const voteType = approve ? 'approve' : 'reject';
    dispute.votes[voteType] += 1;
    if (!dispute.voterAddresses) dispute.voterAddresses = [];
    if (!dispute.voters) dispute.voters = [];

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
      const decisionAt = new Date();

      await updateDispute(disputeId, {
        status: "resolved",
        outcome: isApprovedByMajority ? "approved" : "rejected",
        resolvedAt: decisionAt,
      });

      await updateBounty(dispute.bountyId, {
        status: isApprovedByMajority ? "approved" : "refunded",
        sponsorDecisionAt: decisionAt,
        resolvedAt: decisionAt,
        hadDispute: true,
        reviewOutcome: isApprovedByMajority
          ? "dispute_contributor_won"
          : "dispute_sponsor_won",
      });

      // Cascade to submissions
      const subs = await getSubmissionsByBounty(dispute.bountyId);
      const latestSub = [...subs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const bounty = await getBounty(dispute.bountyId);

      for (let s of subs) {
        await updateSubmission(s.id, { status: isApprovedByMajority ? "approved" : "rejected" });
      }

      const contributorIdentity = latestSub?.contributorEmail || latestSub?.contributorAddress;
      const sponsorIdentity = bounty?.sponsorEmail || dispute.raisedBy;

      const contributorTrust = await applyContributorTrustForOutcome({
        contributorIdentity,
        bountyValueAlgo: bounty?.amount,
        deadline: bounty?.deadline,
        submissionAt: latestSub?.createdAt || bounty?.firstSubmittedAt,
        disputeOutcome: isApprovedByMajority ? "contributor_won" : "contributor_lost",
      });

      const sponsorTrust = await applySponsorTrustForOutcome({
        sponsorIdentity,
        bountyValueAlgo: bounty?.amount,
        submissionAt: latestSub?.createdAt || bounty?.firstSubmittedAt,
        decisionAt,
        outcome: isApprovedByMajority ? "dispute_contributor_won" : "dispute_sponsor_won",
        submissionCount: subs.length,
      });

      await createTransaction({
        id: uuidv4(),
        bountyId: dispute.bountyId,
        action: "dispute_resolved",
        actor: "ValidatorConsensus",
        txId: "mock_resolved_txid",
        amount: bounty?.amount || 0,
        timestamp: decisionAt.toISOString(),
        trustDeltaContributor: contributorTrust?.delta,
        trustDeltaSponsor: sponsorTrust?.delta,
        trustFormulaSnapshot: {
          contributor: contributorTrust?.formulaSnapshot || null,
          sponsor: sponsorTrust?.formulaSnapshot || null,
        },
      });

      // Validator reward/penalty remains separate from contributor/sponsor formula.
      const validatorTrustUpdates = [];
      for (const voter of dispute.voters) {
        const wasCorrect = voter.approved === isApprovedByMajority;
        if (wasCorrect) {
          const updateResult = await updateTrustScore(voter.address, 3, "correct_vote");
          if (updateResult?.applied) validatorTrustUpdates.push(updateResult);
        } else {
          const updateResult = await updateTrustScore(voter.address, -5, "incorrect_vote");
          if (updateResult?.applied) validatorTrustUpdates.push(updateResult);
        }
      }

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
        validators: validatorTrustUpdates.map((item) => ({
          userId: item.userId,
          oldScore: item.oldScore,
          newScore: item.newScore,
          delta: item.delta,
        })),
      };
    }

    res.json({
      success: true,
      votes: dispute.votes,
      resolved: dispute.votes.approve >= 2 || dispute.votes.reject >= 2,
      trustChanges,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /open
router.get("/open", async (req, res) => {
  try {
    const disputes = await getAllOpenDisputes();
    res.json(disputes || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /bounty/:bountyId
router.get("/bounty/:bountyId", async (req, res) => {
  try {
    const disputes = await getDisputesByBounty(req.params.bountyId);
    res.json({ success: true, disputes: disputes || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
