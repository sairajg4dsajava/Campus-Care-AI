const router=require("express").Router();
const Asset=require("../models/Asset");
const {protect,allow}=require("../middleware/auth");
router.get("/",protect,allow("Admin"),async(_req,res)=>{
 try{const assets=await Asset.find();const predictions=assets.map(a=>{
 let s=0,reasons=[];if(a.condition==="Poor"){s+=35;reasons.push("Poor condition");}else if(a.condition==="Fair"){s+=15;reasons.push("Condition requires attention");}
 const b=Number(a.breakdownCount||0);s+=Math.min(b*10,30);if(b)reasons.push(`${b} previous breakdown(s)`);
 const u=Number(a.usageHoursPerDay||0);if(u>=16){s+=20;reasons.push("Very high usage");}else if(u>=8){s+=10;reasons.push("High usage");}
 if(a.lastMaintenanceDate){const due=new Date(a.lastMaintenanceDate);due.setDate(due.getDate()+Number(a.maintenanceIntervalDays||90));const days=Math.ceil((due-new Date())/86400000);if(days<0){s+=25;reasons.push("Maintenance overdue");}else if(days<=7){s+=15;reasons.push("Maintenance due within 7 days");}else if(days<=30){s+=5;reasons.push("Maintenance due within 30 days");}}
 if(a.status==="Out of Service")s+=20;else if(a.status==="Under Maintenance")s+=10;s=Math.min(s,100);
 const level=s>=70?"Critical":s>=45?"High":s>=25?"Medium":"Low";
 return {assetId:a._id,assetName:a.assetName,assetCode:a.assetCode,assetType:a.assetType,location:a.location,condition:a.condition,status:a.status,riskScore:s,riskLevel:level,reasons,recommendation:level==="Critical"?"Immediate inspection required.":level==="High"?"Schedule maintenance soon.":level==="Medium"?"Plan preventive maintenance.":"Continue routine monitoring."};
 }).sort((a,b)=>b.riskScore-a.riskScore);
 res.json({totalAssets:predictions.length,critical:predictions.filter(x=>x.riskLevel==="Critical").length,high:predictions.filter(x=>x.riskLevel==="High").length,medium:predictions.filter(x=>x.riskLevel==="Medium").length,low:predictions.filter(x=>x.riskLevel==="Low").length,predictions});
 }catch{res.status(500).json({message:"Prediction failed."});}
});
module.exports=router;
