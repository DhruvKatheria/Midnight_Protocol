import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";

export default function ValidatorPanel() {
  const { address } = useWallet();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) fetchDisputes();
  }, [address]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/disputes/open");
      setDisputes(res.data || []);
    } catch(err) {
      toast.error("Failed to load disputes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Hash copied!", { icon: "📋" });
  };

  const handleVote = async (disputeId, approve) => {
    const t = toast.loading("Casting validator vote...");
    try {
      await api.post(`/api/disputes/${disputeId}/vote`, {
        validatorAddress: address,
        approve
      });
      toast.success("Vote registered. Consensus updated.", { id: t });
      fetchDisputes();
    } catch(e) {
      toast.error(e.response?.data?.error || "Vote failed", { id: t });
    }
  };

  if (!address) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-on-surface-variant text-lg">Connect wallet.</p></div>;

  return (
    <div className="px-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <header className="mb-12 pt-4">
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tight mb-4">Validator Panel</h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Resolve disputes and maintain network integrity. Your reputation score and stake weight determine the influence of your final verdicts.
        </p>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container-low rounded-xl p-6">
          <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest mb-2">Active Stake</p>
          <div className="text-3xl font-headline font-bold text-primary">12,450 ALGO</div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6">
          <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest mb-2">Total Earnings</p>
          <div className="text-3xl font-headline font-bold text-on-surface">3,120 ALGO</div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6">
          <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest mb-2">Reputation Score</p>
          <div className="text-3xl font-headline font-bold text-tertiary">98.4%</div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6">
          <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest mb-2">Disputes Pending</p>
          <div className="text-3xl font-headline font-bold text-error">{disputes.length} Cases</div>
        </div>
      </div>

      {/* Disputes Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-headline font-bold tracking-tight">Available Disputes</h2>
        </div>

        {loading ? (
          <div className="animate-pulse bg-surface-container-low h-64 rounded-xl"></div>
        ) : disputes.length === 0 ? (
          <div className="bg-surface-container-low p-10 text-center text-on-surface-variant rounded-xl">Your queue is empty.</div>
        ) : (
          <div className="space-y-6">
            {disputes.map(disp => {
              const hasVoted = disp.voterAddresses && disp.voterAddresses.includes(address);

              return (
                <div key={disp.id} className="bg-surface-container-low rounded-xl p-8 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Disputed</span>
                        <span className="text-on-surface-variant text-xs font-medium">Dispute #{disp.id?.substring(0,8)}</span>
                      </div>
                      <h3 className="text-2xl font-headline font-bold mb-4">{disp.bountyTitle || "Dispute Case"}</h3>
                      <p className="text-on-surface-variant mb-6 leading-relaxed">
                        <strong className="text-on-surface">Reason:</strong> "{disp.reason}"
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-surface-container-high p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-sm text-primary">description</span>
                            <span className="text-xs font-bold text-on-surface-variant uppercase">Original Brief Hash</span>
                          </div>
                          <code className="text-xs text-primary font-mono break-all opacity-80 cursor-pointer" onClick={() => handleCopy(disp.originalBrief || '')}>
                            {disp.originalBrief?.substring(0, 24) || "Loading..."}...
                          </code>
                        </div>
                        <div className="bg-surface-container-high p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-sm text-tertiary">upload_file</span>
                            <span className="text-xs font-bold text-on-surface-variant uppercase">Submission Hash</span>
                          </div>
                          <code className="text-xs text-tertiary font-mono break-all opacity-80 cursor-pointer" onClick={() => handleCopy(disp.submissionHash || '')}>
                            {disp.submissionHash?.substring(0, 24) || "Loading..."}...
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Voting Interface */}
                    <div className="lg:w-80 bg-surface-container-high rounded-xl p-6 flex flex-col justify-between">
                      {hasVoted ? (
                        <div className="text-center py-8">
                          <span className="material-symbols-outlined text-4xl text-primary mb-2">how_to_vote</span>
                          <p className="font-bold text-on-surface">Vote Submitted</p>
                          <p className="text-xs text-on-surface-variant mt-1">Your verdict has been recorded</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-label text-on-surface-variant mb-4">Cast your Verdict</p>
                            <div className="space-y-3 mb-6">
                              <button onClick={() => handleVote(disp.id, true)} className="w-full bg-surface-container-highest hover:bg-primary/20 hover:text-primary py-3 rounded-lg font-bold text-sm transition-all group flex items-center justify-between px-4">
                                <span>Approve Contributor</span>
                                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">how_to_reg</span>
                              </button>
                              <button onClick={() => handleVote(disp.id, false)} className="w-full bg-surface-container-highest hover:bg-error/20 hover:text-error py-3 rounded-lg font-bold text-sm transition-all group flex items-center justify-between px-4">
                                <span>Approve Sponsor</span>
                                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">gavel</span>
                              </button>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-outline-variant/10">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-on-surface-variant">Current Votes</span>
                              <span className="text-on-surface"><span className="text-primary">{disp.votes?.approve || 0} Appr</span> / <span className="text-error">{disp.votes?.reject || 0} Rej</span></span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
