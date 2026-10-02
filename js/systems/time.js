/**
 * time.js —— 日历/天气/睡觉结算（PRD §3.3）
 * 一年 56 天 = 4 季 × 14 天；天气晴/雨/雪；睡觉推进日。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  function seasonName() { return WV.CONST.SEASONS[WV.seasonIdx()]; }
  function dayLabel() {
    const st = WV.state;
    return `${seasonName()} · 第${WV.dayInSeason()}天`;
  }
  function weatherLabel() {
    return { sunny: '☀ 晴', rain: '🌧 雨', snow: '❄ 雪' }[WV.state.weather] || '';
  }

  /** 明日天气：冬季雪概率高，其余晴为主雨次之（固定种子防刷） */
  function rollWeather(day) {
    const si = Math.floor((day - 1) / 14);
    const r = ((day * 9301 + 49297) % 233280) / 233280; // 伪随机（可复现）
    if (si === 3) return r < 0.35 ? 'snow' : 'sunny';
    return r < 0.2 ? 'rain' : 'sunny';
  }

  /** 睡觉：仅弹结算预览面板（确认后才真正结算，取消无任何副作用，P1 修复） */
  function sleep() {
    const st = WV.state;
    st.freeze = true;
    const bonus = st.energy * WV.CONST.DILIGENT_PER_ENERGY;
    const nextWeather = rollWeather(st.day + 1);
    const income = st._todayEarned || 0, spend_ = st._todaySpent || 0;
    WV.S.UI.sleepPanel({
      day: dayLabel(),
      income: income, spend: spend_, bonus: bonus,
      grown: st.plots.filter(function (p) { return p.state === 'planted' && p.watered && !p.dormant; }).length,
      nextWeather: nextWeather,
      onOk: function () { advanceDay(nextWeather, bonus); },
      onCancel: function () { st.freeze = false; },
    });
  }

  /** 星月夜空转场：text 显示文字，ms 停留时长，then 回调（回调后自动收起遮罩；点击可跳过） */
  function nightTransition(text, ms, then) {
    const tr = document.getElementById('transition');
    // 构建夜空结构（星点伪随机固定布局，避免每次闪烁跳位）
    let stars = '';
    for (let i = 0; i < 24; i++) {
      const x = (i * 137) % 100, y = (i * 61) % 60;
      const d = (i % 5) * 0.3;
      stars += `<i style="left:${x}%;top:${y}%;animation-delay:${d}s"></i>`;
    }
    tr.innerHTML = `<div class="night-sky"><div class="stars">${stars}</div><div class="moon">🌙</div><div class="trans-text">${text}</div></div>`;
    tr.classList.add('show');
    let fired = false;
    const fire = function () {
      if (fired) return;
      fired = true;
      clearTimeout(timer);
      tr.onclick = null;
      then();
      setTimeout(function () { tr.classList.remove('show'); }, 500);
    };
    const timer = setTimeout(fire, ms);
    tr.onclick = fire;   // 点击跳过（PRD §3.2：转场可跳过）
  }

  function advanceDay(nextWeather, bonus) {
    const st = WV.state;
    st.freeze = false;
    st.gold += bonus;
    if (bonus > 0) WV.S.UI.toast(`勤勉奖励 +${bonus} 🪙`);
    st._todayEarned = 0; st._todaySpent = 0;
    st.day += 1;
    st.weather = nextWeather;
    st.energy = WV.CONST.MAX_ENERGY;
    // 作物生长（天气已更新为新一天，雨天判定作用于正确的日子）
    WV.S.Farm.onNewDay();
    WV.emit('state:dirty');

    // 结局判定/年份轮转：冬 14 日睡后（自由模式进入新的一年，季节重新从春开始循环）
    let crossedYear = false;
    if (st.day > 56) {
      if (st.freeMode) {
        st.day = 1;   // 新的一年：季节限定内容可再遇（防 seasonIdx 越界死锁）
        crossedYear = true;
        // D4：自由模式每年重跑结局判定，允许 normal 升级为 true（集齐后补达成）
        // 演出延后到 wake 完成（换季转场+晨间旁白之后），避免与晨间对话穿插
        if (st.ending === 'normal' &&
            st.journal.memories.length >= WV.CONST.TRUE_ENDING.memories &&
            WV.S.Journal.bondCount() >= WV.CONST.TRUE_ENDING.spiritBonds) {
          st.ending = 'true';
          st._endUpgrade = true;
          WV.emit('state:dirty');
        }
        // 跨年清理（D1/D7）：采集点日标记与访客计数按年重置（原实现含 day 编号，跨年冲突且终身 56 次上限）
        Object.keys(st.flags).forEach(function (k) { if (/^g_/.test(k)) delete st.flags[k]; });
        st.lastVisitDay = 0;
        // 注：onSeason 由下方换季演出统一执行（P3-2：跨年也走 seasonTransition）
      }
      else { WV.S.Story.finish(); return; }
    }
    // 季节转场（第 15/29/43 天进入新季；跨年 = 春季，走同一演出）
    const isNewSeason = (((st.day - 1) % 14) === 0 && st.day > 1) || crossedYear;
    const wake = function () {
      WV.Scene.enter('home_bedroom', true);
      st.freeze = false;
      // 晨间旁白（起床提示）
      const greet = ['清晨，鸟鸣把山谷叫醒了。', '阳光透过窗帘，暖洋洋的。', '窗外传来风铃轻轻的声音。', '又是新的一天。'][st.day % 4];
      const rainNote = st.weather === 'rain' ? '\n（下雨了，今天田里的作物会自己喝水 🌱）' :
                       st.weather === 'snow' ? '\n（下雪了，山谷一片洁白 ❄）' : '';
      WV.Dialogue.say([{ speaker: '', text: greet + rainNote + '\n（醒来啦——点击左上角的日期或 💡 可以查看今日建议）' }]);
      // 新一天事件（送信/访客敲门等）
      WV.S.Story.onNewDay();
      WV.S.Visit.onMorning();
      WV.S.Guide.onNewDay();
      WV.S.UI.refreshHud();
      WV.Save.saveNow();
      // 结局升级演出：新一天完全安顿后再播（避免与换季转场/晨间旁白穿插）
      if (st._endUpgrade) {
        st._endUpgrade = false;
        setTimeout(function () {
          WV.S.UI.toast('🔔 集齐了一切——真结局达成！');
          WV.S.Story.replayEnding('true');
        }, 1200);
      }
    };
    if (isNewSeason) {
      WV.S.Story.seasonTransition(WV.seasonIdx(), wake);
    } else {
      nightTransition(`第 ${WV.dayInSeason()} 天 · ${['春', '夏', '秋', '冬'][WV.seasonIdx()]}`, 1300, wake);
    }
  }

  WV.on('hotspot:action', function (h) {
    if (h.hotspot.action === 'sleep') sleep();
  });

  S.nightTransition = nightTransition;   // B1 修复：换季转场必经，此前漏导出导致换季日崩溃
  S.advanceDay = advanceDay;             // 外部/调试调用入口（玩家睡觉走闭包不受影响）
  S.seasonName = seasonName;
  S.dayLabel = dayLabel;
  S.weatherLabel = weatherLabel;
  S.rollWeather = rollWeather;
  S.sleep = sleep;
  WV.S.Time = S;
})();
