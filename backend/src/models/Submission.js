const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    bountyId: { type: String, required: true },
    contributorAddress: { type: String },
    workUrl: { type: String },
    workHash: { type: String },
    commitmentHash: { type: String },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
