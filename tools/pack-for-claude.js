// tools/pack-for-claude.js
// يجهّز ملف ZIP آمن من مشروعك عشان ترسله لـ Claude:
//  - يستثني الثقيل (node_modules, www, android) والسري (مفاتيح .jks و .env)
//  - يفحص الملفات عن أسرار، وأي ملف فيه سر ما ينحط في الـ ZIP ويطلع لك تحذير
//  - يضيف GIT-INFO.txt (حالة git بدون أي توكن)
// التشغيل: دبل كليك على tools/pack-for-claude.bat  (أو: node tools/pack-for-claude.js)
const fs = require('fs'), path = require('path'), zlib = require('zlib'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'kbxk-for-claude.zip');
const SKIP_DIRS = new Set(['node_modules', 'android', 'www', '.git', '.gradle', 'build', 'dist']);
const SKIP_FILE = /\.(jks|keystore|pem|p12|pfx|apk|aab|zip|log)$|^\.env(\..*)?$/i;
const KEEP_EXTRA = ['android/app/src/main/AndroidManifest.xml']; // الملف الوحيد المهم من مجلد android
const TEXT = /\.(js|json|html|css|md|txt|xml|yml|yaml|bat|gitignore)$/i;
const SECRET = [
  ['مفتاح خاص (private key)', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['توكن GitHub', /gh[pousr]_[A-Za-z0-9]{20,}/],
  ['مفتاح AWS', /AKIA[0-9A-Z]{16}/],
  ['توكن Slack/Stripe', /(sk_live_|xox[baprs]-)[A-Za-z0-9-]{10,}/],
  ['كلمة سر مكتوبة في الكود', /(password|passwd|secret|private_?key|client_secret)\s*[:=]\s*['"][^'"\s]{4,}['"]/i],
];

const entries = [], skipped = [], blocked = [], info = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name), rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full); continue; }
    if (SKIP_FILE.test(e.name)) { skipped.push(rel); continue; }
    add(rel);
  }
})(ROOT);
for (const x of KEEP_EXTRA) if (fs.existsSync(path.join(ROOT, x))) add(x);

function add(rel) {
  if (entries.some(e => e.rel === rel)) return;
  const data = fs.readFileSync(path.join(ROOT, rel));
  if (data.length > 5 * 1024 * 1024) { skipped.push(rel + ' (أكبر من 5MB)'); return; }
  if (TEXT.test(rel)) {
    const t = data.toString('utf8');
    for (const [name, re] of SECRET) {
      const m = re.exec(t);
      if (m) { blocked.push(rel + '  ←  ' + name + ' (سطر ' + t.slice(0, m.index).split('\n').length + ')'); return; }
    }
    if (/AIza[0-9A-Za-z_-]{30,}/.test(t)) info.push(rel);
  }
  entries.push({ rel, data });
}

// حالة git (نخفي أي توكن داخل الروابط)
try {
  const g = c => cp.execSync(c, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).replace(/(https?:\/\/)[^\/@\s]+@/g, '$1***@');
  const txt = ['== remotes ==', g('git remote -v'), '== branches ==', g('git branch -a -vv'),
    '== آخر 8 commits ==', g('git log -8 --format="%h %ad %s" --date=short'), '== status ==', g('git status --short')].join('\n');
  entries.push({ rel: 'GIT-INFO.txt', data: Buffer.from(txt, 'utf8') });
} catch (e) { /* git غير موجود: عادي */ }

// ===== كتابة ZIP بدون أي مكتبة =====
const TABLE = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const d = new Date(), TIME = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), DATE = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
const parts = [], central = []; let offset = 0;
for (const { rel, data } of entries) {
  const comp = zlib.deflateRawSync(data), useDef = comp.length < data.length, body = useDef ? comp : data, method = useDef ? 8 : 0;
  const name = Buffer.from(rel, 'utf8'), crc = crc32(data);
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8);
  lh.writeUInt16LE(TIME, 10); lh.writeUInt16LE(DATE, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18);
  lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
  parts.push(lh, name, body);
  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10);
  ch.writeUInt16LE(TIME, 12); ch.writeUInt16LE(DATE, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(body.length, 20);
  ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(offset, 42);
  central.push(ch, name);
  offset += 30 + name.length + body.length;
}
const cd = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
fs.writeFileSync(OUT, Buffer.concat([...parts, cd, end]));

// ===== التقرير =====
console.log('\n✅ جاهز! الملف: ' + OUT);
console.log('   ' + entries.length + ' ملف، الحجم ' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB\n');
if (blocked.length) { console.log('⚠️  استبعدت هذي الملفات لأن فيها أسرار (ما راحت في الـ ZIP):'); blocked.forEach(x => console.log('   - ' + x)); console.log('   شيل السر منها (أو انقله لمتغيّر بيئة) قبل ما تعيد التشغيل.\n'); }
if (skipped.length) console.log('🔒 استبعدت (سري أو ثقيل): ' + skipped.join(' ، ') + '\n');
if (info.length) console.log('ℹ️  فيه مفتاح Firebase للويب في: ' + info.join(' ، ') + ' — هذا عام بطبيعته وعادي.\n');
console.log('الخطوة الجاية: ارفع الملف kbxk-for-claude.zip في محادثة Claude (من الكمبيوتر).');
if (process.platform === 'win32') try { cp.spawn('explorer', ['/select,"' + OUT + '"'], { detached: true, stdio: 'ignore', windowsVerbatimArguments: true }).unref(); } catch (e) {}
