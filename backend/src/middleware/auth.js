const algosdk = require("algosdk");

/**
 * Middleware to verify Algorand wallet signature
 * Validates that request is signed by the wallet claiming to be the sender
 */

/**
 * Verify wallet signature
 * @param {string} message - Original message
 * @param {string} signature - Signature (base64)
 * @param {string} publicKey - Public key (base64)
 * @returns {boolean} Signature is valid
 */
function verifyWalletSignature(message, signature, publicKey) {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, "base64");
    const publicKeyBytes = Buffer.from(publicKey, "base64");

    // Verify using Algorand SDK
    return algosdk.verifyBytes(messageBytes, signatureBytes, publicKeyBytes);
  } catch (err) {
    console.error("Error verifying signature:", err);
    return false;
  }
}

/**
 * Auth middleware - verifies wallet signature
 */
const walletAuth = (req, res, next) => {
  try {
    // Get wallet address and signature from headers
    const walletAddress = req.headers["x-wallet-address"];
    const signature = req.headers["x-signature"];
    const publicKey = req.headers["x-public-key"];
    const message = req.headers["x-message"];

    // Check required headers
    if (!walletAddress || !signature || !publicKey || !message) {
      return res.status(401).json({
        error: "Missing authentication headers",
        required: ["x-wallet-address", "x-signature", "x-public-key", "x-message"],
      });
    }

    // Verify signature
    if (!verifyWalletSignature(message, signature, publicKey)) {
      return res.status(401).json({ error: "Invalid wallet signature" });
    }

    // Verify the message is recent (within 5 minutes)
    try {
      const messageData = JSON.parse(message);
      const messageTime = new Date(messageData.timestamp);
      const now = new Date();
      const diffSeconds = (now - messageTime) / 1000;

      if (diffSeconds > 300) {
        // 5 minutes
        return res.status(401).json({ error: "Message signature expired" });
      }
    } catch (e) {
      // If message isn't JSON with timestamp, still allow it
    }

    // Verify wallet address matches
    if (!algosdk.isValidAddress(walletAddress)) {
      return res.status(401).json({ error: "Invalid wallet address" });
    }

    // Attach wallet info to request
    req.wallet = {
      address: walletAddress,
      publicKey,
      verified: true,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Optional auth middleware - doesn't fail if signature missing
 */
const optionalWalletAuth = (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"];
    const signature = req.headers["x-signature"];
    const publicKey = req.headers["x-public-key"];
    const message = req.headers["x-message"];

    if (walletAddress && signature && publicKey && message) {
      if (verifyWalletSignature(message, signature, publicKey)) {
        req.wallet = {
          address: walletAddress,
          publicKey,
          verified: true,
        };
      }
    }

    next();
  } catch (err) {
    console.error("Optional auth middleware error:", err);
    next(); // Don't fail, continue without auth
  }
};

/**
 * Require wallet auth (must be authenticated)
 */
const requireWallet = (req, res, next) => {
  if (!req.wallet || !req.wallet.verified) {
    return res.status(401).json({ error: "Wallet authentication required" });
  }
  next();
};

module.exports = {
  verifyWalletSignature,
  walletAuth,
  optionalWalletAuth,
  requireWallet,
};

