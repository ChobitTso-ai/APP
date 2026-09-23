/* =========================================================
   牙外傷處置指南 —— 共用資料層
   介面文字、現場急救、保存液、決策樹、參考文獻

   中文術語一律依《台灣牙髓病學醫學辭彙》，詳見 CONTENT-SOURCES.md。
   臨床數字一律依 IADT 2020 原文，不採用二手整理。
   ©Tso KY - All Rights Reserved
   ========================================================= */

/* ---- 介面文字（zh 繁體中文 / en English）---- */
const UI = {
  appName:      { zh: '牙外傷處置指南',           en: 'Dental Trauma Guide' },
  appTagline:   { zh: '依 IADT 2020 指引整理',     en: 'Based on the IADT 2020 Guidelines' },

  modeAsk:      { zh: '我不確定是哪一種',          en: "I'm not sure which injury" },
  modeAskDesc:  { zh: '一路問答，導到診斷與處置',   en: 'Answer a few questions to reach the diagnosis' },
  modeBrowse:   { zh: '我知道診斷，直接查',        en: 'I know the diagnosis' },
  modeBrowseDesc:{ zh: '依分類列表直接開',         en: 'Browse the full list by category' },

  audClinical:  { zh: '醫師版',                   en: 'Clinician' },
  audPublic:    { zh: '家屬版',                   en: 'Patient / Family' },

  permanent:    { zh: '恆牙',                     en: 'Permanent teeth' },
  primary:      { zh: '乳牙',                     en: 'Primary teeth' },

  secWhat:      { zh: '發生什麼事',               en: 'What happened' },
  secDoNow:     { zh: '現在要做什麼',             en: 'What to do now' },
  secDontDo:    { zh: '不要做什麼',               en: 'What not to do' },
  secUrgency:   { zh: '多久內就醫',               en: 'How soon to be seen' },
  secWarning:   { zh: '危險警訊',                 en: 'Warning signs' },

  secCriteria:  { zh: '診斷標準',                 en: 'Diagnostic criteria' },
  secImaging:   { zh: '建議影像',                 en: 'Recommended imaging' },
  secTreatment: { zh: '急性處置',                 en: 'Emergency management' },
  secSplint:    { zh: '固定裝置',                 en: 'Splinting' },
  secPulp:      { zh: '牙髓與根管策略',           en: 'Pulp / endodontic strategy' },
  secFollowUp:  { zh: '追蹤時程',                 en: 'Follow-up' },
  secGood:      { zh: '理想結果',                 en: 'Favorable outcomes' },
  secBad:       { zh: '不良結果',                 en: 'Unfavorable outcomes' },
  secEvidence:  { zh: '證據等級',                 en: 'Evidence' },

  noSplint:     { zh: '不需固定',                 en: 'No splint required' },
  splintRemoval:{ zh: '拆除固定裝置',             en: 'Splint removal' },

  injuryDate:   { zh: '受傷日期',                 en: 'Date of injury' },
  calcSchedule: { zh: '產生回診時程',             en: 'Generate follow-up schedule' },
  copySchedule: { zh: '複製時程',                 en: 'Copy schedule' },
  copyNote:     { zh: '複製病歷草稿',             en: 'Copy clinical note' },
  copied:       { zh: '已複製',                   en: 'Copied' },
  visitDate:    { zh: '回診日',                   en: 'Visit date' },
  visitPurpose: { zh: '該次重點',                 en: 'Focus of visit' },

  back:         { zh: '返回',                     en: 'Back' },
  restart:      { zh: '重新開始',                 en: 'Start over' },
  search:       { zh: '搜尋診斷…',                en: 'Search diagnoses…' },
  noResult:     { zh: '找不到符合的診斷',          en: 'No matching diagnosis' },

  sourceLabel:  { zh: '出處',                     en: 'Source' },
  refTitle:     { zh: '參考文獻',                 en: 'References' },
  reviewedThru: { zh: '臨床內容核對至',           en: 'Clinical content reviewed through' },

  disclaimer: {
    zh: '本工具整理自 IADT 2020 指引，僅供牙科專業人員參考，不能取代臨床判斷、親自檢查與影像診斷。緊急狀況請直接就醫。',
    en: 'This tool summarizes the IADT 2020 guidelines for reference by dental professionals. It does not replace clinical judgment, direct examination or imaging. In an emergency, seek care immediately.'
  },
};

