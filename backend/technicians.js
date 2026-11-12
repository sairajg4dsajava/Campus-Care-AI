const router = require("express").Router();
const Technician = require("../models/Technician");
const Complaint = require("../models/Complaint");
const { protect, allow } = require("../middleware/auth");
router.use(protect, allow("Admin"));
router.get("/", async (_req,res) => {
  try {
    const techs = await Technician.find().sort({createdAt:-1});
    const counts = await Complaint.aggregate([{$match:{assignedTechnician:{$ne:null},status:{$ne:"Resolved"}}},{$group:{_id:"$assignedTechnician",count:{$sum:1}}}]);
    const map = new Map(counts.map(x=>[String(x._id),x.count]));
    res.json({technicians:techs.map(t=>({...t.toObject(),assignedCount:map.get(String(t._id))||0}))});
  } catch { res.status(500).json({message:"Could not load technicians."}); }
});
router.post("/", async (req,res) => { try { const t=await Technician.create(req.body); res.status(201).json({technician:t}); } catch(e){res.status(400).json({message:e.message});} });
router.patch("/:id", async (req,res) => { try { const t=await Technician.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}); if(!t)return res.status(404).json({message:"Technician not found."}); res.json({technician:t}); } catch(e){res.status(400).json({message:e.message});} });
router.delete("/:id", async (req,res) => { try { const t=await Technician.findByIdAndDelete(req.params.id); if(!t)return res.status(404).json({message:"Technician not found."}); await Complaint.updateMany({assignedTechnician:t._id},{$set:{assignedTechnician:null}}); res.json({message:"Technician deleted."}); } catch {res.status(500).json({message:"Delete failed."});} });
module.exports=router;
