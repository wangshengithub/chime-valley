/**
 * furniture.js —— 24 件家具（PRD §3.4.3：客厅/卧室/庭院 各 8）
 * quest: true = 剧情家具（不可购买）
 */
(function () {
  'use strict';
  const WV = window.WV;
  const F = {
    // 客厅
    f_round_table: { name: '圆木桌椅', area: 'living', price: 200, comfort: 4 },
    f_fireplace:   { name: '壁炉',     area: 'living', price: 1200, comfort: 8 },
    f_rocker:      { name: '奶奶的摇椅', area: 'living', price: 0, comfort: 6, quest: true },
    f_shelf:       { name: '书架',     area: 'living', price: 350, comfort: 4 },
    f_rug:         { name: '手织地毯', area: 'living', price: 400, comfort: 5 },
    f_painting:    { name: '山谷挂画', area: 'living', price: 500, comfort: 4 },
    f_curtain:     { name: '碎花窗帘', area: 'living', price: 250, comfort: 3 },
    f_plant:       { name: '龟背竹盆栽', area: 'living', price: 100, comfort: 2 },
    // 卧室
    f_bed_up:      { name: '加厚木床', area: 'bedroom', price: 1000, comfort: 8 },
    f_lamp:        { name: '床头灯',   area: 'bedroom', price: 150, comfort: 3 },
    f_wardrobe:    { name: '橡木衣柜', area: 'bedroom', price: 600, comfort: 5 },
    f_blanket:     { name: '毛毯架',   area: 'bedroom', price: 200, comfort: 4 },
    f_brag:        { name: '小圆地毯', area: 'bedroom', price: 120, comfort: 2 },
    f_bell_deco:   { name: '风铃挂饰', area: 'bedroom', price: 300, comfort: 4 },
    f_desk:        { name: '日记桌',   area: 'bedroom', price: 450, comfort: 3 },
    f_heater:      { name: '小暖炉',   area: 'bedroom', price: 800, comfort: 6 },
    // 庭院
    f_flowerbed:   { name: '花坛',     area: 'court', price: 180, comfort: 3 },
    f_swing:       { name: '秋千椅',   area: 'court', price: 900, comfort: 7 },
    f_mailbox:     { name: '小鸟信箱', area: 'court', price: 100, comfort: 2 },
    f_lantern:     { name: '石灯笼',   area: 'court', price: 350, comfort: 4 },
    f_birdbath:    { name: '小鸟浴盆', area: 'court', price: 280, comfort: 3 },
    f_bench:       { name: '长椅',     area: 'court', price: 220, comfort: 3 },
    f_fence_set:   { name: '白栅栏套装', area: 'court', price: 80, comfort: 2 },
    f_wishbell:    { name: '许愿风铃', area: 'court', price: 0, comfort: 8, quest: true },
    f_starbottle:  { name: '星沙瓶', area: 'living', price: 0, comfort: 5, quest: true },   // 家具图鉴集齐奖励（PRD §3.6）
  };
  Object.keys(F).forEach(function (k) { WV.DATA.furniture[k] = F[k]; });
})();
