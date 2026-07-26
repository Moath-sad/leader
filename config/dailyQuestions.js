/* =========================================================
   config/dailyQuestions.js
   السؤال اليومي لكل تاريخ جلسة
   ========================================================= */

const DAILY_QUESTIONS = {
  "2026-07-20": "من أول من يقرع باب الجنة؟",
  "2026-07-21": "ما هي أركان الإيمان؟",
  "2026-07-26": "ما هي الباقيات الصالحات؟",
  "2026-07-27": "مزرعة يوجد بها 8 دجاجات و6 أغنام، كم عدد الأرجل في المزرعة؟",
};

function getTodayQuestion() {
  const today = new Date().toISOString().slice(0, 10);
  return DAILY_QUESTIONS[today] || null;
}

module.exports = { DAILY_QUESTIONS, getTodayQuestion };