/* ---- 現場急救：家屬版速查（首屏）---- */
const EMERGENCY = {
  headline: {
    zh: '掉出來的是恆牙：能安全立即放回去就立即再植；不能再植就保持濕潤並立刻看牙醫。掉出來的是乳牙：不要放回去。',
    en: 'Avulsed permanent tooth: replant immediately if it can be done safely; otherwise keep it moist and see a dentist at once. Avulsed primary tooth: do not replant.'
  },
  // 先排除需要先走一般醫療急救的狀況
  redFlags: {
    zh: ['失去意識', '持續嘔吐', '神經學症狀', '疑似顏面或頸椎骨折', '無法控制的出血'],
    en: ['Loss of consciousness', 'Persistent vomiting', 'Neurological signs', 'Suspected facial or cervical spine fracture', 'Uncontrolled bleeding']
  },
  redFlagAction: {
    zh: '先啟動醫療急救／送急診，牙齒的處理往後排。',
    en: 'Activate medical emergency care first; dental treatment comes second.'
  },
  rows: [
    {
      look:  { zh: '牙齒缺角或斷裂',  en: 'Tooth chipped or fractured' },
      doNow: { zh: '找回斷片並保持濕潤，冷敷；出血以乾淨紗布加壓', en: 'Find the fragment and keep it moist; cold compress; control bleeding with clean gauze' },
      dont:  { zh: '不要自行黏牙、磨牙或反覆測試會不會痛', en: 'Do not glue or file the tooth, or repeatedly test whether it hurts' },
      when:  { zh: '當日或儘快評估；看得到紅色或出血的牙髓時更急', en: 'Same day or as soon as possible; more urgent if red or bleeding pulp is visible' }
    },
    {
      look:  { zh: '牙齒鬆動但位置沒變', en: 'Tooth loose but not displaced' },
      doNow: { zh: '避免用該牙咬硬物，保持清潔', en: 'Avoid biting on it; keep the area clean' },
      dont:  { zh: '不要反覆搖牙', en: 'Do not keep wiggling the tooth' },
      when:  { zh: '儘快牙科檢查', en: 'Dental examination as soon as possible' }
    },
    {
      look:  { zh: '牙齒被撞歪、變長或被撞進牙肉', en: 'Tooth displaced, elongated or pushed into the gum' },
      doNow: { zh: '保持原狀，儘速就診', en: 'Leave it as it is and get to a dentist quickly' },
      dont:  { zh: '一般民眾不要強行拉回或推回去', en: 'Do not try to pull or push it back yourself' },
      when:  { zh: '當日緊急處理', en: 'Same-day emergency care' }
    },
    {
      look:  { zh: '恆牙整顆掉出來', en: 'Permanent tooth knocked out' },
      doNow: { zh: '拿牙冠、不要碰牙根；髒的話用保存液輕輕沖一下就立即放回原位；不能放回就泡在保存液裡', en: 'Hold the crown, never the root; if dirty rinse briefly in a storage medium and replant at once; if not possible, place it in a storage medium' },
      dont:  { zh: '不要刷、刮、消毒或讓牙根乾掉；不要長時間泡自來水', en: 'Do not scrub, scrape or disinfect the root, and do not let it dry; do not store in tap water' },
      when:  { zh: '立即，以分鐘計算', en: 'Immediately — minutes matter' }
    },
    {
      look:  { zh: '乳牙整顆掉出來', en: 'Primary tooth knocked out' },
      doNow: { zh: '加壓止血，找到牙齒帶去給牙醫確認', en: 'Apply pressure to stop bleeding; bring the tooth for the dentist to check' },
      dont:  { zh: '不要把乳牙放回去', en: 'Do not replant a primary tooth' },
      when:  { zh: '儘快檢查', en: 'Examination as soon as possible' }
    },
    {
      look:  { zh: '嘴唇或牙齦裂傷', en: 'Lip or gingival laceration' },
      doNow: { zh: '清水或生理食鹽水沖洗、紗布持續加壓、外側冷敷', en: 'Irrigate with clean water or saline, apply continuous gauze pressure, cold compress externally' },
      dont:  { zh: '不要忽略可能嵌在唇內的牙齒碎片', en: 'Do not overlook tooth fragments that may be embedded in the lip' },
      when:  { zh: '深裂傷、持續出血或有異物要急診', en: 'Deep lacerations, ongoing bleeding or foreign bodies need emergency care' }
    }
  ]
};

