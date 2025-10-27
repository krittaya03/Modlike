// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("./auth/googleAuth");
const { authenticateJWT } = require("./middleware/authJWT");
const { requireRole } = require("./middleware/requireRole");
const { errorHandler } = require("./utils/errorHandler");
const routes = require("./routes");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Authentication API with JWT",
    endpoints: {
      login: "/auth/google",
      callback: "/auth/google/callback",
      profile: "/api/me",
      protected: "/api/protected",
      admin: "/api/admin/users",
    },
  });
});

// Google login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// Google callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login?error=auth_failed",
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
  }
);

// Protected routes
app.use("/api", authenticateJWT, routes);

// Admin example
app.get("/api/admin/users", authenticateJWT, requireRole("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

// Logout
app.get("/logout", (req, res) => {
  res.json({ message: "Logout successful. Please remove token from client." });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
