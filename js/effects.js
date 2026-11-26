/**
 * effects.js — Phase 2: 3D Visual Effects System
 * bee Platform | GSAP + CSS 3D Transforms
 * ─────────────────────────────────────────────────────────────────
 *
 * Dependencies (add to your HTML before this script):
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>
 *
 * Usage:
 *   import BeeEffects from './effects.js';          // ES Module
 *   // OR (non-module / Capacitor)
 *   // window.BeeEffects is auto-set at the bottom
 *
 *   // Initialize on app boot:
 *   BeeEffects.init();
 *
 *   // Then call per action:
 *   BeeEffects.showModal(modalEl, overlayEl);
 *   BeeEffects.flipCard(cardEl, { onMidpoint: swapFaces });
 *   BeeEffects.winnerCelebration(containerEl);
 *   // etc.
 * ─────────────────────────────────────────────────────────────────
 */

const BeeEffects = (() => {

  // ─────────────────────────────────────────
  // CORE — GSAP reference + custom eases
  // ─────────────────────────────────────────

  const _gsap = () => {
    if (!window.gsap) {
      console.warn('[BeeEffects] ⚠️ GSAP not found. Load GSAP 3.x before effects.js');
      return null;
    }
    return window.gsap;
  };

  function _registerPlugins() {
    const g = _gsap();
    if (!g) return;
    if (window.CustomEase) {
      g.registerPlugin(window.CustomEase);
      window.CustomEase.create('bee.spring',  '0.22, 1.4, 0.36, 1');
      window.CustomEase.create('bee.snap',    '0.08, 0.94, 0.01, 1.04');
    }
    if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
  }

  // Named eases — falls back to built-ins if CustomEase not present
  const E = {
    spring  : 'elastic.out(1, 0.55)',
    bounce  : 'bounce.out',
    back    : 'back.out(2.2)',
    backIn  : 'back.in(2)',
    power3  : 'power3.out',
    power4  : 'power4.out',
    smooth  : 'power2.inOut',
    snap    : 'back.out(3)',
  };


  // ═══════════════════════════════════════════════════════════
  //  1. PAGE / SCREEN TRANSITIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * pageEnter(el, direction)
   * Animates a screen/section into view with a 3D perspective slide.
   * direction: 'right' | 'left' | 'up' | 'down'
   */
  function pageEnter(el, direction = 'right') {
    const g = _gsap(); if (!g) return;
    const dirs = {
      right : { x:  55, rotateY: -12 },
      left  : { x: -55, rotateY:  12 },
      up    : { y:  55, rotateX:   8 },
      down  : { y: -55, rotateX:  -8 },
    };
    const from = dirs[direction] ?? dirs.right;
    g.set(el, { perspective: 1200, transformStyle: 'preserve-3d', display: 'block' });
    return g.fromTo(el,
      { opacity: 0, ...from },
      { opacity: 1, x: 0, y: 0, rotateY: 0, rotateX: 0,
        duration: 0.52, ease: E.power3, clearProps: 'transform,opacity' }
    );
  }

  /**
   * pageExit(el, direction)
   * Pushes current screen out. Pair with pageEnter for transitions.
   */
  function pageExit(el, direction = 'left') {
    const g = _gsap(); if (!g) return;
    const dirs = {
      left  : { x: -55, rotateY:  12 },
      right : { x:  55, rotateY: -12 },
      up    : { y: -55, rotateX:  -8 },
      down  : { y:  55, rotateX:   8 },
    };
    const to = dirs[direction] ?? dirs.left;
    return g.to(el, {
      opacity: 0, ...to,
      duration: 0.32, ease: 'power3.in'
    });
  }

  /**
   * slideTransition(outEl, inEl, direction)
   * Complete screen-to-screen transition (like Jawaker's section switch).
   */
  function slideTransition(outEl, inEl, direction = 'left') {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();
    tl.add(pageExit(outEl, direction));
    tl.add(pageEnter(inEl, direction === 'left' ? 'right' : 'left'), '-=0.1');
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  2. CARD FLIP (مليون / Warzone)
  // ═══════════════════════════════════════════════════════════

  /**
   * flipCard(cardEl, opts)
   * Full 3D card flip. Expects .card-front / .card-back children
   * or will flip the whole element 180°.
   *
   * opts.onMidpoint — callback at the halfway point (swap face content here)
   * opts.onComplete — callback when flip is done
   * opts.reverse    — flip back to front
   * opts.duration   — total flip time (default 0.6s)
   */
  function flipCard(cardEl, opts = {}) {
    const g = _gsap(); if (!g) return;
    const { duration = 0.6, onMidpoint, onComplete, reverse = false } = opts;

    const front = cardEl.querySelector('.card-front, [data-front]');
    const back  = cardEl.querySelector('.card-back,  [data-back]');

    g.set(cardEl, { transformStyle: 'preserve-3d', transformPerspective: 600 });
    if (front && back) {
      g.set(front, { backfaceVisibility: 'hidden' });
      g.set(back,  { backfaceVisibility: 'hidden', rotateY: 180 });
    }

    const tl = g.timeline({ onComplete });
    tl.to(cardEl, {
      rotateY: reverse ? 0 : 90,
      duration: duration / 2,
      ease: 'power2.in',
      onComplete: onMidpoint
    });
    tl.to(cardEl, {
      rotateY: reverse ? -180 : 180,
      duration: duration / 2,
      ease: 'power2.out'
    });
    return tl;
  }

  /**
   * dealCards(cardEls, opts)
   * Deals multiple cards one-by-one from a deck position.
   * opts.from    — GSAP fromVars (default: fly from top)
   * opts.stagger — delay between cards (default 0.12s)
   */
  function dealCards(cardEls, opts = {}) {
    const g = _gsap(); if (!g) return;
    const {
      from    = { x: 0, y: -220, rotation: -18, scale: 0.8, opacity: 0 },
      stagger = 0.12,
    } = opts;
    g.set(cardEls, { transformStyle: 'preserve-3d' });
    return g.fromTo(cardEls,
      { ...from },
      { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
        duration: 0.5, stagger, ease: E.back }
    );
  }

  /**
   * cardHoverIn / cardHoverOut
   * Subtle lift + tilt on card hover. Bind manually or via setupCardHover().
   */
  function cardHoverIn(cardEl) {
    const g = _gsap(); if (!g) return;
    g.to(cardEl, {
      y: -14, scale: 1.05, rotateX: 8, rotateZ: -1.5,
      boxShadow: '0 28px 56px rgba(0,0,0,0.55)',
      duration: 0.28, ease: E.back
    });
  }

  function cardHoverOut(cardEl) {
    const g = _gsap(); if (!g) return;
    g.to(cardEl, {
      y: 0, scale: 1, rotateX: 0, rotateZ: 0,
      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
      duration: 0.32, ease: E.spring
    });
  }

  /**
   * setupCardHover(selector)
   * Auto-binds cardHoverIn/Out to all matching elements.
   */
  function setupCardHover(selector = '.play-card, [data-card]') {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => cardHoverIn(el));
      el.addEventListener('mouseleave', () => cardHoverOut(el));
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  3. BUTTON 3D PRESS
  // ═══════════════════════════════════════════════════════════

  /**
   * setupButtonPress(selector)
   * Adds a physical 3D press feel to all buttons.
   * Works on mobile (pointer events).
   */
  function setupButtonPress(selector = '.btn, button:not([data-no-press]), [data-3d-btn]') {
    const g = _gsap(); if (!g) return;

    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        // Prevent double-fire on touch
        if (e.pointerType === 'touch') e.preventDefault();
        g.to(btn, { scale: 0.92, y: 3, rotateX: 10, duration: 0.1, ease: 'power2.in',
          transformPerspective: 400, transformOrigin: 'center bottom' });
      });
      btn.addEventListener('pointerup', () => {
        g.to(btn, { scale: 1, y: 0, rotateX: 0, duration: 0.4, ease: E.spring });
      });
      btn.addEventListener('pointercancel', () => {
        g.to(btn, { scale: 1, y: 0, rotateX: 0, duration: 0.25, ease: E.power3 });
      });
      btn.addEventListener('pointerleave', () => {
        g.to(btn, { scale: 1, y: 0, rotateX: 0, duration: 0.25, ease: E.power3 });
      });
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  4. MAGNETIC TILT (Profile Cards / Game Tiles / Store Items)
  // ═══════════════════════════════════════════════════════════

  /**
   * setupTilt(selector, opts)
   * Mouse-tracking 3D tilt effect for desktop.
   * opts.maxTilt    — max tilt angle in degrees (default 15)
   * opts.scale      — hover scale (default 1.04)
   * opts.perspective — CSS perspective (default 900)
   * opts.glare      — adds a light glare overlay (default true)
   */
  function setupTilt(selector = '[data-tilt]', opts = {}) {
    const g = _gsap(); if (!g) return;
    const { maxTilt = 15, scale = 1.04, perspective = 900, glare = true } = opts;

    document.querySelectorAll(selector).forEach(el => {
      g.set(el, { transformPerspective: perspective, transformStyle: 'preserve-3d' });

      // Inject glare element
      let glareEl = null;
      if (glare) {
        glareEl = el.querySelector('.tilt-glare') || document.createElement('div');
        glareEl.className = 'tilt-glare';
        glareEl.style.cssText = `
          position:absolute; inset:0; border-radius:inherit; pointer-events:none;
          background: radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 65%);
          opacity:0; z-index:1; transition:opacity 0.2s;
        `;
        if (!el.querySelector('.tilt-glare')) el.appendChild(glareEl);
        el.style.position = el.style.position || 'relative';
      }

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);   // -1 to 1
        const dy   = (e.clientY - cy) / (rect.height / 2);   // -1 to 1

        g.to(el, {
          rotateY:  dx * maxTilt,
          rotateX: -dy * maxTilt,
          scale,
          duration: 0.25, ease: 'power2.out'
        });

        if (glareEl) {
          // Shift glare position toward mouse
          const gx = 30 + dx * 25;
          const gy = 30 + dy * 20;
          glareEl.style.background =
            `radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.2) 0%, transparent 65%)`;
          glareEl.style.opacity = '1';
        }
      });

      el.addEventListener('mouseleave', () => {
        g.to(el, { rotateY: 0, rotateX: 0, scale: 1,
          duration: 0.55, ease: E.spring });
        if (glareEl) glareEl.style.opacity = '0';
      });
    });
  }

  /**
   * setupTouchTilt(selector, opts)
   * Touch version of tilt for mobile — lighter tilt, no glare.
   */
  function setupTouchTilt(selector = '[data-tilt]', opts = {}) {
    const g = _gsap(); if (!g) return;
    const { maxTilt = 8 } = opts;

    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('touchmove', (e) => {
        const t    = e.touches[0];
        const rect = el.getBoundingClientRect();
        const dx   = (t.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
        const dy   = (t.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
        g.to(el, { rotateY: dx * maxTilt, rotateX: -dy * maxTilt, duration: 0.18 });
      }, { passive: true });

      el.addEventListener('touchend',   () => g.to(el, { rotateY: 0, rotateX: 0, duration: 0.5, ease: E.spring }));
      el.addEventListener('touchcancel',() => g.to(el, { rotateY: 0, rotateX: 0, duration: 0.4, ease: E.power3 }));
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  5. COIN FLIP 3D
  // ═══════════════════════════════════════════════════════════

  /**
   * flipCoin(coinEl, result, opts)
   * Animates a CSS-3D coin flip.
   * coinEl should have .coin-heads / .coin-tails children for faces.
   * result: 'heads' | 'tails'
   */
  function flipCoin(coinEl, result = 'heads', opts = {}) {
    const g = _gsap(); if (!g) return;
    const { spins = 7, duration = 1.4, onComplete } = opts;

    // Final rotateY: heads = even*180, tails = odd*180
    const finalY = result === 'heads'
      ? spins * 360
      : spins * 360 + 180;

    const heads = coinEl.querySelector('.coin-heads');
    const tails = coinEl.querySelector('.coin-tails');
    if (heads && tails) {
      g.set(coinEl, { transformStyle: 'preserve-3d', transformPerspective: 500 });
      g.set(heads,  { backfaceVisibility: 'hidden', rotateY: 0   });
      g.set(tails,  { backfaceVisibility: 'hidden', rotateY: 180 });
    }

    const tl = g.timeline({ onComplete });
    // Rise arc
    tl.to(coinEl, {
      rotateY: finalY * 0.4,
      y: -90, scaleX: 0.8,
      duration: duration * 0.4,
      ease: 'power2.out'
    });
    // Fast mid-spin
    tl.to(coinEl, {
      rotateY: finalY * 0.85,
      y: -60,
      duration: duration * 0.35,
      ease: 'none'
    });
    // Land + bounce
    tl.to(coinEl, {
      rotateY: finalY,
      y: 0, scaleX: 1,
      duration: duration * 0.25,
      ease: E.bounce
    });
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  6. DICE ROLL 3D
  // ═══════════════════════════════════════════════════════════

  // Face rotations for a standard die (right-hand orientation)
  const _DICE_FACES = {
    1: { rotateX:   0, rotateY:   0 },
    2: { rotateX:   0, rotateY: -90 },
    3: { rotateX: -90, rotateY:   0 },
    4: { rotateX:  90, rotateY:   0 },
    5: { rotateX:   0, rotateY:  90 },
    6: { rotateX: 180, rotateY:   0 },
  };

  /**
   * rollDice(diceEl, result, opts)
   * diceEl must be a CSS 3D cube (.dice-face × 6 children).
   * result: 1–6
   */
  function rollDice(diceEl, result = 1, opts = {}) {
    const g = _gsap(); if (!g) return;
    const { duration = 1.1, onComplete } = opts;
    const face = _DICE_FACES[result] ?? _DICE_FACES[1];

    g.set(diceEl, { transformStyle: 'preserve-3d', transformPerspective: 600 });

    const tl = g.timeline({ onComplete });
    tl.to(diceEl, {
      rotateX: 360 * 3 + face.rotateX,
      rotateY: 360 * 3 + face.rotateY,
      y: -50, scale: 1.25,
      duration: duration * 0.65,
      ease: 'power3.out'
    });
    tl.to(diceEl, {
      y: 0, scale: 1,
      duration: duration * 0.35,
      ease: E.bounce
    });
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  7. ACHIEVEMENT POPUP
  // ═══════════════════════════════════════════════════════════

  /**
   * showAchievement(popupEl, opts)
   * 3D entrance for achievement unlocked popup.
   * opts.holdDuration — time visible before exit (default 3.5s)
   * opts.onHide       — callback when hidden
   * opts.goldPulse    — number of gold shadow pulses (default 2)
   */
  function showAchievement(popupEl, opts = {}) {
    const g = _gsap(); if (!g) return;
    const { holdDuration = 3.5, onHide, goldPulse = 2 } = opts;

    g.set(popupEl, {
      display: 'flex', scale: 0, opacity: 0,
      rotateX: -80, y: -20,
      transformPerspective: 700,
      transformOrigin: 'center top'
    });

    const tl = g.timeline();

    // Entrance
    tl.to(popupEl, {
      scale: 1.08, opacity: 1, rotateX: 10, y: 0,
      duration: 0.42, ease: E.back
    });
    tl.to(popupEl, {
      scale: 1, rotateX: 0,
      duration: 0.25, ease: E.spring
    });

    // Gold pulse
    tl.to(popupEl, {
      boxShadow: '0 0 0 4px rgba(255,210,50,0.8), 0 16px 50px rgba(255,210,50,0.35)',
      duration: 0.35, ease: 'power2.out',
      yoyo: true, repeat: goldPulse * 2 - 1
    }, '+=0.15');

    // Icon bounce (if exists)
    const icon = popupEl.querySelector('.achievement-icon, [data-ach-icon]');
    if (icon) {
      tl.fromTo(icon,
        { rotateZ: -15, scale: 0.6 },
        { rotateZ: 0, scale: 1, duration: 0.4, ease: E.spring },
        '<'
      );
    }

    // Exit
    tl.to(popupEl, {
      y: -50, opacity: 0, scale: 0.85, rotateX: 30,
      duration: 0.38, ease: 'power3.in',
      onComplete: () => {
        g.set(popupEl, { display: 'none', clearProps: 'all' });
        if (onHide) onHide();
      }
    }, `+=${holdDuration}`);

    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  8. VIP BADGE FLOATING ANIMATION
  // ═══════════════════════════════════════════════════════════

  /**
   * setupVIPBadge(selector)
   * Continuous float + gold glow for VIP/crown badges.
   * Call once on page load.
   */
  function setupVIPBadge(selector = '.vip-badge, .crown-badge, [data-vip]') {
    const g = _gsap(); if (!g) return;
    document.querySelectorAll(selector).forEach(badge => {
      // Float
      g.to(badge, {
        y: -7, rotateZ: 4,
        duration: 1.9, ease: 'sine.inOut',
        yoyo: true, repeat: -1
      });
      // Gold glow pulse
      g.to(badge, {
        filter: 'drop-shadow(0 0 8px rgba(255,210,60,0.95))',
        duration: 1.1, ease: 'sine.inOut',
        yoyo: true, repeat: -1,
        delay: 0.4
      });
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  9. TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * showToast(toastEl, position)
   * Slides toast in with a 3D tilt. position: 'top' | 'bottom'
   */
  function showToast(toastEl, position = 'top') {
    const g = _gsap(); if (!g) return;
    const fromY   = position === 'top' ? -70 : 70;
    const fromRotX = position === 'top' ? -25 : 25;
    g.set(toastEl, {
      y: fromY, opacity: 0, rotateX: fromRotX,
      scale: 0.9, display: 'flex',
      transformPerspective: 500,
      transformOrigin: position === 'top' ? 'center top' : 'center bottom'
    });
    return g.to(toastEl, {
      y: 0, opacity: 1, rotateX: 0, scale: 1,
      duration: 0.38, ease: E.back
    });
  }

  /**
   * hideToast(toastEl, position)
   */
  function hideToast(toastEl, position = 'top') {
    const g = _gsap(); if (!g) return;
    const toY = position === 'top' ? -70 : 70;
    return g.to(toastEl, {
      y: toY, opacity: 0, scale: 0.88,
      duration: 0.28, ease: 'power3.in',
      onComplete: () => g.set(toastEl, { display: 'none', clearProps: 'all' })
    });
  }

  /**
   * autoToast(toastEl, position, holdMs)
   * Show and auto-hide after holdMs milliseconds.
   */
  function autoToast(toastEl, position = 'top', holdMs = 3000) {
    const g = _gsap(); if (!g) return;
    showToast(toastEl, position);
    const tl = g.timeline();
    tl.to({}, { duration: holdMs / 1000 });
    tl.add(() => hideToast(toastEl, position));
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  10. MODAL 3D ENTRANCE / EXIT
  // ═══════════════════════════════════════════════════════════

  /**
   * showModal(modalEl, overlayEl)
   * 3D perspective drop-in modal reveal.
   */
  function showModal(modalEl, overlayEl) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();

    if (overlayEl) {
      g.set(overlayEl, { opacity: 0, display: 'flex' });
      tl.to(overlayEl, { opacity: 1, duration: 0.22 });
    }

    g.set(modalEl, {
      scale: 0.65, opacity: 0, rotateX: -28,
      y: -30, transformPerspective: 900,
      transformOrigin: 'center top',
      display: 'flex'
    });
    tl.to(modalEl, {
      scale: 1, opacity: 1, rotateX: 0, y: 0,
      duration: 0.45, ease: E.back
    }, overlayEl ? '-=0.08' : '0');

    // Content fade-in stagger
    const children = modalEl.querySelectorAll(
      '.modal-header, .modal-body, .modal-footer, [data-modal-item]'
    );
    if (children.length) {
      g.set(children, { opacity: 0, y: 14 });
      tl.to(children, {
        opacity: 1, y: 0,
        stagger: 0.06, duration: 0.28, ease: E.power3
      }, '-=0.2');
    }

    return tl;
  }

  /**
   * hideModal(modalEl, overlayEl)
   */
  function hideModal(modalEl, overlayEl) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline({
      onComplete: () => {
        g.set(modalEl, { display: 'none', clearProps: 'all' });
        if (overlayEl) g.set(overlayEl, { display: 'none' });
      }
    });
    tl.to(modalEl, {
      scale: 0.8, opacity: 0, rotateX: 22, y: -20,
      duration: 0.28, ease: 'power3.in'
    });
    if (overlayEl) {
      tl.to(overlayEl, { opacity: 0, duration: 0.2 }, '-=0.12');
    }
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  11. CHAT MESSAGE ENTRANCE
  // ═══════════════════════════════════════════════════════════

  /**
   * animateChatMessage(msgEl, side)
   * Slides message bubble in from its side with a 3D pop.
   * side: 'right' (my message) | 'left' (other message)
   */
  function animateChatMessage(msgEl, side = 'right') {
    const g = _gsap(); if (!g) return;
    const fromX    = side === 'right' ? 28 : -28;
    const fromRotY = side === 'right' ?  8 :  -8;
    g.fromTo(msgEl,
      { x: fromX, opacity: 0, scale: 0.88, rotateY: fromRotY },
      { x: 0, opacity: 1, scale: 1, rotateY: 0,
        duration: 0.32, ease: E.back }
    );
  }

  /**
   * animateChatMessages(containerEl)
   * Animates all .msg-bubble children inside a container.
   */
  function animateChatMessages(containerEl) {
    const g = _gsap(); if (!g) return;
    const msgs = containerEl.querySelectorAll('.msg-bubble, .chat-message, [data-msg]');
    msgs.forEach(m => {
      const side = m.classList.contains('sent') || m.dataset.side === 'right' ? 'right' : 'left';
      animateChatMessage(m, side);
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  12. PLAYER JOIN / LEAVE
  // ═══════════════════════════════════════════════════════════

  /**
   * playerJoin(avatarEl)
   * Spins avatar into a seat when a player joins a room.
   */
  function playerJoin(avatarEl) {
    const g = _gsap(); if (!g) return;
    g.set(avatarEl, { scale: 0, rotateY: -180, opacity: 0 });
    return g.to(avatarEl, {
      scale: 1, rotateY: 0, opacity: 1,
      duration: 0.55, ease: E.spring
    });
  }

  /**
   * playerLeave(avatarEl, onComplete)
   * Spins avatar out when a player leaves.
   */
  function playerLeave(avatarEl, onComplete) {
    const g = _gsap(); if (!g) return;
    return g.to(avatarEl, {
      scale: 0, rotateY: 180, opacity: 0,
      duration: 0.38, ease: 'power3.in',
      onComplete
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  13. SCORE / XP COUNTER
  // ═══════════════════════════════════════════════════════════

  /**
   * animateScore(el, from, to, opts)
   * Animates a number counter with Arabic-Indic numerals.
   * opts.duration — animation time (default 1.2s)
   * opts.prefix   — text before number (e.g. '+')
   * opts.suffix   — text after number (e.g. ' XP')
   * opts.locale   — number locale (default 'ar-SA')
   */
  function animateScore(el, from, to, opts = {}) {
    const g = _gsap(); if (!g) return;
    const { duration = 1.2, prefix = '', suffix = '', locale = 'ar-SA' } = opts;
    const obj = { val: from };
    return g.to(obj, {
      val: to, duration,
      ease: 'power2.out',
      roundProps: 'val',
      onUpdate: () => {
        el.textContent = prefix + obj.val.toLocaleString(locale) + suffix;
      },
      onComplete: () => {
        el.textContent = prefix + to.toLocaleString(locale) + suffix;
      }
    });
  }

  /**
   * xpGain(barEl, fromPct, toPct, labelEl)
   * Animates an XP progress bar fill. Percentages 0–100.
   */
  function xpGain(barEl, fromPct, toPct, labelEl) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();
    g.set(barEl, { scaleX: fromPct / 100, transformOrigin: 'left center' });
    tl.to(barEl, {
      scaleX: toPct / 100,
      duration: 1.0, ease: 'power3.out'
    });
    // Glow pulse on bar
    tl.to(barEl, {
      boxShadow: '0 0 16px 4px rgba(255,210,60,0.7)',
      duration: 0.3, yoyo: true, repeat: 3
    }, '-=0.4');
    if (labelEl) {
      tl.add(() => animateScore(labelEl, fromPct, toPct, { suffix: '%', duration: 0.8 }), '<');
    }
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  14. WINNER CELEBRATION (Particle Burst)
  // ═══════════════════════════════════════════════════════════

  /**
   * winnerCelebration(containerEl, opts)
   * Spawns animated particles radiating from center.
   * opts.count  — number of particles (default 28)
   * opts.colors — particle color array
   * opts.shapes — 'circle' | 'star' | 'mixed' (default 'mixed')
   */
  function winnerCelebration(containerEl, opts = {}) {
    const g = _gsap(); if (!g) return;
    const {
      count  = 28,
      colors = ['#FFD700', '#FFFFFF', '#FF6B35', '#A855F7', '#00C2FF', '#FF3E9D'],
      shapes = 'mixed',
    } = opts;

    const origPos = containerEl.style.position;
    if (!origPos || origPos === 'static') containerEl.style.position = 'relative';
    containerEl.style.overflow = 'visible';

    const starPath = 'M10,1 L12.9,7 L20,7.6 L14.5,12.3 L16.2,19 L10,15.4 L3.8,19 L5.5,12.3 L0,7.6 L7.1,7 Z';

    for (let i = 0; i < count; i++) {
      const useShape = shapes === 'mixed'
        ? (i % 3 === 0 ? 'star' : 'circle')
        : shapes;

      let el;
      if (useShape === 'star') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        el.setAttribute('viewBox', '0 0 20 20');
        el.setAttribute('width',  '14');
        el.setAttribute('height', '14');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', starPath);
        path.setAttribute('fill', colors[i % colors.length]);
        el.appendChild(path);
      } else {
        el = document.createElement('div');
        const size = 8 + Math.random() * 6;
        el.style.cssText = `
          width:${size}px; height:${size}px; border-radius:50%;
          background:${colors[i % colors.length]};
        `;
      }

      el.style.cssText += `
        position:absolute; pointer-events:none; z-index:9998;
        left:50%; top:50%; transform:translate(-50%,-50%);
      `;
      containerEl.appendChild(el);

      const angle   = (i / count) * 360 + Math.random() * (360 / count);
      const rad     = (angle * Math.PI) / 180;
      const dist    = 70 + Math.random() * 90;
      const tx      = Math.cos(rad) * dist;
      const ty      = Math.sin(rad) * dist;
      const delay   = Math.random() * 0.25;

      g.fromTo(el,
        { x: 0, y: 0, scale: 0, opacity: 1, rotateZ: 0 },
        {
          x: tx, y: ty,
          scale: 0.6 + Math.random() * 1.2,
          rotateZ: Math.random() * 540 - 270,
          opacity: 0,
          duration: 1.0 + Math.random() * 0.6,
          ease: 'power3.out',
          delay,
          onComplete: () => el.remove()
        }
      );
    }
  }


  // ═══════════════════════════════════════════════════════════
  //  15. GAME BOARD ENTRANCE
  // ═══════════════════════════════════════════════════════════

  /**
   * gameBoardEntrance(boardEl, itemsSelector)
   * 3D stagger reveal of all game cells/cards on board.
   * from: 'center' | 'start' | 'end' | 'random'
   */
  function gameBoardEntrance(boardEl, itemsSelector = '.game-item, .card, .cell, .tile', from = 'center') {
    const g = _gsap(); if (!g) return;
    const items = boardEl.querySelectorAll(itemsSelector);
    if (!items.length) return;

    g.set(boardEl, { perspective: 900 });
    g.set(items, { opacity: 0, rotateX: -55, y: 35, scale: 0.9 });

    return g.to(items, {
      opacity: 1, rotateX: 0, y: 0, scale: 1,
      duration: 0.45,
      stagger: { amount: 0.75, from, grid: 'auto' },
      ease: E.back
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  16. GAME RESULT SCREEN (Win / Lose)
  // ═══════════════════════════════════════════════════════════

  /**
   * gameResult(containerEl, isWin, opts)
   * Full-screen game over reveal. Fires celebration on win.
   * opts.onComplete — callback after animation
   */
  function gameResult(containerEl, isWin, opts = {}) {
    const g = _gsap(); if (!g) return;
    const { onComplete } = opts;
    const tl = g.timeline({ onComplete });

    g.set(containerEl, {
      display: 'flex', opacity: 0,
      scale: isWin ? 0.5 : 1.3,
      rotateX: isWin ? -20 : 12,
      transformPerspective: 1000
    });

    tl.to(containerEl, {
      opacity: 1, scale: isWin ? 1.06 : 0.95, rotateX: 0,
      duration: 0.55,
      ease: isWin ? E.spring : E.backIn
    });
    tl.to(containerEl, {
      scale: 1, duration: 0.3, ease: E.spring
    });

    if (isWin) {
      tl.add(() => winnerCelebration(containerEl), '<0.1');
      tl.to(containerEl, {
        boxShadow: '0 0 80px 20px rgba(255,215,0,0.5)',
        duration: 0.4, yoyo: true, repeat: 3
      }, '+=0.1');
    } else {
      // Shake on lose
      tl.to(containerEl, {
        x: -10, duration: 0.05, yoyo: true, repeat: 7, ease: 'none'
      }, '+=0.1');
      tl.to(containerEl, { x: 0, duration: 0.1 });
    }

    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  17. TAB SWITCH 3D SLIDE
  // ═══════════════════════════════════════════════════════════

  /**
   * switchTab(oldPanel, newPanel, direction)
   * Animates between two tab panels with 3D perspective.
   * direction: 1 (left→right) | -1 (right→left)
   */
  function switchTab(oldPanel, newPanel, direction = 1) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();
    tl.to(oldPanel, {
      opacity: 0, x: -38 * direction, rotateY: 12 * direction,
      duration: 0.22, ease: 'power2.in'
    });
    tl.set(oldPanel, { display: 'none' });
    tl.set(newPanel, { display: 'block', opacity: 0, x: 38 * direction, rotateY: -12 * direction });
    tl.to(newPanel, {
      opacity: 1, x: 0, rotateY: 0,
      duration: 0.32, ease: E.back
    }, '-=0.04');
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  18. ROOM / STORE CARD HOVER
  // ═══════════════════════════════════════════════════════════

  /**
   * setupRoomCards(selector)
   * Hover lift effect for lobby rooms, store items, game tiles.
   */
  function setupRoomCards(selector = '.room-card, .store-item, .game-tile, [data-room-card]') {
    const g = _gsap(); if (!g) return;
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mouseenter', () => {
        g.to(card, {
          y: -10, scale: 1.035, rotateX: 4, rotateZ: -0.8,
          boxShadow: '0 22px 55px rgba(0,0,0,0.45), 0 0 25px rgba(255,200,50,0.12)',
          duration: 0.3, ease: E.back,
          transformPerspective: 700
        });
      });
      card.addEventListener('mouseleave', () => {
        g.to(card, {
          y: 0, scale: 1, rotateX: 0, rotateZ: 0,
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          duration: 0.4, ease: E.spring
        });
      });
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  19. SKELETON LOADING
  // ═══════════════════════════════════════════════════════════

  /**
   * setupSkeletonShimmer(selector)
   * Animates background-position shimmer on skeleton elements.
   * Requires CSS on .skeleton:
   *   background: linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%);
   *   background-size: 200% 100%;
   */
  function setupSkeletonShimmer(selector = '.skeleton, [data-skeleton]') {
    const g = _gsap(); if (!g) return;
    document.querySelectorAll(selector).forEach(el => {
      g.fromTo(el,
        { backgroundPosition: '-100% center' },
        { backgroundPosition: '200% center',
          duration: 1.6, ease: 'none', repeat: -1 }
      );
    });
  }

  /**
   * revealFromSkeleton(skeletonEl, realEl)
   * Cross-fades from skeleton placeholder to real content.
   */
  function revealFromSkeleton(skeletonEl, realEl) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();
    tl.to(skeletonEl, { opacity: 0, scale: 0.96, duration: 0.28, ease: 'power2.in' });
    tl.set(skeletonEl, { display: 'none' });
    tl.set(realEl, { opacity: 0, scale: 0.96, y: 6, display: 'block' });
    tl.to(realEl, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: E.back });
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  20. NOTIFICATION BELL RING
  // ═══════════════════════════════════════════════════════════

  /**
   * ringBell(bellEl)
   * Realistic bell swing for notification icons.
   */
  function ringBell(bellEl) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();
    g.set(bellEl, { transformOrigin: 'top center' });
    tl.to(bellEl, { rotateZ:  22, duration: 0.08 });
    tl.to(bellEl, { rotateZ: -20, duration: 0.08 });
    tl.to(bellEl, { rotateZ:  16, duration: 0.07 });
    tl.to(bellEl, { rotateZ: -12, duration: 0.07 });
    tl.to(bellEl, { rotateZ:   8, duration: 0.06 });
    tl.to(bellEl, { rotateZ:  -5, duration: 0.06 });
    tl.to(bellEl, { rotateZ:   0, duration: 0.12, ease: E.spring });
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  21. SPLASH / LOGO INTRO
  // ═══════════════════════════════════════════════════════════

  /**
   * splashIntro(logoEl, taglineEl, onComplete)
   * Opening logo reveal for app launch / splash screen.
   */
  function splashIntro(logoEl, taglineEl, onComplete) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline({ onComplete });

    g.set(logoEl, { scale: 0.25, rotateY: -180, opacity: 0, transformPerspective: 900 });
    tl.to(logoEl, {
      scale: 1.08, rotateY: 0, opacity: 1,
      duration: 0.85, ease: E.spring
    });
    tl.to(logoEl, { scale: 1, duration: 0.25, ease: E.spring });

    if (taglineEl) {
      g.set(taglineEl, { opacity: 0, y: 18 });
      tl.to(taglineEl, { opacity: 1, y: 0, duration: 0.4, ease: E.back }, '-=0.1');
    }
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  22. CLAN BADGE ENTRANCE
  // ═══════════════════════════════════════════════════════════

  /**
   * clanBadgeEntrance(badgeEl)
   * Spinning reveal for clan emblems.
   */
  function clanBadgeEntrance(badgeEl) {
    const g = _gsap(); if (!g) return;
    g.set(badgeEl, { scale: 0, rotateZ: -200, opacity: 0 });
    return g.to(badgeEl, {
      scale: 1, rotateZ: 0, opacity: 1,
      duration: 0.7, ease: E.spring
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  23. TOURNAMENT BRACKET REVEAL
  // ═══════════════════════════════════════════════════════════

  /**
   * revealBracket(bracketEl)
   * Cascading 3D reveal of tournament bracket matches.
   */
  function revealBracket(bracketEl) {
    const g = _gsap(); if (!g) return;
    const matches = bracketEl.querySelectorAll(
      '.match, .bracket-match, .bracket-slot, [data-match]'
    );
    g.set(matches, { opacity: 0, x: -35, rotateY: -20 });
    return g.to(matches, {
      opacity: 1, x: 0, rotateY: 0,
      duration: 0.4,
      stagger: { amount: 1.0, from: 'start' },
      ease: E.back
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  24. PLAYER PROFILE MODAL REVEAL
  // ═══════════════════════════════════════════════════════════

  /**
   * showPlayerProfile(cardEl, statsSelector)
   * 3D reveal of full player profile card + stats stagger.
   */
  function showPlayerProfile(cardEl, statsSelector = '.stat-item, [data-stat]') {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();

    g.set(cardEl, {
      scale: 0.45, opacity: 0, rotateX: -28,
      transformPerspective: 850, display: 'flex'
    });
    tl.to(cardEl, {
      scale: 1, opacity: 1, rotateX: 0,
      duration: 0.52, ease: E.spring
    });

    const stats = cardEl.querySelectorAll(statsSelector);
    if (stats.length) {
      g.set(stats, { opacity: 0, y: 18 });
      tl.to(stats, {
        opacity: 1, y: 0,
        stagger: 0.065, duration: 0.28, ease: E.back
      }, '-=0.25');
    }
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  25. GLOBAL ANNOUNCEMENT BANNER
  // ═══════════════════════════════════════════════════════════

  /**
   * announceEntrance(bannerEl)
   * Drops the admin announcement banner in from the top.
   */
  function announceEntrance(bannerEl) {
    const g = _gsap(); if (!g) return;
    g.set(bannerEl, {
      y: -50, opacity: 0, rotateX: -18,
      transformOrigin: 'center top',
      transformPerspective: 600
    });
    return g.to(bannerEl, {
      y: 0, opacity: 1, rotateX: 0,
      duration: 0.48, ease: E.back
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  26. HAPTIC FEEDBACK PROXY (Mobile)
  // ═══════════════════════════════════════════════════════════

  /**
   * haptic(type)
   * Fires device haptic via Capacitor Haptics plugin (if available).
   * type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   * Falls back gracefully if Capacitor is not present.
   */
  function haptic(type = 'light') {
    try {
      const { Haptics, ImpactStyle, NotificationType } = window.Capacitor?.Plugins ?? {};
      if (!Haptics) return;

      const impactMap = { light: ImpactStyle?.Light, medium: ImpactStyle?.Medium, heavy: ImpactStyle?.Heavy };
      const notifyMap = { success: NotificationType?.Success, warning: NotificationType?.Warning, error: NotificationType?.Error };

      if (impactMap[type])  Haptics.impact({ style: impactMap[type] });
      else if (notifyMap[type]) Haptics.notification({ type: notifyMap[type] });
    } catch (_) {
      // Silently ignore on desktop
    }
  }


  // ═══════════════════════════════════════════════════════════
  //  27. STAGGER LIST REVEAL (Leaderboard / Friends / Search)
  // ═══════════════════════════════════════════════════════════

  /**
   * staggerReveal(items, opts)
   * Generic list reveal with 3D slide-in. Great for leaderboards,
   * search results, friends list, notification list, etc.
   * opts.from      — 'start' | 'end' | 'center' (default 'start')
   * opts.direction — 'right' | 'left' (which side items come from)
   */
  function staggerReveal(items, opts = {}) {
    const g = _gsap(); if (!g) return;
    const { from = 'start', direction = 'right', staggerTime = 0.55 } = opts;
    const fromX = direction === 'right' ? 40 : -40;

    g.set(items, { opacity: 0, x: fromX, rotateY: direction === 'right' ? 12 : -12 });
    return g.to(items, {
      opacity: 1, x: 0, rotateY: 0,
      duration: 0.38,
      stagger: { amount: staggerTime, from },
      ease: E.back
    });
  }


  // ═══════════════════════════════════════════════════════════
  //  28. WARZONE: UNIT ATTACK ANIMATION
  // ═══════════════════════════════════════════════════════════

  /**
   * unitAttack(attackerEl, targetEl, onHit)
   * Lunges attacker toward target, then springs back.
   * onHit: callback at impact moment.
   */
  function unitAttack(attackerEl, targetEl, onHit) {
    const g = _gsap(); if (!g) return;
    const aRect = attackerEl.getBoundingClientRect();
    const tRect = targetEl.getBoundingClientRect();
    const dx    = (tRect.left + tRect.width  / 2) - (aRect.left + aRect.width  / 2);
    const dy    = (tRect.top  + tRect.height / 2) - (aRect.top  + aRect.height / 2);
    const dist  = Math.sqrt(dx * dx + dy * dy);
    const lunge = Math.min(dist * 0.45, 60);
    const nx    = (dx / dist) * lunge;
    const ny    = (dy / dist) * lunge;

    const tl = g.timeline();
    tl.to(attackerEl, {
      x: nx, y: ny, scale: 1.15,
      duration: 0.18, ease: 'power3.out',
      onComplete: () => {
        if (onHit) onHit();
        unitHit(targetEl);
      }
    });
    tl.to(attackerEl, {
      x: 0, y: 0, scale: 1,
      duration: 0.35, ease: E.spring
    });
    return tl;
  }

  /**
   * unitHit(unitEl)
   * Flash + shake when a unit takes damage.
   */
  function unitHit(unitEl) {
    const g = _gsap(); if (!g) return;
    const tl = g.timeline();
    tl.to(unitEl, { filter: 'brightness(3)', duration: 0.06 });
    tl.to(unitEl, { x: -6, duration: 0.04, yoyo: true, repeat: 3 });
    tl.to(unitEl, { x: 0, filter: 'brightness(1)', duration: 0.12, clearProps: 'filter' });
    return tl;
  }


  // ═══════════════════════════════════════════════════════════
  //  INIT — Auto-bind all passive effects on DOM ready
  // ═══════════════════════════════════════════════════════════

  /**
   * init()
   * Call once after your DOM is ready (or on each new page mount).
   * Re-call after dynamic content insertion to bind new elements.
   */
  function init() {
    _registerPlugins();
    setupButtonPress();
    setupTilt('[data-tilt]');
    setupTouchTilt('[data-tilt]');
    setupVIPBadge();
    setupRoomCards();
    setupCardHover();
    setupSkeletonShimmer();
    console.log('[BeeEffects ✅] Phase 2 — 3D effects initialized');
  }


  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════
  return {
    init,

    // ── Page transitions
    pageEnter,
    pageExit,
    slideTransition,

    // ── Card system
    flipCard,
    dealCards,
    cardHoverIn,
    cardHoverOut,
    setupCardHover,

    // ── Input/interaction
    setupButtonPress,
    setupTilt,
    setupTouchTilt,

    // ── Games
    flipCoin,
    rollDice,
    gameBoardEntrance,
    gameResult,
    unitAttack,
    unitHit,

    // ── UI Components
    showAchievement,
    showToast,
    hideToast,
    autoToast,
    showModal,
    hideModal,
    switchTab,
    announceEntrance,
    staggerReveal,

    // ── Players
    playerJoin,
    playerLeave,
    showPlayerProfile,

    // ── Chat
    animateChatMessage,
    animateChatMessages,

    // ── Scores & XP
    animateScore,
    xpGain,

    // ── Celebrations
    winnerCelebration,

    // ── Misc
    ringBell,
    splashIntro,
    clanBadgeEntrance,
    revealBracket,
    setupVIPBadge,
    setupRoomCards,
    setupSkeletonShimmer,
    revealFromSkeleton,
    haptic,
  };

})();

// ── Export for ES modules (Capacitor / bundler)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BeeEffects;
}
if (typeof window !== 'undefined') {
  window.BeeEffects = BeeEffects;
}

// Auto-init
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BeeEffects.init());
  } else {
    BeeEffects.init();
  }
}
