import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useWallet } from "../context/walletContext";
import toast from "react-hot-toast";

export default function TransactionLog() {
  const { bountyId } = useParams();
  const { address } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [bountyId, address]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let endpt = `/api/transactions/${bountyId || "all"}`;
      const res = await api.get(endpt);
      setTransactions(res.data.transactions || res.data || []);
    } catch (err) {
      // graceful fallback
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const actionColors = {
    lock: "bg-primary/10 text-primary",
    release: "bg-primary/10 text-primary",
    submit: "bg-surface-container-highest text-on-surface-variant",
    approve: "bg-tertiary/10 text-tertiary",
    dispute: "bg-error-container/20 text-error",
    vote: "bg-tertiary/10 text-tertiary",
  };

  const filtered = transactions.filter(t => {
    if (filter !== "all" && t.action?.toLowerCase() !== filter) return false;
    if (search && !t.bountyId?.includes(search) && !t.txHash?.includes(search)) return false;
    return true;
  });

  return (
    <div className="px-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 pt-4">
        <div className="space-y-2">
          <h1 className="text-5xl font-headline font-extrabold tracking-tight text-on-surface">Transaction Log</h1>
          <p className="text-on-surface-variant text-lg max-w-xl">Real-time immutable ledger of all bounty settlements and validator actions on SettleChain.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-low p-6 rounded-xl min-w-[140px]">
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">24h Volume</span>
            <div className="text-2xl font-headline font-bold text-primary mt-1">42.8k ALGO</div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl min-w-[140px]">
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">TPS Avg</span>
            <div className="text-2xl font-headline font-bold text-tertiary mt-1">1,240</div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96 group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary/50 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-neutral-600 transition-all"
            placeholder="Search Bounty ID or Wallet Address..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {["all", "lock", "submit", "approve", "dispute", "vote"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === f ? "bg-surface-container-highest text-on-surface" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"}`}
            >
              {f === "all" ? "All Actions" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 text-on-surface-variant text-xs uppercase tracking-widest font-label">
                <th className="px-6 py-5">Bounty ID</th>
                <th className="px-6 py-5">Action</th>
                <th className="px-6 py-5">Transaction Hash</th>
                <th className="px-6 py-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-on-surface-variant">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-on-surface-variant">No transactions found.</td></tr>
              ) : (
                filtered.map((tx, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-6">
                      <span className="font-headline font-bold text-on-surface">#{tx.bountyId?.substring(0, 8) || "N/A"}</span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${actionColors[tx.action?.toLowerCase()] || "bg-surface-container-highest text-on-surface-variant"}`}>
                        {tx.action || "TX"}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 font-mono text-on-surface-variant group-hover:text-primary transition-colors">
                        <span>{tx.txHash ? `${tx.txHash.substring(0,4)}...${tx.txHash.slice(-4)}` : 'N/A'}</span>
                        <button className="p-1 hover:bg-primary/10 rounded" onClick={() => handleCopy(tx.txHash || '')}>
                          <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className="text-on-surface-variant text-sm">{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : ''}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-6 bg-surface-container-high/30 flex justify-between items-center border-t border-outline-variant/5">
          <span className="text-sm text-on-surface-variant">
            Showing <span className="text-on-surface font-medium">{filtered.length}</span> transactions
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <aside className="mt-12 p-8 bg-gradient-to-br from-surface-container-low to-surface-container-lowest rounded-2xl ring-1 ring-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          </div>
          <div>
            <h3 className="text-xl font-headline font-bold text-on-surface">Settlement Finality Guaranteed</h3>
            <p className="text-on-surface-variant">All transactions are anchored on the Algorand blockchain for instant finality.</p>
          </div>
        </div>
        <a className="px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded-lg hover:bg-surface-bright transition-all text-sm whitespace-nowrap" href="https://testnet.algoexplorer.io" target="_blank" rel="noreferrer">
          Verify on Explorer
        </a>
      </aside>
    </div>
  );
}
