const jwt = require("jsonwebtoken");
const User = require("../models/User");

//Verify JWT token and attach user to request
const protect = async (req, res, next) => {
  try {
    //1. Check Authorization header
    const authHeader = req.headers.authorization;
    //2. Extract and verify token
    const token = authHeader?.split(" ")[1] || req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. No token provided." })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //3. Find user from token payload (exclude password)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    //4. Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired. Please log in again." });
    }
    res.status(500).json({ success: false, message: "Server error during authentication." });
  }
};

//Optional auth — attaches user if token present, but doesn't block if missing
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith("Bearer "))
    ? authHeader.split(" ")[1] 
    : req.query.token;

    //If token exists, verify and attach user. If not, just continue without user.
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;    //If user not found, treat as no auth rather than error
  } catch (_) {
    //Silently ignore invalid/expired tokens for optional routes
  }
  next();
};

module.exports = { protect, optionalAuth };
