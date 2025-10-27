// routes/index.js
const express = require("express");
const router = express.Router();

router.use("/events", require("./events"));
// router.use("/users", require("./users")); // ตัวอย่างถ้ามี route users เพิ่มในอนาคต
// router.use("/auth", require("./auth"));   // ตัวอย่างถ้ามี route auth เพิ่ม

module.exports = router;