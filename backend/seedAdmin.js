require("dotenv").config();
const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
const User=require("./models/User");
(async()=>{
 try{
  if(!process.env.MONGODB_URI||!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD||!process.env.ADMIN_NAME)throw new Error("Set MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env.");
  if(process.env.ADMIN_PASSWORD.length<12)throw new Error("Use an admin password with at least 12 characters.");
  await mongoose.connect(process.env.MONGODB_URI);
  const email=process.env.ADMIN_EMAIL.trim().toLowerCase();
  if(await User.findOne({email}))throw new Error("An account with ADMIN_EMAIL already exists.");
  await User.create({name:process.env.ADMIN_NAME,email,password:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),role:"Admin"});
  console.log("Admin account created.");
 }catch(e){console.error(e.message);process.exitCode=1;}
 finally{await mongoose.disconnect();}
})();
