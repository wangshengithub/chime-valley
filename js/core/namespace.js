/**
 * namespace.js —— 全局命名空间与事件总线
 * 一切模块挂载于 window.WV，无模块系统（file:// 兼容，见计划约束 2）。
 */
(function () {
  'use strict';

  const WV = {
    /** 数据容器（js/data/*.js 填充） */
    DATA: { scenes: {}, crops: {}, recipes: {}, furniture: {}, items: {}, npcs: {}, spirits: {}, dialogues: {}, events: [], shops: {} },
    /** 运行时状态（新游戏/读档时整体重建，save.js 定义其结构） */
    state: null,
    /** 已注册系统引用（各 systems 文件挂载） */
    S: {},
    /** 调试接口（交付保留，供测试快进） */
    debug: {},
  };

  /** 简易事件总线：解耦 UI 与系统层 */
  const listeners = {};
  WV.on = function (evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
  };
  WV.emit = function (evt, payload) {
    (listeners[evt] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { console.error('[bus]', evt, e); }
    });
  };

  /** 常量：季节与基础配置（PRD §3.3） */
  WV.CONST = {
    W: 384, H: 216,
    DAYS_PER_SEASON: 14,
    SEASONS: ['春', '夏', '秋', '冬'],
    SEASON_KEYS: ['spring', 'summer', 'autumn', 'winter'],
    MAX_ENERGY: 10,
    PLOT_PRICE: 150,
    DILIGENT_PER_ENERGY: 5,     // 勤勉奖励：剩余体力 ×5 金币
    TRUE_ENDING: { memories: 12, spiritBonds: 6 },
  };

  /** 季节序号（0-3） */
  WV.seasonIdx = function () { return Math.floor((WV.state.day - 1) / 14); };
  /** 当季第几天（1-14） */
  WV.dayInSeason = function () { return ((WV.state.day - 1) % 14) + 1; };

  /** 物品名安全解析（任何前缀都优先给中文名，绝不泄漏内部 ID） */
  WV.itemName = function (id) {
    const it = WV.DATA.items[id];
    if (it && it.name) return it.name;
    if (/^d_/.test(id)) { const r = WV.DATA.recipes[id.slice(2)]; if (r) return r.name; }
    if (/^c_.*_seed$/.test(id)) { const c = WV.DATA.crops[id.slice(2, -5)]; if (c) return c.name + '种子'; }
    if (/^c_/.test(id)) { const c = WV.DATA.crops[id.slice(2)]; if (c) return c.name; }
    return id;
  };

  window.WV = WV;
})();
