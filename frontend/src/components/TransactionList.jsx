import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useWallet } from "../context/walletContext";

export default function TransactionList() {
  const { account } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      fetchTransactions();
    }
  }, [account]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/transactions/user/${account}`);
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
      <h3>💳 Transaction List</h3>
      {loading && <p>Loading transactions...</p>}
      {!loading && transactions.length === 0 && <p>No transactions yet</p>}
      {!loading && transactions.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Type</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Amount</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{txn.type}</td>
                <td style={{ padding: "10px" }}>{txn.amount} ALGO</td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      backgroundColor: txn.status === "confirmed" ? "#4CAF50" : "#ff9800",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {txn.status}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>
                  {new Date(txn.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

