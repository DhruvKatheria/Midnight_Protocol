const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true }, // For compatibility, we'll keep uid as a string (usually wallet address or email)
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String }, // Hashed
    walletAddress: { type: String, unique: true, sparse: true },
    role: { type: String, required: true, enum: ["sponsor", "contributor", "validator"] },
    trustScore: { type: Number, default: 50 },
    isStaked: { type: Boolean, default: false },
    stakeAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
