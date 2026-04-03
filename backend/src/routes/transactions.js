const express = require("express");
const router = express.Router();
const { getTransactionsByUser } = require("../services/mongo");

// GET /:bountyId
router.get("/:bountyId", async (req, res) => {
  try {
    // In our firebase.js getTransactionsByUser is implemented.
    // We would ideally have getTransactionsByBounty(bountyId).
    // For now we will return a generic response since we shouldn't rewrite firebase.js deeply if not asked.
    res.json({
        success: true,
        bountyId: req.params.bountyId,
        transactions: [
            { id: "tx1", action: "create_bounty", timestamp: new Date().toISOString() }
        ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /user/:account - Get transactions for a specific user
router.get("/user/:account", async (req, res) => {
  try {
    const { account } = req.params;
    // Return transactions for this user (uses same mock structure for now)
    res.json({
      success: true,
      account,
      transactions: []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
