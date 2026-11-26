// ═══════════════════════════════════════════════
//  table-layout.js — نظام مواقع جلوس اللاعبين حول الطاولة
//  ترتيب جواكر الكلاسيكي: لاعب قبالتك، وحد يسارك، وحد يمينك
//  قابل لإعادة الاستخدام بكل الألعاب (المليون، وغيرها)
//
//  ملاحظة: هذا الملف يحتوي المنطق فقط (مواقع + دوال رسم الهيكل).
//  تنسيق الألوان (CSS) يبقى بكل لعبة لحالها لأن كل لعبة عندها
//  هوية بصرية مختلفة — بس لازم كل لعبة تعرّف نفس أسماء الكلاسات:
//  .seat / .oav / .oav-empty / .npill / .bal-badge / .nbadge / .tring
// ═══════════════════════════════════════════════

const TABLE_LAYOUT_POSITIONS = [
  {left:50, top:8},   // 1 قبالتك (فوق المنتصف)
  {left:8,  top:45},  // 2 يسارك
  {left:92, top:45},  // 3 يمينك
  {left:25, top:10},  // 4 فوق-يسار
  {left:75, top:10},  // 5 فوق-يمين
  {left:8,  top:72},  // 6 يسار-تحت
  {left:92, top:72},  // 7 يمين-تحت
  {left:50, top:6},   // 8 فوق (أعلى أكثر)
  {left:35, top:8},   // 9
  {left:65, top:8},   // 10
];

function tlEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

// محتوى الأفتار: صورة حقيقية لو اللاعب رافعها (p.photoURL)، وإلا الإيموجي العادي
function tlAvatarInner(p) {
  if (p && p.photoURL) {
    return `<img src="${tlEsc(p.photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  }
  return `<span>${tlEsc(p && p.avatar) || '😊'}</span>`;
}

// ── رسم مقاعد اللاعبين الفعليين (داخل اللعبة) ──
// containerEl: العنصر اللي تنرسم بداخله المقاعد (مثل #oppSeats)
// players: مصفوفة كل اللاعبين (بما فيهم أنت)
// myId: آيدي اللاعب الحالي (يُستثنى من الرسم لأنه له شريطه الخاص بالأسفل)
// opts: { showBalance:true/false, showCards:true/false }
function renderTableSeats(containerEl, players, myId, opts = {}) {
  if (!containerEl) return;
  const opps = players.filter(p => p.id !== myId);
  if (!opps.length) { containerEl.innerHTML = ''; return; }

  let html = '';
  opps.forEach((p, i) => {
    const pos = TABLE_LAYOUT_POSITIONS[i] || TABLE_LAYOUT_POSITIONS[TABLE_LAYOUT_POSITIONS.length - 1];
    const pid = tlEsc(p.id);
    html += `
      <div class="seat" id="seat_${pid}" style="left:${pos.left}%;top:${pos.top}%;transform:translate(-50%,-50%)">
        <div class="oav" id="av_${pid}">
          <div class="tring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29"/></svg></div>
          ${tlAvatarInner(p)}
        </div>
        <div class="npill" id="np_${pid}">${tlEsc(p.name)}</div>
        ${opts.showBalance !== false ? `<div class="bal-badge" id="bal_${pid}">${(p.bal || 0).toLocaleString('ar-SA')}</div>` : ''}
        <div class="nbadge" id="nb_${pid}" style="display:none"></div>
        ${opts.showCards ? `<div class="opp-cards"><div class="opp-card"></div><div class="opp-card"></div><div class="opp-card"></div><div class="opp-card"></div></div>` : ''}
      </div>`;
  });
  containerEl.innerHTML = html;
}

// ── رسم مقاعد ما قبل اللعبة (بانتظار اللاعبين) — فاضي أو فيه لاعب حقيقي ──
// totalSeats: العدد الكلي للمقاعد المطلوب (يشمل أنت)
// joinedPlayers: مين انضم فعلياً لين الحين (يشمل أنت)
function renderTablePlaceholders(containerEl, totalSeats, joinedPlayers, myId) {
  if (!containerEl) return;
  const others = joinedPlayers.filter(p => p.id && p.id !== myId);
  const slots = Math.max(totalSeats - 1, 0);
  if (!slots) { containerEl.innerHTML = ''; return; }

  let html = '';
  for (let i = 0; i < slots; i++) {
    const pos = TABLE_LAYOUT_POSITIONS[i] || TABLE_LAYOUT_POSITIONS[TABLE_LAYOUT_POSITIONS.length - 1];
    const p = others[i];
    if (p) {
      const pid = tlEsc(p.id);
      html += `
        <div class="seat" id="seat_${pid}" style="left:${pos.left}%;top:${pos.top}%;transform:translate(-50%,-50%)">
          <div class="oav" id="av_${pid}">${tlAvatarInner(p)}</div>
          <div class="npill" id="np_${pid}">${tlEsc(p.name)}</div>
        </div>`;
    } else {
      html += `
        <div class="seat" style="left:${pos.left}%;top:${pos.top}%;transform:translate(-50%,-50%)">
          <div class="oav-empty">🖥️</div>
          <div class="npill" style="opacity:.5">مقعد فارغ</div>
        </div>`;
    }
  }
  containerEl.innerHTML = html;
}

// ── هيكل الفريم المزخرف (اختياري) — لو لعبة تبي تستخدم نفس فريم المليون ──
function buildOrnateFrameHTML(innerContentHTML, idPrefix = '') {
  return `
    <div class="ornate-frame" id="${idPrefix}ornateFrame">
      <div class="gem-accent gem-top">◆</div>
      <div class="ornate-inner" id="${idPrefix}ornateInner">${innerContentHTML}</div>
      <div class="gem-accent gem-bottom">◆</div>
    </div>`;
}