/* ---- 保存液：順序就是 IADT 2020 的偏好順序 ----
   Fouad et al. 2020 §2 原文：
   "In descending order of preference, milk, HBSS, saliva (after spitting into
   a glass for instance), or saline are suitable and convenient storage mediums."
   牛奶排第一，不是 HBSS。 */
const STORAGE_MEDIA = [
  { id:'milk',   img:'care/storage-milk.svg',     name:{ zh:'牛奶',         en:'Milk' },
    note:{ zh:'最容易取得，滲透壓與牙周韌帶細胞相容',       en:'Most readily available; osmolality compatible with PDL cells' } },
  { id:'hbss',   img:'care/storage-hbss.svg',     name:{ zh:'HBSS 平衡鹽溶液', en:"Hanks' Balanced Salt Solution (HBSS)" },
    note:{ zh:'專用保存液，現場通常沒有',                   en:'Purpose-made medium; rarely available at the scene' } },
  { id:'saliva', img:'care/storage-saliva.svg',   name:{ zh:'唾液',         en:'Saliva' },
    note:{ zh:'吐進容器保存；不要讓病人含著以免吞入',       en:'Spit into a container; do not have the patient hold it in the mouth — risk of swallowing' } },
  { id:'saline', img:'care/storage-saline.svg',   name:{ zh:'生理食鹽水',    en:'Saline' },
    note:{ zh:'可用，但保存能力不如牛奶與 HBSS',            en:'Acceptable, but less effective than milk or HBSS' } },
  { id:'water',  img:'care/storage-water-no.svg', name:{ zh:'自來水',       en:'Tap water' },
    forbidden:true,
    note:{ zh:'低滲透壓會使牙周韌帶細胞溶解，不可長時間浸泡', en:'Hypotonic — causes PDL cell lysis; not for prolonged storage' } }
];

/* ---- 撕脫時間門檻（Fouad et al. 2020）---- */
const AVULSION_TIME = [
  { id:'immediate', max:15,
    label:{ zh:'立即或約 15 分鐘內已在現場再植', en:'Replanted immediately or within about 15 minutes at the scene' } },
  { id:'wet60',     max:60,
    label:{ zh:'口外乾燥時間 <60 分鐘，且一直放在保存液中', en:'Extra-oral dry time under 60 minutes, kept in a storage medium' } },
  { id:'dry60',     max:null,
    label:{ zh:'口外乾燥時間 >60 分鐘（不論有沒有放保存液）', en:'Extra-oral dry time longer than 60 minutes, with or without a storage medium' } }
];
const PDL_NOTE = {
  zh: '口外乾燥 30 分鐘後，多數牙周韌帶細胞已無存活能力。乾燥時間超過 60 分鐘時，牙周韌帶再生預後很差，沾黏與取代性吸收是可預期的結果；但對仍在生長的兒童，再植仍可暫時維持齒槽骨輪廓與外觀。',
  en: 'After 30 minutes of extra-oral dry time most PDL cells are non-viable. Beyond 60 minutes of dry time, PDL regeneration is unlikely and ankylosis with replacement resorption is an expected outcome; in a growing child, replantation may still preserve alveolar contour and appearance.'
};

