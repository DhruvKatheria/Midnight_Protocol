import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { address, disconnectWallet } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) fetchProfile();
  }, [address]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/users/${address}`);
      setProfile(res.data);
    } catch (err) {
      // may not exist yet
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-on-surface-variant text-lg">Please connect your wallet.</p></div>;
  }

  return (
    <div className="px-6 max-w-4xl mx-auto animate-fade-in pb-10">
      <header className="mb-12 pt-4">
        <h1 className="text-5xl font-headline font-extrabold tracking-tighter mb-4">
          My <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-on-surface-variant text-lg">Your on-chain identity on the SettleChain network.</p>
      </header>

      {loading ? (
        <div className="animate-pulse bg-surface-container-low h-64 rounded-2xl"></div>
      ) : (
        <div className="space-y-8">
          {/* Identity Card */}
          <div className="bg-surface-container-low p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>
            <div className="flex items-center gap-6 mb-8 relative z-10">
              <div className="w-20 h-20 rounded-full bg-surface-container-highest border-2 border-primary/30 flex items-center justify-center">
                <span className="text-3xl font-headline font-extrabold text-primary">
                  {profile?.role?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-headline font-bold">{profile?.name || "SettleChain User"}</h2>
                <p className="text-sm font-mono text-on-surface-variant mt-1 break-all">{address}</p>
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-xs font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">badge</span>
                  {profile?.role || "Contributor"}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              <div className="bg-surface-container p-5 rounded-xl text-center">
                <p className="text-3xl font-headline font-bold text-primary">{profile?.bountiesCreated || 0}</p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-widest">Bounties</p>
              </div>
              <div className="bg-surface-container p-5 rounded-xl text-center">
                <p className="text-3xl font-headline font-bold text-on-surface">{profile?.submissionsCount || 0}</p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-widest">Submissions</p>
              </div>
              <div className="bg-surface-container p-5 rounded-xl text-center">
                <p className="text-3xl font-headline font-bold text-tertiary">{profile?.disputesResolved || 0}</p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-widest">Disputes</p>
              </div>
              <div className="bg-surface-container p-5 rounded-xl text-center">
                <p className="text-3xl font-headline font-bold text-primary">{profile?.algoEarned || 0}</p>
                <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-widest">ALGO Earned</p>
              </div>
            </div>
          </div>

          {/* Trust Score */}
          <div className="bg-surface-container-low p-8 rounded-2xl">
            <h3 className="text-xl font-headline font-bold mb-6">Trust Score</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#262626" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="#69daff" strokeWidth="8"
                    strokeDasharray={`${(profile?.trustScore || 75) * 2.51} 999`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-headline font-bold text-primary">{profile?.trustScore || 75}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface-variant">On-Time Delivery</span>
                    <span className="text-on-surface font-medium">92%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface-variant">Quality Score</span>
                    <span className="text-on-surface font-medium">88%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface-variant">Dispute Rate</span>
                    <span className="text-on-surface font-medium">3%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-error rounded-full" style={{ width: '3%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={disconnectWallet}
              className="flex-1 bg-surface-container-high text-on-surface font-bold py-4 rounded-xl hover:bg-error/10 hover:text-error transition-colors"
            >
              Disconnect Wallet
            </button>
            <button className="flex-1 bg-surface-container-highest text-on-surface font-bold py-4 rounded-xl hover:bg-surface-bright transition-colors">
              Export Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
