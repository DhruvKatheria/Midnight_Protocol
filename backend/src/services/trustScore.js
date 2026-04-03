const { getUser, updateUser } = require("./mongo");
const algosdk = require("algosdk");
const { algodClient } = require("./algorand");
const {
  INITIAL_TRUST_SCORE,
  TRUST_SCORE_MIN,
  TRUST_SCORE_MAX,
} = require("../config/trust");

const CONTRIBUTOR_DISPUTE_LOSS_MODIFIER = -1.0;
const SPONSOR_REPEAT_UNFAIR_DISPUTE_THRESHOLD = 3;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundTo(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(toNumber(value) * factor) / factor;
}

function toTimestampMs(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();

  const num = Number(value);
  if (Number.isFinite(num)) {
    return num > 1e12 ? num : num * 1000;
  }

  const dateMs = new Date(value).getTime();
  return Number.isFinite(dateMs) ? dateMs : null;
}

function getLogValueComponent(valueAlgo) {
  return Math.log10(Math.max(0, toNumber(valueAlgo)) + 1);
}

function getTimelinessScore({ deadline, submissionAt, acceptedLate = false }) {
  const deadlineMs = toTimestampMs(deadline);
  const submissionMs = toTimestampMs(submissionAt);

  if (!deadlineMs || !submissionMs) return 0;

  const diffMs = submissionMs - deadlineMs;
  const twelveHours = 12 * 60 * 60 * 1000;
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (diffMs <= -twentyFourHours) return 1.0;
  if (diffMs <= 0) return 0.85;
  if (diffMs <= twelveHours) return 0.65;
  if (acceptedLate) return 0.5;
  return 0;
}

function getContributorDisputeModifier(outcome) {
  if (outcome === "contributor_won") return 0.8;
  if (outcome === "contributor_lost") return CONTRIBUTOR_DISPUTE_LOSS_MODIFIER;
  return 1.0;
}

function getContributorConsistencyMultiplier(streak) {
  if (streak >= 20) return 1.3;
  if (streak >= 10) return 1.2;
  if (streak >= 6) return 1.15;
  if (streak >= 3) return 1.05;
  return 1.0;
}

function getSponsorFairnessScore({ outcome, submissionCount, unfairDisputeLossCount }) {
  if (outcome === "dispute_sponsor_won") return 0.9;
  if (outcome === "dispute_contributor_won") {
    return unfairDisputeLossCount >= SPONSOR_REPEAT_UNFAIR_DISPUTE_THRESHOLD ? 0.1 : 0.4;
  }
  if (submissionCount > 1) return 0.85;
  return 1.0;
}

function getReviewSpeedScore({ submissionAt, decisionAt, expiredNoReview = false }) {
  if (expiredNoReview) return 0.5;

  const submissionMs = toTimestampMs(submissionAt);
  const decisionMs = toTimestampMs(decisionAt);
  if (!submissionMs || !decisionMs) return 0.5;

  const diffHours = (decisionMs - submissionMs) / (60 * 60 * 1000);
  if (diffHours <= 24) return 1.0;
  if (diffHours <= 48) return 0.85;
  if (diffHours <= 72) return 0.7;
  return 0.5;
}

function getSponsorPaymentHistoryMultiplier(successfulPayoutCount) {
  if (successfulPayoutCount >= 25) return 1.25;
  if (successfulPayoutCount >= 11) return 1.15;
  if (successfulPayoutCount >= 5) return 1.1;
  return 1.0;
}

function getWalletAddressForAsa(user, userIdentity) {
  if (user?.walletAddress && algosdk.isValidAddress(user.walletAddress)) {
    return user.walletAddress;
  }
  if (typeof userIdentity === "string" && algosdk.isValidAddress(userIdentity)) {
    return userIdentity;
  }
  return null;
}

