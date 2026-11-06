import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.mjs';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const result={en:'Nice ride!',fr:'Parle-moi du trajet.',translation:'Belle balade !',hint:'I went…',correction:'went, passé de go'};
const url='https://kim.test/api/chat';
function call({env={},body={message:'I goed home',history:[],memory:[]},auth=true,origin='https://kim.test'}={}){
  return worker.fetch(new Request(url,{method:'POST',headers:{origin,Authorization:auth?'Basic '+btoa('kim:secret'):''},body:JSON.stringify(body)}),
    {KIM_PASSWORD:'secret',AI:{run:async()=>({response:JSON.stringify(result)})},...env});
}
test('only authenticated same-origin input reaches the model',async()=>{
  assert.equal((await call({auth:false})).status,401);
  assert.equal((await call({env:{KIM_PASSWORD:''}})).status,503);
  assert.equal((await call({origin:'https://other.test'})).status,403);
  assert.equal((await call({body:{message:'hello'}})).status,400);
  assert.deepEqual(await (await call()).json(),result);
  assert.equal((await call({env:{AI:{run:async()=>({response:'bad'})}}})).status,503);
});
function client(fetch){
 const nodes=new Map();
 function node(){return {style:{},classList:{toggle(){},add(){},remove(){}},children:[],append(el){this.children.push(el)},replaceChildren(){this.children=[]},addEventListener(){},value:''};}
 const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},createElement:node};
 const context=vm.createContext({document,window:{},localStorage:{},setTimeout,clearTimeout,fetch,AbortController});
 vm.runInContext(readFileSync(new URL('../app.js',import.meta.url),'utf8'),context);
 return {run:s=>vm.runInContext(s,context),el:s=>document.querySelector(s)};
}
test('real reply drives translation, hint, review and XP',async()=>{
 const c=client(async()=>Response.json(result));c.run('startSession()');c.el('#answer').value='I goed home';await c.run('send()');
 c.run('translateLast()');assert.equal(c.el('#hint').textContent,result.translation);
 c.run('hint()');assert.equal(c.el('#hint').textContent,result.hint);
 assert.equal(c.run('JSON.parse(localStorage.kim).difficult["went, passé de go"]'),1);
 assert.equal(c.run('db.xp'),10);
});
test('offline fallback and late response after leaving',async()=>{
 const c=client(async()=>new Response('',{status:503}));c.run('startSession()');c.el('#answer').value='Hey';await c.run('send()');
 assert.equal(c.el('#mode').textContent,'Exercices guidés');
 let finish;const d=client(()=>new Promise(resolve=>{finish=resolve}));d.run('startSession()');d.el('#answer').value='Hello';const pending=d.run('send()');
 d.run("show('home');startSession()");finish(Response.json(result));await pending;assert.equal(d.run('session.history.length'),1);assert.equal(d.run('db.xp'),0);
});
