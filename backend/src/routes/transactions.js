const express = require("express");
const router = express.Router();
const { getTransactionsByUser, getAllTransactions, getTransactionsByBounty } = require("../services/mongo");

// GET /:bountyId
router.get("/:bountyId", async (req, res) => {
  try {
    const { bountyId } = req.params;
    let transactions = [];
    
    if (bountyId === "all") {
        transactions = await getAllTransactions();
    } else {
        transactions = await getTransactionsByBounty(bountyId);
    }
    
    res.json({
        success: true,
        bountyId,
        transactions
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
    const transactions = await getTransactionsByUser(account);
    res.json({
      success: true,
      account,
      transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
