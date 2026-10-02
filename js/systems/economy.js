/**
 * economy.js —— 金币与买卖（PRD §3.7）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  function earn(n, x, y) {
    const st = WV.state;
    st.gold += n;
    st._todayEarned = (st._todayEarned || 0) + n;
    st.stats.earned += n;
    WV.Fx.coinText(x || 192, (y || 110) - 8, '+' + n);
    WV.Audio.playSfx('sfx_coin');
    WV.emit('hud:refresh');
    WV.emit('state:dirty');
  }

  function pay(n) {
    const st = WV.state;
    if (st.gold < n) { WV.S.UI.toast('金币不够呢…先卖点东西吧'); return false; }
    st.gold -= n;
    st._todaySpent = (st._todaySpent || 0) + n;
    st.stats.spent += n;
    WV.Audio.playSfx('sfx_coin2');
    WV.emit('hud:refresh');
    WV.emit('state:dirty');
    return true;
  }

  S.earn = earn; S.pay = pay;
  WV.S.Eco = S;
})();
