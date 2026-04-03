import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SponsorDashboard from "./pages/SponsorDashboard";
import ContributorDashboard from "./pages/ContributorDashboard";
import BountyDetail from "./pages/BountyDetail";
import ValidatorPanel from "./pages/ValidatorPanel";
import TransactionLog from "./pages/TransactionLog";
import ProfilePage from "./pages/ProfilePage";

import "./index.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background text-on-surface font-body selection:bg-primary/30">
        <Navbar />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#201f1f',
              color: '#ffffff',
              border: '1px solid rgba(105, 218, 255, 0.2)',
            },
          }}
        />
        <main className="flex-1 pt-20 pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sponsor" element={<SponsorDashboard />} />
            <Route path="/contributor" element={<ContributorDashboard />} />
            <Route path="/bounty/:id" element={<BountyDetail />} />
            <Route path="/validator" element={<ValidatorPanel />} />
            <Route path="/transactions/:bountyId" element={<TransactionLog />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;