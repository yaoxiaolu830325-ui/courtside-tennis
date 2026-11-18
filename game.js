(()=>{'use strict';
const C=document.getElementById('court'),ctx=C.getContext('2d'),$=s=>document.querySelector(s),CORE={G,HALF_W,HALF_L,SERVICE,NET,clamp,attributeRating,playerReach,scorePoint,serveOutcome,makeShot,stepBall};
const roster=[
 {name:'ELI MORGAN',sex:'MEN',style:'Power baseline',speed:70,power:91,control:66,reach:79,stamina:74,color:'#c3e38a',skin:'#bc805c'},
 {name:'NOAH REYES',sex:'MEN',style:'All-court tactician',speed:81,power:75,control:87,reach:74,stamina:83,color:'#62d9d3',skin:'#b77750'},
 {name:'JULIAN VALE',sex:'MEN',style:'Serve & volley',speed:75,power:86,control:75,reach:88,stamina:67,color:'#ebcb9b',skin:'#e4b18d'},
 {name:'MAYA CHEN',sex:'WOMEN',style:'Relentless retriever',speed:92,power:66,control:83,reach:70,stamina:90,color:'#dfb4f4',skin:'#d4a078'},
 {name:'ZOE OKAFOR',sex:'WOMEN',style:'Heavy hitter',speed:76,power:88,control:72,reach:81,stamina:78,color:'#f6a881',skin:'#76503b'},
 {name:'LENA KOVAC',sex:'WOMEN',style:'Counterpuncher',speed:82,power:73,control:92,reach:76,stamina:81,color:'#f1d86e',skin:'#eac4a1'}
];
const opponents=[{name:'CLUB ROOKIE',speed:51,power:52,control:56,reach:53,stamina:55,color:'#92c1b9',skin:'#b8866b',sex:'MEN',style:'Learning the lines'},
 {name:'COURT RUNNER',speed:70,power:59,control:70,reach:68,stamina:76,color:'#e5c987',skin:'#d9a078',sex:'WOMEN',style:'Reads every corner'},
 {name:'THE STRIKER',speed:73,power:84,control:67,reach:78,stamina:70,color:'#ec9985',skin:'#ad7652',sex:'MEN',style:'First-strike pressure'},
 {name:'THE WALL',speed:82,power:67,control:88,reach:82,stamina:92,color:'#a5bafa',skin:'#a67150',sex:'WOMEN',style:'Nothing gets past her'},
 {name:'THE CHAMPION',speed:90,power:90,control:91,reach:88,stamina:91,color:'#eff3c2',skin:'#af765d',sex:'MEN',style:'The complete player'}];
let selected=0,mode='single',level=0,phase='menu',p={x:1.2,z:10.2,vx:0,vz:0,anim:0,arm:0},a={x:-1.2,z:-9.7,vx:0,vz:0,anim:0,arm:0},ball=null,score={p:0,a:0,winner:null},games={p:0,a:0},server='p',faults=0,pointIndex=0,pointTimer=0,serveMeter=.12,meterDir=1,aim={x:0,z:0},bias={x:0,z:0},keys={},swing=null,hitCount=0,lastHitter=null,lastServe=false,stats={aces:0,winners:0,faults:0,rally:0},banner='',bannerTimer=0,audio=true,sound=null,clock=0,aiThink=0,challengeBest=0;
try{challengeBest=+(localStorage.getItem('courtside.best')||0);audio=localStorage.getItem('courtside.sound')!=='off'}catch(e){}
function tone(f=420,seconds=.09,type='sine',vol=.08){if(!audio)return;try{sound=sound||new (window.AudioContext||window.webkitAudioContext)();const o=sound.createOscillator(),g=sound.createGain();o.type=type;o.frequency.setValueAtTime(f,sound.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(50,f*.72),sound.currentTime+seconds);g.gain.setValueAtTime(vol,sound.currentTime);g.gain.exponentialRampToValueAtTime(.001,sound.currentTime+seconds);o.connect(g);g.connect(sound.destination);o.start();o.stop(sound.currentTime+seconds)}catch(e){}}
function note(text,t=1.3){banner=text;bannerTimer=t;$('#message').textContent=text}
function show(html){$('#card').innerHTML=html;$('#overlay').classList.remove('hidden')}
function hide(){ $('#overlay').classList.add('hidden') }
const attrs=['speed','power','control','reach','stamina'];
function attrRow(r,key){return `<div class="attribute"><span>${key.toUpperCase()}</span><span class="track"><i style="width:${r[key]}%"></i></span><span>${r[key]}</span></div>`}
function menu(){phase='menu';$('#meter').classList.add('hidden');show(`<div class="eyebrow">THE SIXTH SHOT / TENNIS, UNDER PRESSURE</div><h1>Win with <em>timing.</em><br>Not a targeting line.</h1><p>Read the bounce. Run into position. Shape your shot with your movement. A clean contact sends a heavy flat drive; a lob buys time but gives your rival a chance to recover.</p><div class="actions"><button id="one" class="primary">SINGLE GAME</button><button id="career" class="secondary">FIVE-COURT CHALLENGE ${challengeBest?`· BEST ${challengeBest}/5`:''}</button></div><p class="muted">Six gameplay keys only: arrow keys run and steer, J flat / serve, K lob / kick serve. No virtual trajectory line.</p>`);$('#one').onclick=()=>choose('single');$('#career').onclick=()=>choose('challenge')}
function choose(which){mode=which;show(`<div class="eyebrow">${which==='single'?'EXHIBITION · ONE TENNIS GAME':'CAREER · FIVE OPPONENTS'}</div><h1>Choose your <em>player.</em></h1><p>Different strengths change foot speed, contact power, shot placement, reach and endurance. Select a player and read their attributes.</p><div class="roster" id="roster"></div><div class="actions"><button class="primary" id="start">TAKE THE COURT →</button><button class="secondary" id="back">BACK</button></div>`);const grid=$('#roster');grid.innerHTML=roster.map((r,i)=>`<button class="athlete ${i===selected?'chosen':''}" data-i="${i}"><span class="name">${r.name}</span><span class="trait">${r.sex} · ${r.style}</span><span class="rating">OVR ${attributeRating(r)}</span>${attrs.map(k=>attrRow(r,k)).join('')}</button>`).join('');grid.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=+b.dataset.i;grid.querySelectorAll('button').forEach(x=>x.classList.toggle('chosen',x===b))});$('#back').onclick=menu;$('#start').onclick=()=>startMatch(true)}
function startMatch(fresh){level=fresh?0:level;score={p:0,a:0,winner:null};games={p:0,a:0};pointIndex=0;server=mode==='challenge'&&level%2?'a':'p';stats={aces:0,winners:0,faults:0,rally:0};$('#playerName').textContent=roster[selected].name;$('#botName').textContent=opponents[mode==='single'?0:level].name;hide();nextPoint()}
function pointLabels(){let labels=['0','15','30','40'];if(score.p>=3&&score.a>=3){if(score.p===score.a)return 'DEUCE';return score.p>score.a?'ADVANTAGE YOU':'ADVANTAGE THEM'}return `${labels[Math.min(score.p,3)]} — ${labels[Math.min(score.a,3)]}`}
function updateUI(){let rival=opponents[mode==='single'?0:level];$('#playerScore').textContent=score.p>=3&&score.a>=3?(score.p>score.a?'AD':score.p===score.a?'40':'40'):(['0','15','30','40'][Math.min(score.p,3)]);
 $('#botScore').textContent=score.p>=3&&score.a>=3?(score.a>score.p?'AD':score.p===score.a?'40':'40'):(['0','15','30','40'][Math.min(score.a,3)]);
 $('#playerServe').textContent=server==='p'?'● SERVING':'PLAYER';$('#botServe').textContent=server==='a'?'● SERVING':'OPPONENT';$('#stage').textContent=mode==='single'?'EXHIBITION / ONE GAME':`CHALLENGE ${level+1} / 5 · ${rival.style.toUpperCase()}`;$('#set').textContent=`${games.p} — ${games.a}`;$('#scoreText').textContent=pointLabels();for(const k of ['aces','winners','faults','rally'])$('#'+k).textContent=stats[k]}
