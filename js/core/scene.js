/**
 * scene.js —— 场景管理器（core 层中枢）
 * - enter(key)：转场 → 背景/BGM/粒子/事件
 * - 女主实体：走位（点击热点走近再触发）、动作播放（idle/walk/watering/dig…）
 * - 渲染管线：背景 → 动态层(系统挂载) → NPC → 女主 → 粒子 → 光照 → hover 提示
 * - 动作分发：WV.emit('hotspot:action')，由 systems/ui 层消费
 */
(function () {
  'use strict';
  const WV = window.WV;

  // Sunnyside strip 本体裁剪区（覆盖角色本体 12×16@bbox(43,23)-(54,39) + 手持工具伸展区；
  // 底边 y=46 略低于脚底 39，保证行走帧脚部落点不裁切）
  const CROP = { sx: 30, sy: 14, sw: 36, sh: 32 };
  const SPEED = 52; // 逻辑像素/秒

  const cur = {
    key: null, def: null, bg: null,
    npcs: [],          // {id, x, y, frame, ft}
    extras: [],        // 系统注册的动态绘制回调 fn(ctx)
  };

  const heroine = {
    x: 192, y: 150, tx: null, ty: null,
    act: 'idle', strip: 'assets/sprites/char/heroine_idle_strip9.png',
    frame: 0, ft: 0, once: false, onDone: null,
  };

  function enter(key, instant) {
    const def = WV.DATA.scenes[key];
    if (!def) { console.warn('[scene] 未定义场景', key); return; }
    const doSwitch = function () {
      cur.key = key; cur.def = def;
      cur.bg = WV.Assets.img('assets/scenes/' + key + '.png');
      cur.npcs = (def.npcs || []).map(function (n) { return Object.assign({ frame: 0, ft: 0 }, n); });
      document.getElementById('scene-name').textContent = def.name || '';
      // 女主入场位（从传送门/默认中下）
      heroine.x = def.enterX || 192; heroine.y = def.enterY || 170;
      heroine.tx = null; setAct('idle');
      // 环境粒子（季节→粒子类型；夏夜萤火由 spirits 事件切换）
      const si = WV.seasonIdx();
      const kind = ['petal', 'sparkle', 'leaf', 'snow'][si];
      WV.Fx.ambient(def.outdoor === false ? null : (si === 1 ? 'petal' : kind), def.outdoor === false);
      WV.emit('scene:enter', def);
      WV.emit('scene:entered', def);
    };
    if (instant) { doSwitch(); return; }
    // 场景切换：暖色纸纹渐隐（星月夜空仅用于睡觉/换季，见 time.js）
    const tr = document.getElementById('transition');
    tr.innerHTML = `<div class="fade-warm"></div><div class="fade-label">${def.name || ''}</div>`;
    tr.classList.add('show');
    setTimeout(function () { doSwitch(); }, 380);
    setTimeout(function () { tr.classList.remove('show'); }, 620);
  }

  function setAct(act, once, onDone) {
    heroine.act = act;
    heroine.strip = 'assets/sprites/char/heroine_' + act + '_strip' +
      ({ idle: 9, walk: 8, run: 8, watering: 5, dig: 13, carry: 8, doing: 8, waiting: 9 }[act] || 8) + '.png';
    heroine.frame = 0; heroine.ft = 0;
    heroine.once = !!once; heroine.onDone = onDone || null;
  }
  function playAction(act, onDone) { setAct(act, true, onDone); }

  /** 命中检测：最近的、距离在 r+8 内的热点（含 portal） */
  function hitHotspot(x, y) {
    if (!cur.def) return null;
    let best = null, bd = 1e9;
    (cur.def.hotspots || []).forEach(function (h) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d <= (h.r || 16) + 10 && d < bd) { bd = d; best = h; }
    });
    return best;
  }

  WV.on('input:click', function (p) {
    if (WV.Dialogue && WV.Dialogue.busy()) { WV.emit('dialogue:advance'); return; }
    if (WV.state && WV.state.freeze) return; // 演出中锁操作
    const h = hitHotspot(p.x, p.y);
    if (h) {
      // 走向热点，到达后触发
      heroine.tx = Math.max(8, Math.min(WV.CONST.W - 8, h.x));
      heroine.ty = Math.max(60, Math.min(WV.CONST.H - 8, h.y + 14));
      heroine.pending = h;
      heroine.walkCb = null;   // 与自由走位回调互斥
      WV.Audio.playSfx('sfx_click');
      return;
    }
    // 空地也走过去（自由走动）
    heroine.tx = Math.max(8, Math.min(WV.CONST.W - 8, p.x));
    heroine.ty = Math.max(60, Math.min(WV.CONST.H - 8, p.y));
    heroine.pending = null;
    heroine.walkCb = null;
  });

  /** 走到指定逻辑坐标后执行回调（精灵等动态交互使用；与热点走位互斥） */
  function walkTo(x, y, cb) {
    heroine.tx = Math.max(8, Math.min(WV.CONST.W - 8, x));
    heroine.ty = Math.max(60, Math.min(WV.CONST.H - 8, y + 10));
    heroine.pending = null;
    heroine.walkCb = cb;
    if (heroine.act !== 'walk') setAct('walk');
  }

  function update(dt) {
    // 女主移动
    if (heroine.tx != null) {
      const dx = heroine.tx - heroine.x, dy = heroine.ty - heroine.y;
      const d = Math.hypot(dx, dy);
      if (d < 2) {
        heroine.x = heroine.tx; heroine.y = heroine.ty; heroine.tx = null;
        // 自由走位回调（精灵交互）
        if (heroine.walkCb) {
          const cb = heroine.walkCb; heroine.walkCb = null;
          setAct('idle');
          if (WV.Dialogue.busy() || (WV.state && WV.state.freeze)) { WV.S.UI.toast('（刚才走神了……再点一次试试）'); return; }
          cb();
          return;
        }
        const pend = heroine.pending; heroine.pending = null;
        if (pend) {
          setAct('idle');
          // 对话/演出中不执行动作（精灵对话与重叠热点的竞态，丢弃本次 pending 并提示）
          if (WV.Dialogue.busy() || (WV.state && WV.state.freeze)) {
            heroine.pending = null;
            WV.S.UI.toast('（刚才走神了……再点一次试试）');
            return;
          }
          // 统一走事件总线：goto_ 同样派发，由 story.js 解锁拦截器放行/拦截（P0-3 修复）
          WV.emit('hotspot:action', { hotspot: pend, def: cur.def });
        } else setAct('idle');
      } else {
        if (heroine.act !== 'walk') setAct('walk');
        heroine.x += dx / d * SPEED * dt;
        heroine.y += dy / d * SPEED * dt;
      }
    }
    // 帧推进（8fps）
    heroine.ft += dt;
    if (heroine.ft > 0.125) {
      heroine.ft = 0; heroine.frame++;
      const frames = WV.Assets.stripFrames(heroine.strip);
      if (heroine.frame >= frames.length) {
        if (heroine.once) {
          const cb = heroine.onDone; heroine.onDone = null;
          setAct('idle');
          if (cb) cb();
        } else heroine.frame = 0;
      }
    }
    // NPC 帧推进（idle 4fps 缓慢）
    cur.npcs.forEach(function (n) {
      n.ft += dt;
      if (n.ft > 0.25) { n.ft = 0; n.frame = (n.frame + 1) % 9; }
    });
  }

  function drawChar(ctx, stripPath, frameIdx, x, y, flip) {
    const frames = WV.Assets.stripFrames(stripPath);
    const f = frames[Math.min(frameIdx, frames.length - 1)];
    // 防御：图片未就绪/加载失败（naturalWidth=0）时跳过，绝不让渲染循环中断
    if (!f.img.complete || !f.img.naturalWidth) return;
    const dx = Math.round(x - CROP.sw / 2);
    const dy = Math.round(y - CROP.sh);
    if (flip) {
      ctx.save();
      ctx.translate(dx + CROP.sw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(f.img, f.sx + CROP.sx, CROP.sy, CROP.sw, CROP.sh, 0, 0, CROP.sw, CROP.sh);
      ctx.restore();
    } else {
      ctx.drawImage(f.img, f.sx + CROP.sx, CROP.sy, CROP.sw, CROP.sh, dx, dy, CROP.sw, CROP.sh);
    }
  }

  function draw(ctx) {
    if (!cur.def) return;
    // 背景
    if (cur.bg && cur.bg.complete) ctx.drawImage(cur.bg, 0, 0);
    else { ctx.fillStyle = '#2E4560'; ctx.fillRect(0, 0, WV.CONST.W, WV.CONST.H); }
    // 动态层（作物/精灵等，由 systems 注册）
    cur.extras.forEach(function (fn) { try { fn(ctx); } catch (e) { console.error('[extra]', e); } });
    // NPC（只渲染已注册的镇民；精灵等非镇民由各自系统负责）
    cur.npcs.forEach(function (n) {
      const info = WV.DATA.npcs[n.id];
      if (!info) return;
      drawChar(ctx, 'assets/sprites/npc/' + info.code + '_idle_strip9.png', n.frame, n.x, n.y);
    });
    // 女主
    drawChar(ctx, heroine.strip, heroine.frame, heroine.x, heroine.y);
    // 粒子与光照
    WV.Fx.draw(ctx);
    WV.Light.draw(ctx, cur.def);
    // ---- 常显标记层：传送门（呼吸光圈+方向箭头）与交互热点（星光点） ----
    const tms = Date.now() / 1000;
    (cur.def.portals || []).forEach(function (p) {
      const a = 0.5 + 0.5 * Math.sin(tms * 2.4);
      // 光圈
      ctx.fillStyle = `rgba(247,239,221,${0.10 + 0.10 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11 + 2 * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(247,239,221,${0.55 + 0.35 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.stroke();
      // 方向箭头（按屏幕边缘朝向）
      const dir = p.x < 40 ? 'L' : p.x > WV.CONST.W - 40 ? 'R' : p.y > WV.CONST.H - 20 ? 'D' : 'U';
      ctx.fillStyle = '#F7EFDD';
      ctx.strokeStyle = '#4A322C';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const s = 4;
      if (dir === 'R') { ctx.moveTo(p.x - s, p.y - s); ctx.lineTo(p.x + s + 1, p.y); ctx.lineTo(p.x - s, p.y + s); }
      else if (dir === 'L') { ctx.moveTo(p.x + s, p.y - s); ctx.lineTo(p.x - s - 1, p.y); ctx.lineTo(p.x + s, p.y + s); }
      else if (dir === 'D') { ctx.moveTo(p.x - s, p.y - s); ctx.lineTo(p.x + s, p.y - s); ctx.lineTo(p.x, p.y + s + 1); }
      else { ctx.moveTo(p.x - s, p.y + s); ctx.lineTo(p.x + s, p.y + s); ctx.lineTo(p.x, p.y - s - 1); }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    // 交互热点小星光（非传送门的可点击物）
    (cur.def.hotspots || []).forEach(function (h) {
      if (!h.action || h.action.indexOf('goto_') === 0) return;
      const a = 0.35 + 0.65 * Math.abs(Math.sin(tms * 1.8 + h.x));
      ctx.fillStyle = `rgba(242,206,126,${a})`;
      const ox = h.x + 8, oy = h.y - (h.r || 16) - 2;
      ctx.fillRect(ox - 1, oy - 3, 2, 6);
      ctx.fillRect(ox - 3, oy - 1, 6, 2);
    });
    // hover 热点提示
    const p = WV.Input.pos;
    if (p.over && !WV.Dialogue.busy()) {
      const h = hitHotspot(p.x, p.y);
      if (h) {
        ctx.strokeStyle = 'rgba(247,239,221,0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(h.x, h.y, Math.max(6, (h.r || 16) * 0.8), 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = '9px "LXGW WenKai", sans-serif';
        const tw = ctx.measureText(h.name).width;
        ctx.fillStyle = 'rgba(23,20,36,0.75)';
        ctx.fillRect(h.x - tw / 2 - 3, h.y - (h.r || 16) - 14, tw + 6, 12);
        ctx.fillStyle = '#F7EFDD';
        ctx.textAlign = 'center';
        ctx.fillText(h.name, h.x, h.y - (h.r || 16) - 5);
        ctx.textAlign = 'left';
      }
    }
  }

  function onDraw(fn) { cur.extras.push(fn); }
  function clearDraws() { cur.extras.length = 0; }

  WV.Scene = {
    enter: enter, update: update, draw: draw,
    onDraw: onDraw, clearDraws: clearDraws,
    playAction: playAction, setAct: setAct, walkTo: walkTo,
    get key() { return cur.key; },
    get def() { return cur.def; },
    get heroine() { return heroine; },
    get npcs() { return cur.npcs; },
    CROP: CROP,
  };
})();
