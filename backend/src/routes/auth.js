const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your-secret-key-change-in-production", {
    expiresIn: "30d",
  });
};

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Please add all fields" });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Give uid as either a simple UUID since we are dealing with email login now
    const uid = uuidv4();

    // Create user
    const user = await User.create({
      uid,
      name,
      email,
      password: hashedPassword,
      role,
      trustScore: 50,
      isStaked: false
    });

    if (user) {
      res.status(201).json({
        _id: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.uid),
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // You may want to check if the role matches, or allow them to login with whatever role they chose initially
      
      res.json({
        _id: user.uid,
        name: user.name,
        email: user.email,
        role: user.role, // Or the role they selected recently if you want to support dynamic roles
        token: generateToken(user.uid),
      });
    } else {
      res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
