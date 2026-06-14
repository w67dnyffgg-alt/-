const STORAGE_KEY = "kokoroNoTanecho_v2_full";

const defaults = {
  heroes:["優しい子","強がりな子","人を信じたい子","平気なふりをする子","好きなものにまっすぐな子","本音を隠して笑う子"],
  targets:["好きな人","昔好きだった人","親友","憧れの先輩","許せない相手","助けてくれた人"],
  talkers:["友達","親友","先輩","同僚","きょうだい","たまたま隣にいた人"],
  arrows:["憧れ","尊敬","信頼","友情","心配","執着","嫉妬","罪悪感","許せない","守りたい","特別になりたい","もっと知りたい"],
  scenes:["夕方の帰り道","休日のカフェ","雨上がりの駅前","夜の部屋","放課後の教室","電車の中","コンビニの帰り道"],
  triggers:["『忘れなよ』と言われる","昔のメッセージを見つける","似た香りがする","名前を偶然聞く","優しくされて泣きそうになる","言えなかった言葉を思い出す"],
  aftertastes:["切ないけど少し優しい","まだ答えは出ない","痛いけどあたたかい","静かに前を向く","許せないまま大切にしまう","やわらかい余韻"]
};

let state = {
  emotions:[],
  arrows:[],
  gachaOptions: structuredClone(defaults),
  gachaHistory:[],
  stories:[],
  currentCategory:"heroes",
  emotionFilter:"all"
};

const $ = id => document.getElementById(id);
const qsa = sel => [...document.querySelectorAll(sel)];
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const pick = arr => arr[Math.floor(Math.random()*arr.length)] || "";
const viewTitles = {
  home:"心の種帳",
  seed:"種を作る",
  manga:"漫画を書く",
  album:"アルバム"
};

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    state = {
      ...state,
      ...data,
      gachaOptions:{...structuredClone(defaults), ...(data.gachaOptions || {})}
    };
  }catch(e){ alert("保存データの読み込みに失敗しました"); }
}
function esc(s){ return String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }
function today(){ return new Date().toISOString().slice(0,10); }
function nowText(){ return new Date().toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}); }
function homeDateText(){
  const date = new Date();
  const part = n => String(n).padStart(2,"0");
  return `${date.getFullYear()}.${part(date.getMonth()+1)}.${part(date.getDate())}（${["日","月","火","水","木","金","土"][date.getDay()]}）`;
}

