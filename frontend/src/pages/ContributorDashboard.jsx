import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";

export default function ContributorDashboard() {
  const { address } = useWallet();
  const [bounties, setBounties] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchData();
    }
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

  if (!address) return <div className="p-10 text-center text-lg text-slate-500">Please connect wallet.</div>;

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-brand">Contributor Dashboard</h2>
           <p className="text-slate-500 text-sm mt-1">{address}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Open Bounties */}
        <div className="space-y-4">
           <h3 className="text-lg font-bold flex items-center justify-between">
              Open Bounties
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{bounties.length} available</span>
           </h3>
           
           <div className="bg-white p-3 rounded-lg flex gap-4 text-sm mb-4 border border-slate-100 items-center">
              <span className="font-semibold text-slate-500">Filter:</span>
              <button className="text-brand hover:underline font-medium decoration-teal">High Reward</button>
              <button className="text-slate-400 hover:text-brand transition">Ending Soon</button>
           </div>

           {loading ? (
             <div className="animate-pulse bg-slate-200 h-32 rounded-xl"></div>
           ) : bounties.length === 0 ? (
             <div className="bg-white p-8 text-center text-slate-500 rounded-xl border border-dashed">No open bounties right now.</div>
           ) : (
             bounties.map(b => (
               <div key={b.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                     <Link to={`/bounty/${b.id}`} className="text-lg font-bold text-accent hover:text-teal transition">
                       {b.title}
                     </Link>
                     <span className="text-lg font-bold text-teal">{b.amount} ALGO</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-2">{b.description}</p>
                  <div className="flex justify-between items-center text-xs mt-4 pt-4 border-t border-slate-50">
                     <span className="text-slate-400">Sponsor Trust: <b className="text-green-600">High (95)</b></span>
                     <span className="text-slate-400">{new Date(b.deadline * 1000).toLocaleDateString()}</span>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* My Submissions */}
        <div className="space-y-4">
           <h3 className="text-lg font-bold">My Submissions</h3>
           {submissions.length === 0 ? (
              <div className="bg-white p-8 text-center text-slate-500 rounded-xl border border-dashed">You haven't submitted any work yet.</div>
           ) : (
              submissions.map(s => (
                <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                   <div className="flex justify-between">
                     <Link to={`/bounty/${s.bountyId}`} className="font-bold hover:underline">Bounty #{s.bountyId.substring(0,8)}</Link>
                     {s.status === 'approved' ? (
                       <span className="flex items-center text-green-600 text-sm font-bold gap-1">
                         ✅ Funds Released
                       </span>
                     ) : (
                       <span className="flex items-center text-gold text-sm font-bold gap-1">
                         ⏳ Pending Approval
                       </span>
                     )}
                   </div>
                   <p className="text-xs font-mono mt-2 text-slate-400 break-all">{s.workHash}</p>
                </div>
              ))
           )}
        </div>
      </div>
    </div>
  );
}
