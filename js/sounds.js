// ================================================================
// 🔊 sounds.js — نظام الأصوات الكامل لتطبيق bee
// Web Audio API — يعمل فوراً بدون ملفات خارجية
// ================================================================

const SoundManager = (() => {

  // ── الإعدادات الافتراضية ─────────────────────────────────────
  let ctx       = null;
  let masterVol = 0.75;
  let isMuted   = false;
  let unlocked  = false; // تتبع تفاعل المستخدم قبل تشغيل الصوت

  // ── إدارة AudioContext (مطلوب للموبايل) ──────────────────────
  const getCtx = () => {
    if (!unlocked) return null; // منع إنشاء المحرك تلقائياً لتفادي حظر ومتصفحات الموبايل

    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[Bee Sounds] Web Audio API غير مدعوم');
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  // دالة فك الحظر الذكي عند أول تفاعل حقيقي
  const unlockEngine = () => {
    unlocked = true;
    ['click', 'touchstart'].forEach(eventName => {
      window.removeEventListener(eventName, unlockEngine);
    });
  };

  // الاستماع لأول تفاعل للمستخدم مع الشاشة
  ['click', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, unlockEngine, { passive: true });
  });
  // ── أداة إنشاء نبضة صوتية (ADSR مبسّط) ──────────────────────
  const tone = (freq, type, vol, start, dur, endFreq = null) => {
    const c = getCtx();
    if (!c || isMuted) return;

    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
    }

    // envelope: attack خفيف + decay
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol * masterVol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  // ── مكتبة الأصوات ─────────────────────────────────────────────
  const sounds = {

    // ── أصوات الواجهة ────────────────────────────────────────────

    click() {
      const t = getCtx()?.currentTime ?? 0;
      tone(900, 'sine',     0.30, t,        0.055);
      tone(600, 'sine',     0.15, t + 0.03, 0.040);
    },

    tap() {
      const t = getCtx()?.currentTime ?? 0;
      tone(550, 'triangle', 0.20, t, 0.050);
    },

    toggle() {
      const t = getCtx()?.currentTime ?? 0;
      tone(700, 'sine', 0.22, t, 0.07, 820);
    },

    pageSwipe() {
      const t = getCtx()?.currentTime ?? 0;
      tone(380, 'sine', 0.15, t, 0.12, 680);
    },

    error() {
      const t = getCtx()?.currentTime ?? 0;
      tone(220, 'sawtooth', 0.40, t,        0.14);
      tone(170, 'sawtooth', 0.30, t + 0.14, 0.18);
    },

    success() {
      const t = getCtx()?.currentTime ?? 0;
      tone(660, 'sine', 0.30, t,      0.10);
      tone(880, 'sine', 0.38, t + 0.1, 0.22);
    },

    // ── أصوات التواصل ────────────────────────────────────────────

    notification() {
      const t = getCtx()?.currentTime ?? 0;
      tone(880,  'sine', 0.40, t,       0.13);
      tone(1100, 'sine', 0.40, t + 0.15, 0.20);
    },

    message() {
      const t = getCtx()?.currentTime ?? 0;
      tone(660, 'sine', 0.32, t,       0.09);
      tone(880, 'sine', 0.32, t + 0.10, 0.13);
    },

    friendRequest() {
      const t = getCtx()?.currentTime ?? 0;
      tone(880,  'sine', 0.32, t,       0.12);
      tone(1100, 'sine', 0.32, t + 0.13, 0.12);
      tone(880,  'sine', 0.28, t + 0.30, 0.18);
    },

    // ── أصوات الألعاب ────────────────────────────────────────────

    gameStart() {
      const t = getCtx()?.currentTime ?? 0;
      tone(150, 'sawtooth', 0.28, t, 0.30, 700);
      tone(880,  'sine', 0.42, t + 0.28, 0.20);
      tone(1100, 'sine', 0.42, t + 0.38, 0.30);
    },

    win() {
      const t = getCtx()?.currentTime ?? 0;
      const melody = [[523,0],[659,0.10],[784,0.20],[1047,0.30],[1319,0.42]];
      melody.forEach(([f, d]) => {
        tone(f,       'sine',     0.52, t + d, 0.38);
        tone(f * 2,   'triangle', 0.18, t + d, 0.25);
      });
    },

    lose() {
      const t = getCtx()?.currentTime ?? 0;
      const melody = [[440,0],[370,0.13],[311,0.27],[220,0.42]];
      melody.forEach(([f, d]) => {
        tone(f, 'sawtooth', 0.32, t + d, 0.22);
      });
    },

    countdown() {
      const t = getCtx()?.currentTime ?? 0;
      tone(440, 'sine', 0.35, t, 0.09);
    },

    countdownFinal() {
      const t = getCtx()?.currentTime ?? 0;
      tone(880,  'sine',     0.50, t,       0.18);
      tone(1100, 'triangle', 0.30, t + 0.12, 0.32);
    },

    cardPlay() {
      const t = getCtx()?.currentTime ?? 0;
      tone(600, 'triangle', 0.22, t,        0.04);
      tone(400, 'triangle', 0.15, t + 0.04, 0.05);
    },

    cardDeal() {
      const t = getCtx()?.currentTime ?? 0;
      for (let i = 0; i < 4; i++) {
        tone(500 + i * 50, 'triangle', 0.18, t + i * 0.07, 0.05);
      }
    },

    // ── أصوات المكافآت ───────────────────────────────────────────

    coins() {
      const t = getCtx()?.currentTime ?? 0;
      for (let i = 0; i < 7; i++) {
        tone(800 + i * 170, 'sine', 0.38, t + i * 0.055, 0.14);
      }
    },

    levelUp() {
      const t = getCtx()?.currentTime ?? 0;
      const scale = [[523,0],[659,0.09],[784,0.18],[1047,0.27],[1319,0.37],[1568,0.47]];
      scale.forEach(([f, d]) => {
        tone(f,     'sine',     0.55, t + d, 0.36);
        tone(f * 2, 'triangle', 0.18, t + d, 0.20);
      });
    },

    achievement() {
      const t = getCtx()?.currentTime ?? 0;
      tone(784,  'sine',     0.42, t,       0.14);
      tone(988,  'sine',     0.42, t + 0.13, 0.14);
      tone(1175, 'sine',     0.50, t + 0.27, 0.40);
      tone(1568, 'triangle', 0.28, t + 0.42, 0.38);
    },

    purchase() {
      const t = getCtx()?.currentTime ?? 0;
      [[523,0],[659,0.08],[784,0.16],[1047,0.25]].forEach(([f, d]) => {
        tone(f, 'sine', 0.42, t + d, 0.16);
      });
    },

    vip() {
      const t = getCtx()?.currentTime ?? 0;
      [[784,0],[988,0.08],[1175,0.16],[1568,0.25],[1976,0.34]].forEach(([f, d]) => {
        tone(f,       'sine',     0.50, t + d, 0.32);
        tone(f * 1.5, 'triangle', 0.18, t + d, 0.22);
      });
    },

    tournament() {
      const t = getCtx()?.currentTime ?? 0;
      [[392,0],[523,0.10],[659,0.20],[784,0.30],[784,0.50],[1047,0.62]].forEach(([f, d]) => {
        tone(f, 'sine',   0.48, t + d, 0.28);
        tone(f, 'square', 0.10, t + d, 0.22);
      });
    },

    appOpen() {
      const t = getCtx()?.currentTime ?? 0;
      tone(440, 'sine', 0.20, t,       0.16);
      tone(550, 'sine', 0.25, t + 0.13, 0.20);
      tone(660, 'sine', 0.30, t + 0.27, 0.38);
    }
  };

  // ── التفعيل التلقائي للأزرار ─────────────────────────────────
  const attachAuto = () => {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-sound]');
      if (el) play(el.dataset.sound);
    }, { passive: true });
  };

  // ── استرجاع الإعدادات المحفوظة ───────────────────────────────
  const loadSettings = () => {
    if (localStorage.getItem('bee_muted') === '1') isMuted = true;
    const vol = parseFloat(localStorage.getItem('bee_vol'));
    if (!isNaN(vol)) masterVol = vol;
  };

  // ── API العام ─────────────────────────────────────────────────

  const play = name => {
    if (isMuted) return;
    if (sounds[name]) {
      try { sounds[name](); }
      catch (e) { console.warn('[Bee Sounds] خطأ:', name, e); }
    } else {
      console.warn('[Bee Sounds] الصوت غير موجود:', name);
    }
  };

  const mute        = ()  => { isMuted = true;  localStorage.setItem('bee_muted', '1'); };
  const unmute      = ()  => { isMuted = false; localStorage.setItem('bee_muted', '0'); };
  const toggleMute  = ()  => isMuted ? unmute() : mute();
  const setVolume   = v  => { masterVol = Math.max(0, Math.min(1, v)); localStorage.setItem('bee_vol', masterVol); };
  const volume      = ()  => masterVol;
  const muted       = ()  => isMuted;

  const init = () => {
    loadSettings();
    attachAuto();
  };

  return { init, play, mute, unmute, toggleMute, setVolume, volume, muted };

})();

// ── تشغيل عند تحميل الصفحة ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => SoundManager.init());
window.Sounds = SoundManager;