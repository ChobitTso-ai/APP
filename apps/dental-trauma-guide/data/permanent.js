/* =========================================================
   牙外傷處置指南 —— 恆牙（14 種診斷）

   臨床內容依 IADT 2020：
     IADT-1 Bourguignon et al. Dent Traumatol 2020;36:314–330（Tables 1–13）
     IADT-2 Fouad et al.       Dent Traumatol 2020;36:331–342（脫落）
   固定天數、追蹤時程、門檻值皆逐項回原文核對，見 CONTENT-SOURCES.md。
   中文術語依《台灣牙髓病學醫學辭彙》。
   ©Tso KY - All Rights Reserved

   欄位說明
     followUp[].d   回診日（受傷日起算天數）；[min,max] 表示區間
     followUp[].off 該次要拆固定裝置
     yearlyTo       之後每年追蹤到第幾年（null = 不需要）
   ========================================================= */

const PERMANENT_DX = [

/* ---------- 1. 牙釉質裂紋 ---------- */
{
  id:'p-enamel-infraction', dentition:'permanent', group:'fracture',
  img:'dx/fx-infraction.svg', source:'IADT-1 Table 1',
  name:{ zh:'牙釉質裂紋', en:'Enamel infraction' },
  short:{ zh:'牙釉質內的不完全裂紋，沒有實質缺損', en:'Incomplete crack within enamel, no loss of tooth structure' },
  pub:{
    what:{ zh:'牙釉質裡出現細裂紋，但牙齒沒有缺角，形狀是完整的。', en:'Fine cracks have formed within the enamel, but no part of the tooth is missing.' },
    doNow:{ zh:'不需要特別處理。先讓牙醫確認有沒有同時發生其他看不出來的傷害。', en:'No immediate treatment is needed. Have a dentist check for other injuries that are not visible.' },
    dontDo:{ zh:'不要反覆用這顆牙測試會不會痛。', en:'Do not keep testing the tooth to see whether it hurts.' },
    urgency:{ zh:'不急，但仍建議儘快檢查一次。', en:'Not urgent, but still worth an early check-up.' }
  },
  clin:{
    criteria:[
      { zh:'牙釉質不完全斷裂（裂紋），無牙齒結構缺損', en:'Incomplete fracture (crack or crazing) of enamel without loss of tooth structure' },
      { zh:'搖動度正常，叩診與觸診不痛', en:'Normal mobility; not tender to percussion or palpation' },
      { zh:'敏感性測試通常為陽性', en:'Pulp sensibility tests usually positive' },
      { zh:'影像上無異常', en:'No radiographic abnormalities' },
      { zh:'有叩痛時要特別評估是否合併脫位或牙根斷裂', en:'If tenderness is present, specifically assess for an associated luxation or root fracture' }
    ],
    imaging:[
      { zh:'一張平行投影根尖片', en:'One parallel periapical radiograph' },
      { zh:'有其他傷害的徵象或症狀時加照', en:'Additional views if there are signs or symptoms of other injuries' }
    ],
    treatment:[
      { zh:'裂紋嚴重時，可考慮酸蝕後以黏著樹脂封閉，預防變色與細菌污染', en:'For severe infractions, consider etching and sealing with bonding resin to prevent discoloration and bacterial contamination' },
      { zh:'其他情況不需要治療', en:'Otherwise no treatment is necessary' }
    ],
    splint:null,
    pulp:[{ zh:'不需根管治療；僅需確認沒有合併其他傷害', en:'No endodontic treatment; simply confirm there is no associated injury' }],
    good:[
      { zh:'無症狀', en:'Asymptomatic' },
      { zh:'敏感性測試陽性', en:'Positive response to pulp sensibility testing' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[{ zh:'出現症狀、變色或根尖病灶——多半代表當初漏掉了合併的脫位傷害', en:'Symptoms, discoloration or apical pathosis — usually indicating a missed concomitant luxation injury' }]
  },
  followUp:[],
  noFollowUp:{ zh:'確定只有牙釉質裂紋時，IADT 不要求例行追蹤。但只要合併脫位或牙根斷裂，就改用該傷害的追蹤時程。', en:'When the injury is certainly an infraction only, the IADT requires no routine follow-up. If there is any associated luxation or root fracture, that injury’s follow-up regimen prevails.' },
  yearlyTo:null,
  evidence:{ g:true, e:'E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 2. 牙釉質斷裂 ---------- */
{
  id:'p-enamel-fracture', dentition:'permanent', group:'fracture',
  img:'dx/fx-enamel.svg', source:'IADT-1 Table 2',
  name:{ zh:'牙釉質斷裂', en:'Enamel fracture' },
  short:{ zh:'缺損只在牙釉質層內，未及牙本質', en:'Loss confined to enamel; dentin not involved' },
  pub:{
    what:{ zh:'牙齒缺了一小角，缺的只有最外層白色的牙釉質，通常不會傷到牙髓。', en:'A small corner of the tooth is missing, involving only the outer white enamel. The pulp is usually unaffected.' },
    doNow:{ zh:'找到斷片帶來，牙醫可能可以黏回去；邊緣銳利會刮舌頭的話請牙醫磨平。', en:'Bring the fragment — it may be bonded back. If the edge is sharp and irritates the tongue, ask the dentist to smooth it.' },
    dontDo:{ zh:'不要自己用黏膠黏，也不要自己磨。', en:'Do not glue or file the tooth yourself.' },
    urgency:{ zh:'當日或儘快評估。', en:'Same day or as soon as possible.' }
  },
  clin:{
    criteria:[
      { zh:'斷裂僅限於牙釉質，無牙本質暴露', en:'Fracture confined to enamel, no dentin exposed' },
      { zh:'搖動度正常，叩診與觸診不痛', en:'Normal mobility; not tender to percussion or palpation' },
      { zh:'敏感性測試通常為陽性', en:'Pulp sensibility tests usually positive' },
      { zh:'找不到斷片而唇頰有傷口時，要照軟組織片找碎片與異物', en:'If the fragment is missing and there are soft tissue wounds, radiograph the lip and cheek to look for fragments and foreign bodies' }
    ],
    imaging:[
      { zh:'一張平行投影根尖片', en:'One parallel periapical radiograph' },
      { zh:'懷疑其他傷害時加照不同角度', en:'Additional angulations if other injuries are suspected' }
    ],
    treatment:[
      { zh:'斷片完整時可直接黏回', en:'If the fragment is available and intact, bond it back onto the tooth' },
      { zh:'或依缺損範圍與位置，磨平銳利邊緣或以複合樹脂修復', en:'Alternatively, depending on extent and location, smooth the edges or place a composite resin restoration' }
    ],
    splint:null,
    pulp:[{ zh:'不需根管治療；追蹤牙髓狀態即可', en:'No endodontic treatment; monitor pulp status' }],
    good:[
      { zh:'無症狀，敏感性測試陽性', en:'Asymptomatic, positive sensibility response' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'出現症狀或牙髓壞死', en:'Symptomatic or pulp necrosis' },
      { zh:'牙冠變色', en:'Crown discoloration' }
    ]
  },
  followUp:[
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'臨床與影像評估；確認沒有漏掉合併的脫位傷害', en:'Clinical and radiographic review; confirm no missed concomitant luxation' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'牙髓狀態、修復體、根尖變化', en:'Pulp status, restoration, apical changes' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 3. 牙釉質牙本質斷裂（未露髓） ---------- */
{
  id:'p-enamel-dentin-fracture', dentition:'permanent', group:'fracture',
  img:'dx/fx-enamel-dentin.svg', source:'IADT-1 Table 3',
  name:{ zh:'牙釉質牙本質斷裂（未露髓）', en:'Enamel-dentin fracture (uncomplicated crown fracture)' },
  short:{ zh:'缺損深及牙本質但未露髓', en:'Loss of enamel and dentin without pulp exposure' },
  pub:{
    what:{ zh:'斷面可以看到裡面黃色的牙本質，但沒有紅色或出血的牙髓。牙本質露出來會敏感，也讓細菌比較容易接近牙髓。', en:'Yellow dentin is visible at the fracture surface, but there is no red or bleeding pulp. Exposed dentin is sensitive and lets bacteria get closer to the pulp.' },
    doNow:{ zh:'找到斷片，泡在水或牛奶裡帶來；避免用這顆牙咬硬的東西，儘快修復。', en:'Find the fragment and bring it in water or milk; avoid biting on the tooth and have it restored promptly.' },
    dontDo:{ zh:'不要讓斷片乾掉，也不要自己塗東西上去。', en:'Do not let the fragment dry out, and do not apply anything to the tooth yourself.' },
    urgency:{ zh:'當日或儘快處理，越早封起來越好。', en:'Same day or as soon as possible — the sooner it is sealed the better.' }
  },
  clin:{
    criteria:[
      { zh:'牙釉質與牙本質缺損，未露髓', en:'Loss of enamel and dentin without pulp exposure' },
      { zh:'搖動度正常；叩診通常不痛，會痛時要評估是否合併脫位或牙根斷裂', en:'Normal mobility; usually not tender to percussion — if tender, assess for associated luxation or root fracture' },
      { zh:'敏感性測試通常為陽性', en:'Pulp sensibility tests usually positive' },
      { zh:'斷片下落不明且軟組織有傷口時，要照軟組織片', en:'Radiograph soft tissues if the fragment is unaccounted for and there are soft tissue wounds' }
    ],
    imaging:[
      { zh:'一張平行投影根尖片', en:'One parallel periapical radiograph' },
      { zh:'懷疑其他傷害時加照', en:'Additional radiographs if other injuries are suspected' }
    ],
    treatment:[
      { zh:'斷片完整時可黏回；黏之前先泡水或生理食鹽水 20 分鐘再水化', en:'If the fragment is intact it can be bonded back; rehydrate it first by soaking in water or saline for 20 minutes' },
      { zh:'否則以玻璃離子體、或黏著劑加複合樹脂覆蓋暴露的牙本質', en:'Otherwise cover the exposed dentin with glass-ionomer, or a bonding agent with composite resin' },
      { zh:'暴露的牙本質距離牙髓 0.5 mm 以內（透出粉紅色但沒有出血）時，先墊氫氧化鈣再以玻璃離子體之類的材料覆蓋', en:'If the exposed dentin is within 0.5 mm of the pulp (pink but not bleeding), place a calcium hydroxide lining and cover it with a material such as glass-ionomer' }
    ],
    splint:null,
    pulp:[{ zh:'不需根管治療。預後主要取決於剩餘牙本質厚度、封閉品質、牙根成熟度，以及是否合併脫位傷害', en:'No endodontic treatment. Prognosis depends mainly on remaining dentin thickness, quality of the seal, root maturity, and whether there is an associated luxation injury' }],
    good:[
      { zh:'無症狀，敏感性測試陽性', en:'Asymptomatic, positive sensibility response' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'出現症狀、牙髓壞死與感染', en:'Symptoms, pulp necrosis and infection' },
      { zh:'牙冠變色', en:'Crown discoloration' },
      { zh:'未成熟牙牙根停止發育', en:'Arrested root development in immature teeth' }
    ]
  },
  followUp:[
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'牙髓活性、修復體密封、是否有漏診的脫位', en:'Pulp vitality, integrity of the seal, any missed luxation' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'牙髓狀態、根尖變化、牙根發育', en:'Pulp status, apical changes, root development' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E3', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 4. 複雜性牙冠斷裂（露髓） ---------- */
{
  id:'p-complicated-crown-fracture', dentition:'permanent', group:'fracture',
  img:'dx/fx-complicated-crown.svg', source:'IADT-1 Table 4',
  name:{ zh:'複雜性牙冠斷裂（露髓）', en:'Complicated crown fracture' },
  short:{ zh:'牙釉質與牙本質斷裂並露髓', en:'Enamel-dentin fracture with pulp exposure' },
  pub:{
    what:{ zh:'斷面中央看得到紅色或會出血的組織，那是牙髓。這不等於一定要抽神經——尤其年輕恆牙，保住活的牙髓對牙根繼續發育非常重要。', en:'Red or bleeding tissue is visible at the centre of the fracture — that is the pulp. This does not automatically mean root canal treatment; in young permanent teeth, keeping the pulp alive is important for the root to finish developing.' },
    doNow:{ zh:'找到斷片並保持濕潤，儘快就醫。越早處理，保住活髓的機會越大。', en:'Find the fragment, keep it moist, and see a dentist quickly. The sooner it is treated, the better the chance of keeping the pulp alive.' },
    dontDo:{ zh:'不要擦拭或消毒露出來的牙髓，也不要自己蓋東西上去。', en:'Do not wipe or disinfect the exposed pulp, and do not cover it with anything yourself.' },
    urgency:{ zh:'當日處理。', en:'Same-day care.' }
  },
  clin:{
    criteria:[
      { zh:'牙釉質與牙本質斷裂並露髓', en:'Fracture confined to enamel and dentin with pulp exposure' },
      { zh:'搖動度正常；叩診與觸診不痛（會痛時評估是否合併脫位或牙根斷裂）', en:'Normal mobility; not tender to percussion or palpation (if tender, assess for associated luxation or root fracture)' },
      { zh:'暴露的牙髓對刺激（空氣、冷、甜）敏感', en:'Exposed pulp is sensitive to stimuli such as air, cold and sweets' }
    ],
    imaging:[
      { zh:'一張平行投影根尖片', en:'One parallel periapical radiograph' },
      { zh:'斷片下落不明且軟組織有傷口時照唇頰軟組織片', en:'Radiograph the lip and cheek if the fragment is missing and soft tissue is injured' }
    ],
    treatment:[
      { zh:'未成熟、根尖未閉鎖的牙齒，保住牙髓最重要：建議局部斷髓術或牙髓覆蓋，讓牙根繼續發育', en:'In immature teeth with open apices, preserving the pulp is paramount: partial pulpotomy or pulp capping is recommended to allow continued root development' },
      { zh:'牙根發育完成的成熟牙，同樣以保守的活髓治療（例如局部斷髓術）為優先', en:'Conservative pulp treatment such as partial pulpotomy is also the preferred approach in teeth with complete root formation' },
      { zh:'牙髓傷口上放非硬化型氫氧化鈣，或不染色的矽酸鈣類材料', en:'Place non-setting calcium hydroxide or a non-staining calcium silicate cement on the pulp wound' },
      { zh:'成熟牙若修復上必須做柱心，根管治療才成為首選', en:'If a post is required for crown retention in a mature tooth, root canal treatment becomes the preferred option' },
      { zh:'有斷片時，可在牙髓處理完成後水化黏回；沒有斷片則以玻璃離子體或黏著劑加複合樹脂覆蓋牙本質', en:'If the fragment is available, rehydrate and bond it back after the pulp has been treated; otherwise cover the dentin with glass-ionomer or bonding agent and composite resin' }
    ],
    splint:null,
    pulp:[
      { zh:'單純外傷性露髓，局部斷髓術比直接根管治療更符合組織保存原則', en:'For a purely traumatic exposure, partial pulpotomy is more consistent with tissue preservation than proceeding directly to root canal treatment' },
      { zh:'成功指標：無症狀、功能正常、敏感性測試有反應或牙根持續發育、無根尖病灶', en:'Success indicators: asymptomatic, normal function, response to sensibility testing or continued root development, no apical pathosis' }
    ],
    good:[
      { zh:'無症狀，敏感性測試陽性', en:'Asymptomatic, positive sensibility response' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'牙髓壞死與感染、根尖周圍炎', en:'Pulp necrosis and infection, apical periodontitis' },
      { zh:'未成熟牙牙根停止發育', en:'Arrested root development in immature teeth' }
    ]
  },
  followUp:[
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'牙髓癒合、牙根發育、根尖病灶', en:'Pulp healing, root development, apical pathosis' } },
    { d:90,  label:{ zh:'3 個月', en:'3 mo' }, purpose:{ zh:'同上；注意變色與症狀', en:'As above; watch for discoloration and symptoms' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'牙髓狀態與牙根發育', en:'Pulp status and root development' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'牙髓狀態、根尖變化、修復體', en:'Pulp status, apical changes, restoration' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E3', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 5. 單純性牙冠牙根斷裂（未露髓） ---------- */
{
  id:'p-crown-root-fracture-uncomp', dentition:'permanent', group:'fracture',
  img:'dx/fx-crown-root-uncomp.svg', source:'IADT-1 Table 5',
  name:{ zh:'單純性牙冠牙根斷裂（未露髓）', en:'Uncomplicated crown-root fracture' },
  short:{ zh:'斷裂延伸至齦下牙根，未露髓', en:'Fracture extending below the gingival margin into the root, without pulp exposure' },
  pub:{
    what:{ zh:'裂線從牙冠斜斜延伸到牙齦下方，鬆動的那一片常會晃、咬東西會痛。', en:'The fracture line runs obliquely from the crown to below the gum line; the loose piece often wobbles and biting hurts.' },
    doNow:{ zh:'儘快就醫。牙醫通常會先把鬆動的部分暫時固定，再評估這顆牙能不能保留。', en:'See a dentist promptly. The loose fragment is usually stabilized temporarily first, then the tooth is assessed for restorability.' },
    dontDo:{ zh:'不要自己把鬆動的斷片拔掉或拉扯。', en:'Do not pull off or tug at the loose fragment yourself.' },
    urgency:{ zh:'當日處理。', en:'Same-day care.' }
  },
  clin:{
    criteria:[
      { zh:'斷裂涉及牙釉質、牙本質與牙骨質，未露髓', en:'Fracture involving enamel, dentin and cementum, without pulp exposure' },
      { zh:'冠側斷片常有搖動度，叩診會痛', en:'The coronal fragment is usually mobile and tender to percussion' },
      { zh:'斷裂線常延伸至齦下', en:'The fracture line typically extends subgingivally' }
    ],
    imaging:[
      { zh:'一張平行投影根尖片，加上不同水平與垂直角度的加照', en:'One parallel periapical radiograph plus views at different horizontal and vertical angulations' },
      { zh:'CBCT 可協助看清裂線路徑、範圍與其與邊緣骨的關係，並評估冠根比以決定治療選項', en:'CBCT can clarify the fracture path, its extent and its relationship to the marginal bone, and help assess the crown-root ratio when planning treatment' }
    ],
    treatment:[
      { zh:'治療計畫定案前，先把鬆動斷片暫時固定到鄰牙或不動的斷片上', en:'Until the treatment plan is finalized, temporarily stabilize the loose fragment to adjacent teeth or to the immobile fragment' },
      { zh:'未露髓時，可考慮移除冠側或鬆動的斷片後修復', en:'With no pulp exposure, consider removing the coronal or mobile fragment and restoring the tooth' },
      { zh:'以玻璃離子體或黏著劑加複合樹脂覆蓋暴露的牙本質', en:'Cover the exposed dentin with glass-ionomer or bonding agent with composite resin' },
      { zh:'後續選項（依年齡與配合度）：根尖或不動斷片的矯正性牙根突出術、手術性牙根突出術、牙髓壞死感染時的根管治療與修復、牙根埋入、蓄意再植術（可伴隨牙根旋轉）、拔除、自體移植', en:'Later options, depending on age and cooperation: orthodontic extrusion of the apical or immobile fragment, surgical extrusion, root canal treatment and restoration if the pulp becomes necrotic and infected, root submergence, intentional replantation with or without rotation of the root, extraction, autotransplantation' }
    ],
    splint:{ zh:'暫時固定鬆動斷片，直到治療計畫確定。IADT 沒有為牙冠牙根斷裂訂一個通用的固定天數——這裡的固定是暫時性的斷片穩定，不是脫位用的固定療程。', en:'Temporary stabilization of the mobile fragment until the treatment plan is settled. The IADT does not specify a single splinting period for crown-root fractures — this is temporary fragment stabilization, not a luxation splinting protocol.' },
    pulp:[{ zh:'急診不做預防性根管治療；依牙髓狀態與最終修復計畫決定', en:'No prophylactic endodontic treatment at the emergency visit; decide according to pulp status and the definitive restorative plan' }],
    good:[
      { zh:'無症狀，敏感性測試陽性', en:'Asymptomatic, positive sensibility response' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'牙髓壞死與感染', en:'Pulp necrosis and infection' },
      { zh:'牙周狀況惡化、斷片持續鬆動', en:'Deteriorating periodontal status, persistent fragment mobility' }
    ]
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'暫時固定是否穩定、軟組織癒合、疼痛控制', en:'Stability of the temporary stabilization, soft tissue healing, pain control' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'牙髓狀態、牙周與修復穩定度', en:'Pulp status, periodontal and restorative stability' } },
    { d:90,  label:{ zh:'3 個月', en:'3 mo' }, purpose:{ zh:'牙髓狀態、牙根吸收', en:'Pulp status, root resorption' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'同上', en:'As above' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'牙髓、牙周、修復體整體評估', en:'Overall pulpal, periodontal and restorative review' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E3/E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 6. 複雜性牙冠牙根斷裂（露髓） ---------- */
{
  id:'p-crown-root-fracture-comp', dentition:'permanent', group:'fracture',
  img:'dx/fx-crown-root-comp.svg', source:'IADT-1 Table 6',
  name:{ zh:'複雜性牙冠牙根斷裂（露髓）', en:'Complicated crown-root fracture' },
  short:{ zh:'斷裂延伸至齦下牙根並通過牙髓', en:'Fracture extending below the gingival margin into the root, with pulp exposure' },
  pub:{
    what:{ zh:'裂線從牙冠延伸到牙齦下方，而且穿過了牙髓，所以看得到紅色或出血的組織。', en:'The fracture runs from the crown to below the gum line and passes through the pulp, so red or bleeding tissue is visible.' },
    doNow:{ zh:'儘快就醫。牙醫會先固定鬆動的斷片並處理牙髓，再決定這顆牙的保存方式。', en:'See a dentist promptly. The loose fragment is stabilized and the pulp treated first, then the plan for saving the tooth is decided.' },
    dontDo:{ zh:'不要自己拔掉斷片，也不要碰露出來的牙髓。', en:'Do not remove the fragment yourself, and do not touch the exposed pulp.' },
    urgency:{ zh:'當日處理。', en:'Same-day care.' }
  },
  clin:{
    criteria:[
      { zh:'斷裂涉及牙釉質、牙本質與牙骨質並露髓', en:'Fracture involving enamel, dentin and cementum, with pulp exposure' },
      { zh:'冠側斷片常有搖動度，叩診會痛', en:'The coronal fragment is usually mobile and tender to percussion' }
    ],
    imaging:[
      { zh:'一張平行投影根尖片，加上不同角度的加照', en:'One parallel periapical radiograph plus additional angulations' },
      { zh:'CBCT 可協助界定裂線路徑、範圍與冠根比', en:'CBCT can define the fracture path, extent and crown-root ratio' }
    ],
    treatment:[
      { zh:'治療計畫定案前，先把鬆動斷片暫時固定到鄰牙或不動的斷片上', en:'Until the treatment plan is finalized, temporarily stabilize the loose fragment to adjacent teeth or to the immobile fragment' },
      { zh:'未成熟、牙根未發育完成的牙齒，以局部斷髓術保住牙髓為佳；橡皮障隔離雖困難仍應嘗試', en:'In immature teeth with incomplete root formation it is advantageous to preserve the pulp with a partial pulpotomy; rubber dam isolation is challenging but should be attempted' },
      { zh:'牙髓傷口上放非硬化型氫氧化鈣或不染色的矽酸鈣類材料', en:'Place non-setting calcium hydroxide or a non-staining calcium silicate cement on the pulp wound' },
      { zh:'牙根發育完成的成熟牙，通常需要摘除牙髓', en:'In mature teeth with complete root formation, removal of the pulp is usually indicated' },
      { zh:'後續選項與未露髓型相同：完成根管治療與修復、矯正性或手術性牙根突出術、牙根埋入、蓄意再植術、拔除、自體移植', en:'Later options as for the uncomplicated type: completing root canal treatment and restoration, orthodontic or surgical extrusion, root submergence, intentional replantation, extraction, autotransplantation' }
    ],
    splint:{ zh:'暫時固定鬆動斷片，直到治療計畫確定；非脫位用的固定療程。', en:'Temporary stabilization of the mobile fragment until the plan is settled; not a luxation splinting protocol.' },
    pulp:[{ zh:'未成熟牙以保存活髓優先；成熟牙且修復需要根管空間時才摘除牙髓', en:'Preserve vital pulp in immature teeth; remove the pulp in mature teeth when the restorative plan requires the canal space' }],
    good:[
      { zh:'無症狀，牙齒功能正常', en:'Asymptomatic with normal function' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'牙髓壞死與感染、根尖周圍炎', en:'Pulp necrosis and infection, apical periodontitis' },
      { zh:'牙周狀況惡化、無法建立可清潔的修復體', en:'Deteriorating periodontal status; unable to create a cleansable restoration' }
    ]
  },
  followUp:[
    { d:7, label:{ zh:'1 週', en:'1 wk' }, purpose:{ zh:'暫時固定穩定度、牙髓處置後反應、軟組織癒合', en:'Stability of temporary stabilization, response after pulp treatment, soft tissue healing' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'牙髓癒合、牙周與修復穩定度', en:'Pulp healing, periodontal and restorative stability' } },
    { d:90,  label:{ zh:'3 個月', en:'3 mo' }, purpose:{ zh:'牙根發育、根尖病灶、牙根吸收', en:'Root development, apical pathosis, root resorption' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'同上', en:'As above' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'整體評估', en:'Overall review' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E3/E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 7. 牙根斷裂 ---------- */
{
  id:'p-root-fracture', dentition:'permanent', group:'fracture',
  img:'dx/fx-root-thirds.svg', source:'IADT-1 Table 7',
  name:{ zh:'牙根斷裂', en:'Root fracture' },
  short:{ zh:'牙根的橫向或斜向斷裂，依位置分根尖、中段、頸部三分之一', en:'Transverse or oblique fracture of the root — apical, middle or cervical third' },
  pub:{
    what:{ zh:'牙冠外觀可能完全正常，只是突然變鬆或位置跑掉，所以很容易被忽略，一定要照 X 光才看得出來。', en:'The crown may look completely normal — the tooth simply becomes loose or shifts position. It is easy to miss and needs a radiograph to diagnose.' },
    doNow:{ zh:'儘快就醫。牙齒如果移位了，越早由牙醫復位通常越有利。', en:'See a dentist promptly. If the tooth has been displaced, the earlier it is repositioned the better.' },
    dontDo:{ zh:'不要反覆搖動或自己推回去。', en:'Do not keep wiggling the tooth or try to push it back yourself.' },
    urgency:{ zh:'當日緊急處理。', en:'Same-day emergency care.' }
  },
  clin:{
    criteria:[
      { zh:'斷裂涉及牙本質、牙骨質與牙髓，可為水平、斜向或混合型', en:'Fracture involving dentin, cementum and pulp; may be horizontal, oblique or combined' },
      { zh:'冠側斷片常有搖動度、可能移位', en:'The coronal fragment is often mobile and may be displaced' },
      { zh:'叩診可能有觸痛；敏感性測試可能一開始就陰性', en:'May be tender to percussion; sensibility tests may be negative initially' }
    ],
    imaging:[
      { zh:'不加照就可能漏診——要拍不同水平與垂直角度的根尖片，必要時加咬合片', en:'Root fractures may go undetected without additional imaging — take periapical views at different horizontal and vertical angulations, and an occlusal view when needed' },
      { zh:'平片不足以規劃治療時，可考慮 CBCT 判定斷裂位置、範圍與方向', en:'If plain films are insufficient for planning, consider CBCT to determine the location, extent and direction of the fracture' }
    ],
    treatment:[
      { zh:'冠側斷片若移位，應儘早復位，並以影像確認復位結果', en:'If the coronal fragment is displaced, reposition it as soon as possible and verify the result radiographically' },
      { zh:'以被動柔性固定裝置穩定有搖動度的冠側斷片 4 週；斷裂位於頸部時可能需要延長至 4 個月', en:'Stabilize the mobile coronal segment with a passive flexible splint for 4 weeks; for cervically located fractures a longer period of up to 4 months may be needed' },
      { zh:'頸部斷裂仍有癒合的可能，因此冠側斷片——尤其在沒有搖動度時——不應在急診就移除', en:'Cervical fractures have the potential to heal, so the coronal fragment, especially when not mobile, should not be removed at the emergency visit' },
      { zh:'成熟牙若頸部斷裂線位於齒槽脊之上且冠側斷片非常鬆動，才考慮移除冠側斷片、根管治療並以柱心修復', en:'Only in mature teeth where the cervical fracture line lies above the alveolar crest and the coronal fragment is very mobile should that fragment be removed, followed by root canal treatment and post-retained restoration' }
    ],
    splint:{ zh:'被動柔性固定裝置 4 週；頸部三分之一斷裂可延長至 4 個月。', en:'Passive flexible splint for 4 weeks; up to 4 months for cervical-third fractures.' },
    pulp:[
      { zh:'急診不啟動根管治療', en:'No endodontic treatment is started at the emergency visit' },
      { zh:'日後若發生牙髓壞死與感染，通常只發生在冠側斷片，因此只需治療冠側斷片到斷裂線為止；根尖斷片很少需要治療', en:'If pulp necrosis and infection develop later they usually involve the coronal fragment only, so treat the coronal segment to the fracture line; the apical segment rarely requires treatment' },
      { zh:'斷裂線常為斜向，工作長度不易判定，可能需要採根尖成形術的方式處理', en:'Fracture lines are frequently oblique, making working length difficult to determine; an apexification approach may be needed' }
    ],
    good:[
      { zh:'無症狀，斷片穩定', en:'Asymptomatic with a stable fragment' },
      { zh:'影像上可見硬組織或結締組織癒合', en:'Radiographic evidence of hard tissue or connective tissue healing' },
      { zh:'敏感性測試陽性', en:'Positive sensibility response' }
    ],
    bad:[
      { zh:'冠側斷片牙髓壞死與感染', en:'Pulp necrosis and infection of the coronal fragment' },
      { zh:'斷裂線處持續透射影', en:'Persistent radiolucency at the fracture line' },
      { zh:'發炎性吸收、搖動度持續增加', en:'Inflammatory resorption, increasing mobility' }
    ]
  },
  followUp:[
    { d:28, label:{ zh:'4 週', en:'4 wk' }, off:true, purpose:{ zh:'拆除固定裝置（中段與根尖三分之一）；確認復位與癒合', en:'Splint removal for middle and apical third fractures; confirm position and healing' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'斷裂癒合、冠側牙髓狀態、搖動度', en:'Fracture healing, coronal pulp status, mobility' } },
    { d:120, label:{ zh:'4 個月', en:'4 mo' }, off:true, purpose:{ zh:'頸部三分之一斷裂於此時拆除固定裝置；評估癒合型態', en:'Splint removal for cervical-third fractures; assess the healing pattern' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'牙髓狀態、發炎性吸收', en:'Pulp status, inflammatory resorption' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'癒合型態、牙髓狀態、牙根吸收', en:'Healing pattern, pulp status, root resorption' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E2', certainty:{ zh:'低至中', en:'Low to moderate' } }
},

/* ---------- 8. 齒槽骨骨折 ---------- */
{
  id:'p-alveolar-fracture', dentition:'permanent', group:'fracture',
  img:'dx/fx-alveolar.svg', source:'IADT-1 Table 8',
  name:{ zh:'齒槽骨骨折', en:'Alveolar fracture' },
  short:{ zh:'多顆牙連同一段齒槽骨整段移動', en:'Several teeth move together with a segment of alveolar bone' },
  pub:{
    what:{ zh:'不只一顆牙受傷，而是好幾顆牙連同下面的一塊骨頭一起移位，所以咬合會對不起來。', en:'More than one tooth is involved — several teeth have moved together with the bone beneath them, so the bite no longer fits.' },
    doNow:{ zh:'立刻就醫。移位的骨段需要復位並固定。', en:'Seek care immediately. The displaced segment needs to be repositioned and stabilized.' },
    dontDo:{ zh:'不要自己嘗試把牙齒推回去，也不要用力咬合測試。', en:'Do not try to push the teeth back, and do not test the bite forcefully.' },
    urgency:{ zh:'當日緊急處理。', en:'Same-day emergency care.' }
  },
  clin:{
    criteria:[
      { zh:'骨折涉及齒槽骨，可延伸至鄰近骨', en:'Fracture involving the alveolar bone, which may extend to adjacent bone' },
      { zh:'整段骨與其上的牙齒一起移動（en bloc）', en:'The segment moves as a block together with the teeth it carries' },
      { zh:'常伴隨咬合錯亂', en:'Occlusal disturbance is common' }
    ],
    imaging:[
      { zh:'不同角度的根尖片與咬合片', en:'Periapical views at different angulations plus an occlusal view' },
      { zh:'平片不足時可考慮全景片與／或 CBCT，以判定斷裂位置、範圍與方向', en:'If plain films are insufficient, consider a panoramic radiograph and/or CBCT to determine the location, extent and direction of the fracture' }
    ],
    treatment:[
      { zh:'復位移位的骨段，恢復合理咬合', en:'Reposition any displaced segment and restore a reasonable occlusion' },
      { zh:'以被動柔性固定裝置把該段牙齒固定 4 週', en:'Stabilize the segment by splinting the teeth with a passive flexible splint for 4 weeks' },
      { zh:'有牙齦裂傷時予以縫合', en:'Suture gingival lacerations if present' }
    ],
    splint:{ zh:'被動柔性固定裝置 4 週。', en:'Passive flexible splint for 4 weeks.' },
    pulp:[
      { zh:'急診禁止根管治療', en:'Root canal treatment is contraindicated at the emergency visit' },
      { zh:'初診與每次追蹤都要逐顆評估牙髓狀態，確認是否、以及何時需要根管治療', en:'Monitor the pulp condition of every involved tooth at the initial visit and at each follow-up to determine if and when endodontic treatment becomes necessary' }
    ],
    good:[
      { zh:'無症狀，骨段癒合、咬合恢復', en:'Asymptomatic, segment united, occlusion restored' },
      { zh:'敏感性測試陽性', en:'Positive sensibility response' }
    ],
    bad:[
      { zh:'個別牙齒牙髓壞死與感染', en:'Pulp necrosis and infection in individual teeth' },
      { zh:'邊緣齒槽骨流失、牙齒吸收、咬合持續異常', en:'Marginal bone loss, root resorption, persistent occlusal disturbance' }
    ]
  },
  followUp:[
    { d:28, label:{ zh:'4 週', en:'4 wk' }, off:true, purpose:{ zh:'拆除固定裝置；骨段穩定度、咬合、逐顆牙髓評估', en:'Splint removal; segment stability, occlusion, tooth-by-tooth pulp assessment' } },
    { d:[42,56], label:{ zh:'6–8 週', en:'6–8 wk' }, purpose:{ zh:'骨癒合、牙周狀態、牙髓', en:'Bone healing, periodontal status, pulp' } },
    { d:120, label:{ zh:'4 個月', en:'4 mo' }, purpose:{ zh:'邊緣骨高度、牙根吸收', en:'Marginal bone level, root resorption' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'同上', en:'As above' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'骨癒合、牙髓、咬合、邊緣骨整體評估', en:'Overall review of bone union, pulp, occlusion and marginal bone' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E3/E4', certainty:{ zh:'低', en:'Low' } }
},

/* ---------- 9. 震盪 ---------- */
{
  id:'p-concussion', dentition:'permanent', group:'luxation',
  img:'dx/lux-concussion.svg', source:'IADT-1 Table 9',
  name:{ zh:'震盪', en:'Concussion' },
  short:{ zh:'支持組織受傷，但沒有異常搖動也沒有移位', en:'Injury to the supporting structures without abnormal mobility or displacement' },
  pub:{
    what:{ zh:'牙齒沒有歪掉，也沒有比平常更鬆，但敲到或咬東西會痛，像牙齒周圍的組織瘀傷了。', en:'The tooth has not moved and is not looser than usual, but tapping or biting hurts — the tissues around the tooth are bruised.' },
    doNow:{ zh:'吃軟一點的食物，避免用這顆牙施力，保持清潔。', en:'Eat softer food, avoid loading the tooth, and keep the area clean.' },
    dontDo:{ zh:'不要反覆敲或咬來測試還痛不痛。', en:'Do not keep tapping or biting to test whether it still hurts.' },
    urgency:{ zh:'儘快檢查，確認沒有合併其他傷害。', en:'Have it checked soon to exclude other injuries.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒支持組織受傷，無異常搖動、無移位', en:'Injury to the tooth-supporting structures without abnormal mobility or displacement' },
      { zh:'叩診有明顯觸痛', en:'Marked tenderness to percussion' },
      { zh:'敏感性測試通常為陽性', en:'Sensibility tests usually positive' },
      { zh:'影像上無異常', en:'No radiographic abnormalities' }
    ],
    imaging:[{ zh:'一張平行投影根尖片，加上不同角度的加照與咬合片', en:'One parallel periapical radiograph plus additional angulations and an occlusal view' }],
    treatment:[
      { zh:'不需要治療', en:'No treatment is needed' },
      { zh:'牙髓狀態至少追蹤一年，可以的話更久', en:'Monitor the pulp condition for at least one year, preferably longer' }
    ],
    splint:null,
    pulp:[{ zh:'不可因初診敏感性測試陰性就進行根管治療', en:'Do not start endodontic treatment solely because the initial sensibility test is negative' }],
    good:[
      { zh:'無症狀，敏感性測試陽性', en:'Asymptomatic, positive sensibility response' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'出現症狀、牙髓壞死與感染', en:'Symptomatic, pulp necrosis and infection' },
      { zh:'牙冠變色、根尖周圍炎', en:'Crown discoloration, apical periodontitis' }
    ]
  },
  followUp:[
    { d:28,  label:{ zh:'4 週', en:'4 wk' }, purpose:{ zh:'牙髓狀態、症狀是否緩解', en:'Pulp status, resolution of symptoms' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'牙髓狀態、變色、根尖變化', en:'Pulp status, discoloration, apical changes' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E2', certainty:{ zh:'預後證據中等、治療介入證據低', en:'Moderate for prognosis, low for intervention' } }
},

/* ---------- 10. 半脫位 ---------- */
{
  id:'p-subluxation', dentition:'permanent', group:'luxation',
  img:'dx/lux-subluxation.svg', source:'IADT-1 Table 10',
  name:{ zh:'半脫位', en:'Subluxation' },
  short:{ zh:'搖動度增加但沒有移位', en:'Increased mobility without displacement' },
  pub:{
    what:{ zh:'牙齒變鬆了，但位置沒有跑掉；牙齦溝可能會滲血。', en:'The tooth is loose but has not moved out of position; there may be bleeding from the gum margin.' },
    doNow:{ zh:'吃軟食、避免用這顆牙咬東西，保持清潔。大多數不需要把牙齒「推回去」。', en:'Soft diet, avoid biting on the tooth, keep it clean. There is usually nothing to reposition.' },
    dontDo:{ zh:'不要反覆搖它。', en:'Do not keep wiggling it.' },
    urgency:{ zh:'儘快牙科檢查。', en:'Dental examination as soon as possible.' }
  },
  clin:{
    criteria:[
      { zh:'搖動度增加，但牙齒沒有移位', en:'Increased mobility, but the tooth has not been displaced' },
      { zh:'牙齦溝可能出血', en:'Bleeding from the gingival sulcus may be present' },
      { zh:'叩診可能有觸痛', en:'May be tender to percussion' },
      { zh:'影像上通常無異常', en:'Usually no radiographic abnormalities' }
    ],
    imaging:[{ zh:'一張平行投影根尖片，加上不同角度的加照與咬合片', en:'One parallel periapical radiograph plus additional angulations and an occlusal view' }],
    treatment:[
      { zh:'一般不需要治療', en:'Normally no treatment is needed' },
      { zh:'只有在搖動度過大、或咬合時有明顯觸痛時，才用被動柔性固定裝置固定最多 2 週', en:'A passive flexible splint for up to 2 weeks may be used, but only if there is excessive mobility or tenderness on biting' },
      { zh:'牙髓狀態至少追蹤一年，可以的話更久', en:'Monitor the pulp condition for at least one year, preferably longer' }
    ],
    splint:{ zh:'被動柔性固定裝置最多 2 週，而且只在搖動度過大或咬合疼痛時才用——不是常規處置。', en:'Passive flexible splint for up to 2 weeks, and only when mobility is excessive or biting is tender — not a routine measure.' },
    pulp:[{ zh:'不可因初診敏感性測試陰性就進行根管治療', en:'Do not start endodontic treatment solely because the initial sensibility test is negative' }],
    good:[
      { zh:'無症狀，敏感性測試陽性', en:'Asymptomatic, positive sensibility response' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'牙髓壞死與感染、根尖周圍炎', en:'Pulp necrosis and infection, apical periodontitis' },
      { zh:'牙冠變色、發炎性吸收', en:'Crown discoloration, inflammatory resorption' }
    ]
  },
  followUp:[
    { d:14,  label:{ zh:'2 週', en:'2 wk' }, off:true, purpose:{ zh:'有固定裝置時於此時拆除；搖動度、牙髓狀態', en:'Remove the splint if one was placed; mobility and pulp status' } },
    { d:84,  label:{ zh:'12 週', en:'12 wk' }, purpose:{ zh:'牙髓狀態、搖動度、牙根吸收', en:'Pulp status, mobility, root resorption' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'同上', en:'As above' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'牙髓狀態、變色、根尖變化', en:'Pulp status, discoloration, apical changes' } }
  ],
  yearlyTo:null,
  evidence:{ g:true, e:'E2', certainty:{ zh:'低至中', en:'Low to moderate' } }
},

/* ---------- 11. 外突性脫位 ---------- */
{
  id:'p-extrusive-luxation', dentition:'permanent', group:'luxation',
  img:'dx/lux-extrusive.svg', source:'IADT-1 Table 11',
  name:{ zh:'外突性脫位', en:'Extrusive luxation' },
  short:{ zh:'牙齒沿長軸部分脫出齒槽窩', en:'Partial displacement of the tooth out of its socket along the long axis' },
  pub:{
    what:{ zh:'牙齒沿著牙根方向被拉出來一些，看起來比旁邊的牙齒長，而且很鬆。', en:'The tooth has been pulled partly out of its socket; it looks longer than the neighbouring teeth and is very loose.' },
    doNow:{ zh:'保持原狀，立刻就醫。需要由牙醫復位，不會自己回去。', en:'Leave it as it is and see a dentist at once. It needs to be repositioned by a dentist — it will not go back on its own.' },
    dontDo:{ zh:'不要自己壓回去。', en:'Do not push it back yourself.' },
    urgency:{ zh:'當日緊急處理。', en:'Same-day emergency care.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒沿長軸部分脫出齒槽窩', en:'Partial axial displacement of the tooth out of the socket' },
      { zh:'牙冠看起來變長，搖動度增加', en:'The crown appears elongated; mobility is increased' },
      { zh:'敏感性測試通常為陰性', en:'Sensibility tests are usually negative' },
      { zh:'影像上可見根尖側或側方牙周韌帶腔增寬', en:'Radiographs show an increased periodontal ligament space apically or laterally' }
    ],
    imaging:[{ zh:'一張平行投影根尖片，加上不同水平與垂直角度的加照與咬合片', en:'One parallel periapical radiograph plus different horizontal and vertical angulations and an occlusal view' }],
    treatment:[
      { zh:'局部麻醉下，輕輕把牙齒推回齒槽窩', en:'Under local anesthesia, gently push the tooth back into the socket' },
      { zh:'以被動柔性固定裝置固定 2 週；若有邊緣骨破壞或斷裂，再追加固定 4 週', en:'Stabilize with a passive flexible splint for 2 weeks; if there is breakdown or fracture of the marginal bone, splint for an additional 4 weeks' },
      { zh:'以敏感性測試持續追蹤牙髓狀態', en:'Monitor the pulp condition with sensibility tests' }
    ],
    splint:{ zh:'被動柔性固定裝置 2 週。合併邊緣骨破壞或斷裂時「再追加」4 週（合計約 6 週），不是延長到 4 週。', en:'Passive flexible splint for 2 weeks. With marginal bone breakdown or fracture, splint for an ADDITIONAL 4 weeks (about 6 weeks in total) — not "extended to" 4 weeks.' },
    pulp:[
      { zh:'不因初診敏感性測試陰性即進行根管治療', en:'Do not start endodontic treatment solely on an initial negative sensibility test' },
      { zh:'一旦牙髓壞死並感染，依牙根發育階段選擇適當的根管處置', en:'If the pulp becomes necrotic and infected, provide endodontic treatment appropriate to the stage of root development' }
    ],
    good:[
      { zh:'無症狀，牙齒回到正常位置', en:'Asymptomatic, tooth in its correct position' },
      { zh:'齒槽骨板完整，敏感性測試陽性', en:'Intact lamina dura, positive sensibility response' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'牙髓壞死與感染、根尖周圍炎', en:'Pulp necrosis and infection, apical periodontitis' },
      { zh:'發炎性吸收、取代性吸收與齒沾黏', en:'Inflammatory resorption; replacement resorption with ankylosis' },
      { zh:'邊緣齒槽骨流失', en:'Marginal bone loss' }
    ]
  },
  followUp:[
    { d:14,  label:{ zh:'2 週', en:'2 wk' }, off:true, purpose:{ zh:'拆除固定裝置；復位是否維持、牙髓狀態', en:'Splint removal; maintenance of position, pulp status' } },
    { d:28,  label:{ zh:'4 週', en:'4 wk' }, purpose:{ zh:'牙髓狀態、牙周癒合', en:'Pulp status, periodontal healing' } },
    { d:56,  label:{ zh:'8 週', en:'8 wk' }, purpose:{ zh:'牙髓壞死徵象、發炎性吸收', en:'Signs of pulp necrosis, inflammatory resorption' } },
    { d:84,  label:{ zh:'12 週', en:'12 wk' }, purpose:{ zh:'同上；邊緣骨高度', en:'As above; marginal bone level' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'牙髓、牙周、吸收', en:'Pulp, periodontium, resorption' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'整體評估', en:'Overall review' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E2', certainty:{ zh:'低至中', en:'Low to moderate' } }
},

/* ---------- 12. 側向脫位 ---------- */
{
  id:'p-lateral-luxation', dentition:'permanent', group:'luxation',
  img:'dx/lux-lateral.svg', source:'IADT-1 Table 12',
  name:{ zh:'側向脫位', en:'Lateral luxation' },
  short:{ zh:'非沿長軸的移位，常合併齒槽窩壁或唇側骨板斷裂', en:'Non-axial displacement, usually with fracture of the socket wall or labial cortical plate' },
  pub:{
    what:{ zh:'牙齒被撞歪向嘴唇側或舌側，而且常卡在破裂變形的骨頭裡，所以反而「不太會搖」。', en:'The tooth has been pushed sideways, and is often locked into fractured bone — which is why it may not feel loose at all.' },
    doNow:{ zh:'保持原狀，立刻就醫。', en:'Leave it as it is and see a dentist at once.' },
    dontDo:{ zh:'不要自己扳回來——牙齒卡在骨頭裡，硬扳會造成更多傷害。', en:'Do not try to force it back — it is locked in bone and forcing it causes further damage.' },
    urgency:{ zh:'當日緊急處理。', en:'Same-day emergency care.' }
  },
  clin:{
    criteria:[
      { zh:'非沿長軸的移位，常合併齒槽窩壁斷裂', en:'Non-axial displacement, commonly with a fracture of the socket wall' },
      { zh:'牙齒通常不動，因為根尖卡在骨內', en:'Usually immobile because the apex is locked in bone' },
      { zh:'叩診可能出現高音調的金屬聲', en:'Percussion may give a high metallic (ankylotic) sound' },
      { zh:'敏感性測試通常為陰性', en:'Sensibility tests are usually negative' }
    ],
    imaging:[{ zh:'一張平行投影根尖片，加上不同水平與垂直角度的加照與咬合片', en:'One parallel periapical radiograph plus different horizontal and vertical angulations and an occlusal view' }],
    treatment:[
      { zh:'局部麻醉下先把卡住的牙齒鬆開，再以手指輕輕復位', en:'Under local anesthesia, first disengage the tooth from its locked position, then reposition it gently with the fingers' },
      { zh:'方法：觸診牙齦定出根尖位置，一指由根尖端向下壓，另一指或拇指把牙齒推回齒槽窩', en:'Method: palpate the gingiva to locate the apex, push downwards over the apical end with one finger, then push the tooth back into the socket with another finger or the thumb' },
      { zh:'以被動柔性固定裝置固定 4 週；邊緣骨或齒槽窩壁有破壞或斷裂時可能需要更久', en:'Stabilize with a passive flexible splint for 4 weeks; additional splinting may be required if the marginal bone or socket wall is broken down or fractured' },
      { zh:'受傷後約 2 週進行牙髓評估', en:'Make an endodontic evaluation at about 2 weeks post-injury' }
    ],
    splint:{ zh:'被動柔性固定裝置 4 週；合併邊緣骨或齒槽窩壁斷裂時可能需要更久。', en:'Passive flexible splint for 4 weeks; longer if the marginal bone or socket wall is fractured.' },
    pulp:[
      { zh:'約 2 週做牙髓評估：牙根未發育完成者可能自行血管再生，不應預防性根管治療；一旦牙髓壞死並出現發炎性外吸收，應儘快開始根管治療，並採用適合未成熟牙的術式', en:'Endodontic evaluation at about 2 weeks. Immature teeth may revascularize spontaneously, so avoid prophylactic root canal treatment; if the pulp becomes necrotic with signs of inflammatory external resorption, start endodontic treatment as soon as possible using techniques suitable for immature teeth' },
      { zh:'牙根發育完成的成熟牙牙髓壞死機率高，通常較適合早期根管治療', en:'In mature teeth the likelihood of pulp necrosis is high, so early endodontic treatment is usually appropriate' }
    ],
    good:[
      { zh:'無症狀，牙齒回到正常位置', en:'Asymptomatic, tooth in its correct position' },
      { zh:'齒槽骨板完整', en:'Intact lamina dura' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'牙髓壞死與感染、根尖周圍炎', en:'Pulp necrosis and infection, apical periodontitis' },
      { zh:'發炎性吸收、齒沾黏與取代性吸收', en:'Inflammatory resorption; ankylosis with replacement resorption' },
      { zh:'牙齒卡住不動、叩診有齒沾黏音', en:'Tooth locked in place with an ankylotic percussion tone' }
    ]
  },
  followUp:[
    { d:14,  label:{ zh:'2 週', en:'2 wk' }, purpose:{ zh:'牙髓評估（此時決定是否開始根管治療）；復位是否維持', en:'Endodontic evaluation — the decision point for starting root canal treatment; maintenance of position' } },
    { d:28,  label:{ zh:'4 週', en:'4 wk' }, off:true, purpose:{ zh:'拆除固定裝置；牙周癒合', en:'Splint removal; periodontal healing' } },
    { d:56,  label:{ zh:'8 週', en:'8 wk' }, purpose:{ zh:'牙髓狀態、發炎性吸收', en:'Pulp status, inflammatory resorption' } },
    { d:84,  label:{ zh:'12 週', en:'12 wk' }, purpose:{ zh:'同上；邊緣骨高度', en:'As above; marginal bone level' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'牙髓與牙周癒合、吸收', en:'Pulpal and periodontal healing, resorption' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'整體評估', en:'Overall review' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E2', certainty:{ zh:'低至中', en:'Low to moderate' } }
},

/* ---------- 13. 內縮性脫位 ---------- */
{
  id:'p-intrusive-luxation', dentition:'permanent', group:'luxation',
  img:'dx/lux-intrusive.svg', source:'IADT-1 Table 13',
  name:{ zh:'內縮性脫位', en:'Intrusive luxation' },
  short:{ zh:'牙齒沿根尖方向被壓入齒槽骨', en:'Displacement of the tooth in an apical direction into the alveolar bone' },
  pub:{
    what:{ zh:'牙齒被撞進齒槽骨裡，看起來突然變短，甚至有一部分不見了。這是嚴重的脫位傷害。', en:'The tooth has been driven into the bone and suddenly looks shorter, or part of it has disappeared. This is a severe luxation injury.' },
    doNow:{ zh:'立刻由有牙外傷經驗的牙醫評估。處置方式會依牙根是否成熟與撞入深度而不同。', en:'Have it assessed immediately by a dentist experienced in dental trauma. Management depends on root maturity and the depth of intrusion.' },
    dontDo:{ zh:'不要自己想把牙齒拉出來。', en:'Do not try to pull the tooth back out.' },
    urgency:{ zh:'當日緊急處理。', en:'Same-day emergency care.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒沿長軸被壓入齒槽骨', en:'The tooth is displaced axially into the alveolar bone' },
      { zh:'牙齒不動', en:'The tooth is immobile' },
      { zh:'叩診出現高音調的金屬（齒沾黏）聲', en:'Percussion gives a high metallic (ankylotic) sound' },
      { zh:'敏感性測試多半沒有反應', en:'Likely to have no response to sensibility tests' },
      { zh:'牙周韌帶腔可能全部或部分（尤其根尖處）看不到', en:'The periodontal ligament space may not be visible for all or part of the root, especially apically' },
      { zh:'牙釉質牙骨質交界的位置比鄰近未受傷牙齒更靠根尖側', en:'The cemento-enamel junction sits more apically than in adjacent uninjured teeth' }
    ],
    imaging:[{ zh:'一張平行投影根尖片，加上不同水平與垂直角度的兩張加照，以及咬合片', en:'One parallel periapical radiograph, two additional views at different vertical and/or horizontal angulations, and an occlusal radiograph' }],
    treatment:[
      { zh:'牙根未發育完成（未成熟牙）：不論撞入深度，先讓牙齒自行再萌出，不介入', en:'Incomplete root formation (immature teeth): allow spontaneous re-eruption without intervention, regardless of the degree of intrusion' },
      { zh:'未成熟牙若 4 週內沒有再萌出，開始矯正復位', en:'In immature teeth, if there is no re-eruption within 4 weeks, initiate orthodontic repositioning' },
      { zh:'牙根發育完成（成熟牙）且撞入 <3 mm：先等待自行再萌出；8 週內沒有再萌出就手術復位並以被動柔性固定裝置固定 4 週，或在齒沾黏形成前改採矯正復位', en:'Complete root formation (mature teeth) intruded less than 3 mm: allow re-eruption; if none within 8 weeks, reposition surgically and splint for 4 weeks with a passive flexible splint, or reposition orthodontically before ankylosis develops' },
      { zh:'成熟牙撞入 3–7 mm：手術復位（首選）或矯正復位', en:'Mature teeth intruded 3–7 mm: reposition surgically (preferably) or orthodontically' },
      { zh:'成熟牙撞入 >7 mm：手術復位', en:'Mature teeth intruded beyond 7 mm: reposition surgically' }
    ],
    splint:{ zh:'手術復位後以被動柔性固定裝置固定 4 週。（注意：坊間整理常誤寫成 2 週，IADT 原文是 4 週。）', en:'Passive flexible splint for 4 weeks after surgical repositioning. (Note: secondary summaries often state 2 weeks; the IADT text says 4 weeks.)' },
    pulp:[
      { zh:'未成熟牙可能自行血管再生，應監測；一旦牙髓壞死並感染，或出現發炎性外吸收，就儘快在牙齒位置允許時開始根管治療，採用適合未成熟牙的術式', en:'Immature teeth may revascularize spontaneously and should be monitored; if the pulp becomes necrotic and infected, or inflammatory external resorption appears, begin endodontic treatment as soon as the tooth’s position allows, using techniques suitable for immature teeth' },
      { zh:'成熟牙牙髓幾乎一定壞死：根管治療應在約 2 週、或牙齒位置一允許操作時就開始，以皮質類固醇加抗生素或氫氧化鈣作為根管內藥劑，目的是預防發炎性外吸收', en:'In mature teeth the pulp almost always becomes necrotic: start root canal treatment at about 2 weeks, or as soon as the tooth’s position allows, using a corticosteroid-antibiotic or calcium hydroxide intracanal medication to prevent inflammatory external resorption' }
    ],
    good:[
      { zh:'無症狀，牙齒就位或正在再萌出', en:'Asymptomatic; tooth in place or re-erupting' },
      { zh:'齒槽骨板完整、無牙根吸收', en:'Intact lamina dura, no root resorption' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'牙齒卡住不動、叩診有齒沾黏音', en:'Tooth locked in place with an ankylotic percussion tone' },
      { zh:'牙髓壞死與感染、根尖周圍炎', en:'Pulp necrosis and infection, apical periodontitis' },
      { zh:'齒沾黏與取代性吸收', en:'Ankylosis and external replacement resorption' },
      { zh:'發炎性外吸收——一旦出現就應立即開始根管治療，以氫氧化鈣作為根管內藥劑', en:'External inflammatory resorption — start root canal treatment immediately with calcium hydroxide as the intracanal medicament' }
    ]
  },
  followUp:[
    { d:14,  label:{ zh:'2 週', en:'2 wk' }, purpose:{ zh:'成熟牙於此時開始根管治療；再萌出進度', en:'Start root canal treatment in mature teeth; assess re-eruption' } },
    { d:28,  label:{ zh:'4 週', en:'4 wk' }, off:true, purpose:{ zh:'手術復位者拆除固定裝置；未成熟牙若無再萌出則開始矯正復位', en:'Splint removal after surgical repositioning; in immature teeth start orthodontic repositioning if no re-eruption' } },
    { d:56,  label:{ zh:'8 週', en:'8 wk' }, purpose:{ zh:'成熟牙 <3 mm 若仍無再萌出，此時決定手術或矯正復位', en:'For mature teeth intruded <3 mm with no re-eruption, decide on surgical or orthodontic repositioning' } },
    { d:84,  label:{ zh:'12 週', en:'12 wk' }, purpose:{ zh:'齒沾黏、取代性吸收、牙髓狀態', en:'Ankylosis, replacement resorption, pulp status' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'同上；邊緣骨高度', en:'As above; marginal bone level' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'整體評估；兒童注意咬合過低', en:'Overall review; watch for infraocclusion in growing patients' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E2', certainty:{ zh:'預後證據中等；復位方式的比較證據低', en:'Moderate for prognosis; low for comparing repositioning methods' } }
},

/* ---------- 14. 脫落 ---------- */
{
  id:'p-avulsion', dentition:'permanent', group:'avulsion',
  img:'dx/avulsion.svg', source:'IADT-2',
  name:{ zh:'脫落', en:'Avulsion' },
  short:{ zh:'整顆牙齒完全離開齒槽窩——牙科少數真正的急症', en:'The tooth is completely out of its socket — one of the few true emergencies in dentistry' },
  timeCritical:true,
  pub:{
    what:{ zh:'整顆恆牙離開了齒槽窩。這是牙科少數真正以分鐘計算的急症：牙根表面的牙周韌帶細胞會隨著乾燥時間流失。', en:'A whole permanent tooth is out of its socket. This is one of the few dental emergencies measured in minutes — the PDL cells on the root surface die as the root dries.' },
    doNow:{ zh:'①保持冷靜 ②找到牙齒，只捏白色的牙冠 ③髒的話用牛奶、生理食鹽水或病人的唾液輕輕沖一下 ④立刻放回原本的位置，咬住紗布固定 ⑤沒辦法放回去就立刻泡進保存液（依序：牛奶、HBSS、唾液、生理食鹽水）⑥立刻就醫。', en:'1) Keep calm. 2) Find the tooth and pick it up by the white crown only. 3) If dirty, rinse briefly in milk, saline or the patient’s saliva. 4) Replant it immediately and have the patient bite on gauze. 5) If replantation is not possible, place it at once in a storage medium (in order: milk, HBSS, saliva, saline). 6) Get to a dentist immediately.' },
    dontDo:{ zh:'不要碰牙根、不要刷或刮牙根、不要消毒、不要讓牙根乾掉、不要長時間泡自來水。乳牙不可以放回去。', en:'Do not touch the root, do not scrub or scrape it, do not disinfect it, do not let it dry, and do not store it in tap water. Never replant a primary tooth.' },
    urgency:{ zh:'立刻——以分鐘計算。', en:'Immediately — minutes matter.' }
  },
  clin:{
    criteria:[
      { zh:'牙齒完全脫離齒槽窩', en:'The tooth is completely displaced out of its socket' },
      { zh:'必須記錄：牙根成熟度、是否已在現場再植、口外乾燥時間、保存液', en:'Record: root maturity, whether it was replanted at the scene, extra-oral dry time, and the storage medium' },
      { zh:'找不到牙齒時要排除撞入、嵌在軟組織、吞入或吸入', en:'If the tooth cannot be found, exclude intrusion, soft tissue embedding, ingestion and aspiration' }
    ],
    imaging:[{ zh:'再植後以影像確認位置；懷疑齒槽窩壁斷裂時加照', en:'Verify the position radiographically after replantation; additional views if a socket wall fracture is suspected' }],
    treatment:[
      { zh:'清除牙根表面鬆脫的碎屑與可見污染：在保存液中輕輕晃動，或用浸過生理食鹽水的紗布', en:'Remove loose debris and visible contamination by agitating the tooth in a physiologic storage medium or with saline-soaked gauze' },
      { zh:'局部麻醉，盡量不含血管收縮劑', en:'Administer local anesthesia, preferably without a vasoconstrictor' },
      { zh:'以無菌生理食鹽水沖洗齒槽窩，檢查齒槽窩，必要時移除血塊；齒槽窩壁有斷裂時以適當器械復位', en:'Irrigate the socket with sterile saline, examine it, remove the coagulum if necessary, and reposition any fractured socket wall with a suitable instrument' },
      { zh:'以輕微指壓緩慢再植，不可硬推回去', en:'Replant slowly with slight digital pressure — the tooth must not be forced back into place' },
      { zh:'以臨床與影像確認再植後的位置', en:'Verify the correct position both clinically and radiographically' },
      { zh:'以被動柔性固定裝置固定 2 週；合併齒槽骨或顎骨斷裂時採較剛性的固定約 4 週', en:'Stabilize with a passive flexible splint for 2 weeks; with an associated alveolar or jaw fracture, use more rigid stabilization for about 4 weeks' }
    ],
    splint:{ zh:'被動柔性固定裝置 2 週。合併齒槽骨或顎骨斷裂時改用較剛性的固定約 4 週。', en:'Passive flexible splint for 2 weeks; more rigid stabilization for about 4 weeks with an associated alveolar or jaw fracture.' },
    pulp:[
      { zh:'根尖閉鎖（成熟牙）：根管治療應在再植後 2 週內開始。氫氧化鈣作為根管內藥劑最多放置 1 個月後再封填；若選用皮質類固醇或皮質類固醇加抗生素的抗發炎、抗吸收藥劑，應在再植後立即或很快放入，並停留至少 6 週。', en:'Closed apex: start root canal treatment within 2 weeks of replantation. Calcium hydroxide is recommended as an intracanal medicament for up to 1 month before filling; if a corticosteroid or corticosteroid-antibiotic anti-inflammatory and anti-resorptive medicament is chosen, place it immediately or shortly after replantation and leave it in situ for at least 6 weeks.' },
      { zh:'根尖開放（未成熟牙）：可能自行血管再生，因此不可預防性做根管治療。只有在追蹤時出現牙髓壞死與根管系統感染的臨床或影像證據時才治療。兒童的發炎性吸收進展非常快，要把「等待血管再生的機會」與「發炎性吸收的風險」放在一起權衡。', en:'Open apex: spontaneous revascularization may occur, so root canal treatment must be avoided unless follow-up shows clinical or radiographic evidence of pulp necrosis and canal infection. Inflammatory resorption progresses very rapidly in children, so weigh that risk against the chance of revascularization.' },
      { zh:'根管治療一律在橡皮障隔離下進行；橡皮障夾可夾在鄰近未受傷的牙齒上，避免再次傷害患牙。藥劑要小心放置在根管系統內，避免進入牙冠——部分藥劑會造成變色。', en:'Always treat under rubber dam isolation; place the clamp on neighbouring uninjured teeth to avoid further trauma to the injured tooth. Apply medicaments carefully within the canal and keep them out of the crown — some cause discoloration.' }
    ],
    good:[
      { zh:'無症狀，牙齒功能正常、搖動度正常', en:'Asymptomatic, normal function and mobility' },
      { zh:'叩診音正常，影像上牙周韌帶腔正常', en:'Normal percussion tone; normal periodontal ligament space radiographically' },
      { zh:'未成熟牙持續進行牙根發育', en:'Continued root development in immature teeth' }
    ],
    bad:[
      { zh:'發炎性（感染相關）吸收——牙根圓周任何位置出現牙根或骨的吸收都要當作發炎性吸收', en:'Infection-related (inflammatory) resorption — any root or bone resorption anywhere around the circumference of the root should be read as inflammatory resorption' },
      { zh:'齒沾黏與取代性吸收——影像上牙周韌帶腔消失、牙根被骨取代，加上叩診金屬聲', en:'Ankylosis-related (replacement) resorption — loss of the periodontal ligament space, replacement of root structure by bone, with a metallic percussion sound' },
      { zh:'兩種吸收可能同時存在', en:'The two types of resorption may occur together' },
      { zh:'生長中的兒童出現進行性咬合過低，可能需要考慮去冠術、自體移植等多科策略', en:'Progressive infraocclusion in a growing child may call for multidisciplinary strategies such as decoronation or autotransplantation' }
    ]
  },
  followUp:[
    { d:14,  label:{ zh:'2 週', en:'2 wk' }, off:true, purpose:{ zh:'拆除固定裝置；成熟牙根管治療應已開始', en:'Splint removal; root canal treatment should already have been started in mature teeth' } },
    { d:28,  label:{ zh:'4 週', en:'4 wk' }, purpose:{ zh:'發炎性吸收、牙周癒合', en:'Inflammatory resorption, periodontal healing' } },
    { d:90,  label:{ zh:'3 個月', en:'3 mo' }, purpose:{ zh:'吸收與齒沾黏', en:'Resorption and ankylosis' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'同上', en:'As above' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'吸收、齒沾黏、咬合過低', en:'Resorption, ankylosis, infraocclusion' } }
  ],
  // 根尖開放者因發炎性吸收進展快，IADT 要求更密集的追蹤
  followUpOpenApex:[
    { d:14,  label:{ zh:'2 週', en:'2 wk' }, off:true, purpose:{ zh:'拆除固定裝置', en:'Splint removal' } },
    { d:30,  label:{ zh:'1 個月', en:'1 mo' }, purpose:{ zh:'血管再生跡象、發炎性吸收', en:'Signs of revascularization, inflammatory resorption' } },
    { d:60,  label:{ zh:'2 個月', en:'2 mo' }, purpose:{ zh:'同上', en:'As above' } },
    { d:90,  label:{ zh:'3 個月', en:'3 mo' }, purpose:{ zh:'牙根持續發育、吸收', en:'Continued root development, resorption' } },
    { d:180, label:{ zh:'6 個月', en:'6 mo' }, purpose:{ zh:'同上', en:'As above' } },
    { d:365, label:{ zh:'1 年', en:'1 y' }, purpose:{ zh:'整體評估', en:'Overall review' } }
  ],
  yearlyTo:5,
  evidence:{ g:true, e:'E1／E2／E3 混合', certainty:{ zh:'依問題而異：固定天數有系統性回顧（E1），時間與保存液的預後主要來自長期觀察性研究（E2/E3）', en:'Varies by question: splinting duration is supported by a systematic review (E1), while timing and storage medium prognosis rests mainly on long-term observational studies (E2/E3)' } }
}

];
