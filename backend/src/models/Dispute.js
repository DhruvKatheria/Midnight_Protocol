const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    bountyId: { type: String, required: true },
    raisedBy: { type: String },
    reason: { type: String },
    validators: { type: [String], default: [] },
    votes: {
      approve: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
    },
    voterAddresses: { type: [String], default: [] },
    voters: { type: [String], default: [] },
    status: { type: String, default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
