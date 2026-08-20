/* =========================================================
   routes/dailyAttendanceRoutes.js
   ========================================================= */
const express = require("express");
const router = express.Router();
const dailyAttendanceController = require("../controllers/dailyAttendanceController");

router.get("/daily-attendance", dailyAttendanceController.showDailyAttendance);
router.post("/api/daily-attendance/mark", dailyAttendanceController.markSelfAttendance);

module.exports = router;
