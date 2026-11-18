/* Courtside tennis model — metres, seconds, gravity; no renderer dependencies. */
const G=9.81, HALF_W=4.115, HALF_L=11.885, SERVICE=6.4, NET=0.914;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function attributeRating(a){return Math.round((a.speed+a.power+a.control+a.reach+a.stamina)/5)}
function playerReach(a,d,h){if(h>3.1)return false;return d<=0.9+a.reach*0.008+a.agility*0.005}
function scorePoint(s,who){const n={...s,p:s.p+(who==='p'),a:s.a+(who==='a'),winner:null};
 if((n.p>=4||n.a>=4)&&Math.abs(n.p-n.a)>=2)n.winner=n.p>n.a?'p':'a';return n}
function serveOutcome(x){if(!x.legal)return 'fault';return x.receiverMissed?(x.touched?'winner':'ace'):'rally'}
function aiReturnTarget(player,level,u){
 const f=clamp(level/4,0,1),x=clamp((.8-1.55*f)*player.x+(u-.5)*(1.1+2*f),-3.8,3.8);
 return {x,z:8.4+u*.9+f*.8,speed:17.5+level*1.65};
}
function makeShot({from,to,speed,arc,serve=false,serverSide=0}){
 const dx=to.x-from.x,dz=to.z-from.z,d=Math.hypot(dx,dz),flight=d/speed*(1+arc*0.08);
 // Time-of-flight controls loft: solve the vertical launch velocity so the
 // ball reaches the selected landing point at exactly this flight time.
 const vh=(.5*G*flight*flight-from.h)/flight;
 return {x:from.x,z:from.z,h:from.h,vx:dx/flight,vz:dz/flight,vh,flight,age:0,bounces:0,landed:false,ended:null,serve,serverSide,legal:false,touched:false,fromSide:Math.sign(from.z),target:to};
}
function stepBall(ball,dt){if(ball.ended)return ball;let b={...ball},px=b.x,pz=b.z,ph=b.h;
 b.age+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.h+=b.vh*dt-.5*G*dt*dt;b.vh-=G*dt;
 if(pz*b.z<=0&&pz!==0){let f=pz/(pz-b.z),nh=ph+(b.h-ph)*f;if(nh<NET+.04){b.ended='net';b.h=Math.max(0,nh);b.z=0;return b}}
 if(b.h<=0&&b.vh<0){let f=ph/(ph-b.h),ix=px+(b.x-px)*f,iz=pz+(b.z-pz)*f;b.x=ix;b.z=iz;b.h=0;b.bounces++;
  if(b.bounces===1){let side=Math.sign(iz),correctSide=side===-b.fromSide;
   let inbound=Math.abs(ix)<=HALF_W&&Math.abs(iz)<=HALF_L;
   let box=!b.serve || (Math.abs(iz)<=SERVICE && (b.serverSide===0 || Math.sign(ix)===b.serverSide));
   if(!correctSide||!inbound||!box){b.ended='out';return b}
   b.legal=true;b.landed=true;b.vh=Math.abs(b.vh)*.58;
  }else{b.ended='double';b.h=0}
 }
 return b;
}
if(typeof module!=='undefined')module.exports={G,HALF_W,HALF_L,SERVICE,NET,clamp,attributeRating,playerReach,scorePoint,serveOutcome,aiReturnTarget,makeShot,stepBall};
