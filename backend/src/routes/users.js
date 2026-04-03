const express = require("express");
const router = express.Router();
const { getUser, createUser, updateUser } = require("../services/mongo");

// GET /:address
router.get("/:address", async (req, res) => {
  try {
    let user = await getUser(req.params.address);
    if (!user) {
        // create if not exists
        user = {
            walletAddress: req.params.address,
            role: "contributor",
            trustScore: 50,
            isStaked: false,
            createdAt: new Date().toISOString()
        };
        await createUser(req.params.address, user);
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /:address/trust-score
router.get("/:address/trust-score", async (req, res) => {
  try {
    const user = await getUser(req.params.address);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({ success: true, trustScore: user.trustScore || 50 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST /:address/register-validator
router.post("/:address/register-validator", async (req, res) => {
  try {
    const { stakeAmount } = req.body;
    
    const user = await getUser(req.params.address);
    if (!user) return res.status(404).json({ error: "User not found. Call GET first." });
    
    await updateUser(req.params.address, {
        role: "validator",
        isStaked: true,
        stakeAmount: stakeAmount || 10
    });
    
    res.json({ success: true, message: "Registered as validator" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