function nextPoint(){faults=0;ball=null;hitCount=0;lastHitter=null;lastServe=false;swing=null;aim={x:0,z:0};bias={x:0,z:0};serveMeter=.13;meterDir=1;
 const side=pointIndex%2===0?1:-1;p={x:side*1.2,z:10.5,vx:0,vz:0,anim:0,arm:0};a={x:-side*1.2,z:-10.5,vx:0,vz:0,anim:0,arm:0};phase='serve';aiThink=1.2;
 if(server==='p'){$('#meter').classList.remove('hidden');note('YOUR SERVE · AIM, THEN PRESS J',1.3)}else{$('#meter').classList.add('hidden');note('RECEIVE · WATCH THE TOSS',1.2)}updateUI()}
function aimShot(which){if(phase==='paused'||phase==='menu'||phase==='ended')return;if(phase==='serve'&&server==='p'){serveHuman(which);return}if(phase==='rally'){swing={type:which,life:.52};p.arm=.45;tryPlayerHit(which)}}
function serveHuman(which){let q=serveMeter,side=pointIndex%2===0?-1:1;
 let target={x:side*(1.5+Math.max(0,q-.83)*6)+aim.x,z:-4.8+(q-.78)*(-18)+aim.z};
 let power=(roster[selected].power-50)/150;let speed=20+q*12+power*5;
 let loft=which==='lob'?4.8:1.35;
 ball=makeShot({from:{x:p.x,z:10.8,h:2.3},to:target,speed,arc:loft,serve:true,serverSide:side});
 ball.by='p';lastHitter='p';lastServe=true;phase='rally';aiThink=.12+(90-opponents[mode==='single'?0:level].control)/410;$('#meter').classList.add('hidden');p.arm=.45;tone(335,0.15,'triangle',.13);
 if(q>.74&&q<.89&&Math.abs(aim.x)<1.3)note('CLEAN SERVE',.5);else if(q>.97)note('MAX POWER — HIGH RISK',.7)}
