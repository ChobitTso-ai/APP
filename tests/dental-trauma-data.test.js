/* 牙外傷的資料稽核（純資料檢查，不開瀏覽器）

   兩件事：①每個診斷的欄位有沒有缺 ②中英文有沒有漏翻。

   為什麼 UI 測試蓋不到：UI 測試只點得到它自己走過的那幾頁，
   26 個診斷 × 每個十幾個欄位，靠點擊一個一個驗不實際；
   而「英文欄位裡混到中文」這種問題，畫面上看起來完全正常。 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'apps', 'dental-trauma-guide');
let code = '';
for (const f of ['common.js', 'permanent.js', 'primary.js']){
  code += fs.readFileSync(path.join(root, 'data', f), 'utf8') + '\n';
}
code += 'module.exports={UI,TREE,TREE_RESULTS,EMERGENCY,STORAGE_MEDIA,'
      + 'PERMANENT_DX,PRIMARY_DX,FIRST_AID_STEPS,APEX_BLOCK,SPLINT_FIG,HOLD_CROWN_FIG,'
      + 'INSTALL_STEPS,PDL_NOTE,SPLINT_PRINCIPLE,PULP_TEST_CAVEAT,PRIMARY_NO_AAE,'
      + 'PRIMARY_IMAGING_NOTE,PRIMARY_PARENT_CARE,PRIMARY_GOOD_OUTCOMES,PRIMARY_BAD_OUTCOMES};';
const mod = { exports:{} };
new Function('module', 'exports', code)(mod, mod.exports);
const D = mod.exports;
const ALL_DX = [].concat(D.PERMANENT_DX, D.PRIMARY_DX);
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html  = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function ok(n, c, d){
  if (c){ pass++; console.log('  ✓', n + (d ? '  → ' + d : '')); }
  else  { fail++; console.log('  ✗ FAIL:', n + (d ? '  → ' + d : '')); }
}
const brief = a => a.slice(0, 6).join(' ｜ ') + (a.length > 6 ? ` …另外 ${a.length - 6} 項` : '');

/* ═══ ① 診斷欄位完整性 ═══ */
console.log('— 診斷欄位 —');
const REQ_TOP  = ['id','dentition','group','name','short','img','source','clin','pub','evidence'];
const REQ_CLIN = ['criteria','imaging','treatment','pulp'];
const REQ_PUB  = ['what','doNow','dontDo','urgency'];

const missTop = [], missClin = [], missPub = [], missFu = [], missEv = [];
for (const d of ALL_DX){
  const tag = d.id;
  REQ_TOP.forEach(k => { if (d[k] === undefined || d[k] === null) missTop.push(`${tag}.${k}`); });

  if (d.clin){
    REQ_CLIN.forEach(k => {
      if (!Array.isArray(d.clin[k]) || !d.clin[k].length) missClin.push(`${tag}.clin.${k}`);
    });
    // 不需要固定裝置的診斷要明寫 splint:null，不能整個欄位不存在
    if (!('splint' in d.clin)) missClin.push(`${tag}.clin.splint（不需固定也要寫 null）`);
    const shared = d.clin.sharedOutcomes;
    if (!shared && !(d.clin.good && d.clin.good.length)) missClin.push(`${tag} 沒有理想結果`);
    if (!shared && !(d.clin.bad  && d.clin.bad.length))  missClin.push(`${tag} 沒有不良結果`);
  }
  if (d.pub) REQ_PUB.forEach(k => { if (!d.pub[k]) missPub.push(`${tag}.pub.${k}`); });
  if (d.evidence){
    if (!d.evidence.e) missEv.push(`${tag}.evidence.e`);
    if (!d.evidence.certainty) missEv.push(`${tag}.evidence.certainty`);
  }

  // 追蹤時程：可以沒有，但沒有就得寫明理由（例如牙釉質裂紋）
  if (Array.isArray(d.followUp)){
    if (!d.followUp.length && !d.noFollowUp) missFu.push(`${tag} 沒時程也沒 noFollowUp 說明`);
    d.followUp.forEach((f, i) => {
      if (f.d === undefined) missFu.push(`${tag}.followUp[${i}].d`);
      if (!f.label)   missFu.push(`${tag}.followUp[${i}].label`);
      if (!f.purpose) missFu.push(`${tag}.followUp[${i}].purpose（回診要做什麼）`);
    });
  }
  if (!('yearlyTo' in d)) missFu.push(`${tag}.yearlyTo（不需要也要寫 null）`);
}
ok('★ 26 個診斷的必填欄位都在', missTop.length === 0, brief(missTop) || ALL_DX.length + ' 個全齊');
ok('★ 醫師版五段（診斷標準／影像／處置／固定／牙髓）都有內容', missClin.length === 0, brief(missClin));
ok('★ 家屬版四段（是什麼／現在做什麼／不要做什麼／多急）都有內容', missPub.length === 0, brief(missPub));
ok('★ 追蹤時程每一次都有日期、標籤與「要做什麼」', missFu.length === 0, brief(missFu));
ok('證據等級與確定性都有填', missEv.length === 0, brief(missEv));

