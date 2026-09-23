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
     guided  完整流程，紅旗獨立一題，影像節點全部顯示
     fast    紅旗改成第一題上方的提示條，影像的「提醒頁」整頁跳過
   快速模式**不會**跳掉「影像所見」那一題——跳了就分不出半脫位與牙根斷裂。
   跳掉的影像提醒內容也沒有消失，診斷頁本來就有「建議影像」那一段。 */
let treeMode = localStorage.getItem(MODE_KEY) === 'fast' ? 'fast' : 'guided';
let curDx = null;        // 目前開啟的診斷
let curSchedule = null;  // 目前採用的追蹤時程（可能是替代版本）
let treePath = [];       // 決策樹走過的節點與選項

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

/* ---------- 畫面切換 ---------- */

const SCREENS = ['screenHome','screenTree','screenImaging','screenPending','screenResult','screenBrowse','screenDx'];
function show(id){
  SCREENS.forEach(s => { $(s).hidden = (s !== id); });
  window.scrollTo(0, 0);
}

/* ---------- 語言 ---------- */

function applyUiText(){
  document.documentElement.lang = (lang === 'en') ? 'en' : 'zh-TW';
  $('btnLang').textContent = (lang === 'en') ? '中' : 'EN';
  $('txtAppName').textContent    = L(UI.appName);
  $('txtAppTagline').textContent = L(UI.appTagline);
  $('txtModeAsk').textContent        = L(UI.modeAsk);
  $('txtModeAskDesc').textContent    = L(UI.modeAskDesc);
  $('txtModeFast').textContent       = L(UI.modeFast);
  $('txtModeFastDesc').textContent   = L(UI.modeFastDesc);
  $('txtModeBrowse').textContent     = L(UI.modeBrowse);
  $('txtModeBrowseDesc').textContent = L(UI.modeBrowseDesc);
  $('dxSearch').placeholder = L(UI.search);
  $('txtDisclaimer').textContent = L(UI.disclaimer);
  $('txtReviewedThru').textContent = L(UI.reviewedThru);
  $('txtRefTitle').textContent = L(UI.refTitle);

  $('txtEmergencyTitle').textContent = lang === 'en' ? 'Act now' : '立即處理';
  $('txtRedFlagTitle').textContent   = lang === 'en' ? 'Rule these out first' : '先排除這些狀況';
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
  renderHome();
  // 決策樹、影像節點、終點頁都要跟著換語言；用目前停在哪個畫面決定重畫哪一個
  if (!$('screenTree').hidden || !$('screenImaging').hidden){
    if (treePath.length) goNode(treePath[treePath.length - 1].node, true);
  }
  if (!$('screenPending').hidden && pendingNode) renderPending(pendingNode);
  if (!$('screenBrowse').hidden) renderBrowse($('dxSearch').value);
  if (curDx) openDx(curDx.id, true);
}

/* ---------- 首頁 ---------- */

function renderHome(){
  $('txtEmergencyHeadline').innerHTML = md(L(EMERGENCY.headline));

  const rf = $('listRedFlags');
  rf.innerHTML = '';
  L(EMERGENCY.redFlags).forEach(t => rf.appendChild(el('li', null, esc(t))));
  $('txtRedFlagAction').textContent = L(EMERGENCY.redFlagAction);

  // 現場急救速查表
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

  // 保存液
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

  // 參考文獻
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
  // 快速模式不問紅旗，改成第一題上方的提示條，省一次點擊但不失去這道保險
  goNode(treeMode === 'fast' ? 'dentition' : TREE.start);
}

function setTreeMode(mode){
  if (mode === treeMode) return;
  treeMode = mode;
  localStorage.setItem(MODE_KEY, treeMode);
  // 切模式就從頭走：兩種模式的節點序列不同，硬接會對不上
  startTree();
}

/* 三種節點型態共用的入口：question / imaging / result。
   快速模式下，影像節點在「推進 treePath 之前」就先判斷要不要跳過——
   推進去再跳會讓返回鍵回到這個節點又立刻被跳掉，變成退不出去。 */
function goNode(nodeId, keepPath){
  const node = TREE.nodes[nodeId];
  if (!node) return;

  if (treeMode === 'fast' && node.type === 'imaging'){
    if (node.gate) { goNode(node.next, keepPath); return; }   // 跳過提醒頁，直接問影像所見
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
  if (o.dx) openDx(o.dx);
  else if (o.result) renderResult(o.result);
  else goNode(o.next);
}

function renderQuestion(node){
  crumbsInto($('treeCrumbs'));
  $('txtTreeMode').textContent = L(treeMode === 'fast' ? UI.modeNowFast : UI.modeNowGuided);
  // 紅旗提示條只在快速模式的第一題出現——那是它真正有用的時機
  const rf = $('fastRedFlag');
  if (treeMode === 'fast' && treePath.length === 1){
    rf.textContent = '⚠ ' + L(UI.fastRedFlag);
    rf.hidden = false;
  } else {
    rf.hidden = true;
  }
  $('treeQ').textContent = L(node.q);
  const hint = $('treeHint');
  if (node.hint){ hint.innerHTML = md(L(node.hint)); hint.hidden = false; }
  else { hint.hidden = true; }

  const opts = $('treeOpts');
  opts.innerHTML = '';
  node.opts.forEach(o => {
    const b = el('button', 'opt', md(L(o.label)));
    b.addEventListener('click', () => takeOption(o));
    opts.appendChild(b);
  });
  $('btnTreeBack').hidden = (treePath.length <= 1);
  show('screenTree');
}

/* 影像節點。
   gate:false → 診斷臨床上已經確定，只是告知該拍什麼，一個「繼續」出口。
   gate:true  → 非等片子不可，兩個出口（拍好了／還沒拍）。 */
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
      openDx(node.dx);
    });
    opts.appendChild(go);
  }
  $('btnImgBack').hidden = (treePath.length <= 1);
  show('screenImaging');
}

