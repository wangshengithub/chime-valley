/**
 * crops.js —— 12 种原生作物（PRD §7 数值按相近作物映射，±30% 条款）
 * season: 0春 1夏 2秋 3冬
 */
(function () {
  'use strict';
  const WV = window.WV;
  const C = {
    potato:     { name: '土豆',   season: 0, seedPrice: 20,  days: 3, yield: 2, sellPrice: 35,  desc: '最朴实的作物，炖菜的好伙伴。' },
    carrot:     { name: '胡萝卜', season: 0, seedPrice: 40,  days: 3, yield: 3, sellPrice: 45,  desc: '橙灿灿的，兔子最爱。' },
    parsnip:    { name: '欧防风', season: 0, seedPrice: 60,  days: 4, yield: 3, sellPrice: 55,  desc: '带着淡淡甜香的根茎。' },
    blueberry:  { name: '蓝莓',   season: 1, seedPrice: 60,  days: 4, yield: 3, sellPrice: 55,  desc: '夏日的紫黑色小宝石。' },
    cauliflower:{ name: '花椰菜', season: 1, seedPrice: 30,  days: 3, yield: 2, sellPrice: 40,  desc: '像一朵云长在地里。' },
    cabbage:    { name: '卷心菜', season: 1, seedPrice: 50,  days: 4, yield: 2, sellPrice: 70,  desc: '一层层裹着夏天的阳光。' },
    pumpkin:    { name: '南瓜',   season: 2, seedPrice: 70,  days: 4, yield: 2, sellPrice: 110, desc: '丰收季节的黄金象征。' },
    kale:       { name: '羽衣甘蓝', season: 2, seedPrice: 40, days: 3, yield: 3, sellPrice: 55, desc: '耐寒又漂亮的绿叶。' },
    sunflower:  { name: '向日葵', season: 2, seedPrice: 120, days: 5, yield: 1, sellPrice: 200, desc: '永远朝着太阳的方向。' },
    radish:     { name: '萝卜',   season: 3, seedPrice: 30,  days: 3, yield: 2, sellPrice: 50,  desc: '冬天里脆生生的甜。' },
    beetroot:   { name: '甜菜根', season: 3, seedPrice: 50,  days: 4, yield: 2, sellPrice: 60,  desc: '把雪地映得通红。' },
    wheat:      { name: '小麦',   season: 3, seedPrice: 20,  days: 3, yield: 3, sellPrice: 45,  desc: '面包与面条的起点。' },
  };
  Object.keys(C).forEach(function (k) { WV.DATA.crops[k] = C[k]; });
})();
