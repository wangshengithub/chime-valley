/**
 * settings.js —— 设置（音量/文字速度/减少动效/字号/重置存档，PRD §5.1）
 */
(function () {
  'use strict';
  const WV = window.WV;

  const S = {};

  function apply() {
    const s = WV.state.settings;
    WV.Audio.applySettings({ bgmVol: s.bgmVol, sfxVol: s.sfxVol, muted: s.muted });
    WV.Dialogue.speed = s.textSpeed;
    document.body.classList.toggle('big-font', !!s.bigFont);
  }

  function panel() {
    const s = WV.state.settings;
    // 分段按钮：v=候选值，s.textSpeed=当前值
    const seg = function (v, label) {
      return `<button class="${v === s.textSpeed ? 'on' : ''}" onclick="WV.S.Settings.set('textSpeed', ${v}, true)">${label}</button>`;
    };
    const toggle = function (key, checked) {
      return `<label class="wx-toggle"><input type="checkbox" ${checked ? 'checked' : ''} onchange="WV.S.Settings.set('${key}', this.checked)"><span class="tk"></span></label>`;
    };
    WV.S.UI.panel(`
      <div class="panel-title">⚙️ 设置 <button class="panel-close" onclick="WV.S.Settings.saveClose()">保存并关闭</button></div>
      <div class="row-line"><span>BGM 音量 <b id="vol-bgm-num">${Math.round(s.bgmVol * 100)}%</b></span>
        <input type="range" class="wx-range" min="0" max="1" step="0.05" value="${s.bgmVol}"
          oninput="WV.S.Settings.set('bgmVol', +this.value);document.getElementById('vol-bgm-num').textContent=Math.round(this.value*100)+'%'"></div>
      <div class="row-line"><span>音效音量 <b id="vol-sfx-num">${Math.round(s.sfxVol * 100)}%</b></span>
        <input type="range" class="wx-range" min="0" max="1" step="0.05" value="${s.sfxVol}"
          oninput="WV.S.Settings.set('sfxVol', +this.value);document.getElementById('vol-sfx-num').textContent=Math.round(this.value*100)+'%'"></div>
      <div class="row-line"><span>全部静音</span>${toggle('muted', s.muted)}</div>
      <div class="row-line"><span>文字速度</span>
        <span class="wx-seg">${seg(18, '慢')}${seg(30, '标准')}${seg(80, '快')}</span></div>
      <div class="row-line"><span>减少动效（关闭粒子与闪烁）</span>${toggle('reduceMotion', s.reduceMotion)}</div>
      <div class="row-line"><span>大字号</span>${toggle('bigFont', s.bigFont)}</div>
      <div style="text-align:center;margin-top:20px">
        <button class="btn-act primary" onclick="WV.S.Settings.saveClose()">💾 保存设置</button>
        <button class="btn-act danger" onclick="WV.S.Settings.resetFlow()">重置存档</button>
      </div>
      <p class="desc" style="margin-top:12px;text-align:center">进度保存在浏览器本地（localStorage）。清理浏览器数据会丢失进度，敬请留意。</p>
    `);
  }

  function saveClose() {
    WV.Save.saveNow();
    WV.S.UI.closePanel();
    WV.S.UI.toast('设置已保存 ✅');
  }

  function set(k, v, rerender) {
    WV.state.settings[k] = v;
    apply();
    WV.emit('state:dirty');
    if (k === 'sfxVol' || k === 'muted') WV.Audio.playSfx('sfx_click');
    if (k === 'textSpeed') {
      WV.S.UI.toast('文字速度已调整（对下一条对话生效）');
      if (rerender) panel();   // 重渲染使分段按钮高亮同步
    }
  }

  /** 重置：二次确认（输入「风铃」，PRD §5.2） */
  function resetFlow() {
    WV.S.UI.panel(`
      <div class="panel-title">⚠️ 重置存档 <button class="panel-close" onclick="WV.S.UI.closePanel()">取消</button></div>
      <p class="desc">这会永久删除你的全部进度（${WV.S.Time.dayLabel()}），无法恢复。<br>确认的话，请输入「风铃」：</p>
      <div style="text-align:center;margin-top:14px">
        <input id="reset-confirm" style="font-family:var(--ui-font);font-size:18px;padding:6px 12px;border:2px solid var(--wood-d);border-radius:8px;text-align:center">
        <br><br>
        <button class="btn-act danger" onclick="WV.S.Settings.resetDo()">永久删除</button>
        <button class="btn-act" onclick="WV.S.UI.closePanel()">取消</button>
      </div>
    `);
    setTimeout(function () { const i = document.getElementById('reset-confirm'); if (i) i.focus(); }, 50);
  }

  function resetDo() {
    const i = document.getElementById('reset-confirm');
    if (!i || i.value.trim() !== '风铃') { WV.S.UI.toast('请输入「风铃」确认'); return; }
    WV.Save.reset();
    location.reload();
  }

  S.apply = apply; S.panel = panel; S.set = set; S.saveClose = saveClose; S.resetFlow = resetFlow; S.resetDo = resetDo;
  WV.S.Settings = S;
})();
