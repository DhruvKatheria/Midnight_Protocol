import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";

export default function ProfilePage() {
  const { address, role } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchProfile();
    }
  }, [address]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/api/users/${address}`);
      setProfile(res.data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!address) return <div className="p-10 text-center">Please connect wrapper.</div>;
  if (loading || !profile) return <div className="p-10 animate-pulse bg-slate-200 h-64 rounded-xl max-w-3xl mx-auto"></div>;

  // Gauge calculation (0-200 mapping for UI visual scale)
  const score = profile.trustScore || 0;
  const percentage = Math.min((score / 200) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      
      <div className="grid md:grid-cols-3 gap-8">
         {/* Trust Gauge Card */}
         <div className="md:col-span-1 bg-brand text-white p-8 rounded-2xl shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
             
             {/* Decorative background circle */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent rounded-full opacity-50 blur-2xl"></div>

             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 relative z-10">Trust Score</h2>
             
             {/* Simple static SVG Gauge approximation */}
             <div className="relative w-40 h-40 flex items-center justify-center z-10">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-accent" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-teal" strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                   <span className="text-4xl font-extrabold">{score}</span>
                   <span className="text-xs text-slate-400 mt-1 uppercase">/ 200</span>
                </div>
             </div>

             <div className="mt-8 text-center relative z-10">
                 <div className="bg-white/10 px-4 py-2 rounded-full inline-block backdrop-blur-sm">
                   <span className="text-xs font-bold font-mono">ASSET: TRUST Token balances map to this.</span>
                 </div>
             </div>
         </div>

         {/* Info & Badges */}
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center h-full">
               <div className="mb-2 uppercase text-xs font-bold text-slate-400">Wallet Identity</div>
               <div className="font-mono text-lg text-brand break-all bg-slate-50 p-3 rounded border border-slate-100 mb-6">
                  {address}
               </div>

               <div className="mb-2 uppercase text-xs font-bold text-slate-400">Current Role</div>
               <div className="inline-block bg-gold/20 text-gold font-extrabold uppercase px-4 py-2 rounded mb-8 text-sm max-w-fit">
                  {role || 'Contributor'}
               </div>

               <div className="mb-3 uppercase text-xs font-bold text-slate-400">Reputation Badges</div>
               <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded shadow-sm">
                     🌟 First Bounty Completed
                  </span>
                  {score > 80 && (
                    <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal text-white text-xs font-bold rounded shadow-sm">
                       🤝 Fair Sponsor
                    </span>
                  )}
                  {profile.isStaked && (
                    <span className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-500 text-white text-xs font-bold rounded shadow-sm">
                       ⚖️ Honest Validator
                    </span>
                  )}
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
