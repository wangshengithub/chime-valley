/**
 * canvas.js —— 画布与整数倍缩放（PRD §4.1/§5.3）
 * - #scene 逻辑分辨率 384×216，CSS 尺寸取「最大整数倍」适配窗口
 * - 桌面窄屏取 2x，手机横屏≥2x；窗口 resize 自适应
 */
(function () {
  'use strict';
  const WV = window.WV;

  let el = null;
  let scale = 3;

  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const k = Math.max(1, Math.floor(Math.min(vw / WV.CONST.W, vh / WV.CONST.H)));
    scale = k;
    el.style.width = (WV.CONST.W * k) + 'px';
    el.style.height = (WV.CONST.H * k) + 'px';
    // HUD 等 DOM UI 覆盖在 canvas 上：舞台与画布同尺寸对齐
    const stage = document.getElementById('stage');
    stage.style.width = el.style.width;
    stage.style.height = el.style.height;
    stage.style.position = 'fixed';
    stage.style.left = '50%'; stage.style.top = '50%';
    stage.style.transform = 'translate(-50%, -50%)';
  }

  function init() {
    el = document.getElementById('scene');
    ctx = el.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    window.addEventListener('resize', fit);
    fit();
  }

  let ctx = null;

  WV.Canvas = { init: init, fit: fit, get scale() { return scale; }, get ctx() { return ctx; } };
})();
