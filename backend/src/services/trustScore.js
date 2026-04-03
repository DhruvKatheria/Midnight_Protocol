const { getUser, updateUser } = require("./mongo");
const algosdk = require("algosdk");
const { algodClient } = require("./algorand");

/**
 * Updates trust score in Firestore and issues corresponding ASA tokens
 */
async function updateTrustScore(userAddress, delta, reason) {
  try {
    // 1. Update Firestore
    const user = await getUser(userAddress);
    if (!user) {
        console.warn(`User ${userAddress} not found in DB to update score.`);
        return;
    }
    
    const oldScore = user.trustScore || 50;
    const newScore = Math.max(0, Math.min(100, oldScore + delta));
    await updateUser(userAddress, { trustScore: newScore });
    
    console.log(`[TrustScore] Updated ${userAddress}: ${oldScore} -> ${newScore} (${reason})`);

    // 2. Mint or Burn Trust Token ASA
    const adminMnemonic = process.env.ADMIN_MNEMONIC;
    const assetId = parseInt(process.env.TRUST_TOKEN_ASSET_ID || "0");
    
    if (adminMnemonic && adminMnemonic !== "your 25-word admin mnemonic" && assetId > 0) {
        const adminAccount = algosdk.mnemonicToSecretKey(adminMnemonic);
        const params = await algodClient.getTransactionParams().do();
        
        let txn;
        if (delta > 0) {
            // Mint: Send from Reserve (Admin) to User
            txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                sender: adminAccount.addr,
                receiver: userAddress,
                assetIndex: assetId,
                amount: Math.abs(delta),
                suggestedParams: params
            });
            console.log(`[TrustScore] Minting ${Math.abs(delta)} Trust Tokens for ${userAddress}`);
        } else if (delta < 0) {
            // Burn: Clawback from User to Reserve (Admin)
            txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                sender: adminAccount.addr,
                receiver: adminAccount.addr,
                revocationTarget: userAddress,
                assetIndex: assetId,
                amount: Math.abs(delta),
                suggestedParams: params
            });
            console.log(`[TrustScore] Clawing back ${Math.abs(delta)} Trust Tokens from ${userAddress}`);
        }
        
        if (txn) {
            const signedTxn = txn.sign(adminAccount.sk);
            const txId = await algodClient.sendRawTransaction(signedTxn).do();
            await algosdk.waitForConfirmation(algodClient, txId.txId, 4);
            console.log(`[TrustScore] ASA updated on-chain. TxID: ${txId.txId}`);
        }
    } else {
        console.log("[TrustScore] ADMIN_MNEMONIC or ASSET_ID missing. Skipping ASA logic.");
    }
    
    return newScore;

  } catch (error) {
    console.error(`[TrustScore Error] Failed to update for ${userAddress}:`, error);
  }
}

module.exports = {
  updateTrustScore
};
