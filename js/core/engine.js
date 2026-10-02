/**
 * engine.js —— 游戏循环与全局渲染调度
 * rAF + 固定逻辑步长（1/60s 累积器），驱动 Scene.update 与 draw。
 */
(function () {
  'use strict';
  const WV = window.WV;

  let last = 0, acc = 0;
  const STEP = 1 / 60;
  let running = false;

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    acc += dt;
    try {
      while (acc >= STEP) {
        WV.Scene.update(STEP);
        WV.Fx.update(STEP);
        acc -= STEP;
      }
      const ctx = WV.Canvas.ctx;
      if (ctx) WV.Scene.draw(ctx);
    } catch (e) {
      // 渲染异常不允折断循环（防御加载失败的素材）
      console.error('[engine]', e);
      acc = 0;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  // 页面失焦暂停，回来恢复
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  // 死锁自愈看门狗：freeze=true 但没有任何演出 UI 在场 → 解锁（防任何遗漏路径卡死玩家）
  setInterval(function () {
    const st = WV.state;
    if (!st || !st.freeze) return;
    const anyUI = !document.getElementById('dialogue').classList.contains('hidden') ||
                  !document.getElementById('panel').classList.contains('hidden') ||
                  !document.getElementById('memory').classList.contains('hidden') ||
                  !document.getElementById('ending').classList.contains('hidden') ||
                  document.getElementById('transition').classList.contains('show');
    if (!anyUI) {
      console.warn('[engine] 检测到无 UI 的 freeze，已自动解锁');
      st.freeze = false;
    }
  }, 1500);

  WV.Engine = { start: start, stop: stop };
})();