/* 還沒拍片：先給在拿到片子之前可以做的事，之後可以直接接回影像所見 */
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

const GROUP_LABEL = {
  fracture: { zh:'斷裂', en:'Fractures' },
  luxation: { zh:'脫位', en:'Luxations' },
  avulsion: { zh:'脫落', en:'Avulsion' }
};

function renderBrowse(filter){
  const q = (filter || '').trim().toLowerCase();
  const host = $('browseList');
  host.innerHTML = '';
  let total = 0;

  [['permanent', UI.permanent], ['primary', UI.primary]].forEach(([dent, label]) => {
    ['fracture','luxation','avulsion'].forEach(grp => {
      const list = ALL_DX.filter(d =>
        d.dentition === dent && d.group === grp &&
        (!q || (L(d.name) + ' ' + d.name.en + ' ' + d.name.zh + ' ' + L(d.short)).toLowerCase().includes(q))
      );
      if (!list.length) return;
      total += list.length;
      host.appendChild(el('div', 'group-title',
        esc(L(label)) + ' · ' + esc(L(GROUP_LABEL[grp]))));
      const box = el('div', 'dx-list');
      list.forEach(d => box.appendChild(dxItem(d)));
      host.appendChild(box);
    });
  });

  $('browseEmpty').textContent = L(UI.noResult);
  $('browseEmpty').hidden = (total > 0);
}

function dxItem(d){
  const b = el('button', 'dx-item');
  const th = figure(d.img, L(d.name), '🦷');
  th.className = 'thumb';
  b.appendChild(th);
  b.appendChild(el('div', 'nm',
    '<b>' + esc(L(d.name)) + (d.timeCritical || d.doNotReplant ? ' <span class="urgent-dot">●</span>' : '') +
    '</b><i>' + esc(lang === 'en' ? d.name.zh : d.name.en) + '</i>'));
  b.addEventListener('click', () => openDx(d.id));
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
  // 影像仍然要照，但不能為了等片子延誤處置。
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
  $('btnDxRestart').hidden = !treePath.length;   // 從查閱列表進來的沒有樹可重來
  show('screenDx');
  if (keepScroll) window.scrollTo(0, 0);
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
}

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
  if (d.dentition === 'primary'){
    host.appendChild(el('p', 'muted small', md(L(PRIMARY_IMAGING_NOTE))));
  }
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
           ' (IADT 2020) | ' + L(UI.reviewedThru) + ' ' + REVIEWED_THROUGH);
  return out.join('\n');
}

/* ---------- 事件綁定 ---------- */

$('btnLang').addEventListener('click', () => setLang(lang === 'zh' ? 'en' : 'zh'));
$('btnHome').addEventListener('click', () => { curDx = null; show('screenHome'); });

$('btnModeAsk').addEventListener('click', () => startTree('guided'));
$('btnModeFast').addEventListener('click', () => startTree('fast'));
$('btnTreeMode').addEventListener('click', () =>
  setTreeMode(treeMode === 'fast' ? 'guided' : 'fast'));
$('btnModeBrowse').addEventListener('click', () => {
  renderBrowse($('dxSearch').value);
  show('screenBrowse');
});

$('btnTreeBack').addEventListener('click', treeBack);
$('btnTreeRestart').addEventListener('click', () => startTree());
$('btnImgBack').addEventListener('click', treeBack);
$('btnImgRestart').addEventListener('click', () => startTree());
$('btnResultBack').addEventListener('click', backToLastNode);
$('btnResultRestart').addEventListener('click', () => startTree());

// 「還沒拍」看完先做什麼之後，片子好了就直接接回影像所見那一題
$('btnPendingNext').addEventListener('click', () => {
  if (!pendingNode) return;
  treePath[treePath.length - 1].pick = L(UI.imgDone);
  goNode(pendingNode.next);
});
$('btnPendingBack').addEventListener('click', () => {
  if (pendingNode) renderImaging(pendingNode);
});

$('btnDxRestart').addEventListener('click', () => { curDx = null; startTree(); });
$('btnDxBack').addEventListener('click', () => {
  curDx = null;
  // 從決策樹進來的退回最後一題；從查閱列表進來的回列表
  if (!backToLastNode()) show('screenBrowse');
});

$('dxSearch').addEventListener('input', e => renderBrowse(e.target.value));

$('btnAudClinical').addEventListener('click', () => setAudience('clinical'));
$('btnAudPublic').addEventListener('click',   () => setAudience('public'));

$('btnCalc').addEventListener('click', calcSchedule);
$('btnCopySch').addEventListener('click',  () => copy(scheduleText()));
$('btnCopyNote').addEventListener('click', () => copy(noteText()));

/* ---------- 啟動 ---------- */

applyUiText();
renderHome();
setAudience(aud);
show('screenHome');

if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
