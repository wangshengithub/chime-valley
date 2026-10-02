/**
 * npc.js —— 好感与支线（PRD §2.4.2：温暖群像，无恋爱）
 * 好感 3 级（0→2，进度 0-2 每 1.0 升级）；送礼（料理）/支线任务/拜访提升。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};
  const FAVOR_MAX = 2.999;

  function info(id) { return WV.DATA.npcs[id] || {}; }
  function st(id) {
    if (!WV.state.npc[id]) WV.state.npc[id] = { favor: 0, stage: 0, gifts: 0 };
    return WV.state.npc[id];
  }

  function favorLv(id) { return Math.min(2, Math.floor(st(id).favor)); }

  function addFavor(id, n) {
    const s = st(id);
    const before = Math.min(2, Math.floor(s.favor));
    s.favor = Math.min(FAVOR_MAX, s.favor + n);
    const after = Math.min(2, Math.floor(s.favor));
    if (after > before) {
      const flower = ['🌱', '🌷', '🌸'][after];
      WV.S.UI.toast(`${info(id).name} 的好感提升了 ${flower}`);
      WV.emit('state:dirty');
      // 好感满级：传授拿手菜（食谱解锁渠道之一；同步落状态防关页竞态，仅提示延迟）
      if (after === 2) {
        const dish = WV.S.Cook.NPC_RECIPES[id];
        if (dish && WV.state.recipes.indexOf(dish) < 0) {
          WV.S.Cook.unlock(dish, true);
          const rname = (WV.DATA.recipes[dish] || {}).name || dish;
          setTimeout(function () { WV.S.UI.toast(`${info(id).name} 把「${rname}」的做法教给了你 🍳`); }, 900);
        }
      }
    }
  }

  /** 送礼：料理（每日每人 1 次有效） */
  function gift(id, dishId) {
    const s = st(id);
    if (s.giftDay === WV.state.day) { WV.S.UI.toast('今天已经送过礼物啦，明天再来'); return; }
    if (!WV.S.Inv.remove(dishId, 1)) return;
    s.giftDay = WV.state.day;
    s.gifts += 1;
    WV.state.stats.gifted += 1;
    const like = (info(id).likes || []).indexOf(dishId.slice(2)) >= 0;
    addFavor(id, like ? 1 : 0.5);
    const r = WV.DATA.recipes[dishId.slice(2)];
    WV.Dialogue.say([{
      speaker: info(id).name,
      text: like ? `${r.name}？！你怎么知道我喜欢这个！谢谢你呀。` : `是${r.name}呀，谢谢你，看起来很好吃。`,
    }]);
    WV.emit('state:dirty');
  }

  /** 与 NPC 对话（点击场景 NPC 由 scene.js 派发 hotspot:npc_{id} 或热点对话） */
  function talk(id) {
    const inf = info(id);
    const lv = favorLv(id);
    const D = WV.DATA.dialogues;
    // 支线优先（stage 推进由 events/story 处理，这里走闲聊+支线提示）
    const chat = (D.chats[id] && D.chats[id][lv]) || (D.chats[id] && D.chats[id][0]) || [{ speaker: inf.name, text: '今天天气真好啊。' }];
    WV.Dialogue.say(chat);
    // 好感：每人每日首次聊天有效（防连点刷满）
    const s = st(id);
    if (s.talkDay !== WV.state.day) { s.talkDay = WV.state.day; addFavor(id, 0.25); }
  }

  /** 支线阶段推进（story/events 调用） */
  function advance(id) {
    const s = st(id);
    s.stage += 1;
    addFavor(id, 1);
    WV.emit('state:dirty');
  }

  // NPC 站位注册为场景热点（hover 显示名字 + 星光标记；点击后走到面前再对话）
  // 注：站位 y 为脚底锚点、角色贴图高 32px，热点中心对准身体中部（y-16 附近）
  WV.on('scene:entered', function () {
    const def = WV.Scene.def;
    if (!def || !def.hotspots) return;
    def.hotspots = def.hotspots.filter(function (h) { return !/^npc_/.test(h.action || ''); });
    (def.npcs || []).forEach(function (n) {
      const inf = WV.DATA.npcs[n.id];
      if (!inf) return;
      def.hotspots.push({ name: inf.name, x: n.x, y: n.y - 14, r: 17, action: 'npc_' + n.id });
    });
  });

  // 到达 NPC 热点 → 互动菜单
  WV.on('hotspot:action', function (h) {
    const a = h.hotspot.action;
    if (/^npc_/.test(a)) talkWithMenu(a.slice(4));
  });

  function talkWithMenu(id) {
    const inf = info(id);
    const dish = bestGiftCandidate(inf);
    const hasFlower = WV.S.Inv.count('m_flower') > 0;
    const choices = [];
    if (dish) choices.push({ text: `送出 ${dish.name}`, cb: function () { gift(id, dish.id); } });
    if (hasFlower) choices.push({ text: '送一朵山花 🌸', cb: function () { giftFlower(id); } });
    choices.push({ text: '聊聊天', cb: function () { talk(id); } });
    choices.push({ text: '先这样', cb: function () {} });
    WV.Dialogue.say([{ speaker: inf.name, text: `呀，${WV.state.name}！有什么事吗？`, choices: choices }]);
  }

  /** 送花：轻礼物（豆豆最喜欢花） */
  function giftFlower(id) {
    const s = st(id);
    if (s.giftDay === WV.state.day) { WV.S.UI.toast('今天已经送过礼物啦，明天再来'); return; }
    if (!WV.S.Inv.remove('m_flower', 1)) return;
    s.giftDay = WV.state.day;
    s.gifts += 1;
    WV.state.stats.gifted += 1;
    const isDoudou = id === 'doudou';
    addFavor(id, isDoudou ? 0.8 : 0.3);
    WV.Dialogue.say([{
      speaker: info(id).name,
      text: isDoudou ? '哇——花！超级漂亮！！（豆豆把花别在了头上）' : '呀，好漂亮的花，谢谢你呀。',
    }]);
    WV.emit('state:dirty');
  }

  function bestGiftCandidate(inf) {
    let best = null;
    WV.S.Inv.list('d').forEach(function (it) {
      const rid = it.id.slice(2);
      const r = WV.DATA.recipes[rid];
      const liked = (inf.likes || []).indexOf(rid) >= 0;
      if (!best || (liked && !best.liked)) best = { id: it.id, name: r.name, liked: liked };
    });
    return best;
  }

  S.talk = talk; S.gift = gift; S.giftFlower = giftFlower; S.addFavor = addFavor; S.advance = advance;
  S.favorLv = favorLv; S.st = st;
  WV.S.NPC = S;
})();
