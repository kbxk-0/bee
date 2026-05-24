// ═══════════════════════════════════════════════
//  cards.js — مكتبة ورق احترافية
//  الصور من deckofcardsapi.com
// ═══════════════════════════════════════════════

(function injectCardStyles() {
  if (document.getElementById('cards-lib-style')) return;
  const style = document.createElement('style');
  style.id = 'cards-lib-style';
  style.textContent = `
    .pcard {
      border-radius: 8px;
      border: 1px solid #ccc;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      position: relative;
      cursor: pointer;
      transition: transform .18s, box-shadow .18s;
      flex-shrink: 0;
      user-select: none;
      overflow: hidden;
      background: #fff;
    }
    .pcard img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 7px;
    }
    .pcard-md { width: 65px;  height: 90px;  }
    .pcard-sm { width: 44px;  height: 62px;  }
    .pcard-lg { width: 85px;  height: 118px; }
    .pcard-xl { width: 105px; height: 146px; }

    .pcard.selected {
      transform: translateY(-16px) scale(1.04);
      box-shadow: 0 12px 28px rgba(200,169,64,0.6) !important;
      border: 2px solid #c8a940 !important;
    }
    .pcard:active { opacity: 0.9; }

    /* ورقة مقلوبة */
    .pcard-back {
      background: linear-gradient(135deg,#1a3888,#0d2060) !important;
      border-color: rgba(255,255,255,0.15) !important;
    }
    .pcard-back::before {
      content: '';
      position: absolute; inset: 4px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px;
      background: repeating-linear-gradient(
        45deg, transparent, transparent 4px,
        rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 8px
      );
    }
    .pcard-back::after {
      content: '◆';
      position: absolute; top:50%; left:50%;
      transform: translate(-50%,-50%);
      font-size: 24px; color: rgba(200,169,64,0.4);
    }
    .pcard-sm.pcard-back::after { font-size: 14px; }
    .pcard-lg.pcard-back::after { font-size: 32px; }

    @keyframes card-deal {
      from { transform: translateY(-120px) scale(0.5); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    .pcard-deal { animation: card-deal 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
  `;
  document.head.appendChild(style);
})();

// ── تحويل القيمة والدرجة لكود الصورة ──
// مثال: ('A', '♠') → 'AS'  |  ('K', '♥') → 'KH'
function getCardCode(value, suit) {
  const valMap = {
    'A':'A', 'K':'K', 'Q':'Q', 'J':'J',
    '10':'0', '9':'9', '8':'8', '7':'7',
    '6':'6', '5':'5', '4':'4', '3':'3', '2':'2',
    // عربي → إنجليزي
    'أكك':'A', 'شيبه':'K', 'بنت':'Q', 'ولد':'J'
  };
  const suitMap = {
    '♠':'S', '♣':'C', '♥':'H', '♦':'D',
    'S':'S', 'C':'C', 'H':'H', 'D':'D'
  };
  const v = valMap[value] || value;
  const s = suitMap[suit] || suit;
  return `${v}${s}`;
}

function getCardImageUrl(value, suit) {
  const code = getCardCode(value, suit);
  return `https://deckofcardsapi.com/static/img/${code}.png`;
}

// ═══════════════════════════════════════════════
//  الدالة الرئيسية
// ═══════════════════════════════════════════════
function createCard(value, suit, options = {}) {
  const {
    size = 'md',
    selectable = true,
    dealDelay = 0,
    onClick = null,
    back = false,
  } = options;

  const el = document.createElement('div');
  el.className = `pcard pcard-${size}${back ? ' pcard-back' : ''}${dealDelay > 0 ? ' pcard-deal' : ''}`;
  if (dealDelay > 0) el.style.animationDelay = `${dealDelay}s`;

  if (!back && value && suit) {
    const img = document.createElement('img');
    img.src = getCardImageUrl(value, suit);
    img.alt = `${value}${suit}`;
    img.loading = 'lazy';
    // fallback لو الصورة ما حمّلت
    img.onerror = () => {
      img.style.display = 'none';
      el.style.background = '#fff';
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;
          justify-content:center;height:100%;gap:2px;
          color:${'♥♦'.includes(suit)?'#c0392b':'#111'}">
          <span style="font-size:${size==='sm'?'11px':size==='lg'?'17px':'14px'};font-weight:900">${value}</span>
          <span style="font-size:${size==='sm'?'14px':size==='lg'?'22px':'18px'}">${suit}</span>
        </div>`;
    };
    el.appendChild(img);
  }

  if (selectable) {
    el.addEventListener('click', () => {
      el.classList.toggle('selected');
      if (onClick) onClick(el, value, suit);
    });
  } else if (onClick) {
    el.addEventListener('click', () => onClick(el, value, suit));
  }

  return el;
}

// ── دوال مساعدة ──
function renderCards(container, cardsData, options = {}) {
  if (!container) return;
  const { size = 'md', gap = '6px', selectable = true } = options;
  container.style.display = 'flex';
  container.style.gap = gap;
  container.style.alignItems = 'flex-end';
  container.innerHTML = '';
  cardsData.forEach((c, i) => {
    const val = c.val || c.value || c[0];
    const suit = c.suit || c[1];
    const card = createCard(val, suit, { size, selectable, dealDelay: i * 0.12 });
    container.appendChild(card);
  });
}

function createBackCard(size = 'sm') {
  return createCard(null, null, { back: true, size, selectable: false });
}
