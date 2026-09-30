/* 牙外傷決策樹的結構稽核（純資料檢查，不開瀏覽器）

   這一組不測畫面，測的是決策樹這張圖本身有沒有壞掉：
   走不到的節點、斷掉的連結、沒有出口的選項、繞回去的迴圈。
   這些在 UI 測試裡不一定看得出來——UI 測試只走它自己寫死的那幾條路徑，
   一個沒人指向的孤島節點，點不到也就測不到。

   **要照 app.js 的 goNode() 語意跑**：一般模式不顯示影像關卡，
   gate:true 直接跳 next、gate:false 直接開診斷，所以兩種模式的可達集合
   不一樣。只用資料層的 next 去走會把一般模式算錯。 */
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'apps', 'dental-trauma-guide', 'data');
let code = '';
for (const f of ['common.js', 'permanent.js', 'primary.js']){
  code += fs.readFileSync(path.join(base, f), 'utf8') + '\n';
}
code += 'module.exports={TREE,TREE_RESULTS,PERMANENT_DX,PRIMARY_DX};';
const mod = { exports:{} };
new Function('module', 'exports', code)(mod, mod.exports);
const { TREE, TREE_RESULTS, PERMANENT_DX, PRIMARY_DX } = mod.exports;

const ALL_DX  = [].concat(PERMANENT_DX, PRIMARY_DX);
const DX_IDS  = new Set(ALL_DX.map(d => d.id));
const RES_IDS = new Set(Object.keys(TREE_RESULTS));
const NODE_IDS = Object.keys(TREE.nodes);

let pass = 0, fail = 0;
function ok(n, c, d){
  if (c){ pass++; console.log('  ✓', n + (d ? '  → ' + d : '')); }
  else  { fail++; console.log('  ✗ FAIL:', n + (d ? '  → ' + d : '')); }
}

/* ---------- 1. 參照完整性 ---------- */
const broken = [], deadEnd = [], ambiguous = [];
for (const [id, n] of Object.entries(TREE.nodes)){
  const hop = (label, target, pool, kind) => {
    if (target && !pool.has(target)) broken.push(`${id}.${label} → 不存在的${kind}「${target}」`);
  };
  if (n.type === 'imaging'){
    hop('next', n.next, new Set(NODE_IDS), '節點');
    hop('dx', n.dx, DX_IDS, '診斷');
    if (n.gate && !n.next)  deadEnd.push(`${id}（gate:true 但沒有 next）`);
    if (!n.gate && !n.dx)   deadEnd.push(`${id}（gate:false 但沒有 dx）`);
  } else if (!n.opts || !n.opts.length){
    deadEnd.push(`${id}（沒有任何選項）`);
  } else {
    n.opts.forEach((o, i) => {
      const outs = ['next', 'dx', 'result'].filter(k => o[k]);
      if (!outs.length)    deadEnd.push(`${id} 選項 ${i + 1}（沒有出口）`);
      if (outs.length > 1) ambiguous.push(`${id} 選項 ${i + 1}（同時有 ${outs.join('＋')}）`);
      hop(`opts[${i}].next`,   o.next,   new Set(NODE_IDS), '節點');
      hop(`opts[${i}].dx`,     o.dx,     DX_IDS,  '診斷');
      hop(`opts[${i}].result`, o.result, RES_IDS, '終點頁');
    });
  }
}
console.log('— 參照完整性 —');
ok('★ 沒有斷掉的連結（next／dx／result 都指得到）', broken.length === 0, broken.join(' ｜ '));
ok('★ 沒有走不出去的選項', deadEnd.length === 0, deadEnd.join(' ｜ '));
ok('沒有同時掛兩個出口的選項', ambiguous.length === 0, ambiguous.join(' ｜ '));

/* ---------- 2. 可達性（照 goNode() 語意）---------- */
function reach(mode){
  const start = mode === 'normal' ? 'dentition' : TREE.start;
  const nodes = new Set(), dx = new Set(), res = new Set();
  const stack = [start];
  while (stack.length){
    const id = stack.pop();
    const n = TREE.nodes[id];
    if (!n) continue;
    if (mode === 'normal' && n.type === 'imaging'){     // 一般模式跳過影像關卡
      if (n.gate){ if (!nodes.has(n.next)) stack.push(n.next); }
      else dx.add(n.dx);
      continue;
    }
    if (nodes.has(id)) continue;
    nodes.add(id);
    if (n.type === 'imaging'){
      if (n.gate) stack.push(n.next); else dx.add(n.dx);
      continue;
    }
    for (const o of n.opts){
      if (o.dx) dx.add(o.dx);
      else if (o.result) res.add(o.result);
      else if (o.next) stack.push(o.next);
    }
  }
  return { nodes, dx, res };
}
const N = reach('normal'), H = reach('hints');

