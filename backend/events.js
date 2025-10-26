const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("./db");
const { authenticateJWT } = require("./middlewares");

// --- Image Upload Config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" && ext !== ".png") return cb(new Error("Only .jpg and .png allowed"));
    cb(null, true);
  },
});

// --- CREATE EVENT ---
router.post("/create", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const { title, startDateTime, endDateTime, location, maxParticipant, maxStaff, eventInfo, status } = req.body;

    if (!title || !startDateTime || !endDateTime || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const imagePath = req.file ? req.file.path : null;
    const orgId = req.user.id; // ใช้ id จาก token เป็น organizer

    const [result] = await db.query(
      `INSERT INTO event (EventName, EventOrgID, StartDateTime, EndDateTime, MaxParticipant, MaxStaff, EventInfo, Location, Status, ImagePath)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, orgId, startDateTime, endDateTime, maxParticipant || null, maxStaff || null, eventInfo || null, location, status || "Draft", imagePath]
    );

    res.status(201).json({ message: "✅ Event created successfully", eventId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

module.exports = router;
