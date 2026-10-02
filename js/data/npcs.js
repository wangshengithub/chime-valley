/**
 * npcs.js —— 七位镇民（PRD §2.4.2）：素材码 / 性格 / 喜好料理（送礼加成）
 */
(function () {
  'use strict';
  const WV = window.WV;
  const N = {
    granny_su: { code: 'granny_su', name: '苏婆婆', job: '杂货店老板娘，奶奶的故友', likes: ['cake', 'soup', 'jam'] },
    yanbo:     { code: 'yanbo', name: '岩伯', job: '老木匠', likes: ['stew', 'chestnut', 'bake_roots'] },
    xiaofei:   { code: 'xiaofei', name: '小飞', job: '邮差少年', likes: ['bake_roots', 'corn_bake'] },
    maiqi:     { code: 'maiqi', name: '麦琪', job: '面包房姐姐', likes: ['cold_soup', 'souffle'] },
    huahua:    { code: 'huahua', name: '花花阿姨', job: '牧场主', likes: ['veg_soup', 'salad'] },
    gu:        { code: 'gu', name: '顾先生', job: '旧书铺·镇史学者', likes: ['souffle', 'tofu_stew'] },
    doudou:    { code: 'doudou', name: '豆豆', job: '镇上的小女孩', likes: ['jam', 'cake', 'summer_bowl'] },
  };
  Object.keys(N).forEach(function (k) { WV.DATA.npcs[k] = N[k]; });
})();
