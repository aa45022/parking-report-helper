/*
 * 違停檢舉助手：官方檢舉網頁自動填表程式
 *
 * 用法：在官方檢舉網頁上執行（Safari 書籤）。畫面上方會出現一個框框，
 * 貼上 App 複製的「自動填表資料」，程式依欄位標籤找到對應的格子並填入。
 *
 * 原則：不填驗證碼、不勾同意條款、不上傳檔案、不按送出。
 */
(function () {
  'use strict';
  var SKIP = /驗證碼|captcha|密碼|password|附件|上傳|檔案/i;
  var PANEL_ID = 'prh-autofill-panel';

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\s*＊:：()（）［］\[\]、，,.。]/g, '');
  }
  function txt(n) { return n ? String(n.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }

  function visible(el) {
    if (window.__PRH_TEST__) return true;
    if (el.disabled || el.readOnly) return false;
    var r = el.getClientRects();
    if (!r.length) return false;
    var st = getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none';
  }

  function candidates() {
    var out = [];
    var nodes = document.querySelectorAll('input, select, textarea');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest('#' + PANEL_ID)) continue;
      if (el.tagName === 'INPUT') {
        var t = (el.getAttribute('type') || 'text').toLowerCase();
        if (['hidden', 'file', 'checkbox', 'radio', 'submit', 'button', 'image', 'reset', 'password'].indexOf(t) >= 0) continue;
      }
      if (el.disabled || el.readOnly) continue;
      if (!visible(el)) continue;
      out.push(el);
    }
    return out;
  }

  // 找出這個欄位的標籤文字（各種常見寫法都試）
  function labelText(el) {
    var t = [];
    if (el.id) {
      var l = document.querySelector('label[for="' + cssEsc(el.id) + '"]');
      if (l) t.push(txt(l));
    }
    var lb = el.getAttribute('aria-labelledby');
    if (lb) lb.split(/\s+/).forEach(function (id) { var n = document.getElementById(id); if (n) t.push(txt(n)); });
    ['aria-label', 'placeholder', 'title', 'name', 'id'].forEach(function (a) { var v = el.getAttribute(a); if (v) t.push(v); });
    var pl = el.closest('label');
    if (pl) t.push(txt(pl));
    var td = el.closest('td');
    if (td) {
      var prevCell = td.previousElementSibling;
      if (prevCell && txt(prevCell).length <= 40) t.push(txt(prevCell));
      var tr = td.parentElement, th = tr && tr.querySelector('th');
      if (th) t.push(txt(th));
    }
    var node = el, depth = 0;
    while (node && node !== document.body && depth < 4) {
      var sib = node.previousElementSibling;
      while (sib && !txt(sib)) sib = sib.previousElementSibling;
      if (sib) {
        var s = txt(sib);
        if (s.length <= 40) { t.push(s); break; }
      }
      node = node.parentElement; depth++;
    }
    return norm(t.join(' '));
  }

  function score(text, labels) {
    var best = 0;
    for (var i = 0; i < labels.length; i++) {
      var k = norm(labels[i]);
      var w = /[^\x00-\x7f]/.test(k) ? 3 : 1; // 中文標籤比英文屬性名稱可靠
      if (k && text.indexOf(k) >= 0) best = Math.max(best, k.length * w + (text === k ? 5 : 0));
    }
    return best;
  }

  function setValue(el, v) {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, v); else el.value = v;
    ['input', 'change', 'keyup', 'blur'].forEach(function (ev) { el.dispatchEvent(new Event(ev, { bubbles: true })); });
  }

  function numbersIn(s) { return (String(s).match(/\d+/g) || []).map(Number); }

  function pickOption(sel, f) {
    var opts = Array.prototype.slice.call(sel.options);
    var i;
    if (f.kind === 'date') {
      for (i = 0; i < opts.length; i++) {
        var n = numbersIn(opts[i].text + ' ' + opts[i].value);
        for (var j = 0; j + 1 < n.length; j++) if (n[j] === f.m && n[j + 1] === f.d) return opts[i];
      }
      return null;
    }
    var v = norm(f.value);
    if (!v) return null;
    for (i = 0; i < opts.length; i++) if (norm(opts[i].text) === v || norm(opts[i].value) === v) return opts[i];
    if (f.kind === 'time') return null; // 時間只接受完全相同，避免「14:32」誤選到「14」
    for (i = 0; i < opts.length; i++) { var o = norm(opts[i].text); if (o.length >= 2 && (o.indexOf(v) >= 0 || v.indexOf(o) >= 0)) return opts[i]; }
    return null;
  }

  function looksLikeRange(sel, max) {
    var n = 0;
    for (var i = 0; i < sel.options.length; i++) { var x = numbersIn(sel.options[i].text); if (x.length === 1 && x[0] <= max) n++; }
    return n >= Math.min(12, max);
  }
  function nextSelect(el) {
    var all = Array.prototype.slice.call(document.querySelectorAll('select'));
    var i = all.indexOf(el);
    return i >= 0 && i + 1 < all.length ? all[i + 1] : null;
  }
  function setSelectNumber(sel, num) {
    for (var i = 0; i < sel.options.length; i++) {
      var x = numbersIn(sel.options[i].text);
      if (x.length === 1 && x[0] === num) { setValue(sel, sel.options[i].value); return true; }
    }
    return false;
  }

  function fillOne(el, f) {
    var type = (el.getAttribute('type') || '').toLowerCase();
    if (el.tagName === 'SELECT') {
      if (f.kind === 'time') {
        var exact = pickOption(el, f);
        if (exact) { setValue(el, exact.value); return true; }
        if (looksLikeRange(el, 23) && setSelectNumber(el, f.h)) {
          var ms = nextSelect(el);
          if (ms && looksLikeRange(ms, 59)) { setSelectNumber(ms, f.min); mark(ms); }
          return true;
        }
        return false;
      }
      var opt = pickOption(el, f);
      if (!opt) return false;
      setValue(el, opt.value);
      return true;
    }
    if (f.kind === 'date' && type === 'date') { setValue(el, f.iso); return true; }
    if (f.kind === 'time' && type === 'time') { setValue(el, f.value); return true; }
    if (f.kind === 'plate') {
      var box = el.parentElement, depth = 0, inputs = [];
      while (box && depth < 3) {
        inputs = Array.prototype.slice.call(box.querySelectorAll('input')).filter(function (x) {
          var t = (x.getAttribute('type') || 'text').toLowerCase();
          return t === 'text' || t === '';
        });
        if (inputs.length >= 2) break;
        box = box.parentElement; depth++;
      }
      if (inputs.length === 2 && f.parts && f.parts.length === 2) {
        setValue(inputs[0], f.parts[0]); setValue(inputs[1], f.parts[1]); mark(inputs[0]); mark(inputs[1]);
        return true;
      }
    }
    var v = String(f.value);
    var max = parseInt(el.getAttribute('maxlength'), 10);
    if (max > 0 && v.length > max) v = v.slice(0, max);
    setValue(el, v);
    return true;
  }

  function mark(el) {
    el.style.outline = '3px solid #1d7a4e';
    el.style.outlineOffset = '1px';
    el.style.backgroundColor = '#e3f3ea';
  }

  function fill(data) {
    var els = candidates();
    var info = els.map(function (el) { return { el: el, text: labelText(el) }; });
    var used = [];
    var report = [];
    var fields = (data.fields || []).filter(function (f) { return f && f.value; }).slice();
    fields.sort(function (a, b) {
      var la = Math.max.apply(null, a.labels.map(function (x) { return norm(x).length; }));
      var lb = Math.max.apply(null, b.labels.map(function (x) { return norm(x).length; }));
      return lb - la;
    });
    fields.forEach(function (f) {
      var best = null, bestScore = 0;
      info.forEach(function (it) {
        if (used.indexOf(it.el) >= 0 || SKIP.test(it.text)) return;
        var s = score(it.text, f.labels);
        if (s && f.prefer && it.el.tagName.toLowerCase() === f.prefer) s += 3;
        if (s > bestScore) { bestScore = s; best = it; }
      });
      var ok = false;
      if (best) {
        try { ok = fillOne(best.el, f); } catch (e) { ok = false; }
        if (ok) { used.push(best.el); mark(best.el); }
      }
      report.push({ name: f.name || f.labels[0], ok: ok });
    });
    return report;
  }

  function panel() {
    var old = document.getElementById(PANEL_ID);
    if (old) old.remove();
    var p = document.createElement('div');
    p.id = PANEL_ID;
    p.setAttribute('style', 'position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;background:#fff;color:#15202b;border:2px solid #1d5bab;border-radius:12px;padding:12px;font:15px/1.5 -apple-system,"PingFang TC",sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);max-height:70vh;overflow:auto');
    p.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>違停自動填表</b><button type="button" data-x style="font:inherit;border:1px solid #ccc;background:#f4f4f4;border-radius:8px;padding:4px 12px">關閉</button></div>' +
      '<div data-body><p style="margin:8px 0">在下面框框<b>長按 → 貼上</b>，就會自動填好。</p>' +
      '<textarea data-in rows="3" style="width:100%;box-sizing:border-box;font:inherit;border:1px solid #999;border-radius:8px;padding:8px" placeholder="長按這裡，選「貼上」"></textarea></div>';
    document.body.appendChild(p);
    p.querySelector('[data-x]').onclick = function () { p.remove(); };
    return p;
  }

  function showReport(p, report) {
    var okN = report.filter(function (r) { return r.ok; }).length;
    var miss = report.filter(function (r) { return !r.ok; }).map(function (r) { return r.name; });
    var body = p.querySelector('[data-body]');
    body.innerHTML = '';
    var h = document.createElement('p');
    h.style.margin = '8px 0';
    h.textContent = '已填好 ' + okN + ' 欄（綠色框）。';
    body.appendChild(h);
    if (miss.length) {
      var m = document.createElement('p');
      m.style.margin = '0 0 8px';
      m.style.color = '#9a5b00';
      m.textContent = '這些欄位沒找到，請自己填：' + miss.join('、');
      body.appendChild(m);
    }
    var n = document.createElement('p');
    n.style.margin = '0';
    n.textContent = '請檢查內容，再自己輸入驗證碼、上傳照片、按送出。如果頁面換到下一步，可以再點一次書籤繼續填。';
    body.appendChild(n);
  }

  function parse(t) {
    try { var d = JSON.parse(t); return d && d.app === 'prh' && Array.isArray(d.fields) ? d : null; } catch (e) { return null; }
  }

  function start() {
    if (typeof __PRH_DATA !== 'undefined' && __PRH_DATA) {
      var r = fill(__PRH_DATA);
      if (typeof completion === 'function') completion('已填好 ' + r.filter(function (x) { return x.ok; }).length + ' 欄');
      return r;
    }
    var p = panel();
    var ta = p.querySelector('[data-in]');
    var go = function () {
      var d = parse(ta.value);
      if (!d) return;
      showReport(p, fill(d));
    };
    ta.addEventListener('input', go);
    ta.addEventListener('paste', function () { setTimeout(go, 0); });
    try { ta.focus(); } catch (e) {}
  }

  if (window.__PRH_TEST__) window.__PRH_FILL__ = fill; else start();
})();
