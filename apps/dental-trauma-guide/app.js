/* =========================================================
   牙外傷處置指南 —— 主程式
   決策樹、查閱、雙語切換、回診日期計算、病歷草稿
   ©Tso KY - All Rights Reserved
   ========================================================= */

'use strict';

const ALL_DX  = [].concat(PERMANENT_DX, PRIMARY_DX);
const DX_BY_ID = {};
ALL_DX.forEach(d => { DX_BY_ID[d.id] = d; });

const LANG_KEY = 'dtg_lang';
const AUD_KEY  = 'dtg_aud';
const MODE_KEY = 'dtg_mode';

let lang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh';
let aud  = localStorage.getItem(AUD_KEY)  === 'public' ? 'public' : 'clinical';
/* 決策樹的兩種模式
     normal（預設）不出現影像檢查那一關，直接在「影像所見」選 finding；
                   紅旗改成第一題上方的提示條
     hints         多一關影像檢查：該拍哪幾張、為什麼非拍不可；紅旗獨立一題
   一般模式**不會**跳掉「影像所見」那一題——跳了就分不出半脫位與牙根斷裂。
   影像提示的內容也沒有消失，診斷頁本來就有「建議影像」那一段。 */
let treeMode = localStorage.getItem(MODE_KEY) === 'hints' ? 'hints' : 'normal';
let curDx = null;        // 目前開啟的診斷
let curSchedule = null;  // 目前採用的追蹤時程（可能是替代版本）
let treePath = [];       // 決策樹走過的節點與選項
let fromBrowse = false;  // 這個診斷是從查閱列表開的，還是從問答走到的

/* ---------- 小工具 ---------- */

// 取目前語言的字串；傳入 {zh,en} 或直接字串
function L(o){ return (o && typeof o === 'object') ? (o[lang] || o.zh || '') : (o || ''); }

