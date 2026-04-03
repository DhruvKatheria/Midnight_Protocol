import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import { Copy, SplitSquareHorizontal } from "lucide-react";
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

  if (!address) return <div className="p-10 text-center">Connect wallet.</div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
      
      <div className="bg-gradient-to-r from-gold/20 to-gold/5 border border-gold rounded-xl p-6 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
            <span className="text-4xl">⚖️</span>
            <div>
               <h2 className="text-xl font-bold text-brand mb-1">Validator Node Active</h2>
               <p className="text-slate-600 text-sm font-medium">You are staked — eligible for dispute selection and governance.</p>
            </div>
         </div>
         <div className="text-right border-l pl-4 border-gold/30">
             <p className="text-xs uppercase font-bold text-gold opacity-80 tracking-wider">Stake Amount</p>
             <p className="text-2xl font-bold text-brand">10 ALGO</p>
         </div>
      </div>

      <h3 className="text-2xl font-bold flex items-center gap-2"><SplitSquareHorizontal className="text-slate-400"/> Dispute Queue / Diff Review</h3>

      {loading ? (
        <div className="animate-pulse bg-slate-200 h-64 rounded-xl"></div>
      ) : disputes.length === 0 ? (
        <div className="bg-white p-10 text-center text-slate-500 rounded-xl shadow-sm">Your queue is empty.</div>
      ) : (
        disputes.map(disp => {
           const hasVoted = disp.voterAddresses && disp.voterAddresses.includes(address);

           return (
             <div key={disp.id} className="bg-white border-x border-b border-t-4 border-t-red-500 rounded-b-xl rounded-t-sm shadow-sm overflow-hidden mb-8">
                <div className="p-6 bg-red-50/30 border-b border-slate-100 flex justify-between items-center">
                   <div>
                       <h4 className="font-bold text-brand flex items-center gap-2">Dispute #{disp.id.substring(0,8)} <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">DISPUTED</span></h4>
                       <p className="text-sm text-red-600 font-medium mt-1">Reason: "{disp.reason}"</p>
                   </div>
                   <div className="text-right">
                       <p className="text-xs font-bold text-slate-400 uppercase">Current Votes</p>
                       <p className="text-sm font-bold"><span className="text-green-600">{disp.votes.approve} Appr</span> / <span className="text-red-600">{disp.votes.reject} Rej</span></p>
                   </div>
                </div>

                {/* Diff View Simulator */}
                <div className="grid md:grid-cols-2 divide-x divide-slate-100 bg-slate-900 text-slate-300">
                   <div className="p-6 space-y-3 relative group">
                      <h5 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-2">
                        Original Brief <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      </h5>
                      <div className="bg-black/50 p-4 rounded text-sm font-mono border border-slate-800 min-h-[100px] leading-relaxed">
                         <span className="text-red-400 bg-red-400/10 px-1">-</span> {disp.originalBrief || "Loading Brief payload..."}
                      </div>
                   </div>
                   <div className="p-6 space-y-3 relative group">
                      <h5 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex justify-between">
                         <span className="flex items-center gap-2">Submitted Work / Evidence <span className="w-2 h-2 rounded-full bg-green-400"></span></span>
                         <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600 hover:text-white transition cursor-pointer" onClick={()=>handleCopy(disp.submissionHash)}>
                            Hash {disp.submissionHash?.substring(0,8)}... <Copy size={12}/>
                         </span>
                      </h5>
                      <div className="bg-black/50 p-4 rounded text-sm font-mono border border-slate-800 min-h-[100px] leading-relaxed flex items-center justify-between">
                         <span><span className="text-green-400 bg-green-400/10 px-1">+</span> [IPFS Content Resolving...]</span>
                         <a href={`https://ipfs.io/ipfs/${disp.submissionHash}`} target="_blank" rel="noreferrer" className="text-teal underline font-bold px-3 py-1 bg-teal/10 rounded">Inspect CID</a>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                   {hasVoted ? (
                      <span className="text-slate-500 font-bold px-4 py-2 border rounded-md">✅ You have voted</span>
                   ) : (
                      <>
                        <button onClick={() => handleVote(disp.id, false)} className="px-6 py-2 bg-white text-red-600 font-bold border border-red-200 rounded hover:bg-red-50 transition shadow-sm">
                           Reject Work (Refund Sponsor)
                        </button>
                        <button onClick={() => handleVote(disp.id, true)} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition shadow-sm">
                           Approve Work (Pay Contributor)
                        </button>
                      </>
                   )}
                </div>
             </div>
           )
        })
      )}
    </div>
  );
}
