import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

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

  const handleCreateBounty = async (e) => {
    e.preventDefault();
    if (!title || !description || !reward || !deadline) return toast.error("Fill all fields.");
    setIsCreating(true);
    const createToast = toast.loading("Building transaction...");
    try {
      const parsedDeadline = deadline ? Math.floor(new Date(deadline).getTime() / 1000) : 0;
      const payload = { title, description, reward: parseInt(reward), deadline: parsedDeadline, sponsorAddress: address };
      const res = await api.post("/api/bounties/create", payload);
      const { briefHash, unsignedAppCallTxn, unsignedPayTxn } = res.data;

      let signedTxns = [];
      if (unsignedAppCallTxn && unsignedPayTxn) {
        // Real wallet flow — sign with Pera (payTxn first, appCallTxn second — contract requires Gtxn[0] = Payment)
        toast.loading("Please sign with Pera Wallet...", { id: createToast });
        signedTxns = await signAndSend([unsignedPayTxn, unsignedAppCallTxn]);
      } else {
        // Demo mode — skip signing
        toast.loading("Processing (demo)...", { id: createToast });
        signedTxns = ["DEMO_SIGNED"];
      }

      toast.loading("Confirming on blockchain...", { id: createToast });
      await api.post("/api/bounties/confirm", { signedGroupTxnBase64: signedTxns, bountyData: { ...payload, briefHash } });
      toast.success(`Bounty created! Brief hash: ${briefHash.substring(0,8)}...`, { id: createToast });
      fetchMyBounties();
      setTitle(""); setDescription(""); setReward(""); setDeadline("");
    } catch (err) {
      toast.error("Bounty creation failed.", { id: createToast });
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (bountyId, contributorAddress) => {
    const t = toast.loading("Approving work...");
    try {
      const res = await api.post(`/api/bounties/${bountyId}/approve`, { sponsorAddress: address, contributorAddress, mockSignedSubmit: true });
      await signAndSend([res.data.unsignedAppCallTxn]);
      toast.success("Work approved and funds released!", { id: t });
      fetchMyBounties();
    } catch (error) {
      toast.error("Failed to approve.", { id: t });
    }
  };

  const handleDispute = async (bountyId) => {
    const reason = prompt("Enter reason for dispute:");
    if (!reason) return;
    const t = toast.loading("Raising dispute...");
    try {
      const res = await api.post(`/api/disputes/${bountyId}/raise`, { sponsorAddress: address, reason });
      await signAndSend([res.data.unsignedAppCallTxn]);
      toast.success("Dispute raised. Validators assigned.", { id: t });
      fetchMyBounties();
    } catch (error) {
      toast.error("Failed to raise dispute.", { id: t });
    }
  };

  if (!address) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-on-surface-variant text-lg">Please connect wallet.</p></div>;
  }

  const totalLocked = bounties.reduce((acc, b) => acc + (b.amount || 0), 0);

  return (
    <div className="px-6 max-w-7xl mx-auto space-y-12 animate-fade-in pb-10">
      {/* Hero Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter">Sponsor Portal</h1>
          <p className="text-on-surface-variant max-w-md text-lg">Architect the ecosystem by deploying and settling immutable bounties.</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-primary text-4xl font-headline font-bold">{totalLocked.toLocaleString()} ALGO</span>
          <span className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Locked in Escrow</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Bounty Form */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-low p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              <h2 className="text-2xl font-headline font-bold">Create Bounty</h2>
            </div>
            <form onSubmit={handleCreateBounty} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">Bounty Title</label>
                <input type="text" className="input-field" placeholder="e.g. Smart Contract Audit for DAO" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant">Description</label>
                <textarea className="input-field h-24 resize-none" placeholder="Technical requirements and deliverables..." value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Reward (ALGO)</label>
                  <div className="relative">
                    <input type="number" min="1" className="input-field pr-14" placeholder="500" value={reward} onChange={e => setReward(e.target.value)} required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">ALGO</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface-variant">Deadline</label>
                  <input type="datetime-local" className="input-field" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                </div>
              </div>
              <button disabled={isCreating} type="submit" className="w-full cta-gradient text-on-primary-container font-bold py-4 rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/10 disabled:opacity-50">
                {isCreating ? "Processing..." : "Deploy Escrow & Lock Funds"}
              </button>
            </form>
          </div>
        </section>

        {/* Active Bounties & Review */}
        <div className="lg:col-span-7 space-y-8">
          {/* Submission Review Panel */}
          {bounties.filter(b => b.status === "submitted").length > 0 && (
            <section className="bg-surface-container-high p-8 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary">rate_review</span>
                  <h2 className="text-2xl font-headline font-bold">Submission Review</h2>
                </div>
                <span className="bg-error-container/20 text-error text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                  {bounties.filter(b => b.status === "submitted").length} Pending
                </span>
              </div>
              {bounties.filter(b => b.status === "submitted").map(b => (
                <div key={b.id} className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary space-y-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-on-surface">{b.title}</h3>
                      <p className="text-xs text-on-surface-variant">Contributor: {b.contributorAddress || 'pending'}</p>
                    </div>
                    <span className="text-primary font-bold">{b.amount} ALGO</span>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleApprove(b.id, b.contributorAddress)} className="flex-1 bg-primary text-on-primary-container font-bold py-2 rounded-lg text-sm transition-all hover:brightness-110">
                      Approve & Release
                    </button>
                    <button onClick={() => handleDispute(b.id)} className="flex-1 bg-surface-container-highest text-on-surface font-bold py-2 rounded-lg text-sm transition-all hover:bg-error/10 hover:text-error">
                      Dispute
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Bounties List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold">Active Bounties</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 animate-pulse bg-surface-container-low h-32 rounded-xl"></div>
              ) : bounties.length === 0 ? (
                <div className="col-span-2 bg-surface-container-low p-10 text-center text-on-surface-variant rounded-xl border border-dashed border-outline-variant/20">No active bounties found.</div>
              ) : (
                bounties.map(b => (
                  <Link key={b.id} to={`/bounty/${b.id}`} className="bounty-card bg-surface-container-low p-6 rounded-xl block">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                        b.status === 'open' ? 'bg-surface-container-high text-primary' :
                        b.status === 'disputed' ? 'bg-tertiary/10 text-tertiary' :
                        b.status === 'approved' ? 'bg-surface-container-highest text-on-surface-variant' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {b.status}
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant">#{b.id?.substring(0,8)}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{b.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-headline font-bold text-primary">{b.amount} ALGO</span>
                      <span className="text-xs text-on-surface-variant">{b.deadline ? new Date(b.deadline * 1000).toLocaleDateString() : ''}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
