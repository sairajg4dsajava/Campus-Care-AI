const router=require("express").Router();
const {protect,allow}=require("../middleware/auth");
const rules={
 Electrical:["electric","power","wiring","wire","light","bulb","fan","switch","socket","spark","shock","fuse"],
 Plumbing:["water","pipe","tap","leak","drain","toilet","washroom","bathroom","flush","sewage","tank"],
 Cleaning:["clean","garbage","waste","dust","dirty","smell","odor","sanitation","mosquito","pest"],
 Furniture:["chair","table","desk","bench","door","window","bed","cupboard","shelf"],
 Network:["wifi","wi-fi","internet","network","router","lan","ethernet","server","connection","printer"]
};
router.post("/classify",protect,allow("Admin","Student","Faculty"),(req,res)=>{
 const {title="",description=""}=req.body;if(!title.trim()||!description.trim())return res.status(400).json({message:"Title and description are required."});
 const text=`${title} ${description}`.toLowerCase();let best="Other",score=0;
 for(const [category,words] of Object.entries(rules)){const n=words.filter(w=>text.includes(w)).length;if(n>score){score=n;best=category;}}
 const critical=["fire","smoke","electric shock","sparking","short circuit","emergency","flood","gas leak","dangerous"];
 const high=["not working","broken","leak","outage","no water","no power","server down"];
 const priority=critical.some(w=>text.includes(w))?"Critical":high.some(w=>text.includes(w))?"High":score?"Medium":"Low";
 res.json({success:true,classification:{category:best,priority,specialization:best==="Other"?"General Maintenance":best,confidence:score>1?"High":score?"Medium":"Low",explanation:score?`Matched ${score} keyword(s) for ${best}.`:"No category keywords matched; review manually."}});
});
module.exports=router;
