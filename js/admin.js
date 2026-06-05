// ============================================================
//  js/admin.js — bee platform
//  لوحة الإدارة الكاملة
// ============================================================

function renderAdminPanelPage() {
  const sec = document.getElementById('admin-panel');
  if (!sec || !isAdmin) return;

  sec.innerHTML = `
    <div style="padding:14px;color:white;max-height:calc(100vh - 70px);overflow-y:auto">
      <h2 style="color:#ff4757;margin-top:0">⚙️ لوحة التحكم</h2>

      <!-- البانر الرئيسي -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #c8a940;padding:14px;margin-bottom:12px">
        <h4 style="margin:0 0 10px;color:#c8a940;font-size:13px">🎯 البانر الرئيسي</h4>
        <input type="text" id="banner-title-input"   placeholder="عنوان البانر..."  class="input-field" style="margin-bottom:8px">
        <input type="text" id="banner-sub-input"     placeholder="النص الثانوي..."  class="input-field" style="margin-bottom:8px">
        <input type="text" id="banner-icon-input"    placeholder="الأيقونة..."      class="input-field" style="margin-bottom:8px">
        <button onclick="adminUpdateBanner()"
          style="width:100%;padding:9px;background:#c8a940;color:black;
            border:none;border-radius:8px;font-weight:bold;cursor:pointer">حفظ البانر</button>
      </div>

      <!-- تحدي الأسبوع -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #f59e0b;padding:14px;margin-bottom:12px">
        <h4 style="margin:0 0 10px;color:#f59e0b;font-size:13px">🏆 تحدي الأسبوع</h4>
        <input type="text" id="challenge-title-input" placeholder="عنوان التحدي..." class="input-field" style="margin-bottom:8px">
        <input type="text" id="challenge-sub-input"   placeholder="تفاصيل التحدي..." class="input-field" style="margin-bottom:8px">
        <button onclick="adminUpdateChallenge()"
          style="width:100%;padding:9px;background:#f59e0b;color:black;
            border:none;border-radius:8px;font-weight:bold;cursor:pointer">حفظ التحدي</button>
      </div>

      <!-- منح كوينز -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #ffd700;padding:14px;margin-bottom:12px">
        <h4 style="margin:0 0 10px;color:#ffd700;font-size:13px">🪙 منح كوينز</h4>
        <input type="text"   id="admin-coins-user"   placeholder="اسم المستخدم (فارغ = لنفسك)..." class="input-field" style="margin-bottom:8px">
        <input type="number" id="admin-coins-amount" placeholder="الكمية..." class="input-field" style="margin-bottom:8px">
        <button onclick="adminGiveCoins()"
          style="width:100%;padding:9px;background:#ffd700;color:black;
            border:none;border-radius:8px;font-weight:bold;cursor:pointer">منح الكوينز</button>
      </div>

      <!-- صلاحيات الإدارة -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #ff4757;padding:14px;margin-bottom:12px">
        <h4 style="margin:0 0 10px;color:#ff4757;font-size:13px">👑 صلاحيات الإدارة</h4>
        <input type="text" id="admin-target-username" placeholder="اسم المستخدم..." class="input-field" style="margin-bottom:8px">
        <div style="display:flex;gap:8px">
          <button onclick="assignAdminStatus(true)"
            style="flex:1;padding:8px;background:#2ed573;color:black;
              border:none;border-radius:8px;font-weight:bold;cursor:pointer">ترقية لمشرف</button>
          <button onclick="assignAdminStatus(false)"
            style="flex:1;padding:8px;background:#ff4757;color:white;
              border:none;border-radius:8px;font-weight:bold;cursor:pointer">سحب الصلاحية</button>
        </div>
      </div>

      <!-- نظام التحديث -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #2ed573;padding:14px;margin-bottom:12px">
        <h4 style="margin:0 0 10px;color:#2ed573;font-size:13px">🚀 إدارة التحديث</h4>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <input type="text"   id="upd-version" placeholder="الإصدار (1.0.1)"  class="input-field">
          <input type="text"   id="upd-url"     placeholder="رابط التنزيل..."  class="input-field">
        </div>
        <input type="text" id="upd-title"   placeholder="عنوان الرسالة..." class="input-field" style="margin-bottom:8px">
        <textarea id="upd-message" rows="2" placeholder="نص رسالة التحديث..." class="input-field" style="margin-bottom:8px;resize:none"></textarea>

        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <input type="checkbox" id="upd-forced" style="width:16px;height:16px;cursor:pointer">
          <label for="upd-forced" style="font-size:12px;color:#aaa;cursor:pointer">
            تحديث إجباري (لا يمكن تخطيه)
          </label>
        </div>

        <div style="display:flex;gap:8px">
          <button onclick="publishUpdate(true)"
            style="flex:1;padding:9px;background:#2ed573;color:black;
              border:none;border-radius:8px;font-weight:bold;cursor:pointer">
            📢 نشر التحديث
          </button>
          <button onclick="publishUpdate(false)"
            style="flex:1;padding:9px;background:rgba(255,71,87,.2);color:#ff4757;
              border:1px solid rgba(255,71,87,.3);border-radius:8px;font-weight:bold;cursor:pointer">
            🛑 إيقاف
          </button>
        </div>
      </div>

      <!-- تعديل كلان -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid var(--accent);padding:14px">
        <h4 style="margin:0 0 10px;color:var(--accent);font-size:13px">⚔️ تعديل اسم كلان</h4>
        <input type="text" id="admin-clan-target"   placeholder="اسم الكلان الحالي..." class="input-field" style="margin-bottom:8px">
        <input type="text" id="admin-clan-new-name" placeholder="الاسم الجديد..."       class="input-field" style="margin-bottom:8px">
        <button onclick="adminModifyClanName()"
          style="width:100%;padding:9px;background:#6c63ff;color:white;
            border:none;border-radius:8px;font-weight:bold;cursor:pointer">تطبيق التغيير</button>
      </div>

      <!-- الإبلاغات -->
      <div style="background:#1a1a28;border-radius:12px;border:1px solid #ff6584;padding:14px;margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h4 style="margin:0;color:#ff6584;font-size:13px">🚩 الإبلاغات</h4>
          <button onclick="loadAdminReports()"
            style="background:rgba(255,101,132,0.15);color:#ff6584;border:1px solid rgba(255,101,132,0.3);
              border-radius:6px;font-size:11px;padding:4px 10px;cursor:pointer">تحديث</button>
        </div>
        <div id="admin-reports-list">
          <div style="text-align:center;color:#555;font-size:12px;padding:12px">
            اضغط تحديث لعرض الإبلاغات
          </div>
        </div>
      </div>

    </div>`;
}

