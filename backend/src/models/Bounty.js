const mongoose = require("mongoose");

const bountySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // Keeping string ID for backward compatibility with existing UUIDs
    title: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    deadline: { type: Number }, // Timestamp or string? Originally it was mixed (string or unix ts). Number is better.
    status: { type: String, required: true, default: "open" },
    sponsorUid: { type: String },
    sponsorWallet: { type: String },
    sponsorAddress: { type: String }, // Looks like `sponsorAddress` is used highly in frontend
    briefHash: { type: String },
    contentHash: { type: String },
    txId: { type: String },
    transactionHash: { type: String },
    appId: { type: String },
    submissions: { type: Array, default: [] },
    selectedWinner: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bounty", bountySchema);
