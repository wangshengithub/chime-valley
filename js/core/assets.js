/**
 * assets.js —— 资源清单与预加载
 * 图片：按清单预加载（进度条）；场景图按需加载。
 * 音频：audio.js 自管，此处仅登记清单。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const IM = {};   // 已加载图片池
  const pending = [];
  let loadedCount = 0, totalCount = 0;

  function key(path) { return path.replace(/^assets\//, ''); }

  /** 预加载一批图片（返回 Promise） */
  function preload(list) {
    totalCount += list.length;
    return Promise.all(list.map(function (p) {
      return new Promise(function (res) {
        const img = new Image();
        img.onload = function () { IM[key(p)] = img; loadedCount++; updateProgress(); res(); };
        img.onerror = function () { console.warn('[assets] 缺图', p); loadedCount++; updateProgress(); res(); };
        img.src = p;
      });
    }));
  }

  function updateProgress() {
    const pct = totalCount ? Math.round(loadedCount / totalCount * 100) : 100;
    const fill = document.getElementById('loading-fill');
    if (fill) fill.style.width = pct + '%';
    WV.emit('assets:progress', pct);
  }

  /** 取图（未加载则同步发起并返回占位，加载完成后场景重绘即可见） */
  function img(path) {
    const k = key(path);
    if (IM[k]) return IM[k];
    const i = new Image();
    i.onload = function () { IM[k] = i; };
    i.src = path;
    return i;
  }

  /** 角色动画 strip：按文件名解析帧数并缓存切片 */
  const stripCache = {};
  function stripFrames(path) {
    if (stripCache[path]) return stripCache[path];
    const m = path.match(/_strip(\d+)\.png$/);
    const n = m ? parseInt(m[1], 10) : 1;
    const src = img(path);
    const frames = [];
    for (let i = 0; i < n; i++) frames.push({ img: src, sx: i * 96, sw: 96, sh: 64, n: n });
    stripCache[path] = frames;
    return frames;
  }

  /** 首屏必需资源清单（体积小，保证秒开） */
  function bootList() {
    const list = [
      'assets/palettes/palette_48.png', // 占位预热（极小）
    ];
    // 女主常用动作 + 场景图（16 张全部预载，总计 <1.5MB）
    ['idle_strip9', 'walk_strip8', 'run_strip8', 'watering_strip5', 'dig_strip13', 'carry_strip8', 'doing_strip8', 'waiting_strip9']
      .forEach(function (a) { list.push('assets/sprites/char/heroine_' + a + '.png'); });
    Object.keys(WV.DATA.scenes).forEach(function (k) {
      list.push('assets/scenes/' + k + '.png');
    });
    return list;
  }

  WV.Assets = { preload: preload, img: img, stripFrames: stripFrames, bootList: bootList, updateProgress: updateProgress };
})();
