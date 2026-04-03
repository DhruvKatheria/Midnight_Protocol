import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import ProfileSection from "../components/ProfileSection";

const TRUST_REFRESH_EVENT = "settlechain:trust-refresh";

export default function SponsorDashboard() {
  const { address, signAndSend } = useWallet();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (address) fetchMyBounties();
  }, [address]);

  const fetchMyBounties = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/bounties/mine?address=${address}`);
      setBounties(res.data);
    } catch (err) {
      toast.error("Failed to load bounties.");
    } finally {
      setLoading(false);
    }
  };

  const getUserEmailByIdentity = async (identity) => {
    if (!identity) return null;
    try {
      const res = await api.get(`/api/users/${identity}`);
      return res.data?.user?.email || res.data?.email || null;
    } catch (_) {
      return null;
    }
  };

  const handleCreateBounty = async (e) => {
    e.preventDefault();
    if (!title || !description || !reward || !deadline) return toast.error("Fill all fields.");
    setIsCreating(true);
    const createToast = toast.loading("Building transaction...");
    try {
      const sponsorEmail = localStorage.getItem("userEmail");
      const parsedDeadline = deadline ? Math.floor(new Date(deadline).getTime() / 1000) : 0;
      const payload = {
        title,
        description,
        reward: parseInt(reward),
        deadline: parsedDeadline,
        sponsorAddress: address,
        ...(sponsorEmail ? { sponsorEmail } : {}),
      };
      const res = await api.post("/api/bounties/create", payload);
      const { briefHash, unsignedAppCallTxn, unsignedPayTxn, appId } = res.data;

      let signedTxns = [];
      if (unsignedAppCallTxn && unsignedPayTxn) {
        toast.loading("Please sign with Pera Wallet...", { id: createToast });
        signedTxns = await signAndSend([unsignedPayTxn, unsignedAppCallTxn]);
      } else {
        toast.loading("Processing (demo)...", { id: createToast });
        signedTxns = ["DEMO_SIGNED"];
      }

      toast.loading("Confirming on blockchain...", { id: createToast });
      await api.post("/api/bounties/confirm", { signedGroupTxnBase64: signedTxns, bountyData: { ...payload, briefHash, appId } });
      toast.success(`Bounty created! Brief hash: ${briefHash.substring(0,8)}...`, { id: createToast });
      fetchMyBounties();
      setTitle(""); setDescription(""); setReward(""); setDeadline("");
    } catch (err) {
      toast.error("Bounty creation failed.", { id: createToast });
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (bountyId, contributorAddress, contributorEmail) => {
    const t = toast.loading("Approving work...");
    try {
      const sponsorEmail = localStorage.getItem("userEmail");
      const res = await api.post(`/api/bounties/${bountyId}/approve`, {
        sponsorAddress: address,
        ...(sponsorEmail ? { sponsorEmail } : {}),
        contributorAddress,
        ...(contributorEmail ? { contributorEmail } : {}),
        mockSignedSubmit: true,
      });
      await signAndSend([res.data.unsignedAppCallTxn]);
      const sponsorTrust = res.data?.trustChanges?.sponsor;
      if (sponsorTrust && Number.isFinite(Number(sponsorTrust.newScore))) {
        toast.success(
          `Work approved. Trust score: ${Number(sponsorTrust.oldScore || 0).toFixed(2)} -> ${Number(sponsorTrust.newScore).toFixed(2)} (${Number(sponsorTrust.delta || 0) >= 0 ? "+" : ""}${Number(sponsorTrust.delta || 0).toFixed(2)})`,
          { id: t }
        );
      } else {
        toast.success("Work approved and funds released!", { id: t });
      }

      window.dispatchEvent(new Event(TRUST_REFRESH_EVENT));
      fetchMyBounties();
    } catch (error) {
      toast.error("Failed to approve.", { id: t });
    }
  };

  const handleDispute = async (bountyId, contributorAddress) => {
    const reason = prompt("Enter reason for dispute:");
    if (!reason) return;
    const t = toast.loading("Raising dispute...");
    try {
      const sponsorEmailFromStorage = localStorage.getItem("userEmail");
      const [sponsorEmail, contributorEmail] = await Promise.all([
        sponsorEmailFromStorage ? Promise.resolve(sponsorEmailFromStorage) : getUserEmailByIdentity(address),
        contributorAddress ? getUserEmailByIdentity(contributorAddress) : Promise.resolve(null),
      ]);

      const payload = {
        sponsorAddress: address,
        reason,
        ...(sponsorEmail ? { sponsorEmail } : {}),
        ...(contributorEmail ? { contributorEmail } : {}),
      };

      const res = await api.post(`/api/disputes/${bountyId}/raise`, payload);
      await signAndSend([res.data.unsignedAppCallTxn]);
      toast.success("Dispute raised. Validators assigned.", { id: t });
      fetchMyBounties();
    } catch (error) {
      toast.error("Failed to raise dispute.", { id: t });
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-on-surface-variant text-lg">Please connect wallet.</p>
      </div>
    );
  }

  const totalLocked = bounties.reduce((acc, b) => acc + (b.amount || 0), 0);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:block w-64 fixed h-screen border-r border-outline-variant/10 surface-1">
        <ProfileSection />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 px-6 md:px-12 py-8 max-w-7xl">
        {/* Hero Header */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tighter text-on-surface">
              Sponsor <span className="text-primary">Portal</span>
            </h1>
            <p className="text-on-surface-variant max-w-md text-lg font-medium leading-relaxed">
              Architect the ecosystem by deploying and settling immutable bounties on Algorand.
            </p>
          </div>
          <div className="surface-1 p-8 rounded-3xl flex flex-col items-end border-r-4 border-primary">
            <span className="text-primary text-5xl font-headline font-black tracking-tighter">{totalLocked.toLocaleString()} ALGO</span>
            <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mt-2">Locked in Escrow</span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Create Bounty Form */}
          <section className="xl:col-span-5 space-y-6">
            <div className="surface-1 p-8 rounded-[2rem] border border-outline-variant/10 group hover:surface-2 transition-all">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
                <h2 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tight">Deploy Bounty</h2>
              </div>
              <form onSubmit={handleCreateBounty} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3 font-black">Title</label>
                  <input type="text" className="input-field font-bold text-sm" placeholder="e.g. Smart Contract Audit" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3 font-black">Requirements</label>
                  <textarea className="input-field h-32 resize-none font-bold text-sm" placeholder="Technical deliverables..." value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3 font-black">Reward</label>
                    <div className="relative">
                      <input type="number" min="1" className="input-field pr-14 font-bold text-sm" placeholder="500" value={reward} onChange={e => setReward(e.target.value)} required />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary">ALGO</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3 font-black">Deadline</label>
                    <input type="datetime-local" className="input-field font-bold text-sm" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                  </div>
                </div>
                <button disabled={isCreating} type="submit" className="primary-btn w-full text-xs uppercase tracking-[0.2em] font-black py-4">
                  {isCreating ? "Deploying..." : "Initialize Escrow"}
                </button>
              </form>
            </div>
          </section>

          {/* Active Bounties & Review */}
          <div className="xl:col-span-7 space-y-12">
            {/* Review Panel */}
            {bounties.filter(b => b.status === "submitted").length > 0 && (
              <section className="surface-2 p-8 rounded-[2rem] space-y-8 border border-tertiary/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-3xl">rate_review</span>
                    <h2 className="text-2xl font-headline font-black text-on-surface">Review Queue</h2>
                  </div>
                  <span className="bg-tertiary text-on-tertiary-fixed font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                    {bounties.filter(b => b.status === "submitted").length} Actions Required
                  </span>
                </div>
                <div className="space-y-4">
                  {bounties.filter(b => b.status === "submitted").map(b => (
                    <div key={b.id} className="surface-1 p-6 rounded-2xl border-l-4 border-primary space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-headline font-bold text-lg text-on-surface uppercase tracking-tight">{b.title}</h3>
                          <p className="text-[10px] font-mono text-on-surface-variant mt-1 truncate max-w-xs">{b.contributorAddress}</p>
                        </div>
                        <span className="text-primary font-headline font-black text-xl">{b.amount} <span className="text-xs">ALGO</span></span>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <button onClick={() => handleApprove(b.id, b.contributorAddress, b.contributorEmail)} className="flex-1 primary-btn text-[10px] py-3 tracking-widest">
                          APPROVE
                        </button>
                        <button onClick={() => handleDispute(b.id, b.contributorAddress)} className="flex-1 py-3 surface-container-highest text-on-surface font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-error/10 hover:text-error transition-all">
                          DISPUTE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bounties List */}
            <section className="space-y-6">
              <h2 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tight">Ecosystem Ledger</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  <div className="col-span-2 animate-pulse surface-1 h-48 rounded-2xl"></div>
                ) : bounties.length === 0 ? (
                  <div className="col-span-2 surface-1 p-12 text-center text-on-surface-variant rounded-2xl font-bold border border-dashed border-outline-variant/10">No active assets found.</div>
                ) : (
                  bounties.map(b => (
                    <Link key={b.id} to={`/bounty/${b.id}`} className="no-border-card flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg ${
                            b.status === 'open' ? 'surface-container-high text-primary' :
                            b.status === 'disputed' ? 'bg-error/10 text-error' :
                            'surface-container-highest text-on-surface-variant'
                          }`}>
                            {b.status}
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant opacity-40">#{b.id?.substring(0,8)}</span>
                        </div>
                        <h3 className="text-xl font-headline font-black text-on-surface mb-3 leading-tight uppercase tracking-tight">{b.title}</h3>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-6 font-medium">{b.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/5">
                        <span className="font-headline font-bold text-primary">{b.amount} <span className="text-[10px]">ALGO</span></span>
                        <span className="text-[10px] font-black text-on-surface-variant tracking-widest">{b.deadline ? new Date(b.deadline * 1000).toLocaleDateString() : ''}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
