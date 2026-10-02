/**
 * save.js —— 存档系统（PRD §6.4）
 * - localStorage 键 windbell-valley-save-v1
 * - 三写点防抖：睡觉后 / 场景切换后 / 获得关键物后
 * - 写副本→校验→替换；损坏兜底提示；saveVersion 迁移链
 */
(function () {
  'use strict';
  const WV = window.WV;

  const KEY = 'windbell-valley-save-v1';
  let debounceTimer = null;

  /** 新游戏初始状态（一切系统的状态源） */
  function freshState(name) {
    return {
      saveVersion: 1,
      name: name || '竹鹿',
      day: 1, weather: 'sunny',
      energy: WV.CONST.MAX_ENERGY, gold: 500,
      scene: 'home_living',
      // 背包 {id: {n: 数量}}，按类别前缀：c_作物 m_素材 d_料理 k_关键物品（初始为空）
      inventory: {},
      // 农田 12 块：{unlocked, state: 'wild|tilled|planted|mature', crop, growth(0-5), watered}
      plots: Array.from({ length: 12 }, function (_, i) {
        return { unlocked: i < 4, state: 'wild', crop: null, growth: 0, watered: false };
      }),
      // 装修 placement: {living:[{id,x,y,flip}], bedroom:[], court:[]}
      placement: { living: [], bedroom: [], court: [] },
      furnitureOwned: {},
      recipes: ['salad', 'jam', 'stew', 'veg_soup', 'cocoa'],   // 已解锁食谱 id（热可可为开春万能礼物）
      dishesCooked: {},                                 // {id: 次数}
      journal: { spirits: {}, furniture: {}, memories: [], crops: {} },
      npc: {},            // {id: {favor(0-2进度), stage, talks}}
      areas: ['farm', 'court', 'town_street', 'ranch', 'forest_edge', 'home_living', 'home_kitchen', 'home_bedroom', 'home_eaves'],
      flags: {},          // 事件防重 {eventId: true}
      guideStep: 0,
      ending: null,       // 'normal' | 'true'（null=未通关）
      freeMode: false,
      stats: { earned: 0, spent: 0, cooked: 0, gifted: 0, visited: 0 },
      settings: { bgmVol: 0.7, sfxVol: 0.8, muted: false, textSpeed: 30, reduceMotion: false, bigFont: false },
    };
  }

  function serialize() {
    const s = Object.assign({}, WV.state);
    delete s.freeze;          // 演出锁是运行时状态，绝不入档
    return JSON.stringify(s);
  }

  function write() {
    try {
      const data = serialize();
      JSON.parse(data); // 校验可序列化
      localStorage.setItem(KEY, data);
    } catch (e) {
      console.error('[save] 写入失败', e);
    }
  }

  /** 防抖保存 */
  function save() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(write, 500);
  }
  function saveNow() {
    clearTimeout(debounceTimer);
    write();
  }

  /** 迁移链：v1 → v2 → …（当前仅 v1；为旧档补开新内容） */
  function migrate(s) {
    if (!s.saveVersion) s.saveVersion = 1;
    // v1 补丁：初始食谱新增「热可可」（旧档一并享受）
    if (s.recipes && s.recipes.indexOf('cocoa') < 0 && s.recipes.indexOf('veg_soup') >= 0) s.recipes.push('cocoa');
    // v1 补丁：清掉历史 Bug 写入的 null 作物图鉴键
    if (s.journal && s.journal.crops) delete s.journal.crops.null;
    // v1 补丁：按最新结构补全缺失字段（防止旧档在新系统读写时 TypeError）
    const fresh = freshState('__migrate__');
    Object.keys(fresh).forEach(function (k) {
      if (!(k in s)) { s[k] = fresh[k]; return; }
      // 嵌套对象逐键合并（journal/stats/settings/placement/npc 等）
      if (fresh[k] && typeof fresh[k] === 'object' && !Array.isArray(fresh[k])) {
        Object.keys(fresh[k]).forEach(function (k2) {
          if (s[k][k2] === undefined) s[k][k2] = fresh[k][k2];
        });
      }
    });
    // v1 补丁：自由模式旧档 day 越界收敛（D5：防"undefined 季"与种不了地）
    if (s.freeMode && s.day > 56) s.day = ((s.day - 1) % 56) + 1;
    // v1 补丁：NPC 满级但拿手菜未解锁的旧档补发（D3 历史竞态兜底）
    if (s.npc && s.recipes) {
      Object.keys(s.npc).forEach(function (id) {
        const dish = (WV.S && WV.S.Cook && WV.S.Cook.NPC_RECIPES) ? WV.S.Cook.NPC_RECIPES[id] : null;
        if (dish && (s.npc[id].favor || 0) >= 2 && s.recipes.indexOf(dish) < 0) s.recipes.push(dish);
      });
    }
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      delete s.freeze;        // 历史存档中的演出锁一并清除
      // 清理历史版本遗留的零数量条目
      Object.keys(s.inventory || {}).forEach(function (k) {
        if (!s.inventory[k] || s.inventory[k].n <= 0) delete s.inventory[k];
      });
      return migrate(s);
    } catch (e) {
      console.error('[save] 读档损坏', e);
      return null;
    }
  }

  function summary() {
    const s = load();
    if (!s) return null;
    const season = WV.CONST.SEASONS[Math.floor((s.day - 1) / 14)];
    return `${season}·第${((s.day - 1) % 14) + 1}天 图鉴${Object.keys(s.journal.spirits).length + s.journal.memories.length}/${9 + 12}`;
  }

  function reset() {
    // 关键：先取消 pending 的防抖写入，否则重置后定时器触发会把旧进度写回（重置不完全 bug）
    clearTimeout(debounceTimer);
    localStorage.removeItem(KEY);
    // 双保险：清掉同源键下任何历史版本残留
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('windbell-valley-save') === 0) localStorage.removeItem(k);
      });
    } catch (e) { /* 隐私模式等场景忽略 */ }
  }

  // 写点挂载：切场景 / 主线关键事件
  WV.on('scene:entered', function () {
    if (WV.state) { WV.state.scene = WV.Scene.key; save(); }
  });
  WV.on('state:dirty', save);
  WV.on('journal:add', save);

  WV.Save = { freshState: freshState, save: save, saveNow: saveNow, load: load, summary: summary, reset: reset, KEY: KEY };
})();
