// ============================================================
//  js/avatar-render.js — bee platform
//  دالة موحّدة لعرض صورة/أفتار أي لاعب — تستخدمها كل الملفات
//  (الشات، المتصدرين، البروفايل، طاولات الألعاب...) بدل تكرار
//  نفس كود "لو فيه صورة اعرضها، وإلا اعرض دائرة بحرف الاسم" بكل ملف
//
//  الحقل الموحّد بقاعدة البيانات: photoURL (تحت users/{uid}/photoURL)
// ============================================================

// لون افتراضي لو getAvatarColor الأصلية غير متوفرة بهذي الصفحة
// (مثلاً صفحة لعبة مستقلة ما تحمّل utils.js) — يحافظ على نفس درجة الألوان تقريباً
function _avatarColorFallback(name) {
  const colors = ['#7c3aed','#a855f7','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}

// يرجع HTML جاهز لعرض الأفتار: صورة حقيقية لو موجودة، وإلا دائرة بحرف الاسم
// user: أي كائن فيه { username أو name, photoURL }
// size: القطر بالبكسل (افتراضي 38)
// extraStyle: أي ستايل إضافي تبي تضيفه (مثل border خاص)
function renderAvatarHTML(user, size, extraStyle) {
  size = size || 38;
  extraStyle = extraStyle || '';
  const name = (user && (user.username || user.name || user.sender)) || '؟';
  const photoURL = user && user.photoURL;

  if (photoURL) {
    return `<img src="${photoURL}" style="width:${size}px;height:${size}px;border-radius:50%;
      object-fit:cover;flex-shrink:0;${extraStyle}">`;
  }

  const color = (typeof getAvatarColor === 'function') ? getAvatarColor(name) : _avatarColorFallback(name);
  const fontSize = Math.round(size * 0.42);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
    display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:900;
    color:white;flex-shrink:0;${extraStyle}">${String(name).charAt(0).toUpperCase()}</div>`;
}

// نفس الفكرة بس يرجع فقط "محتوى الدائرة" (بدون تحديد width/height/border-radius)
// مفيد لو عندك container جاهز بأبعاده الخاصة وتبي تعبّيه بس (صورة أو حرف)
function renderAvatarInnerHTML(user) {
  const name = (user && (user.username || user.name || user.sender)) || '؟';
  const photoURL = user && user.photoURL;
  if (photoURL) {
    return `<img src="${photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  }
  return `<span>${String(name).charAt(0).toUpperCase()}</span>`;
}
