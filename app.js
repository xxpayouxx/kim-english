const $ = selector => document.querySelector(selector);
const exercises = [
  ["How are you feeling today?", "On commence tranquillement. Raconte-moi ta journée.", "Comment te sens-tu aujourd’hui ?", "Today I feel… because…"],
  ["What made you smile today?", "Même un petit détail m’intéresse.", "Qu’est-ce qui t’a fait sourire aujourd’hui ?", "I smiled when…"],
  ["What would you order if we went out for coffee?", "À toi de choisir, je te suis !", "Que commanderais-tu si on allait prendre un café ?", "I'd like…"],
  ["What are you looking forward to?", "Tu peux parler du week-end ou d’un projet.", "Qu’attends-tu avec impatience ?", "I'm looking forward to…"]
].map(([en,fr,translation,hint])=>({en,fr,translation,hint}));
let db = {xp:0, turns:0, streak:1, sessions:0, difficult:{}};
try { Object.assign(db, JSON.parse(localStorage.kim || '{}')); } catch {}
let session, request, recognition;
const day = (date=new Date()) => date.toLocaleDateString('sv-SE');
function save() {
  try { localStorage.kim = JSON.stringify(db); } catch { statusText('La mémoire locale est indisponible.'); }
  render();
}
function render() {
  $('#xp').textContent = db.xp;
  $('#level').textContent = 'Niv. '+(1+Math.floor(db.xp/250));
  $('#streak').textContent = db.streak;
  const count = Math.min(3,session?.turns || 0);
  $('#progress').style.width = count/3*100+'%';
  $('#progressText').textContent = count+' / 3 réponses';
  const entries = Object.entries(db.difficult);
  $('#reviewCount').textContent = entries.length+' à revoir';
  $('#reviewList').replaceChildren();
  if (!entries.length) $('#reviewList').textContent = 'Tes prochaines corrections apparaîtront ici.';
  for (const [item,n] of entries.reverse()) bubble('card',item+' · '+n+' fois','#reviewList');
}
function statusText(text) { $('#status').textContent = text; }
function show(id) {
  if (id!=='chat') {
    request?.abort(); request=null;
    recognition?.abort(); recognition=null;
    window.speechSynthesis?.cancel();
  }
  document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===id));
  render();
}
function bubble(type,text,target='#messages') {
  const el = document.createElement('div');
  el.className=type; el.textContent=text;
  const list=$(target); list.append(el); list.scrollTop=list.scrollHeight;
}
function startSession() {
  session={turns:0,history:[],last:null};
  $('#messages').replaceChildren(); $('#answer').value=''; $('#submit').disabled=false;
  $('#mode').textContent='Français · English'; statusText(''); show('chat');
  reply(exercises[0]);
}
function reply(data) {
  session.last=data;
  const content=data.en+'\n'+data.fr;
  session.history.push({role:'assistant',content});
  bubble('msg kim',content); $('#hint').classList.add('hidden');
  if (data.correction) {
    bubble('correction',data.correction);
    db.difficult[data.correction]=(Number(db.difficult[data.correction])||0)+1;
  }
  speakLast();
}
async function send() {
  const message=$('#answer').value.trim();
  if (!message || request) return;
  recognition?.abort(); window.speechSynthesis?.cancel();
  const controller=new AbortController(); request=controller;
  const history=session.history.slice(-8);
  session.history.push({role:'user',content:message});
  $('#answer').value=''; $('#submit').disabled=true;
  bubble('msg me',message); statusText('Kim réfléchit…');
  const timer=setTimeout(()=>controller.abort(),20000);
  let data;
  let diagnostic="RÉSEAU";
  try {
    const response=await fetch('./api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
      body:JSON.stringify({message,history,memory:Object.keys(db.difficult).slice(-3)})});
    if (!response.ok) {
      const error=await response.json().catch(()=>({}));
      diagnostic=/^(LIAISON|FORMAT|FOURNISSEUR|IA-[0-9]{4,6})$/.test(error.code)?error.code:'HTTP '+response.status;
      throw Error();
    }
    diagnostic='FORMAT';
    data=await response.json();
    if (!['en','fr','hint','translation'].every(k=>typeof data?.[k]==='string' && data[k].trim())) throw Error();
  } catch { data=null; }
  finally { clearTimeout(timer); }
  if (request!==controller) return;
  request=null; $('#submit').disabled=false;
  session.turns++; db.turns++; db.xp+=10;
  const today=day();
  if(db.lastDay!==today){
    const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
    db.streak=db.lastDay===day(yesterday)?db.streak+1:1; db.lastDay=today;
  }
  $('#mode').textContent=data?'Conversation IA':'Exercices guidés';
  statusText(data?'':'IA indisponible ('+(controller.signal.aborted?'DÉLAI':diagnostic)+'). Voici un exercice guidé.');
  reply(data || exercises[session.turns%exercises.length]); save();
}
function help(text){$('#hint').textContent=text; $('#hint').classList.remove('hidden');}
function hint(){help(session.last.hint);}
function translateLast(){help(session.last.translation);}
function speakLast(){
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  for (const [lang,text] of [['en-US',session.last.en],['fr-FR',session.last.fr]]) {
    const voice=new SpeechSynthesisUtterance(text); voice.lang=lang;voice.rate=.94;speechSynthesis.speak(voice);
  }
}
function listen(){
  if(recognition){recognition.stop();return;}
  const Recognizer=window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!Recognizer){statusText('Utilise le micro du clavier iPhone pour dicter.');$('#answer').focus();return;}
  window.speechSynthesis?.cancel();
  const mic=new Recognizer(); recognition=mic; mic.lang=$('#lang').value;
  mic.onresult=e=>{if(recognition===mic) $('#answer').value=e.results[0][0].transcript.slice(0,800);};
  mic.onend=()=>{if(recognition===mic) recognition=null;$('#mic').textContent='🎙️';};
  mic.onerror=()=>{if(recognition===mic) statusText('Dictée interrompue. Tu peux utiliser le micro du clavier.');};
  try{mic.start();$('#mic').textContent='●';statusText('');}catch{mic.onend();statusText('Utilise la dictée du clavier.');}
}
function endSession(){
  if(!session || session.closed) return;
  session.closed=true;
  const bonus=session.turns>=5 && db.bonusDay!==day()?50:0;
  if(bonus) db.bonusDay=day();
  db.sessions++; db.xp+=bonus;
  $('#earned').textContent=session.turns*10+bonus;
  $('#summaryText').textContent=session.turns+' réponses · '+Object.keys(db.difficult).length+' points à revoir';
  save();show('summary');
}
$('#answer').addEventListener('keydown',e=>{if(e.key==='Enter' && !e.isComposing) send();});
render();
