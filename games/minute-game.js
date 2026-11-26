// ===== إعدادات تقدر تعدلها =====
const Q=new URLSearchParams(location.search);
const WS_URL=Q.get('ws')||'wss://million-server.onrender.com'; // للتجربة على جهازك أضف للرابط: ?ws=ws://localhost:3001
const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]; // لو المكالمة ما اتصلت أضف TURN هنا
const TIME=60000,SKIPS=3,DECK=40;
const $=id=>document.getElementById(id);
const dec=s=>{try{return decodeURIComponent(s)}catch(e){return s}};
const myName=dec(Q.get('name')||'').slice(0,16)||'لاعب',myAv=dec(Q.get('avatar')||'')||'😊';
const norm=s=>String(s).toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim().split(' ').map(w=>w.length>3&&w.startsWith('ال')?w.slice(2):w).join(' ');
const lev=(a,b)=>{const m=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return m[a.length][b.length]};
const STOP=new Set(['flag','of','the','and','city','al','bin','ibn','mohamed','mohammed','muhammad','ahmed','abdel','abdul','abdullah','محمد','احمد','عبد','عبدالله','بن','ابن','علم'].map(norm));
const SK=['skip','سكيب','اسكيب','تخطي','تخطى','باس','pass'].map(norm);
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const NSR=NATIVE&&Capacitor.Plugins&&Capacitor.Plugins.SpeechRecognition; // إضافة الصوت داخل APK
let ws,me='a',local=0,playing=0,pending=0,oppLeft=0,deck=[],idx=0,turn='a',T={a:TIME,b:TIME},S={a:SKIPS,b:SKIPS},C={a:0,b:0},names={a:'لاعب ١',b:'لاعب ٢'},avs={a:'😊',b:'😊'},cons='',last=0,lc=0,ft,sel=new Set(),stream,pc,qIce=[],rec,want=0;
const M=()=>local?'a':me,O=()=>M()=='a'?'b':'a',mine=()=>local||turn==me,cur=()=>deck[idx%deck.length];
const show=id=>['h','l','g','r'].forEach(x=>$(x).hidden=x!=id);
const note=m=>{$('nt').textContent=$('wt').textContent=m;if(!$('r').hidden&&m)$('rs').textContent=m};
const send=o=>{if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))};
const nums=o=>(o=o||{},{a:+o.a||0,b:+o.b||0});
const safeAv=a=>/^(https:\/\/|data:image\/)/.test(a)?a:null;
function setAv(el,a){el.textContent='';const u=safeAv(a);if(u){const i=new Image();i.src=u;el.append(i)}else el.textContent=String(a||'😊').slice(0,4)}

