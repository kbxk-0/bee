// ===== إعدادات تقدر تعدلها =====
const Q=new URLSearchParams(location.search);
const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]; // لو المكالمة ما اتصلت أضف TURN هنا
const TIME=60000,SKIPS=3,DECK=40,STALE=45000,HAND=500,CDMS=3000; // HAND: توقف نص ثانية بعد كل إجابة صحيحة، CDMS: عدّ 3-2-1 في البداية
const $=id=>document.getElementById(id);
const dec=s=>{try{return decodeURIComponent(s)}catch(e){return s}};
const myName=dec(Q.get('name')||'').slice(0,16)||'لاعب',myAv=dec(Q.get('avatar')||'')||'😊';
const norm=s=>String(s).toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim().split(' ').map(w=>w.length>3&&w.startsWith('ال')?w.slice(2):w).join(' ');
const lev=(a,b)=>{const m=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return m[a.length][b.length]};
const STOP=new Set(['flag','of','the','and','city','al','bin','ibn','mohamed','mohammed','muhammad','ahmed','abdel','abdul','abdullah','محمد','احمد','عبد','عبدالله','بن','ابن','علم'].map(norm));
const SK=['skip','سكيب','اسكيب','تخطي','تخطى','باس','pass'].map(norm);
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const NSR=NATIVE&&Capacitor.Plugins&&Capacitor.Plugins.SpeechRecognition; // إضافة الصوت داخل APK
const FB=!!(typeof auth!=='undefined'&&typeof db!=='undefined'&&auth&&db); // لو Firebase ما تحمّل نشتغل بوضع البوت والجهاز الواحد
let me='a',local=0,bot=0,playing=0,pending=0,oppLeft=0,busy=0,fin=0,called=0,deck=[],idx=0,turn='a',T={a:TIME,b:TIME},S={a:SKIPS,b:SKIPS},C={a:0,b:0},G=null,names={a:'لاعب ١',b:'لاعب ٢'},avs={a:'😊',b:'😊'},cons='',last=0,ft,bt,qt,rid='',uid='',offset=0,sel=new Set(),stream,pc,qIce=[],rec,want=0,LS=[],pauseUntil=0,startPhase=0,cdn=0,lastLow=0,heard='',matched=0,fails=0,badAt=0;
const M=()=>local?'a':me,O=()=>M()=='a'?'b':'a',mine=()=>(local&&!bot)||turn==me,cur=()=>deck[idx%deck.length];
const cdLeft=()=>local?pauseUntil-performance.now():(G?G.ts-now():0),inCD=()=>startPhase&&cdLeft()>0,canAct=()=>local?performance.now()>=pauseUntil:!!G&&now()>=G.ts;
const show=id=>['h','l','g','r'].forEach(x=>$(x).hidden=x!=id);
const note=m=>{$('nt').textContent=$('wt').textContent=m;if(!$('r').hidden&&m)$('rs').textContent=m};
const cleanAv=a=>{a=String(a||'😊');return a.length>300?'😊':a};
const safeAv=a=>/^(https:\/\/|data:image\/)/.test(a)?a:null;
function setAv(el,a,nm){el.textContent='';const u=safeAv(a);if(u){const i=new Image();i.referrerPolicy='no-referrer';i.alt='';i.onerror=()=>{el.textContent=String(nm||'?').trim().charAt(0)||'?'};i.src=u;el.append(i)}else el.textContent=String(a||'😊').slice(0,4)}