/* ---- 固定裝置的通則（Bourguignon et al. 2020 §6；Fouad et al. 2020 §8）---- */
const SPLINT_PRINCIPLE = {
  zh: '一律使用被動、柔性、短期的固定裝置。不鏽鋼線直徑 ≤0.4 mm（0.016 吋），或尼龍釣魚線 0.13–0.25 mm，以複合樹脂黏著於唇側；複合樹脂與黏著劑要遠離牙齦與鄰接面，避免堆積牙菌斑與續發感染。固定天數依傷害類型而異，見各診斷頁。',
  en: 'Always use a short-term, passive and flexible splint. Stainless steel wire up to 0.4 mm (0.016"), or nylon fishing line 0.13–0.25 mm, bonded with composite resin on the labial surfaces. Keep composite and bonding agent away from the gingiva and interproximal areas to avoid plaque retention and secondary infection. Duration depends on the injury — see each diagnosis.'
};

/* ---- 抗生素：照 IADT 原文的講法寫，不寫成某藥必然有效 ---- */
const ANTIBIOTIC_NOTE = {
  zh: '單純的恆牙脫位、牙根斷裂與乳牙脫位，證據不足以支持常規全身性抗生素，應依軟組織污染、是否手術介入與患者全身狀況個別決定。恆牙脫落是例外：IADT 建議使用全身性抗生素，但原文同時明講「全身性抗生素的價值高度可疑」（the value of systemic administration of antibiotics is highly questionable）。首選為 amoxicillin 或 penicillin，劑量依年齡與體重計算，青黴素過敏者另選。本 App 不列出固定藥名、年齡切點與劑量——抗生素管理規範會更新。',
  en: 'For uncomplicated permanent luxations, root fractures and primary tooth luxations there is insufficient evidence for routine systemic antibiotics; decide case by case based on soft tissue contamination, surgical intervention and the patient\'s medical status. Permanent tooth avulsion is the exception: the IADT recommends systemic antibiotics while stating in the same guideline that "the value of systemic administration of antibiotics is highly questionable". Amoxicillin or penicillin are first choices, dosed by age and weight, with alternatives for penicillin allergy. Specific drugs, age cut-offs and doses are deliberately not listed here — antimicrobial stewardship guidance changes.'
};

const TETANUS_NOTE = {
  zh: '污染性、穿刺性或開放性外傷要記錄疫苗接種史，轉介醫師評估是否需要破傷風追加劑。使用抗生素不能取代破傷風預防。',
  en: 'For contaminated, penetrating or open wounds, record the immunization history and refer to a physician to assess the need for a tetanus booster. Antibiotics are not a substitute for tetanus prophylaxis.'
};

/* ---- 牙髓測試的判讀警告：每一個 luxation 頁都要出現 ---- */
const PULP_TEST_CAVEAT = {
  zh: '外傷後第一次敏感性測試陰性，不等於牙髓壞死。脫位傷害後神經傳導可能停止數週到數月，但血流仍在，假陰性很常見。決定是否根管治療的是「序列變化」與感染證據（症狀、變色、竇管、腫脹、根尖病灶、發炎性吸收），不是單次測試結果。',
  en: 'A negative sensibility test at the first visit does not mean pulp necrosis. After luxation injuries, nerve conduction may cease for weeks to months while blood supply persists, so false negatives are common. Endodontic treatment is decided by serial change and evidence of infection (symptoms, discoloration, sinus tract, swelling, apical pathosis, inflammatory resorption) — not by a single test.'
};