// ===== الأسئلة: ويكيبيديا (صور + اسم عربي) و Simple Icons (شعارات) =====
const load=u=>new Promise(r=>{const i=new Image(),t=setTimeout(()=>r(0),8000);i.referrerPolicy='no-referrer';i.onload=()=>{clearTimeout(t);r(1)};i.onerror=()=>{clearTimeout(t);r(0)};i.src=u});
const clean=s=>String(s||'').replace(/\(.*?\)|,.*$/g,'').replace(/^(Flag of |علم )/,'').trim();
async function makeDeck(){
 const ar=$('lg').value.startsWith('ar');
 const pool=CATS.filter((_,i)=>!sel.size||sel.has(i)).flatMap(c=>c.t.map(s=>({c,s}))).sort(()=>Math.random()-.5).slice(0,50);
 pool.forEach(x=>{const [h,...ex]=x.s.split('|'),[t,sl]=h.split('=');x.t=t;x.ex=ex;x.w=(x.c.fl||'')+t;x.sl=sl||t.replace(/[(,].*$/,'').toLowerCase().replace(/[^a-z0-9]/g,'')});
 const j=await(await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1&prop=pageimages|langlinks&piprop=thumbnail&pithumbsize=500&pilimit=max&lllang=ar&lllimit=max&titles='+encodeURIComponent(pool.map(x=>x.w).join('|')))).json();
 const q=j.query||{},mp={},pg={};(q.normalized||[]).concat(q.redirects||[]).forEach(r=>mp[r.from]=r.to);(q.pages||[]).forEach(p=>pg[p.title]=p);
 const items=await Promise.all(pool.map(async x=>{
  let n=mp[x.w]||x.w;n=mp[n]||n;const p=pg[n]||{},a=p.langlinks&&p.langlinks[0]&&p.langlinks[0].title;
  if(ar&&!a&&!x.ex.length)return;
  let g;for(const v of [x.c.logo&&'https://cdn.simpleicons.org/'+x.sl,p.thumbnail&&p.thumbnail.source].filter(Boolean))if(await load(v)){g=v;break}
  if(!g)return;
  const set=new Set();[x.t,a,...x.ex].forEach(s=>{const c=norm(clean(s));if(!c)return;set.add(c);c.split(' ').forEach(w=>{if(w.length>3&&!STOP.has(w))set.add(w)})});
  return{u:g,a:[...set],d:clean(a)||clean(x.t)}}));
 return items.filter(Boolean).slice(0,DECK)}

// ===== اللعب =====
function flash(m,ok){const e=$('fl');e.textContent=m;e.className=ok?'ok':'';clearTimeout(ft);ft=setTimeout(()=>e.textContent='',1600)}
function draw(){const c=cur(),im=$('im');im.textContent='';const i=new Image();i.referrerPolicy='no-referrer';i.alt='';i.src=c.u;im.append(i);$('tw').className='tw '+(mine()?'me ':'opp ')+(c.u.includes('simpleicons')?'logo':'');$('hint').textContent=mine()?'دورك! قُل الإجابة':'دور '+names[turn];$('cap').textContent='';const n=deck[(idx+1)%deck.length];if(n)new Image().src=n.u;drawT()}
function mkPanel(id,a){const e=$(id);e.innerHTML='<span class="av"></span><div class="in"><div class="n"></div><div class="t"></div><div class="d"></div></div>';setAv(e.firstChild,a)}
function drawT(){[['p1',O()],['p2',M()]].forEach(([id,x])=>{const e=$(id),c=e.children[1].children,s=Math.max(0,Math.min(SKIPS,S[x]|0));e.className='pl'+(playing&&turn==x?' on':'');c[0].textContent=names[x]+(x==me&&!local?' (أنت)':'');c[1].textContent=(Math.max(0,T[x])/1000).toFixed(1);c[1].className='t'+(T[x]<1e4?' low':'');c[2].textContent='تخطي '+'●'.repeat(s)+'○'.repeat(SKIPS-s)})}
function lr(){const f='✓ '+cur().d;C[turn]++;idx++;turn=turn=='a'?'b':'a';flash(f,1);draw()}
function ls(){if(S[turn]<1){flash('انتهت تخطياتك');return}const f='كانت: '+cur().d;S[turn]--;idx++;flash(f);draw()}
function ask(type){pending=1;setTimeout(()=>pending=0,1500);send({type})}
function right(){if(local)return lr();if(!pending)ask('minute_ok')}
function skip(){if(local)return ls();if(S[turn]<1){flash('انتهت تخطياتك');return}if(!pending)ask('minute_skip')}
function judge(n){const r=n.startsWith(cons)?n.slice(cons.length).trim():n;if(!r)return;const w=r.split(' '),has=(a,z)=>a.includes(' ')?r.includes(a):w.some(x=>x==a||(z&&a.length>3&&lev(x,a)<=(a.length>6?2:1)));if(SK.some(a=>has(a,0))){cons=n;skip()}else if(cur().a.some(a=>has(a,1))){cons=n;right()}}
function hear(t,fin){if(!playing||!mine())return;const n=norm(t||'');if(!n){cons='';return}$('cap').textContent='🎙️ '+t;const now=Date.now();if(now-lc>250){lc=now;send({type:'minute_cap',t:String(t).slice(0,80)})}judge(n);if(fin)cons=''}
function typed(){const v=norm($('ti').value);$('ti').value='';cons='';if(v&&playing&&mine())judge(v)}
function apply(d){turn=d.turn=='b'?'b':'a';idx=+d.idx||0;T=nums(d.T);S=nums(d.S);C=nums(d.C);cons='';last=performance.now()}
function begin(d){const nn=d.names||{},av=d.avs||{};names={a:String(nn.a||'').slice(0,16)||'لاعب ١',b:String(nn.b||'').slice(0,16)||'لاعب ٢'};avs={a:String(av.a||'😊').slice(0,300),b:String(av.b||'😊').slice(0,300)};deck=(Array.isArray(d.deck)?d.deck:[]).filter(x=>x&&/^https:\/\//.test(x.u)&&Array.isArray(x.a)&&x.a.length).map(x=>({u:x.u,a:x.a.slice(0,40).map(String),d:String(x.d||'').slice(0,40)}));if(!deck.length)return;turn=d.turn=='b'?'b':'a';idx=0;T={a:TIME,b:TIME};S={a:SKIPS,b:SKIPS};C={a:0,b:0};cons='';pending=0;playing=1;last=performance.now();show('g');mkPanel('p1',avs[O()]);mkPanel('p2',avs[M()]);draw()}
async function go(){note('جاري تجهيز الأسئلة والصور…');let dk;try{dk=await makeDeck()}catch(e){note('تعذّر تحميل الأسئلة. تأكد من الإنترنت.');return}if(dk.length<6){note('عدد الأسئلة قليل، جرّب فئات أخرى.');return}note('');if(local)begin({deck:dk,turn:Math.random()<.5?'a':'b',names,avs});else send({type:'minute_start',deck:dk})}
function end(l,reason){if(!playing)return;playing=0;const w=l=='a'?'b':'a';$('rt').textContent=reason=='left'?'الخصم خرج، فزت 🏆':local?names[w]+' يفوز 🏆':(w==me?'فزت 🏆':'انتهى وقتك');$('rs').textContent=names.a+': '+C.a+' صحيحة  |  '+names.b+': '+C.b+' صحيحة';$('ra').hidden=!(local||me=='a')||oppLeft;show('r')}

// ===== المكالمة الصوتية (WebRTC) — السيرفر بس يمرر الإشارات =====
function initCall(init){
 if(pc||!stream)return;
 pc=new RTCPeerConnection({iceServers:ICE});
 stream.getTracks().forEach(t=>pc.addTrack(t,stream));
 pc.onicecandidate=e=>{if(e.candidate)send({type:'minute_sig',data:{c:e.candidate}})};
 pc.ontrack=e=>{$('au').srcObject=e.streams[0];$('au').play().catch(()=>{})};
 if(init)pc.createOffer().then(o=>pc.setLocalDescription(o)).then(()=>send({type:'minute_sig',data:{d:pc.localDescription}})).catch(()=>{});
}
async function onSig(s){
 if(!s)return;
 if(!pc)initCall(0);
 if(!pc)return;
 try{
  if(s.d){await pc.setRemoteDescription(s.d);for(const c of qIce.splice(0))await pc.addIceCandidate(c);if(s.d.type=='offer'){const a=await pc.createAnswer();await pc.setLocalDescription(a);send({type:'minute_sig',data:{d:pc.localDescription}})}}
  else if(s.c){if(pc.remoteDescription)await pc.addIceCandidate(s.c);else qIce.push(s.c)}
 }catch(e){}
}

// ===== التعرف على الصوت: Chrome (المتصفح) أو إضافة Capacitor (داخل APK) =====
const track=()=>stream&&stream.getAudioTracks()[0];
function runRec(){try{rec.start(track())}catch(e){try{rec.start()}catch(e2){}}}
function nrun(){NSR.start({language:$('lg').value,maxResults:3,partialResults:true,popup:false}).catch(()=>{})}
async function startRec(){
 want=1;
 if(NSR){
  try{
   const p=await NSR.requestPermissions();
   if(p.speechRecognition!='granted'){want=0;return note('المايك مرفوض. فعّله من إعدادات التطبيق.')}
   await NSR.removeAllListeners();
   await NSR.addListener('partialResults',e=>hear((e.matches||[]).join(' '),0));
   await NSR.addListener('listeningState',e=>{$('mc').classList.toggle('live',e.status=='started');if(e.status=='stopped'){cons='';if(want)setTimeout(nrun,300)}});
   nrun();
  }catch(e){note('تعذّر تشغيل التعرف على الصوت.')}
  return;
 }
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){want=0;return note(NATIVE?'إضافة الصوت غير مثبتة في التطبيق. اكتب الإجابة.':'التعرف على الصوت يحتاج متصفح Chrome. اكتب الإجابة.')}
 if(rec){try{rec.abort()}catch(e){}}
 rec=new SR();rec.lang=$('lg').value;rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=3;
 rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];hear(Array.from(r).map(a=>a.transcript).join(' '),r.isFinal)}};
 rec.onstart=()=>$('mc').classList.add('live');
 rec.onend=()=>{$('mc').classList.remove('live');if(want)setTimeout(runRec,200)};
 rec.onerror=e=>{if(/not-allowed|service-not-allowed/.test(e.error)){want=0;note('المايك مرفوض. فعّله من إعدادات المتصفح.')}};
 runRec();
}
async function prep(){stream=null;if(!local&&$('vc').checked){try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch(e){note('تعذّر تشغيل المايك. اسمح للتطبيق باستخدامه.')}}startRec()}

