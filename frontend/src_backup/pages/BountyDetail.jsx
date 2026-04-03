import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import { Copy, Lock, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

const getStatusColor = (status) => {
    switch(status) {
        case "open": return "bg-blue-100 text-blue-700";
        case "submitted": return "bg-yellow-100 text-yellow-700";
        case "approved": return "bg-green-100 text-green-700";
        case "disputed": return "bg-red-100 text-red-700";
        case "refunded": return "bg-gray-100 text-gray-700";
        default: return "bg-slate-100 text-slate-700";
    }
};

const formatAlgo = (micro) => (micro / 1000000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

export default function BountyDetail() {
  const { id } = useParams();
  const { address, role, signAndSend } = useWallet();
  const [bounty, setBounty] = useState(null);
  
  const [hashStatus, setHashStatus] = useState("unverified"); 

  const [file, setFile] = useState(null);
  const [workText, setWorkText] = useState("");
  const [zkToggle, setZkToggle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ZK Reveal State
  const [revealFile, setRevealFile] = useState(null);
  const [revealText, setRevealText] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealStatus, setRevealStatus] = useState(null);

  useEffect(() => {
    fetchBounty();
  }, [id]);

  const fetchBounty = async () => {
    try {
      const res = await api.get(`/api/bounties/${id}`);
      setBounty(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text) => {
      navigator.clipboard.writeText(text);
      toast.success("Hash copied to clipboard", { icon: "📋" });
  };

  const handleVerifyIntegrity = async () => {
    if (!bounty) return;
    try {
      const msgUint8 = new TextEncoder().encode(bounty.description);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      if (computedHash === bounty.briefHash) {
        setHashStatus("valid");
        toast.success("Brief is verified against its on-chain hash.");
      } else {
        setHashStatus("tampered");
        toast.error("BRIEF HAS BEEN TAMPERED!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!workText && !file) return toast.error("Please provide work/links.");
    
    setIsSubmitting(true);
    const t = toast.loading(zkToggle ? "Generating ZK Commitment..." : "Submitting to IPFS & Blockchain...");

    try {
      const formData = new FormData();
      formData.append("bountyId", bounty.id);
      formData.append("contributorAddress", address);
      formData.append("workContent", workText);
      if (file) formData.append("workFile", file);
      
      if (zkToggle) formData.append("isZkCommitment", "true");

      const res = await api.post("/api/submissions/submit", formData, {
         headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.loading("Please sign transaction...", { id: t });
      await signAndSend([res.data.unsignedAppCallTxn]);
      
      toast.success(zkToggle ? "ZK Commitment Submitted!" : "Work submitted successfully!", { id: t });
      fetchBounty();
    } catch (err) {
      toast.error("Submission failed.", { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealWork = async (e) => {
    e.preventDefault();
    if (!revealText && !revealFile) return toast.error("Provide the actual file/text to reveal.");
    
    setIsRevealing(true);
    const t = toast.loading("Verifying commitment and uploading to IPFS...");
    try {
       const formData = new FormData();
       formData.append("submissionId", "mock_submission_id_here"); 
       formData.append("workContent", revealText);
       if (revealFile) formData.append("workFile", revealFile);

       const res = await api.post("/api/submissions/reveal", formData, {
         headers: { "Content-Type": "multipart/form-data" }
       });

       toast.success("Work Revealed and Verified!", { id: t });
       setRevealStatus("matched");
    } catch(err) {
       toast.error("Fraud flag: Harhes did not match.", { id: t });
       setRevealStatus("mismatch");
    } finally {
       setIsRevealing(false);
    }
  };

  if (!bounty) return <div className="p-10 animate-pulse bg-slate-200 h-96 rounded-xl"></div>;

  const isApproved = bounty.status === "approved";
  const ShowRevealForm = isApproved && (role === "contributor" || !role); 

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl font-bold uppercase text-xs ${getStatusColor(bounty.status)}`}>
          {bounty.status}
        </div>
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-3xl font-extrabold text-brand flex items-center gap-3">
             {bounty.title}
             <a href={`https://testnet.algoexplorer.io/tx/${bounty.txId}`} target="_blank" rel="noreferrer" title="View Transaction">
                <ExternalLink size={20} className="text-slate-300 hover:text-teal transition" />
             </a>
          </h1>
          
          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100/50">
             <div className="flex justify-between items-center mb-2">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Original Brief</h3>
                 <span className="flex items-center gap-1 text-xs font-mono bg-white border px-2 py-1 rounded text-slate-400">
                    Hash: {bounty.briefHash?.substring(0,8)}... 
                    <button onClick={() => handleCopy(bounty.briefHash)} className="hover:text-teal"><Copy size={12} /></button>
                 </span>
             </div>
             <p className="text-slate-700 whitespace-pre-wrap">{bounty.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button 
              onClick={handleVerifyIntegrity} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm transition flex gap-2"
            >
              🔍 Verify Brief Integrity
            </button>
            {hashStatus === "valid" && <span className="text-sm font-bold text-green-600">✓ Brief unchanged since posting</span>}
            {hashStatus === "tampered" && <span className="text-sm font-bold text-red-600 animate-pulse">⚠ BRIEF HAS BEEN TAMPERED</span>}
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 gap-4">
          <div className="bg-teal/10 border border-teal text-teal font-extrabold px-6 py-4 rounded-xl text-center relative pointer-events-none">
            <Lock size={16} className="absolute top-2 left-2 opacity-50" />
            <div className="text-4xl">{formatAlgo(bounty.amount)}</div>
            <div className="text-xs tracking-wider opacity-80 mt-1">ALGO LOCKED</div>
          </div>
          <div className="text-xs bg-slate-100 text-slate-500 px-3 py-2 rounded uppercase font-bold">
            Deadline: {new Date(bounty.deadline * 1000).toLocaleString()}
          </div>
          <Link to={`/transactions/${bounty.id}`} className="text-xs font-semibold text-accent hover:underline">
             View Audit Trail →
          </Link>
        </div>
      </div>

      {/* ZK Reveal Form Block */}
      {ShowRevealForm && (
         <div className="bg-indigo-50 border border-indigo-200 p-8 rounded-xl shadow-sm">
             <h3 className="text-xl font-bold text-indigo-900 mb-2">Reveal Your Work</h3>
             <p className="text-sm text-indigo-700 mb-6">Your funds have been released! You submitted this work via ZK Hash Commitment. Upload the actual files now to fulfill the contract and verify the hash.</p>
             
             {revealStatus === "matched" ? (
                 <div className="bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded font-bold text-center">
                     ✓ Work Verified — Commitment Confirmed
                 </div>
             ) : revealStatus === "mismatch" ? (
                 <div className="bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded font-bold text-center animate-pulse">
                     ⚠ Commitment mismatch — possible fraud flagged
                 </div>
             ) : (
                <form onSubmit={handleRevealWork} className="space-y-4">
                   <input type="file" onChange={(e) => setRevealFile(e.target.files[0])} className="w-full" />
                   <textarea className="w-full border p-2 rounded h-20" placeholder="Source links / content..." value={revealText} onChange={e=>setRevealText(e.target.value)} />
                   <button disabled={isRevealing} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition w-full disabled:opacity-50">
                       {isRevealing ? 'Verifying Hashes...' : 'Reveal & Verify'}
                   </button>
                </form>
             )}
         </div>
      )}

      {/* Submission Form */}
      {(role === "contributor" || !role) && bounty.status === "open" && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gold border-t-4">
           <h3 className="text-xl font-bold text-brand mb-4">Submit Your Work</h3>
           <form onSubmit={handleSubmitWork} className="space-y-6">
             <div>
               <label className="text-sm font-bold text-slate-700 block mb-2">Upload Files (IPFS)</label>
               <input type="file" required={!workText} onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal/10 file:text-teal hover:file:bg-teal/20" />
             </div>
             <div>
               <label className="text-sm font-bold text-slate-700 block mb-2">Description / Links</label>
               <textarea required={!file} className="w-full border rounded-md p-3 h-24 focus:ring-2 focus:ring-teal outline-none" placeholder="Explain your submission or paste URLs here..." value={workText} onChange={e=>setWorkText(e.target.value)} />
             </div>
             
             <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <input type="checkbox" id="zkToggle" checked={zkToggle} onChange={e=>setZkToggle(e.target.checked)} className="w-5 h-5 accent-teal" />
                <label htmlFor="zkToggle" className="text-sm font-medium text-slate-700 cursor-pointer">
                  ZK Hash Commitment Mode <span className="text-slate-400 font-normal block">Upload hash only now, reveal actual files securely after payment approval.</span>
                </label>
             </div>

             <button disabled={isSubmitting || !address} type="submit" className="w-full bg-teal text-white py-4 rounded-lg font-bold hover:bg-opacity-90 transition disabled:opacity-50">
               {isSubmitting ? "Processing..." : (address ? "Submit to SettleChain" : "Connect Wallet to Submit")}
             </button>
           </form>
        </div>
      )}

      {/* Status Timeline */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-6">Settlement Timeline</h3>
        <div className="space-y-6 relative border-l-2 border-slate-100 ml-3 md:ml-6 pl-6 pb-2">
           <div className="relative">
              <span className="w-4 h-4 rounded-full bg-teal absolute -left-[33px] top-1 border-2 border-white ring-2 ring-teal/30"></span>
              <h4 className="font-bold text-slate-800">Bounty Created & Escrow Locked</h4>
              <p className="text-xs text-slate-400 mt-1">{new Date(bounty.createdAt).toLocaleString()} · <a href={`https://testnet.algoexplorer.io/tx/${bounty.txId}`} className="text-accent hover:text-teal underline font-mono flex items-center gap-1 inline-flex"><ExternalLink size={12}/> {bounty.txId?.substring(0,8)}...</a></p>
           </div>
           {bounty.status !== "open" && (
             <div className="relative">
                <span className="w-4 h-4 rounded-full bg-teal absolute -left-[33px] top-1 border-2 border-white"></span>
                <h4 className="font-bold text-slate-800">Work Submitted</h4>
             </div>
           )}
           {isApproved && (
             <div className="relative">
                <span className="w-4 h-4 rounded-full bg-green-500 absolute -left-[33px] top-1 border-2 border-white"></span>
                <h4 className="font-bold text-slate-800">Approved — Funds Settled</h4>
             </div>
           )}
        </div>
      </div>

    </div>
  );
}
