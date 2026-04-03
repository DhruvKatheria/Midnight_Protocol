import React, { createContext, useContext, useState, useEffect } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import api from "../services/api";
import toast from "react-hot-toast";
import algosdk from "algosdk";

const WalletContext = createContext();
const peraWallet = new PeraWalletConnect({ shouldShowSignTxnToast: false });

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [role, setRole] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts?.length) {
        setAddress(accounts[0]);
        fetchUserRole(accounts[0]);
      }
    }).catch((e) => {
      console.warn("Wallet reconnection failed:", e);
    });
  }, []);

  const fetchUserRole = async (walletAddress) => {
    try {
      const res = await api.get(`/api/users/${walletAddress}`);
      setRole(res.data.user?.role || res.data.role); 
    } catch (err) {
      console.warn("Failed to fetch user role, defaulting...");
      setRole("contributor");
    }
  };

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAddress(accounts[0]);
      await fetchUserRole(accounts[0]);
      toast.success("Wallet connected successfully!");
    } catch (error) {
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        toast.error("User rejected request or network error.");
      }
    }
  };

  const disconnectWallet = () => {
    peraWallet.disconnect();
    setAddress(null);
    setRole(null);
    toast.success("Wallet disconnected");
  };

  const signAndSend = async (unsignedTxnsBase64) => {
    try {
      console.log("Decoding base64 without Buffer global...");
      const decodedTxnGroups = unsignedTxnsBase64.map(b64 => {
          const binaryString = atob(b64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Decode into a proper algosdk.Transaction object so Pera can call .toByte()
          const decodedTxn = algosdk.decodeUnsignedTransaction(bytes);
          
          return { txn: decodedTxn, signers: [address] };
      });
      
      console.log("Submitting to Pera Wallet for signature...");
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

  return (
    <WalletContext.Provider value={{ address, role, connectWallet, disconnectWallet, signAndSend }}>
      {children}
      
      {/* Install Pera Modal Fallback */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-brand/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-6 animate-fade-in border-t-4 border-teal">
              <div className="text-5xl">🔒</div>
              <div>
                 <h2 className="text-xl font-bold text-brand">Connect Mobile Wallet</h2>
                 <p className="text-sm text-slate-500 mt-2">Pera Wallet was not detected. Please install it on your mobile device or use the QR gateway to continue.</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowInstallModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded">Dismiss</button>
                 <a href="https://perawallet.app/" target="_blank" rel="noreferrer" className="flex-1 bg-teal hover:bg-teal/90 text-white font-bold py-2 rounded block">Install Pera</a>
              </div>
           </div>
        </div>
      )}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}