import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import api from "../services/api";
import toast from "react-hot-toast";

const ROLES = [
  { key: "sponsor", label: "Sponsor", icon: "account_balance", desc: "Deploy bounties, fund escrows, and manage contractors.", color: "from-cyan-500 to-blue-600" },
  { key: "contributor", label: "Contributor", icon: "code", desc: "Pick up bounties, submit work, and earn ALGO rewards.", color: "from-violet-500 to-purple-600" },
  { key: "validator", label: "Validator", icon: "gavel", desc: "Stake ALGO, resolve disputes, and govern the network.", color: "from-amber-500 to-orange-600" },
];

export default function LoginPage() {
  const { connectWallet, demoConnect, setUserRole, address, role, getDashboardPath } = useWallet();
  const navigate = useNavigate();

  // Step 1: Role selection → Step 2: Auth method
  const [step, setStep] = useState(role ? 2 : 1);
  const [selectedRole, setSelectedRole] = useState(role || "");
  const [activeTab, setActiveTab] = useState("wallet");
  const [demoMode, setDemoMode] = useState(false);

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // If already connected, redirect to dashboard
  useEffect(() => {
    if (address && role) {
      navigate(getDashboardPath());
    }
  }, [address, role]);

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setUserRole(roleKey);
    setStep(2);
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
      navigate(getDashboardPath());
    } catch (e) {
      // handled by walletContext
    }
  };

  const handleDemoLogin = (demoRole) => {
    demoConnect(demoRole || selectedRole);
    const targetRole = demoRole || selectedRole;
    if (targetRole === "sponsor") navigate("/sponsor");
    else if (targetRole === "validator") navigate("/validator");
    else navigate("/contributor");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Fill all fields.");
    setAuthLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password, role: selectedRole });
      toast.success("Logged in successfully!");
      navigate(getDashboardPath());
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Fill all fields.");
    setAuthLoading(true);
    try {
      const res = await api.post("/api/auth/signup", { name, email, password, role: selectedRole });
      toast.success("Account created!");
      navigate(getDashboardPath());
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const tabClass = (tab) =>
    `flex-1 py-4 text-sm font-semibold transition-all duration-300 relative ${
      activeTab === tab
        ? "text-on-surface font-bold after:content-[''] after:absolute after:bottom-[-2px] after:left-[20%] after:right-[20%] after:h-[2px] after:bg-primary after:rounded-full after:shadow-[0_0_10px_rgba(105,218,255,0.5)]"
        : "text-on-surface-variant hover:text-on-surface"
    }`;

  return (
    <div className="min-h-[80vh] mesh-gradient flex flex-col items-center justify-center px-4 py-8 animate-fade-in">
      {/* Node status */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-surface-container-high/90 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl border border-primary/20 pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
        </div>
        <p className="text-xs font-semibold tracking-wide uppercase">Algorand Node: TestNet Active</p>
      </div>

      {/* STEP 1: Role Selection */}
      {step === 1 && (
        <div className="w-full max-w-[640px] glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface">I am a...</h2>
            <p className="text-on-surface-variant mt-3 text-sm">Select your role to personalize your SettleChain experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ROLES.map(r => (
              <button
                key={r.key}
                onClick={() => handleRoleSelect(r.key)}
                className="group flex flex-col items-center p-6 bg-surface-container-low rounded-2xl hover:bg-surface-container-high border-2 border-transparent hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(105,218,255,0.15)]"
              >
                <div className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-white text-3xl">{r.icon}</span>
                </div>
                <h3 className="text-lg font-headline font-bold text-on-surface mb-2">{r.label}</h3>
                <p className="text-on-surface-variant text-xs text-center leading-relaxed">{r.desc}</p>
              </button>
            ))}
          </div>

          {/* Quick Demo */}
          <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
            <p className="text-on-surface-variant text-xs mb-3">Want to explore first?</p>
            <div className="flex gap-3 justify-center">
              {ROLES.map(r => (
                <button key={r.key} onClick={() => handleDemoLogin(r.key)} className="px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold rounded-lg hover:bg-primary/20 hover:text-primary transition-all">
                  Demo {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Auth Method */}
      {step === 2 && (
        <div className="w-full max-w-[480px] glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>

          {/* Back to role picker */}
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-on-surface-variant text-sm hover:text-primary transition mb-6">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Change role
          </button>

          {/* Active Role Badge */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-surface-container-high rounded-xl">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROLES.find(r => r.key === selectedRole)?.color} flex items-center justify-center shadow-md`}>
              <span className="material-symbols-outlined text-white text-xl">{ROLES.find(r => r.key === selectedRole)?.icon}</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Signing in as</p>
              <p className="text-sm font-headline font-bold text-on-surface capitalize">{selectedRole}</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center border-b border-outline-variant/10 mb-8 relative">
            <button className={tabClass("login")} onClick={() => setActiveTab("login")}>Login</button>
            <button className={tabClass("signup")} onClick={() => setActiveTab("signup")}>Sign Up</button>
            <button className={tabClass("wallet")} onClick={() => setActiveTab("wallet")}>Connect Wallet</button>
          </div>

          {/* Login Tab */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-headline font-bold">Welcome Back</h2>
                <p className="text-on-surface-variant mt-2 text-sm">Sign in to your SettleChain account</p>
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
              </div>
              <button disabled={authLoading} type="submit" className="w-full py-4 primary-gradient rounded-xl font-bold text-on-primary-container shadow-xl hover:scale-[0.98] active:opacity-80 transition-all duration-300 disabled:opacity-50">
                {authLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Signup Tab */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-headline font-bold">Create Account</h2>
                <p className="text-on-surface-variant mt-2 text-sm">Join as a {selectedRole} on SettleChain</p>
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-2">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Satoshi Nakamoto" />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Min 8 characters" />
              </div>
              <button disabled={authLoading} type="submit" className="w-full py-4 primary-gradient rounded-xl font-bold text-on-primary-container shadow-xl hover:scale-[0.98] active:opacity-80 transition-all duration-300 disabled:opacity-50">
                {authLoading ? "Creating..." : `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account`}
              </button>
            </form>
          )}

          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-headline font-bold text-on-surface">Connect Your Wallet</h2>
                <p className="text-on-surface-variant mt-2 text-sm">Secure, decentralized access as a {selectedRole}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Pera Wallet", icon: "account_balance_wallet" },
                  { name: "AlgoSigner", icon: "extension" },
                  { name: "Defly Wallet", icon: "smartphone" },
                  { name: "WalletConnect", icon: "link" },
                ].map((w) => (
                  <button
                    key={w.name}
                    onClick={handleConnect}
                    className="group flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-xl hover:bg-surface-container-high hover:scale-[1.02] border border-transparent hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="w-14 h-14 mb-3 rounded-xl flex items-center justify-center bg-black shadow-inner">
                      <span className="material-symbols-outlined text-primary text-3xl">{w.icon}</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{w.name}</span>
                  </button>
                ))}
              </div>

              {/* Demo Mode */}
              <div className="pt-6 mt-2 border-t border-outline-variant/10">
                <div className="flex items-center justify-between p-4 bg-surface-container-lowest/50 rounded-xl border border-outline-variant/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Demo Mode</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Quick test as {selectedRole}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDemoMode(!demoMode)}
                    className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 ${demoMode ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'}`}
                  >
                    <div className={`w-5 h-5 rounded-full shadow-md ${demoMode ? 'bg-white' : 'bg-on-surface-variant'}`}></div>
                  </button>
                </div>

                {demoMode && (
                  <button
                    onClick={() => handleDemoLogin(selectedRole)}
                    className="w-full mt-4 flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-xl hover:bg-primary/20 border border-primary/30 transition-all group"
                  >
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">bolt</span>
                    <span className="text-sm font-bold text-primary">Enter Demo as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</span>
                  </button>
                )}
              </div>

              <button onClick={handleConnect} className="w-full py-4 primary-gradient rounded-xl font-bold text-on-primary-container shadow-[0_10px_20px_rgba(105,218,255,0.2)] hover:scale-[0.98] active:scale-95 transition-all duration-300">
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <p className="text-on-surface-variant text-sm flex items-center gap-2">
          New to decentralized bounties?
          <a className="text-primary font-bold hover:underline decoration-2 underline-offset-4" href="#">Explore Docs</a>
        </p>
      </div>
    </div>
  );
}
