/**
 * spirits.js —— 九只精灵的相遇与羁绊（PRD §2.4.3 / §3.5.3）
 * 条件触发（季节/昼夜/天气/区域）；相遇录图鉴，事件成羁绊。
 * 场景内精灵贴图动态渲染（hookScene 由 farm.js 的 scene:entered 统一挂载）。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  /** 精灵在场景中的出现位置（渲染 + 走位交互）：羁绊完成后退场，未羁绊的常驻等玩家凑材料 */
  function activeSpirits() {
    if (!WV.state) return [];
    const si = WV.seasonIdx();
    const night = WV.Light.phaseIdx() === 3;
    const def = WV.Scene.def;
    if (!def) return [];
    const list = [];
    Object.keys(WV.DATA.spirits).forEach(function (id) {
      const sp = WV.DATA.spirits[id];
      if (sp.where !== WV.Scene.key) return;
      const lv = WV.state.journal.spirits[id] || 0;
      if (lv >= 2 && id !== 'dingdang') return; // 羁绊完成后退场（叮当作伙伴常驻屋檐）
      // 叮当有主线剧情锁：第 3 天引导事件之前不在屋檐定点出现（避免与剧情台词冲突）
      if (id === 'dingdang' && WV.state.day < 3) return;
      if (sp.season !== undefined && sp.season !== si) return;
      if (sp.night && !night) return;
      list.push({ id: id, x: sp.x, y: sp.y, lv: lv });
    });
    return list;
  }

  /** 场景动态渲染精灵（未相遇=若隐若现；已相遇未羁绊=常驻微光；已羁绊退场——叮当由场景静态贴图表现，避免重复渲染） */
  function drawSpirits(ctx) {
    activeSpirits().forEach(function (sp) {
      if (sp.lv >= 2) return;
      const img = WV.Assets.img(`assets/sprites/spirits/${id2code(sp.id)}_0.png`);
      if (!img.complete || !img.naturalWidth) return;
      const t = (Date.now() % 1600) / 1600;
      const alpha = sp.lv >= 1 ? 0.9 : 0.55 + 0.45 * Math.sin(t * Math.PI * 2);
      ctx.globalAlpha = alpha;
      const fw = img.width;
      ctx.drawImage(img, Math.round(sp.x - fw / 2), Math.round(sp.y - fw + Math.sin(t * 6.28) * 2));
      ctx.globalAlpha = 1;
      // 已相遇未羁绊：头顶小提示（等玩家带材料来）
      if (sp.lv === 1 && WV.DATA.spirits[sp.id].bond && WV.DATA.spirits[sp.id].bond.item) {
        ctx.fillStyle = `rgba(242,206,126,${0.5 + 0.5 * Math.sin(t * 6.28)})`;
        ctx.fillRect(Math.round(sp.x - 1), Math.round(sp.y - fw - 8), 3, 3);
      }
    });
  }

  function id2code(id) {
    const sp = WV.DATA.spirits[id];
    return sp ? sp.code : id;
  }

  /** 点击精灵 → 走位过去：先执行同位置采集热点（橡果树/月见草等与精灵重叠），再演精灵交互 */
  WV.on('input:click', function (p) {
    if (WV.Dialogue.busy() || !WV.state || WV.state.freeze) return;
    const hits = activeSpirits().filter(function (sp) { return Math.hypot(sp.x - p.x, sp.y - p.y) < 20; });
    if (!hits.length) return;
    const hit = hits[0];
    const sp = WV.DATA.spirits[hit.id];
    WV.Scene.walkTo(hit.x, hit.y, function () {
      // 同位置采集热点先执行（材料是精灵羁绊的前置，不能被截胡）
      (WV.Scene.def.hotspots || []).forEach(function (h) {
        if (!h.action || /^goto_|^npc_|^plot_/.test(h.action)) return;
        if (Math.hypot(h.x - hit.x, h.y - hit.y) < 26) {
          WV.emit('hotspot:action', { hotspot: h, def: WV.Scene.def });
        }
      });
      if (hit.lv === 0) {
        // 首次相遇：相遇对话 → 自动接羁绊判定
        WV.state.freeze = true;
        WV.Dialogue.say(sp.meet.map(function (t) { return { speaker: t[0], text: t[1] }; }).concat([{
          speaker: '', text: `（${sp.name} 加入了精灵图鉴）`,
          cb: function () {
            WV.state.freeze = false;
            WV.S.Journal.spiritMet(hit.id);
            runBond(hit.id);
          },
        }]));
      } else if (hit.lv === 1) {
        runBond(hit.id);   // 已相遇：直接补羁绊（材料足够则自动扣除并登记）
      } else if (hit.id === 'dingdang') {
        WV.Dialogue.say([{ speaker: '叮当', text: '叮铃～今天也一起加油吧！' }]);
      }
    });
  });

  /** 相遇后的羁绊事件：物品型（材料够自动扣除）/ 直接型 */
  function runBond(id) {
    const sp = WV.DATA.spirits[id];
    if (!sp.bond) return;
    if (sp.bond.item) {
      const have = WV.S.Inv.count(sp.bond.item);
      if (have >= sp.bond.n) {
        WV.state.freeze = true;
        WV.Dialogue.say([{
          speaker: sp.name, text: sp.bond.say,
          cb: function () {
            WV.S.Inv.remove(sp.bond.item, sp.bond.n);
            WV.S.Journal.spiritBond(id);
            WV.state.freeze = false;
          },
        }]);
      } else {
        const need = sp.bond.n - have;
        const iname = (WV.DATA.items[sp.bond.item] || {}).name || '它喜欢的东西';
        WV.S.UI.toast(`${sp.name}还在等 ${iname}×${sp.bond.n}（还差 ${need} 个）——凑齐后再来找它吧`);
      }
      return;
    }
    WV.state.freeze = true;
    WV.Dialogue.say([{ speaker: sp.name, text: sp.bond.say, cb: function () {
      WV.S.Journal.spiritBond(id);
      WV.state.freeze = false;
    } }]);
  }

  /** 精灵羁绊重试入口（背包里凑齐物品后点击图鉴/再遇） */
  S.retryBond = runBond;

  function hookScene() {
    WV.Scene.onDraw(drawSpirits);
    hintSeasonal();
  }

  /** 进入场景时提示"这里有限定精灵但时机未到"（解决玩家"没反应"的困惑） */
  const hintLast = {};
  function hintSeasonal() {
    if (!WV.state) return;
    const si = WV.seasonIdx();
    const night = WV.Light.phaseIdx() === 3;
    Object.keys(WV.DATA.spirits).forEach(function (id) {
      const sp = WV.DATA.spirits[id];
      if (sp.where !== WV.Scene.key) return;
      if (WV.state.journal.spirits[id]) return;
      const key = id + '_' + WV.Scene.key;
      if (hintLast[key] && Date.now() - hintLast[key] < 6000) return;   // 防重
      const seasonNames = ['春天', '夏天', '秋天', '冬天'];
      if (sp.season !== undefined && sp.season !== si) {
        hintLast[key] = Date.now();
        WV.S.UI.toast(`这里似乎有${sp.name}的气息……要等${seasonNames[sp.season]}才见得到`);
      } else if (sp.night && !night) {
        hintLast[key] = Date.now();
        WV.S.UI.toast(`${sp.name}好像只在夜里出现……等天黑了再来吧`);
      }
    });
  }

  /** 本季还有几只可遇（guide.js 小贴士用，PRD §3.5.3） */
  function seasonalLeft() {
    const si = WV.seasonIdx();
    let n = 0;
    Object.keys(WV.DATA.spirits).forEach(function (id) {
      const sp = WV.DATA.spirits[id];
      if (sp.season === si && !WV.state.journal.spirits[id]) n++;
    });
    return n;
  }

  S.hookScene = hookScene;
  S.seasonalLeft = seasonalLeft;
  S.active = activeSpirits;
  WV.S.Spirits = S;
})();
