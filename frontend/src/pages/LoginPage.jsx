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

  // Step 1: Auth (Login/Signup) → Step 2: Wallet Connect
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState("login");
  const [demoMode, setDemoMode] = useState(false);

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authRole, setAuthRole] = useState("contributor");
  const [authLoading, setAuthLoading] = useState(false);

  // If already fully connected (both auth and wallet), redirect to dashboard
  useEffect(() => {
    if (address && role) {
      navigate(getDashboardPath());
    }
  }, [address, role]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      navigate(getDashboardPath());
    } catch (e) {
      // handled by walletContext
    }
  };

  const handleDemoLogin = () => {
    demoConnect(role || authRole);
    const targetRole = role || authRole;
    if (targetRole === "sponsor") navigate("/sponsor");
    else if (targetRole === "validator") navigate("/validator");
    else navigate("/contributor");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Fill all fields.");
    setAuthLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      toast.success("Logged in successfully!");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data._id); // Save UID for governance identification
      setUserRole(res.data.role); // Save role derived from backend
      setStep(2); // Proceed to wallet connect
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
      const res = await api.post("/api/auth/signup", { name, email, password, role: authRole });
      toast.success("Account created!");
      localStorage.setItem("token", res.data.token);
      setUserRole(authRole);
      setStep(2); // Proceed to wallet connect
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

      {/* STEP 1: Web2 Auth Method */}
      {step === 1 && (
        <div className="w-full max-w-[480px] glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>

          {/* Tab Switcher */}
          <div className="flex items-center border-b border-outline-variant/10 mb-8 relative">
            <button className={tabClass("login")} onClick={() => setActiveTab("login")}>Login</button>
            <button className={tabClass("signup")} onClick={() => setActiveTab("signup")}>Sign Up</button>
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
                <p className="text-on-surface-variant mt-2 text-sm">Join SettleChain today</p>
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

              {/* Role Selection inside Signup form */}
              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-3">Select your role</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setAuthRole("sponsor")} className={`flex-1 py-3 text-sm font-bold border rounded-xl transition-all ${authRole === "sponsor" ? "border-primary bg-primary/10 text-primary" : "border-outline text-on-surface-variant hover:border-primary/50"}`}>
                    Sponsor
                  </button>
                  <button type="button" onClick={() => setAuthRole("contributor")} className={`flex-1 py-3 text-sm font-bold border rounded-xl transition-all ${authRole === "contributor" ? "border-primary bg-primary/10 text-primary" : "border-outline text-on-surface-variant hover:border-primary/50"}`}>
                    Contributor
                  </button>
                </div>
              </div>

              <button disabled={authLoading} type="submit" className="w-full py-4 primary-gradient rounded-xl font-bold text-on-primary-container shadow-xl hover:scale-[0.98] active:opacity-80 transition-all duration-300 disabled:opacity-50">
                {authLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}

          {/* Quick Demo */}
          <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
            <p className="text-on-surface-variant text-xs mb-3">Want to explore first without signing up?</p>
            <button onClick={() => { setAuthRole("contributor"); setUserRole("contributor"); setStep(2); }} className="px-5 py-2.5 bg-surface-container-high text-on-surface text-xs font-bold rounded-xl hover:bg-primary/20 hover:text-primary transition-all">
              Skip straight to Wallet Connect (Demo Mode)
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Wallet Connect */}
      {step === 2 && (
        <div className="w-full max-w-[480px] glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>

          {/* Active Role Badge */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-surface-container-high rounded-xl">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROLES.find(r => r.key === role)?.color || "from-gray-500 to-gray-600"} flex items-center justify-center shadow-md`}>
              <span className="material-symbols-outlined text-white text-xl">{ROLES.find(r => r.key === role)?.icon || "person"}</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Account connected as</p>
              <p className="text-sm font-headline font-bold text-on-surface capitalize">{role}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-headline font-bold text-on-surface">Connect Your Wallet</h2>
              <p className="text-on-surface-variant mt-2 text-sm">Secure your decentralized identity for {role}</p>
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

            {/* Demo Mode embedded in step 2 */}
            <div className="pt-6 mt-2 border-t border-outline-variant/10">
              <div className="flex items-center justify-between p-4 bg-surface-container-lowest/50 rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Demo Mode</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Quick test without Pera Wallet</p>
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
                  onClick={handleDemoLogin}
                  className="w-full mt-4 flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-xl hover:bg-primary/20 border border-primary/30 transition-all group"
                >
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">bolt</span>
                  <span className="text-sm font-bold text-primary">Enter Demo View Setup</span>
                </button>
              )}
            </div>

            <button onClick={handleConnect} className="w-full py-4 primary-gradient rounded-xl font-bold text-on-primary-container shadow-[0_10px_20px_rgba(105,218,255,0.2)] hover:scale-[0.98] active:scale-95 transition-all duration-300">
              Connect Pera Wallet
            </button>
          </div>
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
