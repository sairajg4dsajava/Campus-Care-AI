const mongoose = require("mongoose");
module.exports = mongoose.model("WorkOrder", new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },
  riskScore: { type: Number, min: 0, max: 100, required: true },
  riskLevel: { type: String, enum: ["High","Critical"], required: true },
  priority: { type: String, enum: ["High","Critical"], required: true },
  reasons: { type: [String], default: [] },
  recommendation: { type: String, default: "" },
  status: { type: String, enum: ["Pending","In Progress","Completed"], default: "Pending" },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true }));