function serveAI(){let side=pointIndex%2===0?1:-1,r=opponents[mode==='single'?0:level];let risk=Math.random();let target={x:side*(1.1+Math.random()*1.6),z:4.4+Math.random()*.8};if(risk>.94)target.x=side*5.1;
 ball=makeShot({from:{x:a.x,z:-10.8,h:2.3},to:target,speed:20+r.power*.14,arc:1.7,serve:true,serverSide:side});ball.by='a';lastHitter='a';lastServe=true;phase='rally';a.arm=.45;tone(285,.14,'triangle',.11);note('OPPONENT SERVES',.6)}
function tryPlayerHit(which){if(!ball||ball.by==='p'||ball.ended)return false;
 let d=Math.hypot(ball.x-p.x,(ball.z-p.z)*.8),reach=playerReach({agility:roster[selected].speed,reach:roster[selected].reach},d,ball.h);
 if(ball.z<.0||!reach||ball.h<.18||ball.h>3.0)return false;
 let r=roster[selected],rival=opponents[mode==='single'?0:level],clean=Math.max(0,1-d/2.1),timing=Math.max(0,1-Math.abs(ball.h-1.18)/1.8),angle=Math.abs(ball.vx/(Math.abs(ball.vz)+.1));let critical=which==='flat'&&clean>.67&&timing>.72&&angle>.12;
 let targetX=clamp(-rival.x*.7+bias.x,-6.5,6.5);let targetZ=which==='lob'?-10.3:-8.3;targetZ+=bias.z;
 let netRisk=which==='flat'&&Math.random()<Math.max(.01,(95-r.control)/400 +(1-clean)*.035+(1-timing)*.04);if(netRisk)targetZ=-.35;
 let speed=(which==='lob'?12:19)+r.power*.13+(critical?8:0);let loft=which==='lob'?5.3:critical?1.8:2.5;
 let next=makeShot({from:{x:ball.x,z:ball.z,h:ball.h},to:{x:targetX,z:targetZ},speed,arc:loft});next.by='p';next.touched=true;ball=next;lastHitter='p';lastServe=false;hitCount++;stats.rally=Math.max(stats.rally,hitCount);p.arm=.5;bias={x:0,z:0};swing=null;tone(critical?540:375,.11,'triangle',critical?.14:.1);if(critical)note('POWER STRIKE',.75);else if(which==='lob')note('HIGH LOB',.6);updateUI();return true}