function adminUpdateBanner() {
  const title = document.getElementById('banner-title-input')?.value.trim();
  const sub   = document.getElementById('banner-sub-input')?.value.trim();
  const icon  = document.getElementById('banner-icon-input')?.value.trim();
  if (!title) { alert('أدخل عنوان البانر'); return; }
  db.ref('settings/banner').set({ title, sub: sub || '', icon: icon || '🐝' }, e => {
    if (!e) { alert('تم حفظ البانر ✅'); if (typeof renderHome === 'function') renderHome(); }
  });
}

function adminUpdateChallenge() {
  const title = document.getElementById('challenge-title-input')?.value.trim();
  const sub   = document.getElementById('challenge-sub-input')?.value.trim();
  if (!title) { alert('أدخل عنوان التحدي'); return; }
  db.ref('settings/challenge').set({ title, sub: sub || '' }, e => {
    if (!e) { alert('تم حفظ التحدي ✅'); if (typeof renderHome === 'function') renderHome(); }
  });
}

function adminGiveCoins() {
  const username = document.getElementById('admin-coins-user')?.value.trim();
  const amount   = parseInt(document.getElementById('admin-coins-amount')?.value);
  if (isNaN(amount) || amount <= 0) { alert('أدخل كمية صحيحة'); return; }

  if (!username) {
    const user = auth.currentUser; if (!user) return;
    db.ref('users/' + user.uid + '/coins').transaction(c => (c || 0) + amount,
      (e, ok) => { if (ok) alert(`تم منح ${amount} 🪙 لنفسك!`); });
  } else {
    db.ref('users').orderByChild('username').equalTo(username).once('value', snap => {
      if (!snap.exists()) { alert('المستخدم غير موجود!'); return; }
      const uid = Object.keys(snap.val())[0];
      db.ref('users/' + uid + '/coins').transaction(c => (c || 0) + amount,
        (e, ok) => { if (ok) alert(`تم منح ${amount} 🪙 لـ ${username}!`); });
    });
  }
}

