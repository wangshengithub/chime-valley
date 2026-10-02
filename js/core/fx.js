/**
 * fx.js —— 粒子系统与演出特效（PRD §4.5 fx 素材 + 程序特效）
 * - 环境粒子：按季节/场景自动派发（樱瓣/落叶/雪/萤火）
 * - 一次性特效：收获星星、金币飘字、尘土（减少动效时关闭）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const particles = [];   // 环境粒子
  const bursts = [];      // 一次性特效
  const framesCache = {};
  let currentKind = null;

  function fxSheet(name) {
    if (framesCache[name]) return framesCache[name];
    const count = { petal: 4, leaf: 4, snow: 4, sparkle: 4, firefly: 5, smoke: 5 }[name] || 4;
    const list = [];
    for (let i = 0; i < count; i++) {   // 按实际帧数加载，避免 404
      const im = new Image();
      im.src = `assets/fx/${name}_${i}.png`;
      list.push(im);
    }
    framesCache[name] = { list: list, count: count };
    return framesCache[name];
  }

  /** 初始化某季节/场景的环境粒子 */
  function ambient(kind, indoor) {
    particles.length = 0;
    currentKind = kind || null;
    if (indoor || !kind) return;
    const n = { petal: 14, leaf: 12, snow: 20, firefly: 10, sparkle: 0 }[kind] || 0;
    const sheet = fxSheet(kind);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * WV.CONST.W, y: Math.random() * WV.CONST.H,
        vx: (Math.random() - 0.5) * 0.3, vy: 0.15 + Math.random() * 0.25,
        frame: Math.floor(Math.random() * sheet.count),
        ft: Math.random(), alpha: 0.7 + Math.random() * 0.3,
      });
    }
  }

  function update(dt) {
    if (WV.state && WV.state.settings && WV.state.settings.reduceMotion) return;
    particles.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.ft += dt;
      if (p.ft > 0.22) { p.ft = 0; p.frame++; }
      if (p.y > WV.CONST.H + 4) { p.y = -4; p.x = Math.random() * WV.CONST.W; }
      if (p.x < -4) p.x = WV.CONST.W + 4;
      if (p.x > WV.CONST.W + 4) p.x = -4;
    });
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.t += dt;
      if (b.t > b.life) bursts.splice(i, 1);
    }
  }

  function draw(ctx) {
    if (WV.state && WV.state.settings && WV.state.settings.reduceMotion) return;
    const sheet = currentKind ? fxSheet(currentKind) : null;
    particles.forEach(function (p) {
      const s = sheet.list[p.frame % sheet.count];
      if (s.complete) ctx.drawImage(s, Math.round(p.x), Math.round(p.y));
    });
    bursts.forEach(function (b) {
      const k = b.t / b.life;
      if (b.type === 'text') {
        ctx.globalAlpha = 1 - k;
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.fillStyle = b.color || '#F2CE7E';
        ctx.textAlign = 'center';
        ctx.fillText(b.text, b.x, b.y - k * 18);
        ctx.globalAlpha = 1;
      } else if (b.type === 'stars') {
        const s = fxSheet('sparkle').list[Math.floor(k * 4) % 4];
        if (s.complete) {
          ctx.globalAlpha = 1 - k;
          for (let j = 0; j < 4; j++) {
            const ang = j * Math.PI / 2 + k * 2;
            ctx.drawImage(s, Math.round(b.x + Math.cos(ang) * 8 * k), Math.round(b.y + Math.sin(ang) * 8 * k - k * 6));
          }
          ctx.globalAlpha = 1;
        }
      }
    });
  }

  function burst(type, x, y, opts) {
    bursts.push(Object.assign({ type: type, x: x, y: y, t: 0, life: 0.8 }, opts || {}));
  }
  function coinText(x, y, text) { burst('text', x, y, { text: text, color: '#F2CE7E', life: 1 }); }
  function stars(x, y) { burst('stars', x, y, { life: 0.7 }); }

  WV.Fx = { ambient: ambient, update: update, draw: draw, burst: burst, coinText: coinText, stars: stars };
})();