async function maybeSyncTrustTokenOnChain({ user, userIdentity, delta }) {
  const adminMnemonic = process.env.ADMIN_MNEMONIC;
  const assetId = parseInt(process.env.TRUST_TOKEN_ASSET_ID || "0", 10);
  const amount = Math.round(Math.abs(toNumber(delta)));

  if (amount === 0) return;
  if (!adminMnemonic || adminMnemonic === "your 25-word admin mnemonic" || assetId <= 0) {
    console.log("[TrustScore] ADMIN_MNEMONIC or ASSET_ID missing. Skipping on-chain trust sync.");
    return;
  }

  const walletAddress = getWalletAddressForAsa(user, userIdentity);
  if (!walletAddress) {
    console.log("[TrustScore] No valid wallet for on-chain trust sync; DB update still applied.");
    return;
  }

  const adminAccount = algosdk.mnemonicToSecretKey(adminMnemonic);
  const params = await algodClient.getTransactionParams().do();

  let txn;
  if (delta > 0) {
    txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: adminAccount.addr,
      receiver: walletAddress,
      assetIndex: assetId,
      amount,
      suggestedParams: params,
    });
  } else if (delta < 0) {
    txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: adminAccount.addr,
      receiver: adminAccount.addr,
      revocationTarget: walletAddress,
      assetIndex: assetId,
      amount,
      suggestedParams: params,
    });
  }

  if (!txn) return;
  const signedTxn = txn.sign(adminAccount.sk);
  const txId = await algodClient.sendRawTransaction(signedTxn).do();
  await algosdk.waitForConfirmation(algodClient, txId.txId, 4);
  console.log(`[TrustScore] On-chain trust sync complete for ${walletAddress}. TxID: ${txId.txId}`);
}

async function updateTrustScore(userIdentity, delta, reason, options = {}) {
  try {
    const user = await getUser(userIdentity);
    if (!user) {
      console.warn(`[TrustScore] User ${userIdentity} not found; trust update skipped (${reason}).`);
      return { applied: false, reason: "user_not_found" };
    }

    const normalizedDelta = roundTo(delta);
    const oldScore = toNumber(user.trustScore, INITIAL_TRUST_SCORE);
    const newScore = roundTo(
      Math.min(TRUST_SCORE_MAX, Math.max(TRUST_SCORE_MIN, oldScore + normalizedDelta))
    );

    const userUpdates = options.userUpdates || {};
    await updateUser(user.uid, {
      ...userUpdates,
      trustScore: newScore,
      trustTokenBalance: newScore,
      lastTrustUpdateAt: new Date(),
    });

    console.log(`[TrustScore] Updated ${user.uid}: ${oldScore} -> ${newScore} (${reason}, delta=${normalizedDelta})`);

    await maybeSyncTrustTokenOnChain({ user, userIdentity, delta: normalizedDelta });

    return {
      applied: true,
      userId: user.uid,
      oldScore,
      newScore,
      delta: normalizedDelta,
      reason,
      formulaSnapshot: options.formulaSnapshot || null,
    };
  } catch (error) {
    console.error(`[TrustScore Error] Failed to update for ${userIdentity}:`, error);
    return { applied: false, reason: "error", error: error.message };
  }
}

function computeContributorTrustScoreDelta({
  bountyValueAlgo,
  deadline,
  submissionAt,
  disputeOutcome = "none",
  noDisputeStreak = 0,
  acceptedLate = false,
}) {
  const timelinessScore = getTimelinessScore({ deadline, submissionAt, acceptedLate });
  const disputeModifier = getContributorDisputeModifier(disputeOutcome);
  const consistencyMultiplier = disputeOutcome === "none"
    ? getContributorConsistencyMultiplier(noDisputeStreak)
    : 1.0;

  const rawScoreDelta = getLogValueComponent(bountyValueAlgo)
    * 10
    * timelinessScore
    * disputeModifier
    * consistencyMultiplier;

  return {
    scoreDelta: roundTo(rawScoreDelta),
    components: {
      V: toNumber(bountyValueAlgo),
      T: timelinessScore,
      D: disputeModifier,
      C: consistencyMultiplier,
    },
  };
}

function computeSponsorTrustScoreDelta({
  bountyValueAlgo,
  submissionAt,
  decisionAt,
  outcome,
  submissionCount = 1,
  successfulPayoutCount = 0,
  unfairDisputeLossCount = 0,
  expiredNoReview = false,
}) {
  const fairnessScore = getSponsorFairnessScore({
    outcome,
    submissionCount,
    unfairDisputeLossCount,
  });

  const reviewSpeedScore = getReviewSpeedScore({
    submissionAt,
    decisionAt,
    expiredNoReview,
  });

  const paymentHistoryMultiplier = getSponsorPaymentHistoryMultiplier(successfulPayoutCount);

  const rawScoreDelta = getLogValueComponent(bountyValueAlgo)
    * 8
    * fairnessScore
    * reviewSpeedScore
    * paymentHistoryMultiplier;

  return {
    scoreDelta: roundTo(rawScoreDelta),
    components: {
      V: toNumber(bountyValueAlgo),
      F: fairnessScore,
      R: reviewSpeedScore,
      P: paymentHistoryMultiplier,
    },
  };
}

