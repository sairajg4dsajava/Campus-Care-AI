const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Please log in." });
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.id).populate("technician");
    if (!user || !user.isActive) return res.status(401).json({ message: "Account unavailable." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session." });
  }
}
const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ message: "Permission denied." });
module.exports = { protect, allow };
