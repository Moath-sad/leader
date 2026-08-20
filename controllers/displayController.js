/* =========================================================
   controllers/displayController.js
   شاشة الاستقبال التفاعلية — عرض عام بدون تسجيل دخول
   ========================================================= */

const statsModel   = require("../models/statsModel");
const studentModel = require("../models/studentModel");
const sessionModel = require("../models/sessionModel");

/* -------- صفحة العرض -------- */
async function showDisplay(req, res, next) {
  try {
    const stats    = await statsModel.getHomeStats();
    const settings = await statsModel.getSettings();

    res.render("display", { stats, settings });
  } catch (err) {
    next(err);
  }
}

/* -------- API: جميع بيانات الشاشة (تُحدَّث كل دقيقة) -------- */
async function getDisplayData(req, res, next) {
  try {
    const [stats, topStudents, currentSession] = await Promise.all([
      statsModel.getHomeStats(),
      studentModel.getTopStudents(10),
      sessionModel.getCurrentOrNextSession(),
    ]);

    res.json({ success: true, stats, topStudents, currentSession });
  } catch (err) {
    next(err);
  }
}

module.exports = { showDisplay, getDisplayData };
