// ================================================================
// 🌟 particles.js — ذرات ذهبية متحركة لتطبيق bee
// Pure Canvas — بدون مكتبات — خفيف ومحسّن للموبايل
// ================================================================

const ParticleSystem = (() => {

  let canvas, ctx, particles = [], raf, running = false;

  // ── الإعدادات ────────────────────────────────────────────────
  const CFG = {
    count:    28,         // عدد الذرات (خفيف للموبايل)
    minR:     0.6,        // أصغر حجم
    maxR:     2.8,        // أكبر حجم
    minSpeed: 0.18,       // أبطأ سرعة
    maxSpeed: 0.55,       // أسرع سرعة
    drift:    0.25,       // تمايل أفقي
    colors:   [           // ألوان ذهبية متدرجة
      'rgba(200,169,64,',
      'rgba(240,192,64,',
      'rgba(255,215,80,',
      'rgba(180,140,40,'
    ]
  };

  // ── إنشاء ذرة ────────────────────────────────────────────────
  const make = (randomY = false) => ({
    x:      Math.random() * (canvas?.width  ?? window.innerWidth),
    y:      randomY
              ? Math.random() * (canvas?.height ?? window.innerHeight)
              : (canvas?.height ?? window.innerHeight) + 15,
    r:      Math.random() * (CFG.maxR - CFG.minR) + CFG.minR,
    speed:  Math.random() * (CFG.maxSpeed - CFG.minSpeed) + CFG.minSpeed,
    drift:  (Math.random() - 0.5) * CFG.drift,
    color:  CFG.colors[Math.floor(Math.random() * CFG.colors.length)],
    opBase: Math.random() * 0.42 + 0.12,   // شفافية أساسية
    phase:  Math.random() * Math.PI * 2    // للـ pulse
  });

  // ── resize ───────────────────────────────────────────────────
  const resize = () => {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  // ── حلقة الرسم ───────────────────────────────────────────────
  const loop = () => {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, i) => {
      p.phase += 0.018;
      p.y     -= p.speed;
      p.x     += p.drift;

      // pulse الشفافية — تتلألأ
      const alpha = p.opBase * (0.55 + 0.45 * Math.sin(p.phase));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha.toFixed(2) + ')';
      ctx.fill();

      // إعادة الذرة من الأسفل حين تخرج من الأعلى
      if (p.y < -10) particles[i] = make();
    });

    raf = requestAnimationFrame(loop);
  };

  // ── تهيئة ────────────────────────────────────────────────────
  const init = () => {
    if (canvas) return; // لا تهيّئ مرتين

    canvas = document.createElement('canvas');
    canvas.id = 'bee-particles';
    canvas.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'pointer-events:none',
      'z-index:0'
    ].join(';');

    // أضفه أول شيء في body — يكون خلف كل شيء
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // توزيع ابتدائي عشوائي
    for (let i = 0; i < CFG.count; i++) particles.push(make(true));

    running = true;
    loop();
  };

  // ── إيقاف / استئناف (للحفاظ على البطارية) ───────────────────
  const pause  = () => { running = false; cancelAnimationFrame(raf); };
  const resume = () => { if (!running) { running = true; loop(); } };

  // إيقاف تلقائي حين يختفي التطبيق
  document.addEventListener('visibilitychange', () =>
    document.hidden ? pause() : resume()
  );

  return { init, pause, resume };

})();

document.addEventListener('DOMContentLoaded', () => ParticleSystem.init());
window.ParticleSystem = ParticleSystem;