// ===== الاتصال بالسيرفر =====
// يفتح اتصال WebSocket ويعيد المحاولة تلقائيًا: السيرفر المجاني ينام بعد 15 دقيقة ويحتاج حوالي دقيقة ليصحى
function openSocket(onOpen,onWait){
 const t0=Date.now();
 (function attempt(){
  const s=new WebSocket(WS_URL);let done=0;
  const retry=()=>{if(done)return;done=1;try{s.close()}catch(e){}
   const sec=Math.round((Date.now()-t0)/1000);
   if(sec>150){onWait(-1);return}
   onWait(sec);setTimeout(attempt,3000)};
  s.onopen=()=>{if(done)return;done=1;onOpen(s)};
  s.onerror=retry;s.onclose=retry;setTimeout(retry,20000);
 })();
}
const waitMsg=sec=>sec<0?'السيرفر ما رد. جرّب بعد شوي.':'السيرفر نايم وبيصحى… '+sec+' ث (يحتاج حوالي دقيقة)';
let connecting=0;
function connect(first){
 connecting=1;
 openSocket(s=>{
  connecting=0;ws=s;
  ws.onmessage=e=>{try{onMsg(JSON.parse(e.data))}catch(err){}};
  ws.onclose=()=>{if(playing){playing=0;$('rt').textContent='انقطع الاتصال بالسيرفر';$('rs').textContent='';$('ra').hidden=1;show('r')}else if(!$('l').hidden)show('h')};
  send({type:'set_name',name:myName});first();
 },sec=>{note(waitMsg(sec));if(sec<0)connecting=0});
}
async function online(msg){if(connecting||(ws&&ws.readyState<2))return;local=0;await prep();note('جاري الاتصال بالسيرفر…');connect(()=>send(Object.assign({avatar:myAv},msg)))}
function onMsg(m){switch(m.type){
 case 'minute_room':me=m.seat=='b'?'b':'a';show('l');$('rc').textContent=m.priv?m.rid:'';$('wt').textContent=m.priv?'رمز الغرفة، أرسله لصاحبك':'جاري البحث عن خصم…';break;
 case 'minute_ready':{me=m.seat=='b'?'b':'a';(m.players||[]).forEach(q=>{if(q.seat=='a'||q.seat=='b'){names[q.seat]=String(q.name||'').slice(0,16)||names[q.seat];avs[q.seat]=String(q.avatar||'😊').slice(0,300)}});show('l');$('rc').textContent='';$('wt').textContent='خصمك: '+names[O()]+' ✓ — '+(me=='a'?'جاري تجهيز الأسئلة…':'بانتظار تجهيز الأسئلة…');initCall(me=='a');if(me=='a')setTimeout(go,1500);break}
 case 'minute_go':begin(m);break;
 case 'minute_st':if(!playing)break;apply(m);pending=0;if(m.f)flash(String(m.f).slice(0,40),String(m.f)[0]=='✓');draw();break;
 case 'minute_end':if(!playing)break;apply(m);end(m.l=='b'?'b':'a',m.reason);break;
 case 'minute_sig':onSig(m.data);break;
 case 'minute_cap':if(playing&&!mine())$('cap').textContent='🎙️ '+names[O()]+': '+String(m.t||'').slice(0,80);break;
 case 'player_left':oppLeft=1;if(!playing)note('الخصم خرج من الغرفة');break;
 case 'err':note(String(m.msg||'خطأ'));break;
}}

