// ============================================================
//  js/rewards.js — bee platform
//  المكافآت: مهام يومية، مكافأة يومية، تحويل كوينز، هدايا
// ============================================================

// ===== استلام مكافأة مهمة =====
function claimQuest(type) {
  const user = auth.currentUser;
  if (!user) return;

  const btn = document.querySelector(`button[onclick="claimQuest('${type}')"]`);
  if (btn) btn.disabled = true;

  db.ref('users/' + user.uid).transaction(u => {
    if (!u) return u;
    if (!u.quests) u.quests = {};

    if (type === 'chat') {
      const progress = u.quests.chatProgress || 0;
      const claimed  = u.quests.chatClaimed  || false;
      if (progress >= 5 && !claimed) {
        u.coins = (u.coins || 0) + 20;
        u.quests.chatClaimed = true;
        u.tempSuccess = true;
      } else { u.tempSuccess = false; }
    }

    if (type === 'flip') {
      const progress = u.quests.flipProgress || 0;
      const claimed  = u.quests.flipClaimed  || false;
      if (progress >= 3 && !claimed) {
        u.coins = (u.coins || 0) + 30;
        u.quests.flipClaimed = true;
        u.tempSuccess = true;
      } else { u.tempSuccess = false; }
    }

    return u;
  }, (error, committed, snap) => {
    if (btn && (!committed || error)) btn.disabled = false;

    if (committed && snap.exists()) {
      const userData = snap.val();
      if (userData.tempSuccess) {
        if (type === 'chat') { claimedChatQuest = true; alert('تم استلام 20 🪙 بنجاح!'); }
        if (type === 'flip') { claimedFlipQuest = true; alert('تم استلام 30 🪙 بنجاح!'); }
        if (typeof renderHome === 'function') renderHome();
      } else {
        alert('لم تكمل المهمة بعد، أو قمت بالاستلام مسبقاً!');
        if (typeof renderHome === 'function') renderHome();
      }
    } else {
      alert('فشلت العملية، يرجى التحقق من الاتصال.');
    }
  });
}

// ===== المكافأة اليومية =====
function claimDaily() {
  const user = auth.currentUser;
  if (!user) return;

  const claimBtn = document.querySelector("button[onclick='claimDaily()']");
  if (claimBtn) claimBtn.disabled = true;

  db.ref('users/' + user.uid).transaction(d => {
    if (!d) return d;
    const now    = Date.now();
    const last   = d.lastDaily || 0;
    const diff   = now - last;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) { d.tempTimeLeft = oneDay - diff; return; }

    const streak  = (diff < oneDay * 2) ? (d.dailyStreak || 0) + 1 : 1;
    const rewards = [50, 75, 100, 125, 150, 175, 200, 250, 300, 500];
    const reward  = rewards[Math.min(streak - 1, rewards.length - 1)];
    const dailyXP = Math.min(300, streak * 15);

    d.coins       = (d.coins || 0) + reward;
    d.lastDaily   = now;
    d.dailyStreak = streak;
    d.xp          = (d.xp || 0) + dailyXP;
    d = checkLevelUp(d);
    d.tempReward  = reward;
    d.tempXP      = dailyXP;
    return d;

  }, (error, committed, snap) => {
    if (claimBtn) claimBtn.disabled = false;

    if (committed && snap.exists()) {
      const userData = snap.val();
      if (userData.tempReward) {
        const streakMsg = userData.dailyStreak > 1 ? `\n🔥 سلسلة ${userData.dailyStreak} أيام!` : '';
        const xpMsg     = userData.tempXP ? `\n⭐ +${userData.tempXP} XP` : '';
        alert(`🎁 استلمت ${userData.tempReward} 🪙 مكافأة يومية!${xpMsg}${streakMsg}`);
        if (typeof renderHome === 'function') renderHome();
      } else if (userData.tempTimeLeft) {
        const r = userData.tempTimeLeft;
        alert(`استلمت بالفعل!\nانتظر ${Math.floor(r / 3600000)} ساعة و${Math.floor((r % 3600000) / 60000)} دقيقة`);
      }
    } else {
      alert('حدث خطأ أثناء استلام المكافأة، يرجى المحاولة مجدداً.');
    }
  });
}

// ===== تحويل كوينز =====
function transferCoins() {
  const user        = auth.currentUser;
  const targetInput = document.getElementById('tr-user');
  const amountInput = document.getElementById('tr-amount');
  const transferBtn = document.querySelector("button[onclick^='transferCoins']");

  if (!targetInput || !amountInput) return;
  const target = targetInput.value.trim();
  const amount = parseInt(amountInput.value);

  if (!user || !target || isNaN(amount) || amount <= 0) { alert('بيانات غير صحيحة'); return; }
  if (amount > currentCoins) { alert('لا تملك هذا القدر من الكوينز!'); return; }
  if (target === currentUsername) { alert('لا يمكنك التحويل لنفسك!'); return; }

  if (transferBtn) transferBtn.disabled = true;

  db.ref('users').orderByChild('username').equalTo(target).once('value', snap => {
    if (!snap.exists()) {
      alert('المستخدم المستلم غير موجود!');
      if (transferBtn) transferBtn.disabled = false;
      return;
    }

    const tid = Object.keys(snap.val())[0];

    db.ref('users/' + user.uid).transaction(u => {
      if (u && u.coins >= amount) { u.coins -= amount; return u; }
      return;
    }, (error, committed) => {
      if (committed) {
        db.ref('users/' + tid + '/coins')
          .set(firebase.database.ServerValue.increment(amount))
          .then(() => {
            alert(`تم تحويل 🪙 ${amount} إلى ${target} بنجاح!`);
            targetInput.value = '';
            amountInput.value = '';
          })
          .catch(() => alert('تم خصم الكوينز لكن فشل إيداعها للمستلم، يرجى مراسلة الإدارة.'))
          .finally(() => { if (transferBtn) transferBtn.disabled = false; });
      } else {
        alert('فشل التحويل. تأكد من رصيدك الحالي.');
        if (transferBtn) transferBtn.disabled = false;
      }
    });
  });
}

// ===== إرسال هدية =====
function sendGift(targetUid, targetName, giftId) {
  const gifts = {
    'gift_honey': { name: 'عسل ملكي',   emoji: '🍯', cost: 20  },
    'gift_bee':   { name: 'نحلة ذهبية', emoji: '🐝', cost: 50  },
    'gift_crown': { name: 'تاج النخبة', emoji: '👑', cost: 200 }
  };
  const gift = gifts[giftId];
  if (!gift) return;

  const user = auth.currentUser;
  if (!user) return;
  if (currentCoins < gift.cost) { alert(`لا تملك كوينز كافية! تحتاج ${gift.cost} 🪙`); return; }

  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= gift.cost) { u.coins -= gift.cost; return u; }
    return u;
  }, (err, committed) => {
    if (!committed) { alert('فشل إرسال الهدية. تحقق من رصيدك.'); return; }

    db.ref('transfers/' + targetUid).push({
      amount: 0, from: currentUsername, type: 'gift',
      giftName: gift.name, giftEmoji: gift.emoji, timestamp: Date.now()
    });

    db.ref('global_chat').push({
      uid: user.uid, sender: '🎁 النظام',
      text: `${gift.emoji} ${currentUsername} أهدى ${gift.name} إلى ${targetName}!`,
      isSystem: true,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    alert(`تم إرسال ${gift.emoji} ${gift.name} إلى ${targetName}!`);
  });
}
