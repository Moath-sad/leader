/* =========================================================
   controllers/displayController.js
   شاشة الاستقبال التفاعلية — عرض عام بدون تسجيل دخول
   ========================================================= */

const pool         = require("../config/db");
const statsModel   = require("../models/statsModel");
const studentModel = require("../models/studentModel");
const groupModel   = require("../models/groupModel");
const sessionModel = require("../models/sessionModel");
const { getTodayQuestion } = require("../config/dailyQuestions");

/* -------- صفحة العرض -------- */
async function showDisplay(req, res, next) {
  try {
    const stats    = await statsModel.getHomeStats();
    const settings = await statsModel.getSettings();
    const clubDays = await statsModel.getClubDayNames();
    const dailyQuestion = getTodayQuestion();

    res.render("display", { stats, settings, clubDays, dailyQuestion });
  } catch (err) {
    next(err);
  }
}

/* -------- API: جميع بيانات الشاشة (تُحدَّث كل دقيقة) -------- */
async function getDisplayData(req, res, next) {
  try {
    const [stats, topByCategory, groups, currentSession] = await Promise.all([
      statsModel.getHomeStats(),
      studentModel.getTopStudentsByCategory(5),
      groupModel.getRankedGroups(),
      sessionModel.getCurrentOrNextSession(),
    ]);
    const dailyQuestion = getTodayQuestion();

    res.json({ success: true, stats, topByCategory, groups, currentSession, dailyQuestion });
  } catch (err) {
    next(err);
  }
}

module.exports = { showDisplay, getDisplayData };