function adminGiveCoinsToUser(uid, username) {
  if (!isAdmin) return;
  const amount = parseInt(prompt(`كم كوينز تريد منح ${username}؟`));
  if (isNaN(amount) || amount <= 0) return;
  db.ref('users/' + uid + '/coins').transaction(c => (c || 0) + amount,
    (e, ok) => {
      if (ok) {
        alert(`تم منح ${amount} 🪙 لـ ${username}!`);
        if (typeof renderLeaderboard === 'function') renderLeaderboard();
      }
    });
}

function assignAdminStatus(status) {
  const name = document.getElementById('admin-target-username')?.value.trim();
  if (!name) return;
  db.ref('users').orderByChild('username').equalTo(name).once('value', snap => {
    if (!snap.exists()) { alert('المستخدم غير موجود!'); return; }
    const uid = Object.keys(snap.val())[0];
    db.ref('users/' + uid + '/isAdmin').set(status, e => {
      if (!e) alert(status ? 'تمت الترقية!' : 'تم سحب الصلاحية!');
    });
  });
}

function adminModifyClanName() {
  const old = document.getElementById('admin-clan-target')?.value.trim();
  const nw  = document.getElementById('admin-clan-new-name')?.value.trim();
  if (!old || !nw) return;
  if (nw.length < 3 || nw.length > 10) { alert('الاسم بين 3 و10 أحرف'); return; }
  db.ref('users').once('value', snap => {
    snap.forEach(child => {
      if (child.val().clan === old) db.ref('users/' + child.key + '/clan').set(nw);
    });
    alert('تم تعديل الكلان لكل الأعضاء!');
  });
}

