/**
 * decorate.js —— 装修家园（PRD §3.4.3）
 * 三区网格（客厅 8×5 / 卧室 6×5 / 庭院 10×6）、放置/回收/翻转、舒适度→家的温度。
 */
(function () {
  'use strict';
  const WV = window.WV;

  // 区域网格定义（格=虚拟，渲染在家具面板中；场景 PNG 为底）
  const AREAS = {
    living: { name: '客厅', cols: 8, rows: 5, scene: 'home_living' },
    bedroom: { name: '卧室', cols: 6, rows: 5, scene: 'home_bedroom' },
    court: { name: '庭院', cols: 10, rows: 6, scene: 'court' },
  };

  const S = {};

  function comfort() {
    let v = 0;
    ['living', 'bedroom', 'court'].forEach(function (a) {
      (WV.state.placement[a] || []).forEach(function (f) {
        const def = WV.DATA.furniture[f.id];
        if (def) v += def.comfort || 0;
      });
    });
    // 已拥有未摆放不计；owned 集合用于图鉴
    return v;
  }

  /** 家的温度等级（1-5）：舒适度阈值 0/10/22/38/60 */
  function warmth() {
    const c = comfort();
    if (c >= 60) return 5;
    if (c >= 38) return 4;
    if (c >= 22) return 3;
    if (c >= 10) return 2;
    return 1;
  }

  function buy(id) {
    const f = WV.DATA.furniture[id];
    if (!f) return;
    if (WV.state.furnitureOwned[id]) { WV.S.UI.toast('已经拥有啦'); return; }
    if (!WV.S.Eco.pay(f.price)) return;
    WV.state.furnitureOwned[id] = true;
    WV.S.Journal.addFurniture(id);
    WV.S.UI.toast(`买回了「${f.name}」，去装修模式摆放吧`);
    WV.emit('state:dirty');
  }

  function place(area, id, gx, gy, flip) {
    if (!WV.state.furnitureOwned[id]) return false;
    // 家具摆进所属房间（床不进庭院）
    const fdef = WV.DATA.furniture[id];
    if (fdef && fdef.area && fdef.area !== area) { WV.S.UI.toast(`${fdef.name}应该放在${WV.S.Deco.AREAS[fdef.area].name}哦`); return false; }
    const arr = WV.state.placement[area];
    // 占位检查（每件家具占 1 格，简化）
    const occupied = arr.some(function (f) { return f.x === gx && f.y === gy; });
    if (occupied) { WV.S.UI.toast('这里已经摆了东西'); return false; }
    arr.push({ id: id, x: gx, y: gy, flip: !!flip });
    WV.emit('state:dirty');
    return true;
  }

  function removeAt(area, gx, gy) {
    const arr = WV.state.placement[area];
    const i = arr.findIndex(function (f) { return f.x === gx && f.y === gy; });
    if (i < 0) return;
    arr.splice(i, 1);
    WV.emit('state:dirty');
  }

  S.AREAS = AREAS;
  S.comfort = comfort;
  S.warmth = warmth;
  S.buy = buy;
  S.place = place;
  S.removeAt = removeAt;
  WV.S.Deco = S;
})();
