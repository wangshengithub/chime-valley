/**
 * events.js —— 主线与支线事件调度表（story.js 扫描）
 * type: 'day'（日期触发，醒来后）/ 'enter'（进入场景）
 * once 默认 true（flags 防重）
 */
(function () {
  'use strict';
  const WV = window.WV;
  const E = [];
  const D = function (items) { WV.Dialogue.say(items); };

  // ---------- 小飞送信（回忆 2/6/9/11，PRD §2.4.4） ----------
  const LETTERS = [
    [5, 2, '春', '「春天的风把信送来啦！你奶奶寄存在我这儿的，说好了一年里分四次给你。——小飞」'],
    [21, 6, '夏', '「夏天到了，信也到啦！你奶奶真厉害，连哪天下雨都算得准。——小飞」'],
    [34, 9, '秋', '「秋天的信！附赠一片我从山丘捡的红叶，不用谢。——小飞」'],
    [47, 11, '冬', '「最后一封……小心点拆，感觉这封很重要。——小飞」'],
  ];
  LETTERS.forEach(function (L) {
    E.push({
      id: 'letter_' + L[0], type: 'day', day: L[0],
      run: function (st) {
        st.freeze = true;
        D([
          { speaker: '', text: '（咚咚咚——一大早，有人敲响了门）' },
          { speaker: '小飞', text: '早上好！你的信！——是你奶奶的，她一年前就寄存在我这儿了。' },
          { speaker: '奶奶的信', text: L[3] },
        ].concat([{ speaker: '', text: '（回忆相册 +1）', cb: function () {
            st.freeze = false;
            WV.S.Journal.addMemory(L[1]);
            WV.S.NPC.addFavor('xiaofei', 0.5);
          } }]));
      },
    });
  });

  // ---------- 开场次日：苏婆婆带逛镇街（引导 step 2→4，PRD §3.8；3 天窗口，过时不补演） ----------
  E.push({
    id: 'intro_town', type: 'day', day: 2,
    cond: function (st) { return st.day <= 4; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '', text: '（咚咚咚——）' },
        { speaker: '苏婆婆', text: '小姑娘醒啦！我是山下杂货店的苏婆婆，你奶奶的老姐妹！' },
        { speaker: '苏婆婆', text: '来，跟婆婆下山——种子、工具、面包，要置办的东西多着呢！' },
        { speaker: '', text: '（跟着苏婆婆，第一次走进了风铃谷的镇街）', cb: function () {
            st.freeze = false;
            WV.Scene.enter('town_street');
            WV.S.Guide.to(4);
          } },
      ]);
    },
  });

  // ---------- 回忆 #3：生锈的浇花壶（累计翻土 10 格，PRD §2.4.4） ----------
  E.push({
    id: 'recall_hoe', type: 'day', day: 8,
    cond: function (st) {
      return st.plots.filter(function (p) { return p.unlocked && p.state !== 'wild'; }).length >= 10;
    },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '', text: '（翻整最后一块荒田时，锄头碰到了什么硬东西——）' },
        { speaker: '', text: '（土里埋着一把生锈的旧浇花壶，壶底刻着一行小字）', cb: function () {
            st.freeze = false;
            WV.S.Journal.addMemory(3);
          } },
      ]);
    },
  });

  // ---------- 苏婆婆支线：盘点（好感≥0.3 且 day≥6） ----------
  E.push({
    id: 'quest_su', type: 'day', day: 6,
    cond: function (st) { return (WV.S.NPC.st('granny_su').favor >= 0.3); },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '苏婆婆', text: '闺女，帮婆婆盘个账呗？就一回！我这老花镜一摘就抓瞎。' },
        { speaker: '', text: '（你帮苏婆婆清点了一下午的货架）' },
        { speaker: '苏婆婆', text: '哎哟，真能干！这个给你——你奶奶的围裙，她要是看见你系上，准高兴。', cb: function () {
            st.freeze = false;
            WV.S.NPC.advance('granny_su');
            WV.S.Journal.addMemory(4);
          } },
      ]);
    },
  });

  // ---------- 豆豆支线：树屋（day≥8 好感≥1） ----------
  E.push({
    id: 'quest_doudou', type: 'day', day: 8,
    cond: function (st) { return WV.S.NPC.st('doudou').favor >= 0.5; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '豆豆', text: '秘密基地搭好啦！就在森林边的大树上！' },
        { speaker: '豆豆', text: '以后你去森林，从我家院子走就行——近多啦！' },
        { speaker: '', text: '（解锁：庭院 ⇄ 森林边缘 的快速通道在地图上可直达啦）', cb: function () {
            st.freeze = false;
            WV.S.NPC.advance('doudou');
            st.flags.treehouse = true;
          } },
      ]);
    },
  });

  // ---------- 小飞支线：笔友（day≥12 好感≥1） ----------
  E.push({
    id: 'quest_xiaofei', type: 'day', day: 12,
    cond: function (st) { return WV.S.NPC.st('xiaofei').favor >= 1; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '小飞', text: '那个……你能帮我去后山打听一下吗？我的笔友半年没回信了。' },
        { speaker: '', text: '（你托进山采购的猎户捎了句话。一周后——）' },
        { speaker: '小飞', text: '回信了！原来护林站整体搬家了！哈哈，太好了！！谢谢你！！', cb: function () {
            st.freeze = false;
            WV.S.NPC.advance('xiaofei');
          } },
      ]);
    },
  });

  // ---------- 花花阿姨支线：走丢的小鸡（day≥10） ----------
  E.push({
    id: 'quest_huahua', type: 'enter', scene: 'ranch', day: 10,
    cond: function (st) { return st.day >= 10; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '花花阿姨', text: '哎哟愁死俺了！三只小鸡钻进森林找不着了！' },
        { speaker: '', text: '（你在森林边缘找了一个下午，把三只毛团子一只只抱了回来）' },
        { speaker: '花花阿姨', text: '哎哟我的小祖宗们！姑娘，太谢谢你了！', cb: function () {
            st.freeze = false;
            WV.S.NPC.advance('huahua');
          } },
      ]);
    },
  });

  // ---------- 麦琪支线：清晨的食材（day≥16 送过料理）→ 回忆#8 + 隐藏食谱 ----------
  E.push({
    id: 'quest_maiqi', type: 'day', day: 16,
    cond: function (st) { return st.stats.gifted >= 1; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '麦琪', text: '这几天收到的菜都新鲜得会唱歌！姐姐说话算话——教你一道我的看家甜点！' },
        { speaker: '', text: '（麦琪手把手教了你蛋奶舒芙蕾的秘诀，还从柜子里取出一本手写食谱册）' },
        { speaker: '麦琪', text: '这个给你——你奶奶的食谱册，她说过要留给「会做饭的那个人」。', cb: function () {
            st.freeze = false;
            WV.S.NPC.advance('maiqi');
            WV.S.Cook.unlock('souffle', true);
            WV.S.Cook.unlock('honey_cake', true);
            WV.S.UI.toast('学会料理：蛋奶舒芙蕾、奶奶的蜂蜜蛋糕！');
            WV.S.Journal.addMemory(8);
          } },
      ]);
    },
  });

  // ---------- 岩伯支线：最后一次活儿（day≥20 有轻木×3；晨间询问而非自动消耗，防吃掉修路存料） ----------
  E.push({
    id: 'quest_yanbo', type: 'day', day: 20,
    cond: function (st) { return WV.S.Inv.count('m_lightwood') >= 3; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '岩伯', text: '这轻木……是好料。给我三根，帮你奶奶了桩旧心愿。', choices: [
          { text: '给他三根轻木', cb: function () {
              WV.S.Inv.remove('m_lightwood', 3);
              D([
                { speaker: '', text: '（叮叮当当——一枚小巧的木铃铛在他掌心里转了出来）' },
                { speaker: '岩伯', text: '你奶奶五十岁那年，我打了三次都没打成。今天，成了。——收着吧。', cb: function () {
                    st.freeze = false;
                    WV.S.NPC.advance('yanbo');
                    WV.S.Journal.addMemory(7);
                    // 剧情家具：奶奶的摇椅随木铃铛一并交付（P1-2：家具图鉴 24/24 可达成）
                    st.furnitureOwned.f_rocker = true;
                    WV.S.Journal.addFurniture('f_rocker');
                    WV.S.UI.toast('获得了「奶奶的摇椅」，去客厅摆放吧');
                  } },
              ]);
            } },
          { text: '先留着修路（需要 5 根）', cb: function () {
              st.freeze = false;
              delete st.flags.ev_quest_yanbo;   // 拒绝不烧标记：修完路凑齐材料后次日还会再问（防回忆#7 死锁）
              WV.Dialogue.say([{ speaker: '岩伯', text: '……嗯，路要紧。木头的事，不急。' }]);
            } },
        ] },
      ]);
    },
  });

  // ---------- 顾先生支线：镇志（day≥30 好感≥1） ----------
  E.push({
    id: 'quest_gu', type: 'day', day: 30,
    cond: function (st) { return WV.S.NPC.st('gu').favor >= 1; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '顾先生', text: '镇志的批注整理得如何？……不急，来，先看看这张。' },
        { speaker: '', text: '（顾先生从镇志的夹层里，取出一张泛黄的老照片）' },
        { speaker: '顾先生', text: '风铃祭，四十年前。左边第三个，是你奶奶。看，她笑得多亮。', cb: function () {
            st.freeze = false;
            WV.S.NPC.advance('gu');
            WV.S.Journal.addMemory(10);
          } },
      ]);
    },
  });

  // ---------- 秘境开启（冬 且 顾先生支线完成） ----------
  E.push({
    id: 'realm_open', type: 'day', day: 44,
    cond: function (st) { return WV.S.NPC.st('gu').stage >= 1; },
    run: function (st) {
      if (st.areas.indexOf('hill_rock') < 0) st.areas.push('hill_rock');
      if (st.areas.indexOf('spirit_realm') < 0) st.areas.push('spirit_realm');
      st.freeze = true;
      D([
        { speaker: '', text: '（清晨，门缝下压着一张字条）' },
        { speaker: '顾先生', text: '「镇志最后一页：「冬至前，石开路现。」山丘深处，老朽等你。——顾」' },
        { speaker: '', text: '（字条下面，还压着一枚小巧的许愿风铃——是顾先生年轻时从风铃祭带回来的）', cb: function () {
            st.freeze = false;
            st.furnitureOwned.f_wishbell = true;   // 剧情家具：许愿风铃（P1-2）
            WV.S.Journal.addFurniture('f_wishbell');
            WV.S.UI.toast('获得了「许愿风铃」，去庭院摆放吧');
          } },
      ]);
    },
  });

  // ---------- 里程碑提示 ----------
  E.push({
    id: 'memory_hint', type: 'day', day: 50,
    cond: function (st) { return st.journal.memories.length < 12; },
    run: function (st) {
      st.freeze = true;
      D([
        { speaker: '叮当', text: '风铃节快到了……还有回忆没找齐呢。让我看看——' },
        { speaker: '叮当', text: `还差 ${12 - st.journal.memories.length} 段回忆。镇上的大家、森林里的伙伴，都再走走吧！`, cb: function () { st.freeze = false; } },
      ]);
    },
  });

  WV.DATA.events = E;
})();
