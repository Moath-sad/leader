/* =========================================================
   config/seed.js
   سكربت تهيئة قاعدة البيانات:
   1) ينشئ الجداول من schema.sql
   2) يعبّيها ببيانات تجريبية (مجموعات + طلاب + حضور + نقاط)

   التشغيل:  node config/seed.js
   ========================================================= */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { normalizeArabic } = require("../utils/arabicNormalize");

// 6 مجموعات، جميعها ضمن فئة واحدة
const GROUPS_WITH_CATEGORY = [
  { name: "أبو زامل",      category: "الأولوية" },
  { name: "أبو عبدالرحمن", category: "الأولوية" },
  { name: "أبو جبر",        category: "الأولوية" },
  { name: "أبو محمد",       category: "الأولوية" },
  { name: "أبو عبدالله",    category: "الأولوية" },
  { name: "أبو يوسف",       category: "الأولوية" },
];
const GROUP_NAMES = GROUPS_WITH_CATEGORY.map((g) => g.name);

const SAMPLE_NAMES = [
  "عبدالله محمد العتيبي", "سلطان فهد القحطاني", "ناصر سعد الدوسري",
  "خالد عبدالعزيز الشهري", "فيصل ماجد الحربي", "تركي بندر العنزي",
  "محمد علي الزهراني", "عمر يوسف المالكي", "بدر سامي السبيعي",
  "راكان حمد الغامدي", "زياد طلال العمري", "يزيد ناصر البقمي",
  "سعود فايز الرشيدي", "حمد سعيد الجهني", "ماجد ابراهيم العسيري",
  "فهد عبدالرحمن الشمري", "نواف خالد التميمي", "عبدالعزيز سامي اليامي",
  "سامي محمد الفيفي", "عبدالمجيد وليد الحازمي", "أحمد سلمان الخالدي",
  "إبراهيم عادل المطيري", "جابر فواز الحارثي", "وليد رائد البلوي",
  "صالح عماد الجبري", "مشعل فيصل الزهراني", "ريان عبدالله القرني",
  "كريم نواف العتيبي", "عبدالرحمن ياسر الدوسري", "تميم بشير العنزي",
];

const INITIATIVE_CATEGORIES = ["التقنية", "الأدبية", "الأصولية", "المهارية"];

function generateBarcodeId(index) {
  const year = new Date().getFullYear();
  return `QC${year}${String(index).padStart(4, "0")}`;
}

async function run() {
  // اتصال منفصل خاص بالتهيئة (وليس عبر pool المشترك في db.js)
  // مهم: multipleStatements: true لتنفيذ schema.sql دفعة واحدة (يحتوي عدة جمل SQL)
  const connectionConfig = process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "qayrawan_club",
      };

  const connection = await mysql.createConnection(
    typeof connectionConfig === "string"
      ? connectionConfig + (connectionConfig.includes("?") ? "&" : "?") + "multipleStatements=true"
      : { ...connectionConfig, multipleStatements: true }
  );

  try {
    console.log("⏳ إنشاء الجداول من schema.sql ...");
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await connection.query(schemaSql);
    console.log("✅ تم إنشاء الجداول بنجاح");

    console.log("⏳ إدخال المجموعات ...");
    const groupIdByName = {};
    for (const { name, category } of GROUPS_WITH_CATEGORY) {
      // INSERT ... ON DUPLICATE KEY UPDATE هو معادل ON CONFLICT في MySQL
      await connection.query(
        "INSERT INTO `groups` (name, category) VALUES (?, ?) ON DUPLICATE KEY UPDATE category = VALUES(category)",
        [name, category]
      );
      const [rows] = await connection.query("SELECT id FROM `groups` WHERE name = ?", [name]);
      groupIdByName[name] = rows[0].id;
    }
    console.log("✅ تمت إضافة المجموعات");

    // الجلسات التسع تُدرَج تلقائياً ضمن schema.sql (لا حاجة لجلبها هنا بعد إزالة حضور البذر العشوائي)

    console.log("⏳ إدخال الطلاب وبياناتهم ...");
    let barcodeCounter = 1;

    // متطلبا الأسبوع الأول (بيانات تجريبية: كل طالب يُنجز متطلبي الأسبوع الأول فقط)
    const [week1Tasks] = await connection.query(
      "SELECT id, points FROM weekly_self_tasks WHERE week_number = 1 ORDER BY id"
    );

    for (let idx = 0; idx < SAMPLE_NAMES.length; idx++) {
      const name = SAMPLE_NAMES[idx];
      const groupName = GROUP_NAMES[idx % GROUP_NAMES.length];
      const groupId = groupIdByName[groupName];
      const barcode = generateBarcodeId(barcodeCounter++);

      const knowledgePoints = week1Tasks.reduce((sum, t) => sum + t.points, 0); // يطابق إنجاز متطلبي الأسبوع الأول
      const guardianPhone = "05" + Math.floor(10000000 + Math.random() * 89999999);

      // mysql2 يرجع [rows, fields] دائماً، والـ insertId يوصلنا له عبر rows.insertId
      const [studentResult] = await connection.query(
        `INSERT INTO students (barcode, name, name_normalized, group_id, knowledge_points, guardian_phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [barcode, name, normalizeArabic(name), groupId, knowledgePoints, guardianPhone]
      );
      const studentId = studentResult.insertId;

      // إنجاز الذاتي: نؤكد إنجاز متطلبي الأسبوع الأول فقط كبيانات تجريبية
      for (const task of week1Tasks) {
        await connection.query(
          "INSERT INTO self_achievements (student_id, task_id, points) VALUES (?, ?, ?)",
          [studentId, task.id, task.points]
        );
      }

      // لا حضور مبدئياً — يُسجَّل فقط عند مسح الباركود الفعلي أو الإدخال اليدوي
      // من لوحة المشرف، أو تلقائياً كـ"غايب" بعد انتهاء يوم الجلسة دون تسجيل

      // مبادرات تجريبية لأول 5 طلاب فقط
      if (idx < 5) {
        const category = INITIATIVE_CATEGORIES[idx % INITIATIVE_CATEGORIES.length];
        await connection.query(
          "INSERT INTO initiatives (student_id, category, points) VALUES (?, ?, ?)",
          [studentId, category, Math.floor(Math.random() * 10) + 5]
        );
      }
    }

    console.log(`✅ تمت إضافة ${SAMPLE_NAMES.length} طالباً ببياناتهم الكاملة`);
    console.log("🎉 تمت تهيئة قاعدة البيانات بنجاح");
  } catch (err) {
    console.error("❌ حدث خطأ أثناء التهيئة:", err);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
