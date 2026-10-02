/**
 * audio.js —— BGM / SFX 管理（PRD §4.5）
 * - BGM：每场景/季节对应曲目，循环播放，切曲淡入淡出
 * - SFX：按语义名播放；BGM/音效双轨音量，设置持久化
 * - iOS/自动播放策略：首次用户手势解锁（标题点击即解锁）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const bgmEl = new Audio();
  bgmEl.loop = true;
  let currentBgm = null;
  let unlocked = false;
  let pendingBgm = null;

  const S = {
    bgmVol: 0.7,
    sfxVol: 0.8,
    muted: false,
  };

  /** 恢复设置（读档后调用） */
  function applySettings(st) {
    if (st) { S.bgmVol = st.bgmVol; S.sfxVol = st.sfxVol; S.muted = !!st.muted; }
    bgmEl.volume = S.muted ? 0 : S.bgmVol;
  }

  /** iOS 解锁：任何首次交互调用一次 */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    bgmEl.play().then(function () { if (pendingBgm && pendingBgm !== currentBgm) playBgm(pendingBgm); }).catch(function () {});
  }

  function playBgm(code) {
    if (currentBgm === code) return;
    if (!unlocked) { pendingBgm = code; return; }
    const next = 'assets/audio/bgm/' + code + '.ogg';
    currentBgm = code;
    // 淡出旧曲 → 切源 → 淡入
    fadeTo(bgmEl, 0, 300).then(function () {
      bgmEl.src = next;
      bgmEl.volume = 0;
      bgmEl.play().catch(function () {});
      fadeTo(bgmEl, S.muted ? 0 : S.bgmVol, 600);
    });
  }

  function fadeTo(el, target, ms) {
    return new Promise(function (res) {
      const from = el.volume, t0 = performance.now();
      function step(t) {
        const k = Math.min(1, (t - t0) / ms);
        el.volume = from + (target - from) * k;
        if (k < 1) requestAnimationFrame(step); else res();
      }
      requestAnimationFrame(step);
    });
  }

  const sfxPool = {};
  function playSfx(name, rate) {
    if (S.muted || S.sfxVol <= 0) return;
    let el = sfxPool[name];
    if (!el) {
      el = new Audio('assets/audio/sfx/' + name + '.ogg');
      sfxPool[name] = el;
    }
    try {
      el.volume = S.sfxVol;
      el.currentTime = 0;
      if (rate) el.playbackRate = rate;
      el.play().catch(function () {});
    } catch (e) { /* 忽略单次音效失败 */ }
  }

  function setVol(kind, v) {
    if (kind === 'bgm') { S.bgmVol = v; if (!S.muted) bgmEl.volume = v; }
    else S.sfxVol = v;
  }

  // 场景切换自动换曲（scene.js 触发）
  WV.on('scene:enter', function (def) {
    const st = WV.state;
    let code = def.music;
    // 氛围专属曲（如屋檐下的回忆曲、小镇/森林主题）不被季节曲覆盖
    const AMBIENT = ['bgm_memory', 'bgm_festival', 'bgm_title', 'bgm_town', 'bgm_forest'];
    if (st && def.outdoor && AMBIENT.indexOf(code) < 0) {
      const seasonBgm = { 0: 'bgm_spring', 1: 'bgm_summer', 2: 'bgm_autumn', 3: 'bgm_winter' };
      code = seasonBgm[WV.seasonIdx()] || code;
      if (st.energy <= WV.CONST.MAX_ENERGY * 0.1) code = 'bgm_night';
    }
    playBgm(code || 'bgm_spring');
  });

  WV.Audio = { playBgm: playBgm, playSfx: playSfx, setVol: setVol, unlock: unlock, applySettings: applySettings, state: S };
})();
