/**
 * main.js —— 启动流程：加载 → 标题 → 新游戏（命名）/ 继续进入游戏
 */
(function () {
  'use strict';
  const WV = window.WV;

  const $ = function (id) { return document.getElementById(id); };

  function show(id) { $(id).classList.remove('hidden'); }
  function hide(id) { $(id).classList.add('hidden'); }

  function boot() {
    WV.Canvas.init();
    WV.Input.init();
    WV.Dialogue.init();
    WV.S.UI.bindHud();
    $('loading-text').textContent = '正在唤醒山谷…';
    WV.Assets.preload(WV.Assets.bootList()).then(function () {
      setTimeout(toTitle, 300);
    });
  }

  function toTitle() {
    hide('loading');
    show('title-screen');
    const sum = WV.Save.summary();
    const btn = $('btn-continue');
    if (sum) {
      $('save-summary').textContent = sum;
      btn.disabled = false;
    } else {
      btn.disabled = true;
      $('save-summary').textContent = '暂无存档';
    }
    // PRD §2.3：标题界面点亮「已见证真结局」标记
    const saved = WV.Save.load();
    const badge = $('true-end-badge');
    if (badge) badge.classList.toggle('hidden', !(saved && saved.ending === 'true'));
    // 标题 BGM（用户第一次点击时解锁播放）
    document.getElementById('title-screen').addEventListener('click', function once() {
      WV.Audio.unlock();
      WV.Audio.playBgm('bgm_title');
      document.getElementById('title-screen').removeEventListener('click', once);
    });
  }

  /** 序章：开场叙事演出（吉卜力式文字渐入） */
  const PROLOGUE = [
    '城市的第 365 个加班夜。\n地铁、报表、亮到凌晨的写字楼。\n日历翻过去，好像什么都没有留下。',
    '手机亮起。一封挂号信——\n寄信人：风铃谷。\n落款，是奶奶的名字。',
    '奶奶走了，已经整整一年。\n你甚至没能赶上，最后一面。',
    '律师信里只有一句话：\n「风铃谷的老屋，留给你。」\n信封里，还滑落一张泛黄的明信片。',
    '明信片背面是奶奶的字迹：\n「山谷里住着守护者。它听不见，也看不见，\n只听得见风铃。\n所以啊，家家户户的屋檐下，都挂着一枚铃。」',
    '小时候的夏天突然涌了上来——\n麦芽糖的甜、溪水的凉、\n屋檐下叮铃作响的风铃，\n和奶奶摇着蒲扇的、慢悠悠的手。',
    '你请了长假，背起背包。\n长途汽车驶出城市，往群山深处开去。\n窗外的楼越来越矮，山越来越高。',
    '山路走了很久很久。\n\n风铃谷，到了。',
  ];

  function playPrologue(done) {
    const el = document.getElementById('prologue');
    const txt = document.getElementById('prologue-text');
    let i = 0;
    el.classList.remove('hidden');
    WV.Audio.unlock();
    WV.Audio.playBgm('bgm_memory');
    function show() {
      txt.style.animation = 'none';
      void txt.offsetWidth; // 重启动画
      txt.style.animation = '';
      txt.textContent = PROLOGUE[i];
    }
    function next() {
      i++;
      if (i >= PROLOGUE.length) {
        el.classList.add('hidden');
        el.removeEventListener('click', next);
        done();
        return;
      }
      show();
      WV.Audio.playSfx('sfx_click2');
    }
    el.addEventListener('click', next);
    show();
  }

  function startNew() {
    hide('title-screen');
    playPrologue(function () {
      show('name-screen');
      $('name-input').value = '';
      $('name-error').textContent = '';
      setTimeout(function () { $('name-input').focus(); }, 60);
      $('btn-name-ok').onclick = doName;
      $('name-input').onkeydown = function (e) { if (e.key === 'Enter' && !e.isComposing) doName(); };  // 排除输入法组字确认
    });
  }

  function doName() {
    const raw = $('name-input').value.trim();
    if (!raw) { begin('竹鹿'); return; }   // 留空 = 使用默认名「竹鹿」直接开始
    if (raw.length < 2) { $('name-error').textContent = '名字至少 2 个字哦'; return; }
    if (!/^[一-龥a-zA-Z·]{2,6}$/.test(raw)) { $('name-error').textContent = '请用 2~6 个中文或英文字母'; return; }
    begin(raw);
  }

  function begin(name) {
    WV.state = WV.Save.freshState(name);
    hide('name-screen');
    show('hud');
    WV.S.Settings.apply();
    WV.S.UI.refreshHud();
    WV.Scene.enter('home_living', true);
    WV.Engine.start();
    setTimeout(function () { WV.S.Guide.intro(); }, 600);
    WV.Save.saveNow();   // 首档立即落盘（不等防抖，防开局 0.5s 内关页丢档）
  }

  function continueGame() {
    const s = WV.Save.load();
    if (!s) { WV.S && WV.S.UI ? null : null; return; }
    WV.state = s;
    hide('title-screen');
    show('hud');
    WV.S.Settings.apply();
    WV.S.UI.refreshHud();
    WV.Scene.enter(s.scene || 'home_living', true);
    WV.Engine.start();
  }

  // 标题按钮
  document.addEventListener('DOMContentLoaded', function () {
    $('btn-new').onclick = function () { WV.Audio.unlock(); startNew(); };
    $('btn-continue').onclick = function () { WV.Audio.unlock(); continueGame(); };
    $('btn-howto').onclick = function () { WV.S.UI.howto(); };   // 纯静态文本，绝不创建临时 state（P0：防覆盖真实存档）
    boot();
  });
})();
