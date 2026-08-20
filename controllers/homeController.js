/* =========================================================
   controllers/homeController.js
   منطق الصفحة الرئيسية: التعريف بالنادي + الإحصائيات + المتصدرون
   ========================================================= */

const statsModel = require("../models/statsModel");
const studentModel = require("../models/studentModel");
const { getTodayQuestion } = require("../config/dailyQuestions");

async function showHome(req, res, next) {
  try {
    const stats = await statsModel.getHomeStats();
    const settings = await statsModel.getSettings();
    const topStudents = await studentModel.getTopStudents(10);
    const clubDays = await statsModel.getClubDayNames();

    const dailyQuestion = getTodayQuestion();

    res.render("home", {
      pageTitle: "الرئيسية",
      activeNav: "home",
      stats,
      settings,
      topStudents,
      clubDays,
      dailyQuestion,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { showHome };
