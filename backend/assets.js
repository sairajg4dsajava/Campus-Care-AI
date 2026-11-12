const router = require("express").Router();
const Asset = require("../models/Asset");
const Complaint = require("../models/Complaint");
const {protect,allow}=require("../middleware/auth");
router.use(protect);
router.get("/", allow("Admin","Technician"), async (_req,res)=>{
 try {
  const assets=await Asset.find().sort({createdAt:-1});
  const stats=await Complaint.aggregate([{$match:{asset:{$ne:null}}},{$group:{_id:"$asset",total:{$sum:1},open:{$sum:{$cond:[{$ne:["$status","Resolved"]},1,0]}}}}]);
  const m=new Map(stats.map(x=>[String(x._id),x]));
  res.json({assets:assets.map(a=>({...a.toObject(),totalComplaints:m.get(String(a._id))?.total||0,openComplaints:m.get(String(a._id))?.open||0}))});
 } catch {res.status(500).json({message:"Could not load assets."});}
});
router.post("/",allow("Admin"),async(req,res)=>{try{const a=await Asset.create(req.body);res.status(201).json({asset:a});}catch(e){res.status(400).json({message:e.message});}});
router.patch("/:id",allow("Admin"),async(req,res)=>{try{const a=await Asset.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!a)return res.status(404).json({message:"Asset not found."});res.json({asset:a});}catch(e){res.status(400).json({message:e.message});}});
router.delete("/:id",allow("Admin"),async(req,res)=>{const a=await Asset.findByIdAndDelete(req.params.id);if(!a)return res.status(404).json({message:"Asset not found."});await Complaint.updateMany({asset:a._id},{$set:{asset:null}});res.json({message:"Asset deleted and complaints unlinked."});});
module.exports=router;