async function applyContributorTrustForOutcome({
  contributorIdentity,
  bountyValueAlgo,
  deadline,
  submissionAt,
  disputeOutcome,
}) {
  const user = await getUser(contributorIdentity);
  if (!user) {
    return { applied: false, reason: "user_not_found" };
  }

  const currentStreak = toNumber(user.contributorNoDisputeStreak, 0);
  const nextStreak = disputeOutcome === "none" ? currentStreak + 1 : 0;
  const nextCompletedCount = toNumber(user.contributorCompletedCount, 0) + 1;

  const acceptedLate = disputeOutcome !== "contributor_lost";
  const formula = computeContributorTrustScoreDelta({
    bountyValueAlgo,
    deadline,
    submissionAt,
    disputeOutcome,
    noDisputeStreak: nextStreak,
    acceptedLate,
  });

  return updateTrustScore(user.uid, formula.scoreDelta, `contributor_${disputeOutcome}`, {
    userUpdates: {
      contributorNoDisputeStreak: nextStreak,
      contributorCompletedCount: nextCompletedCount,
    },
    formulaSnapshot: formula.components,
  });
}

async function applySponsorTrustForOutcome({
  sponsorIdentity,
  bountyValueAlgo,
  submissionAt,
  decisionAt,
  outcome,
  submissionCount,
  expiredNoReview = false,
}) {
  const user = await getUser(sponsorIdentity);
  if (!user) {
    return { applied: false, reason: "user_not_found" };
  }

  const currentSuccessfulPayouts = toNumber(user.sponsorSuccessfulPayouts, 0);
  const currentUnfairDisputeLossCount = toNumber(user.sponsorUnfairDisputeLossCount, 0);
  const nextUnfairDisputeLossCount = outcome === "dispute_contributor_won"
    ? currentUnfairDisputeLossCount + 1
    : currentUnfairDisputeLossCount;

  const formula = computeSponsorTrustScoreDelta({
    bountyValueAlgo,
    submissionAt,
    decisionAt,
    outcome,
    submissionCount,
    successfulPayoutCount: currentSuccessfulPayouts,
    unfairDisputeLossCount: nextUnfairDisputeLossCount,
    expiredNoReview,
  });

  const getsPaidOut = outcome === "approved_first_submission"
    || outcome === "approved_after_revision"
    || outcome === "dispute_contributor_won";

  return updateTrustScore(user.uid, formula.scoreDelta, `sponsor_${outcome}`, {
    userUpdates: {
      sponsorSuccessfulPayouts: getsPaidOut
        ? currentSuccessfulPayouts + 1
        : currentSuccessfulPayouts,
      sponsorUnfairDisputeLossCount: nextUnfairDisputeLossCount,
    },
    formulaSnapshot: formula.components,
  });
}

async function resetContributorStreakOnDispute(contributorIdentity) {
  const user = await getUser(contributorIdentity);
  if (!user) {
    return { applied: false, reason: "user_not_found" };
  }

  await updateUser(user.uid, {
    contributorNoDisputeStreak: 0,
    lastTrustUpdateAt: new Date(),
  });

  return { applied: true, userId: user.uid };
}

module.exports = {
  updateTrustScore,
  computeContributorTrustScoreDelta,
  computeSponsorTrustScoreDelta,
  // Backward compatibility for existing imports
  computeContributorTrustTokens: computeContributorTrustScoreDelta,
  computeSponsorTrustTokens: computeSponsorTrustScoreDelta,
  applyContributorTrustForOutcome,
  applySponsorTrustForOutcome,
  resetContributorStreakOnDispute,
  CONTRIBUTOR_DISPUTE_LOSS_MODIFIER,
  SPONSOR_REPEAT_UNFAIR_DISPUTE_THRESHOLD,
};
