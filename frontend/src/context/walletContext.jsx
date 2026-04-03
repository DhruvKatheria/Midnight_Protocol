import React, { createContext, useContext, useState, useEffect } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import api from "../services/api";
import toast from "react-hot-toast";
import algosdk from "algosdk";

const WalletContext = createContext();
const peraWallet = new PeraWalletConnect({ shouldShowSignTxnToast: false });

// Demo wallet addresses for testing without Pera
const DEMO_WALLETS = {
  sponsor: "DEMO_SPONSOR_ADDR_ALGO_SETTLECHAIN_TEST_1234567890ABCDEFGHIJK",
  contributor: "DEMO_CONTRIBUTOR_ADDR_ALGO_SETTLECHAIN_TEST_1234567890ABCDEF",
  validator: "DEMO_VALIDATOR_ADDR_ALGO_SETTLECHAIN_TEST_1234567890ABCDEFGH",
};

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem("settlechain_role") || null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Persist role to localStorage whenever it changes
  useEffect(() => {
    if (role) {
      localStorage.setItem("settlechain_role", role);
    }
  }, [role]);

  // Try reconnect on mount
  useEffect(() => {
    // Check if there was a demo session saved
    const savedDemo = sessionStorage.getItem("settlechain_demo");
    if (savedDemo) {
      const { address: dAddr, role: dRole } = JSON.parse(savedDemo);
      setAddress(dAddr);
      setRole(dRole);
      setIsDemoMode(true);
      return;
    }

    peraWallet.reconnectSession().then((accounts) => {
      if (accounts?.length) {
        setAddress(accounts[0]);
        // If no stored role, fetch from backend
        if (!role) fetchUserRole(accounts[0]);
      }
    }).catch((e) => {
      console.warn("Wallet reconnection failed:", e);
    });
  }, []);

  const fetchUserRole = async (walletAddress) => {
    try {
      const res = await api.get(`/api/users/${walletAddress}`);
      const fetchedRole = res.data.user?.role || res.data.role;
      if (fetchedRole) setRole(fetchedRole);
    } catch (err) {
      console.warn("Failed to fetch user role from backend.");
      // Don't override stored role on fetch failure
    }
  };

  // Set role (permanently) — called from LoginPage role picker
  const setUserRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem("settlechain_role", newRole);
  };

  // Real wallet connect via Pera
  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAddress(accounts[0]);
      setIsDemoMode(false);
      sessionStorage.removeItem("settlechain_demo");
      await fetchUserRole(accounts[0]);
      toast.success("Wallet connected successfully!");
    } catch (error) {
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        toast.error("User rejected request or network error.");
      }
    }
  };

  // Demo mode connect — bypasses Pera entirely
  const demoConnect = (demoRole) => {
    const demoAddr = DEMO_WALLETS[demoRole] || DEMO_WALLETS.contributor;
    setAddress(demoAddr);
    setRole(demoRole);
    setIsDemoMode(true);
    sessionStorage.setItem("settlechain_demo", JSON.stringify({ address: demoAddr, role: demoRole }));
    toast.success(`Demo mode activated as ${demoRole}`, { icon: "⚡" });
  };

  const disconnectWallet = () => {
    if (isDemoMode) {
      sessionStorage.removeItem("settlechain_demo");
      setIsDemoMode(false);
    } else {
      peraWallet.disconnect();
    }
    setAddress(null);
    // Keep role in localStorage — it's a permanent setting
    toast.success("Wallet disconnected");
  };

  const signAndSend = async (unsignedTxnsBase64) => {
    // In demo mode, return mock signed txns
    if (isDemoMode) {
      toast.success("Demo: Transaction signed (simulated)", { icon: "⚡" });
      return unsignedTxnsBase64.map(() => btoa("DEMO_SIGNED_TXN_" + Date.now()));
    }

    try {
      const decodedTxnGroups = unsignedTxnsBase64.map(b64 => {
          const binaryString = atob(b64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          const decodedTxn = algosdk.decodeUnsignedTransaction(bytes);
          return { txn: decodedTxn, signers: [address] };
      });
      
      const signedTxns = await peraWallet.signTransaction([decodedTxnGroups]);
      toast.success("Transaction signed successfully!");
      return signedTxns.map(tx => {
         let binary = "";
         for (let i = 0; i < tx.byteLength; i++) {
             binary += String.fromCharCode(tx[i]);
         }
         return btoa(binary);
      });
    } catch (error) {
      toast.error("User rejected transaction or Pera failed.");
      throw error;
    }
  };

  // Get the correct dashboard path for the current role
  const getDashboardPath = () => {
    if (role === "sponsor") return "/sponsor";
    if (role === "validator") return "/validator";
    return "/contributor";
  };

  return (
    <WalletContext.Provider value={{
      address, role, isDemoMode,
      connectWallet, demoConnect, disconnectWallet, signAndSend,
      setUserRole, getDashboardPath
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}