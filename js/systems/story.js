/**
 * story.js —— 主线调度 / 季节转场 / 区域解锁 / 双结局 / 自由模式（PRD §2.3-2.4）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  /** 每天醒来：日期型主线事件（小飞送信等，见 events.js 声明） */
  function onNewDay() {
    scan('day');
  }

  /** 进入场景后：enter 型事件 */
  function onEnterScene() {
    scan('enter');
  }
  WV.on('scene:entered', function () {
    if (WV.state) onEnterScene();
  });

  function scan(kind) {
    const st = WV.state;
    WV.DATA.events.forEach(function (ev) {
      if (ev.once !== false && st.flags['ev_' + ev.id]) return;
      if (ev.type !== kind) return;
      // day 事件：ev.day 为「最早可触发日」，过期未满足条件则之后每天仍可补触发（任务不会静默作废）
      if (kind === 'day' && st.day < ev.day) return;
      if (kind === 'enter' && ev.scene && ev.scene !== WV.Scene.key) return;
      if (kind === 'enter' && ev.day && st.day < ev.day) return;
      if (ev.cond && !ev.cond(st)) return;
      st.flags['ev_' + ev.id] = true;
      ev.run(st);
    });
  }

  /** 季节转场演出（春→夏→秋→冬，星月夜空过场） */
  function seasonTransition(si, done) {
    const names = ['春 · 万物苏醒', '夏 · 蝉鸣悠长', '秋 · 丰收谣', '冬 · 风铃轻响'];
    WV.Audio.playSfx('sfx_jingle_season');
    WV.S.Farm.onSeason();
    // 换季自动学会一道当季料理（降低解锁难度，覆盖 16 道食谱）
    const seasonDish = WV.S.Cook.SEASON_RECIPES[si];
    if (seasonDish) setTimeout(function () { WV.S.Cook.unlock(seasonDish); }, 800);
    WV.S.Time.nightTransition(names[si], 1700, done);
  }

  /** 区域解锁（金币+素材消耗，岩伯施工 1 天，PRD §3.5.2；费用按需求方反馈下调） */
  const UNLOCKS = {
    deep_trail: { cost: 500, items: [['m_lightwood', 5]], label: '修通密林小路', from: 'forest_edge' },
    deep_inner: { cost: 0, items: [], label: '深入密林', from: 'deep_trail' },   // 随小路修通后免费进入
    valley_side: { cost: 800, items: [], label: '修复溪谷木桥', from: 'town_street' },
    valley_up: { cost: 0, items: [], label: '登上溪谷上坡', from: 'valley_side' },
    hill_flower: { cost: 1000, items: [], label: '修复山道', from: 'valley_up' },
    hill_rock: { cost: 0, items: [], label: '登上巨石坡', from: 'hill_flower' },
    // 秘境：冬章（day≥43）且顾先生开启后才能进（day44 事件会直接解锁，此处为提前到达的拦截）
    spirit_realm: { cost: 0, items: [], label: '进入精灵秘境', from: 'hill_rock', minDay: 43 },
  };

  function tryUnlockArea(key) {
    const u = UNLOCKS[key];
    if (!u) return false;
    if (u.cost === 0) {
      if (u.minDay && WV.state.day < u.minDay) {
        WV.Dialogue.say([{ speaker: '', text: '（浓雾深处传来悠远的铃声……似乎还不到时候。等冬天来了再说吧）' }]);
        return false;
      }
      // 秘境还需顾先生支线开启（与 day44 realm_open 事件一致，防提前一天绕过剧情）
      if (key === 'spirit_realm' && (WV.S.NPC.st('gu').stage || 0) < 1) {
        WV.Dialogue.say([{ speaker: '', text: '（巨石之后雾气浓重，怎么也走不进去……也许镇志里藏着线索？去旧书铺找顾先生聊聊吧）' }]);
        return false;
      }
      if (WV.state.areas.indexOf(key) >= 0) return true;   // P3 修复：重复 push 防御前置
      WV.state.areas.push(key);
      return true;
    }
    if (WV.state.areas.indexOf(key) >= 0) return true;
    // 材料检查
    const missing = u.items.filter(function (m) { return WV.S.Inv.count(m[0]) < m[1]; });
    if (missing.length) {
      WV.Dialogue.say([{ speaker: '岩伯', text: `还差些材料——${missing.map(function (m) { return (WV.DATA.items[m[0]] || {}).name + '×' + m[1]; }).join('、')}。森林里应该找得到。` }]);
      return false;
    }
    if (!WV.S.Eco.pay(u.cost)) return false;
    u.items.forEach(function (m) { WV.S.Inv.remove(m[0], m[1]); });
    WV.state.areas.push(key);
    WV.Dialogue.say([
      { speaker: '岩伯', text: '好嘞，看我的手艺。' },
      { speaker: '', text: '（叮叮当当一整天——第二天，路修好了！）' },
      { speaker: '', text: `新区域解锁：${WV.DATA.scenes[key].name}`, cb: function () { WV.S.NPC.advance('yanbo'); } },
    ]);
    return true;
  }

  // 传送门统一拦截：所有 goto_ 到达热点都经此（P0-3：scene.js 不再直通 enter）
  WV.on('hotspot:action', function (h) {
    const a = h.hotspot.action;
    if (a && a.indexOf('goto_') === 0) {
      const to = a.slice(5);
      if (!WV.DATA.scenes[to]) { console.warn('[story] 未知场景', to); return; }
      if (WV.state.areas.indexOf(to) >= 0) { WV.Scene.enter(to); return; }   // 已解锁：放行
      const u = UNLOCKS[to];
      if (!u) { WV.S.UI.toast('现在还过不去呢'); return; }
      if (u.cost === 0) {
        // 免费区域：直接判定（含秘境的剧情时间条件）
        const ok = tryUnlockArea(to);
        if (ok) WV.Scene.enter(to);
        return;
      }
      WV.state.freeze = true;
      WV.Dialogue.say([{
        speaker: '', text: `（前面的路断了。${u.label}需要：${u.cost} 金币${u.items.length ? ' + ' + u.items.map(function (m) { return (WV.DATA.items[m[0]] || {}).name + '×' + m[1]; }).join('、') : ''}）`,
        choices: [
          { text: '请岩伯来修', cb: function () {
              const ok = tryUnlockArea(to);
              WV.state.freeze = false;
              if (ok) WV.Scene.enter(to);
            } },
          { text: '再等等', cb: function () { WV.state.freeze = false; } },
        ],
      }]);
    }
  });

  /** 结局判定与演出（PRD §2.3；分页文字剧场：逐行浮现 + 专属粒子/背景 + 标题页） */
  function finish() {
    const st = WV.state;
    const trueEnd = st.journal.memories.length >= WV.CONST.TRUE_ENDING.memories &&
                    WV.S.Journal.bondCount() >= WV.CONST.TRUE_ENDING.spiritBonds;
    st.ending = trueEnd ? 'true' : 'normal';
    st.freeMode = true;
    st.freeze = true;
    playEnding(st.ending, function () {
      st.freeze = false;
      st.day = 1; // 自由模式：季节继续轮转
      WV.S.UI.refreshHud();
      WV.S.UI.toast('自由模式：季节继续流转，把图鉴补完吧 ✨');
      WV.Scene.enter('court', true);
      WV.emit('state:dirty');
    });
    WV.emit('state:dirty');
  }

  /** 结局分页演出（bgm/背景/粒子按结局分化；空格或点击翻页；replay=true 为回顾模式，不改游戏状态） */
  function playEnding(kind, done, replay) {
    const E = WV.DATA.endings[kind];
    const el = document.getElementById('ending');
    // 粒子层（普通：落樱；真：上升光尘）
    let particles = '';
    for (let i = 0; i < 14; i++) {
      const left = (i * 7.3 + (i % 3) * 9) % 100;
      if (kind === 'normal') {
        const dur = 6 + (i % 4) * 1.6, delay = -(i * 0.9) % dur;
        particles += `<span class="ep" style="left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s">🌸</span>`;
      } else {
        const dur = 5 + (i % 5) * 1.4, delay = -(i * 1.1) % dur;
        particles += `<span class="ep" style="left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
      }
    }
    el.className = kind === 'true' ? 'ending-true' : 'ending-normal';
    el.innerHTML = particles + '<div class="e-page" id="e-page"></div><div class="e-next" id="e-next">点击继续 ▼</div>';
    el.classList.remove('hidden');
    WV.Audio.playBgm(E.bgm);
    WV.Audio.playSfx('sfx_jingle_season');
    let idx = -1;
    const page = document.getElementById('e-page');
    const nextHint = document.getElementById('e-next');
    function showPage() {
      idx++;
      if (idx < E.pages.length) {
        const lines = E.pages[idx].map((t, li) =>
          `<div class="e-line" style="animation-delay:${li * 0.42}s">${t || '&nbsp;'}</div>`).join('');
        page.innerHTML = lines;
        WV.Audio.playSfx('sfx_click2');
        return;
      }
      // 尾页：标题演出
      nextHint.style.display = 'none';
      page.innerHTML = `
        <div class="e-bell">🎐</div>
        <div class="e-title">${E.title}</div>
        <div class="e-sub">${E.sub}</div>
        <div class="e-note">${replay ? '（结局回顾）' : E.note}</div>
        <button class="btn-title" id="ending-ok">${replay ? '回到游戏' : '继续山谷的生活（自由模式）'}</button>`;
      WV.Audio.playSfx('sfx_jingle_achieve');
      document.getElementById('ending-ok').onclick = function (e) {
        if (e && e.stopPropagation) e.stopPropagation();   // 防冒泡触发层上的 advance（回顾后点击失效的根源）
        window.removeEventListener('keydown', keyHijack);  // 键盘监听同步移除
        el.classList.add('hidden');
        el.innerHTML = '';
        el.className = 'hidden';   // 保持隐藏而非清空（避免空层残留）
        if (done) done();
      };
    }
    function advance() {
      if (el.classList.contains('hidden')) return;   // 已收起则忽略
      if (document.getElementById('ending-ok')) return; // 尾页等待按钮
      showPage();
    }
    el.onclick = advance;
    const keyHijack = function (e) {
      if ((e.code === 'Space' || e.code === 'Enter') && !el.classList.contains('hidden')) {
        e.preventDefault();
        advance();
      }
      if (el.classList.contains('hidden')) window.removeEventListener('keydown', keyHijack);
    };
    window.addEventListener('keydown', keyHijack);
    showPage();
  }

  /** 自由模式结局回顾（不改状态） */
  function replayEnding(kind) {
    playEnding(kind, function () { WV.emit('scene:enter', WV.Scene.def); }, true);
  }

  /** 快进调试：跳到某天（保留状态）；>56 直接触发结局判定 */
  WV.debug.skipTo = function (day) {
    const st = WV.state;
    if (day > 56) {
      st.day = 56;
      st.energy = WV.CONST.MAX_ENERGY;
      st.weather = WV.S.Time.rollWeather(56);
      WV.S.UI.refreshHud();
      finish();   // 与睡满 56 天走同一结局判定
      return;
    }
    st.day = day;
    st.energy = WV.CONST.MAX_ENERGY;
    st.weather = WV.S.Time.rollWeather(day);
    WV.Scene.enter('court', true);
    WV.S.UI.refreshHud();
    console.log('已跳到', WV.S.Time.dayLabel());
  };

  /** 查询某区域的解锁条件（地图提示用） */
  function unlockInfo(key) { return UNLOCKS[key] || null; }

  S.onNewDay = onNewDay;
  S.onEnterScene = onEnterScene;
  S.seasonTransition = seasonTransition;
  S.tryUnlockArea = tryUnlockArea;
  S.unlockInfo = unlockInfo;
  S.finish = finish;
  S.replayEnding = replayEnding;
  WV.S.Story = S;
})();
