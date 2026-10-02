/**
 * dialogue.js —— 对话框系统（打字机/加速/选项/旁白）
 * 队列式：say(speaker, text) 逐条推进；choices 支持分支。
 * 空格/点击推进；正文完全显示前点击=立即显示全文。
 */
(function () {
  'use strict';
  const WV = window.WV;

  const el = { root: null, speaker: null, text: null, next: null, choices: null };
  const queue = [];
  let showing = null;      // {speaker, text, choices, cb}
  let typed = 0, typeTimer = null;
  let speed = 30;          // 字/秒

  function init() {
    el.root = document.getElementById('dialogue');
    el.speaker = document.getElementById('dlg-speaker');
    el.text = document.getElementById('dlg-text');
    el.next = document.getElementById('dlg-next');
    el.choices = document.getElementById('dlg-choices');
    // HTML 层的对话框结构由 ui.js 注入 .dlg-box（保持 CSS 一致）
    el.root.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'dlg-box';
    box.appendChild(el.speaker);
    box.appendChild(el.text);
    box.appendChild(el.next);
    box.appendChild(el.choices);
    el.root.appendChild(box);
    box.addEventListener('click', function (e) {
      if (e.target.closest('.dlg-choice')) return;
      advance();
    });
  }

  function busy() { return !!showing || queue.length > 0; }

  /** 对话入队：{speaker, text, choices:[{text, cb}], cb}；speaker 为空 = 旁白 */
  function say(items) {
    (Array.isArray(items) ? items : [items]).forEach(function (it) { queue.push(it); });
    if (!showing) next();
  }
  function narrate(texts, cb) {
    const arr = Array.isArray(texts) ? texts : [texts];
    if (!arr.length) { if (cb) cb(); return; }   // 空数组守卫
    // cb 挂到最后一条（构造期挂载，避免依赖队列消费状态）
    const items = arr.map(function (t, i) { return { speaker: '', text: t }; });
    if (cb) items[items.length - 1].cb = cb;
    say(items);
  }

  function next() {
    clearInterval(typeTimer);   // 无论如何先停掉上一个打字机（防泄漏与空引用）
    showing = queue.shift();
    if (!showing) { el.root.classList.add('hidden'); WV.emit('dialogue:end'); return; }
    el.root.classList.remove('hidden');
    const box = el.root.querySelector('.dlg-box');
    box.classList.toggle('narration', !showing.speaker);
    el.speaker.textContent = showing.speaker || '';
    el.choices.innerHTML = '';
    el.next.style.display = 'none';
    typed = 0;
    el.text.textContent = '';
    typeTimer = setInterval(function () {
      typed += speed / 30;
      const n = Math.floor(typed);
      el.text.textContent = showing.text.slice(0, n);
      if (n >= showing.text.length) finishTyping();
    }, 33);
  }

  function finishTyping() {
    clearInterval(typeTimer);
    el.text.textContent = showing.text;
    if (showing.choices && showing.choices.length) {
      el.next.style.display = 'none';
      showing.choices.forEach(function (c) {
        const b = document.createElement('button');
        b.className = 'dlg-choice';
        b.textContent = '❀ ' + c.text;
        b.addEventListener('click', function () {
          WV.Audio.playSfx('sfx_confirm');
          const cb = c.cb;
          showing = null;
          if (cb) cb();  // cb 内部可能 say() 新对话（此时 showing 已被占）
          // 选择后推进：cb 未开启新对话且仍有队列则继续；否则关闭
          if (!showing && queue.length) next();
          else if (!showing && !queue.length) {
            el.root.classList.add('hidden');
            WV.emit('dialogue:end');
          }
        });
        el.choices.appendChild(b);
      });
    } else {
      el.next.style.display = '';
    }
  }

  function advance() {
    if (!showing) return;
    if (el.text.textContent.length < showing.text.length) {
      typed = showing.text.length; // 立即显示全文
      finishTyping();
      return;
    }
    if (showing.choices && showing.choices.length) return; // 等待选择
    WV.Audio.playSfx('sfx_click2');
    const cb = showing.cb;
    showing = null;
    if (cb) cb();
    // cb 内部可能 say() 新对话（此时 showing 已被占）；仅当 cb 未开启新对话时才继续推进
    if (!showing && queue.length) next();
    else if (!showing) {
      el.root.classList.add('hidden');
      WV.emit('dialogue:end');
    }
  }

  WV.on('dialogue:advance', advance);

  WV.Dialogue = { init: init, say: say, narrate: narrate, advance: advance, busy: busy, set speed(v) { speed = v; } };
})();
