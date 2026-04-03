import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";

export default function ContributorDashboard() {
  const { address, signAndSend } = useWallet();
  const [bounties, setBounties] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("explore");

  // Submission sidebar state
  const [selectedBountyId, setSelectedBountyId] = useState("");
  const [workText, setWorkText] = useState("");
  const [workFile, setWorkFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (address) fetchData();
  }, [address]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, sRes] = await Promise.all([
        api.get("/api/bounties/open"),
        api.get(`/api/submissions/mine?address=${address}`)
      ]);
      setBounties(bRes.data);
      setSubmissions(sRes.data.submissions || []);
    } catch (err) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedBountyId) return toast.error("Select a bounty first.");
    if (!workText && !workFile) return toast.error("Enter work details or upload a file.");
    setSubmitting(true);
    const t = toast.loading("Submitting work...");
    try {
      const formData = new FormData();
      formData.append("bountyId", selectedBountyId);
      formData.append("contributorAddress", address);
      if (workFile) {
        formData.append("workFile", workFile);
      } else {
        formData.append("workContent", workText);
      }

      const res = await api.post("/api/submissions/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.unsignedAppCallTxn) {
        toast.loading("Sign with wallet...", { id: t });
        await signAndSend([res.data.unsignedAppCallTxn]);
      }
      toast.success(`Work submitted! Hash: ${res.data.workHash?.substring(0,12)}...`, { id: t });
      setWorkText("");
      setWorkFile(null);
      setSelectedBountyId("");
      fetchData();
    } catch (err) {
      toast.error("Submission failed.", { id: t });
    } finally {
      setSubmitting(false);
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-on-surface-variant text-lg">Please connect your wallet to continue.</p>
      </div>
    );
  }

  const openBounties = bounties.filter(b => b.status === "open");

  return (
    <div className="px-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Hero Header */}
      <header className="mb-12 pt-4">
        <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter text-on-surface mb-4">
          Obsidian <span className="text-primary">Ledger</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-lg">
          Architecting the future of settlement. Explore open bounties, submit high-precision work, and verify outcomes on Algorand.
        </p>
      </header>

      {/* Bento Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
        <div className="md:col-span-2 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between group hover:bg-surface-container transition-colors">
          <div>
            <span className="text-primary font-headline text-sm tracking-widest uppercase mb-2 block">Network Liquidity</span>
            <h2 className="text-5xl font-headline font-bold text-on-surface">1,240,490 <span className="text-2xl text-on-surface-variant">ALGO</span></h2>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <span className="text-on-surface-variant text-sm">Active contributors this week</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">verified</span>
          <h3 className="text-2xl font-headline font-bold text-on-surface">99.8%</h3>
          <p className="text-on-surface-variant text-sm mt-1">Verification Accuracy</p>
        </div>
        <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-tertiary mb-4">speed</span>
          <h3 className="text-2xl font-headline font-bold text-on-surface">12.4s</h3>
          <p className="text-on-surface-variant text-sm mt-1">Avg. Settlement Time</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-12 mb-10 border-b border-outline-variant/10">
        <button onClick={() => setActiveTab("explore")} className={`pb-4 border-b-2 font-headline transition-all ${activeTab === "explore" ? "border-primary text-primary font-bold" : "border-transparent text-on-surface-variant hover:text-on-surface font-medium"}`}>
          Explore Bounties
        </button>
        <button onClick={() => setActiveTab("submissions")} className={`pb-4 border-b-2 font-headline transition-all ${activeTab === "submissions" ? "border-primary text-primary font-bold" : "border-transparent text-on-surface-variant hover:text-on-surface font-medium"}`}>
          My Submissions
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Bounties Grid */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === "explore" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 animate-pulse bg-surface-container-low h-48 rounded-xl"></div>
              ) : bounties.length === 0 ? (
                <div className="col-span-2 bg-surface-container-low p-10 text-center text-on-surface-variant rounded-xl">No open bounties right now.</div>
              ) : (
                bounties.map(b => (
                  <div key={b.id} className="group bg-surface-container-low p-6 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(105,218,255,0.1)]">
                    <div className="flex justify-between items-start mb-6">
                      <span className="bg-surface-container-high text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
                        {b.status === "open" ? "Active" : b.status}
                      </span>
                      <div className="text-right">
                        <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">Reward</p>
                        <p className="text-primary font-headline font-bold text-lg">{b.amount || b.reward} ALGO</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-headline font-bold text-on-surface mb-3 leading-tight">{b.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-6">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{b.deadline ? new Date(b.deadline * 1000).toLocaleDateString() : "No deadline"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">security</span>
                        <span>Trust: High</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link to={`/bounty/${b.id}`} className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-lg group-hover:bg-primary group-hover:text-on-primary-fixed transition-colors flex items-center justify-center gap-2">
                        View Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                      {b.status === "open" && (
                        <button
                          onClick={() => { setSelectedBountyId(b.id); document.getElementById("submit-sidebar")?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="px-4 py-3 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                          title="Submit work to this bounty"
                        >
                          <span className="material-symbols-outlined text-sm">upload</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <div className="bg-surface-container-low p-10 text-center text-on-surface-variant rounded-xl">You haven't submitted any work yet.</div>
              ) : (
                submissions.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-5 bg-surface-container-low rounded-xl">
                    <div>
                      <Link to={`/bounty/${s.bountyId}`} className="font-bold hover:text-primary transition">Bounty #{s.bountyId?.substring(0,8)}</Link>
                      <p className="text-xs font-mono mt-1 text-on-surface-variant break-all">{s.workHash}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.status === 'approved' ? 'bg-primary/20 text-primary' : s.status === 'disputed' ? 'bg-error-container/20 text-error' : 'bg-tertiary-container/20 text-tertiary'
                    }`}>
                      {s.status === 'approved' ? 'Approved / Paid' : s.status === 'disputed' ? 'Disputed' : 'Pending Review'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submission Sidebar */}
        <aside id="submit-sidebar" className="lg:col-span-4 sticky top-24 space-y-6">
          <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Locked Amount Verified
              </div>
            </div>
            <h3 className="text-2xl font-headline font-bold text-on-surface mb-4">Submission Interface</h3>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
              Select a bounty, describe your deliverables. A SHA-256 work hash will be anchored on-chain.
            </p>
            <div className="space-y-5">
              {/* Bounty Selector Dropdown */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2 font-semibold">Target Bounty</label>
                <select
                  value={selectedBountyId}
                  onChange={(e) => setSelectedBountyId(e.target.value)}
                  className="input-field w-full appearance-none cursor-pointer"
                >
                  <option value="">— Select a bounty —</option>
                  {openBounties.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.amount || b.reward} ALGO)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected bounty info */}
              {selectedBountyId && (
                <div className="bg-surface-container-high p-4 rounded-lg border border-primary/20">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Selected</p>
                  <p className="text-sm font-bold text-primary">{openBounties.find(b => b.id === selectedBountyId)?.title}</p>
                  <p className="text-xs text-on-surface-variant font-mono mt-1">#{selectedBountyId.substring(0, 16)}</p>
                </div>
              )}

              {/* Work Description */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2 font-semibold">Work Description</label>
                <textarea
                  className="input-field h-28 resize-none w-full"
                  placeholder="Describe your work, link to repos, or paste artifact hashes..."
                  value={workText}
                  onChange={(e) => setWorkText(e.target.value)}
                />
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest rounded-xl p-6 text-center group hover:border-primary/50 transition-all">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary mb-2">cloud_upload</span>
                <p className="text-on-surface text-sm font-bold">Drop your archive here</p>
                <p className="text-on-surface-variant text-xs mt-1">.zip, .tar.gz (max 50MB)</p>
                <input type="file" onChange={(e) => setWorkFile(e.target.files[0])} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="mt-2 inline-block text-primary text-xs font-bold cursor-pointer hover:underline">Browse files</label>
              </div>
              {workFile && (
                <div className="bg-surface-container-high p-3 rounded-lg flex items-center justify-between">
                  <code className="text-xs text-primary break-all">{workFile.name}</code>
                  <button onClick={() => setWorkFile(null)} className="text-on-surface-variant hover:text-error transition ml-2">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitWork}
                disabled={submitting || !selectedBountyId}
                className="w-full py-4 bg-primary text-on-primary-fixed font-headline font-extrabold text-lg rounded-xl shadow-[0_4px_24px_rgba(105,218,255,0.2)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "SUBMIT WORK"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