function tryAIHit(){if(!ball||ball.by==='a'||ball.ended||ball.z>=0||ball.h<.2||ball.h>2.8)return false;let r=opponents[mode==='single'?0:level],d=Math.hypot(a.x-ball.x,(a.z-ball.z)*.8);if(!playerReach({agility:r.speed,reach:r.reach},d,ball.h))return false;
 let lob=p.z<4&&Math.random()<.48,miss=Math.random()<(93-r.control)/1000;
 let tuning=mode==='single'?0:level,placement=aiReturnTarget(p,tuning,Math.random());
 let target={x:placement.x,z:lob?Math.min(10.9,placement.z+1):placement.z};if(miss)target.x=Math.sign(target.x||1)*4.7;
 let next=makeShot({from:{x:ball.x,z:ball.z,h:ball.h},to:target,speed:lob?placement.speed*.8:placement.speed,arc:lob?5.8:ball.h<.75?4.5:3.4});next.by='a';next.touched=true;ball=next;lastHitter='a';lastServe=false;hitCount++;stats.rally=Math.max(stats.rally,hitCount);a.arm=.42;tone(315,.11,'triangle',.10);updateUI();return true}
function point(who,label){if(phase==='point'||phase==='ended')return;phase='point';pointTimer=2.1;score=scorePoint(score,who);pointIndex++;
 if(label==='ACE'&&who==='p')stats.aces++;if(label==='WINNER'&&who==='p')stats.winners++;note(label+' · '+(who==='p'?'YOUR POINT':'OPPONENT POINT'),1.7);tone(who==='p'?690:180,.25,'sine',.12);updateUI();if(score.winner){games[score.winner]++;pointTimer=2.4}}
function handleEnded(){if(!ball?.ended)return;let reason=ball.ended,who=ball.by==='p'?'a':'p';if(ball.serve&&reason!=='double'&&!ball.legal){stats.faults+=(ball.by==='p');faults++;if(faults===1){phase='serve';ball=null;serveMeter=.16;meterDir=1;aiThink=1;$('#meter').classList.toggle('hidden',server!=='p');note('FAULT · SECOND SERVE',1.2);updateUI();return}point(who,'DOUBLE FAULT');return}
 if(reason==='net'){point(who,'INTO THE NET');return}if(reason==='out'){point(who,'OUT');return}
 if(reason==='double'){let label=ball.serve&&hitCount===0?'ACE':hitCount>0?'WINNER':'UNRETURNED';point(ball.by,label)} }
function finishGame(){if(!score.winner)return;let victory=score.winner==='p';if(mode==='challenge'&&victory){level++;challengeBest=Math.max(challengeBest,level);try{localStorage.setItem('courtside.best',String(challengeBest))}catch(e){}
 if(level<5){phase='ended';show(`<div class="eyebrow">COURT CLEARED · ${level}/5</div><h1>Next court, <em>harder rival.</em></h1><p>${opponents[level].name} · ${opponents[level].style}. Their footwork, placement and pace demand better timing.</p><div class="actions"><button id="continue" class="primary">NEXT MATCH →</button><button id="leave" class="secondary">MAIN MENU</button></div>`);$('#continue').onclick=()=>startMatch(false);$('#leave').onclick=menu;return}}
 phase='ended';show(`<div class="eyebrow">${victory?'MATCH POINT WON':'MATCH POINT LOST'}</div><h1>${victory?mode==='challenge'?'Challenge <em>complete.</em>':'You <em>win.</em>':'The court <em>won today.</em>'}</h1><p>Final game ${score.p}—${score.a}. ${stats.aces} ace${stats.aces===1?'':'s'}, ${stats.winners} winner${stats.winners===1?'':'s'}, ${stats.faults} service fault${stats.faults===1?'':'s'}. ${victory?'The next ball still needs your timing.':'Read the bounce, move early and avoid aiming too wide.'}</p><div class="actions"><button class="primary" id="rematch">${mode==='challenge'?'RESTART CHALLENGE':'REMATCH'}</button><button class="secondary" id="leave">MAIN MENU</button></div>`);$('#rematch').onclick=()=>startMatch(true);$('#leave').onclick=menu}
