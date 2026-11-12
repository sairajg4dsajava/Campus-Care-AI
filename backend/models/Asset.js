const mongoose = require("mongoose");
module.exports = mongoose.model("Asset", new mongoose.Schema({
  assetName: { type: String, required: true, trim: true },
  assetCode: { type: String, required: true, unique: true, trim: true },
  assetType: { type: String, default: "General" },
  location: { type: String, required: true },
  condition: { type: String, enum: ["Good","Fair","Poor"], default: "Good" },
  status: { type: String, enum: ["Operational","Under Maintenance","Out of Service"], default: "Operational" },
  breakdownCount: { type: Number, default: 0, min: 0 },
  usageHoursPerDay: { type: Number, default: 0, min: 0, max: 24 },
  lastMaintenanceDate: { type: Date, default: null },
  maintenanceIntervalDays: { type: Number, default: 90, min: 1 }
}, { timestamps: true }));
