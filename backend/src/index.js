require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Create Express app
const app = express();

// ===========================
// MIDDLEWARE SETUP
// ===========================

// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-wallet-address",
      "x-signature",
      "x-public-key",
      "x-message",
    ],
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later",
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ===========================
// ROUTES
// ===========================

// Import routes
const bountyRoutes = require("./routes/bounties");
const userRoutes = require("./routes/users");
const submissionRoutes = require("./routes/submissions");
const disputeRoutes = require("./routes/disputes");
const transactionRoutes = require("./routes/transactions");

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "✅ SettleChain Backend Running",
    version: "1.0.0",
    network: process.env.ALGORAND_NETWORK || "testnet",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/bounties", bountyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/transactions", transactionRoutes);

// Test endpoints
app.get("/test/hash", (req, res) => {
  const { hashBrief } = require("./services/hashing");
  const sample = "Build a landing page";
  const hash = hashBrief(sample);
  res.json({ input: sample, hash });
});

app.get("/test/contract", async (req, res) => {
  try {
    const { getContractState } = require("./services/algorand");
    const state = await getContractState();
    res.json({ contractState: state });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contract state", message: err.message });
  }
});

app.get("/test/firebase", async (req, res) => {
  try {
    const firebase = require("./services/firebase");
    if (!firebase.db) {
      return res.json({ status: "⚠️ Firebase not initialized", message: "Place firebase-admin-key.json in backend/" });
    }
    res.json({ status: "✅ Firebase connected" });
  } catch (err) {
    res.status(500).json({ error: "Firebase test failed", message: err.message });
  }
});

// ===========================
// ERROR HANDLING
// ===========================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===========================
// START SERVER
// ===========================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 SettleChain Backend Server Started`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🌐 Network: ${process.env.ALGORAND_NETWORK || 'testnet'}`);
  console.log(`📱 APP_ID: ${process.env.APP_ID || 'Not set'}`);
  console.log(`${'='.repeat(50)}\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⏹️  Server shutting down...");
  process.exit(0);
});
