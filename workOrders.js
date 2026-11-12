const router=require("express").Router();
const WorkOrder=require("../models/WorkOrder");
const Asset=require("../models/Asset");
const Technician=require("../models/Technician");
const {protect,allow}=require("../middleware/auth");
router.use(protect);
const populate=q=>q.populate("asset","assetName assetCode assetType location").populate("assignedTechnician","name email phone specialization");
function risk(a){
 let s=0,r=[];
 if(a.condition==="Fair"){s+=15;r.push("Condition requires attention");}
 if(a.condition==="Poor"){s+=35;r.push("Poor condition");}
 const b=Number(a.breakdownCount||0);s+=Math.min(b*10,30);if(b)r.push(`${b} previous breakdown(s)`);
 const u=Number(a.usageHoursPerDay||0);if(u>=16){s+=20;r.push("Very high daily usage");}else if(u>=8){s+=10;r.push("High daily usage");}
 if(a.lastMaintenanceDate){const due=new Date(a.lastMaintenanceDate);due.setDate(due.getDate()+Number(a.maintenanceIntervalDays||90));const days=Math.ceil((due-new Date())/86400000);if(days<0){s+=25;r.push("Maintenance overdue");}else if(days<=7){s+=15;r.push("Maintenance due within 7 days");}else if(days<=30){s+=5;r.push("Maintenance due within 30 days");}}else{s+=15;r.push("Maintenance date missing");}
 if(a.status==="Out of Service")s+=20;else if(a.status==="Under Maintenance")s+=10;
 s=Math.min(s,100);return {score:s,level:s>=70?"Critical":s>=45?"High":"Low",reasons:r};
}
router.post("/generate",allow("Admin"),async(_req,res)=>{try{const assets=await Asset.find();let created=0,skipped=0;for(const a of assets){const x=risk(a);if(!["High","Critical"].includes(x.level))continue;const exists=await WorkOrder.findOne({asset:a._id,status:{$in:["Pending","In Progress"]}});if(exists){skipped++;continue;}await WorkOrder.create({asset:a._id,riskScore:x.score,riskLevel:x.level,priority:x.level,reasons:x.reasons,recommendation:x.level==="Critical"?"Immediate inspection required.":"Schedule maintenance soon."});created++;}res.json({created,skipped});}catch(e){res.status(500).json({message:e.message});}});
router.get("/",async(req,res)=>{try{const filter=req.user.role==="Admin"?{}:{assignedTechnician:req.user.technician?._id||null};const list=await populate(WorkOrder.find(filter).sort({createdAt:-1}));res.json({count:list.length,workOrders:list});}catch{res.status(500).json({message:"Could not load work orders."});}});
router.patch("/:id/assign",allow("Admin"),async(req,res)=>{try{const t=req.body.technicianId?await Technician.findById(req.body.technicianId):null;if(req.body.technicianId&&!t)return res.status(404).json({message:"Technician not found."});const w=await WorkOrder.findByIdAndUpdate(req.params.id,{assignedTechnician:t?._id||null},{new:true});if(!w)return res.status(404).json({message:"Work order not found."});res.json({workOrder:await populate(WorkOrder.findById(w._id))});}catch(e){res.status(400).json({message:e.message});}});
router.patch("/:id/status",async(req,res)=>{
 try{
  const {status}=req.body;if(!["Pending","In Progress","Completed"].includes(status))return res.status(400).json({message:"Invalid status."});
  const w=await WorkOrder.findById(req.params.id);if(!w)return res.status(404).json({message:"Work order not found."});
  if(req.user.role!=="Admin" && (!req.user.technician || String(w.assignedTechnician)!==String(req.user.technician._id)))return res.status(403).json({message:"This work order is not assigned to you."});
  w.status=status;w.completedAt=status==="Completed"?new Date():null;await w.save();res.json({workOrder:await populate(WorkOrder.findById(w._id))});
 }catch(e){res.status(400).json({message:e.message});}
});
module.exports=router;
