import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import { Lock } from "lucide-react";

export default function LandingPage() {
  const { address, role, connectWallet } = useWallet();
  const navigate = useNavigate();
  const [lockedAlgo, setLockedAlgo] = useState(0);

  // Animated Counter Effect
  useEffect(() => {
    let current = 0;
    const target = 154000;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setLockedAlgo(target);
        clearInterval(timer);
      } else {
        setLockedAlgo(Math.floor(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center w-full mt-4 animate-fade-in fade-in-up">
      <div className="max-w-3xl space-y-8">
        
        {/* HERO */}
        <h1 className="text-6xl font-extrabold text-brand tracking-tight">
          Settle<span className="text-teal">Chain</span>
        </h1>
        <p className="text-xl text-slate-500 font-light">
          Trustless Bounty Settlement on <b className="text-slate-800">Algorand</b>.
        </p>
        <p className="text-3xl font-semibold italic text-accent opacity-90 pb-8">
          "Code enforces fairness. Blockchain is the proof."
        </p>

        {/* ALGO Locked Hero Animation */}
        <div className="border border-teal bg-teal/5 p-6 rounded-2xl flex flex-col items-center gap-2 max-w-sm mx-auto shadow-sm mb-8 transform hover:scale-105 transition-transform duration-300">
           <Lock size={32} className="text-teal" />
           <div className="text-5xl font-extrabold text-teal">
              {lockedAlgo.toLocaleString()} <span className="text-2xl">ALGO</span>
           </div>
           <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Safely Locked in Smart Contracts</span>
        </div>

        {/* CONNECT WALLET OR ROLE ROUTING */}
        {!address ? (
          <button 
            onClick={connectWallet}
            className="px-10 py-4 bg-teal text-white font-bold text-lg rounded-full shadow-lg hover:shadow-teal/50 hover:-translate-y-1 transition transform duration-300 w-full md:w-auto"
          >
            Connect Pera Wallet
          </button>
        ) : (
          <div className="bg-white border rounded-xl shadow-sm p-8 max-w-lg mx-auto space-y-6">
            <h2 className="text-xl font-medium">Select your dashboard</h2>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => navigate('/sponsor')}
                className="bg-accent text-white py-3 rounded-lg hover:bg-opacity-90 transition font-medium"
              >
                💼 I am a Sponsor
              </button>
              <button 
                onClick={() => navigate('/contributor')}
                className="bg-brand text-white py-3 rounded-lg hover:bg-opacity-90 transition font-medium"
              >
                🎯 I am a Contributor
              </button>
              <button 
                onClick={() => navigate('/validator')}
                className="bg-gold text-brand py-3 rounded-lg hover:bg-opacity-90 transition font-medium"
              >
                ⚖️ I am a Validator
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mt-24">
        {[
          { label: "Total Bounties", val: "1,248+" },
          { label: "Platform Trust", val: "Consensus" },
          { label: "Disputes Resolved", val: "38" },
          { label: "Active Validators", val: "215" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
             <span className="text-3xl font-bold text-brand">{stat.val}</span>
             <span className="text-sm font-medium text-slate-400 mt-2">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
