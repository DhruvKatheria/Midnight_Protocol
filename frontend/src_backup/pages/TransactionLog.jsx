import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useParams } from "react-router-dom";

export default function TransactionLog() {
  const { bountyId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [bountyId]);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/api/transactions/${bountyId}`);
      setTransactions(res.data.transactions || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'bounty_created': return '🔒';
      case 'work_submitted': return '📤';
      case 'submission_approved': return '✅';
      case 'dispute_raised': return '🚨';
      case 'vote_cast': return '⚖️';
      case 'dispute_resolved': return '💸';
      case 'refund_claimed': return '↩️';
      default: return '⚡';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
      <div>
         <h1 className="text-3xl font-extrabold text-brand mb-2">Blockchain Audit Trail</h1>
         <p className="text-slate-500 font-mono text-sm max-w-full break-all bg-slate-100 p-2 rounded inline-block">Bounty Ref: {bountyId}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        {loading ? (
           <div className="animate-pulse space-y-8">
             <div className="h-10 bg-slate-200 rounded w-full"></div>
             <div className="h-10 bg-slate-200 rounded w-3/4"></div>
           </div>
        ) : transactions.length === 0 ? (
           <p className="text-slate-500">No logs found.</p>
        ) : (
           <div className="relative border-l-2 border-slate-200 ml-4 pb-4">
             {transactions.map((tx, idx) => (
                <div key={tx.id || idx} className="mb-10 ml-8 relative pt-1">
                   <span className="absolute flex items-center justify-center w-10 h-10 bg-white rounded-full -left-[53px] -top-1 ring-4 ring-white border shadow-sm text-lg">
                     {getActionIcon(tx.action)}
                   </span>
                   
                   <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-brand uppercase tracking-wider text-sm">{tx.action.replace('_', ' ')}</h4>
                        <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                          {new Date(tx.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-4 text-sm font-mono text-slate-600">
                         <div className="flex justify-between border-b border-white pb-2">
                            <span className="text-slate-400">Actor</span>
                            <span className="truncate max-w-[200px]">{tx.actor || 'N/A'}</span>
                         </div>
                         {tx.amount > 0 && (
                           <div className="flex justify-between border-b border-white pb-2">
                              <span className="text-slate-400">Amount (ALGO)</span>
                              <span className="text-accent font-bold">{tx.amount}</span>
                           </div>
                         )}
                         <div className="flex justify-between pt-1">
                            <span className="text-slate-400">Transaction ID</span>
                            <a href={`https://testnet.algoexplorer.io/tx/${tx.txId}`} target="_blank" rel="noreferrer" className="text-teal hover:underline font-bold truncate max-w-[200px]">
                              {tx.txId || 'pending...'}
                            </a>
                         </div>
                      </div>
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
}
