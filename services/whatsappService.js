/* =========================================================
   services/whatsappService.js
   إرسال رسائل واتساب فعلية عبر Meta WhatsApp Cloud API الرسمي
   يتطلب متغيرات البيئة التالية (راجع .env.example):
     WHATSAPP_ACCESS_TOKEN   - رمز الوصول الدائم من Meta for Developers
     WHATSAPP_PHONE_NUMBER_ID - معرّف الرقم المسجَّل (0573568216) في WhatsApp Cloud API
     WHATSAPP_TEMPLATE_NAME  - اسم القالب المعتمَد من Meta (مثال: weekly_reminder)
     WHATSAPP_TEMPLATE_LANG  - رمز لغة القالب (مثال: ar)
   ========================================================= */

const GRAPH_API_VERSION = "v20.0";

function isConfigured() {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_NAME);
}

/**
 * يرسل رسالة تذكير باستخدام قالب معتمَد مسبقاً من Meta.
 * المعاملات (params) يجب أن تطابق ترتيب المتغيرات {{1}} {{2}} ... في نص القالب المعتمَد بالضبط.
 * @param {string} phone - رقم سعودي بصيغة 05xxxxxxxx
 * @param {string[]} params - قيم المتغيرات بالترتيب داخل القالب
 */
async function sendTemplateMessage(phone, params) {
  if (!isConfigured()) {
    return { success: false, error: "لم يتم ضبط بيانات اتصال WhatsApp Business API بعد (راجع متغيرات البيئة)" };
  }

  const intlPhone = "966" + phone.replace(/^0/, "");
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: intlPhone,
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "ar" },
      components: [
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text: String(text) })),
        },
      ],
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message || "فشل إرسال الرسالة عبر واتساب";
      return { success: false, error: message };
    }
    return { success: true, messageId: data?.messages?.[0]?.id || null };
  } catch (err) {
    return { success: false, error: "تعذر الاتصال بخادم واتساب: " + err.message };
  }
}

module.exports = { isConfigured, sendTemplateMessage };