function move(e,dt,r,near){let ix=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0),iz=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0);let t=Math.hypot(ix,iz)||1,pace=(2.8+r.speed*.044)*(1-Math.min(.15,clock/1200));e.vx+=(ix/t*pace-e.vx)*Math.min(1,dt*9);e.vz+=(iz/t*pace-e.vz)*Math.min(1,dt*9);e.x=clamp(e.x+e.vx*dt,-5.3,5.3);e.z=clamp(e.z+e.vz*dt,near?.7:-11.5,near?11.5:-.7);e.anim+=dt*Math.hypot(e.vx,e.vz)*2.8;e.arm=Math.max(0,e.arm-dt)}
function step(dt){clock+=dt;if(bannerTimer>0){bannerTimer-=dt;if(bannerTimer<=0){banner='';$('#message').textContent=''}}
 if(phase==='menu'||phase==='ended'||phase==='paused')return;
 if(phase==='serve'&&server==='p'){serveMeter+=meterDir*dt*.87;if(serveMeter>=1){serveMeter=1;meterDir=-1}if(serveMeter<=.08){serveMeter=.08;meterDir=1}
  const ax=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0),az=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0);aim.x=clamp(aim.x+ax*dt*2.4,-5.8,5.8);aim.z=clamp(aim.z+az*dt*2.4,-6,6);
  $('#rail').style.setProperty('--value',(serveMeter*100)+'%');$('#power').textContent=Math.round(serveMeter*100)+'%';$('#serveInfo').textContent=Math.abs(aim.x)>3||Math.abs(aim.z)>3?' · AIM RISK: OUT':' · aim has no guide line';
 }else if(phase==='serve'){aiThink-=dt;if(aiThink<=0)serveAI()}
 if(phase==='point'){pointTimer-=dt;if(pointTimer<=0){if(score.winner)finishGame();else nextPoint()}return}
 if(phase==='rally'||phase==='serve'&&server==='a'){move(p,dt,roster[selected],true);if(phase==='rally'){
  bias.x=clamp(bias.x+((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*dt*2.2,-5.6,5.6);bias.z=clamp(bias.z+((keys.ArrowDown?1:0)-(keys.ArrowUp?1:0))*dt*2.3,-5,5);
  bias.x*=Math.exp(-dt*.20);bias.z*=Math.exp(-dt*.23)}}
 if(swing){swing.life-=dt;if(swing.life>0&&phase==='rally')tryPlayerHit(swing.type);if(swing.life<=0)swing=null}
 let rival=opponents[mode==='single'?0:level];if(phase==='rally'&&ball&&ball.by==='p'){let dest=ball.target||{x:0,z:-8};aiThink=Math.max(0,aiThink-dt);if(aiThink<=0){let dx=dest.x-a.x,dz=clamp(dest.z,-11,-2)-a.z,dist=Math.hypot(dx,dz)||1,pace=2.7+rival.speed*.056;let inertia=Math.min(1,dt*(4+rival.control*.035));a.vx+=(dx/dist*pace-a.vx)*inertia;a.vz+=(dz/dist*pace-a.vz)*inertia;a.x=clamp(a.x+a.vx*dt,-5.2,5.2);a.z=clamp(a.z+a.vz*dt,-11.4,-.7);a.anim+=dt*Math.hypot(a.vx,a.vz)*3}}else{a.vx*=Math.exp(-dt*3);a.vz*=Math.exp(-dt*3)}a.arm=Math.max(0,a.arm-dt);
 if(phase==='rally'&&ball){ball=stepBall(ball,dt);if(!ball.ended){if(ball.by==='p')tryAIHit();else if(swing)tryPlayerHit(swing.type)}if(ball.ended)handleEnded()}
 }
function sx(x,z){return 550+x*(45+z*.9)}function sy(z){return 365+z*22}function line(x1,z1,x2,z2,w=2,color='#e8eee2'){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(sx(x1,z1),sy(z1));ctx.lineTo(sx(x2,z2),sy(z2));ctx.stroke()}
function stadium(){let grd=ctx.createLinearGradient(0,0,0,720);grd.addColorStop(0,'#15292d');grd.addColorStop(.58,'#0f262b');grd.addColorStop(1,'#0a1a1f');ctx.fillStyle=grd;ctx.fillRect(0,0,1100,720);
 ctx.fillStyle='#31454a';for(let row=0;row<4;row++){let y=42+row*23;ctx.fillRect(0,y,1100,2);for(let i=0;i<46;i++){let x=12+i*25+row%2*13,alpha=.15+((i*13+row*7)%10)/70;ctx.fillStyle=`rgba(196,214,194,${alpha})`;ctx.beginPath();ctx.arc(x,y-5,3+(i%4),0,7);ctx.fill()}}ctx.fillStyle='#0a2225';ctx.fillRect(0,135,1100,585);
 const corners=[[-5.5,-12.6],[5.5,-12.6],[6,12.6],[-6,12.6]];ctx.beginPath();corners.forEach(([x,z],i)=>i?ctx.lineTo(sx(x,z),sy(z)):ctx.moveTo(sx(x,z),sy(z)));ctx.closePath();ctx.fillStyle='#a37251';ctx.fill();ctx.strokeStyle='#3b5150';ctx.lineWidth=15;ctx.stroke();
 ctx.beginPath();[[-4.115,-11.885],[4.115,-11.885],[4.115,11.885],[-4.115,11.885]].forEach(([x,z],i)=>i?ctx.lineTo(sx(x,z),sy(z)):ctx.moveTo(sx(x,z),sy(z)));ctx.closePath();ctx.fillStyle='#247877';ctx.fill();ctx.strokeStyle='#e9e7d0';ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle='#277a78';for(let i=-10;i<=10;i++){let z=i*1.08;line(-4,z,4,z,.7,i%2?'#fff1':'#1112')}
 for(let z of [-6.4,6.4])line(-4.115,z,4.115,z,2.4);line(0,-6.4,0,6.4,2.4);line(-.15,-11.885,.15,-11.885,2);line(-.15,11.885,.15,11.885,2);
 ctx.fillStyle='#c7ece5b0';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText('COURTSIDE  •  THE SIXTH SHOT',550,714);
 }
function net(){let y=sy(0);ctx.strokeStyle='#b7d0c5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx(-4.5,0),y-24);ctx.lineTo(sx(4.5,0),y-24);ctx.stroke();ctx.fillStyle='#a0bcaf55';ctx.fillRect(sx(-4.5,0),y-22,sx(4.5,0)-sx(-4.5,0),27);ctx.strokeStyle='#d0ebe833';ctx.lineWidth=1;for(let i=0;i<32;i++){let x=sx(-4.5,0)+i*13;ctx.beginPath();ctx.moveTo(x,y-22);ctx.lineTo(x,y+5);ctx.stroke()}ctx.fillStyle='#d9ebe4';for(let x of [-4.5,4.5])ctx.fillRect(sx(x,0)-3,y-36,6,46)}
function person(e,r,far){
 const X=sx(e.x,e.z),Y=sy(e.z),scale=far?.87:1.07,velocity=Math.hypot(e.vx,e.vz),gait=Math.sin(e.anim)*Math.min(1,velocity/3.5),bounce=Math.abs(Math.sin(e.anim))*(velocity>1?1.7:0),tilt=clamp(e.vx*.018,-.12,.12);
 ctx.save();ctx.translate(X,Y);ctx.scale(scale,scale);ctx.fillStyle='#081b1b99';ctx.beginPath();ctx.ellipse(0,2,23,7,0,0,7);ctx.fill();ctx.translate(0,-bounce);ctx.rotate(tilt);ctx.lineCap='round';ctx.lineJoin='round';
 function limb(points,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.stroke()}
 function dot(x,y,rad,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill()}
 let front=gait*12,back=-gait*12;
 // Two jointed legs, bent knees and planted shoes respond to footwork.
 limb([[-7,-37],[-10+front*.48,-22],[-12+front,0]],9,'#243b40');limb([[7,-37],[11+back*.48,-22],[13+back,0]],9,'#253a3c');
 dot(-10+front*.48,-22,4.8,'#2a4144');dot(11+back*.48,-22,4.8,'#2a4144');
 limb([[-12+front,-1],[-21+front,1]],6,'#d9e2dc');limb([[13+back,-1],[20+back,1]],6,'#d9e2dc');
 ctx.fillStyle='#1c343a';ctx.beginPath();ctx.moveTo(-12,-42);ctx.lineTo(12,-42);ctx.lineTo(14,-29);ctx.lineTo(-13,-29);ctx.closePath();ctx.fill();
 let shirt=ctx.createLinearGradient(-16,-71,17,-42);shirt.addColorStop(0,r.color);shirt.addColorStop(.55,r.color);shirt.addColorStop(1,'#405653');ctx.fillStyle=shirt;ctx.beginPath();ctx.moveTo(-13,-67);ctx.quadraticCurveTo(0,-71,13,-67);ctx.lineTo(11,-47);ctx.quadraticCurveTo(15,-41,12,-39);ctx.lineTo(-12,-39);ctx.quadraticCurveTo(-15,-42,-11,-47);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#ffffff7d';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-68);ctx.lineTo(0,-42);ctx.stroke();ctx.fillStyle='#f2f0df';ctx.beginPath();ctx.moveTo(-4,-68);ctx.lineTo(0,-63);ctx.lineTo(4,-68);ctx.fill();
 let swing=e.arm>0?Math.sin((.48-e.arm)*8)*29:Math.sin(e.anim)*3,reachArm=18+swing,handY=-47-swing*.65;
 limb([[-13,-63],[-21-gait*3,-53],[-25-gait*5,-40]],7,r.skin);dot(-21-gait*3,-53,3.5,r.skin);dot(-25-gait*5,-40,3.7,r.skin);
 limb([[13,-63],[23+swing*.28,-56-swing*.25],[reachArm+10,handY]],7,r.skin);dot(23+swing*.28,-56-swing*.25,3.6,r.skin);dot(reachArm+10,handY,3.6,r.skin);
 // Racket follows the striking hand and rotates through contact.
 let gripX=reachArm+10,gripY=handY;ctx.save();ctx.translate(gripX,gripY);ctx.rotate(.24+e.arm*1.65);limb([[0,0],[12,-17]],3,'#91a8aa');ctx.translate(17,-27);ctx.strokeStyle='#edf1d9';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,0,10,16,.1,0,7);ctx.stroke();ctx.strokeStyle='#cfdbd39c';ctx.lineWidth=.65;for(let i=-2;i<=2;i++)limb([[i*3,-14],[i*3,14]],.7,'#c4d9d0aa');for(let i=-2;i<=2;i++)limb([[-9,i*5],[9,i*5]],.7,'#c4d9d0aa');ctx.restore();
 limb([[-4,-69],[-4,-76]],8,r.skin);
 let head=ctx.createRadialGradient(-3,-88,2,1,-84,13);head.addColorStop(0,'#f3c8a5');head.addColorStop(.7,r.skin);head.addColorStop(1,'#76503d');dot(0,-84,11.5,head);
 ctx.fillStyle='#283037';ctx.beginPath();ctx.moveTo(-11,-88);ctx.quadraticCurveTo(-9,-102,2,-97);ctx.quadraticCurveTo(12,-97,11,-87);ctx.quadraticCurveTo(7,-92,1,-92);ctx.quadraticCurveTo(-5,-90,-11,-88);ctx.fill();
 if(r.sex==='WOMEN'){ctx.fillStyle='#283037';ctx.beginPath();ctx.ellipse(13,-91,5,8,-.5,0,7);ctx.fill()}
 dot(-4,-84,1.1,'#2b2522');dot(4,-84,1.1,'#2b2522');ctx.strokeStyle='#8e5347';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,-79);ctx.quadraticCurveTo(0,-77,3,-79);ctx.stroke();
 ctx.restore();}
