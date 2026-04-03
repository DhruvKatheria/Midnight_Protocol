import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useWallet } from "./context/walletContext";
import { WifiOff, ShieldCheck } from "lucide-react";

// Pages
import LandingPage from "./pages/LandingPage";
import SponsorDashboard from "./pages/SponsorDashboard";
import ContributorDashboard from "./pages/ContributorDashboard";
import BountyDetail from "./pages/BountyDetail";
import ValidatorPanel from "./pages/ValidatorPanel";
import TransactionLog from "./pages/TransactionLog";
import ProfilePage from "./pages/ProfilePage";

import "./index.css";

function Navigation() {
  const { address, role, disconnectWallet } = useWallet();

  return (
    <nav className="bg-brand text-white py-4 px-6 shadow-lg flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold tracking-wider hover:text-teal transition flex items-center gap-2">
        <ShieldCheck className="text-teal" size={28} /> SettleChain
      </Link>
      
      <div className="flex gap-6 items-center">
        {address ? (
          <>
            <span className="bg-white/10 px-3 py-1 rounded text-xs font-bold font-mono border border-white/20">Trust Score: {role==="sponsor"?80:role==="validator"?95:60}</span>
            {(role === "sponsor" || !role) && (
              <Link to="/sponsor" className="hover:text-gold transition font-medium">Sponsor</Link>
            )}
            {(role === "contributor" || !role) && (
              <Link to="/contributor" className="hover:text-gold transition font-medium">Contributor</Link>
            )}
            {role === "validator" && (
              <Link to="/validator" className="hover:text-gold transition font-medium">Validator</Link>
            )}
            <Link to="/profile" className="hover:text-gold transition font-medium">Profile</Link>
            <button 
              onClick={disconnectWallet}
              className="bg-accent px-4 py-2 rounded-md hover:bg-opacity-80 transition font-medium border border-teal"
            >
              {address.slice(0,6)}...{address.slice(-4)}
            </button>
          </>
        ) : (
          <span className="text-gray-400 italic text-sm">Not connected</span>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-transparent text-gray-100">
        <Navigation />
        {/* Offline Cache Banner Fallback */}
        <div id="offline-banner" className="hidden bg-yellow-500 text-yellow-900 font-bold text-sm text-center py-2 flex items-center justify-center gap-2 shadow-sm relative z-40">
           <WifiOff size={16} /> Blockchain unavailable — showing cached Firebase data
        </div>
        <Toaster position="bottom-right" />
        <main className="flex-1 w-full max-w-6xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sponsor" element={<SponsorDashboard />} />
            <Route path="/contributor" element={<ContributorDashboard />} />
            <Route path="/bounty/:id" element={<BountyDetail />} />
            <Route path="/validator" element={<ValidatorPanel />} />
            <Route path="/transactions/:bountyId" element={<TransactionLog />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <footer className="bg-brand text-slate-400 text-center py-6 mt-12 text-sm">
          SettleChain © 2026. Built on Algorand.
        </footer>
      </div>
    </Router>
  );
}

export default App;