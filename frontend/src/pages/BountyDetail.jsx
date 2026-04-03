import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";

export default function BountyDetail() {
  const { id } = useParams();
  const { address, signAndSend } = useWallet();
  const navigate = useNavigate();
  const [bounty, setBounty] = useState(null);
  const [bountyDisputes, setBountyDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workText, setWorkText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBounty();
  }, [id]);

  const fetchBounty = async () => {
    try {
      setLoading(true);
      const [bountyRes, disputesRes] = await Promise.all([
        api.get(`/api/bounties/${id}`),
        api.get(`/api/disputes/bounty/${id}`)
      ]);
      setBounty(bountyRes.data);
      setBountyDisputes(disputesRes.data.disputes || []);
    } catch (err) {
      toast.error("Failed to load bounty details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!workText) return toast.error("Enter work details or upload a file.");
    setSubmitting(true);
    const t = toast.loading("Submitting work...");
    try {
      const contributorEmail = localStorage.getItem("userEmail");
      const res = await api.post("/api/submissions/submit", {
        bountyId: id,
        contributorAddress: address,
        ...(contributorEmail ? { contributorEmail } : {}),
        workContent: workText
      });
      if (res.data.unsignedAppCallTxn) {
        toast.loading("Sign with wallet...", { id: t });
        await signAndSend([res.data.unsignedAppCallTxn]);
      }
      toast.success("Work submitted successfully!", { id: t });
      setWorkText("");
      fetchBounty();
    } catch (err) {
      toast.error("Submission failed.", { id: t });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReveal = async (submissionId) => {
    const t = toast.loading("Revealing proof...");
    try {
      const res = await api.post("/api/submissions/reveal", {
        submissionId,
        contributorAddress: address,
      });
      toast.success("Work proof revealed!", { id: t });
      fetchBounty();
    } catch (err) {
      toast.error("Reveal failed.", { id: t });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!bounty) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-on-surface-variant text-lg">Bounty not found.</p></div>;
  }

  const statusStyles = {
    open: "bg-primary/10 text-primary border-primary/20",
    submitted: "bg-tertiary/10 text-tertiary border-tertiary/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    disputed: "bg-error/10 text-error border-error/20",
    settled: "bg-surface-container-highest text-on-surface-variant border-outline-variant/20",
  };

  return (
    <div className="px-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-8 pt-4">
        <Link to="/contributor" className="hover:text-primary transition-colors">Dashboard</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Bounty Detail</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Detail */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header Card */}
          <div className="bg-surface-container-low p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyles[bounty.status] || statusStyles.open}`}>
                {bounty.status?.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-on-surface-variant">#{id?.substring(0, 12)}</span>
            </div>
            <h1 className="text-4xl font-headline font-extrabold mb-4 relative z-10">{bounty.title}</h1>
            <p className="text-on-surface-variant leading-relaxed mb-8 relative z-10">{bounty.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Reward</p>
                <p className="text-2xl font-headline font-bold text-primary">{bounty.amount} ALGO</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Status</p>
                <p className="text-lg font-bold capitalize">{bounty.status}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Deadline</p>
                <p className="text-lg font-bold">{bounty.deadline ? new Date(bounty.deadline * 1000).toLocaleDateString() : 'None'}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Sponsor</p>
                <p className="text-sm font-mono text-on-surface-variant">{bounty.sponsorAddress?.substring(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Brief Hash */}
          <div className="bg-surface-container-high p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[18px]">fingerprint</span>
              <h3 className="font-bold text-on-surface">Immutable Brief Hash</h3>
            </div>
            <code className="text-sm text-primary font-mono break-all block bg-surface-container-lowest p-4 rounded-lg">{bounty.briefHash || "Not available"}</code>
          </div>
          {/* Submissions List */}
          {bounty.submissions && bounty.submissions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-headline font-bold">Submissions</h3>
              {bounty.submissions.map(s => (
                <div key={s.id} className="bg-surface-container-low p-6 rounded-xl border-l-4 border-tertiary">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-on-surface">Contributor: {s.contributorAddress?.substring(0,8)}...</p>
                      <p className="text-xs text-on-surface-variant mt-1">Hash: {s.workHash}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.status === 'approved' ? 'bg-primary/20 text-primary' : s.status === 'disputed' ? 'bg-error/20 text-error' : 'bg-tertiary/20 text-tertiary'}`}>
                      {s.status || "Pending"}
                    </span>
                  </div>
                  {s.contributorAddress === address && !s.revealed && (
                    <button onClick={() => handleReveal(s.id)} className="mt-4 text-primary text-sm font-bold hover:underline">Reveal Proof →</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Disputes List */}
          {bountyDisputes && bountyDisputes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-headline font-bold text-error">Live Disputes</h3>
              {bountyDisputes.map(d => (
                <div key={d.id} className="bg-error-container/5 p-6 rounded-xl border border-error/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-on-surface">Ticket: #{d.id?.substring(0,8)}</p>
                      <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-widest text-error">Sponsor Raised Issue</p>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${d.status === 'open' ? 'bg-error/20 text-error' : 'bg-surface-container-highest text-on-surface'}`}>
                      {d.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="mb-4 bg-surface-container-lowest p-4 rounded-lg">
                    <p className="text-sm italic text-on-surface-variant">"{d.reason}"</p>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-error/10 pt-4">
                    <span className="font-bold text-on-surface">Validator Consensus:</span>
                    <div className="flex gap-4 font-mono font-bold">
                      <span className="text-primary">{d.votes?.approve || 0} Appr</span>
                      <span className="text-error">{d.votes?.reject || 0} Rej</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Transaction History Link */}
          <Link
            to={`/transactions/${id}`}
            className="flex items-center gap-3 bg-surface-container-low p-6 rounded-xl hover:bg-surface-container transition-colors group"
          >
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <span className="font-bold">View Transaction History</span>
            <span className="material-symbols-outlined ml-auto text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
          </Link>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 sticky top-24 space-y-6">
          {/* Submit Work Panel */}
          {bounty.status === "open" && address !== bounty.sponsorAddress && (
            <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Escrow Verified
                </div>
              </div>
              <h3 className="text-xl font-headline font-bold mb-4">Submit Your Work</h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                Describe your deliverables. A SHA-256 work hash will be computed and anchored on-chain.
              </p>
              <textarea
                className="input-field h-32 resize-none mb-4"
                placeholder="Describe your work, link to repos, or paste artifact hashes..."
                value={workText}
                onChange={(e) => setWorkText(e.target.value)}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-primary text-on-primary-fixed font-headline font-extrabold text-lg rounded-xl shadow-[0_4px_24px_rgba(105,218,255,0.2)] active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "SUBMIT WORK"}
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <h5 className="text-sm font-headline font-bold text-on-surface mb-4">Bounty Stats</h5>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Submissions</span>
                <span className="font-bold">{bounty.submissions?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Locked Amount</span>
                <span className="font-bold text-primary">{bounty.amount} ALGO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Escrow Type</span>
                <span className="font-bold">Smart Contract</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