function render(){stadium();let ordering=[{e:a,r:opponents[mode==='single'?0:level],far:true},{e:p,r:roster[selected],far:false}];ordering.forEach(o=>{if(o.far)person(o.e,o.r,o.far)});net();person(p,roster[selected],false);
 if(ball&&phase!=='serve'){let X=sx(ball.x,ball.z),Y=sy(ball.z),height=Math.max(0,ball.h);ctx.fillStyle='#091717a0';ctx.beginPath();ctx.ellipse(X,Y,7,3,0,0,7);ctx.fill();ctx.fillStyle='#ecfa83';ctx.shadowColor='#e9fa89';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(X,Y-height*31,Math.max(4,5+height*.45),0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#46563c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(X-1,Y-height*31,2,0,3);ctx.stroke()}
 if(phase==='serve'){let e=server==='p'?p:a,r=server==='p'?roster[selected]:opponents[mode==='single'?0:level];let X=sx(e.x,e.z),Y=sy(e.z)-93;ctx.fillStyle='#f2fa89';ctx.beginPath();ctx.arc(X+15,Y-Math.abs(Math.sin(clock*4))*30,5,0,7);ctx.fill()}
 }
let last=0,acc=0;function frame(t){let dt=Math.min(.05,(t-last)/1000||.016);last=t;acc+=dt;let n=0;while(acc>=1/120&&n++<6){step(1/120);acc-=1/120}if(n>=6)acc=0;render();requestAnimationFrame(frame)}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyJ','KeyK'].includes(e.code))e.preventDefault();if(e.code.startsWith('Arrow'))keys[e.code]=true;if(!e.repeat&&e.code==='KeyJ')aimShot('flat');if(!e.repeat&&e.code==='KeyK')aimShot('lob')});window.addEventListener('keyup',e=>{if(e.code.startsWith('Arrow'))keys[e.code]=false});window.addEventListener('blur',()=>{keys={};if(phase==='rally'||phase==='serve'){phase='paused';show('<div class="eyebrow">MATCH PAUSED</div><h1>Take a <em>breath.</em></h1><p>The court will wait for you.</p><div class="actions"><button class="primary" id="resume">RESUME MATCH</button><button class="secondary" id="leave">MAIN MENU</button></div>');$('#resume').onclick=()=>{phase=ball?'rally':'serve';hide()};$('#leave').onclick=menu}});
$('#pause').onclick=()=>{if(phase!=='rally'&&phase!=='serve')return;phase='paused';show('<div class="eyebrow">MATCH PAUSED</div><h1>Take a <em>breath.</em></h1><p>The court will wait for you.</p><div class="actions"><button class="primary" id="resume">RESUME MATCH</button><button class="secondary" id="leave">MAIN MENU</button></div>');$('#resume').onclick=()=>{phase=ball?'rally':'serve';hide()};$('#leave').onclick=menu};$('#audio').onclick=()=>{audio=!audio;$('#audio').textContent=audio?'SOUND ON':'SOUND OFF';try{localStorage.setItem('courtside.sound',audio?'on':'off')}catch(e){}};$('#audio').textContent=audio?'SOUND ON':'SOUND OFF';
menu();requestAnimationFrame(frame);
window.__COURTSIDE={get state(){return{phase,score,games,server,faults,pointIndex,ball,p,a,aim,bias,mode,level,stats}},roster,CORE};
})();
