// ==========================
// server.js (Final Updated)
// ==========================

// IMPORT MODULES
const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

// LOAD .env CONFIG
dotenv.config();
const app = express();

// ==========================
// DATABASE CONNECTION
// ==========================
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    app.locals.db = db;
    console.log("✓ Database connected");
  } catch (err) {
    console.error("✗ Database connection error:", err);
    process.exit(1);
  }
})();

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
// app.use("/uploads", express.static("uploads")); // serve images
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ==========================
// GOOGLE OAUTH STRATEGY
// ==========================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        const [rows] = await db.query("SELECT * FROM users WHERE google_id=?", [googleId]);

        let user;
        if (rows.length === 0) {
          const [result] = await db.query(
            "INSERT INTO users (google_id, name, email, role) VALUES (?, ?, ?, ?)",
            [googleId, name, email, "user"]
          );
          user = { id: result.insertId, name, email, google_id: googleId, role: "user" };
          console.log("✓ New user created:", user);
        } else {
          user = rows[0];
          console.log("✓ Existing user logged in:", user);
        }

        return done(null, user);
      } catch (err) {
        console.error("✗ OAuth error:", err);
        return done(err, null);
      }
    }
  )
);

// ==========================
// HELPER MIDDLEWARES
// ==========================
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query("SELECT id, name, email, google_id, role FROM users WHERE id=?", [decoded.id]);
    if (rows.length === 0) return res.status(401).json({ message: "User not found" });
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return res.status(401).json({ message: "Token expired" });
    return res.status(401).json({ message: "Invalid token" });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        requiredRole: allowedRoles,
        yourRole: req.user.role,
      });
    }
    next();
  };
};

// ==========================
// ROUTES
// ==========================

// --- Health check ---
app.get("/", (req, res) => {
  res.json({
    message: "Authentication & Event API ready 🚀",
  });
});

// --- Google Auth ---
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login?error=auth_failed",
    session: false,
  }),
  (req, res) => {
    try {
      const payload = { id: req.user.id, email: req.user.email, role: req.user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
      res.redirect(`http://localhost:5173/dashboard?token=${token}&role=${req.user.role}`);
    } catch (err) {
      console.error("✗ Token generation error:", err);
      res.redirect("http://localhost:5173/login?error=token_failed");
    }
  }
);

// --- Get current user profile ---
app.get("/api/me", authenticateJWT, (req, res) => {
  res.json({ message: "User authenticated", user: req.user });
});

// ==========================
// EVENT SECTION (FEBE1 → FEBE3)
// ==========================


// ============= FEBE1: User View Approved Events On Dashboard =============
// ============= FEBE3: User View Approved Events =============

app.get("/api/events/approved", authenticateJWT, requireRole("user", "admin"), async (req, res) => {
  try {
    // เพิ่มการ JOIN กับตาราง users เพื่อดึง u.name AS OrganizerName
    const [events] = await db.query(
      `SELECT 
        e.EventID, e.EventName, e.EventInfo, e.Location, 
        e.StartDateTime, e.EndDateTime, e.ImagePath, u.name AS OrganizerName 
       FROM event e
       JOIN users u ON e.EventOrgID = u.id
       WHERE e.Status = 'Approved' 
       ORDER BY e.StartDateTime ASC`
    );
    res.json(events);
  } catch (err) {
    console.error("Fetch Approved Events Error:", err);
    res.status(500).json({ message: "Failed to fetch approved events" });
  }
});

// ============= FEBE2: Organizer Create Event =============
// 🧾 Multer Config (Upload Image)
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log("📁 Created uploads directory:", uploadPath);
    }
    cb(null, uploadPath);
  },
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
    if (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg") return cb(new Error("Only image files allowed"));
    cb(null, true);
  },
});


app.post("/api/events/create", authenticateJWT, requireRole("user"), upload.single("image"), async (req, res) => {
  try {
    const { title, startDateTime, endDateTime, location, maxParticipant, maxStaff, eventInfo } = req.body;

    if (!title || !startDateTime || !endDateTime || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // =====================================================================
    // === แก้จาก req.file.path เป็น `uploads/${req.file.filename}` ที่นี่ ===
    // =====================================================================
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;
    const orgId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO event 
        (EventName, EventOrgID, StartDateTime, EndDateTime, MaxParticipant, MaxStaff, EventInfo, Location, Status, ImagePath)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [title, orgId, startDateTime, endDateTime, maxParticipant || null, maxStaff || null, eventInfo || null, location, imagePath]
    );

    res.status(201).json({ message: "✅ Event created and pending approval", eventId: result.insertId });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ============= FEBE2: Admin View & Approve Events =============
app.get("/api/events/pending", authenticateJWT, requireRole("admin"), async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, u.name AS OrganizerName 
       FROM event e 
       JOIN users u ON e.EventOrgID = u.id 
       WHERE e.Status = 'Pending'
       ORDER BY e.StartDateTime ASC`
    );
    res.json(events);
  } catch (err) {
    console.error("Fetch Pending Events Error:", err);
    res.status(500).json({ message: "Failed to fetch pending events" });
  }
});

app.put("/api/events/approve/:id", authenticateJWT, requireRole("admin"), async (req, res) => {
  try {
    const eventId = req.params.id;
    const [result] = await db.query(`UPDATE event SET Status='Approved' WHERE EventID=?`, [eventId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "✅ Event approved successfully" });
  } catch (err) {
    console.error("Approve Event Error:", err);
    res.status(500).json({ message: "Failed to approve event" });
  }
});

// ===============================================
// START: โค้ดที่ต้องเพิ่ม
// ===============================================

// Endpoint ใหม่: Admin ปฏิเสธ Event
app.put("/api/events/reject/:id", authenticateJWT, requireRole("admin"), async (req, res) => {
  try {
    const eventId = req.params.id;
    // หมายเหตุ: ในระบบจริง อาจจะต้องรับ 'reason' จาก req.body เพื่อบันทึกเหตุผล
    const [result] = await db.query(`UPDATE event SET Status='Rejected' WHERE EventID=?`, [eventId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "❌ Event rejected successfully" });
  } catch (err) {
    console.error("Reject Event Error:", err);
    res.status(500).json({ message: "Failed to reject event" });
  }
});

// Endpoint ใหม่: Admin ดึง Events ตามสถานะ (Approved, Rejected, หรือทั้งหมด)
app.get("/api/events/admin/all", authenticateJWT, requireRole("admin"), async (req, res) => {
    try {
        const { status } = req.query; // รับค่า status จาก query e.g., ?status=Approved

        let query = `
            SELECT e.*, u.name AS OrganizerName 
            FROM event e 
            JOIN users u ON e.EventOrgID = u.id
        `;
        const queryParams = [];

        if (status && ['Approved', 'Rejected', 'Pending'].includes(status)) {
            query += ' WHERE e.Status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY e.StartDateTime DESC';

        const [events] = await db.query(query, queryParams);
        res.json(events);
    } catch (err) {
        console.error("Fetch All Admin Events Error:", err);
        res.status(500).json({ message: "Failed to fetch events" });
    }
});

// ===============================================
// END: โค้ดที่ต้องเพิ่ม
// ===============================================


// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Google OAuth callback: ${process.env.GOOGLE_CALLBACK_URL}`);
});