const $  = id => document.getElementById(id);

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// 資料檔裡用 **粗體** 標出關鍵字、空行分段。先跳脫再轉標記，避免內容注入標籤。
function md(s){
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function el(tag, cls, html){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

let toastTimer = null;
function toast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

function copy(text){
  const done = () => toast(L(UI.copied));
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch(e){ /* 靜默 */ }
  document.body.removeChild(ta);
}

/* 圖片：檔案還沒進 repo 時顯示佔位框，不讓版面壞掉 */
function figure(src, alt, phText){
  const box = el('div');
  const img = new Image();
  img.alt = alt || '';
  img.addEventListener('error', () => {
    box.innerHTML = '';
    box.appendChild(el('span', 'ph', esc(phText || alt || '')));
  });
  img.src = 'assets/' + src;
  box.appendChild(img);
  return box;
}

/* 圖片加一行說明文字。圖載不到時 figure() 會顯示佔位文字，版面不塌。 */
function capFigure(spec, cls){
  const box = el('div', 'cap-fig' + (cls ? ' ' + cls : ''));
  const f = figure(spec.img, L(spec.cap), L(spec.cap));
  f.className = 'cap-fig-img';
  box.appendChild(f);
  box.appendChild(el('small', null, esc(L(spec.cap))));
  return box;
}

/* ---------- 畫面切換 ---------- */

const SCREENS = ['screenTree','screenImaging','screenPending','screenResult','screenBrowse','screenDx'];
let curScreen = 'screenTree';
function show(id){
  curScreen = id;
  SCREENS.forEach(s => { $(s).hidden = (s !== id); });
  // 寬螢幕的診斷頁要改兩欄，內容區也要跟著放寬；其他畫面維持原寬度。
  // CSS 靠這個屬性判斷目前在哪一頁（見 styles.css 的「寬螢幕診斷頁」）。
  document.body.dataset.screen = id;
  // 決策樹的第一題底下才掛參考資料（急救速查、保存液、文獻），
  // 往下走之後收起來，免得每一題都拖一長條。
  $('refBlocks').hidden = !(id === 'screenTree' && treePath.length <= 1);
  updateBackBtn();
  window.scrollTo(0, 0);
}

/* 返回鍵放在固定頂列——診斷頁很長，放頁尾等於要捲到底才找得到 */
function updateBackBtn(){
  const atRoot = (curScreen === 'screenTree' && treePath.length <= 1);
  $('btnBack').hidden = atRoot;
}

function goBack(){
  switch (curScreen){
    case 'screenTree':
    case 'screenImaging':
      treeBack();
      break;
    case 'screenPending':
      if (pendingNode) renderImaging(pendingNode);
      break;
    case 'screenResult':
      backToLastNode();
      break;
    case 'screenDx':
      curDx = null;
      if (fromBrowse){ renderBrowse($('dxSearch').value); show('screenBrowse'); }
      else if (!backToLastNode()) startTree();
      break;
    case 'screenBrowse':
      if (treePath.length) goNode(treePath[treePath.length - 1].node, true);
      else startTree();
      break;
  }
}

/* ---------- 語言 ---------- */

function applyUiText(){
  document.documentElement.lang = (lang === 'en') ? 'en' : 'zh-TW';
  $('btnLang').textContent = (lang === 'en') ? '中' : 'EN';
  $('txtAppName').textContent    = L(UI.appName);
  $('txtAppTagline').textContent = L(UI.appTagline);
  $('dxSearch').placeholder = L(UI.search);
  // 無障礙屬性也要換語言。先前寫死在 index.html，切英文螢幕閱讀器仍讀中文。
  $('btnBack').setAttribute('aria-label', L(UI.back));
  $('btnLang').setAttribute('aria-label', L(UI.langToggle));
  $('btnBrowse').title = L(UI.browseTitle);
  $('txtDisclaimer').textContent = L(UI.disclaimer);
  $('txtReviewedThru').textContent = L(UI.reviewedThru);
  $('txtRefTitle').textContent = L(UI.refTitle);

  $('txtFirstAidTitle').textContent  = lang === 'en' ? 'First aid at the scene' : '現場急救速查';
  $('txtStorageTitle').textContent   = lang === 'en'
    ? 'Storage media for an avulsed tooth (IADT order of preference)'
    : '脫落牙的保存液（依 IADT 偏好順序）';

  document.querySelectorAll('[data-ui]').forEach(n => {
    const k = n.getAttribute('data-ui');
    if (UI[k]) n.textContent = L(UI[k]);
  });
}

function setLang(next){
  lang = next;
  localStorage.setItem(LANG_KEY, lang);
  applyUiText();
  renderRefBlocks();
  syncHintsBtn();
  // 目前停在哪個畫面就重畫哪一個
  if (curScreen === 'screenTree' || curScreen === 'screenImaging'){
    if (treePath.length) goNode(treePath[treePath.length - 1].node, true);
  }
  if (curScreen === 'screenPending' && pendingNode) renderPending(pendingNode);
  if (curScreen === 'screenBrowse') renderBrowse($('dxSearch').value);
  if (curScreen === 'screenDx' && curDx) openDx(curDx.id, true);
}

/* ---------- 首頁 ---------- */

/* 參考資料（急救速查、保存液、文獻）。掛在第一題底下，摺疊。
   「立即處理」與紅旗卡片依 Dr.Tso 要求移除——開啟 App 就該是第一題。 */
function renderRefBlocks(){
  const head = lang === 'en'
    ? ['What it looks like','Do now','Do not','How soon']
    : ['看起來像什麼','現場立即怎麼做','不要做什麼','就醫急迫度'];
  // 一次組完再指派：對 <table> 反覆 innerHTML += 會讓瀏覽器每次另包一個
  // <tbody>，每個 <tr> 各自落在不同 tbody 裡，選擇器與樣式都會走樣。
  $('tblFirstAid').innerHTML =
    '<tr>' + head.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr>' +
    EMERGENCY.rows.map(r =>
      '<tr><td>' + md(L(r.look)) + '</td><td>' + md(L(r.doNow)) +
      '</td><td>' + md(L(r.dont)) + '</td><td>' + md(L(r.when)) + '</td></tr>'
    ).join('');

  // 脫落恆牙的現場四步驟（規格書 19a–19d 就是為這裡畫的）
  const fa = $('faSteps');
  fa.innerHTML = '';
  FIRST_AID_STEPS.forEach((st, i) => {
    const box = el('div', 'fa-step');
    box.appendChild(el('span', 'fa-step-n', String(i + 1)));
    const f = figure(st.img, L(st.title), L(st.title));
    f.className = 'fa-step-fig';
    box.appendChild(f);
    box.appendChild(el('b', null, esc(L(st.title))));
    box.appendChild(el('small', null, md(L(st.text))));
    fa.appendChild(box);
  });

  // 根尖成熟度：成熟／未成熟並排，加根尖區放大對照
  $('txtApexTitle').textContent = L(APEX_BLOCK.title);
  const ax = $('apexFigs');
  ax.innerHTML = '';
  APEX_BLOCK.figs.forEach(g => {
    const box = el('div', 'apex-fig');
    const f = figure(g.img, L(g.cap), L(g.cap));
    f.className = 'apex-fig-img';
    box.appendChild(f);
    box.appendChild(el('small', null, esc(L(g.cap))));
    ax.appendChild(box);
  });
  const z = el('div', 'apex-fig wide');
  const zf = figure(APEX_BLOCK.zoom.img, L(APEX_BLOCK.zoom.cap), L(APEX_BLOCK.zoom.cap));
  zf.className = 'apex-fig-img';
  z.appendChild(zf);
  z.appendChild(el('small', null, esc(L(APEX_BLOCK.zoom.cap))));
  ax.appendChild(z);
  $('apexBody').innerHTML = md(L(APEX_BLOCK.body));

  const row = $('storageRow');
  row.innerHTML = '';
  STORAGE_MEDIA.forEach((m, i) => {
    const box = el('div', 'media' + (m.forbidden ? ' no' : ''));
    if (!m.forbidden) box.appendChild(el('span', 'rank', String(i + 1)));
    const fig = figure(m.img, L(m.name), L(m.name));
    fig.className = 'fig';
    box.appendChild(fig);
    box.appendChild(el('b', null, esc(L(m.name)) + (m.forbidden ? ' ✗' : '')));
    box.appendChild(el('small', null, esc(L(m.note))));
    row.appendChild(box);
  });
  $('txtPdlNote').innerHTML = md(L(PDL_NOTE));

  // 加到主畫面：已經是 standalone（從主畫面圖示開的）就不用再教一次
  const installed = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                 || window.navigator.standalone === true;
  $('cardInstall').hidden = installed;
  if (!installed){
    $('txtInstallTitle').textContent = L(UI.installTitle);
    $('listInstall').innerHTML = INSTALL_STEPS.map(s => '<li>' + md(L(s)) + '</li>').join('');
    $('txtInstallNote').innerHTML = md(L(UI.installNote));
  }

  const refs = $('listRefs');
  refs.innerHTML = '';
  REFERENCES.forEach(r => {
    refs.appendChild(el('li', null,
      '<span class="tag">' + esc(r.tag) + '</span>' + esc(r.text) +
      ' <a href="https://doi.org/' + esc(r.doi) + '" target="_blank" rel="noopener">doi:' + esc(r.doi) + '</a>'));
  });
  $('txtReviewedDate').textContent = REVIEWED_THROUGH;
}

/* ---------- 決策樹 ---------- */

function startTree(mode){
  if (mode){
    treeMode = mode;
    localStorage.setItem(MODE_KEY, treeMode);
  }
  treePath = [];
  // 一般模式不問紅旗，改成第一題上方的提示條，省一次點擊但不失去這道保險
  goNode(treeMode === 'normal' ? 'dentition' : TREE.start);
}

function setTreeMode(mode){
  if (mode === treeMode) return;
  treeMode = mode;
  localStorage.setItem(MODE_KEY, treeMode);
  syncHintsBtn();
  // 切模式就從頭走：兩種模式的節點序列不同，硬接會對不上
  startTree();
}

function syncHintsBtn(){
  const on = (treeMode === 'hints');
  const b = $('btnHints');
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.title = L(on ? UI.modeHintsOff : UI.modeHintsOn);
}

/* 三種節點型態共用的入口：question / imaging / result。
   一般模式下，影像節點在「推進 treePath 之前」就先判斷要不要跳過——
   推進去再跳會讓返回鍵回到這個節點又立刻被跳掉，變成退不出去。 */
function goNode(nodeId, keepPath){
  const node = TREE.nodes[nodeId];
  if (!node) return;

  if (treeMode === 'normal' && node.type === 'imaging'){
    if (node.gate) { goNode(node.next, keepPath); return; }   // 不顯示影像關卡，直接問影像所見
    fromBrowse = false;
    openDx(node.dx);                                          // 診斷已確定，直接開診斷頁
    return;
  }

  if (!keepPath) treePath.push({ node: nodeId });
  if (node.type === 'imaging') renderImaging(node);
  else renderQuestion(node);
}

function crumbsInto(host){
  host.innerHTML = '';
  treePath.forEach(p => {
    if (p.pick) host.appendChild(el('span', null, esc(p.pick)));
  });
}

// 選了某個出口之後往下走；o 可能帶 next / dx / result
function takeOption(o){
  treePath[treePath.length - 1].pick = L(o.label);
  if (o.dx) { fromBrowse = false; openDx(o.dx); }
  else if (o.result) renderResult(o.result);
  else goNode(o.next);
}

function renderQuestion(node){
  crumbsInto($('treeCrumbs'));
  $('treeQ').textContent = L(node.q);
  const hint = $('treeHint');
  if (node.hint){ hint.innerHTML = md(L(node.hint)); hint.hidden = false; }
  else { hint.hidden = true; }

  const opts = $('treeOpts');
  opts.innerHTML = '';
  node.opts.forEach(o => {
    const b = el('button', 'opt');
    if (o.img) b.appendChild(optThumb(b, o.img, L(o.label)));
    b.appendChild(el('span', 'opt-label', md(L(o.label))));
    b.addEventListener('click', () => takeOption(o));
    opts.appendChild(b);
  });
  show('screenTree');
}

/* 選項的示意圖。「斷面看得到什麼」這種分水嶺光靠文字分不出來，掛一張圖
   讓人知道要看哪裡。圖檔還沒進 repo 時**整塊拿掉**——不留佔位框，
   不然每一題都是一排空框，比沒有圖更難選。 */
function optThumb(btn, src, alt){
  const box = el('span', 'opt-fig');
  const img = new Image();
  img.alt = alt || '';
  img.addEventListener('error', () => {
    box.remove();
    btn.classList.remove('has-fig');
  });
  img.src = 'assets/' + src;
  box.appendChild(img);
  btn.classList.add('has-fig');
  return box;
}

/* 影像節點。
   gate:false → 診斷臨床上已經確定，只是告知該拍什麼，一個「繼續」出口。
   gate:true  → 非等 X 光不可，兩個出口（拍好了／還沒拍）。 */
function renderImaging(node){
  crumbsInto($('imgCrumbs'));

  const nn = $('imgNotNeeded');
  const box = $('imgFilmsBox');
  const skip = node.notNeeded || !node.films.length;
  $('imgWhyLabel').textContent = L(skip ? UI.imgWhyNot : UI.imgWhy);
  if (skip){
    nn.textContent = L(UI.imgNotNeeded);
    nn.hidden = false;
    box.hidden = true;
  } else {
    nn.hidden = true;
    box.hidden = false;
    const ul = $('imgFilms');
    ul.innerHTML = '';
    node.films.forEach(f => ul.appendChild(el('li', null, md(L(f)))));
  }
  $('imgWhy').innerHTML = md(L(node.why));

  const opts = $('imgOpts');
  opts.innerHTML = '';
  if (node.gate){
    const done = el('button', 'opt', esc(L(UI.imgDone)));
    done.addEventListener('click', () => {
      treePath[treePath.length - 1].pick = L(UI.imgDone);
      goNode(node.next);
    });
    opts.appendChild(done);

    const later = el('button', 'opt ghost-opt', esc(L(UI.imgPending)));
    later.addEventListener('click', () => renderPending(node));
    opts.appendChild(later);
  } else {
    const go = el('button', 'opt', esc(L(UI.imgContinue)));
    go.addEventListener('click', () => {
      treePath[treePath.length - 1].pick = L(UI.imgStep);
      fromBrowse = false;
      openDx(node.dx);
    });
    opts.appendChild(go);
  }
  show('screenImaging');
}

/* 還沒拍片：先給在拿到 X 光之前可以做的事，之後可以直接接回影像所見 */
let pendingNode = null;
function renderPending(node){
  pendingNode = node;
  $('pendingBody').innerHTML = md(L(node.beforeFilm || node.why));
  show('screenPending');
}

function renderResult(key){
  const r = TREE_RESULTS[key];
  if (!r) return;
  $('resultTitle').textContent = L(r.title);
  $('resultBody').innerHTML = L(r.body).split('\n\n')
    .map(par => '<p class="headline">' + md(par) + '</p>').join('');
  show('screenResult');
}

/* 在節點上按「返回」：退掉目前這個節點，回到上一個 */
function treeBack(){
  if (treePath.length <= 1) return;
  treePath.pop();
  backToLastNode();
}

/* 在終點頁（診斷、先送急診）按「返回」：終點不是節點，treePath 最後一個
   就是把我們送過來的那一題，所以只要清掉它的選擇再重畫，不能 pop。 */
function backToLastNode(){
  if (!treePath.length) return false;
  const last = treePath[treePath.length - 1];
  delete last.pick;
  goNode(last.node, true);
  return true;
}

/* ---------- 查閱列表 ---------- */

/* 分區標題照臨床習慣的講法寫，不要只寫「斷裂／脫位」——
   「牙齒與齒槽骨折斷」一看就知道這一區收的是哪些診斷。 */
const GROUP_LABEL = {
  fracture: { zh:'牙齒與齒槽骨折斷', en:'Tooth & alveolar fractures' },
  luxation: { zh:'震盪與脫位傷',     en:'Concussion & luxation injuries' },
  avulsion: { zh:'完全脫落',         en:'Avulsion' }
};

function renderBrowse(filter){
  const q = (filter || '').trim().toLowerCase();
  const host = $('browseList');
  host.innerHTML = '';
  let total = 0;

  [['permanent', UI.permanent], ['primary', UI.primary]].forEach(([dent, label]) => {
    const secs = [];
    ['fracture','luxation','avulsion'].forEach(grp => {
      const list = ALL_DX.filter(d =>
        d.dentition === dent && d.group === grp &&
        (!q || (L(d.name) + ' ' + d.name.en + ' ' + d.name.zh + ' ' + L(d.short)).toLowerCase().includes(q))
      );
      if (!list.length) return;
      total += list.length;
      secs.push(el('div', 'group-title', esc(L(GROUP_LABEL[grp]))));
      const box = el('div', 'dx-grid');
      list.forEach(d => box.appendChild(dxCard(d)));
      secs.push(box);
    });
    if (!secs.length) return;
    host.appendChild(el('h2', 'browse-sec', esc(L(label))));
    secs.forEach(n => host.appendChild(n));
  });

  $('browseLegend').innerHTML = '⚡ ' + md(L(UI.urgentLegend));
  $('browseEmpty').textContent = L(UI.noResult);
  $('browseEmpty').hidden = (total > 0);
}

/* 插圖在上、中文名在下、英文名當副標的卡片。兩欄排列，手機一眼掃得完。
   跟決策樹選項同一條規則：插圖還沒到就不留空框，卡片退回純文字。 */
function dxCard(d){
  const b = el('button', 'dx-card');
  const fig = el('div', 'dx-card-fig');
  const img = new Image();
  img.alt = L(d.name);
  img.addEventListener('error', () => { fig.remove(); b.classList.remove('has-fig'); });
  img.src = 'assets/' + d.img;
  fig.appendChild(img);
  b.appendChild(fig);
  b.classList.add('has-fig');

  b.appendChild(el('span', 'nm',
    esc(L(d.name)) +
    (d.timeCritical ? ' <span class="urgent-dot" title="' + esc(L(UI.urgentLegend)) + '">⚡</span>' : '')));
  b.appendChild(el('span', 'en', esc(lang === 'en' ? d.name.zh : d.name.en)));
  b.addEventListener('click', () => { fromBrowse = true; openDx(d.id); });
  return b;
}

/* ---------- 診斷頁 ---------- */

function openDx(id, keepScroll){
  const d = DX_BY_ID[id];
  if (!d) return;
  curDx = d;
  curSchedule = d.followUp;

  const fig = $('dxFig');
  fig.innerHTML = '';
  const f = figure(d.img, L(d.name), lang === 'en' ? 'illustration pending' : '插圖尚未上傳');
  while (f.firstChild) fig.appendChild(f.firstChild);
  // figure() 的 error 監聽掛在它自己的容器上，這裡重新掛一次
  const img = fig.querySelector('img');
  if (img) img.addEventListener('error', () => {
    fig.innerHTML = '';
    fig.appendChild(el('span', 'ph', lang === 'en' ? 'illustration pending' : '插圖尚未上傳'));
  });

  const chip = $('dxDentition');
  chip.textContent = L(d.dentition === 'permanent' ? UI.permanent : UI.primary);
  chip.className = 'chip';

  // 時間急迫的診斷不經影像節點就到這裡，所以要在頁面上補一句：
  // 影像仍然要照，但不能為了等 X 光延誤處置。
  $('dxUrgentChip').hidden = !d.timeCritical;
  $('dxUrgentBanner').hidden = !d.timeCritical;
  $('txtUrgentNoWait').textContent = L(UI.urgentNoWait);

  $('dxNameZh').textContent = L(d.name);
  $('dxNameEn').textContent = (lang === 'en') ? d.name.zh : d.name.en;
  $('dxShort').innerHTML    = md(L(d.short));
  $('dxSource').textContent = d.source;

  renderClinical(d);
  renderPublic(d);
  setAudience(aud);
  renderFollowUp(d);

  $('scheduleOut').hidden = true;
  // 寬螢幕兩欄時右欄卡片會自己捲，而且是同一個元素重複使用——
  // 不歸零的話，換到下一個診斷時卡片會停在上一個診斷捲到的位置。
  $('cardSchedule').scrollTop = 0;
  show('screenDx');
  if (keepScroll) window.scrollTo(0, 0);
  spyActive = -1;
  spySections();
}

function section(title, bodyNode){
  const c = el('div', 'card glass');
  c.appendChild(el('h2', null, esc(title)));
  c.appendChild(bodyNode);
  return c;
}

function bulletList(items, cls){
  const ul = el('ul', 'sec-list' + (cls ? ' ' + cls : ''));
  items.forEach(t => ul.appendChild(el('li', null, md(L(t)))));
  return ul;
}

function renderClinical(d){
  const host = $('paneClinical');
  host.innerHTML = '';
  const c = d.clin;

  host.appendChild(section(L(UI.secCriteria),  bulletList(c.criteria)));
  host.appendChild(section(L(UI.secImaging),   bulletList(c.imaging)));
  host.appendChild(section(L(UI.secTreatment), bulletList(c.treatment)));

  // 固定裝置
  const sp = el('div');
  if (c.splint){
    sp.appendChild(el('div', 'splint-box', md(L(c.splint))));
  } else {
    sp.appendChild(el('div', 'splint-box none', esc(L(UI.noSplint))));
  }
  if (c.aaeSplint) sp.appendChild(aaeNote(c.aaeSplint));
  if (c.splint) sp.appendChild(capFigure(SPLINT_FIG, 'splint-fig'));
  sp.appendChild(el('div', 'caveat', md(L(SPLINT_PRINCIPLE))));
  host.appendChild(section(L(UI.secSplint), sp));

  // 牙髓策略（脫位類加上測試判讀警告）
  const pulp = el('div');
  pulp.appendChild(bulletList(c.pulp));
  if (d.group === 'luxation' && d.dentition === 'permanent'){
    pulp.appendChild(el('div', 'caveat', md(L(PULP_TEST_CAVEAT))));
  }
  host.appendChild(section(L(UI.secPulp), pulp));

  // 理想／不良結果
  const good = (c.good || []).slice();
  const bad  = (c.bad  || []).slice();
  if (c.sharedOutcomes){
    L(PRIMARY_GOOD_OUTCOMES).forEach(t => good.push(t));
    L(PRIMARY_BAD_OUTCOMES).forEach(t => bad.push(t));
  }
  if (good.length) host.appendChild(section(L(UI.secGood), bulletList(good, 'good')));
  if (bad.length)  host.appendChild(section(L(UI.secBad),  bulletList(bad, 'bad')));

  // 證據等級
  const ev = el('div', 'evidence');
  if (d.evidence.g) ev.appendChild(el('span', 'ev-badge', 'G'));
  ev.appendChild(el('span', 'ev-badge', esc(d.evidence.e)));
  ev.appendChild(el('span', null,
    (lang === 'en' ? 'Certainty: ' : '確定性：') + esc(L(d.evidence.certainty))));
  const evBox = el('div');
  evBox.appendChild(ev);
  evBox.appendChild(el('p', 'muted small', md(
    lang === 'en'
      ? 'G = guideline / consensus recommendation. E1–E4 = the best direct human evidence behind it. A guideline recommendation is not the same as high-certainty evidence.'
      : 'G＝指引或共識的建議。E1–E4＝支持它的最佳直接人類證據等級。指引有建議，不等於背後有高確定性的證據。')));
  host.appendChild(section(L(UI.secEvidence), evBox));
}

function renderPublic(d){
  const host = $('panePublic');
  host.innerHTML = '';
  const p = d.pub;
  const mk = (title, text, cls) => {
    const c = el('div', 'card glass');
    c.appendChild(el('h2', null, esc(title)));
    c.appendChild(el('p', cls, md(L(text))));
    return c;
  };
  host.appendChild(mk(L(UI.secWhat),    p.what));
  host.appendChild(mk(L(UI.secDoNow),   p.doNow));
  // 「只捏牙冠」是脫落急救最關鍵的一條，家屬版光靠文字不夠。
  // 乳牙不再植，這張圖的用意（保住牙根表面的牙周韌帶細胞）不適用，所以只掛恆牙。
  if (d.id === 'p-avulsion'){
    const c = el('div', 'card glass');
    c.appendChild(capFigure(HOLD_CROWN_FIG, 'hold-fig'));
    host.appendChild(c);
  }
  host.appendChild(mk(L(UI.secDontDo),  p.dontDo));
  host.appendChild(mk(L(UI.secUrgency), p.urgency));

  if (d.dentition === 'primary'){
    const care = el('div');
    care.appendChild(bulletList(L(PRIMARY_PARENT_CARE)));
    host.appendChild(section(lang === 'en' ? 'Home care' : '回家後的照顧', care));
  }
}

function setAudience(a){
  aud = a;
  localStorage.setItem(AUD_KEY, aud);
  const isClin = (aud === 'clinical');
  $('paneClinical').hidden = !isClin;
  $('panePublic').hidden   = isClin;
  $('btnAudClinical').classList.toggle('active', isClin);
  $('btnAudPublic').classList.toggle('active', !isClin);
  buildDxNav();
}

/* ---------- 診斷頁章節目錄 ----------
   每次開診斷頁、切換醫師版／家屬版時重建。項目直接從畫面上的章節標題（h2）
   產生，資料檔的章節改了也不用回來改這裡。
   ≥1024px 時追蹤時程固定在右欄、一直看得到，那一項用 CSS 藏起來。 */
let navSections = [];
let spyActive = -1, spyLock = 0, spyTick = false;

function buildDxNav(){
  const nav = $('dxNav');
  nav.innerHTML = '';
  nav.setAttribute('aria-label', L(UI.dxNav));
  const pane = (aud === 'clinical') ? $('paneClinical') : $('panePublic');
  navSections = [];
  [...pane.children].forEach(card => {
    const h = card.querySelector(':scope > h2');
    if (h) navSections.push({ el: card, title: h.textContent });
    // 沒有標題的卡片（例如脫落家屬版那張「只捏牙冠」圖）不列入
  });
  navSections.push({ el: $('cardSchedule'), title: L(UI.secFollowUp), sched: true });

  navSections.forEach((sec, i) => {
    const b = el('button', 'dx-nav-item' + (sec.sched ? ' nav-sched' : ''), esc(sec.title));
    b.type = 'button';
    b.addEventListener('click', () => jumpToSection(i));
    nav.appendChild(b);
    sec.btn = b;
  });
  spyActive = -1;
  spySections();
}

// 章節列是橫的（手機、<1280px，黏在頂列下方）還是直的（≥1280px 左側欄）
function navIsRow(){ return getComputedStyle($('dxNav')).flexDirection === 'row'; }
// 追蹤時程是不是固定在右欄（≥1024px）——那時它不參與目錄
function schedPinned(){ return getComputedStyle($('cardSchedule')).position === 'sticky'; }

// 捲過去時章節標題要停在哪：頂列底下；橫向章節列也黏著時再往下讓出它的高度
function navOffset(){
  const bar = document.querySelector('.topbar').getBoundingClientRect().height;
  return bar + (navIsRow() ? $('dxNav').getBoundingClientRect().height : 0) + 10;
}

function jumpToSection(i){
  const sec = navSections[i];
  if (!sec) return;
  const y = sec.el.getBoundingClientRect().top + window.scrollY - navOffset();
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  // 先標示，不等捲完：捲到頁尾時最後幾節永遠頂不到上緣，等 scroll-spy 會標錯。
  // smooth 捲動那 0.7 秒內也不讓 scroll-spy 把標示搶走。
  setNavActive(i);
  spyLock = Date.now() + 700;
}

function setNavActive(i){
  if (i === spyActive) return;
  spyActive = i;
  navSections.forEach((sec, k) => {
    sec.btn.classList.toggle('on', k === i);
    if (k === i) sec.btn.setAttribute('aria-current', 'true');
    else sec.btn.removeAttribute('aria-current');
  });
  // 手機上章節列比螢幕寬：把目前這一項捲進看得到的範圍
  const nav = $('dxNav'), b = navSections[i] && navSections[i].btn;
  if (b && navIsRow()){
    const l = b.offsetLeft, r = l + b.offsetWidth;
    if (l < nav.scrollLeft + 8) nav.scrollTo({ left: Math.max(0, l - 16), behavior: 'smooth' });
    else if (r > nav.scrollLeft + nav.clientWidth - 8) nav.scrollTo({ left: r - nav.clientWidth + 16, behavior: 'smooth' });
  }
}

// scroll-spy：標示「最後一個標題已經捲過頂列的章節」
function spySections(){
  if (curScreen !== 'screenDx' || !navSections.length) return;
  if (Date.now() < spyLock) return;
  const off = navOffset() + 4, pinned = schedPinned();
  let idx = 0, last = 0;
  navSections.forEach((sec, i) => {
    if (sec.sched && pinned) return;
    if (!sec.el.getClientRects().length) return;
    last = i;
    if (sec.el.getBoundingClientRect().top - off <= 0) idx = i;
  });
  // 捲到頁尾時最後幾節頂不到上緣，直接標最後一節
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) idx = last;
  setNavActive(idx);
}

window.addEventListener('scroll', () => {
  if (spyTick) return;
  spyTick = true;
  requestAnimationFrame(() => { spyTick = false; spySections(); });
}, { passive: true });

// 頂列高度會因 iOS 安全區（瀏海）而不同，量出來給 CSS 用（章節列黏在它正下方）
function syncTopbarH(){
  document.documentElement.style.setProperty('--topbar-h',
    document.querySelector('.topbar').getBoundingClientRect().height + 'px');
}
window.addEventListener('resize', () => { syncTopbarH(); spySections(); });

/* ---------- 追蹤時程 ---------- */

function scheduleOptions(d){
  const out = [{ label: lang === 'en' ? 'Standard' : '標準', list: d.followUp }];
  if (d.followUpOpenApex){
    out[0].label = lang === 'en' ? 'Closed apex' : '根尖閉鎖';
    out.push({ label: lang === 'en' ? 'Open apex' : '根尖開放', list: d.followUpOpenApex });
  }
  if (d.altFollowUp){
    out.push({ label: L(d.altFollowUp.when), list: d.altFollowUp.list });
  }
  return out;
}

function renderFollowUp(d){
  const host = $('dxFollowUp');
  host.innerHTML = '';

  if (!d.followUp.length && d.noFollowUp){
    host.appendChild(el('div', 'splint-box none', md(L(d.noFollowUp))));
    $('cardSchedule').querySelector('.calc').hidden = true;
    return;
  }
  $('cardSchedule').querySelector('.calc').hidden = false;

  const opts = scheduleOptions(d);
  if (opts.length > 1){
    const tabs = el('div', 'aud-toggle');
    opts.forEach((o, i) => {
      const b = el('button', 'aud-btn' + (i === 0 ? ' active' : ''), esc(o.label));
      b.addEventListener('click', () => {
        curSchedule = o.list;
        tabs.querySelectorAll('.aud-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        drawFuList(host.querySelector('.fu-list'), o.list, d);
        $('scheduleOut').hidden = true;
      });
      tabs.appendChild(b);
    });
    host.appendChild(tabs);
  }

  const ul = el('ul', 'fu-list');
  host.appendChild(ul);
  drawFuList(ul, d.followUp, d);
  curSchedule = d.followUp;

  if (d.yearlyTo){
    host.appendChild(el('p', 'muted small', lang === 'en'
      ? 'Then yearly for at least ' + d.yearlyTo + ' years.'
      : '之後每年追蹤至少 ' + d.yearlyTo + ' 年。'));
  }
  if (d.yearlyNote) host.appendChild(el('p', 'muted small', md(L(d.yearlyNote))));
  if (d.ageFollowUp) host.appendChild(el('p', 'muted small', md(L(d.ageFollowUp))));
  if (d.aaeFollowUp) host.appendChild(aaeNote(d.aaeFollowUp));
  if (d.dentition === 'primary'){
    host.appendChild(el('p', 'muted small', md(L(PRIMARY_IMAGING_NOTE))));
    host.appendChild(aaeNote(PRIMARY_NO_AAE));
  }
}

/* 兩份指引不一致的地方並列。App 主幹是 IADT 2020（只有它涵蓋乳牙），
   AAE 2026 的不同建議用這個附註標出來，一致的地方不加，免得整頁都是註。 */
function aaeNote(txt){
  const box = el('div', 'aae-note');
  box.appendChild(el('span', 'aae-tag', 'AAE 2026'));
  box.appendChild(el('span', null, md(L(txt))));
  return box;
}

function drawFuList(ul, list, d){
  ul.innerHTML = '';
  list.forEach(f => {
    const li = el('li', f.off ? 'off' : null);
    li.appendChild(el('span', 'fu-when', esc(L(f.label)) + (f.off ? ' ✂' : '')));
    li.appendChild(el('span', null, md(L(f.purpose))));
    ul.appendChild(li);
  });
}

/* ---------- 日期計算 ---------- */

function addDays(iso, n){
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const p = x => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function scheduleRows(base){
  return curSchedule.map(f => ({
    when: L(f.label),
    date: Array.isArray(f.d) ? addDays(base, f.d[0]) + ' ~ ' + addDays(base, f.d[1]) : addDays(base, f.d),
    purpose: L(f.purpose),
    off: !!f.off
  }));
}

function calcSchedule(){
  const base = $('injuryDate').value;
  if (!base){
    toast(lang === 'en' ? 'Enter the date of injury first' : '請先填受傷日期');
    return;
  }
  const head = lang === 'en'
    ? ['Interval','Visit date','Focus of visit']
    : ['時間點', L(UI.visitDate), L(UI.visitPurpose)];
  $('tblSchedule').innerHTML =
    '<tr>' + head.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr>' +
    scheduleRows(base).map(r =>
      '<tr class="' + (r.off ? 'off' : '') + '"><td>' + esc(r.when) + (r.off ? ' ✂' : '') +
      '</td><td>' + esc(r.date) + '</td><td>' + md(r.purpose) + '</td></tr>'
    ).join('');
  $('scheduleOut').hidden = false;
  revealSchedule();
}

/* 寬螢幕兩欄時，右欄卡片高度有上限、會自己捲。結果表出現在卡片下半部時，
   使用者按了按鈕卻看不到任何變化——所以把卡片內部捲到「日期輸入列」，
   剛輸入的日期與結果開頭一起出現。
   手機單欄時卡片不會自己捲（那條 CSS 在 ≥1024px 的 media query 裡），
   結果本來就接在按鈕正下方，這裡不動它。 */
function revealSchedule(){
  const card = $('cardSchedule');
  if (getComputedStyle(card).overflowY !== 'auto') return;
  if (card.scrollHeight <= card.clientHeight) return;
  const calcRow = card.querySelector('.calc');
  card.scrollTo({ top: Math.max(0, calcRow.offsetTop - 12), behavior: 'smooth' });
}

function scheduleText(){
  const base = $('injuryDate').value;
  const d = curDx;
  const head = lang === 'en'
    ? 'Follow-up schedule — ' + d.name.en + ' (injury ' + base + ')'
    : '回診時程 — ' + d.name.zh + '（受傷日 ' + base + '）';
  const lines = scheduleRows(base).map(r =>
    '  ' + r.date + '  [' + r.when + ']' + (r.off ? ' ' + L(UI.splintRemoval) : '') + '  ' + r.purpose);
  const tail = [];
  if (d.yearlyTo) tail.push(lang === 'en'
    ? '  Then yearly for at least ' + d.yearlyTo + ' years.'
    : '  之後每年追蹤至少 ' + d.yearlyTo + ' 年。');
  if (d.yearlyNote)  tail.push('  ' + L(d.yearlyNote).replace(/\*\*/g, ''));
  if (d.ageFollowUp) tail.push('  ' + L(d.ageFollowUp).replace(/\*\*/g, ''));
  return [head].concat(lines, tail).join('\n');
}

function noteText(){
  const base = $('injuryDate').value;
  const d = curDx;
  const plain = s => L(s).replace(/\*\*/g, '');
  const dent = L(d.dentition === 'permanent' ? UI.permanent : UI.primary);
  const out = [];

  out.push(lang === 'en' ? '[Dental trauma record]' : '【牙外傷處置紀錄】');
  out.push((lang === 'en' ? 'Date of injury: ' : '受傷日期：') + (base || '—'));
  out.push((lang === 'en' ? 'Diagnosis: ' : '診斷：') +
           d.name.zh + ' / ' + d.name.en + '（' + dent + '）');
  out.push('');
  out.push(lang === 'en' ? 'Emergency management:' : '急性處置：');
  d.clin.treatment.forEach(t => out.push('  - ' + plain(t)));
  out.push('');
  out.push((lang === 'en' ? 'Splinting: ' : '固定裝置：') +
           (d.clin.splint ? plain(d.clin.splint) : L(UI.noSplint)));
  out.push('');
  out.push(lang === 'en' ? 'Pulp / endodontic plan:' : '牙髓與根管策略：');
  d.clin.pulp.forEach(t => out.push('  - ' + plain(t)));
  out.push('');
  out.push(base ? scheduleText() : (lang === 'en' ? 'Follow-up: see guideline' : '追蹤計畫：見指引'));
  out.push('');
  out.push((lang === 'en' ? 'Source: ' : '出處：') + d.source +
           (d.dentition === 'primary' ? ' (IADT 2020)' : ' (IADT 2020; cf. AAE 2026)') +
           ' | ' + L(UI.reviewedThru) + ' ' + REVIEWED_THROUGH);
  return out.join('\n');
}

/* ---------- 事件綁定 ---------- */

$('btnBack').addEventListener('click', goBack);
$('btnLang').addEventListener('click', () => setLang(lang === 'zh' ? 'en' : 'zh'));

// 右上角兩顆：影像提示開關、依診斷查閱
$('btnHints').addEventListener('click', () =>
  setTreeMode(treeMode === 'normal' ? 'hints' : 'normal'));
$('btnBrowse').addEventListener('click', () => {
  renderBrowse($('dxSearch').value);
  show('screenBrowse');
});

$('btnTreeRestart').addEventListener('click', () => startTree());
$('btnImgRestart').addEventListener('click', () => startTree());
$('btnResultRestart').addEventListener('click', () => startTree());
$('btnDxRestart').addEventListener('click', () => { curDx = null; startTree(); });

// 「還沒拍」看完先做什麼之後，X 光好了就直接接回影像所見那一題
$('btnPendingNext').addEventListener('click', () => {
  if (!pendingNode) return;
  treePath[treePath.length - 1].pick = L(UI.imgDone);
  goNode(pendingNode.next);
});

$('dxSearch').addEventListener('input', e => renderBrowse(e.target.value));

$('btnAudClinical').addEventListener('click', () => setAudience('clinical'));
$('btnAudPublic').addEventListener('click',   () => setAudience('public'));

$('btnCalc').addEventListener('click', calcSchedule);
$('btnCopySch').addEventListener('click',  () => copy(scheduleText()));
$('btnCopyNote').addEventListener('click', () => copy(noteText()));

/* ---------- 啟動 ---------- */

syncTopbarH();
applyUiText();
renderRefBlocks();
syncHintsBtn();
setAudience(aud);
startTree();          // 開啟 App 直接進第一題，沒有首頁

if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