console.log('— 可達性 —');
const orphan = NODE_IDS.filter(id => !H.nodes.has(id) && !N.nodes.has(id));
ok('★ 沒有兩種模式都走不到的節點', orphan.length === 0,
   orphan.join(' ') || NODE_IDS.length + ' 個節點全部走得到');

const allDx = new Set([...N.dx, ...H.dx]);
const lostDx = ALL_DX.filter(d => !allDx.has(d.id)).map(d => d.id + '（' + d.name.zh + '）');
ok('★ 26 個診斷決策樹全部走得到（不是只能從查閱開）',
   lostDx.length === 0 && allDx.size === ALL_DX.length,
   lostDx.join(' ｜ ') || allDx.size + '/' + ALL_DX.length);

const lostRes = [...RES_IDS].filter(k => !N.res.has(k) && !H.res.has(k));
ok('終點頁走得到', lostRes.length === 0, lostRes.join(' ') || RES_IDS.size + '/' + RES_IDS.size);

/* 兩種模式的診斷覆蓋必須一樣，否則切模式會漏掉診斷 */
const onlyH = [...H.dx].filter(x => !N.dx.has(x));
const onlyN = [...N.dx].filter(x => !H.dx.has(x));
ok('★ 兩種模式到得了的診斷完全相同（切模式不會漏診斷）',
   onlyH.length === 0 && onlyN.length === 0,
   [...onlyH.map(x => '只有提示模式：' + x), ...onlyN.map(x => '只有一般模式：' + x)].join(' ｜ ')
   || '兩邊都是 ' + N.dx.size + ' 個');

/* 影像關卡本來就只有提示模式才出現，這裡確認它們確實「只」在提示模式 */
const hintsOnly = NODE_IDS.filter(id => H.nodes.has(id) && !N.nodes.has(id));
const unexpected = hintsOnly.filter(id => TREE.nodes[id].type !== 'imaging' && id !== 'redflag');
ok('只有提示模式才到得了的節點，全部是影像關卡或紅旗（符合設計）',
   unexpected.length === 0,
   unexpected.join(' ') || hintsOnly.length + ' 個（影像關卡 ' + (hintsOnly.length - 1) + ' ＋ 紅旗 1）');

/* ---------- 3. 迴圈 ---------- */
const cycles = [];
{
  const done = new Set(), onPath = new Set();
  const walk = (id, trail) => {
    const n = TREE.nodes[id];
    if (!n) return;
    if (onPath.has(id)){ cycles.push(trail.concat(id).join('→')); return; }
    if (done.has(id)) return;
    done.add(id); onPath.add(id);
    const outs = n.type === 'imaging'
      ? (n.gate ? [n.next] : [])
      : n.opts.map(o => o.next).filter(Boolean);
    outs.forEach(t => walk(t, trail.concat(id)));
    onPath.delete(id);
  };
  walk(TREE.start, []);
  walk('dentition', []);
}
console.log('— 其他 —');
ok('★ 沒有繞回去的迴圈（不會卡住出不來）', cycles.length === 0, cycles.join(' ｜ '));

/* ---------- 4. 選項品質 ---------- */
const dup = [], single = [];
for (const [id, n] of Object.entries(TREE.nodes)){
  if (!n.opts) continue;
  if (n.opts.length === 1) single.push(id);
  const seen = new Map();
  n.opts.forEach((o, i) => {
    const k = o.label.zh;
    if (seen.has(k)) dup.push(`${id}：第 ${seen.get(k) + 1} 與第 ${i + 1} 個都是「${k}」`);
    else seen.set(k, i);
  });
}
ok('同一題裡沒有重覆的選項文字', dup.length === 0, dup.join(' ｜ '));
ok('沒有只有一個選項的問題（那種題目沒有分辨作用）', single.length === 0, single.join(' '));

/* 每個選項中英文都要有 */
const noEn = [];
for (const [id, n] of Object.entries(TREE.nodes)){
  if (n.q && !n.q.en) noEn.push(id + '.q');
  if (n.opts) n.opts.forEach((o, i) => { if (!o.label.en) noEn.push(`${id}.opts[${i}]`); });
}
ok('題目與選項都有英文', noEn.length === 0, noEn.join(' '));

console.log('\n  節點 ' + NODE_IDS.length +
            '（一般模式 ' + N.nodes.size + '、提示模式 ' + H.nodes.size + '）' +
            '｜診斷 ' + ALL_DX.length + ' 全可達');
console.log('  通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