// ===== الأصوات: نغمات مصنوعة بالكود (ما تحتاج ملفات ولا أذونات) =====
const Snd=(()=>{let ctx,on=true;try{on=localStorage.getItem('minute_snd')!=='0'}catch(e){}
 const ac=()=>{try{if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(A)ctx=new A()}if(ctx&&ctx.state=='suspended')ctx.resume()}catch(e){}return ctx};
 const tone=(f,t0,d,type,v)=>{if(!on)return;const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+t0;o.type=type||'sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.25,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.05)};
 return{unlock:ac,get on(){return on},toggle(){on=!on;try{localStorage.setItem('minute_snd',on?'1':'0')}catch(e){}return on},
  ok(){tone(660,0,.12,'triangle');tone(990,.09,.2,'triangle')},bad(){tone(200,0,.22,'sawtooth',.18)},skip(){tone(380,0,.09,'square',.12);tone(300,.08,.12,'square',.12)},
  tick(){tone(540,0,.12,'sine',.3)},go(){tone(1080,0,.4,'triangle',.35)},turn(){tone(880,0,.1,'sine',.22);tone(1175,.1,.12,'sine',.22)},low(){tone(1400,0,.05,'square',.1)},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,i*.12,.25,'triangle',.28))},lose(){[392,330,262].forEach((f,i)=>tone(f,i*.2,.32,'sine',.25))}}})();
document.addEventListener('pointerdown',Snd.unlock);

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
function draw(){const c=cur(),im=$('im');im.textContent='';
 if(inCD()){const d=document.createElement('div');d.className='cdn';d.textContent=Math.max(1,Math.ceil(cdLeft()/1000));im.append(d)}
 else{const i=new Image();i.referrerPolicy='no-referrer';i.alt='';i.src=c.u;im.append(i)}
 $('tw').className='tw '+(mine()?'me ':'opp ')+(c.u.includes('simpleicons')&&!inCD()?'logo':'');
 $('hint').textContent=inCD()?'استعد…':(mine()?'دورك! قُل الإجابة':'دور '+names[turn]);$('cap').textContent='';
 const n=deck[(idx+1)%deck.length];if(n)new Image().src=n.u;drawTB();drawT();if(bot)botMove()}
function drawTB(){const e=$('tb');let t,c;
 if(inCD()){t='استعد… 🎬';c='wait'}else if(local&&!bot){t='🎙️ دور '+names[turn];c='me'}else if(mine()){t='🎙️ دورك — قُل الإجابة!';c='me'}else{t='⏳ دور '+names[turn];c='opp'}
 e.textContent=t;e.className=c}