/* ---- 決策樹 ----
   node: { id, q:{zh,en}, hint:{zh,en}, opts:[{ label:{zh,en}, next:'nodeId' | dx:'dxId' }] }
   dx 指向 PERMANENT_DX / PRIMARY_DX 裡的 id。 */
const TREE = {
  start: 'dentition',
  nodes: {
    dentition: {
      q:{ zh:'受傷的是恆牙還是乳牙？', en:'Is the injured tooth permanent or primary?' },
      hint:{ zh:'不確定時看年齡與牙齒大小：上顎門齒約 7–8 歲換牙。乳牙與恆牙的處置原則差很多，這一題判斷錯後面全錯。',
             en:'If unsure, use age and tooth size: maxillary incisors erupt at about 7–8 years. Management differs substantially, so this answer drives everything that follows.' },
      opts:[
        { label:{ zh:'恆牙', en:'Permanent' }, next:'p_inSocket' },
        { label:{ zh:'乳牙', en:'Primary'   }, next:'d_inSocket' }
      ]
    },

    /* ===== 恆牙 ===== */
    p_inSocket: {
      q:{ zh:'牙齒還在齒槽窩裡嗎？', en:'Is the tooth still in its socket?' },
      opts:[
        { label:{ zh:'整顆掉出來了', en:'Completely out of the socket' }, dx:'p-avulsion' },
        { label:{ zh:'還在嘴裡',     en:'Still in the mouth' },           next:'p_segment' }
      ]
    },
    p_segment: {
      q:{ zh:'是好幾顆牙連同一塊骨頭一起動嗎？', en:'Do several teeth move together as one bony segment?' },
      hint:{ zh:'用手指輕壓一顆牙，看鄰牙會不會跟著動；常合併咬合錯亂。',
             en:'Press one tooth gently and watch whether the neighbours move with it; occlusal disturbance is common.' },
      opts:[
        { label:{ zh:'是，整段一起動', en:'Yes, the segment moves as a block' }, dx:'p-alveolar-fracture' },
        { label:{ zh:'不是，單顆牙',   en:'No, individual teeth' },              next:'p_crown' }
      ]
    },
    p_crown: {
      q:{ zh:'牙冠有斷裂嗎？', en:'Is the crown fractured?' },
      opts:[
        { label:{ zh:'有斷裂或缺角',   en:'Yes, fractured or chipped' }, next:'p_crownDepth' },
        { label:{ zh:'牙冠完整',       en:'Crown intact' },              next:'p_position' }
      ]
    },
    p_crownDepth: {
      q:{ zh:'斷面看得到什麼？', en:'What can you see at the fracture surface?' },
      hint:{ zh:'斷裂線如果往齦下延伸、斷片會晃，選最後一項。',
             en:'If the fracture line extends below the gingival margin and the fragment is mobile, choose the last option.' },
      opts:[
        { label:{ zh:'只有裂紋，沒有缺損',           en:'Craze lines only, no loss of tooth structure' }, dx:'p-enamel-infraction' },
        { label:{ zh:'只缺一小塊白色的牙釉質',       en:'A small chip confined to enamel' },              dx:'p-enamel-fracture' },
        { label:{ zh:'看得到黃色牙本質，沒有紅點',   en:'Yellow dentin exposed, no red spot' },           dx:'p-enamel-dentin-fracture' },
        { label:{ zh:'看得到紅色或出血的牙髓',       en:'Red or bleeding pulp exposed' },                 dx:'p-complicated-crown-fracture' },
        { label:{ zh:'裂線延伸到牙齦以下',           en:'Fracture line extends below the gingiva' },      next:'p_crownRoot' }
      ]
    },
    p_crownRoot: {
      q:{ zh:'這條延伸到齦下的裂線有沒有通過牙髓？', en:'Does that subgingival fracture involve the pulp?' },
      opts:[
        { label:{ zh:'沒有露髓', en:'No pulp exposure' }, dx:'p-crown-root-fracture-uncomp' },
        { label:{ zh:'有露髓',   en:'Pulp exposed'     }, dx:'p-crown-root-fracture-comp' }
      ]
    },
    p_position: {
      q:{ zh:'牙齒的位置有變嗎？', en:'Has the tooth been displaced?' },
      opts:[
        { label:{ zh:'變長，像被拉出來一些', en:'Appears elongated, partially out of the socket' }, dx:'p-extrusive-luxation' },
        { label:{ zh:'歪向唇側或舌側，常卡住不太會動', en:'Tipped labially or palatally, often locked and immobile' }, dx:'p-lateral-luxation' },
        { label:{ zh:'變短，像被撞進骨頭裡', en:'Appears shortened, driven into the bone' }, dx:'p-intrusive-luxation' },
        { label:{ zh:'位置看起來正常',       en:'Position looks normal' },                   next:'p_mobility' }
      ]
    },
    p_mobility: {
      q:{ zh:'牙齒會搖嗎？', en:'Is the tooth mobile?' },
      hint:{ zh:'牙冠完整卻異常鬆動或有移位，務必用不同水平與垂直角度的根尖片排除牙根斷裂——單一張角度很容易漏診。',
             en:'An intact crown with abnormal mobility or displacement must be radiographed at different horizontal and vertical angulations to exclude root fracture — a single view misses it easily.' },
      opts:[
        { label:{ zh:'會搖，齦溝有出血',         en:'Mobile, with sulcular bleeding' },           dx:'p-subluxation' },
        { label:{ zh:'不太搖，但叩診或咬合會痛', en:'Not mobile, but tender to percussion or biting' }, dx:'p-concussion' },
        { label:{ zh:'很鬆或位置怪，X 光看到牙根有橫向斷裂線', en:'Very mobile or oddly positioned; radiograph shows a transverse root fracture line' }, dx:'p-root-fracture' }
      ]
    },

    /* ===== 乳牙 ===== */
    d_inSocket: {
      q:{ zh:'牙齒還在齒槽窩裡嗎？', en:'Is the tooth still in its socket?' },
      hint:{ zh:'乳牙找不到時，一定要確認它不是被撞進齒槽骨、嵌在軟組織裡，或被吸入呼吸道。',
             en:'If a primary tooth cannot be found, exclude intrusion into bone, embedding in soft tissue, or aspiration.' },
      opts:[
        { label:{ zh:'整顆掉出來了', en:'Completely out of the socket' }, dx:'d-avulsion' },
        { label:{ zh:'還在嘴裡',     en:'Still in the mouth' },           next:'d_segment' }
      ]
    },
    d_segment: {
      q:{ zh:'是好幾顆牙連同一塊骨頭一起動嗎？', en:'Do several teeth move together as one bony segment?' },
      opts:[
        { label:{ zh:'是，整段一起動', en:'Yes, the segment moves as a block' }, dx:'d-alveolar-fracture' },
        { label:{ zh:'不是，單顆牙',   en:'No, individual teeth' },              next:'d_crown' }
      ]
    },
    d_crown: {
      q:{ zh:'牙冠有斷裂嗎？', en:'Is the crown fractured?' },
      opts:[
        { label:{ zh:'有斷裂或缺角', en:'Yes, fractured or chipped' }, next:'d_crownDepth' },
        { label:{ zh:'牙冠完整',     en:'Crown intact' },              next:'d_position' }
      ]
    },
    d_crownDepth: {
      q:{ zh:'斷面看得到什麼？', en:'What can you see at the fracture surface?' },
      opts:[
        { label:{ zh:'只缺一小塊白色的牙釉質',     en:'A small chip confined to enamel' },         dx:'d-enamel-fracture' },
        { label:{ zh:'看得到黃色牙本質，沒有紅點', en:'Yellow dentin exposed, no red spot' },      dx:'d-enamel-dentin-fracture' },
        { label:{ zh:'看得到紅色或出血的牙髓',     en:'Red or bleeding pulp exposed' },            dx:'d-complicated-crown-fracture' },
        { label:{ zh:'裂線延伸到牙齦以下',         en:'Fracture line extends below the gingiva' }, dx:'d-crown-root-fracture' }
      ]
    },
    d_position: {
      q:{ zh:'牙齒的位置有變嗎？', en:'Has the tooth been displaced?' },
      opts:[
        { label:{ zh:'變長，像被拉出來一些', en:'Appears elongated, partially out of the socket' }, dx:'d-extrusive-luxation' },
        { label:{ zh:'歪向唇側或舌側',       en:'Tipped labially or palatally' },                  dx:'d-lateral-luxation' },
        { label:{ zh:'變短甚至看不到',       en:'Shortened or almost disappeared' },               dx:'d-intrusive-luxation' },
        { label:{ zh:'位置看起來正常',       en:'Position looks normal' },                         next:'d_mobility' }
      ]
    },
    d_mobility: {
      q:{ zh:'牙齒會搖嗎？', en:'Is the tooth mobile?' },
      opts:[
        { label:{ zh:'會搖，齦溝有出血',         en:'Mobile, with sulcular bleeding' },                 dx:'d-subluxation' },
        { label:{ zh:'不太搖，但碰到會痛',       en:'Not mobile, but tender on contact' },              dx:'d-concussion' },
        { label:{ zh:'很鬆或位置怪，X 光看到牙根有斷裂線', en:'Very mobile or oddly positioned; radiograph shows a root fracture line' }, dx:'d-root-fracture' }
      ]
    }
  }
};

