const mongoose = require("mongoose");
module.exports = mongoose.model("Complaint", new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, enum: ["Electrical","Plumbing","Cleaning","Furniture","Network","Other"], required: true },
  location: { type: String, required: true, trim: true },
  priority: { type: String, enum: ["Low","Medium","High","Critical"], default: "Medium" },
  status: { type: String, enum: ["Pending","In Progress","Resolved"], default: "Pending" },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", default: null }
}, { timestamps: true }));