function mkPanel(id,a,n){const e=$(id);e.innerHTML='<span class="av"></span><div class="in"><div class="n"></div><div class="t"></div><div class="d"></div></div>';setAv(e.firstChild,a,n)}
function drawT(){[['p1',O()],['p2',M()]].forEach(([id,x])=>{const e=$(id),c=e.children[1].children,s=Math.max(0,Math.min(SKIPS,S[x]|0));e.className='pl'+(playing&&turn==x?' on':'');c[0].textContent=names[x]+(x==me&&!local?' (أنت)':'');c[1].textContent=(Math.max(0,T[x])/1000).toFixed(1);c[1].className='t'+(T[x]<1e4?' low':'');c[2].textContent='تخطي '+'●'.repeat(s)+'○'.repeat(SKIPS-s)})}
function lr(){const f='✓ '+cur().d;C[turn]++;idx++;turn=turn=='a'?'b':'a';pauseUntil=performance.now()+HAND;Snd.ok();if(!bot||turn=='a')setTimeout(Snd.turn,260);flash(f,1);draw()}
function ls(){if(S[turn]<1){flash('انتهت تخطياتك');Snd.bad();return}const f='كانت: '+cur().d;S[turn]--;idx++;Snd.skip();flash(f);draw()}
// البوت: يجاوب صح 72% من المرات وكل مرة يفكر من 1 إلى 4 ثواني (للعب بدون خصم حقيقي)
function botMove(){clearTimeout(bt);if(!bot||!playing||turn!='b')return;bt=setTimeout(()=>{if(!playing||turn!='b')return;if(!canAct()){botMove();return}const r=Math.random();if(r<.72)lr();else if(S.b>0)ls();else botMove()},900+Math.random()*3200)}
function act(ok){
 if(pending||!G||G.turn!==me||!canAct())return;pending=1;setTimeout(()=>pending=0,2000);const seq=G.seq;
 rr().child('g').transaction(g=>{
  if(!g||g.turn!==me||g.seq!==seq)return;
  const t=now(),el=Math.max(0,t-g.ts);if(g.T[me]-el<=0)return;
  const d=deck[(g.idx||0)%deck.length].d;g.T[me]-=el;
  if(ok){g.C[me]++;g.turn=me=='a'?'b':'a';g.f='✓ '+d}
  else{if(g.S[me]<1)return;g.S[me]--;g.f='كانت: '+d}
  g.idx++;g.ts=ok?t+HAND:t;g.seq=seq+1;return g});
}
function right(){if(!canAct())return;matched=1;if(local)return lr();act(1)}
function skip(){if(!canAct())return;matched=1;if(local)return ls();if(S[turn]<1){flash('انتهت تخطياتك');Snd.bad();return}act(0)}
function judge(n){const r=n.startsWith(cons)?n.slice(cons.length).trim():n;if(!r)return;const w=r.split(' '),has=(a,z)=>a.includes(' ')?r.includes(a):w.some(x=>x==a||(z&&a.length>3&&lev(x,a)<=(a.length>6?2:1)));if(SK.some(a=>has(a,0))){cons=n;skip()}else if(cur().a.some(a=>has(a,1))){cons=n;right()}}
function endUtt(){if(heard&&!matched&&Date.now()-badAt>800){Snd.bad();badAt=Date.now()}heard='';matched=0}
function hear(t,fin2){if(!playing||!mine()||!canAct())return;const n=norm(t||'');if(!n){endUtt();cons='';return}$('cap').textContent='🎙️ '+t;if(!heard)matched=0;heard=n;judge(n);if(fin2){endUtt();cons=''}}
function typed(){const v=norm($('ti').value);$('ti').value='';cons='';if(v&&playing&&mine())judge(v);matched=0}
function applyG(g){const pt=turn,oc=C?(C[pt]|0):0,os=S?(S.a+S.b):0;
 turn=g.turn=='b'?'b':'a';idx=+g.idx||0;S=g.S||S;C=g.C||C;cons='';pending=0;G=g;
 if(g.seq>1){if((C[pt]|0)>oc){Snd.ok();if(turn==me)setTimeout(Snd.turn,260)}else if(S.a+S.b<os)Snd.skip();if(g.f)flash(String(g.f).slice(0,40),String(g.f)[0]=='✓')}
 draw()}