// ===== إيقاظ السيرفر عند فتح الصفحة (نعرض للاعب حالته قبل ما يضغط) =====
if(!/localhost|127\.0\.0\.1/.test(WS_URL)){
 fetch(WS_URL.replace(/^ws/,'http'),{mode:'no-cors',cache:'no-store'}).catch(()=>{});
 openSocket(s=>{if(!connecting&&!ws)$('nt').textContent='السيرفر جاهز ✓';s.close()},sec=>{if(!connecting&&!ws)$('nt').textContent=waitMsg(sec)});
}
// ===== الواجهة =====
setAv($('myAv'),myAv);$('myNm').textContent=myName;
if(Q.get('room'))$('cd').value=Q.get('room').toUpperCase().slice(0,8);
CATS.forEach((c,i)=>{const b=document.createElement('button');b.className='chip';b.textContent=c.e+' '+c.n;b.setAttribute('aria-pressed','false');b.onclick=()=>{sel.has(i)?sel.delete(i):sel.add(i);b.setAttribute('aria-pressed',sel.has(i))};$('ct').append(b)});
$('bq').onclick=()=>online({type:'minute_quick'});
$('bc').onclick=()=>online({type:'minute_create'});
$('bj').onclick=()=>{const c=$('cd').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(c)online({type:'minute_join',rid:c})};
$('bl').onclick=async()=>{local=1;names={a:myName,b:'لاعب ٢'};avs={a:myAv,b:'😎'};await prep();go()};
$('ra').onclick=go;
$('sk').onclick=()=>{if(playing&&mine())skip()};
$('mc').onclick=()=>{want=1;startRec()};
$('ts').onclick=typed;$('ti').onkeydown=e=>{if(e.key=='Enter')typed()};
// الخروج: زر ✕ وزر الرجوع في الجوال يفتحون نفس نافذة التأكيد (مثل مليون)
function doLeave(){want=0;try{ws&&ws.close()}catch(e){}try{NSR&&NSR.stop()}catch(e){}try{rec&&rec.abort()}catch(e){}if(stream)stream.getTracks().forEach(t=>t.stop());if(document.referrer&&document.referrer.indexOf(location.origin)===0)location.href=document.referrer;else location.href='../index.html'}
window.addEventListener('popstate',()=>{$('xc').classList.add('show');history.pushState(null,'',location.href)});
history.pushState(null,'',location.href);
$('xb').onclick=()=>$('xc').classList.add('show');$('xs').onclick=()=>$('xc').classList.remove('show');$('xl').onclick=doLeave;$('rh').onclick=doLeave;
setInterval(()=>{const n=performance.now(),dt=n-last;last=n;if(!playing)return;T[turn]-=dt;if(T[turn]<=0){T[turn]=0;if(local)end(turn)}drawT()},100);
