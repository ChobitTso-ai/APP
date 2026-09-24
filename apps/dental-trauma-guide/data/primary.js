/* =========================================================
   牙外傷處置指南 —— 乳牙（12 種診斷）

   臨床內容依 IADT 2020：
     IADT-3 Day et al. Dent Traumatol 2020;36:343–359（Tables 1–12）
   12 張表逐項回原文核對，**沒有套用恆牙的數字**——乳牙的處置邏輯與
   追蹤時程與恆牙差很多。
   中文術語依《台灣牙髓病學醫學辭彙》。
   ©Tso KY - All Rights Reserved

   乳牙與恆牙最大的差別
     1. 目標不是不惜代價保住乳牙，而是減少疼痛與感染、避免再次手術，
        並降低對下方恆牙牙胚的額外傷害。
     2. 影像追蹤不是例行的，只在臨床懷疑病變時才照。
     3. 2020 版比舊版更偏保守觀察：內縮性脫位等自行再萌出，
        不再因根尖朝向恆牙牙胚就例行拔除。
     4. 脫落的乳牙**絕對不再植**。

   欄位說明
     sharedOutcomes  true = 另外套用 common.js 的
                     PRIMARY_GOOD_OUTCOMES / PRIMARY_BAD_OUTCOMES
     ageFollowUp     依年齡而非受傷日的追蹤（例如 6 歲時確認恆牙萌出）
     altFollowUp     採取不同處置時改用的另一組時程（例如有沒有固定）
   ========================================================= */

