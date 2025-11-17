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
const fs = require("fs"); // ✅ [เพิ่ม] Import 'fs' สำหรับจัดการไฟล์/โฟลเดอร์


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


    let user;


    // 🔹 ตรวจสอบ token type
    if (decoded.type === "google") {
      const [rows] = await db.query(
        "SELECT id, name, email, google_id, role FROM users WHERE id = ?",
        [decoded.id]
      );
      if (rows.length === 0) return res.status(401).json({ message: "Google user not found" });
      user = rows[0];
    }
    else if (decoded.type === "local") {
      const [rows] = await db.query(
        "SELECT id, username AS name, role FROM LocalUsers WHERE id = ?",
        [decoded.id]
      );
      if (rows.length === 0) return res.status(401).json({ message: "Local user not found" });
      user = rows[0];
    }
    else {
      return res.status(401).json({ message: "Invalid token type" });
    }


    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired" });
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
     
      const payload = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        type: "google"  
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
      res.redirect(`http://localhost:5173/dashboard?token=${token}&role=${req.user.role}`);
    } catch (err) {
      console.error("✗ Token generation error:", err);
      res.redirect("http://localhost:5173/login?error=token_failed");
    }
  }
);


// --- Local Login (username/password) ---
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;


    if (!username || !password) {
      return res.status(400).json({ message: "Missing username or password" });
    }


    // ตรวจสอบในฐานข้อมูล LocalUsers
    const [rows] = await db.query("SELECT * FROM LocalUsers WHERE username=?", [username]);


    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }


    const user = rows[0];


    // 🔸 ตรวจสอบรหัสผ่านแบบ plain text
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }


    // 🔹 สร้าง JWT (ระบุ type: "local")
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      type: "local"
    };


    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });


    console.log(`✓ Local user logged in: ${user.username} (${user.role})`);


    // 🔹 ส่ง token และ role กลับไปให้ frontend
    res.json({
      message: "Login successful",
      token,
      role: user.role
    });


  } catch (err) {
    console.error("Local Login Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




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
  } catch (err)
 {
    console.error("Fetch Approved Events Error:", err);
    res.status(500).json({ message: "Failed to fetch approved events" });
  }
});


// ============= FEBE2: Organizer Create Event =============
// 🧾 Multer Config (Upload Image)
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




