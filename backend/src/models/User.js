const mongoose = require("mongoose");
const { INITIAL_TRUST_SCORE } = require("../config/trust");

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true }, // For compatibility, we'll keep uid as a string (usually wallet address or email)
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String }, // Hashed
    walletAddress: { type: String, unique: true, sparse: true },
    role: { type: String, required: true, enum: ["sponsor", "contributor", "validator"] },
    trustScore: { type: Number, default: INITIAL_TRUST_SCORE },
    trustTokenBalance: { type: Number, default: INITIAL_TRUST_SCORE },
    contributorNoDisputeStreak: { type: Number, default: 0 },
    contributorCompletedCount: { type: Number, default: 0 },
    sponsorSuccessfulPayouts: { type: Number, default: 0 },
    sponsorUnfairDisputeLossCount: { type: Number, default: 0 },
    lastTrustUpdateAt: { type: Date },
    isStaked: { type: Boolean, default: false },
    stakeAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
