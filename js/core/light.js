/**
 * light.js —— 昼夜光照与季节滤镜（PRD §3.3 / 风格指南 §2.1-2.2）
 * - 昼夜：按当日已消耗体力比例分 晨/昼/黄昏/夜 四段，叠加半透明色调
 * - 季节：全局滤镜叠加（室内减半）
 * - 夜间光源点：暖色圆晕（场景定义 lights 或自动窗灯）
 */
(function () {
  'use strict';
  const WV = window.WV;

  // PRD §3.3：0~33% 晨 / 34~66% 昼 / 67~89% 黄昏 / 90%+ 夜
  const PHASES = [
    { name: '晨', color: 'rgba(255,180,120,0.10)' },
    { name: '昼', color: 'rgba(0,0,0,0)' },
    { name: '黄昏', color: 'rgba(255,120,60,0.15)' },
    { name: '夜', color: 'rgba(40,50,90,0.28)' },
  ];
  const SEASON_TINT = [
    'rgba(255,200,210,0.06)', // 春
    'rgba(80,160,200,0.05)',  // 夏
    'rgba(255,160,60,0.09)',  // 秋
    'rgba(180,200,230,0.14)', // 冬
  ];

  /** 当前昼夜序号（0-3），按体力消耗比例 */
  function phaseIdx() {
    if (!WV.state) return 1;
    const used = (WV.CONST.MAX_ENERGY - WV.state.energy) / WV.CONST.MAX_ENERGY;
    if (used <= 0.33) return 0;
    if (used <= 0.66) return 1;
    if (used <= 0.89) return 2;
    return 3;
  }

  function draw(ctx, def) {
    if (!WV.state) return;
    const indoor = def && def.outdoor === false;
    const pi = phaseIdx();
    const si = WV.seasonIdx();
    // 昼夜
    const ph = PHASES[pi];
    if (ph.color !== 'rgba(0,0,0,0)') {
      ctx.fillStyle = indoor && pi === 3 ? 'rgba(40,50,90,0.18)' : ph.color;
      ctx.fillRect(0, 0, WV.CONST.W, WV.CONST.H);
    }
    // 季节
    const tint = SEASON_TINT[si];
    if (tint && !indoor) {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, WV.CONST.W, WV.CONST.H);
    }
    // 夜间光源（窗灯暖晕）
    if (pi === 3) {
      const lights = (def && def.lights) || [];
      lights.forEach(function (L) {
        const g = ctx.createRadialGradient(L.x, L.y, 1, L.x, L.y, L.r || 22);
        g.addColorStop(0, 'rgba(242,206,126,0.35)');
        g.addColorStop(1, 'rgba(242,206,126,0)');
        ctx.fillStyle = g;
        ctx.fillRect(L.x - 30, L.y - 30, 60, 60);
      });
    }
    return pi;
  }

  WV.Light = { draw: draw, phaseIdx: phaseIdx, PHASES: PHASES };
})();
