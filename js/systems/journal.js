/**
 * journal.js —— 四册图鉴（精灵/料理食谱/家具/回忆相册，PRD §3.6）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  // ---- 精灵 ----
  function spiritMet(id) {
    if (WV.state.journal.spirits[id]) return;
    WV.state.journal.spirits[id] = 1; // 相遇
    const sp = WV.DATA.spirits[id];
    WV.S.UI.toast(`图鉴收录：${sp.name} 🔔`);
    WV.Audio.playSfx('sfx_jingle_achieve');
    WV.emit('journal:add');
    checkSpiritAll();
  }
  function spiritBond(id) {
    WV.state.journal.spirits[id] = 2;
    WV.emit('journal:add');
    checkSpiritAll();
  }
  function bondCount() {
    return Object.keys(WV.state.journal.spirits).filter(function (k) { return WV.state.journal.spirits[k] >= 2; }).length;
  }
  function checkSpiritAll() {
    if (Object.keys(WV.state.journal.spirits).length >= 9 && !WV.state.flags.spirit_all) {
      WV.state.flags.spirit_all = true;
      WV.S.UI.toast('精灵图鉴集齐！自由模式中精灵们会来田园做客 ✨');
    }
  }

  // ---- 料理 ----
  function addDish(id) {
    if (!WV.state.journal.furniture) WV.state.journal.furniture = {};
    if (!WV.state.journal.dishes) WV.state.journal.dishes = {};
    if (WV.state.journal.dishes[id]) return;
    WV.state.journal.dishes[id] = true;
    WV.emit('journal:add');
    if (Object.keys(WV.state.journal.dishes).length >= 16 && !WV.state.flags.dish_all) {
      WV.state.flags.dish_all = true;
      WV.S.UI.toast('食谱图鉴集齐！料理「大成功」率提升了 ✨');
    }
  }

  // ---- 家具 ----
  function addFurniture(id) {
    if (WV.state.journal.furniture[id]) return;
    WV.state.journal.furniture[id] = true;
    WV.emit('journal:add');
    // 集齐全部可得家具（24 件）→ 发放奖励品星沙瓶并点亮图鉴（第 25 格）
    if (Object.keys(WV.state.journal.furniture).length >= 24 && !WV.state.flags.furn_all) {
      WV.state.flags.furn_all = true;
      WV.state.furnitureOwned.f_starbottle = true;
      WV.S.Journal.addFurniture('f_starbottle');
      WV.S.UI.toast('家具图鉴集齐！获得了「星沙瓶」✨（去客厅摆上它吧）');
    }
  }

  // ---- 作物（顺带记录）----
  function addCrop(id) {
    WV.state.journal.crops[id] = true;
    WV.emit('journal:add');
  }

  // ---- 回忆 ----
  function addMemory(no) {
    const st = WV.state;
    if (st.journal.memories.indexOf(no) >= 0) return;
    st.journal.memories.push(no);
    const mem = WV.DATA.memories[no];
    WV.emit('journal:add');
    // 回忆闪回模式（PRD §2.4.4：80-120 字奶奶视角短文）
    WV.state.freeze = true;
    const el = document.getElementById('memory');
    document.getElementById('memory-title').textContent = `回忆 · ${mem.title}`;
    document.getElementById('memory-text').textContent = mem.text;
    el.classList.remove('hidden');
    WV.Audio.playBgm('bgm_memory');
    document.getElementById('memory-ok').onclick = function () {
      el.classList.add('hidden');
      WV.state.freeze = false;
      WV.S.UI.toast(`回忆相册 ${st.journal.memories.length}/12`);
      WV.emit('scene:enter', WV.Scene.def); // 恢复场景 BGM
      if (st.journal.memories.length >= 12) WV.S.UI.toast('十二段回忆集齐了——风铃节上，会有什么在等着你…🔔');
    };
  }

  S.spiritMet = spiritMet; S.spiritBond = spiritBond; S.bondCount = bondCount;
  S.addDish = addDish; S.addFurniture = addFurniture; S.addCrop = addCrop; S.addMemory = addMemory;
  WV.S.Journal = S;
})();
