const test=require('node:test');
const assert=require('node:assert/strict');
const {scorePoint,makeShot,stepBall,serveOutcome,playerReach,attributeRating}=require('./core.js');
test('tennis deuce and advantage never end early',()=>{
 let s={p:3,a:3,server:'p'};
 s=scorePoint(s,'p');assert.deepEqual([s.p,s.a,s.winner],[4,3,null]);
 s=scorePoint(s,'a');assert.deepEqual([s.p,s.a,s.winner],[4,4,null]);
 s=scorePoint(s,'a');s=scorePoint(s,'a');assert.equal(s.winner,'a');
});
test('ace is a legal serve, untouched and unreturned',()=>{
 assert.equal(serveOutcome({serve:true,legal:true,touched:false,receiverMissed:true}),'ace');
 assert.equal(serveOutcome({serve:true,legal:false,touched:false,receiverMissed:true}),'fault');
 assert.equal(serveOutcome({serve:true,legal:true,touched:true,receiverMissed:true}),'winner');
});
test('serve aims to a diagonal service box and over net',()=>{
 let s=makeShot({from:{x:1.3,z:10.8,h:2.25},to:{x:-1.7,z:-4.9},speed:25,arc:3.0,serve:true});
 let state=s,atNet=null;
 for(let i=0;i<180 && !state.landed;i++){state=stepBall(state,1/120); if(!atNet && state.z<0)atNet=state.h;}
 assert.ok(atNet>0.914,`net height ${atNet}`);
 assert.equal(state.landed,true);
 assert.ok(state.x>-4.115 && state.x<0 && state.z<0 && state.z>-6.4);
});
test('undershot serve is a net fault, wild aim is out',()=>{
 let s=makeShot({from:{x:1,z:10.8,h:2.25},to:{x:0,z:-1},speed:25,arc:0.05,serve:true});
 for(let i=0;i<120 && !s.ended;i++)s=stepBall(s,1/120);
 assert.equal(s.ended,'net');
 s=makeShot({from:{x:1,z:10.8,h:2.25},to:{x:-5,z:-5},speed:25,arc:3,serve:true});
 for(let i=0;i<180&&!s.ended;i++)s=stepBall(s,1/120);
 assert.equal(s.ended,'out');
});
test('ball bounces once; double bounce awards receiver failure',()=>{
 let s=makeShot({from:{x:0,z:9,h:1.1},to:{x:1,z:-8},speed:19,arc:2.3,serve:false});
 for(let i=0;i<600&&!s.ended;i++)s=stepBall(s,1/120);
 assert.equal(s.ended,'double');assert.equal(s.bounces,2);
});
test('lob has a larger trajectory and longer flight than flat',()=>{
 let f=makeShot({from:{x:0,z:9,h:1},to:{x:0,z:-10},speed:20,arc:2.1,serve:false});
 let l=makeShot({from:{x:0,z:9,h:1},to:{x:0,z:-10},speed:15,arc:5.2,serve:false});
 assert.ok(l.flight>f.flight);assert.ok(l.vh>f.vh);
});
test('reach accounts for character agility and ball height',()=>{
 assert.ok(playerReach({agility:90,reach:80},1.5,1.3)>playerReach({agility:40,reach:40},1.5,1.3));
 assert.equal(playerReach({agility:80,reach:70},1.5,4),false);
});
test('an opponent can contact a reachable ball at typical service-line distance',()=>{
 const ok=playerReach({agility:70,reach:68},1.4,1.2);
 assert.equal(ok,true);
});

test('ordinary opponent return from a low contact clears the net',()=>{
 let b=makeShot({from:{x:0,z:-7,h:.35},to:{x:1,z:9},speed:25,arc:4.5});
 for(let i=0;i<180&&!b.ended&&!b.landed;i++)b=stepBall(b,1/120);
 assert.equal(b.ended,null);
 assert.equal(b.legal,true);
});

test('rating is weighted bounded aggregate of attributes',()=>{
 let v=attributeRating({speed:80,power:80,control:80,reach:80,stamina:80});
 assert.equal(v,80);
});
