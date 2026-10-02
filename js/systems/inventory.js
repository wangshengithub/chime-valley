/**
 * inventory.js —— 背包（四类前缀：c_作物 m_素材 d_料理 k_关键物品）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  /** 入包；silent=true 时不播提示（由调用方自行播报，避免双 toast） */
  function add(id, n, silent) {
    const inv = WV.state.inventory;
    n = n || 1;
    if (!inv[id]) inv[id] = { n: 0 };
    inv[id].n += n;
    WV.emit('state:dirty');
    if (!silent) {
      WV.S.UI.toast(`获得 ${WV.itemName(id)} ×${n}`);
      WV.Fx.stars(WV.Scene.heroine.x, WV.Scene.heroine.y - 30);
      WV.Audio.playSfx('sfx_pluck');
    }
  }

  function remove(id, n) {
    const inv = WV.state.inventory;
    n = n || 1;
    if (!inv[id] || inv[id].n < n) return false;
    inv[id].n -= n;
    if (inv[id].n <= 0) delete inv[id];
    WV.emit('state:dirty');
    return true;
  }

  function count(id) {
    const it = WV.state.inventory[id];
    return it ? it.n : 0;
  }

  /** 分类列举：kind in ['c','m','d','k']（过滤零数量残留） */
  function list(kind) {
    const out = [];
    Object.keys(WV.state.inventory).forEach(function (id) {
      const it = WV.state.inventory[id];
      if (!it || it.n <= 0) { delete WV.state.inventory[id]; return; }
      if (!kind || id[0] === kind) out.push({ id: id, n: it.n, def: WV.DATA.items[id] || { name: id } });
    });
    return out;
  }

  S.add = add; S.remove = remove; S.count = count; S.list = list;
  WV.S.Inv = S;
})();
