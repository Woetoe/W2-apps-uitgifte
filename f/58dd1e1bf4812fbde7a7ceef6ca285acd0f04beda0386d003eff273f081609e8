/* W2 Apps — kleine hulpjes voor de tools: onderblad (dialoog), bevestigen, melding, slotscherm, iconen. */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  // Iconen (lijnstijl, 24x24)
  const P = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    plane: '<path d="M10.5 13.5L4 11l1.5-1.5 7 1L17 6a2 2 0 0 1 3 3l-4.5 4.5 1 7L15 22l-2.5-6.5-3.5 3.5V21l-1.5 1-1-3.5L3 17.5 4 16h2z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    cake: '<path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 16c2 1.5 3 1.5 4.7 0s3 1.5 4.6 0 3 1.5 4.7 0M12 12V8M12 5.5c.9-1 .9-2 0-3-.9 1-.9 2 0 3z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    run: '<circle cx="14" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v4M6 12l3-4 4 1 2 3 3 1M11 15l-2-3"/>',
    pot: '<path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM2 10h2M20 10h2M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M10 2h4"/>',
    minus: '<path d="M5 12h14"/>'
  };
  const icon = (n, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${P[n] || ''}</svg>`;

  // Terugknop van Android: eerst een open onderblad sluiten, dan de pagina zelf (window.UIback).
  const backStack = [];
  window.__w2back = function () {
    if (backStack.length) { backStack[backStack.length - 1](); return true; }
    if (typeof window.UIback === 'function') return !!window.UIback();
    return false;
  };

  /** Onderblad. buttons: [{label, value, kind:'q'|'danger'|''}]. Geeft {el, done:Promise<{value, form}>, close}. */
  function sheet(title, html, buttons, opts) {
    opts = opts || {};
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    const el = document.createElement('div');
    el.className = 'sheet';
    el.setAttribute('role', 'dialog');
    el.innerHTML = `<div class="grab"></div>${title ? `<h3>${esc(title)}</h3>` : ''}<div class="body">${html || ''}</div>` +
      (buttons && buttons.length ? `<div class="btns">${buttons.map((b, i) => `<button class="btn ${b.kind || ''}" data-i="${i}" type="button">${b.label}</button>`).join('')}</div>` : '');
    document.body.append(scrim, el);
    requestAnimationFrame(() => { scrim.classList.add('show'); el.classList.add('show'); });
    let resolve;
    const done = new Promise(r => { resolve = r; });
    const form = () => {
      const o = {};
      $$('[name]', el).forEach(i => { o[i.name] = i.type === 'checkbox' ? i.checked : i.value; });
      return o;
    };
    let closed = false;
    const close = value => {
      if (closed) return;
      closed = true;
      const f = form();
      const i = backStack.indexOf(onBack);
      if (i >= 0) backStack.splice(i, 1);
      scrim.classList.remove('show');
      el.classList.remove('show');
      setTimeout(() => { scrim.remove(); el.remove(); }, 220);
      resolve({ value, form: f });
    };
    const onBack = () => close(null);
    backStack.push(onBack);
    scrim.onclick = () => close(null);
    el.addEventListener('click', e => {
      const b = e.target.closest('.btns > [data-i]');
      if (!b || !el.contains(b)) return;
      const btn = buttons[+b.dataset.i];
      if (btn.check) {
        const msg = btn.check(form());
        if (msg) { toast(msg); return; }
      }
      close(btn.value);
    });
    if (opts.focus !== false) setTimeout(() => { const f = $('input:not([type=checkbox]):not([type=hidden]),textarea', el); if (f && !f.value && opts.focus) f.focus(); }, 250);
    return { el, done, close };
  }

  function confirm(text, ok, danger) {
    return sheet(null, `<div style="font-size:17px">${text}</div>`, [
      { label: 'Annuleren', value: false, kind: 'q' },
      { label: ok || 'OK', value: true, kind: danger ? 'danger' : '' }
    ]).done.then(r => r.value === true);
  }

  let toastEl, toastT;
  function toast(text, ms) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), ms || 2600);
  }

  /** Slotscherm in `host` als het onderdeel op slot zit. Roept onOpen() aan zodra het open is. */
  function gate(host, area, label, onOpen) {
    const L = window.W2D && W2D.lock;
    if (!L || !L.needed(area)) { onOpen(); return; }
    host.innerHTML = `<div class="gate">${icon('lock')}<b>${esc(label)} zit op slot</b><span class="muted">Ontgrendel met je vingerafdruk of de pincode van je telefoon.</span><button class="btn" type="button">${icon('unlock')}Ontgrendelen</button></div>`;
    const go = () => L.unlock(label + ' ontgrendelen').then(ok => { if (ok) onOpen(); });
    $('button', host).onclick = go;
    go();
  }

  /** Melding bovenaan als de app zelf (niet alleen de spelbestanden) bijgewerkt moet worden. */
  function outdated(host) {
    if (!(window.W2D && W2D.outdated)) return false;
    host.innerHTML = `<div class="notice"><b>Werk eerst de app bij.</b> Dit onderdeel heeft de nieuwe app-versie nodig (veilige opslag en slot). Ga naar Instellingen (tandwiel op het startscherm) › Updates › Zoeken › Installeren.</div>`;
    return true;
  }

  // Kopbalk krijgt een lijntje zodra je scrolt
  addEventListener('scroll', () => { const t = $('.top'); t && t.classList.toggle('scrolled', scrollY > 4); }, { passive: true });

  const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' kB';

  window.UI = { esc, $, $$, icon, sheet, confirm, toast, gate, outdated, fmtSize };
})();
