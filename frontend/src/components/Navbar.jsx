import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useWallet } from "../context/walletContext";

export default function Navbar() {
  const { address, role, isDemoMode, disconnectWallet, getDashboardPath } = useWallet();

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-primary font-bold border-b-2 border-primary pb-1 font-headline tracking-tight"
      : "text-neutral-400 font-medium hover:text-neutral-200 transition-all duration-200 font-headline tracking-tight";

  // Dynamic dashboard label based on role
  const dashboardLabel = role === "sponsor" ? "Sponsor" : role === "validator" ? "Validator" : "Dashboard";

  return (
    <nav className="fixed top-0 w-full z-50 bg-neutral-900/70 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tighter text-primary font-headline">
            SettleChain
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <NavLink to={getDashboardPath()} className={linkClass}>{dashboardLabel}</NavLink>
            <NavLink to="/transactions/all" className={linkClass}>Log</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {address ? (
            <>
              {isDemoMode && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">⚡ Demo</span>
              )}
              {role && (
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest capitalize">{role}</span>
              )}
              <div className="hidden md:flex items-center bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant">
                <span className={`w-2 h-2 rounded-full mr-2 ${isDemoMode ? 'bg-yellow-400' : 'bg-primary'}`}></span>
                {isDemoMode ? `demo_${role}` : `${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
              <button
                onClick={disconnectWallet}
                className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg font-bold text-sm hover:bg-surface-bright transition-all active:scale-95"
              >
                Disconnect
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="cta-gradient text-on-primary-container px-5 py-2 rounded-lg font-bold text-sm active:scale-95 transition-transform"
            >
              Connect Wallet
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
