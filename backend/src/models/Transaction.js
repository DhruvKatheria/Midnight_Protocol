const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    bountyId: { type: String },
    action: { type: String },
    actor: { type: String },
    txId: { type: String },
    amount: { type: Number },
    timestamp: { type: String },
    trustDeltaContributor: { type: Number },
    trustDeltaSponsor: { type: Number },
    trustFormulaSnapshot: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
