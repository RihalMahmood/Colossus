require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config();

const app = express();

//Middleware
app.use(cors({
  origin: function (origin, callback) {
    //Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    //Allow your web frontend
    if (origin === process.env.WEB_CLIENT_URL) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Multer setup for file uploads
const memUpload = multer({ storage: multer.memoryStorage() });

//Apply multer only to the /api/drive-explorer/upload route
app.use("/api/drive-explorer", (req, res, next) => {
  if (req.path.match(/\/upload$/) && req.method === "POST") {
    memUpload.single("file")(req, res, next);
  } else {
    next();
  }
});

//Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/drives", require("./routes/driveRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/drive-explorer", require("./routes/driveExplorer"));

//Health check
app.get("/api/health", (req, res) => res.json({ status: "OmniCloud API running" }));

//Connect to MongoDB & start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
    process.exit(1);
  });