function begin(d){const nn=d.names||{},av=d.avs||{};names={a:String(nn.a||'').slice(0,16)||'لاعب ١',b:String(nn.b||'').slice(0,16)||'لاعب ٢'};avs={a:String(av.a||'😊').slice(0,300),b:String(av.b||'😊').slice(0,300)};deck=(Array.isArray(d.deck)?d.deck:[]).filter(x=>x&&/^https:\/\//.test(x.u)&&Array.isArray(x.a)&&x.a.length).map(x=>({u:x.u,a:x.a.slice(0,40).map(String),d:String(x.d||'').slice(0,40)}));if(!deck.length)return;turn=d.turn=='b'?'b':'a';idx=0;T={a:TIME,b:TIME};S={a:SKIPS,b:SKIPS};C={a:0,b:0};cons='';pending=0;fin=0;heard='';matched=0;startPhase=1;cdn=0;if(local)pauseUntil=performance.now()+CDMS;playing=1;last=performance.now();show('g');mkPanel('p1',avs[O()],names[O()]);mkPanel('p2',avs[M()],names[M()]);draw();if(!want)startRec()}
async function go(){
 note('جاري تجهيز الأسئلة والصور…');let dk;
 try{dk=await makeDeck()}catch(e){note('تعذّر تحميل الأسئلة. تأكد من الإنترنت.');return}
 if(dk.length<6){note('عدد الأسئلة قليل، جرّب فئات أخرى.');return}note('');
 const first=Math.random()<.5?'a':'b';
 if(local)return begin({deck:dk,turn:first,names,avs});
 await rr().update({deck:dk,g:{turn:first,idx:0,T:{a:TIME,b:TIME},S:{a:SKIPS,b:SKIPS},C:{a:0,b:0},ts:now()+CDMS,seq:1,f:''},end:null,status:'playing'});
}
function end(l,reason){if(!playing)return;playing=0;clearTimeout(bt);const w=l=='a'?'b':'a';$('rt').textContent=reason=='left'?'الخصم خرج، فزت 🏆':bot?(w=='a'?'فزت 🏆':'البوت فاز 🤖'):local?names[w]+' يفوز 🏆':(w==me?'فزت 🏆':'انتهى وقتك');$('rs').textContent=names.a+': '+C.a+' صحيحة  |  '+names.b+': '+C.b+' صحيحة';$('ra').hidden=!(local||me=='a')||oppLeft;(reason=='left'||(bot?w=='a':local?true:w==me))?Snd.win():Snd.lose();show('r')}
function finish(l,reason){if(fin)return;fin=1;const r=rr();r.child('status').transaction(s=>s==='playing'?'over':undefined).then(x=>{if(x.committed)r.child('end').set({l,reason})})}
// ===== المكالمة الصوتية (WebRTC) — Firebase بس يمرر الإشارات =====
function initCall(init){
 if(pc||!stream)return;
 pc=new RTCPeerConnection({iceServers:ICE});
 stream.getTracks().forEach(t=>pc.addTrack(t,stream));
 pc.onicecandidate=e=>{if(e.candidate)sigSend({c:e.candidate})};
 pc.ontrack=e=>{$('au').srcObject=e.streams[0];$('au').play().catch(()=>{})};
 if(init)pc.createOffer().then(o=>pc.setLocalDescription(o)).then(()=>sigSend({d:pc.localDescription})).catch(()=>{});
}
async function onSig(s){
 if(!s)return;
 if(!pc)initCall(0);
 if(!pc)return;
 try{
  if(s.d){await pc.setRemoteDescription(s.d);for(const c of qIce.splice(0))await pc.addIceCandidate(c);if(s.d.type=='offer'){const a=await pc.createAnswer();await pc.setLocalDescription(a);sigSend({d:pc.localDescription})}}
  else if(s.c){if(pc.remoteDescription)await pc.addIceCandidate(s.c);else qIce.push(s.c)}
 }catch(e){}
}

function sigSend(d){if(!rid)return;const r=rr();if(d.d)r.child('sig/'+d.d.type).set({type:d.d.type,sdp:d.d.sdp});else if(d.c)r.child('sig/i'+me).push(JSON.parse(JSON.stringify(d.c)))}

// ===== التعرف على الصوت: Chrome (المتصفح) أو إضافة Capacitor (داخل APK) =====
function mstat(m,err){const e=$('ms');if(!e)return;e.textContent=m||'';e.style.color=err?'var(--bad)':''}
const track=()=>stream&&stream.getAudioTracks()[0];
function runRec(){try{rec.start(track())}catch(e){try{rec.start()}catch(e2){}}}
function nrun(){NSR.start({language:$('lg').value,maxResults:3,partialResults:true,popup:false,allowForSilence:6000}).catch(e=>{fails++;mstat('⚠️ '+(e&&(e.message||e.code)||'خطأ في المايك'),1);if(want)setTimeout(nrun,Math.min(4000,400*fails))})}
async function startRec(){
 want=1;mstat('جاري تجهيز المايك…');
 if(NSR){
  try{
   try{const a=await NSR.available();if(a&&a.available===false){want=0;return mstat('⚠️ التعرف على الصوت غير متوفر في جوالك (تأكد من تطبيق Google)',1)}}catch(e){}
   try{const p=await NSR.requestPermissions();if(p&&p.speechRecognition==='denied'){want=0;return mstat('⚠️ المايك مرفوض. فعّله من إعدادات التطبيق',1)}}catch(e){}
   await NSR.removeAllListeners();
   await NSR.addListener('partialResults',e=>{fails=0;mstat('🎙️ يسمعك…');hear((e.matches||[]).join(' '),0)});
   await NSR.addListener('listeningState',e=>{const on=e.status=='started';$('mc').classList.toggle('live',on);if(on)mstat('🎙️ يسمعك…');else{endUtt();cons='';if(want){fails++;setTimeout(nrun,Math.min(3000,250*fails))}}});
   nrun();
  }catch(e){mstat('⚠️ تعذّر تشغيل التعرف على الصوت: '+(e&&(e.message||e.code)||e),1)}
  return;
 }
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){want=0;return mstat(NATIVE?'⚠️ إضافة الصوت غير مثبتة في التطبيق. اكتب الإجابة.':'⚠️ التعرف على الصوت يحتاج متصفح Chrome. اكتب الإجابة.',1)}
 if(rec){try{rec.abort()}catch(e){}}
 rec=new SR();rec.lang=$('lg').value;rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=3;
 rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];hear(Array.from(r).map(a=>a.transcript).join(' '),r.isFinal)}};
 rec.onstart=()=>{$('mc').classList.add('live');mstat('🎙️ يسمعك…')};
 rec.onend=()=>{$('mc').classList.remove('live');if(want)setTimeout(runRec,200)};
 rec.onerror=e=>{if(/not-allowed|service-not-allowed/.test(e.error)){want=0;mstat('⚠️ المايك مرفوض. فعّله من إعدادات المتصفح',1)}else if(!/no-speech|aborted/.test(e.error))mstat('⚠️ '+e.error,1)};
 runRec();
}
async function prep(){stream=null;if(!local&&$('vc').checked){try{stream=await Promise.race([navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}),new Promise((_,j)=>setTimeout(()=>j(new Error('انتهت المهلة')),5000))])}catch(e){mstat('⚠️ تعذّر تشغيل المكالمة: '+(e&&(e.name||e.message)||''),1)}}startRec()}

