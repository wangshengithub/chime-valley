/**
 * items.js —— 物品大全（背包/商店共用）
 * id 前缀：c_作物(及 _seed 种子) m_素材 d_料理 k_珍贵之物
 * icon：assets/sprites/items/ 下的文件名（不含扩展名）
 */
(function () {
  'use strict';
  const WV = window.WV;
  const I = {};

  // 种子 + 作物产物（由作物表自动生成）
  Object.keys(WV.DATA.crops).forEach(function (cid) {
    const c = WV.DATA.crops[cid];
    I['c_' + cid + '_seed'] = { name: c.name + '种子', icon: 'seeds', desc: c.desc + `（${['春', '夏', '秋', '冬'][c.season]}季种植，${c.days}天成熟）`, sellPrice: Math.floor(c.seedPrice / 2), buyPrice: c.seedPrice };
    I['c_' + cid] = { name: c.name, icon: 'cropicon_' + cid, desc: c.desc, sellPrice: c.sellPrice };
  });

  // 采集素材与牧场食材（各配独立图标）
  Object.assign(I, {
    m_honey:     { name: '野花蜜',   icon: 'mat_honey',     sellPrice: 25, desc: '森林边缘的花丛里采的，甜丝丝。' },
    m_mushroom:  { name: '蘑菇',     icon: 'mat_mushroom',  sellPrice: 20, desc: '密林里的鲜蘑菇，炖汤一流。' },
    m_chestnut:  { name: '板栗',     icon: 'mat_chestnut',  sellPrice: 22, desc: '秋天密林的馈赠。' },
    m_lightwood: { name: '轻木',     icon: 'mat_lightwood', sellPrice: 18, desc: '溪谷上坡的轻软木材，修桥铺路都用得上。' },
    m_pebble:    { name: '鹅卵石',   icon: 'mat_pebble',    sellPrice: 10, desc: '溪水打磨得圆圆的小石头。溪水獭的最爱。' },
    m_flower:    { name: '山花',     icon: 'mat_flower',    sellPrice: 15, desc: '山丘花田的野花，编花环正好。' },
    m_moonflower:{ name: '月见草',   icon: 'mat_moonflower',sellPrice: 40, desc: '只在夜里开放的淡黄色小花。' },
    m_sandsugar: { name: '亮晶晶的沙', icon: 'mat_sandsugar',sellPrice: 30, desc: '精灵秘境的星沙，据说能让愿望闪光。' },
    m_egg:       { name: '鸡蛋',     icon: 'egg',       sellPrice: 15, buyPrice: 20, desc: '花花阿姨牧场的新鲜鸡蛋。' },
    m_milk:      { name: '牛奶',     icon: 'milk',      sellPrice: 25, buyPrice: 30, desc: '牧场直供的香浓牛奶。' },
    m_flour:     { name: '面粉',     icon: 'mat_flour', sellPrice: 12, buyPrice: 15, desc: '烘焙的基础。' },
    m_tofu:      { name: '豆腐',     icon: 'mat_tofu',  sellPrice: 14, buyPrice: 18, desc: '镇上豆腐坊的招牌。' },
    m_oak:       { name: '橡果',     icon: 'mat_oak',   sellPrice: 8,  desc: '橡果团子们的零食。' },
  });

  // 珍贵之物（不可售）
  Object.assign(I, {
    k_letter:     { name: '奶奶的信', desc: '把一切都留给你的人写下的字句。' },
    k_photo:      { name: '泛黄的全家福', desc: '照片里，年轻的奶奶抱着一个小婴儿笑得很温柔。' },
    k_watering:   { name: '生锈的浇花壶', desc: '奶奶用过的旧壶，壶底刻着一行小字：「给花，也给自己。」' },
    k_apron:      { name: '褪色的围裙', desc: '苏婆婆保存多年的奶奶的围裙，口袋里还有一颗干掉的豆子。' },
    k_driedflower:{ name: '干枯的花束', desc: '密林深处找到的花束，用麻绳仔细扎着。' },
    k_bellblank:  { name: '木铃铛半成品', desc: '没做完的木铃铛——岩伯说，那是奶奶五十岁那年请他打的。' },
    k_recipes:    { name: '手写食谱册', desc: '奶奶的字迹：每一页都是一道为某人而做的菜。' },
    k_oldphoto:   { name: '老照片·风铃祭', desc: '照片上的风铃祭，满谷风铃，人山人海。' },
    k_feather:    { name: '守护者的羽毛', desc: '泛着微光的、不属于任何鸟类的羽毛。' },
  });

  // 书册（旧书铺出售，客厅书架可阅读——世界观投放，PRD 顾先生定位）
  Object.assign(I, {
    m_book1: { name: '风铃谷传说·守护者', icon: 'book1', sellPrice: 60, desc: '关于谷之守护者的古老传说。买回家可在客厅书架阅读。' },
    m_book2: { name: '风铃谷传说·风铃祭', icon: 'book2', sellPrice: 90, desc: '风铃节的起源与习俗。买回家可在客厅书架阅读。' },
    m_book3: { name: '风铃谷传说·守望的人们', icon: 'book3', sellPrice: 120, desc: '历代守望山谷的人们的故事。买回家可在客厅书架阅读。' },
  });

  // 料理成品（d_ 前缀）：由食谱表自动生成，保证背包/商店/提示统一显示名称
  Object.keys(WV.DATA.recipes).forEach(function (rid) {
    const r = WV.DATA.recipes[rid];
    I['d_' + rid] = { name: r.name, icon: 'dish_' + rid, desc: r.desc || '用心做的料理。', sellPrice: r.price || 0 };
  });

  WV.DATA.items = I;
})();
