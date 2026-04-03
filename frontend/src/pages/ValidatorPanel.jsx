import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";
import ProfileSection from "../components/ProfileSection";

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
      const userId = localStorage.getItem("userId");
      // Use the userId (UID) for querying disputes assigned to this account
      const res = await api.get(`/api/disputes/assigned?address=${userId || address}`);
      setDisputes(res.data || []);
    } catch (err) {
      toast.error("Failed to load your assigned cases.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Hash copied to clipboard", {
      style: { background: "#0e0e0e", color: "#69daff", border: "1px solid #69daff40" },
      iconTheme: { primary: "#69daff", secondary: "#0e0e0e" }
    });
  };

  const handleVote = async (disputeId, approve) => {
    const t = toast.loading("Recording on-chain verdict...");
    try {
      const userId = localStorage.getItem("userId");
      await api.post(`/api/disputes/${disputeId}/vote`, {
        validatorAddress: userId || address,
        approve
      });
      toast.success("Verdict recorded. Consensus updated.", { id: t });
      fetchDisputes();
    } catch (e) {
      toast.error(e.response?.data?.error || "Vote failed", { id: t });
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-on-surface-variant text-lg">Please connect your wallet to access the Validator Portal.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <div className="hidden lg:block w-64 fixed h-screen border-r border-outline-variant/10 surface-1">
        <ProfileSection />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 px-6 md:px-12 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tighter text-on-surface mb-6">
            Validator <span className="text-primary">Panel</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg font-medium leading-relaxed opacity-80">
            Maintain ecosystem integrity by resolving cross-participant disputes. Your verdicts are anchored on Algorand and influence global Trust Scores.
          </p>
        </header>

        {/* Validator Stats Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="surface-1 p-8 rounded-[2rem] border border-outline-variant/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 font-label">Governance Power</p>
            <div className="text-4xl font-headline font-black text-primary tracking-tighter">12.8k <span className="text-base text-on-surface-variant">VP</span></div>
          </div>
          <div className="surface-1 p-8 rounded-[2rem] border border-outline-variant/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 font-label">Accuracy Rate</p>
            <div className="text-4xl font-headline font-black text-on-surface tracking-tighter">98.4%</div>
          </div>
          <div className="surface-1 p-8 rounded-[2rem] border border-primary/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 font-label">Pending Cases</p>
            <div className="text-4xl font-headline font-black text-on-surface tracking-tighter">{disputes.length} <span className="text-base text-on-surface-variant uppercase">Required</span></div>
          </div>
        </div>

        {/* Assigned Cases Section */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tight">Assigned Inquiries</h2>
            <div className="h-px flex-1 bg-outline-variant/10"></div>
          </div>

          {loading ? (
            <div className="animate-pulse surface-1 h-96 rounded-3xl"></div>
          ) : disputes.length === 0 ? (
            <div className="surface-1 p-16 text-center rounded-[2rem] border border-dashed border-outline-variant/10">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-50">verified_user</span>
              <p className="text-on-surface-variant text-lg font-bold">Your verification queue is currently clear.</p>
              <p className="text-on-surface-variant text-sm mt-2 font-medium opacity-60 uppercase tracking-widest leading-relaxed">No open disputes require your consensus at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {disputes.map(disp => {
                const userId = localStorage.getItem("userId");
                const currentVoterId = userId || address;
                const hasVoted = disp.voterAddresses && disp.voterAddresses.includes(currentVoterId);

                return (
                  <div key={disp.id} className="surface-1 rounded-[2.5rem] border border-outline-variant/10 overflow-hidden hover:surface-2 transition-all duration-500">
                    <div className="flex flex-col xl:flex-row">
                      {/* Case Details */}
                      <div className="flex-1 p-8 md:p-12 border-b xl:border-b-0 xl:border-r border-outline-variant/10">
                        <div className="flex items-center gap-4 mb-8">
                          <span className="bg-error/10 text-error text-[10px] px-3 py-1.5 rounded-lg border border-error/20 font-black uppercase tracking-[0.1em]">Open Dispute</span>
                          <span className="text-on-surface-variant font-mono text-[10px] uppercase">ID: {disp.id?.substring(0, 12)}...</span>
                        </div>

                        <h3 className="text-3xl font-headline font-black text-on-surface mb-6 uppercase tracking-tight">{disp.bountyTitle}</h3>

                        <div className="space-y-8">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Claim Reason</p>
                            <p className="text-on-surface-variant text-lg font-medium leading-relaxed italic pr-4">
                              "{disp.reason}"
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="surface-container-high p-6 rounded-2xl border border-outline-variant/5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Project Brief</p>
                              <p className="text-sm text-on-surface font-medium line-clamp-3 mb-4">{disp.bountyDescription}</p>
                              <code className="text-[10px] text-primary font-mono cursor-pointer hover:underline opacity-60" onClick={() => handleCopy(disp.originalBrief)}>
                                {disp.originalBrief?.substring(0, 32)}...
                              </code>
                            </div>
                            <div className="surface-container-high p-6 rounded-2xl border border-primary/5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Delivered Work</p>
                              <p className="text-sm text-on-surface font-medium line-clamp-3 mb-4">{disp.submissionContent}</p>
                              <code className="text-[10px] text-tertiary font-mono cursor-pointer hover:underline opacity-60" onClick={() => handleCopy(disp.submissionHash)}>
                                {disp.submissionHash?.substring(0, 32)}...
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Voting Sidebar */}
                      <div className="xl:w-96 p-8 md:p-12 surface-container flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant mb-8 border-b border-outline-variant/10 pb-4">Consensus Verdict</p>

                          {hasVoted ? (
                            <div className="text-center py-10 surface-container-highest rounded-3xl border border-primary/20 animate-fade-in">
                              <span className="material-symbols-outlined text-4xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                              <p className="font-headline font-black text-on-surface uppercase tracking-tight">Verdict Cascaded</p>
                              <p className="text-[10px] text-on-surface-variant mt-2 font-black uppercase tracking-widest">Awaiting majority consensus</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <button onClick={() => handleVote(disp.id, true)} className="w-full surface-container-highest hover:bg-primary hover:text-background py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-between px-8 group border border-outline-variant/10">
                                <span>APPROVE WORK</span>
                                <span className="material-symbols-outlined text-lg group-hover:scale-125 transition-transform">how_to_reg</span>
                              </button>
                              <button onClick={() => handleVote(disp.id, false)} className="w-full surface-container-highest hover:bg-error hover:text-background py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-between px-8 group border border-outline-variant/10">
                                <span>UPHOLD DISPUTE</span>
                                <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">gavel</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-12">
                          <div className="flex justify-between items-end mb-4">
                            <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Live Weighting</span>
                            <span className="text-on-surface font-mono text-[10px]">
                              {disp.votes?.approve || 0} / {disp.votes?.reject || 0}
                            </span>
                          </div>
                          <div className="h-1 bg-outline-variant/10 rounded-full flex overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-1000"
                              style={{ width: `${(disp.votes?.approve / ((disp.votes?.approve + disp.votes?.reject) || 1)) * 100}%` }}
                            ></div>
                            <div
                              className="h-full bg-error transition-all duration-1000"
                              style={{ width: `${(disp.votes?.reject / ((disp.votes?.approve + disp.votes?.reject) || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
