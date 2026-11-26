// ============================================================
//  js/update.js — bee platform
//  نظام إشعار التحديث الداخلي
// ============================================================

const APP_VERSION = '1.0.3'; // ← غيّر هذا الرقم مع كل إصدار جديد

// ===== فحص التحديث عند فتح التطبيق =====
function checkForUpdate() {
  db.ref('settings/update').once('value', snap => {
    const data = snap.val();
    if (!data || !data.active) return;

    const minVersion = data.minVersion || '0.0.0';
    const isOutdated = compareVersions(APP_VERSION, minVersion) < 0;
    const isForced   = data.forced === true;

    // أظهر الإشعار لو النسخة قديمة
    if (isOutdated || isForced) {
      showUpdateModal({
        title:   data.title   || '🔄 تحديث جديد متاح',
        message: data.message || 'يتوفر تحديث جديد للتطبيق. يرجى التحديث للاستمرار.',
        version: data.minVersion || '',
        url:     data.url     || '',
        forced:  isForced,
      });
    }
  });
}

// ===== مقارنة الإصدارات (1.0.0 vs 1.0.1) =====
function compareVersions(v1, v2) {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i]||0) < (b[i]||0)) return -1;
    if ((a[i]||0) > (b[i]||0)) return 1;
  }
  return 0;
}

// ===== إظهار نافذة التحديث =====
function showUpdateModal({ title, message, version, url, forced }) {
  document.getElementById('update-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'update-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,${forced ? '0.97' : '0.85'});
    backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;
    font-family:inherit;direction:rtl;
  `;

  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#0d0d20,#12122e);
      border:1px solid rgba(200,169,64,.4);border-radius:24px;
      padding:28px 22px;width:min(320px,88vw);text-align:center;
      box-shadow:0 0 60px rgba(200,169,64,.15)">

      <!-- أيقونة -->
      <div style="font-size:56px;margin-bottom:12px;
        filter:drop-shadow(0 0 20px rgba(200,169,64,.5))">🚀</div>

      <!-- العنوان -->
      <div style="font-size:1.2rem;font-weight:900;color:#f0c040;margin-bottom:8px">
        ${escapeHTML(title)}
      </div>

      <!-- الإصدار -->
      ${version ? `
        <div style="display:inline-block;background:rgba(200,169,64,.15);
          border:1px solid rgba(200,169,64,.3);border-radius:20px;
          padding:3px 14px;font-size:.75rem;color:#c8a940;margin-bottom:12px">
          الإصدار ${version}
        </div>` : ''}

      <!-- الرسالة -->
      <div style="font-size:.85rem;color:rgba(255,255,255,.6);
        line-height:1.6;margin-bottom:20px">
        ${escapeHTML(message)}
      </div>

      <!-- زر التحديث -->
      ${url ? `
        <button onclick="window.open('${url}','_blank')"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#a07810,#f0c040);
            color:#1a0e00;border:none;border-radius:14px;font-weight:900;
            font-size:.95rem;cursor:pointer;font-family:inherit;margin-bottom:8px">
          📲 تحديث الآن
        </button>` : ''}

      <!-- زر لاحقاً (مخفي إذا إجباري) -->
      ${!forced ? `
        <button onclick="document.getElementById('update-modal').remove()"
          style="width:100%;padding:10px;background:rgba(255,255,255,.06);
            color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.1);
            border-radius:12px;font-size:.82rem;cursor:pointer;font-family:inherit">
          لاحقاً
        </button>` : `
        <div style="font-size:.7rem;color:rgba(255,255,255,.25);margin-top:8px">
          التحديث مطلوب للاستمرار
        </div>`}
    </div>`;

  // التحديث الإجباري: إغلاق التطبيق إذا ضغط خارج النافذة لا يعمل
  if (!forced) {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  document.body.appendChild(modal);
}
// ملاحظة: escapeHTML تستخدم النسخة المعرّفة بـ config.js (تشفّر أيضاً علامة
// الاقتباس المفردة ' — ضرورية لمنع XSS). كانت هنا نسخة مكررة أضعف، حُذفت.