// ===== لوحة الإبلاغات =====
function loadAdminReports() {
  const list = document.getElementById('admin-reports-list');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;color:#888;font-size:12px;padding:12px">جاري التحميل...</div>';

  db.ref('reports').orderByChild('timestamp').limitToLast(20).once('value', snap => {
    if (!snap.exists()) {
      list.innerHTML = '<div style="text-align:center;color:#555;font-size:12px;padding:12px">لا توجد إبلاغات</div>';
      return;
    }

    const reports = [];
    snap.forEach(child => reports.unshift({ id: child.key, ...child.val() }));

    list.innerHTML = reports.map(r => {
      const date = new Date(r.timestamp).toLocaleDateString('ar');
      const isPending = r.status === 'pending';
      return `
        <div style="background:rgba(255,101,132,0.05);border:1px solid rgba(255,101,132,${isPending?'0.3':'0.1'});
          border-radius:10px;padding:10px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;font-weight:700;color:${isPending?'#ff6584':'#888'}">
              ${isPending ? '🔴 جديد' : '✅ تمت المراجعة'}
            </span>
            <span style="font-size:10px;color:#555">${date}</span>
          </div>
          <div style="font-size:12px;color:#ddd;margin-bottom:3px">
            بلّغ: <strong style="color:#a78bfa">${escapeHTML(r.reportedBy||'')}</strong>
            عن: <strong style="color:#ff6584">${escapeHTML(r.reportedUser||'')}</strong>
          </div>
          <div style="font-size:11px;color:#888;margin-bottom:8px">
            السبب: ${escapeHTML(r.reason||'')}
            ${r.details ? `<br>تفاصيل: ${escapeHTML(r.details)}` : ''}
          </div>
          <div style="display:flex;gap:6px">
            ${isPending ? `
              <button onclick="resolveReport('${r.id}','warn','${escapeHTML(r.reportedUser||'')}')"
                style="flex:1;padding:6px;background:rgba(251,191,36,0.15);color:#fbbf24;
                  border:1px solid rgba(251,191,36,0.3);border-radius:6px;font-size:10px;
                  cursor:pointer;font-family:inherit">
                ⚠️ تحذير
              </button>
              <button onclick="resolveReport('${r.id}','mute','${escapeHTML(r.reportedUser||'')}')"
                style="flex:1;padding:6px;background:rgba(255,71,87,0.15);color:#ff4757;
                  border:1px solid rgba(255,71,87,0.3);border-radius:6px;font-size:10px;
                  cursor:pointer;font-family:inherit">
                🤫 كتم
              </button>
              <button onclick="resolveReport('${r.id}','dismiss','')"
                style="flex:1;padding:6px;background:rgba(255,255,255,0.05);color:#666;
                  border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-size:10px;
                  cursor:pointer;font-family:inherit">
                تجاهل
              </button>` : ''}
          </div>
        </div>`;
    }).join('');
  });
}

function resolveReport(reportId, action, targetUsername) {
  if (action === 'warn') {
    db.ref('users').orderByChild('username').equalTo(targetUsername).once('value', snap => {
      if (snap.exists()) {
        const uid = Object.keys(snap.val())[0];
        db.ref('notifications/' + uid + '/warning').push({
          msg: 'تلقيت تحذيراً من الإدارة بسبب محتوى مخالف.',
          time: Date.now()
        });
      }
    });
  } else if (action === 'mute') {
    db.ref('users').orderByChild('username').equalTo(targetUsername).once('value', snap => {
      if (snap.exists()) {
        const uid = Object.keys(snap.val())[0];
        db.ref('mutes/' + uid).set({
          until: Date.now() + 24 * 60 * 60 * 1000,
          mutedBy: currentUsername, reason: 'إبلاغ مستخدمين'
        });
      }
    });
  }

  db.ref('reports/' + reportId + '/status').set(
    action === 'dismiss' ? 'dismissed' : 'resolved',
    () => {
      if (typeof showToast === 'function') showToast('✅ تم التعامل مع الإبلاغ');
      loadAdminReports();
    }
  );
}


function publishUpdate(active) {
  if (!isAdmin) return;
  if (active) {
    const version = document.getElementById('upd-version')?.value.trim();
    const url     = document.getElementById('upd-url')?.value.trim();
    const title   = document.getElementById('upd-title')?.value.trim();
    const message = document.getElementById('upd-message')?.value.trim();
    const forced  = document.getElementById('upd-forced')?.checked || false;
    if (!version) { alert('أدخل رقم الإصدار'); return; }
    db.ref('settings/update').set({
      active: true, minVersion: version,
      url: url || '', title: title || '🔄 تحديث جديد',
      message: message || 'يتوفر تحديث جديد. يرجى التحديث.',
      forced, publishedAt: Date.now(), publishedBy: currentUsername
    }, err => { if(!err) { if(typeof showToast==='function') showToast('✅ تم نشر التحديث!'); }});
  } else {
    db.ref('settings/update/active').set(false, err => {
      if(!err) { if(typeof showToast==='function') showToast('🛑 تم إيقاف التحديث'); }
    });
  }
}