// ============= FEBE2: Organizer Create Event =============
app.post("/api/events/create", authenticateJWT, requireRole("user"), upload.single("image"), async (req, res) => {
  try {
    const { title, startDateTime, endDateTime, location, maxParticipant, maxStaff, eventInfo, status } = req.body;


    if (!title || !startDateTime || !endDateTime || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }


    // ตรวจสอบค่า status ที่ส่งมา ถ้าไม่มีให้ default เป็น 'Pending'
    const finalStatus = status && ['Pending', 'Draft'].includes(status) ? status : 'Pending';


    const imagePath = req.file ? `uploads/${req.file.filename}` : null;
    const orgId = req.user.id;


    const [result] = await db.query(
      `INSERT INTO event
        (EventName, EventOrgID, StartDateTime, EndDateTime, MaxParticipant, MaxStaff, EventInfo, Location, Status, ImagePath)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, orgId, startDateTime, endDateTime, maxParticipant || null, maxStaff || null, eventInfo || null, location, finalStatus, imagePath]
    );


    res.status(201).json({
      message: `✅ Event saved as ${finalStatus}`,
      eventId: result.insertId
    });


  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ✅ [เพิ่ม] Endpoint สำหรับอัปเดต Event (สำคัญที่สุดสำหรับการแก้ไข)
app.put("/api/events/update/:id", authenticateJWT, requireRole("user"), upload.single("image"), async (req, res) => {
  try {
    const eventId = req.params.id;
    const orgId = req.user.id; // ID ของผู้ใช้ที่กำลังล็อกอิน
    const { title, startDateTime, endDateTime, location, maxParticipant, maxStaff, eventInfo, status } = req.body;

    if (!title || !startDateTime || !endDateTime || !location || !status) {
      return res.status(400).json({ message: "Missing required fields for update" });
    }

    // เริ่มสร้าง query สำหรับอัปเดต
    let sql = `UPDATE event SET EventName=?, StartDateTime=?, EndDateTime=?, Location=?, MaxParticipant=?, MaxStaff=?, EventInfo=?, Status=?`;
    const params = [title, startDateTime, endDateTime, location, maxParticipant || null, maxStaff || null, eventInfo || null, status];

    // ถ้ามีการอัปโหลดไฟล์รูปภาพใหม่ ให้เพิ่มการอัปเดต ImagePath เข้าไปใน query ด้วย
    if (req.file) {
      sql += `, ImagePath=?`;
      params.push(`uploads/${req.file.filename}`);
      // หมายเหตุ: อาจต้องเพิ่ม logic ลบไฟล์รูปเก่าที่นี่
    }

    // เพิ่มเงื่อนไข WHERE เพื่อให้แน่ใจว่าผู้ใช้เป็นเจ้าของ Event นี้เท่านั้น
    sql += ` WHERE EventID=? AND EventOrgID=?`;
    params.push(eventId, orgId);

    const [result] = await db.query(sql, params);

    // ตรวจสอบว่ามีการอัปเดตแถวข้อมูลหรือไม่
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found or you don't have permission to edit it." });
    }

    res.status(200).json({ message: "✅ Event updated successfully!" });

  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "Internal server error during event update." });
  }
});


// ==========================
// 🧾 Get Events by Status
// ==========================
app.get("/api/events/status", authenticateJWT, requireRole("user"), async (req, res) => {
  try {
    const UserId = req.user.id; // ดึง ID ของ organizer ที่ล็อกอิน
    
    // ✅ [แก้ไข] ลบ const { status } = req.query; ที่ไม่ได้ใช้งานออก
    // ✅ [แก้ไข] แก้ไข SQL ให้ดึงทุกสถานะที่ต้องการสำหรับหน้า "My Event" และลบ parameter ที่ไม่ได้ใช้ออก
    const [events] = await db.query(
      `SELECT EventID, EventName, StartDateTime, EndDateTime, Location, Status, ImagePath
       FROM event
       WHERE EventOrgID = ? AND Status IN ('Draft','Pending','Approved','Rejected', 'Cancelled')
       ORDER BY FIELD(Status, 'Draft', 'Pending', 'Rejected', 'Approved', 'Cancelled'), StartDateTime DESC`,
      [UserId] // เอา status ที่ไม่ได้ใช้ออก
    );


    res.status(200).json({ events });
  } catch (err) {
    console.error("Get Events by Status Error:", err);
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

// ============= BE3 : ดึงรายละเอียด event เดี่ยว (สำหรับหน้า Details และ Edit) ===========
app.get('/api/events/:id', authenticateJWT, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // แก้ไข Query ให้ JOIN ตาราง users เพื่อดึงชื่อผู้จัด (OrganizerName) มาด้วย
    const [rows] = await db.query(
      `SELECT e.*, u.name AS OrganizerName 
       FROM event e
       LEFT JOIN users u ON e.EventOrgID = u.id
       WHERE e.EventID = ?`,
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = rows[0];

    // --- ตรรกะการตรวจสอบสิทธิ์การเข้าถึงใหม่ ---
    const isOwner = event.EventOrgID === userId;
    const isAdmin = userRole === 'admin';
    const isApprovedEvent = event.Status === 'Approved';

    // อนุญาตให้เข้าถึงได้ถ้า:
    // 1. คุณเป็นเจ้าของ Event (สำหรับหน้า Edit)
    // 2. หรือ คุณเป็น Admin
    // 3. หรือ Event นี้เป็น Event ที่ได้รับการอนุมัติแล้ว (สำหรับหน้า Enroll/Details ของ User ทั่วไป)
    if (isOwner || isAdmin || isApprovedEvent) {
      // ส่งข้อมูลกลับไปให้ Frontend
      res.json({ event: event });
    } else {
      // ถ้าไม่ตรงเงื่อนไขใดๆ เลย (เช่น user ทั่วไปพยายามดู event ที่เป็น Draft ของคนอื่น)
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view this event.' });
    }

  } catch (err) {
    console.error("Get Event by ID Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ===============================================
// START: โค้ดที่ต้องเพิ่ม (โค้ดเดิมของคุณ)
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

// ============= FEBE3: Organizer Cancel Event =============
app.put("/api/events/cancel/:id", authenticateJWT, requireRole("user"), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const [result] = await db.query(
      `UPDATE event SET Status='Cancelled' WHERE EventID=? AND EventOrgID=?`,
      [eventId, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Event not found or unauthorized" });

    res.json({ message: "❌ Event cancelled successfully" });
  } catch (err) {
    console.error("Cancel Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ============= FEBE3: Organizer Fix & Resubmit Event =============
// หมายเหตุ: Endpoint นี้อาจไม่จำเป็นแล้ว ถ้าใช้ /update/:id แทน
app.put("/api/events/resubmit/:id", authenticateJWT, requireRole("user"), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { title, startDateTime, endDateTime, location, eventInfo, maxParticipant, maxStaff } = req.body;

    const [result] = await db.query(
      `UPDATE event 
       SET EventName=?, StartDateTime=?, EndDateTime=?, Location=?, EventInfo=?, 
           MaxParticipant=?, MaxStaff=?, Status='Pending' 
       WHERE EventID=? AND EventOrgID=?`,
      [title, startDateTime, endDateTime, location, eventInfo, maxParticipant, maxStaff, eventId, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Event not found or unauthorized" });

    res.json({ message: "🔄 Event resubmitted for approval" });
  } catch (err) {
    console.error("Resubmit Event Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


//=====================================
// Sprint 5: Event Detail and Enrollment (Updated for user_type)
//=====================================

// GET Event Detail (สำหรับหน้า Detail ของ user และ Organizer)
app.get("/api/events/detail/:id", authenticateJWT, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        const userType = req.user.google_id ? "google" : "local"; // 🔹 เพิ่ม userType

        // ดึง event + organizer name
        const [eventRows] = await db.query(
            `SELECT e.*, u.name AS OrganizerName
             FROM event e
             JOIN users u ON e.EventOrgID = u.id
             WHERE e.EventID = ?`,
            [eventId]
        );

        if (!eventRows.length) return res.status(404).json({ message: "Event not found" });

        const event = eventRows[0];

        // จำนวนผู้เข้าร่วม
        const [countRows] = await db.query(
            "SELECT COUNT(*) AS total FROM event_participants WHERE event_id=?",
            [eventId]
        );
        const currentParticipant = countRows[0].total;

        // ตรวจสอบว่าผู้ใช้ลงทะเบียนแล้วหรือไม่
        const [checkEnroll] = await db.query(
            "SELECT * FROM event_participants WHERE event_id=? AND user_id=? AND user_type=?",
            [eventId, userId, userType] // 🔹 เพิ่ม user_type
        );
        const isEnrolled = checkEnroll.length > 0;

        // ตรวจสอบว่าผู้ใช้สามารถ enroll ได้หรือไม่
        const canEnroll = event.EventOrgID !== userId && currentParticipant < event.MaxParticipant && !isEnrolled;

        res.json({ event, currentParticipant, isEnrolled, canEnroll });
    } catch (err) {
        console.error("Fetch Event Detail Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST Enroll : ให้ user ลงทะเบียนเข้าร่วม event
app.post("/api/events/enroll/:id", authenticateJWT, requireRole("user"), async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        const userType = req.user.google_id ? "google" : "local"; // 🔹 เพิ่ม userType

        const [eventRows] = await db.query("SELECT * FROM event WHERE EventID=?", [eventId]);
        if (!eventRows.length) return res.status(404).json({ message: "Event not found" });

        const event = eventRows[0];

        // Organizer ไม่สามารถลงทะเบียน event ของตัวเอง
        if (event.EventOrgID === userId)
            return res.status(403).json({ message: "Organizer cannot enroll their own event" });

        // ตรวจสอบจำนวนผู้เข้าร่วม
        const [countRows] = await db.query(
            "SELECT COUNT(*) AS total FROM event_participants WHERE event_id=?",
            [eventId]
        );
        if (countRows[0].total >= event.MaxParticipant)
            return res.status(400).json({ message: "Event is full" });

        // ตรวจสอบว่าลงทะเบียนแล้วหรือไม่
        const [checkEnroll] = await db.query(
            "SELECT * FROM event_participants WHERE event_id=? AND user_id=? AND user_type=?",
            [eventId, userId, userType] // 🔹 เพิ่ม user_type
        );
        if (checkEnroll.length > 0)
            return res.status(400).json({ message: "Already enrolled" });

        // ลงทะเบียน
        await db.query(
            "INSERT INTO event_participants (event_id, user_id, user_type) VALUES (?, ?, ?)",
            [eventId, userId, userType] // 🔹 เพิ่ม user_type
        );

        res.json({ message: "✅ Successfully enrolled" });
    } catch (err) {
        console.error("Enroll Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET Events that the current user is enrolled in //insert at 16-11-25
app.get("/api/enrolled-events", authenticateJWT, requireRole("user"), async (req, res) => {
    try {
        const userId = req.user.id;
        // ตรวจสอบว่า user มาจาก Google Login หรือ Local Login
        const userType = req.user.google_id ? "google" : "local"; 

        // Query เพื่อดึงข้อมูล Event จากตาราง event โดย JOIN กับ event_participants
        // เพื่อหา event ที่มี user_id และ user_type ตรงกับคนที่ login อยู่
        const [enrolledEvents] = await db.query(
            `SELECT
                e.EventID,
                e.EventName,
                e.Location,
                e.StartDateTime,
                e.EndDateTime,
                e.ImagePath
             FROM event e
             JOIN event_participants ep ON e.EventID = ep.event_id
             WHERE ep.user_id = ? AND ep.user_type = ?
             ORDER BY e.StartDateTime ASC`,
            [userId, userType]
        );

        res.json(enrolledEvents);

    } catch (err) {
        console.error("Fetch Enrolled Events Error:", err);
        res.status(500).json({ message: "Internal server error while fetching enrolled events" });
    }
});


// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Google OAuth callback: ${process.env.GOOGLE_CALLBACK_URL}`);
});