/* ═══ ② 中英文完整性 ═══ */
console.log('— 中英文 —');
const CJK = /[㐀-鿿豈-﫿　-〿＀-￯]/;
const noZh = [], noEn = [], same = [], mixed = [];

function walk(node, where){
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${where}[${i}]`));
  if (typeof node !== 'object') return;
  const ks = Object.keys(node);
  if (ks.includes('zh') || ks.includes('en')){
    const { zh, en } = node;
    if (!zh || !String(zh).trim()) noZh.push(where);
    if (!en || !String(en).trim()) noEn.push(where);
    if (zh && en){
      if (String(zh) === String(en)) same.push(where);
      // 英文欄位混到中文＝畫面上看起來正常，但切英文會冒出中文
      if (CJK.test(String(en)))  mixed.push(`${where}.en`);
      if (!CJK.test(String(zh))) mixed.push(`${where}.zh 沒有中文字`);
    }
    ks.filter(k => k !== 'zh' && k !== 'en').forEach(k => walk(node[k], `${where}.${k}`));
    return;
  }
  ks.forEach(k => walk(node[k], `${where}.${k}`));
}
walk(D.UI, 'UI');
walk(D.TREE, 'TREE');
walk(D.TREE_RESULTS, 'TREE_RESULTS');
walk(D.EMERGENCY, 'EMERGENCY');
walk(D.STORAGE_MEDIA, 'STORAGE_MEDIA');
walk(D.FIRST_AID_STEPS, 'FIRST_AID_STEPS');
walk(D.APEX_BLOCK, 'APEX_BLOCK');
walk(D.SPLINT_FIG, 'SPLINT_FIG');
walk(D.HOLD_CROWN_FIG, 'HOLD_CROWN_FIG');
walk(D.INSTALL_STEPS, 'INSTALL_STEPS');
['PDL_NOTE','SPLINT_PRINCIPLE','PULP_TEST_CAVEAT','PRIMARY_NO_AAE','PRIMARY_IMAGING_NOTE',
 'PRIMARY_PARENT_CARE','PRIMARY_GOOD_OUTCOMES','PRIMARY_BAD_OUTCOMES'].forEach(k => walk(D[k], k));
ALL_DX.forEach(d => walk(d, d.id));

ok('★ 沒有缺中文的欄位', noZh.length === 0, brief(noZh));
ok('★ 沒有缺英文的欄位（漏翻）', noEn.length === 0, brief(noEn));
ok('★ 沒有中英文一模一樣的欄位（照抄＝沒翻）', same.length === 0, brief(same));
ok('★ 英文欄位裡沒有混到中文', mixed.length === 0, brief(mixed));

/* ═══ ③ 介面字串的接線 ═══ */
console.log('— 介面字串 —');
const uiKeys = new Set(Object.keys(D.UI));
const usedUi = [...html.matchAll(/data-ui="([^"]+)"/g)].map(x => x[1]);
const badUi = [...new Set(usedUi)].filter(k => !uiKeys.has(k));
ok('index.html 的每個 data-ui 都對得到 UI 的鍵', badUi.length === 0, brief(badUi));

const allSrc = code + appJs;
const deadUi = [...uiKeys].filter(k =>
  !usedUi.includes(k) && !new RegExp('UI\\.' + k + '\\b').test(allSrc));
ok('UI 裡沒有沒人用的死字串', deadUi.length === 0, brief(deadUi));

/* 寫死在 HTML 的中文屬性：畫面上的文字有 data-ui 會被換掉，
   但 aria-label／title／placeholder 不會，螢幕閱讀器切英文仍讀中文。
   先前 btnBack 的 aria-label、btnLang 的 aria-label、btnBrowse 的 title
   就是這樣卡在中文的。 */
const attrs = [...html.matchAll(/id="([^"]+)"[^>]*?(aria-label|title|placeholder)="([^"]*[一-鿿][^"]*)"/g)]
  .concat([...html.matchAll(/(aria-label|title|placeholder)="([^"]*[一-鿿][^"]*)"[^>]*?id="([^"]+)"/g)]
    .map(m => [m[0], m[3], m[1], m[2]]));
const untranslated = attrs
  .map(m => ({ id:m[1], attr:m[2], val:m[3] }))
  .filter(a => {
    const setters = [
      new RegExp(`\\$\\('${a.id}'\\)\\.setAttribute\\('${a.attr}'`),
      new RegExp(`\\$\\('${a.id}'\\)\\.${a.attr}\\s*=`),
      new RegExp(`\\$\\('${a.id}'\\)\\.placeholder\\s*=`)
    ];
    const byVar = a.id === 'btnHints' && /b\.title\s*=\s*L\(/.test(appJs);   // syncHintsBtn 用區域變數
    return !byVar && !setters.some(rx => rx.test(appJs));
  })
  .map(a => `#${a.id} 的 ${a.attr}="${a.val}"`);
ok('★ HTML 裡寫死中文的 aria-label／title／placeholder 都有被換語言',
   untranslated.length === 0, brief(untranslated) || '全部都會換');

console.log('\n  診斷 ' + ALL_DX.length + '（恆牙 ' + D.PERMANENT_DX.length +
            ' ＋乳牙 ' + D.PRIMARY_DX.length + '）｜UI 字串 ' + uiKeys.size + ' 個');
console.log('  通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