// ===== الاتصال: Firebase Realtime Database (شغّال دايمًا وما ينام، وما نحتاج سيرفر) =====
if(FB)db.ref('.info/serverTimeOffset').on('value',s=>{offset=s.val()||0});
const now=()=>Date.now()+offset;
const authP=FB?new Promise(res=>auth.onAuthStateChanged(u=>{uid=u?u.uid:'';res(uid)})):Promise.resolve('');
const rr=()=>db.ref('minute/rooms/'+rid),rnd=()=>Math.random().toString(36).slice(2,6).toUpperCase(),seat=()=>({uid,name:myName,av:cleanAv(myAv)});
function on(r,ev,cb){r.on(ev,cb);LS.push([r,ev,cb])}
function unwatch(){LS.forEach(([r,e,c])=>{try{r.off(e,c)}catch(x){}});LS=[]}
async function createRoom(id,priv){const r=db.ref('minute/rooms/'+id);await r.set({a:seat(),status:'waiting',priv:!!priv,t:now()});r.onDisconnect().remove()}
function removeRoom(id){const r=db.ref('minute/rooms/'+id);r.onDisconnect().cancel();return r.remove()}
function hostWait(id,priv,q){
 me='a';rid=id;names.a=myName;avs.a=myAv;called=0;oppLeft=0;watchRoom();show('l');
 $('rc').textContent=priv?id:'';$('wt').textContent=priv?'رمز الغرفة، أرسله لصاحبك':'جاري البحث عن خصم…';
 if(q)qt=setInterval(()=>db.ref('minute/queue').transaction(c=>c&&c.rid===id?{rid:id,uid,ts:now()}:c),20000);
}
async function quick(){
 for(let i=0;i<4;i++){
  const mine=rnd();await createRoom(mine,false);let took=null;
  const res=await db.ref('minute/queue').transaction(c=>{if(c&&c.rid&&c.uid!==uid&&now()-c.ts<STALE){took=c.rid;return null}took=null;return{rid:mine,uid,ts:now()}});
  if(!res.committed){await removeRoom(mine);continue}
  if(took){await removeRoom(mine);if(await joinRoom(took))return;continue}
  return hostWait(mine,false,true);
 }
 note('ما لقيت خصم الحين. جرّب بعد شوي أو العب ضد البوت.');
}
async function joinRoom(id){
 const r=db.ref('minute/rooms/'+id),v=(await r.once('value')).val();
 if(!v||!v.a||v.b||v.status!=='waiting')return false;
 const res=await r.child('b').transaction(c=>c?undefined:seat());
 if(!res.committed)return false;
 me='b';rid=id;called=0;oppLeft=0;names.b=myName;avs.b=myAv;
 r.child('left/b').onDisconnect().set(true);await r.child('status').set('ready');
 watchRoom();show('l');$('wt').textContent='تم الانضمام…';return true;
}
async function startFromRoom(){
 const r=rr(),[d,g]=await Promise.all([r.child('deck').once('value'),r.child('g').once('value')]);
 if(playing)return;G=g.val();if(!G||!d.val())return;
 begin({deck:d.val(),turn:G.turn,names,avs});applyG(G);
}
function watchRoom(){
 unwatch();const r=rr(),o=me=='a'?'b':'a';
 on(r.child(o),'value',s=>{const v=s.val();if(!v)return;
  names[o]=String(v.name||'').slice(0,16)||names[o];avs[o]=String(v.av||'😊').slice(0,300);
  if(playing||called)return;called=1;clearInterval(qt);show('l');$('rc').textContent='';
  $('wt').textContent='خصمك: '+names[o]+' ✓ — '+(me=='a'?'جاري تجهيز الأسئلة…':'بانتظار تجهيز الأسئلة…');
  initCall(me=='a');
  if(me=='a'){r.onDisconnect().cancel();r.child('left/a').onDisconnect().set(true);setTimeout(go,1500)}});
 on(r.child('status'),'value',s=>{if(s.val()==='playing'&&!playing)startFromRoom()});
 on(r.child('g'),'value',s=>{const g=s.val();if(!g)return;G=g;if(playing)applyG(g)});
 on(r.child('end'),'value',s=>{const e=s.val();if(e&&playing)end(e.l=='b'?'b':'a',e.reason)});
 on(r.child('left/'+o),'value',s=>{if(s.val()!==true)return;oppLeft=1;if(playing)finish(o,'left');else if(!$('r').hidden)$('ra').hidden=1;else note('الخصم خرج من الغرفة')});
 on(r.child('sig/'+(me=='a'?'answer':'offer')),'value',s=>{if(s.exists())onSig({d:s.val()})});
 on(r.child('sig/i'+o),'child_added',s=>onSig({c:s.val()}));
}
async function online(kind,code){
 if(busy)return;busy=1;
 try{
  if(!FB){note('تعذّر تحميل Firebase. تأكد من الإنترنت.');return}
  if(!await authP){note('سجّل دخولك من التطبيق أول، وبعدين افتح اللعبة.');return}
  local=0;bot=0;prep();note('جاري الاتصال…');
  if(kind=='quick')await quick();
  else if(kind=='create'){const id=rnd();await createRoom(id,true);hostWait(id,true,false)}
  else if(!await joinRoom(code))note('الغرفة غير موجودة أو ممتلئة.');
 }catch(e){note('تعذّر الاتصال: '+(e&&(e.code||e.message)||'خطأ'))}
 finally{busy=0}
}

