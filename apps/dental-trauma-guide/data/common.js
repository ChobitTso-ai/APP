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

  /* 右上角兩顆 */
  navHints:     { zh: '提示',                      en: 'Hints' },
  navBrowse:    { zh: '查閱',                      en: 'List' },
  modeHintsOn:  { zh: '開啟影像提示',              en: 'Turn imaging prompts on' },
  modeHintsOff: { zh: '關閉影像提示',              en: 'Turn imaging prompts off' },

  /* ⚡ 的意思：診斷列表上有這個標記的，處置不能等影像 */
  urgentLegend: { zh: '**時間急迫**：急性處置不能等 X 光，先處置、影像同時進行或隨後補。',
                  en: '**Time-critical**: do not wait for imaging — treat first, image alongside or afterwards.' },

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

  imgStep:      { zh: '影像檢查',                 en: 'Imaging' },
  imgTake:      { zh: '建議拍攝',                 en: 'Take these films' },
  imgWhy:       { zh: '為什麼要照',               en: 'Why it matters' },
  imgWhyNot:    { zh: '為什麼不用照',             en: 'Why no film is needed' },
  imgNotNeeded: { zh: '這個診斷不需要照影像',      en: 'No radiograph is needed for this diagnosis' },
  imgDone:      { zh: '我拍好了 →',               en: 'I have the films →' },
  imgPending:   { zh: '還沒拍',                   en: 'Not imaged yet' },
  imgContinue:  { zh: '繼續 →',                   en: 'Continue →' },
  imgBefore:    { zh: '在拿到 X 光之前',           en: 'Before the films are available' },
  imgBackToFilm:{ zh: 'X 光好了，繼續 →',         en: 'Films are ready, continue →' },
  urgentNoWait: { zh: '時間急迫：先處置，影像同時進行或隨後補，不要為了等 X 光延誤。',
                  en: 'Time-critical: treat first. Imaging can run alongside or follow — do not delay treatment waiting for films.' },
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
  zh: '口外乾燥 30 分鐘後，多數牙周韌帶細胞已無存活能力。乾燥時間超過 60 分鐘時，牙周韌帶再生預後很差，齒沾黏與取代性吸收是可預期的結果；但對仍在生長的兒童，再植仍可暫時維持齒槽骨輪廓與外觀。',
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

/* ---- 乳牙共用（Day et al. 2020 在每張表重複出現的三段）---- */

// 每一張乳牙表都附的家長衛教
const PRIMARY_PARENT_CARE = {
  zh: [
    '進食小心，不要再傷到受傷的牙齒，但仍鼓勵儘快恢復正常進食功能。',
    '為促進牙齦癒合並避免牙菌斑堆積，家長用軟毛牙刷或棉棒，沾不含酒精的 0.1%–0.2% chlorhexidine gluconate 漱口水局部塗抹，一天兩次，持續一週。'
  ],
  en: [
    'Take care when eating so as not to traumatize the injured tooth further, while encouraging a return to normal function as soon as possible.',
    'To encourage gingival healing and prevent plaque accumulation, parents should clean the affected area with a soft brush or cotton swab combined with an alcohol-free 0.1%–0.2% chlorhexidine gluconate mouth rinse applied topically twice a day for one week.'
  ]
};

// 乳牙處置的總原則：能轉介就先不要在急診動手
const PRIMARY_REFERRAL_NOTE = {
  zh: '乳牙外傷的處置要同時考量孩子的成熟度與配合度。每一種介入都有侵入性，而且可能造成長期的看牙焦慮，因此要把包含拔除在內的選項跟家長討論。**在急診當下「先不處理」往往是最合適的選擇**——前提是幾天內能轉介到有兒童牙科經驗的團隊。',
  en: 'Management of primary tooth injuries must weigh the child’s maturity and ability to cooperate. Every option is invasive and can cause long-term dental anxiety, so discuss the alternatives — including extraction — with the parents. **No treatment at the emergency visit is often the most appropriate option**, provided there is the potential for rapid referral, within several days, to a child-oriented team experienced in paediatric dental injuries.'
};

// 乳牙的影像原則：不是每個診斷都要照，追蹤更不是例行照
const PRIMARY_IMAGING_NOTE = {
  zh: '乳牙的影像追蹤**不是例行的**：只有在臨床發現暗示病變（也就是出現不良結果）時才加照。例外是斷髓術或根管治療後的 1 年追蹤，以及齒槽骨骨折的 4 週與 1 年。',
  en: 'Radiographic follow-up in the primary dentition is **not routine**: take further films only when clinical findings suggest pathosis (that is, an unfavorable outcome). The exceptions are the one-year review after a pulpotomy or root canal treatment, and the 4-week and 1-year films after an alveolar fracture.'
};

