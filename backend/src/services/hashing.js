const crypto = require("crypto");

/**
 * SHA-256 hash a text string (brief/commit).
 */
function hashBrief(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Compare text against stored hash.
 */
function verifyBrief(text, storedHash) {
  return hashBrief(text) === storedHash;
}

module.exports = { hashBrief, verifyBrief };