// ===== الواجهة =====
if(NATIVE||/Android|iPhone|iPad/i.test(navigator.userAgent))$('vc').checked=false; // المكالمة والتعرف على الصوت يتنافسون على المايك في أغلب الجوالات، فنوقف المكالمة افتراضيًا
$('sn').textContent=Snd.on?'🔊':'🔇';$('sn').onclick=()=>{$('sn').textContent=Snd.toggle()?'🔊':'🔇'};
setAv($('myAv'),myAv,myName);$('myNm').textContent=myName;
if(Q.get('room'))$('cd').value=Q.get('room').toUpperCase().slice(0,8);
CATS.forEach((c,i)=>{const b=document.createElement('button');b.className='chip';b.textContent=c.e+' '+c.n;b.setAttribute('aria-pressed','false');b.onclick=()=>{sel.has(i)?sel.delete(i):sel.add(i);b.setAttribute('aria-pressed',sel.has(i))};$('ct').append(b)});
$('bq').onclick=()=>online('quick');
$('bc').onclick=()=>online('create');
$('bj').onclick=()=>{const c=$('cd').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(c)online('join',c)};
$('bb').onclick=async()=>{local=1;bot=1;me='a';names={a:myName,b:'البوت 🤖'};avs={a:myAv,b:'🤖'};await prep();go()};
$('bl').onclick=async()=>{local=1;bot=0;me='a';names={a:myName,b:'لاعب ٢'};avs={a:myAv,b:'😎'};await prep();go()};
$('ra').onclick=go;
$('sk').onclick=()=>{if(playing&&mine())skip()};
$('mc').onclick=()=>{want=1;startRec()};
$('ts').onclick=typed;$('ti').onkeydown=e=>{if(e.key=='Enter')typed()};
// الخروج: زر ✕ وزر الرجوع في الجوال يفتحون نفس نافذة التأكيد (مثل مليون)
function doLeave(){
 want=0;clearInterval(qt);clearTimeout(bt);
 try{if(rid){const r=rr();r.child('left/'+me).set(true);if(me=='a'&&!called){r.onDisconnect().cancel();r.remove();db.ref('minute/queue').transaction(c=>c&&c.rid===rid?null:c)}}}catch(e){}
 try{NSR&&NSR.stop()}catch(e){}try{rec&&rec.abort()}catch(e){}
 if(stream)stream.getTracks().forEach(t=>t.stop());
 setTimeout(()=>{if(document.referrer&&document.referrer.indexOf(location.origin)===0)location.href=document.referrer;else location.href='../index.html'},200);
}
window.addEventListener('popstate',()=>{$('xc').classList.add('show');history.pushState(null,'',location.href)});
history.pushState(null,'',location.href);
$('xb').onclick=()=>$('xc').classList.add('show');$('xs').onclick=()=>$('xc').classList.remove('show');$('xl').onclick=doLeave;$('rh').onclick=doLeave;
// الساعة: اللعب المحلي ينقص من الجهاز، والأونلاين يحسب من وقت السيرفر (Firebase) فالاثنين يشوفون نفس الوقت
setInterval(()=>{
 const n=performance.now(),dt=n-last;last=n;if(!playing)return;
 if(startPhase){const l=cdLeft();if(l>0){const k=Math.ceil(l/1000);if(k!==cdn){cdn=k;Snd.tick();draw()}}else{startPhase=0;cdn=0;Snd.go();draw();if(mine())flash('انطلق! 🎙️',1)}}
 if(local){if(n>=pauseUntil){T[turn]-=dt;if(T[turn]<=0){T[turn]=0;end(turn)}}}
 else if(G){const el=Math.max(0,now()-G.ts),x=G.turn;T={a:G.T.a-(x=='a'?el:0),b:G.T.b-(x=='b'?el:0)};if(T[x]<=0&&(x==me||T[x]<-2500))finish(x,'time');
  if(x==me&&!inCD()&&T[x]>0&&T[x]<=5000){const k=Math.ceil(T[x]/1000);if(k!==lastLow){lastLow=k;Snd.low()}}}
 drawT();
},100);
