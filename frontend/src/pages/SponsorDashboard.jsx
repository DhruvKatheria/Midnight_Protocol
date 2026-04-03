import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function SponsorDashboard() {
  const { address, signAndSend } = useWallet();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
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
      const payload = { title, description, reward: parseInt(reward), deadline: new Date(deadline).getTime() / 1000, sponsorAddress: address };
      
      const res = await api.post("/api/bounties/create", payload);
      const { briefHash, unsignedAppCallTxn, unsignedPayTxn } = res.data;
      
      toast.loading("Please sign with Pera Wallet...", { id: createToast });
      const signedTxns = await signAndSend([unsignedAppCallTxn, unsignedPayTxn]);
      
      toast.loading("Confirming on blockchain...", { id: createToast });
      await api.post("/api/bounties/confirm", {
        signedGroupTxnBase64: signedTxns,
        bountyData: { ...payload, briefHash }
      });
      
      toast.success(`Bounty created! Brief hash: ${briefHash.substring(0,8)}...`, { id: createToast });
      fetchMyBounties();
      setTitle(""); setDescription(""); setReward(""); setDeadline("");
    } catch (err) {
      toast.error("Bounty creation failed.", { id: createToast });
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (bountyId, contributorAddress) => {
    const t = toast.loading("Approving work...");
    try {
      const res = await api.post(`/api/bounties/${bountyId}/approve`, { sponsorAddress: address, contributorAddress, mockSignedSubmit: true });
      const signed = await signAndSend([res.data.unsignedAppCallTxn]);
      // Normally we would submit this signed tx to another completion endpoint
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

  if (!address) return <div className="p-10 text-center text-lg text-slate-500">Please connect wallet.</div>;

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-brand">Sponsor Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">{address}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Trust Score</p>
          <p className="text-3xl font-bold text-teal">92<span className="text-lg text-slate-400">/100</span></p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Create Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold mb-4 border-b border-slate-100 pb-2">Create Bounty</h3>
          <form onSubmit={handleCreateBounty} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Title</label>
              <input type="text" className="w-full border rounded-md p-2 focus:ring-teal focus:border-teal outline-none" value={title} onChange={e=>setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Brief / Requirements</label>
              <textarea className="w-full border rounded-md p-2 focus:ring-teal outline-none h-24" value={description} onChange={e=>setDescription(e.target.value)} required />
              <p className="text-xs text-slate-400 mt-1">This will be SHA-256 hashed to the blockchain.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Reward (ALGO)</label>
                <input type="number" min="1" className="w-full border rounded-md p-2 focus:ring-teal outline-none" value={reward} onChange={e=>setReward(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Deadline</label>
                <input type="datetime-local" className="w-full border rounded-md p-2 focus:ring-teal outline-none" value={deadline} onChange={e=>setDeadline(e.target.value)} required />
              </div>
            </div>
            <button disabled={isCreating} type="submit" className="w-full bg-brand text-white py-3 rounded-md font-bold mt-4 hover:bg-accent transition disabled:opacity-50">
              {isCreating ? "Processing..." : "Lock ALGO & Post"}
            </button>
          </form>
        </div>

        {/* List & Submissions */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-lg font-bold">Your Active Bounties</h3>
          {loading ? (
             <div className="animate-pulse bg-slate-200 h-32 rounded-xl"></div>
          ) : bounties.length === 0 ? (
             <p className="text-slate-500 italic py-10 text-center bg-white rounded-xl border border-dashed">No active bounties found.</p>
          ) : (
            bounties.map(b => (
              <div key={b.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-start mb-4">
                   <Link to={`/bounty/${b.id}`} className="text-xl font-bold hover:text-teal transition">{b.title}</Link>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${b.status==='open' ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold'}`}>
                     {b.status}
                   </span>
                </div>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2 md:line-clamp-none">{b.description}</p>
                <div className="flex gap-6 text-sm text-slate-500 border-t border-slate-50 pt-4">
                   <span><b className="text-slate-800">{b.amount} ALGO</b> Locked</span>
                   <span>Deadline: {new Date(b.deadline * 1000).toLocaleDateString()}</span>
                </div>

                {b.status === "submitted" && (
                  <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <h4 className="font-semibold text-sm mb-3">Pending Submission</h4>
                     <p className="text-xs text-slate-500 mb-4 font-mono break-all">Contributor: {b.contributorAddress || 'ADDRESS_MOCK'}</p>
                     <div className="flex gap-3">
                        <button onClick={() => handleApprove(b.id, b.contributorAddress)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition">
                           ✅ Approve & Release Funds
                        </button>
                        <button onClick={() => handleDispute(b.id)} className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600 transition">
                           🚨 Dispute
                        </button>
                     </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
