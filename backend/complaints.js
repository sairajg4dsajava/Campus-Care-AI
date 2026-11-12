const router = require("express").Router();
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const { protect, allow } = require("../middleware/auth");
router.use(protect);
const populate = q => q.populate("asset", "assetName assetCode assetType").populate("assignedTechnician", "name email specialization").populate("submittedBy", "name email");
router.get("/", async (req,res) => {
  try {
    const filter = req.user.role === "Admin" ? {} :
      ["Student","Faculty"].includes(req.user.role) ? { submittedBy: req.user._id } :
      { assignedTechnician: req.user.technician?._id };
    const items = await populate(Complaint.find(filter).sort({createdAt:-1}));
    res.json({count:items.length, complaints:items});
  } catch { res.status(500).json({message:"Could not load complaints."}); }
});
router.post("/", allow("Admin","Student","Faculty"), async (req,res) => {
  try {
    const {title,description,category,location,priority,asset} = req.body;
    if (!title || !category || !location) return res.status(400).json({message:"Title, category and location are required."});
    const item = await Complaint.create({title,description,category,location,priority,asset:asset || null,submittedBy:req.user._id});
    res.status(201).json({message:"Complaint submitted.", complaint:await populate(Complaint.findById(item._id))});
  } catch(e) { res.status(400).json({message:e.message}); }
});
router.patch("/:id", allow("Admin"), async (req,res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:"Invalid ID."});
  const allowed = ["title","description","category","location","priority","status","assignedTechnician","asset"];
  const changes = Object.fromEntries(Object.entries(req.body).filter(([k])=>allowed.includes(k)));
  try {
    const item = await Complaint.findByIdAndUpdate(req.params.id,changes,{new:true,runValidators:true});
    if (!item) return res.status(404).json({message:"Complaint not found."});
    res.json({message:"Complaint updated.",complaint:await populate(Complaint.findById(item._id))});
  } catch(e) { res.status(400).json({message:e.message}); }
});
router.delete("/:id", allow("Admin"), async (req,res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:"Invalid ID."});
  const item = await Complaint.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({message:"Complaint not found."});
  res.json({message:"Complaint deleted."});
});
module.exports = router;