function switchView(view){
  qsa(".view").forEach(v=>v.classList.toggle("active",v.id===view));
  qsa(".nav-btn,.bottom-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  qsa(".journey button").forEach(b=>b.classList.toggle("active",b.dataset.jump===view));
  $("screenTitle").textContent = viewTitles[view] || "心の種帳";
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderAll(){
  renderEmotions(); renderArrows(); renderCustom(); renderGachaSelect(); renderHistory();
  renderStories(); renderHome(); renderAlbum();
}

function renderHome(){
  const latestEmotion = state.emotions.at(-1);
  $("todaySeed").textContent = latestEmotion?.text || "感情をひとつ、漫画の種にしよう";
  $("todayDate").textContent = homeDateText();
  const progress = state.stories.filter(s=>s.status!=="完成").slice(-3).reverse();
  $("homeProgressList").innerHTML = progress.length ? progress.map((s,i)=>`
    <article class="home-story-row">
      <div class="story-thumb thumb-${i%3}" aria-hidden="true">♡</div>
      <div class="story-row-copy">
        <p class="item-title">${esc(s.title||"無題")}</p>
        <p class="item-meta">更新日：${esc(s.createdAt||"")}</p>
      </div>
      <span class="badge">${esc(s.status)}</span>
    </article>`).join("") : `<div class="mini-empty illustrated-empty"><span>▧</span>進行中の漫画はまだありません</div>`;
  const gh = state.gachaHistory.slice(-3).reverse();
  $("homeGachaList").innerHTML = gh.length ? gh.map((g,i)=>`
    <article class="home-gacha-card gacha-tone-${i%3}">
      <span class="gacha-sparkle" aria-hidden="true">✦</span>
      <p class="item-title"><b>${esc(g.hero)}</b><br>×<br><b>${esc(g.arrow)}</b></p>
      <p class="item-meta">${esc(g.scene)}</p>
      <time>${esc(g.createdAt||"")}</time>
    </article>`).join("") : `<div class="mini-empty illustrated-empty"><span>♧</span>ガチャを引くと、ここに種が並びます</div>`;
}

function renderEmotions(){
  $("emotionCount").textContent = `(${state.emotions.length})`;
  const list = state.emotionFilter==="fav" ? state.emotions.filter(e=>e.favorite) : state.emotions;
  $("emotionList").innerHTML = list.length ? list.slice().reverse().map(e=>`
    <article class="item emotion-row ${e.favorite?"fav":""}">
      <div>
        <p class="item-title">${esc(e.text)}</p>
        <p class="item-meta">◷ ${esc(e.createdAtText||"")}</p>
      </div>
      <div class="emotion-row-actions">
        <button class="star-action" onclick="toggleEmotionFav('${e.id}')" aria-label="お気に入り">${e.favorite?"★":"☆"}</button>
        <div class="actions">
          <button onclick="editEmotion('${e.id}')">編集</button>
          <button class="use" onclick="sendEmotionToManga('${e.id}')">漫画へ</button>
          <button class="danger" onclick="deleteEmotion('${e.id}')">削除</button>
        </div>
      </div>
    </article>`).join("") : `<div class="mini-empty">感情メモはまだありません</div>`;
}
window.toggleEmotionFav = id => { const e=state.emotions.find(x=>x.id===id); if(e){e.favorite=!e.favorite; save(); renderAll();} };
window.editEmotion = id => { const e=state.emotions.find(x=>x.id===id); const t=prompt("感情メモを編集",e?.text||""); if(t?.trim()){e.text=t.trim(); save(); renderAll();} };
window.deleteEmotion = id => { if(confirm("削除しますか？")){ state.emotions=state.emotions.filter(e=>e.id!==id); save(); renderAll(); } };
window.sendEmotionToManga = id => { const e=state.emotions.find(x=>x.id===id); if(e){ $("storyTheme").value=e.text; switchView("manga"); } };

function renderArrows(){
  $("arrowCount").textContent = `(${state.arrows.length})`;
  $("arrowList").innerHTML = state.arrows.length ? state.arrows.slice().reverse().map(a=>`
    <article class="item arrow-card">
      <div class="arrow-route">
        <div><small>主人公</small><b>${esc(a.hero)}</b></div>
        <strong>→</strong>
        <div><small>感情の相手</small><b>${esc(a.target)}</b></div>
        <span class="arrow-emotion">${esc(a.emotion)}</span>
      </div>
      <div class="arrow-note">
        <p><small>会話相手</small>${esc(a.talker || "なし")}</p>
        <p><small>メモ</small>${esc(a.memo || "メモはありません")}</p>
      </div>
      <div class="actions">
        <button class="use" onclick="useArrow('${a.id}')">漫画へ</button>
        <button class="danger" onclick="deleteArrow('${a.id}')">削除</button>
      </div>
    </article>`).join("") : `<div class="mini-empty">感情の矢印はまだありません</div>`;
}
window.useArrow = id => {
  const a=state.arrows.find(x=>x.id===id); if(!a) return;
  $("storyTheme").value = `${a.hero} → ${a.target}：${a.emotion}`;
  $("storyMemo").value = `会話相手：${a.talker || ""}\nメモ：${a.memo || ""}`;
  switchView("manga");
};
window.deleteArrow = id => { if(confirm("削除しますか？")){state.arrows=state.arrows.filter(a=>a.id!==id); save(); renderAll();} };

function renderCustom(){
  const cat=state.currentCategory;
  $("customList").innerHTML = (state.gachaOptions[cat]||[]).map((v,i)=>`
    <article class="item">
      <p class="item-title">${esc(v)}</p>
      <div class="actions"><button class="danger" onclick="deleteCustom('${cat}',${i})">削除</button></div>
    </article>`).join("") || `<div class="mini-empty">選択肢がありません</div>`;
}
window.deleteCustom = (cat,i) => { state.gachaOptions[cat].splice(i,1); save(); renderAll(); };

function switchSeedTab(tab){
  qsa("[data-seed-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.seedTab===tab));
  qsa(".seed-panel").forEach(panel=>panel.classList.remove("active"));
  if(tab==="custom"){
    $("seedCustomPanel").classList.add("active");
  }else if(tab==="history"){
    $("seedHistoryPanel").classList.add("active");
  }else{
    $("seedOverviewPanel").classList.add("active");
    if(tab==="arrows") setTimeout(()=>$("arrowLibrarySection").scrollIntoView({behavior:"smooth",block:"start"}),30);
  }
}

function renderGachaSelect(){
  $("gachaEmotionSelect").innerHTML = `<option value="">感情メモを選ぶ（任意）</option>` + state.emotions.slice().reverse().map(e=>`<option value="${e.id}">${esc(e.text)}</option>`).join("");
}
function makeGacha(){
  const emotion = state.emotions.find(e=>e.id===$("gachaEmotionSelect").value)?.text || "";
  return {
    id:uid(), createdAt:today(), createdAtText:nowText(), favorite:false,
    baseEmotion:emotion,
    hero:pick(state.gachaOptions.heroes),
    target:pick(state.gachaOptions.targets),
    talker:pick(state.gachaOptions.talkers),
    arrow:pick(state.gachaOptions.arrows),
    scene:pick(state.gachaOptions.scenes),
    trigger:pick(state.gachaOptions.triggers),
    aftertaste:pick(state.gachaOptions.aftertastes)
  };
}
function gachaHTML(g){
  return `<div class="result-card-content">
    <p class="item-title">主人公：${esc(g.hero)}</p>
    <dl>
      <div><dt>感情の相手</dt><dd>${esc(g.target)}</dd></div>
      <div><dt>会話相手</dt><dd>${esc(g.talker)}</dd></div>
      <div><dt>感情の矢印</dt><dd>${esc(g.arrow)}</dd></div>
      <div><dt>場面</dt><dd>${esc(g.scene)}</dd></div>
      <div><dt>きっかけ</dt><dd>${esc(g.trigger)}</dd></div>
      <div><dt>読後感</dt><dd>${esc(g.aftertaste)}</dd></div>
    </dl>
    <div class="actions">
      <button class="use" onclick="useGacha('${g.id}')">漫画テンプレへ</button>
      <button onclick="toggleHistoryFav('${g.id}')">${g.favorite?"★解除":"☆お気に入り"}</button>
    </div>
  </div>`;
}
function renderHistory(){
  $("historyCount").textContent = `(${state.gachaHistory.length})`;
  $("gachaHistoryList").innerHTML = state.gachaHistory.length ? state.gachaHistory.slice().reverse().map(g=>`
    <article class="history-card">
      <p class="item-meta">${esc(g.createdAtText)} ${g.favorite?"⭐":""}</p>
      ${gachaHTML(g)}
    </article>`).join("") : `<div class="mini-empty">ガチャ履歴はまだありません</div>`;
}
window.toggleHistoryFav = id => { const g=state.gachaHistory.find(x=>x.id===id); if(g){g.favorite=!g.favorite; save(); renderAll();} };
window.useGacha = id => {
  const g=state.gachaHistory.find(x=>x.id===id); if(!g) return;
  $("storyTitle").value = g.baseEmotion ? g.baseEmotion.slice(0,20) : `${g.hero}の${g.arrow}`;
  $("storyTheme").value = g.baseEmotion || `${g.hero} → ${g.target}：${g.arrow}`;
  $("storyAftertaste").value = g.aftertaste;
  $("page1Scene").value = `${g.scene}。\n${g.trigger}。`;
  $("page2Scene").value = `${g.hero}の気持ちが「${g.arrow}」に向かって揺れる。`;
  $("page3Scene").value = `${g.talker}との会話の中で、${g.target}への気持ちを整理しきれず葛藤する。`;
  $("page4Scene").value = `${g.aftertaste}で終わる。結論を言い切らない。`;
  $("storyMemo").value = `ガチャ結果\n主人公：${g.hero}\n感情の相手：${g.target}\n会話相手：${g.talker}\n感情の矢印：${g.arrow}\n場面：${g.scene}\nきっかけ：${g.trigger}`;
  switchView("manga");
};

function collectStory(){
  return {
    id:uid(), createdAt:today(), createdAtText:nowText(),
    title:$("storyTitle").value.trim(),
    theme:$("storyTheme").value.trim(),
    aftertaste:$("storyAftertaste").value.trim(),
    status:$("storyStatus").value,
    pages:[1,2,3,4].map(n=>({
      scene:$(`page${n}Scene`).value.trim(),
      line:$(`page${n}Line`).value.trim(),
      draw:$(`page${n}Draw`).value.trim()
    })),
    checks:{
      emotion:$("checkEmotion").checked,
      pages:$("checkPages").checked,
      space:$("checkSpace").checked,
      finish:$("checkFinish").checked
    },
    memo:$("storyMemo").value.trim()
  };
}
function clearStory(){
  ["storyTitle","storyTheme","storyAftertaste","storyMemo"].forEach(id=>$(id).value="");
  [1,2,3,4].forEach(n=>["Scene","Line","Draw"].forEach(s=>$(`page${n}${s}`).value=""));
  ["checkEmotion","checkPages","checkSpace","checkFinish"].forEach(id=>$(id).checked=false);
  $("storyStatus").value="ネタ";
}
function renderStories(){
  $("storyCount").textContent = state.stories.length;
  const statuses=["ネタ","ネーム","作画中","完成"];
  $("storyKanban").innerHTML = statuses.map(st=>`
    <div class="kanban-col"><h4>${st}</h4>
      ${state.stories.filter(s=>s.status===st).slice().reverse().map(s=>storyMiniHTML(s)).join("") || `<div class="mini-empty">なし</div>`}
    </div>`).join("");
}
function storyMiniHTML(s){
  return `<article class="story-card">
    <h4>${esc(s.title||"無題")}</h4>
    <p class="item-meta">${esc(s.theme || "テーマ未設定")}<br>${esc(s.createdAtText||"")}</p>
    <div class="actions">
      <button class="use" onclick="loadStory('${s.id}')">開く</button>
      <button onclick="changeStoryStatus('${s.id}')">状態変更</button>
      <button class="danger" onclick="deleteStory('${s.id}')">削除</button>
    </div>
  </article>`;
}
window.loadStory = id => {
  const s=state.stories.find(x=>x.id===id); if(!s) return;
  $("storyTitle").value=s.title||""; $("storyTheme").value=s.theme||""; $("storyAftertaste").value=s.aftertaste||""; $("storyStatus").value=s.status||"ネタ"; $("storyMemo").value=s.memo||"";
  s.pages.forEach((p,i)=>{ const n=i+1; $(`page${n}Scene`).value=p.scene||""; $(`page${n}Line`).value=p.line||""; $(`page${n}Draw`).value=p.draw||""; });
  $("checkEmotion").checked=!!s.checks?.emotion; $("checkPages").checked=!!s.checks?.pages; $("checkSpace").checked=!!s.checks?.space; $("checkFinish").checked=!!s.checks?.finish;
  switchView("manga");
};
window.changeStoryStatus = id => {
  const s=state.stories.find(x=>x.id===id); if(!s) return;
  const next=prompt("状態を入力：ネタ / ネーム / 作画中 / 完成", s.status);
  if(["ネタ","ネーム","作画中","完成"].includes(next)){ s.status=next; save(); renderAll(); }
};
window.deleteStory = id => { if(confirm("作品メモを削除しますか？")){state.stories=state.stories.filter(s=>s.id!==id); save(); renderAll();} };

function getEmotionStats(){
  const map = {};
  state.arrows.forEach(a=>{ if(a.emotion) map[a.emotion]=(map[a.emotion]||0)+1; });
  state.gachaHistory.forEach(g=>{ if(g.arrow) map[g.arrow]=(map[g.arrow]||0)+1; });
  state.stories.forEach(s=>{ 
    const m=(s.theme||"").match(/：(.+)$/); 
    if(m) map[m[1]]=(map[m[1]]||0)+1;
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}
function renderAlbum(){
  const complete = state.stories.filter(s=>s.status==="完成").slice().reverse();
  $("completeCount").textContent = complete.length;
  $("completeList").innerHTML = complete.length ? complete.map(s=>`
    <article class="item">
      <p class="item-title">💖 ${esc(s.title||"無題")}</p>
      <p class="item-meta">テーマ：${esc(s.theme||"未設定")}<br>完成日：${esc(s.createdAtText||"")}</p>
      <div class="actions"><button class="use" onclick="loadStory('${s.id}')">読む</button></div>
    </article>`).join("") : `<div class="mini-empty">完成作品はまだありません</div>`;
  const stats = getEmotionStats();
  const max = Math.max(1, ...stats.map(x=>x[1]));
  $("emotionCollection").innerHTML = stats.length ? stats.map(([k,v])=>`
    <div class="collection-item"><div><b>${esc(k)}</b><div class="collection-bar" style="width:${Math.max(18, v/max*100)}%"></div></div><span class="badge">${v}回</span></div>`).join("") : `<div class="mini-empty">感情の矢印やガチャを増やすと表示されます</div>`;
}

qsa(".nav-btn,.bottom-btn").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
qsa("[data-jump]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.jump)));
qsa("[data-seed-tab]").forEach(btn=>btn.addEventListener("click",()=>switchSeedTab(btn.dataset.seedTab)));

$("openEmotionComposerBtn").addEventListener("click",()=>{
  $("emotionComposer").classList.toggle("hidden");
  if(!$("emotionComposer").classList.contains("hidden")) $("emotionInput").focus();
});
$("openArrowComposerBtn").addEventListener("click",()=>{
  $("arrowComposer").classList.toggle("hidden");
  if(!$("arrowComposer").classList.contains("hidden")) $("arrowHero").focus();
});
qsa(".seed-add,.quick-create-btn.emotion").forEach(btn=>btn.addEventListener("click",()=>{
  switchSeedTab("overview");
  $("emotionComposer").classList.remove("hidden");
  setTimeout(()=>$("emotionInput").focus(),30);
}));
qsa(".quick-create-btn.gacha").forEach(btn=>btn.addEventListener("click",()=>switchSeedTab("history")));

$("addEmotionBtn").addEventListener("click",()=>{
  const text=$("emotionInput").value.trim();
  if(!text) return alert("感情メモを書いてね。");
  state.emotions.push({id:uid(),text,favorite:false,createdAt:today(),createdAtText:nowText()});
  $("emotionInput").value="";
  $("emotionComposer").classList.add("hidden");
  save(); renderAll();
});
$("showAllEmotionBtn").addEventListener("click",()=>{state.emotionFilter="all";$("showAllEmotionBtn").classList.add("active");$("showFavEmotionBtn").classList.remove("active");renderEmotions();});
$("showFavEmotionBtn").addEventListener("click",()=>{state.emotionFilter="fav";$("showFavEmotionBtn").classList.add("active");$("showAllEmotionBtn").classList.remove("active");renderEmotions();});

$("addArrowBtn").addEventListener("click",()=>{
  const a={id:uid(),hero:$("arrowHero").value.trim(),target:$("arrowTarget").value.trim(),emotion:$("arrowEmotion").value.trim(),talker:$("arrowTalker").value.trim(),memo:$("arrowMemo").value.trim(),createdAtText:nowText()};
  if(!a.hero || !a.target || !a.emotion) return alert("主人公・感情の相手・感情の矢印は入れてね。");
  state.arrows.push(a);
  ["arrowHero","arrowTarget","arrowEmotion","arrowTalker","arrowMemo"].forEach(id=>$(id).value="");
  $("arrowComposer").classList.add("hidden");
  save(); renderAll();
});

qsa(".custom-tab").forEach(btn=>btn.addEventListener("click",()=>{
  state.currentCategory=btn.dataset.category;
  qsa(".custom-tab").forEach(b=>b.classList.remove("active")); btn.classList.add("active");
  renderCustom();
}));
$("addCustomBtn").addEventListener("click",()=>{
  const val=$("customInput").value.trim(); if(!val) return;
  state.gachaOptions[state.currentCategory].push(val);
  $("customInput").value="";
  save(); renderAll();
});

$("rollGachaBtn").addEventListener("click",()=>{
  const g=makeGacha();
  state.gachaHistory.push(g);
  $("gachaResult").classList.remove("hidden");
  $("gachaResult").innerHTML = gachaHTML(g);
  save(); renderAll();
});

$("saveStoryBtn").addEventListener("click",()=>{
  const s=collectStory();
  if(!s.title && !s.theme && s.pages.every(p=>!p.scene&&!p.line&&!p.draw)) return alert("少しだけ内容を書いてから保存してね。");
  state.stories.push(s);
  save(); renderAll();
  alert("作品メモを保存しました。");
});
$("clearStoryBtn").addEventListener("click",()=>{ if(confirm("テンプレを空にしますか？")) clearStory(); });

$("exportBtn").addEventListener("click",()=>{
  const data={app:"心の種帳",version:"2.0",exportedAt:new Date().toISOString(),data:state};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`kokoro-no-tanecho-v2-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});
$("importInput").addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const obj=JSON.parse(reader.result);
      const data=obj.data||obj;
      if(!confirm("現在のデータを読み込んだバックアップで置き換えます。よろしいですか？")) return;
      state={...state,...data,gachaOptions:{...structuredClone(defaults),...(data.gachaOptions||{})}};
      save(); renderAll(); alert("読み込みました。");
    }catch(err){ alert("読み込みに失敗しました。JSONファイルを確認してね。"); }
    e.target.value="";
  };
  reader.readAsText(file);
});

load();
renderAll();
