import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { address, disconnectWallet, role } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completed: 0,
    earnings: 0,
    disputes: 0
  });

  useEffect(() => {
    if (address) {
      fetchProfile();
      fetchUserStats();
    }
  }, [address]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/users/${address}`);
      setProfile(res.data.user || res.data);
    } catch (err) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await api.get(`/api/submissions/mine?address=${address}`);
      const subs = res.data.submissions || [];
      const approved = subs.filter(s => s.status === 'approved');
      setStats({
        completed: approved.length,
        earnings: approved.length * 1000, // Mocking earnings logic for now
        disputes: subs.filter(s => s.status === 'disputed').length
      });
    } catch (err) {
      console.error("Failed to fetch stats");
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant animate-pulse">account_balance_wallet</span>
          <p className="text-on-surface-variant text-lg">Please connect your wallet to view your identity.</p>
        </div>
      </div>
    );
  }

  const expertise = ["Smart Contracts", "Algorand SDK", "Security Auditing", "React", "Node.js"];

  return (
    <div className="px-6 max-w-7xl mx-auto animate-fade-up pb-20">
      {/* Header Section */}
      <header className="mb-12 pt-8">
        <div className="glass-panel p-8 md:p-12 rounded-[2rem] relative overflow-hidden flex flex-col md:flex-row gap-10 items-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] -z-10"></div>
          
          {/* Avatar & Badge */}
          <div className="relative group">
            <div className="w-40 h-40 rounded-3xl overflow-hidden rotate-3 group-hover:rotate-0 transition-transform duration-500 border-2 border-primary/20 p-1 bg-surface-container">
              <div className="w-full h-full rounded-2xl bg-surface-container-highest flex items-center justify-center text-4xl font-headline font-black text-primary">
                {profile?.name?.[0] || address.substring(0, 1).toUpperCase()}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary-fixed text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl shadow-primary/20 tracking-tighter">
              VERIFIED
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <h1 className="text-5xl font-headline font-black tracking-tighter text-on-surface">
                {profile?.name || "Architect.eth"}
              </h1>
              <span className="text-primary bg-primary/10 px-4 py-1.5 rounded-full text-xs font-bold border border-primary/20 mb-1 uppercase tracking-widest">
                {role || "Elite Contributor"}
              </span>
            </div>
            <p className="text-on-surface-variant max-w-xl mb-8 leading-relaxed">
              Decentralized Identity anchored on Algorand. Specializing in high-precision settlement protocols and 
              cross-chain liquidity architecture.
            </p>
            
            {/* Trust Score Bar */}
            <div className="flex flex-col gap-3 max-w-md">
              <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-on-surface-variant">
                <span>IDENTITY TRUST SCORE</span>
                <span className="text-primary">{profile?.trustScore || 850}/1000</span>
              </div>
              <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full shadow-[0_0_12px_rgba(105,218,255,0.4)] transition-all duration-1000"
                  style={{ width: `${(profile?.trustScore || 85) / 10}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button className="secondary-btn w-full md:w-auto">Edit Profile</button>
            <button onClick={disconnectWallet} className="px-6 py-3 bg-error/10 text-error rounded-xl font-bold hover:bg-error/20 transition-all text-sm">
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Stats & Experience */}
        <div className="lg:col-span-4 space-y-12">
          {/* Stats Grid */}
          <section className="grid grid-cols-1 gap-6">
            <div className="surface-1 p-8 rounded-2xl border-l-4 border-primary">
              <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-2">Bounties Completed</p>
              <h3 className="text-5xl font-headline font-black text-primary">{stats.completed || profile?.completedCount || 42}</h3>
            </div>
            <div className="surface-1 p-8 rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 blur-3xl"></div>
              <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-2">Total Earnings</p>
              <h3 className="text-5xl font-headline font-black text-on-surface">
                {stats.earnings || "12.4K"} <span className="text-xl text-on-surface-variant">ALGO</span>
              </h3>
            </div>
          </section>

          {/* Expertise */}
          <section>
            <h2 className="text-xl font-headline font-black mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">psychology</span>
              Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {expertise.map(skill => (
                <span key={skill} className="bg-surface-container-high px-4 py-2 rounded-xl text-xs text-secondary font-bold border border-outline-variant/10">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: History & Proofs */}
        <div className="lg:col-span-8 space-y-12">
          {/* History */}
          <section>
            <h2 className="text-xl font-headline font-black mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              On-Chain Activity
            </h2>
            <div className="space-y-8 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/20">
              <div className="pl-8 relative">
                <div className="absolute left-0 top-1.5 w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(105,218,255,0.6)]"></div>
                <h4 className="font-headline font-bold text-on-surface leading-none mb-2">Deployed Liquidity Vault v3</h4>
                <p className="text-[10px] uppercase font-black text-on-surface-variant mb-3 tracking-widest">March 2024 • Project Lead</p>
                <p className="text-sm text-secondary/70 leading-relaxed">
                  Engineered the core settlement logic for the high-frequency trading protocol, reducing 
                  latency by 15% on the mainnet.
                </p>
              </div>
              <div className="pl-8 relative">
                <div className="absolute left-0 top-1.5 w-3 h-3 bg-surface-container-highest rounded-full border border-outline-variant/30"></div>
                <h4 className="font-headline font-bold text-on-surface leading-none mb-2">Algorand Governance Contributor</h4>
                <p className="text-[10px] uppercase font-black text-on-surface-variant mb-3 tracking-widest">Jan 2024 - Present</p>
                <p className="text-sm text-secondary/70 leading-relaxed">
                  Actively participating in technical reviews for consensus upgrades and validator incentives.
                </p>
              </div>
            </div>
          </section>

          {/* Wallet Address Card */}
          <section className="surface-1 p-8 rounded-3xl border border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Algorand Wallet Address</p>
              <code className="text-lg font-mono text-primary break-all">{address}</code>
            </div>
            <button 
              onClick={() => { navigator.clipboard.writeText(address); toast.success("Address copied!"); }}
              className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all border border-primary/20 whitespace-nowrap"
            >
              Copy Address
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

