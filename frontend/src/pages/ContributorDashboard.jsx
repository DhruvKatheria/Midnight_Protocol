import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";
import ProfileSection from "../components/ProfileSection";

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
      const contributorEmail = localStorage.getItem("userEmail");
      formData.append("bountyId", selectedBountyId);
      formData.append("contributorAddress", address);
      if (contributorEmail) {
        formData.append("contributorEmail", contributorEmail);
      }
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
    <div className="flex min-h-screen">
      {/* Sidebar - Profile Section */}
      <div className="hidden lg:block w-64 fixed h-screen border-r border-outline-variant/10 surface-1">
        <ProfileSection />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 px-6 md:px-12 py-8 max-w-7xl">
        {/* Hero Header */}
        <header className="mb-12">
          <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tighter text-on-surface mb-4">
            Obsidian <span className="text-primary">Ledger</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg font-medium leading-relaxed">
            Architecting the future of settlement. Explore open bounties, submit high-precision work, and verify outcomes on Algorand.
          </p>
        </header>

        {/* Bento Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="md:col-span-2 surface-1 p-8 rounded-2xl flex flex-col justify-between group hover:surface-2 transition-colors duration-300">
            <div>
              <span className="text-primary font-headline text-[10px] font-black tracking-widest uppercase mb-4 block">Network Liquidity</span>
              <h2 className="text-5xl font-headline font-black text-on-surface tracking-tighter">1,240,490 <span className="text-2xl text-on-surface-variant font-bold">ALGO</span></h2>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Active contributors this week</span>
            </div>
          </div>
          <div className="surface-1 p-8 rounded-2xl flex flex-col justify-center text-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <h3 className="text-3xl font-headline font-black text-on-surface">99.8%</h3>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mt-2">Accuracy</p>
          </div>
          <div className="surface-1 p-8 rounded-2xl flex flex-col justify-center text-center">
            <span className="material-symbols-outlined text-4xl text-tertiary mb-4">speed</span>
            <h3 className="text-3xl font-headline font-black text-on-surface">12.4s</h3>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mt-2">Settlement</p>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex items-center gap-12 mb-10 border-b border-outline-variant/10">
          <button onClick={() => setActiveTab("explore")} className={`pb-4 border-b-2 font-headline transition-all text-sm uppercase tracking-widest font-black ${activeTab === "explore" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
            Explore Bounties
          </button>
          <button onClick={() => setActiveTab("submissions")} className={`pb-4 border-b-2 font-headline transition-all text-sm uppercase tracking-widest font-black ${activeTab === "submissions" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
            My Submissions
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
          {/* Bounties Grid */}
          <div className="xl:col-span-8 space-y-8">
            {activeTab === "explore" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  <div className="col-span-2 animate-pulse surface-1 h-64 rounded-2xl"></div>
                ) : bounties.length === 0 ? (
                  <div className="col-span-2 surface-1 p-12 text-center text-on-surface-variant rounded-2xl font-bold">No open bounties right now.</div>
                ) : (
                  bounties.map(b => (
                    <div key={b.id} className="no-border-card">
                      <div className="flex justify-between items-start mb-8">
                        <span className="surface-2 text-primary text-[10px] font-black px-3 py-1.5 rounded-lg border border-primary/20 uppercase tracking-widest">
                          {b.status === "open" ? "Active" : b.status}
                        </span>
                        <div className="text-right">
                          <p className="text-on-surface-variant text-[8px] uppercase tracking-widest font-black">Reward</p>
                          <p className="text-primary font-headline font-black text-xl">{b.amount || b.reward} ALGO</p>
                        </div>
                      </div>
                      <h4 className="text-2xl font-headline font-black text-on-surface mb-4 leading-tight">{b.title}</h4>
                      <div className="flex items-center gap-4 text-[10px] uppercase font-black text-on-surface-variant mb-8 tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>{b.deadline ? new Date(b.deadline * 1000).toLocaleDateString() : "No deadline"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">security</span>
                          <span>Trust: High</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link to={`/bounty/${b.id}`} className="flex-1 py-3 surface-2 text-on-surface font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary hover:text-on-primary-fixed transition-all flex items-center justify-center gap-2">
                          Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                        {b.status === "open" && (
                          <button
                            onClick={() => { setSelectedBountyId(b.id); document.getElementById("submit-sidebar")?.scrollIntoView({ behavior: 'smooth' }); }}
                            className="px-4 py-3 bg-primary/10 text-primary font-black rounded-xl hover:bg-primary/20 transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-base">upload</span>
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
                  <div className="surface-1 p-12 text-center text-on-surface-variant rounded-2xl font-bold">You haven't submitted any work yet.</div>
                ) : (
                  submissions.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-6 surface-1 rounded-2xl border border-outline-variant/10 hover:surface-2 transition-all">
                      <div>
                        <Link to={`/bounty/${s.bountyId}`} className="font-headline font-black text-on-surface hover:text-primary transition uppercase tracking-tight">Bounty #{s.bountyId?.substring(0,8)}</Link>
                        <p className="text-[10px] font-mono mt-1 text-on-surface-variant break-all opacity-60 uppercase">{s.workHash}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                        s.status === 'approved' ? 'bg-primary/10 text-primary border border-primary/20' : s.status === 'disputed' ? 'bg-error/10 text-error border border-error/20' : 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                      }`}>
                        {s.status === 'approved' ? 'Approved' : s.status === 'disputed' ? 'Disputed' : 'Pending'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Submission Sidebar */}
          <aside id="submit-sidebar" className="xl:col-span-4 sticky top-24 space-y-6">
            <div className="surface-1 p-8 rounded-3xl border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Liquidity Locked
                </div>
              </div>
              <h3 className="text-2xl font-headline font-black text-on-surface mb-4 tracking-tighter">On-Chain Submission</h3>
              <p className="text-on-surface-variant text-sm mb-8 leading-relaxed font-medium">
                Select a bounty and anchor your work hash. Immutable proof of delivery is recorded on Algorand.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3 font-black">Target Bounty</label>
                  <select
                    value={selectedBountyId}
                    onChange={(e) => setSelectedBountyId(e.target.value)}
                    className="input-field w-full appearance-none cursor-pointer font-bold text-sm"
                  >
                    <option value="">Select bounty</option>
                    {openBounties.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.amount || b.reward} ALGO)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBountyId && (
                  <div className="surface-2 p-5 rounded-2xl border border-primary/20 animate-fade-in">
                    <p className="text-[8px] uppercase tracking-widest text-on-surface-variant mb-2 font-black">Selected</p>
                    <p className="text-sm font-black text-primary uppercase tracking-tight">{openBounties.find(b => b.id === selectedBountyId)?.title}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono mt-2 break-all opacity-50 uppercase">HEX: {selectedBountyId.substring(0, 32)}</p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-3 font-black">Work Artifacts</label>
                  <textarea
                    className="input-field h-32 resize-none w-full font-bold text-sm"
                    placeholder="Link to repository or hash values..."
                    value={workText}
                    onChange={(e) => setWorkText(e.target.value)}
                  />
                </div>

                <div className="border-2 border-dashed border-outline-variant/20 bg-surface-container-lowest rounded-2xl p-8 text-center group hover:border-primary/40 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary mb-3 transition-colors">cloud_upload</span>
                  <p className="text-on-surface text-xs font-black uppercase tracking-widest">Upload Archive</p>
                  <input type="file" onChange={(e) => setWorkFile(e.target.files[0])} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="mt-3 inline-block text-primary text-[10px] font-black uppercase tracking-widest cursor-pointer hover:underline">Browse files</label>
                </div>
                
                {workFile && (
                  <div className="surface-2 p-4 rounded-xl flex items-center justify-between border border-primary/20">
                    <code className="text-[10px] text-primary font-mono truncate font-bold">{workFile.name}</code>
                    <button onClick={() => setWorkFile(null)} className="text-on-surface-variant hover:text-error transition ml-2">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleSubmitWork}
                  disabled={submitting || !selectedBountyId}
                  className="primary-btn w-full text-sm uppercase tracking-[0.2em] font-black"
                >
                  {submitting ? "Processing..." : "ANALYZE & SUBMIT"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

