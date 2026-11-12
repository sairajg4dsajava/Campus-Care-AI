require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.json({ message: "CampusCare AI API is running" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/technicians", require("./routes/technicians"));
app.use("/api/assets", require("./routes/assets"));
app.use("/api/work-orders", require("./routes/workOrders"));
app.use("/api/predictions", require("./routes/predictions"));
app.use("/api/ai", require("./routes/ai"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

const port = process.env.PORT || 5000;
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("MONGODB_URI and JWT_SECRET must be configured in backend/.env");
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`API listening on ${port}`)))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
