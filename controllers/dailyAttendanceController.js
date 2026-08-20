/* =========================================================
   controllers/dailyAttendanceController.js
   صفحة عامة (بدون تسجيل دخول) يحضّر فيها كل طالب نفسه بنفسه،
   تعمل فقط إن كان اليوم فعلاً يوم جلسة نادي (لا يوجد تسجيل دخول للطلاب)
   ========================================================= */

const pool = require("../config/db");
const studentModel = require("../models/studentModel");
const sessionModel = require("../models/sessionModel");

/* -------- صفحة التحضير اليومي -------- */
async function showDailyAttendance(req, res, next) {
  try {
    await sessionModel.autoMarkAbsentForPastSessions();

    const session = await sessionModel.getTodaySession();
    let familiesData = [];

    if (session) {
      const students = await studentModel.getAllStudents();
      const [attRows] = await pool.query(
        "SELECT student_id, status FROM attendance WHERE session_id = ?",
        [session.id]
      );
      const statusByStudent = {};
      attRows.forEach((r) => { statusByStudent[r.student_id] = r.status; });

      const familiesMap = {};
      students.forEach((s) => {
        if (!familiesMap[s.group_name]) familiesMap[s.group_name] = [];
        familiesMap[s.group_name].push({
          id: s.id,
          name: s.name,
          status: statusByStudent[s.id] || null,
        });
      });
      familiesData = Object.entries(familiesMap).map(([groupName, members]) => ({ groupName, members }));
    }

    res.render("daily-attendance", {
      pageTitle: "التحضير اليومي",
      activeNav: "daily-attendance",
      session,
      familiesData,
    });
  } catch (err) {
    next(err);
  }
}

/* -------- API: تحضير الطالب لنفسه (عام، بدون تسجيل دخول) --------
   يعمل فقط إن كان اليوم بالضبط يوم جلسة نادي، لمنع تحضير نفسه في أي يوم آخر */
async function markSelfAttendance(req, res, next) {
  try {
    const studentId = Number(req.body.studentId);
    if (!studentId) {
      return res.status(400).json({ success: false, message: "اختر اسمك من القائمة" });
    }

    const session = await sessionModel.getTodaySession();
    if (!session) {
      return res.status(400).json({ success: false, message: "لا توجد جلسة نادي اليوم" });
    }

    const previous = await studentModel.getAttendanceForSession(studentId, session.id);
    if (previous && previous.status === "حاضر") {
      return res.json({ success: true, alreadyMarked: true });
    }

    const record = await studentModel.markAttendance(studentId, "حاضر", session.id);

    const [studentRows] = await pool.query("SELECT name FROM students WHERE id = ?", [studentId]);
    const studentName = studentRows[0] ? studentRows[0].name : `#${studentId}`;
    await pool.query(
      "INSERT INTO activity_log (action) VALUES (?)",
      [`تحضير ذاتي: ${studentName} (${session.day_name} - الأسبوع ${session.week_number})`]
    );

    res.json({ success: true, alreadyMarked: false, record });
  } catch (err) {
    next(err);
  }
}

module.exports = { showDailyAttendance, markSelfAttendance };