// 乳牙的不良結果在每張表幾乎相同，抽出共用
const PRIMARY_BAD_OUTCOMES = {
  zh: [
    '有症狀',
    '牙髓壞死與感染的徵象：竇管、牙齦腫脹、膿腫，或搖動度增加',
    '持續的深灰色變色，加上一項以上根管感染的徵象',
    '影像上的牙髓壞死與感染徵象',
    '未成熟牙的牙根停止繼續發育',
    '對恆牙繼承牙的發育或萌出造成負面影響'
  ],
  en: [
    'Symptomatic',
    'Signs of pulp necrosis and infection: sinus tract, gingival swelling, abscess, or increased mobility',
    'Persistent dark grey discoloration plus one or more signs of root canal infection',
    'Radiographic signs of pulp necrosis and infection',
    'No further root development in immature teeth',
    'Negative impact on the development or eruption of the permanent successor'
  ]
};

const PRIMARY_GOOD_OUTCOMES = {
  zh: [
    '無症狀',
    '牙髓癒合：牙冠顏色正常，或出現暫時性的紅／灰／黃變色與根管鈣化堵塞',
    '沒有牙髓壞死與感染的徵象',
    '未成熟牙持續進行牙根發育',
    '恆牙繼承牙的發育與萌出未受干擾'
  ],
  en: [
    'Asymptomatic',
    'Pulp healing: normal crown colour, or transient red/grey/yellow discoloration with pulp canal obliteration',
    'No signs of pulp necrosis and infection',
    'Continued root development in immature teeth',
    'No disturbance to the development or eruption of the permanent successor'
  ]
};

