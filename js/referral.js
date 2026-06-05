// ============================================================
//  js/referral.js — bee platform
//  نظام الإحالة — كود خاص لكل مستخدم
// ============================================================

const REFERRAL_BONUS_INVITER = 100; // كوينز للمحيل
const REFERRAL_BONUS_INVITED = 50;  // كوينز للمدعو

// ===== توليد كود الإحالة =====
function generateReferralCode(uid) {
  // كود مبني على الـUID — ٦ أحرف كبيرة وأرقام
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BEE';
  for (let i = 0; i < 4; i++) {
    const hash = uid.charCodeAt(i * 2 % uid.length) + uid.charCodeAt((i * 3 + 1) % uid.length);
    code += chars[hash % chars.length];
  }
  return code;
}

// ===== عرض صفحة الإحالة =====
function openReferral() {
  const modal   = document.getElementById('profile-modal');
  const content = document.getElementById('profile-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';
  content.innerHTML = '<div style="text-align:center;color:#888;padding:20px">جاري التحميل...</div>';

  const user = auth.currentUser; if (!user) return;
  const myCode = generateReferralCode(user.uid);

  db.ref('referrals/' + user.uid).once('value', snap => {
    const data    = snap.val() || {};
    const invited = data.invited || [];
    const earned  = data.totalEarned || 0;

    content.innerHTML = `
      <div style="text-align:right">
        <h3 style="margin:0 0 14px;color:#f0c040;font-size:15px">🎁 نظام الإحالة</h3>

        <!-- كودك -->
        <div style="background:linear-gradient(135deg,rgba(200,169,64,.15),rgba(200,169,64,.08));
          border:1px solid rgba(200,169,64,.35);border-radius:16px;padding:16px;
          text-align:center;margin-bottom:14px">
          <div style="font-size:11px;color:#888;margin-bottom:8px">كود الإحالة الخاص بك</div>
          <div style="font-size:26px;font-weight:900;color:#f0c040;letter-spacing:4px;
            font-family:monospace;margin-bottom:12px">${myCode}</div>
          <div style="display:flex;gap:8px;justify-content:center">
            <button onclick="copyReferralCode('${myCode}')"
              style="padding:8px 20px;background:linear-gradient(135deg,#c8a940,#f0c040);
                color:#1a0e00;border:none;border-radius:10px;font-weight:900;
                cursor:pointer;font-family:inherit;font-size:12px">
              📋 نسخ الكود
            </button>
            <button onclick="shareReferral('${myCode}')"
              style="padding:8px 16px;background:rgba(200,169,64,.15);color:#c8a940;
                border:1px solid rgba(200,169,64,.3);border-radius:10px;font-weight:700;
                cursor:pointer;font-family:inherit;font-size:12px">
              📤 مشاركة
            </button>
          </div>
        </div>

        <!-- الإحصائيات -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
            border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:900;color:#2ed573">${invited.length}</div>
            <div style="font-size:10px;color:#888;margin-top:3px">مستخدم مدعو</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
            border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:900;color:#fbbf24">🪙 ${earned}</div>
            <div style="font-size:10px;color:#888;margin-top:3px">كوينز مكتسبة</div>
          </div>
        </div>

        <!-- كيف يعمل -->
        <div style="background:rgba(255,255,255,.03);border-radius:12px;padding:12px;margin-bottom:14px">
          <div style="font-size:11px;color:#888;margin-bottom:8px;font-weight:700">كيف يعمل؟</div>
          ${[
            ['1', 'شارك كودك مع أصدقائك'],
            ['2', 'يدخلون الكود عند التسجيل'],
            ['3', `أنت تحصل على 🪙 ${REFERRAL_BONUS_INVITER} وهم يحصلون على 🪙 ${REFERRAL_BONUS_INVITED}`],
          ].map(([n, t]) => `
            <div style="display:flex;align-items:center;gap:10px;padding:5px 0;
              border-bottom:1px solid rgba(255,255,255,.04)">
              <div style="width:22px;height:22px;border-radius:50%;background:rgba(200,169,64,.2);
                color:#c8a940;font-size:11px;font-weight:900;display:flex;
                align-items:center;justify-content:center;flex-shrink:0">${n}</div>
              <div style="font-size:12px;color:#b0a0d0">${t}</div>
            </div>`).join('')}
        </div>

        <!-- قائمة المدعوين -->
        ${invited.length ? `
          <div style="font-size:11px;color:#888;margin-bottom:8px">المستخدمون الذين دعوتهم</div>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${invited.slice(-5).reverse().map(inv => `
              <div style="display:flex;align-items:center;gap:8px;padding:8px;
                background:rgba(46,213,115,.05);border:1px solid rgba(46,213,115,.15);
                border-radius:10px;font-size:12px">
                <span style="color:#2ed573">✓</span>
                <span style="color:#f0e8d0">${escapeHTML(inv.username || 'مستخدم')}</span>
                <span style="color:#555;font-size:10px;margin-right:auto">
                  +${REFERRAL_BONUS_INVITER} 🪙
                </span>
              </div>`).join('')}
          </div>
        ` : ''}

        <!-- إدخال كود الإحالة -->
        ${!data.usedCode ? `
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)">
            <div style="font-size:11px;color:#888;margin-bottom:8px">هل دعاك أحد؟ أدخل كوده</div>
            <div style="display:flex;gap:8px">
              <input type="text" id="ref-code-input" placeholder="BEE..."
                class="input-field" style="flex:1;font-size:13px;text-transform:uppercase;letter-spacing:2px">
              <button onclick="useReferralCode()"
                style="padding:0 16px;background:#2ed573;color:black;border:none;
                  border-radius:8px;font-weight:900;cursor:pointer;font-family:inherit">
                تطبيق
              </button>
            </div>
          </div>` : `
          <div style="margin-top:12px;font-size:11px;color:#2ed573;text-align:center">
            ✅ استخدمت كود إحالة بالفعل
          </div>`}
      </div>`;
  });
}

