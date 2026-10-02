/**
 * energy.js —— 体力系统（PRD §3.3：每日 10 点，无任何惩罚）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  function spend(n) {
    const st = WV.state;
    if (st.energy < n) {
      WV.S.UI.toast('今天有点累了，回去睡个觉吧 💤');
      return false;
    }
    st.energy -= n;
    WV.emit('state:dirty');
    WV.emit('hud:refresh');
    if (st.energy === 0) {
      WV.S.UI.toast('体力用完了——不过没关系，什么都不会发生，好好休息吧 💤');
    } else if (st.energy <= 2) {
      WV.S.UI.toast('体力不多了，留意今晚早点休息哦');
    }
    return true;
  }

  /** 0 体力行动兜底：仍允许 0 点行动（对话/购物等系统自行不调 spend） */
  S.spend = spend;
  S.get = function () { return WV.state.energy; };
  /** 打开面板前的体力检查（不消耗，仅提示） */
  S.checkOrHint = function (n) {
    if (WV.state.energy < n) {
      WV.S.UI.toast('今天有点累了，回去睡个觉吧 💤');
      return false;
    }
    return true;
  };
  WV.S.Energy = S;
})();
