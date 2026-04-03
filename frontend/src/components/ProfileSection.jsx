import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import api from "../services/api";

const TRUST_REFRESH_EVENT = "settlechain:trust-refresh";
const TRUST_SCORE_FALLBACK = 50;
const TRUST_SCORE_POLL_MS = 10000;

export default function ProfileSection() {
  const { address, role } = useWallet();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserEmail = localStorage.getItem("userEmail");
    const identity = storedUserId || storedUserEmail || address;

    if (!identity) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/api/users/${identity}`);
      setProfile(res.data.user || res.data);
    } catch (err) {
      console.warn("Profile not found or API error");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!address) return undefined;

    const intervalId = window.setInterval(fetchProfile, TRUST_SCORE_POLL_MS);
    const onTrustRefresh = () => fetchProfile();
    window.addEventListener(TRUST_REFRESH_EVENT, onTrustRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(TRUST_REFRESH_EVENT, onTrustRefresh);
    };
  }, [address, fetchProfile]);


  if (!address) return null;

  const resolvedTrustScore = Number.isFinite(Number(profile?.trustScore))
    ? Number(profile.trustScore)
    : TRUST_SCORE_FALLBACK;

  return (
    <aside className="w-64 flex flex-col py-6 h-full">
      {/* User Identity Card */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden flex items-center justify-center text-on-primary-fixed font-bold">
          {profile?.avatar ? (
            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            address.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="overflow-hidden">
          <p className="font-headline font-bold text-sm text-on-surface truncate">
            {profile?.name || (address.substring(0, 6) + "..." + address.substring(address.length - 4))}
          </p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest truncate">
            {role || "Contributor"}
          </p>
          <p className="text-[11px] text-primary font-black uppercase tracking-wider mt-1">
            Trust Score: {resolvedTrustScore.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        <Link to="/profile" className="sidebar-link">
          <span className="material-symbols-outlined text-lg">fingerprint</span>
          <span>Identity</span>
        </Link>
        <div className="sidebar-link opacity-40 cursor-not-allowed">
          <span className="material-symbols-outlined text-lg">token</span>
          <span>Trust Score</span>
        </div>
        <Link to="/validators" className="sidebar-link">
          <span className="material-symbols-outlined text-lg">gavel</span>
          <span>Validators</span>
        </Link>
        <div className="sidebar-link opacity-40 cursor-not-allowed">
          <span className="material-symbols-outlined text-lg">troubleshoot</span>
          <span>Disputes</span>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto px-6 pt-6 space-y-2 border-t border-outline-variant/10">
        <Link to="/profile" className="text-on-surface-variant hover:text-on-surface px-2 py-3 flex items-center gap-3 transition-all text-sm group">
          <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform" style={{ fontSize: '18px' }}>settings</span>
          <span>Account Settings</span>
        </Link>
        <div className="text-on-surface-variant px-2 py-3 flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Node Connected
        </div>
      </div>
    </aside>
  );
}
