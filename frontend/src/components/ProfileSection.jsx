import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import api from "../services/api";

export default function ProfileSection() {
  const { address, role } = useWallet();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchProfile();
    }
  }, [address]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/users/${address}`);
      setProfile(res.data.user || res.data);
    } catch (err) {
      console.warn("Profile not found or API error");
    } finally {
      setLoading(false);
    }
  };


  if (!address) return null;

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
          <span>Trust Tokens</span>
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
