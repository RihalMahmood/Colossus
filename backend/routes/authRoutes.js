const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

//Helper: sign a JWT token
function signToken(userId) {
  //.sign() takes a payload ((we'll include user ID), a secret key, and options like expiration)
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

//Helper: build safe user object (no password)
function safeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/*POST /api/auth/register
Creates a new user account*/
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    //Check if email already in use
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    //Create user (password hashed automatically via pre-save hook in model)
    const user = await User.create({ name, email, password });

    //Issue JWT
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);    //Log the error for debugging purposes
    //Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

/*POST /api/auth/login
Authenticates an existing user*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    //Find user and explicitly include password (it's hidden by default via select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    //Compare password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    //Issue JWT
    const token = signToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

/*GET /api/auth/me   (protected)
Returns the currently logged-in user's profile*/
router.get("/me", protect, async (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
});

/*PUT /api/auth/me   (protected)
Update display name*/
router.put("/me", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
    }

    req.user.name = name.trim();
    await req.user.save();

    res.json({ success: true, message: "Profile updated!", user: safeUser(req.user) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error updating profile." });
  }
});

module.exports = router;