/* ---- 參考文獻 ---- */
const REVIEWED_THROUGH = '2026-09-23';
const REFERENCES = [
  { tag:'IADT-1', text:'Bourguignon C, Cohenca N, Lauridsen E, et al. International Association of Dental Traumatology guidelines for the management of traumatic dental injuries: 1. Fractures and luxations. Dent Traumatol. 2020;36(4):314–330.', doi:'10.1111/edt.12578' },
  { tag:'IADT-2', text:'Fouad AF, Abbott PV, Tsilingaridis G, et al. International Association of Dental Traumatology guidelines for the management of traumatic dental injuries: 2. Avulsion of permanent teeth. Dent Traumatol. 2020;36(4):331–342.', doi:'10.1111/edt.12573' },
  { tag:'IADT-3', text:'Day PF, Flores MT, O’Connell AC, et al. International Association of Dental Traumatology guidelines for the management of traumatic dental injuries: 3. Injuries in the primary dentition. Dent Traumatol. 2020;36(4):343–359.', doi:'10.1111/edt.12576' },
  { tag:'IADT-0', text:'Levin L, Day PF, Hicks L, et al. International Association of Dental Traumatology guidelines for the management of traumatic dental injuries: General introduction. Dent Traumatol. 2020;36(4):309–313.', doi:'10.1111/edt.12574' }
];

/* ---- 證據標章的說明 ---- */
const EVIDENCE_LEGEND = {
  G:  { zh:'IADT 或其他正式國際指引／共識；代表臨床標準建議，不代表背後必有高品質隨機試驗', en:'IADT or other formal international guideline / consensus; a standard of care recommendation, not necessarily backed by high-quality RCTs' },
  E1: { zh:'系統性文獻回顧、統合分析，或直接回答該臨床問題的隨機對照試驗', en:'Systematic review, meta-analysis, or an RCT directly answering the clinical question' },
  E2: { zh:'大型長期／前瞻性世代研究，追蹤標準化良好', en:'Large longitudinal or prospective cohort with well-standardized follow-up' },
  E3: { zh:'回溯性世代研究或病例對照研究', en:'Retrospective cohort or case-control study' },
  E4: { zh:'病例系列、動物或體外研究、間接證據、生物學合理性', en:'Case series, animal or in-vitro work, indirect evidence, biological plausibility' }
};
