# Team Midnight_Protocol

### 👥 Team Members

| Name |
| :--- |
| **Dhairya Jotwani** |
| **Dhruv Katheria** |
| **Reva Kale** |
| **Shreya Kesti** |
# SettleChain
**Trust layer for the gig economy. Code enforces fairness.**

SettleChain is a decentralized bounty escrow platform on Algorand. It utilizes Smart Contracts and Zero-Knowledge (ZK) Hash Commitments to completely eliminate trust barriers between Sponsors and Contributors. All disputes are resolved through an incentivized Validator staking mechanism natively via PyTeal.

---

## 🚀 5-Minute Demo Walkthrough

### 1. Happy Path (Escrow & Release)
1. **Sponsor View:** Click "Create Bounty", type the brief, and submit. *A Pera Wallet transaction pops up to lock ALGO directly into the Smart Contract.*
2. **Contributor View:** Switch to Contributor Dashboard. Locate the open bounty and submit work (via IPFS). *A secondary 0-ALGO txn calls the `submit` contract route.*
3. **Settlement:** Sponsor clicks "Approve". *The PyTeal contract instantly releases the locked funds out to the Contributor, circumventing the backend entirely.*

### 2. Trust Score Algorithm
Immediately after Settlement, check the **Profile Page**. 
- The Contributor receives `+10` Trust Score.
- The Sponsor receives `+5` Trust Score.
These numbers actively Mint and Burn the **SettleChain TRUST Token ASA** globally on TestNet.

### 3. Arbitration Path (Disputes & Validators)
1. **Dispute Raised:** When a Sponsor rejects a submission, they execute a `Dispute`.
2. **Validators Assigned:** 3 random Staked Validators are securely assigned.
3. **Voting:** The Validators view an identical UI showing the *Original Brief Hash* vs. the *Submitted IPFS CID*. 
4. **Resolution:** If 2/3 agree, the funds automatically dispatch to the winner. Correct validators get `+3` reputation; incorrect ones get slashed `-5`.

---

## 🛠️ Architecture

```ascii
[Pera Wallet] <-----> [React / Vite Frontend] <-------> [web3.storage IPFS]
                           |                 
                           v                 
[Express NodeJS Backend] <-----> [Firestore DB (Indexing)]
           |
           v
[Algorand TestNet (PyTeal Escrow + ASA Tokens)]
```

---

## ⚡ Deployment & Setup
### Requirements
- Node.js 20+
- AlgoKit (Local Sandbox) or TestNet Nodes connection.
- Pera Wallet App.

### Scripts
```bash
# Clone
git clone <repo>
cd settlechain

# Install Backend
cd backend
npm install
node scripts/seed.js # populates the mock data

# Install Frontend
cd ../frontend
npm install

# Run stack
cd ..
docker-compose up --build
```
*Note: If Algorand TestNet goes down during the presentation, our backend intercepts the `5XX` layers and dynamically triggers Firebase Cached representations automatically so the UI remains flawless.*
