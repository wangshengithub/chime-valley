/**
 * cook.js —— 料理手作（PRD §3.4.2）
 * 食谱解锁 / 材料检查 / 大成功 / 隐藏食谱。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  /** 解锁渠道表：季节（换季自动学）与 NPC（好感满级传授拿手菜），保证 16 道全部有来源 */
  S.SEASON_RECIPES = { 1: 'cold_soup', 2: 'soup', 3: 'hot_pot' };
  S.NPC_RECIPES = {
    granny_su: 'cake', xiaofei: 'corn_bake', huahua: 'chestnut',
    yanbo: 'bake_roots', gu: 'tofu_stew', doudou: 'summer_bowl',
  };

  function recipes() { return WV.state.recipes; }

  function unlock(id, silent) {
    if (WV.state.recipes.indexOf(id) >= 0) return;
    WV.state.recipes.push(id);
    WV.emit('state:dirty');
    if (!silent) {
      const r = WV.DATA.recipes[id];
      WV.S.UI.toast(`学会新料理：${r.name}！`);
      WV.Audio.playSfx('sfx_confirm');
    }
  }

  /** 材料是否齐备 */
  function canMake(id) {
    const r = WV.DATA.recipes[id];
    if (!r) return false;
    return r.materials.every(function (m) { return WV.S.Inv.count(m[0]) >= m[1]; });
  }

  function make(id) {
    const r = WV.DATA.recipes[id];
    if (!r) return;
    if (!canMake(id)) { WV.S.UI.toast('材料还不够呢，去田园和森林找找吧'); return; }
    if (!WV.S.Energy.spend(1)) return;
    // 材料消耗与产出立即结算（动画仅演出，被打断不丢失，P1 修复）
    r.materials.forEach(function (m) { WV.S.Inv.remove(m[0], m[1]); });
    const bigSuccess = Math.random() < (WV.state.flags.dish_all ? 0.4 : 0.25);   // 食谱集齐奖励：大成功率提升（PRD §3.6）
    const n = bigSuccess ? 3 : (1 + (Math.random() < 0.4 ? 1 : 0));
    WV.S.Inv.add('d_' + id, n, true);   // 静默入库：提示/特效由下方统一播报（防双 toast）
    WV.state.dishesCooked[id] = (WV.state.dishesCooked[id] || 0) + n;
    WV.state.stats.cooked += n;
    WV.S.Journal.addDish(id);
    WV.Audio.playSfx('sfx_pot');
    if (bigSuccess) {
      WV.S.UI.toast(`大成功！${r.name} ×3 ✨`);
      WV.Fx.stars(WV.Scene.heroine.x, WV.Scene.heroine.y - 40);
    } else {
      WV.S.UI.toast(`${r.name} 做好了（×${n}）`);
    }
    WV.emit('state:dirty');
    WV.Scene.playAction('doing', function () {});
    if (WV.S.UI.isPanelOpen()) WV.S.UI.cookPanel(); // 面板仍开着才刷新
  }

  WV.on('hotspot:action', function (h) {
    if (h.hotspot.action === 'cooking') {
      if (!WV.S.Energy.checkOrHint(1)) return;
      WV.S.UI.cookPanel();
    } else if (h.hotspot.action === 'cooking_table') {
      // 料理台：翻看食谱图鉴（与灶台做料理区分用途）
      WV.S.UI.journalPanel('dishes');
    }
  });

  S.unlock = unlock; S.canMake = canMake; S.make = make;
  S.list = recipes;
  WV.S.Cook = S;
})();
