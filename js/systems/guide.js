/**
 * guide.js —— 新手引导（PRD §3.8：9 步强引导 + 今日小贴士）
 * guideStep 状态机随剧情推进；前 8 步锁自由行动范围。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  function step() { return WV.state.guideStep; }
  function to(n) {
    WV.state.guideStep = n;
    WV.emit('state:dirty');
    refreshTip();
  }

  /** 开场（进入老屋后）：操作说明 → 柜子回忆（背景故事已由序章交代） */
  function intro() {
    const st = WV.state;
    st.freeze = true;
    WV.Dialogue.say([
      { speaker: '玩法', text: '【操作说明】点击地面任意位置即可走动；点击带标记的门、人物、物品可以互动。发光的圆形箭头是出入口。' },
      { speaker: '玩法', text: '右下角是背包、手账、地图和设置（快捷键 B / J / M / Esc）。对话按空格或点击继续。' },
      { speaker: '', text: '（推开木门，灰尘在光柱里飞舞。屋子空荡荡的，只有屋檐下的旧风铃，被风吹得喑哑作响。）' },
      { speaker: '', text: '（这里到处都是奶奶生活过的痕迹。先看看屋子里的旧柜子吧——就是那个闪着光点的木柜）', cb: function () {
          st.freeze = false;
          to(1);
        } },
    ]);
  }

  /** 每天早晨检查引导推进 */
  function onNewDay() {
    const st = WV.state;
    // step2：睡醒第一觉 → 推进到「去镇街」
    if (step() === 2) to(3);
    // 引导 3 停留过久（错过苏婆婆事件）则直接放行买种子阶段
    if (st.day >= 3 && step() === 3) to(4);
    // 第 3 天起：叮当现身（day>=3，错过也不会永久丢失）
    if (st.day >= 3 && step() < 7) {
      st.freeze = true;
      WV.Dialogue.say([
        { speaker: '', text: '（清晨，屋檐下传来一阵细小的铃铛声）' },
        { speaker: '？？？', text: '叮铃、叮铃铃——！' },
        { speaker: '叮当', text: '你终于来啦！我是叮当，一直住在这枚风铃里。奶奶拜托我，等你回来。' },
        { speaker: '叮当', text: '森林里还有我的伙伴们。把遇见的它们记进「手账」吧——按 J 或者点右下角的书本图标就能打开哦！' },
        { speaker: '', text: '（手账已解锁：精灵图鉴 / 料理食谱 / 家具图鉴 / 回忆相册）', cb: function () {
            st.freeze = false;
            to(8);   // 直接进入自由阶段（手账教学任务按需求移除）
          } },
      ]);
      WV.S.Journal.spiritMet('dingdang');
      WV.S.Journal.spiritBond('dingdang');
    }
    if (st.day >= 4 && step() < 8) to(8); // 完全自由
  }

  /** 热点完成 → 推进引导 */
  WV.on('hotspot:action', function (h) {
    const a = h.hotspot.action;
    if (a === 'recall_1' && step() === 1) {
      WV.S.Journal.addMemory(1);
      to(2);
      // 引导去卧室睡觉
      setTimeout(function () {
        WV.Dialogue.say([{ speaker: '', text: '（走了这么远的山路，累了。去卧室的床上睡一觉吧——走左边的门）' }]);
      }, 900);
    }
  });

  /** 首次睡觉结算面板中提示（由 ui.js sleepPanel 回调 step 6→ 不强推，靠天数推进） */

  /** 种田引导：种下并浇过水 → 进入睡觉阶段（step 5→6） */
  WV.on('farm:did', function (d) {
    const st = WV.state;
    if (st.guideStep !== 5) return;
    const done = st.plots.some(function (p) { return p.state === 'planted' && p.watered; });
    if (done) {
      to(6);
      WV.Dialogue.say([{ speaker: '', text: '（种好啦！记住每天都要浇水哦。忙了一天——回床上睡一觉吧）' }]);
    }
  });

  /** 今日小贴士（优先级链，PRD §3.8-9） */
  function todayTip() {
    const st = WV.state;
    if (st.ending) return '自由模式：想做的事，慢慢做 ✨';
    // 主线事件
    if (st.guideStep === 1) return '看看客厅的旧柜子';
    if (st.guideStep === 2) return '去卧室睡一觉（左边的门）';
    if (st.guideStep === 3) return '跟苏婆婆去镇街买种子吧';
    if (st.guideStep === 4) return '买 2 包土豆种子（40 金币）';
    if (st.guideStep === 5) return '回田园：翻土 → 播种 → 浇水';
    if (st.guideStep === 6) return st.day >= 3 ? '明天屋檐下好像会有小客人来哦' : '体力用完就回去睡觉';
    if (st.day >= 4 && st.guideStep < 8) return '自由探索：想做什么就做什么 ✨';
    // 主线：送信日
    if ([5, 21, 34, 47].indexOf(st.day) >= 0) return '小飞今天会送来奶奶的信';
    // 回忆临近
    if (st.journal.memories.length >= 10) return `再找 ${12 - st.journal.memories.length} 段回忆就能达成真结局`;
    // 待浇水（排除休眠块——非当季作物浇了也不长）
    const dry = st.plots.filter(function (p) { return p.state === 'planted' && !p.watered && !p.dormant; }).length;
    if (dry > 0) return `${dry} 块田还没浇水`;
    // 图鉴临近
    if (Object.keys(st.journal.spirits).length >= 7) return '精灵图鉴快集齐了！';
    // 经营建议
    const tips = ['成熟的作物记得收获', '把作物做成料理能卖更好的价钱', '镇民的支线任务有惊喜', '在老屋客厅点「装修家园」买家具布置，家的温度 2 级以上会有镇民来喝茶做客哦', '送镇民喜欢的料理，好感升得更快'];
    return tips[st.day % tips.length];
  }

  function refreshTip() {
    const el = document.getElementById('tip-text');
    if (el && WV.state) el.textContent = todayTip();
  }

  /** 买种子完成（economy/shop 调用）→ step 4→5 */
  WV.on('guide:seedBought', function () { if (step() === 4) to(5); });

  S.intro = intro; S.onNewDay = onNewDay; S.todayTip = todayTip; S.refreshTip = refreshTip;
  S.to = to; S.step = step;
  WV.S.Guide = S;
})();
