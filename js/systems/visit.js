/**
 * visit.js —— 招待访客（PRD §3.4.4）
 * 家的温度≥2 时，晨间 40% 概率镇民敲门（可婉拒，无惩罚）。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};
  const VISITORS = ['granny_su', 'maiqi', 'huahua', 'xiaofei', 'doudou', 'gu'];

  function onMorning() {
    const st = WV.state;
    const warmthLv = WV.S.Deco.warmth();
    if (warmthLv < 2) return;
    if (st.guideStep < 8) return; // 引导完成后才来访（引导最高 step=8）
    // 首次达到温度 2 级：预告（一次性）
    if (!st.flags.visit_hint) {
      st.flags.visit_hint = true;
      WV.S.UI.toast('家里变得温暖了——接下来的日子，会有镇民来敲门做客哦 🌷');
    }
    // 来访概率随家的温度递增：lv2=20% / lv3=40% / lv4=60% / lv5=80%（lv1 不触发）
    const chance = { 2: 0.2, 3: 0.4, 4: 0.6, 5: 0.8 }[warmthLv] || 0;
    const r = ((st.day * 7919) % 100) / 100;
    // 保底：连续 4 天没来则必来
    const sinceLast = st.day - (st.lastVisitDay || 0);
    if (r > chance && sinceLast < 4) return;
    st.lastVisitDay = st.day;
    const cands = VISITORS.slice();
    const who = cands[st.day % cands.length];
    const info = WV.DATA.npcs[who] || { name: '镇民' };
    st.freeze = true;
    WV.Dialogue.say([
      { speaker: '', text: '（咚咚——有人敲门）' },
      { speaker: info.name, text: '早上好呀！路过闻到你家的味道，能进来坐坐吗？' },
      {
        text: '',
        choices: [
          { text: '快请进！', cb: function () { host(who, warmthLv); } },
          { text: '今天有点忙，下次一定', cb: function () {
              WV.Dialogue.say([{ speaker: info.name, text: '好呀好呀，那下次再来看你！' }]);
              st.freeze = false;
            } },
        ],
      },
    ]);
  }

  function host(who, warmthLv) {
    const st = WV.state;
    const info = WV.DATA.npcs[who] || { name: '镇民' };
    const dish = bestDish();
    const lines = [];
    lines.push({ speaker: '', text: `（你把${info.name}迎进了客厅，泡了一壶热茶）` });
    if (dish) {
      WV.S.Inv.remove(dish.id, 1);
      lines.push({ speaker: info.name, text: `这个${dish.name}也太好吃了！${warmthLv >= 4 ? '你家真是越来越温暖了呢。' : '下次我还来！'}` });
    } else {
      lines.push({ speaker: info.name, text: '茶很香，和你聊天真开心。' });
    }
    // 回礼
    const gift = rollGift();
    const g = WV.DATA.items[gift.id];
    WV.S.Inv.add(gift.id, gift.n);
    WV.S.NPC.addFavor(who, 0.5);
    st.stats.visited += 1;
    lines.push({ speaker: info.name, text: `这个送你——${g ? g.name : '一点小心意'} ×${gift.n}，谢谢你招待我！` });
    lines.push({ speaker: '', text: `（${info.name} 满足地道别了。好感度提升了）`, cb: function () { st.freeze = false; } });
    WV.Dialogue.say(lines);
    WV.Audio.playSfx('sfx_confirm2');
  }

  function bestDish() {
    // 送出库存中品质（售价）最高的料理；剧情物（价格 0，如蜂蜜蛋糕）绝不送出
    let best = null;
    WV.S.Inv.list('d').forEach(function (it) {
      const r = WV.DATA.recipes[it.id.slice(2)];
      if (!r || r.price <= 0) return;
      if (!best || r.price > best.price) best = { id: it.id, name: r.name, price: r.price };
    });
    return best;
  }

  function rollGift() {
    const pool = ['m_egg', 'm_milk', 'm_honey', 'm_flour', 'm_pebble'];
    const id = pool[(WV.state.day * 3) % pool.length];
    return { id: id, n: 1 + (WV.state.day % 2) };
  }

  S.onMorning = onMorning;
  WV.S.Visit = S;
})();
