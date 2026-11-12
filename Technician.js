const mongoose = require("mongoose");
module.exports = mongoose.model("Technician", new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: "" },
  specialization: { type: String, enum: ["Electrical","Plumbing","Cleaning","Furniture","Network","General Maintenance"], default: "General Maintenance" },
  availability: { type: String, enum: ["Available","Busy","Unavailable"], default: "Available" }
}, { timestamps: true }));
