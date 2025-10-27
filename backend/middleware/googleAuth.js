// auth/googleAuth.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const connectDB = require("../config/db");
const dotenv = require("dotenv");

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const db = await connectDB();
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

module.exports = passport;
