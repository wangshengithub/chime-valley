/**
 * recipes.js —— 16 道料理（PRD §3.4.2 总表，材料按素材库实际可得性适配）
 */
(function () {
  'use strict';
  const WV = window.WV;
  const R = {
    salad:      { name: '田园沙拉',   price: 100, materials: [['c_carrot', 1], ['m_honey', 1]], desc: '春天的清爽滋味。' },
    jam:        { name: '蓝莓果酱',   price: 150, materials: [['c_blueberry', 2]], desc: '抹在面包上，一整天都是甜的。' },
    cake:       { name: '莓果蛋糕',   price: 160, materials: [['c_blueberry', 2], ['m_milk', 1], ['m_flour', 1]], desc: '松软的蛋糕，苏婆婆和豆豆的最爱。' },
    stew:       { name: '土豆炖菜',   price: 110, materials: [['c_potato', 2], ['m_milk', 1]], desc: '咕嘟咕嘟，岩伯的本命。' },
    cold_soup:  { name: '夏日冷汤',   price: 100, materials: [['c_cauliflower', 1], ['m_honey', 1]], desc: '冰凉清甜，夏天的味道。' },
    corn_bake:  { name: '烤蔬菜拼盘', price: 120, materials: [['c_cabbage', 1], ['m_chestnut', 1]], desc: '滋滋作响的焦香。' },
    summer_bowl:{ name: '冰镇果盘',   price: 260, materials: [['c_blueberry', 3], ['m_flower', 1]], desc: '夏祭限定的豪华甜品。' },
    souffle:    { name: '蛋奶舒芙蕾', price: 130, materials: [['m_egg', 2], ['m_milk', 1], ['m_flour', 1]], desc: '顾先生念念不忘的手艺。' },
    soup:       { name: '南瓜浓汤',   price: 150, materials: [['c_pumpkin', 1], ['m_milk', 1]], desc: '秋夜的暖橙色。' },
    bake_roots: { name: '蜜烤根茎',   price: 140, materials: [['c_radish', 1], ['m_honey', 1]], desc: '甜味渗进每一丝纹理。' },
    veg_soup:   { name: '山珍蔬菜汤', price: 120, materials: [['c_kale', 1], ['m_mushroom', 2]], desc: '花花阿姨教的秘方。' },
    chestnut:   { name: '蜜烤板栗',   price: 140, materials: [['m_chestnut', 3], ['m_honey', 1]], desc: '秋天街头的手温。' },
    hot_pot:    { name: '萝卜暖锅',   price: 150, materials: [['c_radish', 2], ['m_tofu', 1]], desc: '冬天里全屋子的暖意。' },
    tofu_stew:  { name: '白菜炖豆腐', price: 130, materials: [['c_cabbage', 1], ['m_tofu', 1]], desc: '简单，但让人想家。' },
    cocoa:      { name: '热可可',     price: 75,  materials: [['m_milk', 1], ['m_honey', 1]], desc: '雪夜里捧着一杯，就是幸福。' },
    honey_cake: { name: '奶奶的蜂蜜蛋糕', price: 0, materials: [['m_flour', 2], ['m_honey', 2], ['m_milk', 1]], desc: '食谱册最后一页的隐藏料理——风铃节的必要之物。（不可出售）', hidden: true },
  };
  Object.keys(R).forEach(function (k) { WV.DATA.recipes[k] = R[k]; });
})();
