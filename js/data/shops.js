/**
 * shops.js —— 四家商店货架（PRD §3.7）
 * goods: [物品id, 价格, 备注]
 */
(function () {
  'use strict';
  const WV = window.WV;

  // 种子按四季分组（UI 显示当季提示由 tips 文案承担，货架四季全上便于囤种）
  const SEEDS = Object.keys(WV.DATA.crops).map(function (cid) {
    return ['c_' + cid + '_seed', WV.DATA.crops[cid].seedPrice,
            ['春', '夏', '秋', '冬'][WV.DATA.crops[cid].season] + '季'];
  });

  WV.DATA.shops = {
    shop_general: {
      name: '苏婆婆杂货铺', owner: 'granny_su',
      greet: '「闺女来啦！种子、杂货，随便挑！」（当前季节：' + '{SEASON}' + '）',
      goods: SEEDS.concat([
        ['m_flour', 15, '烘焙用'], ['m_tofu', 18, '炖菜用'],
      ]),
    },
    shop_bakery: {
      name: '麦琪面包房', owner: 'maiqi',
      greet: '「刚出炉的～除了面包，姐姐这里还有新鲜食材哦。」',
      goods: [
        ['m_milk', 30, '牧场直供'], ['m_egg', 20, '新鲜'],
        ['m_honey', 40, '回购的野花蜜'],
      ],
    },
    shop_books: {
      name: '旧书铺', owner: 'gu',
      greet: '「轻声。今天的传单……咳，今日上架了几册镇志抄本，感兴趣的话带一本回去，书架上读。」',
      goods: [
        ['m_book1', 120, '守护者的传说'],
        ['m_book2', 180, '风铃祭的起源'],
        ['m_book3', 240, '守望者们'],
      ],
    },
    shop_ranch: {
      name: '牧场小屋', owner: 'huahua',
      greet: '「哎哟来啦！鸡蛋牛奶管够！」',
      goods: [
        ['m_egg', 20, '今日新下'], ['m_milk', 30, '早班奶'],
      ],
    },
  };
})();
