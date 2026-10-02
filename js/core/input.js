/**
 * input.js —— 输入层：鼠标/触摸/键盘 → 逻辑坐标与点击派发
 * - 逻辑坐标系：384×216（canvas.js 负责缩放映射）
 * - 热点 hover 高亮由 scene.js 消费；此处只派发 {x, y, type}
 * - 键盘快捷键：B 背包 / J 手账 / M 地图 / Esc 设置·关闭
 */
(function () {
  'use strict';
  const WV = window.WV;

  let canvasEl = null;
  const pos = { x: 0, y: 0, over: false };

  function toLogical(clientX, clientY) {
    const r = canvasEl.getBoundingClientRect();
    return {
      x: (clientX - r.left) / r.width * WV.CONST.W,
      y: (clientY - r.top) / r.height * WV.CONST.H,
    };
  }

  function init() {
    canvasEl = document.getElementById('scene');

    canvasEl.addEventListener('mousemove', function (e) {
      const p = toLogical(e.clientX, e.clientY);
      pos.x = p.x; pos.y = p.y; pos.over = true;
      WV.emit('input:hover', { x: pos.x, y: pos.y });
    });
    canvasEl.addEventListener('mouseleave', function () { pos.over = false; });

    // 触摸：touchstart 即 hover+click（点选式天然适配）
    canvasEl.addEventListener('touchstart', function (e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      const p = toLogical(t.clientX, t.clientY);
      pos.x = p.x; pos.y = p.y; pos.over = true;
      WV.emit('input:hover', { x: p.x, y: p.y });
      WV.emit('input:click', { x: p.x, y: p.y });
      WV.Audio.unlock();
    }, { passive: false });

    canvasEl.addEventListener('click', function (e) {
      const p = toLogical(e.clientX, e.clientY);
      WV.emit('input:click', { x: p.x, y: p.y });
      WV.Audio.unlock();
    });

    window.addEventListener('keydown', function (e) {
      if (e.target && e.target.tagName === 'INPUT') return; // 命名输入时不拦截
      if (!WV.state) return;   // 标题/命名屏：游戏未开始，快捷键不生效
      // 用物理键位 e.code 判定：不受中文输入法影响（e.key 在输入法激活时为 'Process'）
      const c = e.code;
      if (c === 'Space' && e.target && e.target.tagName === 'BUTTON') return;   // 聚焦按钮时让按钮独占空格，杜绝双触发
      if (c === 'KeyB') WV.emit('ui:toggle', 'bag');
      else if (c === 'KeyJ') WV.emit('ui:toggle', 'journal');
      else if (c === 'KeyM') WV.emit('ui:toggle', 'map');
      else if (c === 'Escape') WV.emit('ui:escape');
      else if (c === 'Space') {
        // 防止空格同时激活聚焦中的 HUD 按钮（双触发）
        if (!(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON'))) e.preventDefault();
        WV.emit('dialogue:advance');
      }
    });
  }

  WV.Input = { init: init, pos: pos };
})();
