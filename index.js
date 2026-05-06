const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// 📦 Schema
const fileSchema = new mongoose.Schema({
  otp: String,
  filename: String,
  expires: Date,
});

const File = mongoose.model("File", fileSchema);

// 📁 Multer setup (PDF only)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),

  filename: (req, file, cb) => {
    if (!file) {
      return cb(new Error("File missing"));
    }

    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF allowed"));
  },
});

// 🔥 uploads folder auto create
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// 📤 Upload API
app.post("/upload", upload.single("file"), async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
	
  setTimeout(() => {
  fs.unlink(filePath, () => {});
}, 10 * 60 * 1000);

    await File.create({
    otp,
    filename: req.file.filename,
    expires: new Date(Date.now() + 5 * 60 * 1000), // 5 min
  });

  res.json({ otp });
});

// 🔑 Verify OTP
app.post("/verify", async (req, res) => {
  const { otp } = req.body;

  const data = await File.findOne({ otp });

  if (!data) return res.status(400).json({ error: "Invalid OTP" });

  if (new Date() > data.expires) {
    await File.deleteOne({ otp });
    return res.status(400).json({ error: "OTP expired" });
  }

  await File.deleteOne({ otp }); // one-time use

  res.json({ filename: data.filename });
});

// 📥 Download
app.get("/download/:name", (req, res) => {
  const filePath = __dirname + "/uploads/" + req.params.name;

  res.download(filePath, (err) => {
    if (err) {
      console.log("Download error:", err);
    } else {
      // 🔥 download के बाद delete
      fs.unlink(filePath, (err) => {
        if (err) console.log("Delete error:", err);
        else console.log("File deleted:", req.params.name);
      });
    }
  });
});

// Server start
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});


