# SettleChain - Decentralized Bounty Escrow System

## Quick Start Setup Guide

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Perl Wallet (for Algorand testnet connectivity)
- Algorand account with testnet ALGO tokens

### Step 1: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create/update .env file with actual values:
cat > .env << EOF
NODE_ENV=development
PORT=4000

# Get these from Algorand testnet faucet
ALGORAND_MNEMONIC=your_25_word_mnemonic_here

# Firebase (optional - will work without for demo)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com

# Algorand Configuration
APP_ID=0
ALGORAND_NETWORK=testnet
ALGORAND_NODE_URL=https://testnet-api.algonode.cloud
ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_secret_key_change_in_production
EOF

# Start backend
npm run dev
# Server will run on http://localhost:4000
```

### Step 2: Smart Contract Deployment

```bash
cd smart-contracts

# Install PyTeal
pip install pyteal

# Compile smart contract to TEAL
python settlechain_escrow.py

# Deploy to Algorand testnet
# You're prompted for mnemonic, or set ALGORAND_MNEMONIC
python deploy.py

# Save the returned APP_ID
# Update backend/.env with: APP_ID=<returned_app_id>
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:4000
VITE_NETWORK=testnet
EOF

# Start development server
npm run dev
# App will run on http://localhost:5173
```

### Step 4: Testing

#### Register as User
```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_ALGO_ADDRESS",
    "email": "test@example.com",
    "name": "Test User",
    "role": "sponsor"
  }'
```

#### Create Bounty
```bash
curl -X POST http://localhost:4000/api/bounties/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Landing Page",
    "description": "Create a responsive landing page",
    "reward": 1000,
    "deadline": "2026-05-01",
    "walletAddress": "YOUR_ALGO_ADDRESS"
  }'
```

## Project Structure

### Backend (`/backend`)
- `src/routes/` - API endpoints (bounties, users, submissions, disputes, transactions)
- `src/services/` - Business logic (Algorand, Firebase, IPFS, Trust Score, Hashing)
- `src/middleware/` - Auth middleware for wallet verification
- `scripts/seed.js` - Database seeding script
- `smart-contracts/` - Algorand smart contract files

### Frontend (`/frontend`)
- `src/components/` - Reusable UI components
- `src/pages/` - Full page components  
- `src/context/` - Wallet context & state management
- `src/services/` - API client & utilities

### Database (`/database`)
- `schemas/` - Firestore collection schema definitions
- `seed/` - Database seeding script

### Smart Contracts (`/smart-contracts`)
- `settlechain_escrow.py` - PyTeal smart contract
- `artifacts/` - Compiled TEAL files
- `deploy.py` - Deployment script

## Key Features Implemented

✅ Immutable Brief Hashing
✅ Escrow Fund Locking  
✅ Bounty Creation & Management
✅ Submission Tracking
✅ Dispute Resolution Framework
✅ Transaction Logging
✅ Trust Score Calculation
✅ Wallet Integration (Pera)
✅ Firebase Backend
✅ IPFS Document Storage
✅ Smart Contract Deployment

## Status of Components

### Backend Routes
- ✅ GET /api/bounties - List bounties
- ✅ POST /api/bounties/create - Create bounty
- ✅ GET /api/bounties/:id - Get bounty details
- ✅ POST /api/users/register - Register user
- ✅ GET /api/users/:uid - Get user profile
- ✅ POST /api/submissions/create - Submit solution
- ✅ POST /api/disputes/create - Create dispute
- ✅ POST /api/transactions/create - Log transaction

### Smart Contract
- ✅ create_bounty() - Create new bounty
- ✅ submit_solution() - Submit solution
- ✅ approve_submission() - Approve & release funds
- ✅ create_dispute() - Initiate dispute
- ✅ resolve_dispute() - Resolve with validator decision

### Frontend Pages
- ✅ Landing Page
- ✅ Sponsor Dashboard
- ✅ Contributor Dashboard  
- ✅ Bounty Detail (partial)
- 🔄 Profile Page
- 🔄 Validator Panel
- 🔄 Transaction Log

## Next Steps for Production

1. **Complete Frontend Implementation**
   - Finalize all page components
   - Add form validation
   - Implement error boundaries
   - Add loading states

2. **Smart Contract Testing**
   - Write unit tests
   - Testnet deployment verification
   - Mainnet security audit

3. **Database**
   - Add MongoDB/Firestore connection strings
   - Implement database models
   - Add migrations

4. **Security**
   - Implement JWT token system
   - Rate limiting on all endpoints
   - Input sanitization
   - CORS configuration refinement

5. **Monitoring**
   - Add logging (Winston/Pino)
   - Sentry for error tracking
   - Performance monitoring

## Troubleshooting

### "Backend not responding"
- Check `npm run dev` is running on port 4000
- Verify `.env` file exists
- Check CORS configuration

### "Invalid wallet address"
- Ensure wallet is funded with testnet ALGO
- Verify wallet address format (58 characters)
- Test with faucet: https://dispenser.testnet.algorand.network

### "APP_ID = 0"  
- Deploy smart contract first
- Copy APP_ID from deployment output
- Update .env and restart backend

### "Firebase connection fails"
- Place `firebase-admin-key.json` in `/backend`
- Verify credentials are correct
- Firebase is optional - app works without it

## Contact & Support

For issues or questions, check:
- Problem statement: Review requirements  
- Code comments: Inline documentation
- API tests: Use curl commands above

---

**Built with ❤️ for the Algorand ecosystem**
