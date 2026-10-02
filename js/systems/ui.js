/**
 * ui.js —— DOM UI 层：HUD / 面板全家桶 / 热点动作总路由
 * Canvas 画场景，DOM 画 UI（中文排版最优，见计划约束 3）。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};
  let panelOpen = false;
  let placing = null;   // P0 修复：装修摆放选中项（翻转模式重写时丢失声明导致 ReferenceError）

  // ---------- 基础 ----------
  function toast(msg) {
    const wrap = document.getElementById('toast-wrap');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () { t.remove(); }, 2700);
  }

  function panel(html) {
    panelOpen = true;
    const p = document.getElementById('panel');
    document.getElementById('panel-card').innerHTML = html;
    p.classList.remove('hidden');
  }
  function closePanel() {
    panelOpen = false;
    document.getElementById('panel').classList.add('hidden');
    // 睡前面板被 Esc/B 旁路关闭时，走取消回调恢复 freeze（不依赖看门狗）
    if (curSleep && curSleep.onCancel) { const c = curSleep; curSleep = null; c.onCancel(); }
    curSleep = null;
  }
  function isPanelOpen() { return panelOpen; }

  function refreshHud() {
    if (!WV.state) return;
    document.getElementById('hud-date').textContent = WV.S.Time.dayLabel();
    document.getElementById('hud-weather').textContent = WV.S.Time.weatherLabel();
    document.getElementById('hud-gold').textContent = WV.state.gold;
    const e = WV.state.energy, max = WV.CONST.MAX_ENERGY;
    let h = '';
    for (let i = 0; i < max; i++) h += `<span class="dot${i < e ? '' : ' off'}"></span>`;
    const box = document.getElementById('hud-energy');
    box.innerHTML = h;   // 🍒 图标由 HUD 模板提供，此处只画体力点
    // 本季限定精灵进度（常显；全年型不占本季计数，避免"春季凑铃音"的误导）
    const si = WV.seasonIdx();
    const seasonal = Object.keys(WV.DATA.spirits).filter(function (id) {
      return WV.DATA.spirits[id].season === si;
    });
    const met = seasonal.filter(function (id) { return WV.state.journal.spirits[id]; }).length;
    const spiritChip = document.getElementById('hud-spirit');
    const seasonNames = ['春', '夏', '秋', '冬'];
    spiritChip.textContent = seasonal.length === 0 ? '🔔 本季无限定' :
      (met >= seasonal.length ? `🔔 ${seasonNames[si]}季精灵集齐` : `🔔 ${seasonNames[si]}季限定 ${met}/${seasonal.length}`);
    WV.S.Guide.refreshTip();
  }
  WV.on('hud:refresh', refreshHud);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function furnImg(id) { return `assets/sprites/furniture/${id}.png`; }
  function itemIcon(id) {
    const def = WV.DATA.items[id] || {};
    return def.icon ? `assets/sprites/items/${def.icon}.png` : 'assets/ui/icons/icon_bag.png';
  }

  // ---------- 背包 ----------
  const TABS = [['c', '作物'], ['m', '素材'], ['d', '料理'], ['k', '珍贵之物']];
  function bagPanel(tab) {
    tab = tab || 'c';
    let cells = '';
    WV.S.Inv.list(tab).forEach(function (it) {
      const def = it.def || {};
      cells += `<div class="cell" title="${esc(def.desc || '')}">
        <img src="${itemIcon(it.id)}"><div class="cn">${esc(WV.itemName(it.id))}</div><div class="cs">×${it.n}</div>
      </div>`;
    });
    if (!cells) cells = '<p class="desc" style="grid-column:1/-1;text-align:center;padding:20px">空空的……去田园和森林看看吧</p>';
    const tabs = TABS.map(function (t) { return `<button class="tab ${t[0] === tab ? 'active' : ''}" onclick="WV.S.UI.bagPanel('${t[0]}')">${t[1]}</button>`; }).join('');
    panel(`
      <div class="panel-title">🎒 背包 <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <div class="tabs">${tabs}</div>
      <div class="grid">${cells}</div>
    `);
  }

  // ---------- 手账（四册图鉴） ----------
  const BOOKS = [['spirits', '精灵图鉴', 9], ['dishes', '料理食谱', 16], ['furniture', '家具图鉴', 25], ['memories', '回忆相册', 12]];
  function journalPanel(book) {
    book = book || 'spirits';
    let body = '';
    if (book === 'spirits') {
      Object.keys(WV.DATA.spirits).forEach(function (id) {
        const sp = WV.DATA.spirits[id];
        const lv = WV.state.journal.spirits[id] || 0;
        const canBond = lv === 1 && sp.bond;   // 已相遇未羁绊 → 点击可补结羁绊（先关面板再演对话）
        body += `<div class="cell ${lv ? '' : 'locked'}" ${canBond ? `onclick="WV.S.UI.closePanel();WV.S.Spirits.retryBond('${id}')"` : ''} title="${esc(lv ? sp.desc : '……还没有遇见')}">
          <img src="assets/sprites/spirits/${sp.code}_0.png" style="width:30px;height:30px">
          <div class="cn">${lv ? esc(sp.name) : '？？？'}</div>
          <div class="cs">${lv >= 2 ? '🔔🔔 羁绊' : (canBond ? '🔔 点击补结羁绊' : '🔔 相遇')}</div>
        </div>`;
      });
    } else if (book === 'dishes') {
      Object.keys(WV.DATA.recipes).forEach(function (id) {
        const r = WV.DATA.recipes[id];
        const got = WV.state.journal.dishes && WV.state.journal.dishes[id];
        body += `<div class="cell ${got ? '' : 'locked'}" title="${esc(r.desc || '')}">
          <img src="assets/ui/icons/icon_food.png"><div class="cn">${got ? esc(r.name) : '未解锁'}</div>
          <div class="cs">${got ? '制作过' : '—'}</div>
        </div>`;
      });
    } else if (book === 'furniture') {
      Object.keys(WV.DATA.furniture).forEach(function (id) {
        const f = WV.DATA.furniture[id];
        const got = WV.state.journal.furniture[id];
        body += `<div class="cell ${got ? '' : 'locked'}">
          <img src="${furnImg(id)}"><div class="cn">${got ? esc(f.name) : '未拥有'}</div>
          <div class="cs">舒适 +${f.comfort}</div>
        </div>`;
      });
    } else {
      for (let i = 1; i <= 12; i++) {
        const got = WV.state.journal.memories.indexOf(i) >= 0;
        const m = WV.DATA.memories[i] || {};
        body += `<div class="cell ${got ? '' : 'locked'}" onclick="${got ? `WV.S.UI.memoryView(${i})` : ''}">
          <img src="assets/ui/icons/icon_book.png"><div class="cn">${got ? esc(m.title) : '???'}</div><div class="cs">${got ? '点开重读' : ''}</div>
        </div>`;
      }
    }
    const tabs = BOOKS.map(function (b) {
      const got = b[0] === 'spirits' ? Object.keys(WV.state.journal.spirits).length :
                  b[0] === 'dishes' ? Object.keys(WV.state.journal.dishes || {}).length :
                  b[0] === 'furniture' ? Object.keys(WV.state.journal.furniture || {}).length :
                  WV.state.journal.memories.length;
      return `<button class="tab ${b[0] === book ? 'active' : ''}" onclick="WV.S.UI.journalPanel('${b[0]}')">${b[1]} ${got}/${b[2]}</button>`;
    }).join('');
    panel(`
      <div class="panel-title">📖 手账 <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <div class="tabs">${tabs}</div>
      <div class="grid">${body}</div>
    `);
  }
  function memoryView(no) {
    const m = WV.DATA.memories[no];
    document.getElementById('memory-title').textContent = `回忆 · ${m.title}`;
    document.getElementById('memory-text').textContent = m.text;
    document.getElementById('memory').classList.remove('hidden');
    document.getElementById('memory-ok').onclick = function () { document.getElementById('memory').classList.add('hidden'); };
  }

  // ---------- 商店 ----------
  function shopPanel(shopId) {
    const shop = WV.DATA.shops[shopId];
    if (!shop) return;
    const owner = WV.DATA.npcs[shop.owner] || { name: '店主' };
    let rows = '';
    shop.goods.forEach(function (g) {
      const id = g[0], price = g[1];
      const def = WV.DATA.items[id] || {};
      const stockNote = g[2] ? `（${g[2]}）` : '';
      rows += `<div class="row-line">
        <span><img src="${itemIcon(id)}" style="width:24px;vertical-align:-6px;image-rendering:pixelated"> ${esc(WV.itemName(id))} ${stockNote}</span>
        <span><span class="price">${price} 🪙</span>
        <button class="btn-act" onclick="WV.S.UI.buy('${id}', ${price}, '${shopId}')">买</button></span>
      </div>`;
    });
    panel(`
      <div class="panel-title">${shop.name} · ${esc(owner.name)} <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <p class="desc" style="margin-bottom:10px">${esc((shop.greet || '').replace('{SEASON}', WV.S.Time.seasonName()))}</p>
      ${rows}
      <div class="panel-title" style="margin-top:16px;font-size:16px">🧺 收购筐 <span style="font-size:12px;color:#8A7B66">卖掉不需要的东西</span></div>
      <div id="sell-list"></div>
    `);
    renderSellList();
  }

  function buy(id, price, shopId) {
    if (!WV.S.Eco.pay(price)) return;
    WV.S.Inv.add(id, 1);
    if (id.indexOf('_seed') >= 0) WV.emit('guide:seedBought');
    WV.Audio.playSfx('sfx_confirm');
    refreshHud();
    renderSellList();   // 同面板内即时可卖刚买的物品
  }

  function renderSellList() {
    const box = document.getElementById('sell-list');
    if (!box) return;
    let rows = '';
    [['c', '作物'], ['m', '素材'], ['d', '料理']].forEach(function (pair) {
      WV.S.Inv.list(pair[0]).forEach(function (it) {
        const sell = sellPrice(it.id);
        if (!sell) return;
        rows += `<div class="row-line">
          <span>${esc(WV.itemName(it.id))} ×${it.n}</span>
          <span><span class="price">${sell} 🪙</span> <button class="btn-act" onclick="WV.S.UI.sell('${it.id}', ${sell})">卖 1</button></span>
        </div>`;
      });
    });
    box.innerHTML = rows || '<p class="desc">（没有可出售的东西）</p>';
  }
  function sellPrice(id) {
    if (id[0] === 'k') return 0; // 珍贵之物不可售
    if (id[0] === 'd') return (WV.DATA.recipes[id.slice(2)] || {}).price || 0;
    // 种子按半价回收（防「买原价卖成品价」的套利，P0 修复）
    if (/^c_.*_seed$/.test(id)) return (WV.DATA.items[id] || {}).sellPrice || 0;
    if (id[0] === 'c') return (WV.DATA.crops[id.slice(2)] || {}).sellPrice || 0;
    return (WV.DATA.items[id] || {}).sellPrice || 5;
  }
  function sell(id, price) {
    if (!WV.S.Inv.remove(id, 1)) return;
    WV.S.Eco.earn(price, WV.Scene.heroine.x, WV.Scene.heroine.y);
    refreshHud();
    renderSellList();
  }

  // ---------- 料理 ----------
  function cookPanel() {
    let rows = '';
    Object.keys(WV.DATA.recipes).forEach(function (id) {
      const r = WV.DATA.recipes[id];
      const unlocked = WV.state.recipes.indexOf(id) >= 0;
      if (!unlocked) {
        rows += `<div class="row-line" style="opacity:.5"><span>🔒 ???（尚未学会的食谱）</span><span></span></div>`;
        return;
      }
      const mats = r.materials.map(function (m) {
        const have = WV.S.Inv.count(m[0]);
        return `<span style="color:${have >= m[1] ? '#6F9159' : '#BE7E8F'}">${esc((WV.DATA.items[m[0]] || {}).name || m[0])} ${have}/${m[1]}</span>`;
      }).join('　');
      rows += `<div class="row-line">
        <span>${esc(r.name)}<br><small>${mats}</small></span>
        <button class="btn-act primary" ${WV.S.Cook.canMake(id) ? '' : 'disabled'} onclick="WV.S.Cook.make('${id}')">制作</button>
      </div>`;
    });
    panel(`
      <div class="panel-title">🍲 料理（消耗 1 体力） <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      ${rows}
    `);
  }

  // ---------- 农田 ----------
  function farmPanel() {
    const P = WV.S.Farm.PLOT_POS;
    let cells = '';
    WV.state.plots.forEach(function (p, i) {
      let inner = '', act = '';
      if (!p.unlocked) {
        inner = `<img src="assets/ui/icons/icon_bag.png" style="opacity:.4"><div class="cn">开垦<br>${WV.CONST.PLOT_PRICE}🪙</div>`;
        act = `WV.S.Farm.unlock(${i})`;
      } else if (p.state === 'wild') {
        inner = `<div class="cn">荒地</div><div class="cs">翻土 · 1体力</div>`;
        act = `WV.S.Farm.till(${i})`;
      } else if (p.state === 'tilled') {
        inner = `<div class="cn">翻好的土</div><div class="cs">点此播种</div>`;
        act = `WV.S.UI.seedPicker(${i})`;
      } else if (p.state === 'planted') {
        const crop = WV.DATA.crops[p.crop];
        inner = `<img src="assets/sprites/crops/${p.crop}_${Math.min(5, p.growth)}.png"><div class="cs">${esc(crop.name)} ${p.dormant ? '（休眠）' : (p.watered ? '已浇水' : '待浇水')}</div>`;
        act = p.watered ? '' : `WV.S.Farm.water(${i})`;
      } else {
        inner = `<img src="assets/sprites/crops/${p.crop}_5.png"><div class="cs">✨ 成熟！收获</div>`;
        act = `WV.S.Farm.harvest(${i})`;
      }
      cells += `<div class="cell" ${act ? `onclick="${act}"` : 'style="cursor:default"'}>${inner}</div>`;
    });
    panel(`
      <div class="panel-title">🌾 田园（12 块田） <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <div class="grid" style="grid-template-columns:repeat(4,1fr)">${cells}</div>
    `);
  }

  function seedPicker(i) {
    const si = WV.seasonIdx();
    let cells = '';
    Object.keys(WV.DATA.crops).forEach(function (cid) {
      const c = WV.DATA.crops[cid];
      if (c.season !== si) return;
      const seedId = 'c_' + cid + '_seed';
      const n = WV.S.Inv.count(seedId);
      if (n <= 0) return;   // 没有种子的不显示（避免 ×0 干扰）
      cells += `<div class="cell" onclick="WV.S.Farm.plant(${i}, '${cid}')">
        <img src="assets/sprites/crops/${cid}_0.png"><div class="cn">${esc(c.name)}</div><div class="cs">种子×${n}</div>
      </div>`;
    });
    panel(`
      <div class="panel-title">🌱 播种（当季作物） <button class="panel-close" onclick="WV.S.UI.farmPanel()">返回</button></div>
      ${cells ? `<div class="grid">${cells}</div>` : '<p class="desc" style="text-align:center;padding:16px">没有当季种子了——去镇街杂货店买吧（苏婆婆杂货铺）</p>'}
    `);
  }

  // ---------- 装修 ----------
  function decoratePanel(area) {
    area = area || 'living';
    const A = WV.S.Deco.AREAS[area];
    // 家具栏（已拥有未摆放优先）
    let owned = '';
    Object.keys(WV.DATA.furniture).forEach(function (id) {
      if (!WV.state.furnitureOwned[id]) return;
      const f = WV.DATA.furniture[id];
      owned += `<div class="cell" onclick="WV.S.UI.placeMode('${area}', '${id}')">
        <img src="${furnImg(id)}"><div class="cn">${esc(f.name)}</div><div class="cs">舒适+${f.comfort}</div>
      </div>`;
    });
    // 商店购买
    let shop = '';
    Object.keys(WV.DATA.furniture).forEach(function (id) {
      if (WV.state.furnitureOwned[id]) return;
      const f = WV.DATA.furniture[id];
      if (f.quest) return; // 剧情家具
      shop += `<div class="row-line"><span>${esc(f.name)}（舒适+${f.comfort}）</span>
        <span><span class="price">${f.price}🪙</span> <button class="btn-act" onclick="WV.S.Deco.buy('${id}');WV.S.UI.decoratePanel('${area}')">买</button></span></div>`;
    });
    // 网格（含翻转模式：点击已摆家具=左右翻转）
    let grid = '<div class="dec-grid" style="grid-template-columns:repeat(' + A.cols + ',34px)">';
    const placed = {};
    (WV.state.placement[area] || []).forEach(function (f) { placed[f.x + '_' + f.y] = f; });
    for (let y = 0; y < A.rows; y++) for (let x = 0; x < A.cols; x++) {
      const f = placed[x + '_' + y];
      grid += `<div class="dec-cell" onclick="WV.S.UI.cellTap('${area}', ${x}, ${y})">${f ? `<img src="${furnImg(f.id)}" style="${f.flip ? 'transform:scaleX(-1);' : ''}" title="${esc((WV.DATA.furniture[f.id] || {}).name || '')}">` : ''}</div>`;
    }
    grid += '</div>';
    const flipOn = !!WV.S.UI._flipMode;
    const tabs = Object.keys(WV.S.Deco.AREAS).map(function (k) {
      return `<button class="tab ${k === area ? 'active' : ''}" onclick="WV.S.UI.decoratePanel('${k}')">${WV.S.Deco.AREAS[k].name}</button>`;
    }).join('');
    panel(`
      <div class="panel-title">🛋️ 装修家园 · 温度 🔥 ${WV.S.Deco.warmth()}/5 级 <button class="panel-close" onclick="WV.S.UI.closePanel()">完成</button></div>
      <div class="tabs">${tabs}</div>
      <p class="desc" style="margin-bottom:8px">先在下方选中家具，再点网格空位摆放；点已摆的家具=收回${flipOn ? '<b>（翻转模式：点已摆家具=左右翻转）</b>' : ''}</p>
      ${grid}
      <div style="text-align:center;margin-top:10px">
        <button class="btn-act ${flipOn ? 'primary' : ''}" onclick="WV.S.UI.toggleFlip();WV.S.UI.decoratePanel('${area}')">🔁 翻转模式：${flipOn ? '开' : '关'}</button>
      </div>
      <div class="panel-title" style="font-size:15px;margin-top:14px">已拥有（点选后点格子摆放）</div>
      <div class="grid">${owned || '<p class="desc">还没有家具——下面买一些吧</p>'}</div>
      <div class="panel-title" style="font-size:15px;margin-top:14px">家具店</div>
      ${shop}
    `);
  }
  function toggleFlip() { WV.S.UI._flipMode = !WV.S.UI._flipMode; }
  function placeMode(area, id) {
    placing = id;
    WV.S.UI._flipMode = false;
    toast('点击上方网格的空格子摆放');
  }
  function cellTap(area, x, y) {
    const cur = (WV.state.placement[area] || []).find(function (f) { return f.x === x && f.y === y; });
    if (cur) {
      if (WV.S.UI._flipMode) {
        cur.flip = !cur.flip;   // 翻转模式：左右翻转已摆家具
        WV.emit('state:dirty');
      } else {
        WV.S.Deco.removeAt(area, x, y);
        toast(`收回了${(WV.DATA.furniture[cur.id] || {}).name || '家具'}`);
      }
    } else if (placing) {
      if (WV.S.Deco.place(area, placing, x, y)) toast(`摆好了${(WV.DATA.furniture[placing] || {}).name}`);
      placing = null;
    } else {
      toast('先从下面选择要摆放的家具');
    }
    decoratePanel(area);
  }

  // ---------- 睡觉结算 ----------
  let curSleep = null;
  function sleepPanel(d) {
    curSleep = d;
    const w = { sunny: '☀ 晴', rain: '🌧 雨', snow: '❄ 雪' }[d.nextWeather];
    panel(`
      <div class="panel-title">🌙 睡觉 · ${d.day} <button class="panel-close" onclick="WV.S.UI.sleepCancel()">先不睡</button></div>
      <div class="row-line"><span>今日收入</span><span class="price">+${d.income} 🪙</span></div>
      <div class="row-line"><span>今日支出</span><span style="color:#BE7E8F">-${d.spend} 🪙</span></div>
      <div class="row-line"><span>勤勉奖励（剩余体力×5）</span><span class="price">+${d.bonus} 🪙</span></div>
      <div class="row-line"><span>浇过水的作物</span><span>${d.grown} 株（今晚会生长）</span></div>
      <div class="row-line"><span>明日天气</span><span>${w}</span></div>
      <div style="text-align:center;margin-top:18px">
        <button class="btn-act primary" onclick="WV.S.UI.sleepGo()">进入梦乡 💤</button>
      </div>
    `);
  }
  function sleepGo() {
    const d = curSleep;
    curSleep = null;          // 先摘走：防止 closePanel 把确认路径误判为取消
    closePanel();
    if (d && d.onOk) d.onOk();
  }
  function sleepCancel() {
    closePanel();
    if (curSleep && curSleep.onCancel) curSleep.onCancel();
    curSleep = null;
  }

  // ---------- 地图 ----------
  function mapPanel() {
    const REGION = [
      ['home_living', '老屋'], ['court', '庭院'], ['farm', '田园'],
      ['town_street', '小镇'], ['ranch', '牧场'], ['forest_edge', '森林边缘'],
      ['deep_trail', '密林小径'], ['deep_inner', '密林深处'],
      ['valley_side', '溪谷'], ['valley_up', '溪谷上坡'],
      ['hill_flower', '山丘花田'], ['hill_rock', '巨石坡'], ['spirit_realm', '精灵秘境'],
    ];
    let cells = '';
    REGION.forEach(function (r) {
      const unlocked = WV.state.areas.indexOf(r[0]) >= 0;
      const here = WV.Scene.key === r[0];
      const u = WV.S.Story.unlockInfo(r[0]);
      const hint = u ? `（${u.label}${u.cost ? '·' + u.cost + '金币' : ''}${u.minDay ? '·冬季开启' : ''}）` : '';
      if (unlocked) {
        cells += `<div class="cell ${here ? 'sel' : ''}" ${here ? '' : `onclick="WV.S.UI.closePanel();WV.Scene.enter('${r[0]}')"`}>
          <div class="cn">${r[1]}</div><div class="cs">${here ? '📍在这里' : '点此前往'}</div></div>`;
      } else {
        cells += `<div class="cell locked" onclick="WV.S.UI.mapHint('${r[1]}','${hint.replace(/'/g, '')}')">
          <div class="cn">？？？</div><div class="cs">未解锁</div></div>`;
      }
    });
    panel(`
      <div class="panel-title">🗺️ 风铃谷 <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <div class="grid">${cells}</div>
      <p class="desc" style="margin-top:10px;text-align:center">${WV.S.Time.dayLabel()} · 温度 🔥 ${WV.S.Deco.warmth()}/5 · 回忆 ${WV.state.journal.memories.length}/12</p>
      ${WV.state.ending ? `
      <div style="text-align:center;margin-top:10px">
        <button class="btn-act" onclick="WV.S.UI.closePanel();WV.S.Story.replayEnding('normal')">🎬 回顾《风再起时》</button>
        ${WV.state.ending === 'true' ? '<button class="btn-act" onclick="WV.S.UI.closePanel();WV.S.Story.replayEnding(\'true\')">🎬 回顾《风铃传承》</button>' : ''}
      </div>` : ''}
    `);
  }

  /** 地图未解锁区域的点击提示 */
  function mapHint(name, hint) {
    toast(`还没到达这里 ${hint || '——多在山谷里走走，留意断掉的桥和路'}`);
  }

  // ---------- 书架读书（旧书铺购买的三册传说） ----------
  const BOOK_TEXTS = {
    m_book1: '【守护者】\n\n很久很久以前，山谷里住着一位看不见、也听不见的守护者。\n\n它出生在山谷最深处的泉眼里，眼睛从未见过光，耳朵从未听过风。别的生灵都为它叹息——可守护者自己并不觉得遗憾。\n\n「世界对待我的方式，就是让我去守护。」它是这样说的。\n\n但它无法看见花开，无法听见鸟鸣。它如何知道山谷过得好不好呢？\n\n一位最早的山民想出了办法：他打了一枚小小的铜铃，挂在屋檐下。\n风起时，铃就响。\n\n「铃响，就是平安。」\n\n于是人们一家一家地挂起了风铃。喜悦时摇响，思念时摇响，告别时也摇响。铃声顺着风传到泉眼去，守护者听着满谷的声音，便知道：这里的每一天，都值得守护。\n\n据说，只要你屋檐下的铃还在响，守护者就从未离开。\n\n——镇志残页·其一',
    m_book2: '【风铃祭】\n\n每年冬天最冷的那一夜，是风铃祭。\n\n这个祭典的来历，要从一场大雾说起。\n\n很久以前的一个冬天，雾封了山谷整整七日。人们在雾里迷失、受冻，几乎撑不下去。第八天清晨，有人听见风里传来极轻的铃音——循着声音走，竟然找到了回家的路。\n\n「是守护者在引路。」老人们这样说。\n\n从那以后，每逢冬天最冷的一夜，人们就把一年里最想被听见的心愿写在小木牌上，挂满全镇的屋檐与树枝。夜风吹过，千铃齐响——据说那一刻，守护者会记住每一个心愿。\n\n祭典上有三样东西不能少：刚出炉的面包、新酿的果酒，和一炉彻夜不熄的火。守着火的人整夜不能睡，要一直轻声说话——说给火听，也是说给守护者听。\n\n……你的奶奶，是这一带摇铃摇得最响、守火守得最久的那个。\n\n——镇志残页·其二',
    m_book3: '【守望的人们】\n\n守护者从不现身。但山谷能一直好好地活着，靠的不只是它的守护。\n\n总有一些人，替看不见的守护者看着这座山谷。\n\n他们修桥、铺路、照料田地；记得每一只精灵的名字，也记得每一户人家的悲欢。他们从不居功，因为「守护者会听见的」。\n\n镇志把他们称作「摇铃人」——因为他们的脚步声和铃声一样轻，走到哪里，哪里就安宁。\n\n摇铃人没有名册，没有传承的仪式。他们只是某一天留下来了，然后一年、十年、五十年地守下去。\n\n守得久的摇铃人，据说能隐约听懂铃声里的意思——哪一天铃声格外清亮，就是山谷非常幸福的日子。\n\n最近的一位，守了整整五十年。\n\n她屋檐下的那枚铃，镇上没有人听它响过。\n\n但所有精灵都记得她的名字。\n\n——镇志残页·其三',
  };
  function readBooks() {
    const owned = ['m_book1', 'm_book2', 'm_book3'].filter(function (id) { return WV.S.Inv.count(id) > 0; });
    let cells = owned.map(function (id) {
      const read = WV.state.flags['read_' + id];
      return `<div class="cell" onclick="WV.S.UI.closePanel();WV.S.UI.readBook('${id}')">
        <img src="${itemIcon(id)}"><div class="cn">${esc(WV.itemName(id))}</div><div class="cs">${read ? '读过 · 再读一遍' : '点击阅读'}</div>
      </div>`;
    }).join('');
    if (!cells) cells = '<p class="desc" style="grid-column:1/-1;text-align:center;padding:16px">书架上有几本奶奶读过的旧书……镇街的旧书铺似乎上架了几册新抄本</p>';
    panel(`
      <div class="panel-title">📚 书架 <button class="panel-close" onclick="WV.S.UI.closePanel()">合上</button></div>
      <div class="grid">${cells}</div>
      ${owned.length === 3 && ['m_book1','m_book2','m_book3'].every(id => WV.state.flags['read_' + id]) ? '<p class="desc" style="text-align:center;margin-top:8px">✨ 三册都读完了</p>' : ''}
    `);
  }
  function readBook(id) {
    const t = BOOK_TEXTS[id];
    const first = !WV.state.flags['read_' + id];
    WV.state.flags['read_' + id] = true;
    WV.emit('state:dirty');
    WV.Dialogue.say([{ speaker: WV.itemName(id), text: t }]);
    // 集齐三册首读：顾先生的书稿谢礼
    if (first && ['m_book1', 'm_book2', 'm_book3'].every(function (b) { return WV.state.flags['read_' + b]; }) && !WV.state.flags.books_done) {
      WV.state.flags.books_done = true;
      setTimeout(function () {
        WV.S.Eco.earn(100);
        WV.S.UI.toast('顾先生托小飞捎来 100 金：「抄本售罄，谢礼。」📜');
      }, 1200);
    }
  }

  // ---------- 玩法说明 / 制作名单 ----------
  function howto() {
    panel(`
      <div class="panel-title">🌸 玩法说明 <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <p class="desc" style="line-height:2">
      · 点击场景中的发光点、人物、门进行互动<br>
      · 每天有 10 点体力：种田、采集、料理都会消耗，用完就回床上睡觉<br>
      · 作物要先翻土→播种→每天浇水，5 天成熟（雨天自动喝水）<br>
      · 作物和料理可以卖钱，也可以送给镇民提升好感<br>
      · 四季各 14 天，不同季节有不同的作物、精灵和风景<br>
      · 集齐 12 段回忆 + 6 只精灵羁绊，可以见证特别的结局<br>
      · 快捷键：B 背包 / J 手账 / M 地图 / Esc 关闭 · 空格推进对话<br>
      · 这个游戏没有失败和惩罚，按自己的节奏慢慢玩 ✨</p>
    `);
  }
  function credits() {
    // 制作信息已按需求移至标题页脚（制作人 wangshengithub）；此处保留占位不再读取文件（file:// 无 fetch）
    panel(`<div class="panel-title">🌷 制作 <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <p class="desc" style="text-align:center;line-height:2">🎧 《风铃谷的四季》<br>制作：<a href="https://github.com/wangshengithub" target="_blank" rel="noopener" style="color:#B2822E">wangshengithub</a><br><br>感谢游玩 ✨</p>`);
  }

  // ---------- 一次性热点管理 ----------
  /** 已拾取的回忆热点等一次性内容：从场景移除（读档/重进亦过滤） */
  function stripOneShotHotspots() {
    const def = WV.Scene.def;
    if (!def || !def.hotspots) return;
    const mem = WV.state.journal.memories;
    def.hotspots = def.hotspots.filter(function (h) {
      const m = /^recall_(\d+)$/.exec(h.action || '');
      if (!m) return true;
      return mem.indexOf(parseInt(m[1], 10)) < 0;   // 已收录的回忆 → 移除热点
    });
  }
  WV.on('scene:entered', stripOneShotHotspots);

  // ---------- 热点动作总路由 ----------
  const GATHERS = {
    gather_honey: ['m_honey', '野花蜜'], gather_mushroom: ['m_mushroom', '蘑菇'],
    gather_chestnut: ['m_chestnut', '板栗'], gather_wood: ['m_lightwood', '轻木'],
    gather_pebble: ['m_pebble', '鹅卵石'], gather_flower: ['m_flower', '山花'],
    gather_moonflower: ['m_moonflower', '月见草'], gather_sand: ['m_sandsugar', '亮晶晶的沙'],
    gather_oak: ['m_oak', '橡果'],
  };
  const FLAVOR = {
    fireplace: ['壁炉', '柴火噼啪作响，屋子里暖洋洋的。'],
    cat: ['窗台的小猫', '一只姜黄色的小猫在窗台上打盹。它睁开眼看了看你，又睡着了。'],
    table: ['圆木桌', '桌面的划痕里藏着许多旧时光。'],
    bookshelf: ['书架', '放着几本奶奶读过的书，书页间夹着干花。'],
    wardrobe: ['衣柜', '奶奶的围裙叠得整整齐齐，还留着阳光的味道。'],
    cow: ['牛棚', '奶牛慢悠悠地嚼着草，对你哞了一声。'],
    diary: ['日记桌', '这里以后可以记下每一天的故事。'],
    ingredients: ['食材架', '面粉、豆子、糖……储备还算充足。'],
    fishing: ['溪边', '溪水清得能看见鹅卵石。听说这条溪里的鱼最爱上清晨的饵。'],
    chicken_quest: ['鸡舍', '几只毛茸茸的小鸡挤在一起打盹。花花阿姨说它们最爱往森林里钻。'],
    storage: ['储物柜', '放着我收获的作物和收集的东西，打开背包（B）就能查看。'],
    furn_rocker: ['奶奶的摇椅', '摇椅还在轻轻地晃。你坐上去坐了一会儿，好像闻到了麦芽糖的味道。'],
    spirit_dingdang: ['叮当', '叮当就住在屋檐的风铃里，摇一摇铃铛它就会出现。'],
    spirit_acorn: ['橡果团子出没的地方', '咕噜咕噜……春天的时候，这里会有圆滚滚的小家伙出没。'],
    spirit_otter: ['溪水獭出没的地方', '水里好像有什么抱着石头一闪而过……'],
    spirit_mushroom: ['蘑菇灯出没的地方', '秋天雨后的密林深处，会亮起一盏一盏小灯。'],
    spirit_sheep: ['云朵羊出没的地方', '夏天的晴天，抬头看看天上像绵羊的那朵云。'],
    spirit_stone: ['巨石坡', '长满青苔的巨石静静矗立，好像在等待着谁。'],
    spirit_belldeer: ['谷之守护者', '铃声悠远……山谷最深处，守护者的传说在这里流传。'],
  };

  WV.on('hotspot:action', function (h) {
    const a = h.hotspot.action;
    if (a === 'bag') { bagPanel(); return; }
    if (a.indexOf('shop_') === 0) { shopPanel(a); return; }
    if (a === 'decorate') { decoratePanel(); return; }
    if (GATHERS[a]) {
      const g = GATHERS[a];
      // 月见草夜间限定（文案与机制一致）
      if (a === 'gather_moonflower' && WV.Light.phaseIdx() !== 3) { toast('月见草要等天黑才会开放（体力消耗过半后天色渐暗）'); return; }
      const flag = 'g_' + a + '_' + WV.state.day;
      if (WV.state.flags[flag]) { toast('这里今天采过了，明天再来吧'); return; }
      if (!WV.S.Energy.spend(1)) return;
      // 产出与次数立即结算（动画仅承担演出，被打断不丢失）
      WV.state.flags[flag] = true;
      WV.S.Inv.add(g[0], 1 + (Math.random() < 0.35 ? 1 : 0));
      WV.Audio.playSfx('sfx_pluck');
      WV.emit('state:dirty');
      WV.Scene.playAction('doing', function () {});
      return;
    }
    if (/^recall_\d+$/.test(a)) {
      WV.S.Journal.addMemory(parseInt(a.slice(7), 10));
      stripOneShotHotspots();   // 一次性：拾取后立刻从场景移除
      return;
    }
    if (a === 'windbell') {
      WV.Dialogue.say([
        { speaker: '', text: '（屋檐下的旧风铃轻轻晃着，声音喑哑）' },
        { speaker: '叮当', text: '等它重新响起来那天……嘿嘿，到时候你就知道啦。' },
      ]);
      return;
    }
    if (a === 'mailbox') {
      WV.Dialogue.say([{ speaker: '', text: '（绿色的旧邮筒。小飞每天都会准时来取信——他最近好像在找一位失联的笔友。）' }]);
      return;
    }
    if (a === 'bookshelf') { readBooks(); return; }
    if (FLAVOR[a]) {
      WV.Dialogue.say([{ speaker: FLAVOR[a][0], text: FLAVOR[a][1] }]);
      return;
    }
  });

  // ---------- 今日建议面板（日期/💡 双入口） ----------
  function tipPanel() {
    const tip = WV.S.Guide.todayTip();
    const st = WV.state;
    const dry = st.plots.filter(function (p) { return p.state === 'planted' && !p.watered && !p.dormant; }).length;
    const mature = st.plots.filter(function (p) { return p.state === 'mature'; }).length;
    panel(`
      <div class="panel-title">💡 今日建议 · ${WV.S.Time.dayLabel()} <button class="panel-close" onclick="WV.S.UI.closePanel()">关闭</button></div>
      <p style="font-size:17px;line-height:1.9;padding:6px 4px 12px">👉 ${tip}</p>
      <div class="row-line"><span>待浇水的作物</span><span>${dry} 块${dry && st.weather !== 'rain' ? '（去田园点一点就好）' : ''}</span></div>
      <div class="row-line"><span>成熟的作物</span><span>${mature} 块${mature ? ' ✨ 可以收获了' : ''}</span></div>
      <div class="row-line"><span>家的温度</span><span>🔥 ${WV.S.Deco.warmth()}/5 级${WV.S.Deco.warmth() >= 2 ? ' · 会有客人来访' : ' · 2 级起会有客人来敲门（买家具布置提升）'}</span></div>
      <div class="row-line"><span>回忆收集</span><span>${st.journal.memories.length}/12</span></div>
      <div class="row-line"><span>精灵羁绊</span><span>${WV.S.Journal.bondCount()}/9</span></div>
      <div style="text-align:center;margin-top:14px">
        <button class="btn-act" onclick="WV.S.UI.howto()">查看完整玩法说明</button>
      </div>
    `);
  }

  // HUD 按钮（设置随时可开，其余走面板守卫）
  function bindHud() {
    document.getElementById('hud-bag').onclick = function () { panelOpen ? closePanel() : guardPanel() && bagPanel(); };
    document.getElementById('hud-journal').onclick = function () { panelOpen ? closePanel() : guardPanel() && journalPanel(); };
    document.getElementById('hud-map').onclick = function () { panelOpen ? closePanel() : guardPanel() && mapPanel(); };
    document.getElementById('hud-settings').onclick = function () { panelOpen ? closePanel() : WV.S.Settings.panel(); };
    document.getElementById('hud-tip').onclick = function () { panelOpen ? closePanel() : guardPanel() && tipPanel(); };
    document.getElementById('hud-date').onclick = function () { panelOpen ? closePanel() : guardPanel() && tipPanel(); };
  }

  /** 面板守卫：仅在正常游玩态可开面板（设置除外——但演出/结局层可见时一律不开） */
  function guardPanel() {
    if (!WV.state) return false;
    if (WV.state.freeze) return false;          // 演出/回忆/结局中
    if (WV.Dialogue.busy()) return false;       // 对话播放中
    if (!document.getElementById('memory').classList.contains('hidden')) return false;
    if (!document.getElementById('ending').classList.contains('hidden')) return false;
    return true;
  }

  WV.on('ui:toggle', function (what) {
    if (panelOpen) { closePanel(); return; }
    if (!guardPanel()) return;
    if (what === 'bag') bagPanel();
    else if (what === 'journal') journalPanel();
    else if (what === 'map') mapPanel();
  });
  WV.on('ui:escape', function () { closePanel(); });

  S.toast = toast; S.panel = panel; S.closePanel = closePanel; S.isPanelOpen = isPanelOpen;
  S.refreshHud = refreshHud;
  S.bagPanel = bagPanel; S.journalPanel = journalPanel; S.memoryView = memoryView;
  S.shopPanel = shopPanel; S.buy = buy; S.sell = sell;
  S.cookPanel = cookPanel;
  S.farmPanel = farmPanel; S.seedPicker = seedPicker;
  S.decoratePanel = decoratePanel; S.placeMode = placeMode; S.cellTap = cellTap; S.toggleFlip = toggleFlip;
  S.sleepPanel = sleepPanel; S.sleepGo = sleepGo; S.sleepCancel = sleepCancel; S.mapPanel = mapPanel;
  S.howto = howto; S.credits = credits; S.bindHud = bindHud; S.tipPanel = tipPanel; S.mapHint = mapHint; S.readBooks = readBooks; S.readBook = readBook;
  WV.S.UI = S;
})();
