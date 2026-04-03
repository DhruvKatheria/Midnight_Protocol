import React, { useState } from "react";
import API from "../services/api";
import { useWallet } from "../context/walletContext";

const CreateBountyForm = ({ onSuccess }) => {
  const { account, address, peraWallet, signAndSend } = useWallet();
  const [loading, setLoading] = useState(false);

  // Fallback to address since walletContext defines address, though CreateBountyForm previously destructured 'account'
  const activeAddress = account || address;

  const handleCreate = async () => {
    try {
      if (!activeAddress) {
        alert("❌ No wallet connected. Please connect a wallet first.");
        return;
      }

      if (activeAddress.length !== 58) {
        alert(`❌ Invalid wallet address. Expected 58 characters.`);
        return;
      }

      setLoading(true);

      const bountyDataTemplate = {
        title: "Landing Page",
        description: "Build SaaS UI",
        reward: 1000000,
        deadline: "2026-04-10",
        sponsorAddress: activeAddress.trim(), 
      };

      console.log("📡 Sending request to /api/bounties/create...");
      
      const res = await API.post("/api/bounties/create", bountyDataTemplate);
      
      console.log("📨 Backend formulation received:", res.data);

      const { success, unsignedAppCallTxn, unsignedPayTxn, briefHash } = res.data;

      if (!success || !unsignedAppCallTxn || !unsignedPayTxn) {
        throw new Error("Invalid response from server. Missing unsigned transaction payloads.");
      }

      // Add briefHash to the template since the backend just computed it
      bountyDataTemplate.briefHash = briefHash;

      if (peraWallet) {
        console.log("✅ Pera Wallet detected - sending transactions for signature...");
        
        // Let walletContext bridge the base64 signatures (payTxn first — contract requires Gtxn[0] = Payment)
        const signedGroupTxnBase64 = await signAndSend([unsignedPayTxn, unsignedAppCallTxn]);

        if (!signedGroupTxnBase64) {
          throw new Error("Signing failed or user rejected.");
        }

        console.log("📲 Submitting signed payload to /confirm...");

        const confirmRes = await API.post("/api/bounties/confirm", {
          signedGroupTxnBase64,
          bountyData: bountyDataTemplate
        });

        console.log("🎉 Bounty confirmed deployed:", confirmRes.data);
        alert("🎉 Bounty Created Successfully!\nTX ID: " + confirmRes.data.bounty.txId);
        
      } else {
        console.log("⚠️ Manual fallback - confirming simulated payload.");
        
        const confirmRes = await API.post("/api/bounties/confirm", {
          signedGroupTxnBase64: ["simulated_base64_string_bypass"],
          bountyData: bountyDataTemplate
        });
        
        console.log("🎉 Bounty locally committed:", confirmRes.data);
        alert("🎉 Bounty Created Successfully! (Simulation)");
      }

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("❌ ERROR:", err);
      let errorMsg = "Transaction failed";
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      alert("❌ Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 mt-5 w-full">
      <h3 className="text-xl font-bold mb-4 neon-text">Create Mock Bounty</h3>
      <p className="text-gray-400 mb-6 text-sm">
        This prototypes the transaction flow. Let's create a 1,000,000 MicroAlgo bounty.
      </p>
      <button 
        onClick={handleCreate}
        disabled={loading}
        className="primary-btn w-full"
      >
        {loading ? "Processing..." : "🚀 Construct & Sign Transaction"}
      </button>
    </div>
  );
};

export default CreateBountyForm;