const PRIMARY_DX = [

/* ---------- 1. 牙釉質斷裂 ---------- */
{
  id:'d-enamel-fracture', dentition:'primary', group:'fracture',
  img:'dx/fx-enamel.svg', source:'IADT-3 Table 1',
  name:{ zh:'牙釉質斷裂', en:'Enamel fracture' },
  short:{ zh:'斷裂僅涉及牙釉質', en:'Fracture involves enamel only' },
  pub:{
    what:{ zh:'乳牙缺了一小角，只有最外層的牙釉質，通常不是嚴重急症。', en:'A small corner of the baby tooth is missing, involving only the outer enamel. This is usually not a serious emergency.' },
    doNow:{ zh:'邊緣銳利會刮到舌頭或嘴唇時，請牙醫磨平就好。仍要確認有沒有同時鬆動、牙齦出血或較深的裂傷。', en:'If the edge is sharp and catches the tongue or lip, have the dentist smooth it. Still check for associated looseness, gum bleeding or deeper lacerations.' },
    dontDo:{ zh:'不要自己磨或黏。', en:'Do not file or glue it yourself.' },
    urgency:{ zh:'不急，安排一般檢查即可。', en:'Not urgent; a routine appointment is enough.' }
  },
  clin:{
    criteria:[{ zh:'斷裂僅涉及牙釉質', en:'Fracture involves enamel only' }],
    imaging:[{ zh:'**不需要照影像**', en:'**No radiographs recommended**' }],
    treatment:[{ zh:'磨平銳利邊緣即可', en:'Smooth any sharp edges' }],
    splint:null,
    pulp:[{ zh:'不需牙髓處置', en:'No pulp treatment required' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[],
  noFollowUp:{ zh:'IADT 對單純的乳牙牙釉質斷裂**不建議臨床或影像追蹤**。合併脫位傷害時改用該傷害的時程。', en:'The IADT recommends **no clinical or radiographic follow-up** for an isolated primary enamel fracture. If there is an associated luxation, use that injury’s regimen.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 2. 牙釉質牙本質斷裂（未露髓） ---------- */
{
  id:'d-enamel-dentin-fracture', dentition:'primary', group:'fracture',
  img:'dx/fx-enamel-dentin.svg', source:'IADT-3 Table 2',
  name:{ zh:'牙釉質牙本質斷裂（未露髓）', en:'Enamel-dentin fracture (no pulp exposure)' },
  short:{ zh:'斷裂涉及牙釉質與牙本質，牙髓未暴露', en:'Fracture involves enamel and dentin; the pulp is not exposed' },
  pub:{
    what:{ zh:'斷面可以看到裡面黃色的牙本質，但沒有露出紅色的牙髓。牙本質露出會敏感，也讓細菌比較容易進去。', en:'Yellow dentin is visible at the fracture surface, but the red pulp is not exposed. Exposed dentin is sensitive and lets bacteria in more easily.' },
    doNow:{ zh:'找到斷片帶來給牙醫看。**如果找不到斷片而嘴唇有傷口，斷片可能嵌在嘴唇裡**，要照影像確認。', en:'Bring the fragment if you find it. **If the fragment is missing and the lip is injured, it may be embedded in the lip** and needs to be imaged.' },
    dontDo:{ zh:'不要忽略找不到的斷片——它可能在嘴唇裡、被吞下去，或被吸進呼吸道。', en:'Do not ignore a missing fragment — it may be in the lip, swallowed, or aspirated.' },
    urgency:{ zh:'儘快處理，把露出的牙本質蓋起來。', en:'Attend promptly so the exposed dentin can be covered.' }
  },
  clin:{
    criteria:[
      { zh:'斷裂涉及牙釉質與牙本質，牙髓未暴露', en:'Fracture involves enamel and dentin; the pulp is not exposed' },
      { zh:'問診與檢查時要追查找不到的斷片下落——**尤其是沒有成人目擊，或曾失去意識時**', en:'Track down any missing fragment during the history and examination, **especially when no adult witnessed the accident or there was a loss of consciousness**' },
      { zh:'斷片多半掉在口外，但有嵌入軟組織、被吞入或吸入的風險', en:'Fragments are most often lost outside the mouth, but may be embedded in soft tissue, ingested or aspirated' }
    ],
    imaging:[
      { zh:'基準影像**可照可不照**', en:'Baseline radiograph optional' },
      { zh:'懷疑斷片嵌在唇、頰或舌內時，照軟組織影像', en:'Radiograph the soft tissues if the fragment is suspected to be embedded in the lip, cheek or tongue' }
    ],
    treatment:[
      { zh:'以玻璃離子體或複合樹脂覆蓋所有暴露的牙本質', en:'Cover all exposed dentin with glass-ionomer or composite' },
      { zh:'缺損的齒質可當次或另約時間以複合樹脂修復', en:'Lost tooth structure can be restored with composite immediately or at a later appointment' }
    ],
    splint:null,
    pulp:[{ zh:'未露髓，不需牙髓處置', en:'No pulp exposure, no pulp treatment required' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'臨床檢查：變色、牙髓壞死與感染的徵象', en:'Clinical review: discoloration, signs of pulp necrosis and infection' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 3. 複雜性牙冠斷裂（露髓） ---------- */
{
  id:'d-complicated-crown-fracture', dentition:'primary', group:'fracture',
  img:'dx/fx-complicated-crown.svg', source:'IADT-3 Table 3',
  name:{ zh:'複雜性牙冠斷裂（露髓）', en:'Complicated crown fracture (pulp exposed)' },
  short:{ zh:'斷裂涉及牙釉質與牙本質，並且露髓', en:'Fracture involves enamel and dentin, with the pulp exposed' },
  pub:{
    what:{ zh:'斷面看得到紅色或會出血的牙髓。需要儘快處理，但**不代表這顆乳牙一定要拔掉**。', en:'Red or bleeding pulp is visible at the fracture. It needs prompt attention, but **it does not mean the baby tooth must be taken out**.' },
    doNow:{ zh:'儘快帶孩子就醫。治療方式會考量孩子的年齡、配合度、這顆牙還要用多久，以及能不能好好修復。', en:'See a dentist soon. The choice of treatment considers the child’s age, cooperation, how long the tooth still has to serve, and whether it can be restored well.' },
    dontDo:{ zh:'不要自己碰露出來的牙髓或塗任何東西。', en:'Do not touch the exposed pulp or apply anything to it.' },
    urgency:{ zh:'儘快，但若幾天內能轉介到兒童牙科團隊，急診當下不動手往往更好。', en:'Promptly — though if referral to a paediatric team is possible within days, not treating at the emergency visit is often better.' }
  },
  clin:{
    criteria:[
      { zh:'斷裂涉及牙釉質與牙本質，牙髓暴露', en:'Fracture involves enamel and dentin with pulp exposure' },
      { zh:'要追查找不到的斷片下落（可能嵌在軟組織、被吞入或吸入）', en:'Account for any missing fragment (may be embedded in soft tissue, ingested or aspirated)' }
    ],
    imaging:[
      { zh:'初診拍一張根尖片（0 號感應器／底片，平行投影）或咬合片（2 號感應器／底片），作為診斷與基準', en:'Take a periapical radiograph (size 0 sensor/film, paralleling technique) or an occlusal radiograph (size 2 sensor/film) at presentation, for diagnosis and as a baseline' },
      { zh:'懷疑斷片嵌在唇、頰或舌內時，照軟組織影像', en:'Radiograph the soft tissues if the fragment may be embedded in the lip, cheek or tongue' }
    ],
    treatment:[
      { zh:'以**局部斷髓術**保住牙髓；需要局部麻醉', en:'Preserve the pulp with a **partial pulpotomy**; local anesthesia is required' },
      { zh:'牙髓上放非硬化型氫氧化鈣糊劑，再蓋玻璃離子體，最後以複合樹脂修復', en:'Apply a non-setting calcium hydroxide paste over the pulp, cover with glass-ionomer cement, then composite resin' },
      { zh:'**露髓面積大時改做冠髓切除術**', en:'**Cervical (full coronal) pulpotomy is indicated where the pulp exposure is large**' },
      { zh:'不染色的矽酸鈣基底黏合劑等新材料的證據正在累積中；IADT 的立場是「**重點在選對病例，不在用哪一種材料**」', en:'Evidence for other biomaterials such as non-staining calcium silicate-based cements is emerging; the IADT’s position is that **clinicians should focus on appropriate case selection rather than the material used**' }
    ],
    splint:null,
    pulp:[{ zh:'局部斷髓術優先；露髓面積大時做冠髓切除術。是否治療、治療到什麼程度，要與家長討論包含拔除在內的選項', en:'Partial pulpotomy first; cervical pulpotomy for large exposures. Whether and how far to treat should be discussed with the parents, including the option of extraction' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'臨床檢查：疼痛、腫脹、竇管', en:'Clinical review: pain, swelling, sinus tract' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'變色、搖動度、感染徵象', en:'Discoloration, mobility, signs of infection' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'臨床檢查**加上影像**——斷髓術或根管治療後的 1 年影像是乳牙少數的例行加照', en:'Clinical review **with a radiograph** — the one-year film after pulpotomy or root canal treatment is one of the few routine primary-dentition radiographs' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E3/E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 4. 牙冠牙根斷裂 ---------- */
{
  id:'d-crown-root-fracture', dentition:'primary', group:'fracture',
  img:'dx/fx-crown-root-uncomp.svg', source:'IADT-3 Table 4',
  name:{ zh:'牙冠牙根斷裂', en:'Crown-root fracture' },
  short:{ zh:'斷裂涉及牙釉質、牙本質與牙根，可能露髓也可能沒有', en:'Fracture involves enamel, dentin and root; the pulp may or may not be exposed' },
  pub:{
    what:{ zh:'裂線從牙冠延伸到牙齦下方的牙根，鬆動的斷片常還連著，會晃。', en:'The fracture runs from the crown down to the root below the gum; the loose piece is often still attached and wobbles.' },
    doNow:{ zh:'帶孩子就醫，由牙醫決定要移除鬆動的斷片還是整顆處理。', en:'See a dentist, who will decide whether to remove the loose fragment or deal with the whole tooth.' },
    dontDo:{ zh:'不要自己拔扯鬆動的斷片，會更痛也可能傷到軟組織。', en:'Do not pull at the loose fragment — it hurts more and can injure the soft tissues.' },
    urgency:{ zh:'儘快，但能轉介的話急診當下可以先不處理。', en:'Promptly, though treatment can wait at the emergency visit if referral is available.' }
  },
  clin:{
    criteria:[
      { zh:'斷裂涉及牙釉質、牙本質與牙根；**可能露髓也可能未露髓**', en:'Fracture involves enamel, dentin and root; the pulp may or may not be exposed (complicated or uncomplicated)' },
      { zh:'常見鬆動但仍附著的斷片', en:'Loose but still attached fragments are a common finding' }
    ],
    imaging:[{ zh:'初診拍根尖片（0 號，平行投影）或咬合片（2 號），作為診斷與基準', en:'Periapical (size 0, paralleling technique) or occlusal (size 2) radiograph at presentation, for diagnosis and as a baseline' }],
    treatment:[
      { zh:'**急診當下「先不處理」往往是最合適的選擇**——前提是幾天內能轉介到有兒童牙科經驗的團隊', en:'**No treatment at the emergency visit is often the most appropriate option** — provided rapid referral to a child-oriented team is possible within several days' },
      { zh:'若當次要處置，需要局部麻醉：先移除鬆動的斷片，判斷牙冠是否可以修復', en:'If treating at the emergency appointment, local anesthesia is required: remove the loose fragment and determine whether the crown can be restored' },
      { zh:'選項 A（可修復）：未露髓者以玻璃離子體覆蓋暴露的牙本質；已露髓者依牙根發育階段與斷裂高度做斷髓術或根管治療', en:'Option A (restorable): if the pulp is not exposed, cover the exposed dentin with glass-ionomer; if it is exposed, perform a pulpotomy or root canal treatment depending on the stage of root development and the level of the fracture' },
      { zh:'選項 B（無法修復）：拔除所有鬆動的斷片，**小心不要傷到下方的恆牙繼承牙**，穩固的牙根斷片留在原處；或整顆拔除', en:'Option B (unrestorable): extract all loose fragments, taking care not to damage the permanent successor, and leave any firm root fragment in situ; or extract the whole tooth' }
    ],
    splint:null,
    pulp:[{ zh:'依露髓與否、牙根發育階段與斷裂高度決定斷髓術或根管治療；也可能直接走拔除', en:'Pulpotomy or root canal treatment depending on pulp exposure, root development and fracture level; extraction is also a legitimate route' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'保留牙齒者：疼痛、軟組織癒合、斷片穩定度', en:'Where the tooth is retained: pain, soft tissue healing, fragment stability' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'變色、搖動度、感染徵象', en:'Discoloration, mobility, signs of infection' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'做過斷髓術或根管治療者，此時**加照影像**', en:'**With a radiograph** where a pulpotomy or root canal treatment was performed' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E4', certainty:{ zh:'非常低至低', en:'Very low to low' } }
},

/* ---------- 5. 牙根斷裂 ---------- */
{
  id:'d-root-fracture', dentition:'primary', group:'fracture',
  img:'dx/fx-root-thirds.svg', source:'IADT-3 Table 5',
  name:{ zh:'牙根斷裂', en:'Root fracture' },
  short:{ zh:'斷裂位於牙根，通常在中段或根尖三分之一', en:'Fracture of the root, usually mid-root or in the apical third' },
  pub:{
    what:{ zh:'牙冠外觀可能沒什麼異常，只是變鬆或位置跑掉。牙根的裂痕要照 X 光才看得出來。', en:'The crown may look normal — the tooth is simply loose or shifted. The root fracture only shows on a radiograph.' },
    doNow:{ zh:'帶孩子就醫評估。**通常不需要把深處的牙根碎片挖出來**。', en:'Have the child assessed. **The deep root fragment usually does not need to be dug out.**' },
    dontDo:{ zh:'不要反覆搖動牙齒。', en:'Do not keep wiggling the tooth.' },
    urgency:{ zh:'儘快，尤其咬合會卡到時。', en:'Promptly, especially if the bite is disturbed.' }
  },
  clin:{
    criteria:[
      { zh:'臨床表現依斷裂位置而異', en:'Clinical findings depend on the location of the fracture' },
      { zh:'冠側斷片可能有搖動度、可能移位', en:'The coronal fragment may be mobile and may be displaced' },
      { zh:'可能有咬合干擾', en:'Occlusal interference may be present' },
      { zh:'斷裂通常位於牙根中段或根尖三分之一', en:'The fracture is usually located mid-root or in the apical third' }
    ],
    imaging:[{ zh:'初診拍根尖片（0 號，平行投影）或咬合片（2 號），作為診斷與基準', en:'Periapical (size 0, paralleling technique) or occlusal (size 2) radiograph at presentation, for diagnosis and as a baseline' }],
    treatment:[
      { zh:'冠側斷片**沒有移位**：不需要治療', en:'If the coronal fragment is **not displaced**, no treatment is required' },
      { zh:'冠側斷片有移位但**沒有過度搖動**：讓它自行復位，**即使有一些咬合干擾也一樣**', en:'If displaced but **not excessively mobile**, leave it to reposition spontaneously — **even if there is some occlusal interference**' },
      { zh:'冠側斷片移位、過度搖動且干擾咬合：兩個選項，都需要局部麻醉', en:'If displaced, excessively mobile and interfering with occlusion, two options, both requiring local anesthesia' },
      { zh:'選項 A：**只拔除鬆動的冠側斷片**，根尖斷片留在原處讓它自行吸收', en:'Option A: extract only the loose coronal fragment; leave the apical fragment in place to resorb' },
      { zh:'選項 B：輕輕把鬆動的冠側斷片復位；若在新位置不穩定，以彈性固定裝置連到鄰近未受傷的牙齒，固定 4 週', en:'Option B: gently reposition the loose coronal fragment; if unstable in its new position, stabilize with a flexible splint to the adjacent uninjured teeth for 4 weeks' }
    ],
    splint:{ zh:'只有在選項 B 復位後不穩定時才用：彈性固定裝置連到鄰近未受傷的牙齒，4 週。', en:'Only under Option B when the repositioned fragment is unstable: flexible splint to adjacent uninjured teeth for 4 weeks.' },
    pulp:[{ zh:'不做預防性根管治療；根尖斷片很少需要處理', en:'No prophylactic endodontic treatment; the apical fragment rarely needs any intervention' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'疼痛、軟組織、斷片位置', en:'Pain, soft tissue, fragment position' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'變色、搖動度、感染徵象', en:'Discoloration, mobility, signs of infection' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'臨床檢查；之後每年追蹤到恆牙萌出', en:'Clinical review; then yearly until the permanent teeth erupt' } }
  ],
  altFollowUp:{
    when:{ zh:'若採選項 B 復位並固定', en:'If repositioned and splinted (Option B)' },
    list:[
      { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'固定裝置與斷片穩定度', en:'Splint and fragment stability' } },
      { d:28, label:{ zh:'4 週', en:'4 wk' }, off:true, purpose:{ zh:'拆除固定裝置', en:'Splint removal' } },
      { d:56, label:{ zh:'8 週', en:'8 wk' }, purpose:{ zh:'變色、搖動度、感染徵象', en:'Discoloration, mobility, signs of infection' } },
      { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'臨床檢查', en:'Clinical review' } }
    ]
  },
  yearlyTo:null,
  yearlyNote:{ zh:'冠側斷片未移位者，1 年之後**每年臨床追蹤到恆牙萌出**。', en:'Where the coronal fragment was not displaced, continue clinical follow-up **each year until the permanent teeth erupt**.' },
  evidence:{ g:true, e:'E3/E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 6. 齒槽骨骨折 ---------- */
{
  id:'d-alveolar-fracture', dentition:'primary', group:'fracture',
  img:'dx/fx-alveolar.svg', source:'IADT-3 Table 6',
  name:{ zh:'齒槽骨骨折', en:'Alveolar fracture' },
  short:{ zh:'多顆乳牙連同一段齒槽骨一起移動', en:'Several primary teeth move together with a segment of alveolar bone' },
  pub:{
    what:{ zh:'不只一顆牙受傷，而是好幾顆牙連同下面的骨頭一起移位，咬合會對不起來。', en:'More than one tooth is involved — several teeth have moved with the bone beneath them, and the bite no longer fits.' },
    doNow:{ zh:'立刻就醫。移位的骨段需要復位並固定。', en:'Seek care immediately. The displaced segment needs repositioning and stabilization.' },
    dontDo:{ zh:'不要嘗試把牙齒推回去或用力咬合測試。', en:'Do not push the teeth back or test the bite forcefully.' },
    urgency:{ zh:'當日緊急處理。', en:'Same-day emergency care.' }
  },
  clin:{
    criteria:[
      { zh:'多顆乳牙連同齒槽骨段一起移動', en:'Several primary teeth move together with the alveolar segment' },
      { zh:'常有咬合干擾與牙齦傷害', en:'Occlusal interference and gingival injury are common' }
    ],
    imaging:[
      { zh:'初診拍根尖片或咬合片作為基準', en:'Periapical or occlusal radiograph at presentation as a baseline' },
      { zh:'**4 週與 1 年要加照影像**，評估骨折線上的乳牙與恆牙牙胚受到的影響；這張影像可能提示需要更密集的追蹤', en:'**Radiographic follow-up at 4 weeks and 1 year** to assess the impact on the primary teeth and the permanent tooth germs in the line of the fracture; this film may indicate that a more frequent regimen is needed' }
    ],
    treatment:[
      { zh:'局部麻醉下，復位有搖動度且／或造成咬合干擾的移位骨段', en:'Under local anesthesia, reposition any displaced segment that is mobile and/or causing occlusal interference' },
      { zh:'以彈性固定裝置連到**鄰近未受傷的牙齒**，固定 4 週', en:'Stabilize with a flexible splint to the **adjacent uninjured teeth** for 4 weeks' },
      { zh:'應由有兒童牙科外傷經驗的團隊執行', en:'Treatment should be performed by a child-oriented team with experience in paediatric dental injuries' }
    ],
    splint:{ zh:'彈性固定裝置連到鄰近未受傷的牙齒，4 週。', en:'Flexible splint to the adjacent uninjured teeth for 4 weeks.' },
    pulp:[{ zh:'逐顆追蹤牙髓狀態；出現感染徵象時才處置', en:'Monitor each involved tooth; intervene only when signs of infection appear' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'骨段穩定度、軟組織癒合、疼痛', en:'Segment stability, soft tissue healing, pain' } },
    { d:28, label:{ zh:'4 週', en:'4 wk' }, off:true, purpose:{ zh:'拆除固定裝置；**加照影像**評估乳牙與恆牙牙胚', en:'Splint removal; **radiograph** to assess the primary teeth and permanent tooth germs' } },
    { d:56, label:{ zh:'8 週', en:'8 wk' }, purpose:{ zh:'咬合、牙齦癒合、感染徵象', en:'Occlusion, gingival healing, signs of infection' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'臨床檢查**加上影像**', en:'Clinical review **with a radiograph**' } }
  ],
  ageFollowUp:{ zh:'**6 歲時**再追蹤一次，確認恆牙的萌出。', en:'A further review **at 6 years of age** to monitor eruption of the permanent teeth.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E3/E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 7. 震盪 ---------- */
{
  id:'d-concussion', dentition:'primary', group:'luxation',
  img:'dx/lux-concussion.svg', source:'IADT-3 Table 7',
  name:{ zh:'震盪', en:'Concussion' },
  short:{ zh:'碰觸會痛，但沒有移位、搖動度正常、齦溝不出血', en:'Tender to touch but not displaced; normal mobility and no sulcular bleeding' },
  pub:{
    what:{ zh:'牙齒沒有歪、也沒有變鬆，只是碰到或咬到會痛。', en:'The tooth has not moved and is not loose — it is simply sore when touched or bitten on.' },
    doNow:{ zh:'吃軟一點、保持清潔、觀察就好。', en:'Softer food, keep it clean, and observe.' },
    dontDo:{ zh:'不要反覆去戳或敲來測試。', en:'Do not keep poking or tapping it to test.' },
    urgency:{ zh:'不急，安排檢查即可。', en:'Not urgent; arrange a check-up.' }
  },
  clin:{
    criteria:[
      { zh:'碰觸會痛，但**沒有移位**', en:'Tender to touch but **not displaced**' },
      { zh:'搖動度正常，**齦溝不出血**——這一點是與半脫位的分界', en:'Normal mobility and **no sulcular bleeding** — this is what separates it from subluxation' }
    ],
    imaging:[{ zh:'**不需要基準影像**', en:'**No baseline radiograph recommended**' }],
    treatment:[{ zh:'不需要治療，觀察即可', en:'No treatment is needed; observation' }],
    splint:null,
    pulp:[{ zh:'不處置；出現感染徵象才介入', en:'No intervention; act only if signs of infection appear' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'臨床檢查：疼痛是否緩解', en:'Clinical review: resolution of tenderness' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'變色、搖動度、感染徵象', en:'Discoloration, mobility, signs of infection' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E3', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 8. 半脫位 ---------- */
{
  id:'d-subluxation', dentition:'primary', group:'luxation',
  img:'dx/lux-subluxation.svg', source:'IADT-3 Table 8',
  name:{ zh:'半脫位', en:'Subluxation' },
  short:{ zh:'搖動度增加但沒有移位，齦溝可能出血', en:'Increased mobility without displacement; the gingival crevice may bleed' },
  pub:{
    what:{ zh:'牙齒變鬆了，但位置沒有跑掉，牙齦邊緣可能滲一點血。大部分乳牙會自己恢復。', en:'The tooth is loose but has not moved; the gum margin may ooze a little. Most primary teeth recover on their own.' },
    doNow:{ zh:'吃軟食、保持清潔、觀察。**不需要固定**。', en:'Soft diet, keep it clean, observe. **No splint is needed.**' },
    dontDo:{ zh:'不要反覆搖它。單純的變色不等於要拔牙。', en:'Do not keep wiggling it. Discoloration alone is not a reason for extraction.' },
    urgency:{ zh:'儘快檢查一次。', en:'Have it checked soon.' }
  },
  clin:{
    criteria:[
      { zh:'碰觸會痛，**搖動度增加**，但沒有移位', en:'Tender to touch with **increased mobility**, but not displaced' },
      { zh:'齦溝可能出血', en:'Bleeding from the gingival crevice may be noted' }
    ],
    imaging:[
      { zh:'初診拍根尖片或咬合片作為基準', en:'Periapical or occlusal radiograph at presentation as a baseline' },
      { zh:'牙周韌帶腔正常至略為增寬', en:'A normal to slightly widened periodontal ligament space will be visible' }
    ],
    treatment:[{ zh:'不需要治療，觀察即可', en:'No treatment is needed; observation' }],
    splint:null,
    pulp:[{ zh:'不處置。**單純的變色不是拔牙或根管治療的充分理由**——要有感染的臨床或影像證據才介入', en:'No intervention. **Discoloration alone is not sufficient grounds for extraction or pulpectomy** — act only on clinical or radiographic evidence of infection' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'臨床檢查：搖動度、疼痛', en:'Clinical review: mobility, tenderness' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'變色、搖動度、感染徵象', en:'Discoloration, mobility, signs of infection' } }
  ],
  yearlyNote:{ zh:'擔心可能出現不良結果時，之後**每年臨床追蹤到恆牙萌出**。', en:'Where an unfavorable outcome is thought likely, continue clinical follow-up **each year until the permanent teeth erupt**.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E3', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 9. 外突性脫位 ---------- */
{
  id:'d-extrusive-luxation', dentition:'primary', group:'luxation',
  img:'dx/lux-extrusive.svg', source:'IADT-3 Table 9',
  name:{ zh:'外突性脫位', en:'Extrusive luxation' },
  short:{ zh:'牙齒部分脫出齒槽窩，看起來變長', en:'Partial displacement out of the socket; the tooth appears elongated' },
  pub:{
    what:{ zh:'乳牙像被拉出來一些，看起來比旁邊長，而且會晃。', en:'The baby tooth has been pulled partly out, looks longer than its neighbours, and wobbles.' },
    doNow:{ zh:'帶孩子就醫。**不要自己推回去**——要觀察還是拔除，取決於移位程度、搖動度與咬合。', en:'See a dentist. **Do not push it back yourself** — whether to observe or extract depends on the displacement, mobility and bite.' },
    dontDo:{ zh:'不要自己復位或拔它。', en:'Do not reposition or pull it out yourself.' },
    urgency:{ zh:'當日評估。', en:'Same-day assessment.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒部分脫出齒槽窩，看起來變長，可能過度搖動', en:'Partial displacement out of the socket; the tooth appears elongated and can be excessively mobile' },
      { zh:'可能有咬合干擾', en:'Occlusal interference may be present' }
    ],
    imaging:[
      { zh:'初診拍根尖片或咬合片作為基準', en:'Periapical or occlusal radiograph at presentation as a baseline' },
      { zh:'根尖側牙周韌帶腔從略為增寬到明顯增寬', en:'Slight to substantially widened periodontal ligament space apically' }
    ],
    treatment:[
      { zh:'處置依移位程度、搖動度、咬合干擾、牙根發育階段，以及孩子在急診當下的忍受度而定', en:'Decisions are based on the degree of displacement, mobility, occlusal interference, root formation, and the child’s ability to tolerate the emergency situation' },
      { zh:'**沒有干擾咬合**：讓牙齒自行復位', en:'**Not interfering with the occlusion**: let the tooth reposition spontaneously' },
      { zh:'**過度搖動，或脫出超過 3 mm**：局部麻醉下拔除', en:'**Excessively mobile, or extruded more than 3 mm**: extract under local anesthesia' },
      { zh:'應由有兒童牙科外傷經驗的團隊執行；拔牙可能造成長期的看牙焦慮', en:'Should be performed by a child-oriented team; extractions have the potential to cause long-term dental anxiety' }
    ],
    splint:null,
    pulp:[{ zh:'不處置；走觀察或拔除', en:'No pulp intervention; the route is observation or extraction' }],
    good:[{ zh:'脫出的牙齒回到原位、不干擾咬合', en:'The extruded tooth realigns and does not interfere with the occlusion' }],
    bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'位置、搖動度、咬合', en:'Position, mobility, occlusion' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'是否自行復位、變色、感染徵象', en:'Spontaneous realignment, discoloration, signs of infection' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'臨床檢查', en:'Clinical review' } }
  ],
  yearlyNote:{ zh:'擔心可能出現不良結果時，之後每年臨床追蹤到恆牙萌出。', en:'Where an unfavorable outcome is thought likely, continue clinical follow-up each year until the permanent teeth erupt.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E3', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 10. 側向脫位 ---------- */
{
  id:'d-lateral-luxation', dentition:'primary', group:'luxation',
  img:'dx/lux-lateral.svg', source:'IADT-3 Table 10',
  name:{ zh:'側向脫位', en:'Lateral luxation' },
  short:{ zh:'牙齒向腭／舌側或唇側移位，通常不動', en:'The tooth is displaced palatally/lingually or labially and is immobile' },
  pub:{
    what:{ zh:'乳牙被撞歪了。如果沒有卡到咬合、也不太會晃，**很多乳牙會自己慢慢回到比較正常的位置**。', en:'The baby tooth has been knocked sideways. If it is not catching the bite and is not very loose, **many primary teeth drift back towards a normal position on their own**.' },
    doNow:{ zh:'帶孩子就醫評估。自行復位通常在 6 個月內發生。', en:'Have the child assessed. Spontaneous repositioning usually happens within 6 months.' },
    dontDo:{ zh:'不要自己扳回來。', en:'Do not force it back yourself.' },
    urgency:{ zh:'當日評估，尤其咬合被卡住時。', en:'Same-day assessment, especially if the bite is blocked.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒移位，通常朝腭／舌側或唇側', en:'The tooth is displaced, usually in a palatal/lingual or labial direction' },
      { zh:'**牙齒不會動**', en:'**The tooth will be immobile**' },
      { zh:'可能有咬合干擾', en:'Occlusal interference may be present' }
    ],
    imaging:[
      { zh:'初診拍根尖片或咬合片作為基準', en:'Periapical or occlusal radiograph at presentation as a baseline' },
      { zh:'根尖側牙周韌帶腔增寬；**咬合片最看得清楚**，尤其牙齒向唇側移位時', en:'Increased periodontal ligament space apically — **most clearly seen on an occlusal radiograph**, especially when the tooth is displaced labially' }
    ],
    treatment:[
      { zh:'**咬合干擾輕微或沒有**：讓牙齒自行復位；通常在 **6 個月內**完成', en:'**Minimal or no occlusal interference**: allow spontaneous repositioning — it usually occurs **within 6 months**' },
      { zh:'嚴重移位時有兩個選項，都需要局部麻醉', en:'For severe displacement there are two options, both requiring local anesthesia' },
      { zh:'選項 A：**有吞入或吸入風險時**拔除', en:'Option A: extraction when there is a risk of ingestion or aspiration of the tooth' },
      { zh:'選項 B：輕輕復位；若在新位置不穩定，以彈性固定裝置連到鄰近未受傷的牙齒，固定 4 週', en:'Option B: gently reposition; if unstable in its new position, splint for 4 weeks with a flexible splint attached to the adjacent uninjured teeth' }
    ],
    splint:{ zh:'只有在選項 B 復位後不穩定時才用：彈性固定裝置連到鄰近未受傷的牙齒，4 週。', en:'Only under Option B when the repositioned tooth is unstable: flexible splint to the adjacent uninjured teeth for 4 weeks.' },
    pulp:[{ zh:'不做預防性處置；出現感染徵象才介入', en:'No prophylactic intervention; act only on signs of infection' }],
    good:[], bad:[], sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'位置、咬合、軟組織', en:'Position, occlusion, soft tissue' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'自行復位進度、變色、感染徵象', en:'Progress of spontaneous repositioning, discoloration, signs of infection' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'自行復位通常在此時完成', en:'Spontaneous repositioning is usually complete by now' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'臨床檢查', en:'Clinical review' } }
  ],
  altFollowUp:{
    when:{ zh:'若採選項 B 復位並固定', en:'If repositioned and splinted (Option B)' },
    list:[
      { d:7,  label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'固定裝置與位置穩定度', en:'Splint and position stability' } },
      { d:28, label:{ zh:'4 週', en:'4 wk' }, off:true, purpose:{ zh:'拆除固定裝置', en:'Splint removal' } },
      { d:56, label:{ zh:'8 週', en:'8 wk' }, purpose:{ zh:'變色、搖動度、感染徵象', en:'Discoloration, mobility, signs of infection' } },
      { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'位置與咬合', en:'Position and occlusion' } },
      { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'臨床檢查', en:'Clinical review' } }
    ]
  },
  yearlyNote:{ zh:'擔心可能出現不良結果時，之後每年臨床追蹤到恆牙萌出。', en:'Where an unfavorable outcome is thought likely, continue clinical follow-up each year until the permanent teeth erupt.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E3', certainty:{ zh:'低；拔除、復位與觀察三者何者較優，沒有足夠的隨機試驗證據', en:'Low; there is insufficient randomized evidence on whether extraction, repositioning or observation is generally superior' } }
},

/* ---------- 11. 內縮性脫位 ---------- */
{
  id:'d-intrusive-luxation', dentition:'primary', group:'luxation',
  img:'dx/lux-intrusive.svg', source:'IADT-3 Table 11',
  name:{ zh:'內縮性脫位', en:'Intrusive luxation' },
  short:{ zh:'牙齒被壓入齒槽骨，常穿過唇側骨板', en:'The tooth is driven into the alveolar bone, usually through the labial bone plate' },
  pub:{
    what:{ zh:'乳牙被撞進牙肉與骨頭裡，看起來變短，甚至整顆不見。', en:'The baby tooth has been pushed up into the gum and bone; it looks shorter, or seems to have disappeared.' },
    doNow:{ zh:'帶孩子就醫。**現在的國際指引通常不是馬上拔掉，而是先等它自己長回來**，但必須定期檢查。', en:'Have the child seen. **Current international guidance is usually not to extract, but to let it re-erupt on its own** — with regular review.' },
    dontDo:{ zh:'不要自己嘗試把牙齒拉出來。', en:'Do not try to pull the tooth back out.' },
    urgency:{ zh:'**幾天內**轉介到有兒童牙科外傷經驗的團隊。', en:'Rapid referral, **within a couple of days**, to a child-oriented team.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒通常被壓穿唇側骨板，也可能頂到恆牙牙胚', en:'The tooth is usually displaced through the labial bone plate, or it can impinge on the permanent tooth germ' },
      { zh:'牙齒幾乎或完全消失在齒槽窩內，常可在唇側摸到', en:'The tooth has almost or completely disappeared into the socket and can often be palpated labially' }
    ],
    imaging:[
      { zh:'初診拍根尖片或咬合片作為基準', en:'Periapical or occlusal radiograph at presentation as a baseline' },
      { zh:'**根尖朝唇側骨板移位**：看得到根尖，影像上牙齒顯得比對側短（foreshortened）', en:'**Apex displaced towards or through the labial bone plate**: the apical tip is visible and the tooth appears shorter (foreshortened) than the contralateral tooth' },
      { zh:'**根尖朝恆牙牙胚移位**：看不到根尖，影像上牙齒顯得變長（elongated）', en:'**Apex displaced towards the permanent tooth germ**: the apical tip cannot be visualized and the tooth appears elongated' }
    ],
    treatment:[
      { zh:'**讓牙齒自行復位，不論移位方向為何**——2020 版的重要改變之一，不再因根尖朝向恆牙牙胚就例行拔除', en:'**Allow the tooth to reposition spontaneously, irrespective of the direction of displacement** — a key change in the 2020 guideline; routine extraction because the apex points at the tooth germ is no longer advised' },
      { zh:'位置通常在 **6 個月內**明顯改善，少數要到 **1 年**', en:'The position usually improves within **6 months**; in some cases it can take up to **1 year**' },
      { zh:'安排**幾天內**轉介到有兒童牙科外傷經驗的團隊', en:'Arrange rapid referral, within a couple of days, to a child-oriented team with expertise in paediatric dental injuries' }
    ],
    splint:null,
    pulp:[{ zh:'不做預防性處置。出現感染、遲遲沒有改善、齒沾黏或其他不良結果時，才重新評估是否介入', en:'No prophylactic intervention. Re-assess for intervention only if infection, failure to improve, ankylosis or another adverse outcome appears' }],
    good:[{ zh:'牙齒持續再萌出、恢復位置', en:'The tooth continues to re-erupt and regains its position' }],
    bad:[{ zh:'遲遲沒有再萌出、齒沾黏', en:'Failure to re-erupt; ankylosis' }],
    sharedOutcomes:true
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'軟組織癒合、感染徵象', en:'Soft tissue healing, signs of infection' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'再萌出進度、感染徵象', en:'Progress of re-eruption, signs of infection' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'位置通常在此時已明顯改善', en:'Position has usually improved substantially by now' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'少數要到此時才完成再萌出', en:'In some cases re-eruption is only complete at this point' } }
  ],
  ageFollowUp:{ zh:'嚴重的內縮性脫位，**6 歲時**再追蹤一次，確認恆牙的萌出。', en:'For severe intrusion, a further review **at 6 years of age** to monitor eruption of the permanent tooth.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E3', certainty:{ zh:'低；恆牙繼承牙的後遺症有系統性回顧支持，但急性期介入方式的比較證據仍不足', en:'Low; sequelae in the permanent successor are supported by systematic review, but comparative evidence on acute management remains weak' } }
},

/* ---------- 12. 脫落 ---------- */
{
  id:'d-avulsion', dentition:'primary', group:'avulsion',
  img:'dx/avulsion.svg', source:'IADT-3 Table 12',
  name:{ zh:'脫落', en:'Avulsion' },
  short:{ zh:'整顆乳牙離開齒槽窩——**不可再植**', en:'The primary tooth is completely out of its socket — **do not replant**' },
  doNotReplant:true,
  pub:{
    what:{ zh:'整顆乳牙掉出來了。', en:'The whole baby tooth has come out.' },
    doNow:{ zh:'壓住傷口止血，找到牙齒帶去給牙醫確認。**如果找不到牙齒，一定要確認它不是被撞進骨頭裡、嵌在嘴唇或舌頭裡、跑進鼻子，或被吞下去、吸進呼吸道**——有呼吸症狀要立刻去急診。', en:'Apply pressure to stop the bleeding and bring the tooth for the dentist to check. **If the tooth cannot be found, it must be excluded that it has been driven into the bone, embedded in the lip or tongue, pushed into the nose, swallowed or aspirated** — with any respiratory symptoms, go to the emergency department at once.' },
    dontDo:{ zh:'**絕對不要把乳牙放回去。**', en:'**Never replant a primary tooth.**' },
    urgency:{ zh:'儘快檢查；找不到牙齒或有呼吸症狀時立刻就醫。', en:'Prompt examination; immediate care if the tooth is missing or there are respiratory symptoms.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒完全脫離齒槽窩', en:'The tooth is completely out of the socket' },
      { zh:'問診與檢查時必須追查牙齒下落——**尤其是沒有成人目擊，或曾失去意識時**', en:'The location of the missing tooth must be explored during the history and examination — **especially when no adult witnessed the accident or there was a loss of consciousness**' },
      { zh:'脫落的牙齒多半掉在口外，但有嵌入唇、頰、舌，被推進鼻腔，或被吞入、吸入的風險', en:'Avulsed teeth are most often lost outside the mouth, but may be embedded in the lip, cheek or tongue, pushed into the nose, ingested or aspirated' },
      { zh:'**找不到牙齒時要轉介急診做醫療評估**，有呼吸症狀時更必要', en:'**If the avulsed tooth is not found, refer the child for medical evaluation in an emergency department**, especially where there are respiratory symptoms' }
    ],
    imaging:[
      { zh:'**牙齒沒有被帶到診間時，根尖片或咬合片是必要的**——要確認這顆牙不是被內縮進去', en:'**Where the tooth is not brought to the clinic, a periapical or occlusal radiograph is essential** — to be sure the missing tooth has not been intruded' },
      { zh:'這張影像同時作為發育中恆牙的基準，並判斷恆牙是否被推移', en:'The same film provides a baseline for the developing permanent tooth and shows whether it has been displaced' }
    ],
    treatment:[{ zh:'**脫落的乳牙不可以再植。**', en:'**Avulsed primary teeth should not be replanted.**' }],
    splint:null,
    pulp:[{ zh:'不做根管治療。處置重點是軟組織癒合、感染控制，以及恆牙繼承牙的後續發育', en:'No endodontic treatment. The focus is soft tissue healing, infection control, and the subsequent development of the permanent successor' }],
    good:[{ zh:'恆牙繼承牙的發育與萌出沒有受到干擾的徵象', en:'No signs of disturbance to the development or eruption of the permanent successor' }],
    bad:[{ zh:'對恆牙繼承牙的發育或萌出造成負面影響', en:'Negative impact on the development or eruption of the permanent successor' }],
    sharedOutcomes:false
  },
  followUp:[
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'臨床檢查：軟組織癒合、感染徵象', en:'Clinical review: soft tissue healing, signs of infection' } }
  ],
  ageFollowUp:{ zh:'**6 歲時**再追蹤一次，確認恆牙的萌出。', en:'A further review **at 6 years of age** to monitor eruption of the permanent tooth.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E3/E4', certainty:{ zh:'不再植屬強烈共識，但不是來自隨機試驗', en:'The contraindication to replantation is a strong consensus, though not derived from randomized trials' } }
}

];
