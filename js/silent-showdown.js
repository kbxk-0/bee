// ============================================================
//  js/silent-showdown.js — الـ Engine الخلفي الاحترافي للمزامنة
// ============================================================

(function () {
    // جلب الإعدادات والاتصال الحالي النشط من التطبيق الأساسي لمنع تعارض الروابط والتكوين المكرر
    let firebaseConfig = {
        apiKey: "AIzaSyA3..." , // اتركها فارغة إذا كان تطبيقك يملك ملف تهيئة عام ومستقر ومربوط بـ window
        authDomain: window.location.hostname,
        databaseURL: "https://bee-platform-default-rtdb.firebaseio.com", // ضع هنا رابط قاعدة بيانات الـ Realtime الفريدة الخاصة بك من وحدة التحكم
        projectId: "bee-platform"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const database = firebase.database();
    
    // إعداد الهوية البرمجية الفريدة للاعب المتصل بالاعتماد على الجلسة أو توليد معرف فريد مؤقت
    const playerId = "usr_" + Math.random().toString(36).substr(2, 6);
    const playerUsername = localStorage.getItem('currentUsername') || ("لاعب_" + Math.floor(1000 + Math.random() * 9000));
    
    // الانضمام التلقائي إلى غرف اللعب المفتوحة لملء الطاولة (Matchmaking)
    const roomId = "table_lobby_premium_1"; 
    const roomRef = database.ref(`rooms/${roomId}`);
    const myPlayerRef = database.ref(`rooms/${roomId}/players/${playerId}`);

    const lobbyOverlay = document.getElementById('matchmaking');
    const lobbyStatusText = document.getElementById('lobby-status-text');
    const readyCount = document.getElementById('ready-count');
    const hudMsg = document.getElementById('hud-msg');
    const potValue = document.getElementById('pot-value');
    const playerDeck = document.getElementById('player-deck');

    // 1. توليد كروت اللعب الفاخرة رقمياً
    function buildPlayerDeck() {
        playerDeck.innerHTML = "";
        for (let i = 1; i <= 10; i++) {
            const card = document.createElement('button');
            card.className = "game-card";
            card.innerText = i;
            card.setAttribute('data-value', i);
            card.onclick = () => selectCard(i, card);
            playerDeck.appendChild(card);
        }
    }

    // 2. معالجة وحجز حركة اللاعب البرمجية
    function selectCard(num, cardElement) {
        hudMsg.innerText = "⏳ تم تأمين حركتك سرياً، بانتظار الخصوم...";
        myPlayerRef.child('current_move').set(num).then(() => {
            // قفل كافة الكروت في اليد لمنع التلاعب بالحركة حتى نهاية الجولة
            const allCards = playerDeck.querySelectorAll('.game-card');
            allCards.forEach(c => c.disabled = true);
        });
    }

    // 3. آلية الدخول الفوري وتأمين التنظيف التلقائي عند انقطاع الاتصال (Disconnect Handling)
    myPlayerRef.set({
        id: playerId,
        name: playerUsername,
        score: 0,
        current_move: null,
        online: true
    });
    myPlayerRef.onDisconnect().remove();

    buildPlayerDeck();

    // 4. محرك مراقبة الطاولة الحية والتحقق المتبادل من النصاب واللاعبين المتصلين
    roomRef.on('value', (snapshot) => {
        const roomData = snapshot.val();
        if (!roomData || !roomData.players) {
            lobbyStatusText.innerText = "جاري حجز مقعدك الشاغر على الطاولة...";
            return;
        }

        const playersList = Object.values(roomData.players);
        const playersCount = playersList.length;

        // التحقق من النصاب التشغيلي للطاولة (شخصين أو أكثر) قبل السماح بالوصول لبيئة اللعب 3D
        if (playersCount < 2) {
            lobbyOverlay.style.display = "flex";
            lobbyStatusText.innerText = `في انتظار انضمام الخصوم المقابلين للطاولة الفاخرة...`;
            readyCount.innerText = `اللاعبون المتصلون حالياً: (${playersCount} / 4)`;
            hudMsg.innerText = "🚨 في انتظار اكتمال نصاب الطاولة...";
            return;
        }

        // إلغاء حجب شاشة الانتظار وبدء العرض السينمائي فور التحقق المتبادل من الاتصال
        lobbyOverlay.style.display = "none";

        // مزامنة وعرض بطاقة الغنيمة النشطة بمنتصف الطاولة ثلاثية الأبعاد
        if (roomData.target_loot !== undefined) {
            potValue.innerText = roomData.target_loot > 0 ? `+${roomData.target_loot}` : roomData.target_loot;
        } else {
            potValue.innerText = "?";
        }

        // تحديث وإدارة المقاعد الموزعة هندسياً حول الطاولة للخصوم
        const opposingPlayers = playersList.filter(p => p.id !== playerId);
        for (let i = 1; i <= 3; i++) {
            const seatElement = document.getElementById(`seat-opp-${i}`);
            if (!seatElement) continue;

            const oppData = opposingPlayers[i - 1];
            if (oppData) {
                seatElement.classList.add('active');
                seatElement.querySelector('.seat-name').innerText = `${oppData.name} (${oppData.score} 🪙)`;
                
                if (oppData.current_move !== null) {
                    seatElement.classList.add('ready');
                    seatElement.querySelector('.seat-status').innerText = "جاهز ⚡";
                } else {
                    seatElement.classList.remove('ready');
                    seatElement.querySelector('.seat-status').innerText = "يفكر... 🤔";
                }
            } else {
                seatElement.classList.remove('active', 'ready');
                seatElement.querySelector('.seat-name').innerText = "في انتظار لاعب...";
                seatElement.querySelector('.seat-status').innerText = "---";
            }
        }

        // فحص حالة اللاعب الحالي لإعادة توجيه الأوامر وتصفير الجولات
        const myData = roomData.players[playerId];
        if (myData) {
            if (myData.current_move === null) {
                hudMsg.innerText = `🎯 جولة جديدة بدأت! رصيدك الحالي: ${myData.score} 🪙. اختر ورقتك السرية:`;
                
                // إعادة تفعيل الكروت التي لم يتم استهلاكها في الجولات السابقة
                const usedMoves = myData.used_moves || [];
                const allCards = playerDeck.querySelectorAll('.game-card');
                allCards.forEach(card => {
                    const val = parseInt(card.getAttribute('data-value'));
                    card.disabled = usedMoves.includes(val);
                });
            }
        }
    }, (error) => {
        lobbyStatusText.innerText = `فشل في الاتصال بالقنوات الآمنة: ${error.message}`;
    });
})();