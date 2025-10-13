// IMPORT MODULES
const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cors = require("cors");

// LOAD .env CONFIG
dotenv.config();
const app = express();

// DATABASE CONNECTION
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log("✓ Database connected");
  } catch (err) {
    console.error("✗ Database connection error:", err);
    process.exit(1);
  }
})();

// MIDDLEWARE
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// GOOGLE OAUTH STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!db) return done(new Error("Database not ready"), null);

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

// HELPER: JWT AUTHENTICATION MIDDLEWARE
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!db) return res.status(500).json({ message: "Database not ready" });
    const [rows] = await db.query("SELECT id, name, email, google_id, role FROM users WHERE id=?", [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

// HELPER: ROLE CHECKING MIDDLEWARE
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
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

// --- ROUTES ---

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Authentication API with JWT",
    endpoints: {
      login: "/auth/google",
      callback: "/auth/google/callback",
      profile: "/api/me",
      protected: "/protected",
      adminOnly: "/admin/users",
      logout: "/logout",
    },
  });
});

// Start Google login process
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// Google callback after login
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
      res.redirect(`http://localhost:5173/dashboard?token=${token}`);
    } catch (err) {
      console.error("✗ Token generation error:", err);
      res.redirect("http://localhost:5173/login?error=token_failed");
    }
  }
);

// Get current user profile (Protected Route)
app.get("/api/me", authenticateJWT, (req, res) => {
  res.json({ message: "User authenticated", user: req.user });
});

// Example Protected Route
app.get("/protected", authenticateJWT, (req, res) => {
  res.status(200).json({
    message: "Protected content accessed successfully",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Admin Only Route
app.get("/admin/users", authenticateJWT, requireRole("admin"), async (req, res) => {
  try {
    const [users] = await db.query("SELECT id, name, email, role, created_at FROM users");
    res.json({ message: "Admin access granted", users });
  } catch (err) {
    console.error("✗ Database error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.json({
    message: "Logout successful. Please remove token from client.",
    instructions: "Delete token from localStorage on frontend",
  });
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error("✗ Server error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Google OAuth callback: ${process.env.GOOGLE_CALLBACK_URL}`);
});
