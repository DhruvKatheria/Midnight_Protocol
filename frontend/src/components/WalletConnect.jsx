import React, { useState } from "react";
import { useWallet } from "../context/walletContext";

const WalletConnect = () => {
  const { account, connect, connectManual, disconnect } = useWallet();
  const [walletInput, setWalletInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const handleManualConnect = () => {
    if (walletInput.trim()) {
      connectManual(walletInput.trim());
      setWalletInput("");
      setShowManualInput(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setWalletInput("");
    setShowManualInput(false);
  };

  return (
    <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={connect} style={{ marginRight: "10px" }}>
          Connect with Pera Wallet
        </button>
        <button onClick={() => setShowManualInput(!showManualInput)}>
          {showManualInput ? "Cancel" : "Enter Address"}
        </button>
      </div>

      {showManualInput && (
        <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "5px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            <b>Enter Algorand Wallet Address:</b>
          </label>
          <input
            type="text"
            placeholder="Enter 58-character wallet address (e.g., 7Z5PWO2C...)"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "10px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
            onKeyPress={(e) => e.key === "Enter" && handleManualConnect()}
          />
          <button 
            onClick={handleManualConnect}
            style={{ backgroundColor: "#4CAF50", color: "white", padding: "8px 12px", cursor: "pointer" }}
          >
            Connect
          </button>
        </div>
      )}

      <p>
        <b>Connected Wallet:</b>{" "}
        <span style={{ fontFamily: "monospace", color: account ? "#27ae60" : "#e74c3c" }}>
          {account ? account : "Not connected"}
        </span>
      </p>

      {account && (
        <button 
          onClick={handleDisconnect}
          style={{ backgroundColor: "#e74c3c", color: "white", padding: "6px 10px", cursor: "pointer" }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
};

export default WalletConnect;