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

/* ═══ ④ 臨床安全文字（2026-10-02 Dr.Tso 修正）═══
   這幾段先前寫得太絕對，臨床上會誤導。釘在測試裡，免得被順手改回去。 */
console.log('— 臨床安全文字 —');
const water = D.STORAGE_MEDIA.find(m => m.id === 'water');
const ranked = D.STORAGE_MEDIA.filter(m => !m.fallback).map(m => m.id).join('→');
ok('★ 自來水是排名外的最後備案，不是禁用（IADT-2：poor medium, but better than air-drying）',
   !!water && water.fallback === true && !water.forbidden &&
   /最後備案/.test(water.note.zh) && /Last-resort/.test(water.note.en));
ok('★ 保存液正式排名仍是 牛奶 → HBSS → 唾液 → 生理食鹽水', ranked === 'milk→hbss→saliva→saline', ranked);
ok('★ 牙髓測試警語不再暗示所有根管治療都要等感染證據',
   /早期根管治療建議/.test(D.PULP_TEST_CAVEAT.zh) && /early endodontic treatment/.test(D.PULP_TEST_CAVEAT.en) &&
   !/決定是否根管治療的是/.test(D.PULP_TEST_CAVEAT.zh));
ok('★ 根尖成熟度說明：成熟度 × 外傷類型共同決定牙髓策略',
   /不能單獨決定/.test(D.APEX_BLOCK.body.zh) && /外傷類型/.test(D.APEX_BLOCK.body.zh) &&
   /type of traumatic injury/.test(D.APEX_BLOCK.body.en));
ok('★ 固定裝置原則不寫「一律」，並註明合併骨折可能需要較剛性的固定',
   !/一律/.test(D.SPLINT_PRINCIPLE.zh) && !/Always/.test(D.SPLINT_PRINCIPLE.en) &&
   /較剛性/.test(D.SPLINT_PRINCIPLE.zh) && /more rigid/.test(D.SPLINT_PRINCIPLE.en));
const allData = ['common.js', 'permanent.js', 'primary.js']
  .map(f => fs.readFileSync(path.join(root, 'data', f), 'utf8')).join('\n');
ok('術語用「再生牙髓治療」（台灣牙髓病學醫學辭彙），不再出現「活髓再生治療」', !/活髓再生治療/.test(allData));
ok('7–8 歲萌發寫「上顎中切牙」，不泛稱「上顎門齒」', !/上顎門齒[^。]*7–8/.test(allData));

/* ═══ ⑤ v2.6 三處修正（2026-10-03，CODEX 提出、回 IADT／AAE 原文查證）═══
   主文仍是 IADT 2020，AAE 2026 不同處只加附註；這裡同時釘住「附註有加」與「主文沒被換掉」。 */
console.log('— v2.6 指引差異 —');
const dx = id => D.PERMANENT_DX.find(d => d.id === id);
const crc = dx('p-crown-root-fracture-comp').clin;
ok('★ 複雜性牙冠牙根斷裂：成熟牙「通常」摘髓（IADT-1 Table 6：usually indicated），不再寫「修復需要時才」',
   /成熟牙通常需要摘除牙髓/.test(crc.pulp[0].zh) && /usually indicated/.test(crc.pulp[0].en) &&
   !/才摘除/.test(crc.pulp[0].zh) && !/when the restorative plan requires/.test(crc.pulp[0].en));
const lat = dx('p-lateral-luxation').clin;
ok('★ 側向脫位：IADT 的成熟牙早期根管治療仍在主文',
   lat.pulp.some(t => /通常較適合早期根管治療/.test(t.zh) && /early endodontic treatment/.test(t.en)));
ok('★ 側向脫位：另有 AAE 牙髓附註（診斷出牙髓壞死與感染才治療）',
   !!lat.aaePulp && /診斷出來才進行根管治療/.test(lat.aaePulp.zh) && /once they are diagnosed/.test(lat.aaePulp.en));
const intr = dx('p-intrusive-luxation').clin;
ok('★ 內縮性脫位：IADT 主文仍是未成熟牙不論深度先等再萌出',
   intr.treatment.some(t => /不論撞入深度/.test(t.zh) && /regardless of the degree of intrusion/.test(t.en)));
ok('★ 內縮性脫位：另有 AAE 處置附註（≤7 mm 等、>7 mm 4 週內手術或矯正復位）',
   !!intr.aaeTreatment && /≤7 mm/.test(intr.aaeTreatment.zh) && />7 mm/.test(intr.aaeTreatment.zh) &&
   /4 週內手術或矯正復位/.test(intr.aaeTreatment.zh) && /within 4 weeks/.test(intr.aaeTreatment.en));
ok('★ 根尖成熟度說明分別標出 IADT 2020 與 AAE 2026 對成熟根側向脫位的差異',
   /IADT 2020/.test(D.APEX_BLOCK.body.zh) && /AAE 2026[^。]*側向脫位/.test(D.APEX_BLOCK.body.zh) &&
   /IADT 2020/.test(D.APEX_BLOCK.body.en) && /AAE 2026[^.]*lateral luxation/.test(D.APEX_BLOCK.body.en));
/* 資料裡的每個 aae* 附註欄位都要有 renderClinical 接手；
   只加資料、忘了接畫面，附註就靜靜地不出現——UI 測試只點得到它走過的那幾頁 */
const aaeKeys = [...new Set(ALL_DX.flatMap(d =>
  Object.keys(d.clin || {}).filter(k => /^aae/.test(k)).map(k => 'c.' + k)       // 醫師版各段：renderClinical 的 c
    .concat(Object.keys(d).filter(k => /^aae/.test(k)).map(k => 'd.' + k))))];   // 追蹤時程：d.aaeFollowUp
const unwired = aaeKeys.filter(k => !new RegExp('\\b' + k.replace('.', '\\.') + '\\b').test(appJs));
ok('★ 資料裡每種 AAE 附註欄位都有畫到畫面上', unwired.length === 0, unwired.join('、') || aaeKeys.join('、'));

console.log('\n  診斷 ' + ALL_DX.length + '（恆牙 ' + D.PERMANENT_DX.length +
            ' ＋乳牙 ' + D.PRIMARY_DX.length + '）｜UI 字串 ' + uiKeys.size + ' 個');
console.log('  通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