// 乳牙的抗生素立場（Day et al. 2020）
const PRIMARY_ANTIBIOTIC_NOTE = {
  zh: '乳牙外傷不常規使用全身性抗生素。合併軟組織或其他傷害、需要較大的手術介入，或孩子本身的全身狀況需要時，由醫師個別判斷。',
  en: 'Systemic antibiotics are not routine for primary tooth injuries. Their use remains at the clinician’s discretion when the injury is accompanied by soft tissue or other associated injuries, when significant surgical intervention is required, or when the child’s medical status warrants cover.'
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
   走法比照急診的實際順序：
     紅旗排除 → 乳牙恆牙 → 外觀檢查（純臨床）→ 影像 → 影像所見 → 診斷處置

   節點型態
     question  一般問答。opts:[{ label, next | dx | result }]
     imaging   影像節點。films 要拍什麼、why 為什麼非拍不可。
               gate:false → 診斷臨床上已經確定，只是提醒，按「繼續」直接到 dx
               gate:true  → 非等 X 光不可，兩個出口：
                            拍好了 → next（影像所見）
                            還沒拍 → pending（先能做什麼），之後再回 next
     result    終點但不是診斷（目前只有「先送急診」）

   **時間急迫的診斷不經影像節點**——脫落、露髓、明顯移位的脫位，
   急性處置不能等 X 光（乾燥 30 分鐘後多數牙周韌帶細胞已無存活力）。
   這些診斷頁本身就列了建議影像，不會漏掉。 */
const TREE = {
  start: 'redflag',
  nodes: {

    /* ===== 第 1 關：紅旗 ===== */
    redflag: {
      q:{ zh:'有沒有以下任何一項？', en:'Is any of the following present?' },
      hint:{ zh:'失去意識、持續嘔吐、神經學症狀、疑似顏面或頸椎骨折、無法控制的出血。牙齒的處理永遠排在這些後面。',
             en:'Loss of consciousness, persistent vomiting, neurological signs, suspected facial or cervical spine fracture, uncontrolled bleeding. Dental treatment always comes after these.' },
      opts:[
        { label:{ zh:'有，至少一項',   en:'Yes, at least one' }, result:'refer' },
        { label:{ zh:'都沒有',         en:'None of these' },     next:'dentition' }
      ]
    },

    /* ===== 第 2 關：乳牙還是恆牙 ===== */
    dentition: {
      q:{ zh:'受傷的是恆牙還是乳牙？', en:'Is the injured tooth permanent or primary?' },
      hint:{ zh:'不確定時看年齡與牙齒大小：上顎門齒約 7–8 歲換牙。乳牙與恆牙的處置原則差很多，這一題判斷錯後面全錯。',
             en:'If unsure, use age and tooth size: maxillary incisors erupt at about 7–8 years. Management differs substantially, so this answer drives everything that follows.' },
      opts:[
        { label:{ zh:'恆牙', en:'Permanent' }, next:'p_inSocket' },
        { label:{ zh:'乳牙', en:'Primary'   }, next:'d_inSocket' }
      ]
    },

    /* ===== 恆牙 · 第 3 關：外觀檢查 ===== */
    p_inSocket: {
      q:{ zh:'牙齒還在齒槽窩裡嗎？', en:'Is the tooth still in its socket?' },
      opts:[
        { label:{ zh:'整顆掉出來了，牙齒在手上', en:'Completely out of the socket, the tooth is in hand' }, dx:'p-avulsion' },
        { label:{ zh:'找不到牙齒',               en:'The tooth cannot be found' },                          next:'p_img_missing' },
        { label:{ zh:'還在嘴裡',                 en:'Still in the mouth' },                                 next:'p_segment' }
      ]
    },
    p_segment: {
      q:{ zh:'是好幾顆牙連同一塊骨頭一起動嗎？', en:'Do several teeth move together as one bony segment?' },
      hint:{ zh:'用手指輕壓一顆牙，看鄰牙會不會跟著動；常合併咬合錯亂。',
             en:'Press one tooth gently and watch whether the neighbours move with it; occlusal disturbance is common.' },
      opts:[
        { label:{ zh:'是，整段一起動', en:'Yes, the segment moves as a block' }, next:'p_img_alveolar' },
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
        { label:{ zh:'只有裂紋，沒有缺損',         en:'Craze lines only, no loss of tooth structure' }, next:'p_img_crown' },
        { label:{ zh:'只缺一小塊白色的牙釉質',     en:'A small chip confined to enamel' },              next:'p_img_crown2' },
        { label:{ zh:'看得到黃色牙本質，沒有紅點', en:'Yellow dentin exposed, no red spot' },           next:'p_img_crown3' },
        { label:{ zh:'看得到紅色或出血的牙髓',     en:'Red or bleeding pulp exposed' },                 dx:'p-complicated-crown-fracture' },
        { label:{ zh:'裂線延伸到牙齦以下',         en:'Fracture line extends below the gingiva' },      next:'p_crownRoot' }
      ]
    },
    p_crownRoot: {
      q:{ zh:'這條延伸到齦下的裂線有沒有通過牙髓？', en:'Does that subgingival fracture involve the pulp?' },
      opts:[
        { label:{ zh:'沒有露髓', en:'No pulp exposure' }, next:'p_img_cr_uncomp' },
        { label:{ zh:'有露髓',   en:'Pulp exposed'     }, next:'p_img_cr_comp' }
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
      opts:[
        { label:{ zh:'會搖，齦溝有出血',         en:'Mobile, with sulcular bleeding' },                 next:'p_img_loose' },
        { label:{ zh:'不太搖，但叩診或咬合會痛', en:'Not mobile, but tender to percussion or biting' }, next:'p_img_tender' }
      ]
    },

    /* ===== 恆牙 · 第 4 關：影像 ===== */
    p_img_missing: {
      type:'imaging', gate:true, next:'p_film_missing',
      films:[
        { zh:'不同水平與垂直角度的根尖片，加一張咬合片', en:'Periapical views at different horizontal and vertical angulations, plus an occlusal view' },
        { zh:'唇、頰、舌的軟組織影像', en:'Soft tissue views of the lip, cheek and tongue' }
      ],
      why:{ zh:'找不到牙齒時，**不能直接當作脫落**。必須先排除它其實是被撞進齒槽骨（內縮性脫位）、嵌在軟組織裡、跑進鼻腔，或被吞入、吸入。有呼吸症狀時轉急診做醫療評估。',
             en:'A missing tooth **must not be assumed to be avulsed**. Exclude intrusion into the alveolar bone, embedding in soft tissue, displacement into the nose, ingestion and aspiration. With respiratory symptoms, refer for medical evaluation.' },
      beforeFilm:{ zh:'先壓迫止血、檢查軟組織有無傷口與異物。**有呼吸症狀就直接轉急診**，不要等牙科影像。',
                   en:'Control bleeding and examine the soft tissues for wounds and foreign bodies. **With any respiratory symptoms, refer to the emergency department immediately** — do not wait for dental imaging.' }
    },
    p_img_alveolar: {
      type:'imaging', gate:false, dx:'p-alveolar-fracture',
      films:[
        { zh:'不同水平與垂直角度的根尖片，加一張咬合片', en:'Periapical views at different horizontal and vertical angulations, plus an occlusal view' },
        { zh:'平片不足以規劃治療時，考慮全景片與／或 CBCT', en:'If plain films are insufficient for planning, consider a panoramic radiograph and/or CBCT' }
      ],
      why:{ zh:'整段一起動在臨床上已經可以診斷，影像是要**定出骨折線的位置、範圍與方向**，並逐顆確認哪些牙在骨折線上。',
             en:'The en bloc movement already makes the diagnosis clinically; imaging is to **determine the location, extent and direction of the fracture line** and to identify which teeth lie in it.' }
    },
    p_img_crown: {
      type:'imaging', gate:false, dx:'p-enamel-infraction',
      films:[{ zh:'一張平行投影根尖片', en:'One parallel periapical radiograph' }],
      why:{ zh:'裂紋本身影像上看不到。照這一張是為了**排除合併的脫位或牙根斷裂**——有叩痛時尤其要照。',
             en:'The infraction itself is not visible radiographically. The film is to **exclude an associated luxation or root fracture** — especially if the tooth is tender to percussion.' }
    },
    p_img_crown2: {
      type:'imaging', gate:false, dx:'p-enamel-fracture',
      films:[
        { zh:'一張平行投影根尖片', en:'One parallel periapical radiograph' },
        { zh:'斷片下落不明且唇頰有傷口時，加照軟組織影像', en:'Soft tissue views if the fragment is unaccounted for and the lip or cheek is injured' }
      ],
      why:{ zh:'排除合併的脫位或牙根斷裂。**斷片找不到時不要假設它掉在現場**——可能嵌在嘴唇裡。',
             en:'To exclude an associated luxation or root fracture. **Do not assume a missing fragment was lost at the scene** — it may be embedded in the lip.' }
    },
    p_img_crown3: {
      type:'imaging', gate:false, dx:'p-enamel-dentin-fracture',
      films:[
        { zh:'一張平行投影根尖片', en:'One parallel periapical radiograph' },
        { zh:'斷片下落不明且唇頰有傷口時，加照軟組織影像', en:'Soft tissue views if the fragment is unaccounted for and the lip or cheek is injured' }
      ],
      why:{ zh:'排除合併的脫位或牙根斷裂，並確認剩餘牙本質厚度。',
             en:'To exclude an associated luxation or root fracture, and to judge the remaining dentin thickness.' }
    },
    p_img_cr_uncomp: {
      type:'imaging', gate:false, dx:'p-crown-root-fracture-uncomp',
      films:[
        { zh:'一張平行投影根尖片，加不同水平與垂直角度的加照', en:'One parallel periapical radiograph plus views at different horizontal and vertical angulations' },
        { zh:'**考慮 CBCT**：看清裂線路徑、範圍、與邊緣骨的關係，並評估冠根比', en:'**Consider CBCT** to clarify the fracture path, its extent and relationship to the marginal bone, and to assess the crown-root ratio' }
      ],
      why:{ zh:'齦下裂線延伸多深，決定這顆牙能不能修復、要不要做牙根突出術，二維影像常常界定不出來。',
             en:'How far the subgingival fracture extends determines restorability and whether extrusion is needed — two-dimensional imaging often cannot define it.' }
    },
    p_img_cr_comp: {
      type:'imaging', gate:false, dx:'p-crown-root-fracture-comp',
      films:[
        { zh:'一張平行投影根尖片，加不同水平與垂直角度的加照', en:'One parallel periapical radiograph plus views at different horizontal and vertical angulations' },
        { zh:'**考慮 CBCT**：裂線路徑、範圍、與邊緣骨的關係、冠根比', en:'**Consider CBCT**: fracture path, extent, relationship to the marginal bone, crown-root ratio' }
      ],
      why:{ zh:'同未露髓型；另外要確認牙根長度與牙髓處置的可行性。',
             en:'As for the uncomplicated type, and additionally to confirm root length and the feasibility of pulp treatment.' }
    },
    p_img_loose: {
      type:'imaging', gate:true, next:'p_film_loose',
      films:[
        { zh:'**不同水平與垂直角度的根尖片**（不只一張角度）', en:'**Periapical views at different horizontal and vertical angulations** — not a single view' },
        { zh:'必要時加一張咬合片', en:'Add an occlusal view when needed' },
        { zh:'平片不足以規劃治療時，考慮 CBCT', en:'Consider CBCT if plain films are insufficient for planning' }
      ],
      why:{ zh:'**牙冠完整卻異常鬆動，非照不可。**半脫位與牙根斷裂在臨床上一模一樣，牙根斷裂只有影像看得到，而且 IADT 原文明講「不加照就可能漏診」——單一角度很容易錯過斜向的裂線。',
             en:'**An intact crown with abnormal mobility must be imaged.** Subluxation and root fracture look identical clinically; only imaging shows the fracture, and the IADT states that root fractures "may be undetected without additional imaging" — a single angulation easily misses an oblique line.' },
      beforeFilm:{ zh:'先不要反覆搖動牙齒。軟食、避免用該牙施力、保持清潔。**不要在拿到 X 光之前就做預防性根管治療。**',
                   en:'Stop repeatedly testing mobility. Soft diet, avoid loading the tooth, keep it clean. **Do not start prophylactic endodontic treatment before the films are available.**' }
    },
    p_img_tender: {
      type:'imaging', gate:true, next:'p_film_tender',
      films:[
        { zh:'不同水平與垂直角度的根尖片', en:'Periapical views at different horizontal and vertical angulations' },
        { zh:'必要時加一張咬合片', en:'Add an occlusal view when needed' }
      ],
      why:{ zh:'不會搖也可能是牙根斷裂——斷片沒有移位時搖動度可以完全正常。震盪的定義本來就包含「影像上無異常」，所以要有 X 光才說得出是震盪。',
             en:'An immobile tooth can still have a root fracture: mobility may be entirely normal when the fragments are undisplaced. Concussion is defined partly by the absence of radiographic abnormality, so a film is needed before calling it concussion.' },
      beforeFilm:{ zh:'軟食、避免用該牙施力。**不要因為初診敏感性測試陰性就做根管治療。**',
                   en:'Soft diet, avoid loading the tooth. **Do not start endodontic treatment because of a negative sensibility test at the first visit.**' }
    },

    /* ===== 恆牙 · 第 5 關：影像所見 ===== */
    p_film_missing: {
      q:{ zh:'影像上看到什麼？', en:'What do the films show?' },
      opts:[
        { label:{ zh:'齒槽窩是空的，牙齒不在骨內', en:'The socket is empty; the tooth is not in the bone' }, dx:'p-avulsion' },
        { label:{ zh:'牙齒還在骨內，只是被壓進去了', en:'The tooth is still in the bone, driven apically' }, dx:'p-intrusive-luxation' }
      ]
    },
    p_film_loose: {
      q:{ zh:'影像上有看到牙根的橫向或斜向斷裂線嗎？', en:'Do the films show a transverse or oblique root fracture line?' },
      opts:[
        { label:{ zh:'有，看得到斷裂線', en:'Yes, a fracture line is visible' }, dx:'p-root-fracture' },
        { label:{ zh:'沒有，牙根完整（牙周韌帶腔可能略增寬）', en:'No, the root is intact (the periodontal ligament space may be slightly widened)' }, dx:'p-subluxation' }
      ]
    },
    p_film_tender: {
      q:{ zh:'影像上有看到什麼異常嗎？', en:'Do the films show any abnormality?' },
      opts:[
        { label:{ zh:'有牙根的橫向或斜向斷裂線', en:'A transverse or oblique root fracture line' }, dx:'p-root-fracture' },
        { label:{ zh:'完全沒有異常',             en:'No abnormality at all' },                      dx:'p-concussion' }
      ]
    },

    /* ===== 乳牙 · 第 3 關：外觀檢查 ===== */
    d_inSocket: {
      q:{ zh:'牙齒還在齒槽窩裡嗎？', en:'Is the tooth still in its socket?' },
      opts:[
        { label:{ zh:'整顆掉出來了，牙齒有帶來', en:'Completely out, and the tooth has been brought in' }, dx:'d-avulsion' },
        { label:{ zh:'找不到牙齒',               en:'The tooth cannot be found' },                        next:'d_img_missing' },
        { label:{ zh:'還在嘴裡',                 en:'Still in the mouth' },                               next:'d_segment' }
      ]
    },
    d_segment: {
      q:{ zh:'是好幾顆牙連同一塊骨頭一起動嗎？', en:'Do several teeth move together as one bony segment?' },
      opts:[
        { label:{ zh:'是，整段一起動', en:'Yes, the segment moves as a block' }, next:'d_img_alveolar' },
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
        { label:{ zh:'只缺一小塊白色的牙釉質',     en:'A small chip confined to enamel' },         next:'d_img_enamel' },
        { label:{ zh:'看得到黃色牙本質，沒有紅點', en:'Yellow dentin exposed, no red spot' },      next:'d_img_dentin' },
        { label:{ zh:'看得到紅色或出血的牙髓',     en:'Red or bleeding pulp exposed' },            next:'d_img_pulp' },
        { label:{ zh:'裂線延伸到牙齦以下',         en:'Fracture line extends below the gingiva' }, next:'d_img_crownroot' }
      ]
    },
    d_position: {
      q:{ zh:'牙齒的位置有變嗎？', en:'Has the tooth been displaced?' },
      opts:[
        { label:{ zh:'變長，像被拉出來一些', en:'Appears elongated, partially out of the socket' }, next:'d_img_extrusive' },
        { label:{ zh:'歪向唇側或舌側',       en:'Tipped labially or palatally' },                  next:'d_img_lateral' },
        { label:{ zh:'變短甚至看不到',       en:'Shortened or almost disappeared' },               next:'d_img_intrusive' },
        { label:{ zh:'位置看起來正常',       en:'Position looks normal' },                         next:'d_mobility' }
      ]
    },
    d_mobility: {
      q:{ zh:'牙齒會搖嗎？齦溝有沒有出血？', en:'Is the tooth mobile? Is the gingival crevice bleeding?' },
      hint:{ zh:'乳牙的震盪與半脫位就差在這裡：**震盪的搖動度正常、齦溝不出血**；半脫位搖動度增加、齦溝可能出血。',
             en:'This is what separates primary concussion from subluxation: **concussion has normal mobility and no sulcular bleeding**; subluxation has increased mobility and may bleed from the crevice.' },
      opts:[
        { label:{ zh:'搖動度增加，齦溝有出血',     en:'Increased mobility with sulcular bleeding' }, next:'d_img_sublux' },
        { label:{ zh:'搖動度正常，齦溝不出血，只是碰到會痛', en:'Normal mobility, no bleeding, just tender to touch' }, next:'d_img_concussion' }
      ]
    },

    /* ===== 乳牙 · 第 4 關：影像 =====
       IADT-3 對乳牙的影像規定比恆牙保守得多，有兩個診斷明文不需要照。
       這裡照原文寫，不要一律提醒拍片。 */
    d_img_missing: {
      type:'imaging', gate:true, next:'d_film_missing',
      films:[{ zh:'根尖片（0 號感應器／底片，平行投影）或咬合片（2 號感應器／底片）', en:'Periapical (size 0 sensor/film, paralleling technique) or occlusal (size 2 sensor/film) radiograph' }],
      why:{ zh:'**牙齒沒有帶到診間時，這張影像是必要的**——要確認這顆牙不是被內縮進去。同時也作為發育中恆牙的基準，並判斷恆牙有沒有被推移。找不到牙齒且有呼吸症狀時，轉急診做醫療評估。',
             en:'**Where the tooth is not brought to the clinic this radiograph is essential** — to confirm the tooth has not been intruded. It also provides a baseline for the developing permanent tooth and shows whether it has been displaced. If the tooth is missing and there are respiratory symptoms, refer for medical evaluation.' },
      beforeFilm:{ zh:'壓迫止血，檢查唇、頰、舌有沒有嵌入的牙齒。**有呼吸症狀直接轉急診。**',
                   en:'Control bleeding and check the lip, cheek and tongue for an embedded tooth. **With respiratory symptoms, refer to the emergency department.**' }
    },
    d_img_enamel: {
      type:'imaging', gate:false, dx:'d-enamel-fracture', notNeeded:true,
      films:[],
      why:{ zh:'**IADT 對乳牙的單純牙釉質斷裂明文寫「不需要照影像」。**這個診斷也不建議做臨床或影像追蹤。不要對小孩做不必要的曝照。',
             en:'**For an isolated primary enamel fracture the IADT states that no radiographs are recommended.** No clinical or radiographic follow-up is recommended either. Avoid unnecessary exposure in a child.' }
    },
    d_img_dentin: {
      type:'imaging', gate:false, dx:'d-enamel-dentin-fracture', optional:true,
      films:[
        { zh:'基準影像**可照可不照**（optional）', en:'Baseline radiograph **optional**' },
        { zh:'懷疑斷片嵌在唇、頰或舌內時，照軟組織影像', en:'Radiograph the soft tissues if the fragment may be embedded in the lip, cheek or tongue' }
      ],
      why:{ zh:'IADT 對這個診斷把基準影像列為可選。**真正一定要照的是軟組織**——斷片找不到而嘴唇有傷口時，它可能就在嘴唇裡。',
             en:'The IADT lists the baseline film as optional for this diagnosis. **What must not be skipped is the soft tissue view** — if the fragment is unaccounted for and the lip is wounded, it may be inside the lip.' }
    },
    d_img_pulp: {
      type:'imaging', gate:false, dx:'d-complicated-crown-fracture',
      films:[
        { zh:'根尖片（0 號，平行投影）或咬合片（2 號），作為診斷與基準', en:'Periapical (size 0, paralleling technique) or occlusal (size 2) radiograph, for diagnosis and as a baseline' },
        { zh:'懷疑斷片嵌在軟組織內時加照軟組織影像', en:'Soft tissue views if a fragment may be embedded' }
      ],
      why:{ zh:'判斷牙根發育階段與有無根尖病灶，決定做局部斷髓術還是冠髓切除術。',
             en:'To judge the stage of root development and any apical pathosis, which decides between partial and cervical pulpotomy.' }
    },
    d_img_crownroot: {
      type:'imaging', gate:false, dx:'d-crown-root-fracture',
      films:[{ zh:'根尖片（0 號，平行投影）或咬合片（2 號），作為診斷與基準', en:'Periapical (size 0) or occlusal (size 2) radiograph, for diagnosis and as a baseline' }],
      why:{ zh:'判斷裂線深度與剩餘牙根，決定是移除鬆動斷片後修復，還是整顆拔除。同時看恆牙牙胚的位置。',
             en:'To judge the depth of the fracture and the remaining root — whether to remove the loose fragment and restore, or extract — and to see the position of the permanent tooth germ.' }
    },
    d_img_extrusive: {
      type:'imaging', gate:false, dx:'d-extrusive-luxation',
      films:[{ zh:'根尖片（0 號）或咬合片（2 號），作為基準', en:'Periapical (size 0) or occlusal (size 2) radiograph as a baseline' }],
      why:{ zh:'看根尖側牙周韌帶腔增寬的程度，並作為日後比對的基準。處置主要仍看臨床：有沒有干擾咬合、搖動度、脫出幾 mm。\n\n**看片時順便排除牙根斷裂**——乳牙牙根斷裂的冠側斷片本來就可能移位，看起來會像脫位。X 光上若有斷裂線，改看「牙根斷裂」。',
             en:'To see how far the apical periodontal ligament space is widened and to serve as a baseline. Management still turns on the clinical picture: occlusal interference, mobility, and how many millimetres the tooth is extruded.\n\n**Use the film to exclude a root fracture as well** — the coronal fragment of a primary root fracture may itself be displaced and can look like a luxation. If a fracture line is present, go to "Root fracture" instead.' }
    },
    d_img_lateral: {
      type:'imaging', gate:false, dx:'d-lateral-luxation',
      films:[{ zh:'根尖片（0 號）或**咬合片（2 號）**', en:'Periapical (size 0) or **occlusal (size 2)** radiograph' }],
      why:{ zh:'根尖側牙周韌帶腔增寬在**咬合片上最看得清楚**，尤其牙齒向唇側移位時。也要確認根尖有沒有頂到恆牙牙胚。\n\n**看片時順便排除牙根斷裂**——乳牙牙根斷裂的冠側斷片本來就可能移位，看起來會像脫位。X 光上若有斷裂線，改看「牙根斷裂」。',
             en:'The widened apical periodontal ligament space is **most clearly seen on an occlusal radiograph**, especially when the tooth is displaced labially. Also check whether the apex impinges on the permanent tooth germ.\n\n**Use the film to exclude a root fracture as well** — the coronal fragment of a primary root fracture may itself be displaced and can look like a luxation. If a fracture line is present, go to "Root fracture" instead.' }
    },
    d_img_intrusive: {
      type:'imaging', gate:true, next:'d_film_intrusive',
      films:[{ zh:'根尖片（0 號，平行投影）或咬合片（2 號），作為診斷與基準', en:'Periapical (size 0, paralleling technique) or occlusal (size 2) radiograph, for diagnosis and as a baseline' }],
      why:{ zh:'**要判斷根尖往哪裡去**：朝唇側骨板還是朝恆牙牙胚。影像上的表現剛好相反——根尖穿向唇側時看得到根尖、牙齒顯得比對側短；根尖朝牙胚時看不到根尖、牙齒反而顯得長。這關係到對恆牙的風險評估與家長告知。',
             en:'**To determine where the apex has gone**: towards the labial bone plate or towards the permanent tooth germ. The radiographic appearance is opposite in the two cases — when the apex is displaced labially the tip is visible and the tooth looks foreshortened; when it points at the germ the tip cannot be seen and the tooth looks elongated. This drives the risk assessment and what the parents are told.' },
      beforeFilm:{ zh:'不要嘗試把牙齒拉出來。壓迫止血、軟食。**不論哪個方向，2020 版都是等它自行再萌出**，所以影像不改變急性處置，但改變對恆牙的風險評估。',
                   en:'Do not attempt to pull the tooth out. Control bleeding, soft diet. **In the 2020 guideline the tooth is left to re-erupt regardless of direction**, so imaging does not change the acute management — it changes the risk assessment for the permanent successor.' }
    },
    d_img_sublux: {
      type:'imaging', gate:true, next:'d_film_sublux',
      films:[{ zh:'根尖片（0 號感應器／底片，平行投影）或咬合片（2 號感應器／底片）', en:'Periapical (size 0 sensor/film, paralleling technique) or occlusal (size 2 sensor/film) radiograph' }],
      why:{ zh:'**半脫位與牙根斷裂在乳牙上臨床表現重疊**——兩者都可能是「搖動度增加、位置看起來正常」，要靠 X 光分。這張同時是基準影像，日後出現變色或腫脹才有得比對。',
             en:'**Subluxation and root fracture overlap clinically in primary teeth** — both can present as increased mobility with a normal-looking position, and the film is what separates them. It also serves as the baseline for comparison if discoloration or swelling appears later.' },
      beforeFilm:{ zh:'不要反覆搖動牙齒。軟食、保持清潔。大多數乳牙半脫位不需要固定，**但在排除牙根斷裂之前不要下結論**。',
                   en:'Stop testing the mobility repeatedly. Soft diet, keep it clean. Most primary subluxations need no splint, **but do not conclude that before a root fracture has been excluded**.' }
    },
    d_film_sublux: {
      q:{ zh:'影像上有看到牙根的斷裂線嗎？', en:'Does the film show a root fracture line?' },
      opts:[
        { label:{ zh:'有，看得到斷裂線（多半在牙根中段或根尖三分之一）', en:'Yes, a fracture line is visible (usually mid-root or apical third)' }, dx:'d-root-fracture' },
        { label:{ zh:'沒有，牙根完整（牙周韌帶腔正常到略增寬）', en:'No, the root is intact (normal to slightly widened periodontal ligament space)' }, dx:'d-subluxation' }
      ]
    },
    d_img_concussion: {
      type:'imaging', gate:false, dx:'d-concussion', notNeeded:true,
      films:[],
      why:{ zh:'**IADT 對乳牙震盪明文寫「不需要基準影像」。**後續也只有在臨床發現暗示病變時才加照。不要對小孩做不必要的曝照。',
             en:'**For primary tooth concussion the IADT states that no baseline radiograph is recommended.** Later films are indicated only when clinical findings suggest pathosis. Avoid unnecessary exposure in a child.' }
    },
    d_img_alveolar: {
      type:'imaging', gate:false, dx:'d-alveolar-fracture',
      films:[
        { zh:'根尖片（0 號）或咬合片（2 號），作為基準', en:'Periapical (size 0) or occlusal (size 2) radiograph as a baseline' },
        { zh:'**4 週與 1 年要再加照**，評估骨折線上的乳牙與恆牙牙胚', en:'**Repeat at 4 weeks and 1 year** to assess the primary teeth and permanent tooth germs in the line of the fracture' }
      ],
      why:{ zh:'乳牙的影像追蹤原則上不是例行的，齒槽骨骨折是明文的例外——4 週與 1 年那兩張可能提示需要更密集的追蹤。',
             en:'Radiographic follow-up is generally not routine in the primary dentition; alveolar fracture is an explicit exception — the 4-week and 1-year films may indicate that a more frequent regimen is needed.' }
    },

    /* ===== 乳牙 · 第 5 關：影像所見 ===== */
    d_film_missing: {
      q:{ zh:'影像上看到什麼？', en:'What does the film show?' },
      opts:[
        { label:{ zh:'齒槽窩是空的，牙齒不在骨內', en:'The socket is empty; the tooth is not in the bone' }, dx:'d-avulsion' },
        { label:{ zh:'牙齒還在骨內，被壓進去了',   en:'The tooth is still in the bone, driven apically' },  dx:'d-intrusive-luxation' }
      ]
    },
    d_film_intrusive: {
      q:{ zh:'影像上根尖往哪個方向？', en:'Which way has the apex gone?' },
      hint:{ zh:'兩種方向的處置相同（等自行再萌出），但對恆牙牙胚的風險不同，家長告知的內容也不同。',
             en:'Management is the same either way (allow spontaneous re-eruption), but the risk to the permanent tooth germ — and therefore what the parents are told — differs.' },
      opts:[
        { label:{ zh:'看得到根尖，牙齒顯得比對側短（朝唇側骨板）', en:'The apical tip is visible and the tooth looks foreshortened (towards the labial plate)' }, dx:'d-intrusive-luxation' },
        { label:{ zh:'看不到根尖，牙齒反而顯得長（朝恆牙牙胚）',   en:'The apical tip cannot be seen and the tooth looks elongated (towards the tooth germ)' },   dx:'d-intrusive-luxation' }
      ]
    }
  }
};

/* ---- 決策樹的終點但不是診斷 ---- */
const TREE_RESULTS = {
  refer: {
    title:{ zh:'先處理醫療急症', en:'Medical emergency first' },
    body:{ zh:'出現失去意識、持續嘔吐、神經學症狀、疑似顏面或頸椎骨折，或無法控制的出血時，**先啟動醫療急救或送急診**，牙齒的處理往後排。\n\n等生命徵象與神經學狀況穩定、外科評估完成之後，再回來做牙外傷的診斷與處置。\n\n**唯一的例外是脫落的恆牙**：如果患者清醒、沒有立即的醫療禁忌，牙齒可以在等待的同時就放進保存液（牛奶為首選），不要讓牙根乾掉——時間就是牙周韌帶。',
           en:'With loss of consciousness, persistent vomiting, neurological signs, suspected facial or cervical spine fracture, or uncontrolled bleeding, **activate medical emergency care first**; dental treatment comes after.\n\nReturn to the dental assessment once the vital signs and neurological status are stable and the surgical evaluation is complete.\n\n**The one exception is an avulsed permanent tooth**: if the patient is conscious with no immediate medical contraindication, the tooth can go into a storage medium (milk first choice) while waiting — do not let the root dry. Time is periodontal ligament.' }
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