// ===== نسخ الكود =====
function copyReferralCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      if (typeof showToast === 'function') showToast('✅ تم نسخ الكود: ' + code);
    });
  } else {
    const el = document.createElement('input');
    el.value = code; document.body.appendChild(el);
    el.select(); document.execCommand('copy');
    document.body.removeChild(el);
    if (typeof showToast === 'function') showToast('✅ تم نسخ الكود: ' + code);
  }
}

// ===== مشاركة الكود =====
function shareReferral(code) {
  const text = `🐝 انضم إلى منصة bee للألعاب!\nاستخدم كود الإحالة: ${code}\nوحصلنا على مكافأة مجانية 🪙`;
  if (navigator.share) {
    navigator.share({ title: 'bee 🐝', text });
  } else {
    copyReferralCode(code);
    if (typeof showToast === 'function') showToast('📋 تم نسخ رابط المشاركة');
  }
}

// ===== استخدام كود الإحالة =====
function useReferralCode() {
  const user = auth.currentUser; if (!user) return;
  const input = document.getElementById('ref-code-input');
  const code  = (input?.value || '').trim().toUpperCase();

  if (!code || code.length < 7) { alert('كود غير صحيح'); return; }
  if (!code.startsWith('BEE')) { alert('كود غير صحيح — يجب أن يبدأ بـ BEE'); return; }

  const myCode = generateReferralCode(user.uid);
  if (code === myCode) { alert('لا يمكنك استخدام كودك الخاص! 😄'); return; }

  // Check if already used
  db.ref('referrals/' + user.uid + '/usedCode').once('value', snap => {
    if (snap.val()) { alert('استخدمت كود إحالة بالفعل!'); return; }

    // Find owner of this code
    db.ref('users').once('value', snap => {
      let ownerUid = null;
      snap.forEach(s => {
        if (generateReferralCode(s.key) === code) { ownerUid = s.key; }
      });

      if (!ownerUid) { alert('الكود غير صحيح أو منتهي!'); return; }
      if (ownerUid === user.uid) { alert('لا يمكنك استخدام كودك الخاص!'); return; }

      // Give invited user their bonus
      db.ref('users/' + user.uid + '/coins').transaction(c => (c || 0) + REFERRAL_BONUS_INVITED);
      db.ref('referrals/' + user.uid).update({ usedCode: code, usedFrom: ownerUid });

      // Give inviter their bonus + record
      db.ref('users/' + ownerUid + '/coins').transaction(c => (c || 0) + REFERRAL_BONUS_INVITER);
      db.ref('referrals/' + ownerUid + '/totalEarned').transaction(n => (n || 0) + REFERRAL_BONUS_INVITER);
      db.ref('referrals/' + ownerUid + '/invited').once('value', iSnap => {
        const list = iSnap.val() || [];
        list.push({ username: currentUsername, uid: user.uid, time: Date.now() });
        db.ref('referrals/' + ownerUid + '/invited').set(list);
      });

      // Notify both
      if (typeof sendNotification === 'function') {
        sendNotification(user.uid,    'system', '🎁 مكافأة إحالة!', `حصلت على ${REFERRAL_BONUS_INVITED} 🪙 مكافأة ترحيب!`);
        sendNotification(ownerUid,    'system', '🎁 إحالة ناجحة!',  `${currentUsername} انضم بكودك! +${REFERRAL_BONUS_INVITER} 🪙`);
      }

      alert(`🎉 تم! حصلت على ${REFERRAL_BONUS_INVITED} 🪙 مكافأة ترحيب!`);
      openReferral();
    });
  });
}

// ===== تطبيق كود إحالة عند التسجيل =====
function applyReferralOnRegister(newUid, newUsername, referralCode) {
  if (!referralCode) return;
  const code = referralCode.toUpperCase().trim();

  db.ref('users').once('value', snap => {
    let ownerUid = null;
    snap.forEach(s => {
      if (s.key !== newUid && generateReferralCode(s.key) === code) ownerUid = s.key;
    });
    if (!ownerUid) return;

    db.ref('users/' + newUid + '/coins').transaction(c => (c || 0) + REFERRAL_BONUS_INVITED);
    db.ref('referrals/' + newUid).update({ usedCode: code });
    db.ref('users/' + ownerUid + '/coins').transaction(c => (c || 0) + REFERRAL_BONUS_INVITER);
    db.ref('referrals/' + ownerUid + '/totalEarned').transaction(n => (n || 0) + REFERRAL_BONUS_INVITER);
    db.ref('referrals/' + ownerUid + '/invited').once('value', iSnap => {
      const list = iSnap.val() || [];
      list.push({ username: newUsername, uid: newUid, time: Date.now() });
      db.ref('referrals/' + ownerUid + '/invited').set(list);
    });
  });
}
