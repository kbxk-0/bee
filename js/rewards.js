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
        if (type === 'chat') { claimedChatQuest = true; Toast.show('🎉 استلمت 20 🪙 مكافأة المهمة!', 'gold'); Sounds.play('coins'); Haptic.success(); }
        if (type === 'flip') { claimedFlipQuest = true; Toast.show('🎉 استلمت 30 🪙 مكافأة المهمة!', 'gold'); Sounds.play('coins'); Haptic.success(); }
        if (typeof renderHome === 'function') renderHome();
      } else {
        Toast.show('لم تكمل المهمة بعد، أو قمت بالاستلام مسبقاً!', 'info');
        if (typeof renderHome === 'function') renderHome();
      }
    } else {
      Toast.show('فشلت العملية، يرجى التحقق من الاتصال.', 'error');
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
        Toast.show(`🎁 استلمت ${userData.tempReward} 🪙 مكافأة يومية!${xpMsg}${streakMsg}`, 'gold');
        Sounds.play('coins'); if(userData.dailyStreak>1) setTimeout(()=>Sounds.play('levelUp'),400); Haptic.success();
        if (typeof renderHome === 'function') renderHome();
      } else if (userData.tempTimeLeft) {
        const r = userData.tempTimeLeft;
        Toast.show(`استلمت بالفعل!\nانتظر ${Math.floor(r / 3600000)} ساعة و${Math.floor((r % 3600000) / 60000)} دقيقة`, 'success');
      }
    } else {
      Toast.show('حدث خطأ أثناء استلام المكافأة، يرجى المحاولة مجدداً.', 'error');
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

  if (!user || !target || isNaN(amount) || amount <= 0) { Toast.show('بيانات غير صحيحة', 'error'); return; }
  if (amount > currentCoins) { Toast.show('لا تملك هذا القدر من الكوينز!', 'error'); return; }
  if (target === currentUsername) { Toast.show('لا يمكنك التحويل لنفسك!', 'info'); return; }

  if (transferBtn) transferBtn.disabled = true;

  db.ref('users').orderByChild('username').equalTo(target).once('value', snap => {
    if (!snap.exists()) {
      Toast.show('المستخدم المستلم غير موجود!', 'error');
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
            Toast.show(`تم تحويل 🪙 ${amount} إلى ${target} بنجاح!`, 'gold');
            Sounds.play('coins'); Haptic.success();
            targetInput.value = '';
            amountInput.value = '';
          })
          .catch(() => Toast.show('تم خصم الكوينز لكن فشل إيداعها للمستلم، يرجى مراسلة الإدارة.', 'success'))
          .finally(() => { if (transferBtn) transferBtn.disabled = false; });
      } else {
        Toast.show('فشل التحويل. تأكد من رصيدك الحالي.', 'error');
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
  if (currentCoins < gift.cost) { Toast.show(`لا تملك كوينز كافية! تحتاج ${gift.cost} 🪙`, 'error'); return; }

  db.ref('users/' + user.uid).transaction(u => {
    if (u && u.coins >= gift.cost) { u.coins -= gift.cost; return u; }
    return u;
  }, (err, committed) => {
    if (!committed) { Toast.show('فشل إرسال الهدية. تحقق من رصيدك.', 'error'); return; }

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

    Toast.show(`تم إرسال ${gift.emoji} ${gift.name} إلى ${targetName}!`, 'gold');
    Sounds.play('purchase'); Haptic.success();
  });
}
