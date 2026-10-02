/**
 * farm.js —— 农田系统（PRD §3.4.1）
 * 12 块田（初始 4 块可扩展）；状态机 wild→tilled→planted→mature；
 * 浇水才生长（无枯死）；季节切换非当季休眠；雨天自动浇水。
 * 场景渲染：farm 场景动态绘制作物（onDraw 挂载）。
 */
(function () {
  'use strict';
  const WV = window.WV;

  // 农田 12 块网格坐标（32px 网格对齐 soil tile 拼贴：每块 2 宽×1 高 tile）
  const PLOT_POS = [
    [48, 124], [80, 124], [112, 124], [144, 124],
    [48, 156], [80, 156], [112, 156], [144, 156],
    [48, 188], [80, 188], [112, 188], [144, 188],
  ];
  // Sunnyside 官方田土 tile（16×12）
  const SOIL_TILES = [0, 1, 2, 3].map(function (i) { return 'assets/scenes/tiles/tile_soil_' + i + '.png'; });

  const S = {};

  function plots() { return WV.state.plots; }

  /** 打开农田操作面板 */
  function openPanel() {
    WV.S.UI.farmPanel();
  }

  function till(i) {
    const p = plots()[i];
    if (!p.unlocked) { unlock(i); return; }
    if (p.state !== 'wild') return;
    if (!WV.S.Energy.spend(1)) return;
    p.state = 'tilled';   // 状态立即生效（防动作期间睡觉丢进度）
    WV.emit('state:dirty');
    WV.emit('farm:did', { act: 'till', i: i });
    WV.Scene.playAction('dig', function () {
      WV.Audio.playSfx('sfx_chop');
      WV.Fx.stars(PLOT_POS[i][0], PLOT_POS[i][1]);
    });
    if (WV.S.UI.isPanelOpen()) WV.S.UI.farmPanel();
  }

  /** 扩展田块（150 金币） */
  function unlock(i) {
    if (plots()[i].unlocked) return;
    if (!WV.S.Eco.pay(WV.CONST.PLOT_PRICE)) return;
    plots()[i].unlocked = true;
    plots()[i].state = 'wild';
    WV.S.UI.toast('开垦了一块新田！');
    refreshPlotHotspots();
    if (WV.S.UI.isPanelOpen()) WV.S.UI.farmPanel();
  }

  function plant(i, cropId) {
    const p = plots()[i];
    if (p.state !== 'tilled') return;
    const seedId = 'c_' + cropId + '_seed';
    if (!WV.S.Inv.remove(seedId, 1)) { WV.S.UI.toast('没有这种种子了'); return; }
    if (!WV.S.Energy.spend(1)) { WV.S.Inv.add(seedId, 1); return; }
    p.state = 'planted'; p.crop = cropId; p.growth = 0; p.watered = false;   // 立即生效
    WV.Audio.playSfx('sfx_pluck');
    WV.emit('state:dirty');
    WV.emit('farm:did', { act: 'plant', i: i });
    WV.Scene.playAction('doing', function () {});
    WV.S.UI.closePanel();   // 选完种回场景看动画
  }

  function water(i) {
    const p = plots()[i];
    if (p.state !== 'planted' || p.watered) return;
    if (p.dormant) { WV.S.UI.toast('这株作物在休眠——等它当季再浇水吧'); return; }
    if (WV.state.weather === 'rain') {
      p.watered = true;   // 雨天免体力自动浇水
      WV.emit('state:dirty');
      WV.emit('farm:did', { act: 'water', i: i });
      return;
    }
    if (!WV.S.Energy.spend(1)) return;
    p.watered = true;   // 立即生效
    WV.emit('state:dirty');
    WV.emit('farm:did', { act: 'water', i: i });
    WV.Scene.playAction('watering', function () {
      WV.Audio.playSfx('sfx_glass');
      WV.Fx.stars(PLOT_POS[i][0], PLOT_POS[i][1]);
    });
    if (WV.S.UI.isPanelOpen()) WV.S.UI.farmPanel();
  }

  function harvest(i) {
    const p = plots()[i];
    if (p.state !== 'mature') return;
    if (!WV.S.Energy.spend(1)) return;
    const crop = WV.DATA.crops[p.crop];
    const yieldN = crop.yield || 2;
    // 收获立即入包（防动作期间睡觉丢收成）
    WV.S.Inv.add('c_' + p.crop, yieldN);
    WV.S.Journal.addCrop(p.crop);   // B2 修复：先记图鉴再清空字段
    p.state = 'tilled'; p.crop = null; p.growth = 0; p.watered = false; p.matureDays = 0;
    WV.emit('state:dirty');
    WV.emit('farm:did', { act: 'harvest', i: i });
    WV.Scene.playAction('doing', function () {});
    if (WV.S.UI.isPanelOpen()) WV.S.UI.farmPanel();
  }

  /** 新的一天：浇过水的生长 +1；到该作物生长天数即成熟 */
  function onNewDay() {
    let grown = 0;
    plots().forEach(function (p) {
      if (p.state === 'planted' && p.watered && !p.dormant) {
        p.growth += 1;
        grown++;
        const need = (WV.DATA.crops[p.crop] || {}).days || 5;
        if (p.growth >= need) p.state = 'mature';
      }
      p.watered = false; // 新的一天需重新浇水（雨天在 wake 提示，water() 雨天免体力）
      if (WV.state.weather === 'rain' && p.state === 'planted') p.watered = true;
      // 成熟 3 天未收获：自动收入仓库（防丢，PRD §3.4.1；不消耗体力）
      if (p.state === 'mature') {
        p.matureDays = (p.matureDays || 0) + 1;
        if (p.matureDays >= 3) {
          const crop = WV.DATA.crops[p.crop];
          WV.S.Inv.add('c_' + p.crop, (crop && crop.yield) || 2, true);
          WV.S.UI.toast(`成熟的${(crop && crop.name) || '作物'}自动收进了仓库 🧺`);
          WV.S.Journal.addCrop(p.crop);
          p.state = 'tilled'; p.crop = null; p.growth = 0; p.watered = false; p.matureDays = 0;
        }
      } else p.matureDays = 0;
    });
    return grown;
  }

  /** 季节切换：非当季未成熟 → 休眠（state 保持 planted，growth 保留，播不了种直到当季） */
  function onSeason() {
    const si = WV.seasonIdx();
    plots().forEach(function (p) {
      if (p.state === 'planted') {
        const season = (WV.DATA.crops[p.crop] || {}).season;   // P2 修复：脏档 crop=null 防御（防换季日睡觉中断）
        if (season === undefined || season !== si) p.dormant = (season !== si);
        else p.dormant = false;
        if (season === undefined) { p.state = 'tilled'; p.crop = null; p.growth = 0; p.watered = false; p.dormant = false; p.matureDays = 0; }  // 脏档自愈
      }
    });
  }

  /** 可种植判断 */
  function canPlant(cropId) {
    return WV.DATA.crops[cropId].season === WV.seasonIdx();
  }

  /** 场景动态绘制：Sunnyside soil tile 底座 + 作物（2x）+ 状态提示 */
  function drawPlots(ctx) {
    if (WV.Scene.key !== 'farm') return;
    plots().forEach(function (p, i) {
      const cx = PLOT_POS[i][0], cy = PLOT_POS[i][1];
      const x0 = cx - 16, y0 = cy - 12;   // 底座左上（2 宽 × 1 高 soil tile）
      if (p.unlocked && p.state !== 'wild') {
        // 已开垦：贴官方田土 tile（风格与场景统一）
        for (let t = 0; t < 2; t++) {
          const img = WV.Assets.img(SOIL_TILES[(i + t) % 4]);
          if (img.complete && img.naturalWidth) ctx.drawImage(img, x0 + t * 16, y0);
        }
        if (p.watered) {  // 湿土（浇水后颜色加深）
          ctx.fillStyle = 'rgba(40,32,28,0.30)';
          ctx.fillRect(x0, y0, 32, 12);
        }
      } else if (p.unlocked) {
        // 荒地：不覆盖底图，只点几株小草示意
        ctx.fillStyle = '#7a5a40';
        ctx.fillRect(cx - 8, cy - 4, 2, 2); ctx.fillRect(cx + 2, cy - 7, 2, 3); ctx.fillRect(cx + 9, cy - 3, 2, 2);
      } else {
        // 未开垦：虚线框 + 十字
        ctx.strokeStyle = 'rgba(185,138,94,0.5)';
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, 31, 11.5);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(150,104,77,0.8)';
        ctx.fillRect(cx - 1, cy - 10, 2, 6);
        ctx.fillRect(cx - 4, cy - 8, 8, 2);
      }
      if (p.crop) {
        const days = (WV.DATA.crops[p.crop] || {}).days || 5;
        const mature = p.state === 'mature';
        const stage = mature ? 5 : Math.min(5, Math.floor(p.growth / days * 5));
        const img = WV.Assets.img(`assets/sprites/crops/${p.crop}_${stage}.png`);
        if (img.complete && img.naturalWidth) {
          const k = 2;
          const w = img.width * k, h = img.height * k;
          ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h + 2), w, h);
        }
        if (mature) {
          const t = (Date.now() % 900) / 900;
          ctx.strokeStyle = `rgba(242,206,126,${0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI))})`;
          ctx.strokeRect(x0 + 0.5, y0 + 0.5, 31, 11.5);
        } else if (p.state === 'planted' && !p.watered && !p.dormant) {
          ctx.fillStyle = '#6FA0C2';
          ctx.fillRect(cx + 12, y0 - 5, 2, 4);
          ctx.fillRect(cx + 11, y0 - 2, 4, 2);
        }
      }
    });
    // 田园精灵跟随（P2 修复：移出田块循环，仅绘制一次）
    if (WV.state.flags.spirit_all) {
      const tt = Date.now() / 1000;
      const pets = [['acorn', 210, 200], ['snowbunny', 240, 205], ['mushroom', 330, 195]];
      pets.forEach(function (pt, i) {
        const im = WV.Assets.img('assets/sprites/spirits/' + pt[0] + '_0.png');
        if (!im.complete || !im.naturalWidth) return;
        const px = pt[1] + Math.sin(tt * 0.7 + i * 2) * 6;
        const py = pt[2] + Math.sin(tt * 1.1 + i) * 2;
        ctx.drawImage(im, Math.round(px), Math.round(py - im.height));
      });
    }
  }

  WV.on('scene:entered', function () {
    // farm 场景：田块注册为动态热点（场景内直点操作，面板仅总览）
    if (WV.Scene.key === 'farm' && WV.Scene.def) {
      const def = WV.Scene.def;
      def.hotspots = (def.hotspots || []).filter(function (h) { return h.action !== 'farm_plot_big'; });
      // 移除上次注入的动态块（防重复）
      def.hotspots = def.hotspots.filter(function (h) { return !/^plot_/.test(h.action); });
      plots().forEach(function (p, i) {
        def.hotspots.push({ name: plotName(p, i), x: PLOT_POS[i][0], y: PLOT_POS[i][1] - 6, r: 11, action: 'plot_' + i });
      });
    }
    WV.Scene.clearDraws();
    WV.Scene.onDraw(drawPlots);
    WV.S.Spirits.hookScene();
  });

  /** 刷新田块热点的动态名字（状态变化后调用，保证 hover 提示实时） */
  function refreshPlotHotspots() {
    const def = WV.Scene.def;
    if (!def || WV.Scene.key !== 'farm' || !def.hotspots) return;
    def.hotspots.forEach(function (h) {
      const m = /^plot_(\d+)$/.exec(h.action || '');
      if (!m) return;
      const i = parseInt(m[1], 10);
      h.name = plotName(plots()[i], i);
    });
  }
  WV.on('farm:did', function () { refreshPlotHotspots(); });
  WV.on('hud:refresh', function () { refreshPlotHotspots(); });
  WV.on('scene:entered', function () { refreshPlotHotspots(); });   // B3 修复：进场景即校准（覆盖过夜成熟的情况）
  function plotName(p, i) {
    if (!p.unlocked) return `开垦新田（${WV.CONST.PLOT_PRICE}金币）`;
    if (p.state === 'wild') return `荒地 · 点击翻土`;
    if (p.state === 'tilled') return `翻好的田 · 点击播种`;
    if (p.state === 'mature') return `${(WV.DATA.crops[p.crop] || {}).name}成熟了 · 点击收获`;
    const cropName = (WV.DATA.crops[p.crop] || {}).name || '';
    if (p.dormant) return `${cropName} · 休眠中（等它当季再长）`;
    return p.watered ? `${cropName} · 已播种，已浇水 ✓` : `${cropName} · 已播种，待浇水`;
  }

  WV.on('hotspot:action', function (h) {
    const a = h.hotspot.action;
    // 场景内直点田块：按状态执行下一步
    if (/^plot_\d+$/.test(a)) {
      const i = parseInt(a.slice(5), 10);
      const p = plots()[i];
      if (!p.unlocked) { unlock(i); return; }
      if (p.state === 'wild') till(i);
      else if (p.state === 'tilled') WV.S.UI.seedPicker(i);
      else if (p.state === 'mature') harvest(i);
      else if (p.dormant) WV.S.UI.toast('休眠中的作物，等它当季再长吧');
      else if (!p.watered) water(i);
      else WV.S.UI.toast('这块田已播种也浇过水啦，明天再来看它吧');
      return;
    }
    if (a === 'farm_plot') openPanel();
  });

  S.till = till; S.plant = plant; S.water = water; S.harvest = harvest;
  S.unlock = unlock; S.onNewDay = onNewDay; S.onSeason = onSeason;
  S.canPlant = canPlant; S.PLOT_POS = PLOT_POS; S.openPanel = openPanel;
  WV.S.Farm = S;
})();
