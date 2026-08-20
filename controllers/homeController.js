/* =========================================================
   controllers/homeController.js
   منطق الصفحة الرئيسية: نظرة عامة على النادي + المتصدرون
   ========================================================= */

const statsModel = require("../models/statsModel");
const studentModel = require("../models/studentModel");

async function showHome(req, res, next) {
  try {
    const stats = await statsModel.getHomeStats();
    const topStudents = await studentModel.getTopStudents(10);

    res.render("home", {
      pageTitle: "الرئيسية",
      activeNav: "home",
      stats,
      topStudents,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { showHome };
