const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Technician = require("../models/Technician");
const { protect } = require("../middleware/auth");

const tokenFor = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role, technician: user.technician || null });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name?.trim() || !email?.trim() || typeof password !== "string" || password.length < 8)
      return res.status(400).json({ message: "Enter name, email and a password of at least 8 characters." });
    if (!["Student","Faculty"].includes(role)) return res.status(400).json({ message: "Choose Student or Faculty." });
    const normalized = email.trim().toLowerCase();
    if (await User.findOne({ email: normalized })) return res.status(409).json({ message: "Email is already registered." });
    const user = await User.create({ name: name.trim(), email: normalized, password: await bcrypt.hash(password, 12), role });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (e) { res.status(500).json({ message: "Registration failed." }); }
});

router.post("/register-technician", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || typeof password !== "string" || password.length < 8)
      return res.status(400).json({ message: "Enter all fields. Password must be at least 8 characters." });
    const normalized = email.trim().toLowerCase();
    const technician = await Technician.findOne({ email: normalized });
    if (!technician || technician.name.toLowerCase() !== name.trim().toLowerCase())
      return res.status(403).json({ message: "Technician name/email does not match an administrator-created profile." });
    if (await User.findOne({ email: normalized })) return res.status(409).json({ message: "Account already exists." });
    const user = await User.create({ name: technician.name, email: normalized, password: await bcrypt.hash(password, 12), role: "Technician", technician: technician._id });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch { res.status(500).json({ message: "Technician registration failed." }); }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || "").trim().toLowerCase() }).select("+password").populate("technician");
    if (!user || !user.isActive || !(await bcrypt.compare(req.body.password || "", user.password)))
      return res.status(401).json({ message: "Invalid email or password." });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch { res.status(500).json({ message: "Login failed." }); }
});
router.get("/me", protect, (req, res) => res.json({ user: publicUser(req.user) }));
module.exports = router;
