/* W2 Apps — gedeelde hulp voor alle pagina's.
   - Trillen via de app (de WebView zelf kan niet trillen).
   - W2.net: verbinding met andere telefoons. Twee manieren, voor de spellen precies hetzelfde:
       · dichtbij: Bluetooth/wifi zonder internet (Google Nearby, alleen in de Android-app);
       · via internet met een spelcode (inet.js; ook in de webversie, dus ook op een iPhone).
     Op spelpagina's staat inet.js vóór dit bestand; zonder inet.js blijft alleen dichtbij over.
   - W2.update: updates zoeken en installeren. */
(function () {
  const native = window.W2Native || null;

  // navigator.vibrate laten werken binnen de app
  if (native) {
    try {
      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: function (p) { try { native.vibrate(JSON.stringify(p)); } catch (e) {} return true; }
      });
    } catch (e) {}
  }

  const listeners = new Set();
  const deliver = ev => { listeners.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } }); };
  // Gebeurtenissen van de verbinding dichtbij. Loopt het spel via internet, dan horen die er niet doorheen te komen.
  const NET_EVENTS = new Set(['hosting', 'searching', 'found', 'lost', 'connecting', 'connected', 'disconnected', 'stopped', 'error', 'message']);
  window.__w2native = function (json) {
    let ev; try { ev = JSON.parse(json); } catch (e) { return; }
    if (via === 'inet' && NET_EVENTS.has(ev.type)) return;
    deliver(ev);
    if (NET_EVENTS.has(ev.type)) drawBadges();
  };

  // ------------------------------------------------------------------ database-regels
  // De regels voor Wouters eigen Firebase-database (zelfde als tools/firebase/regels.json; een test bewaakt dat).
  // Te kopiëren vanuit Instellingen, Ontwikkeling, Samen en het blad dat een spel laat zien als ze nog ontbreken.
const REGELS = "{\n  \"rules\": {\n    \".read\": false,\n    \".write\": false,\n    \"r\": {\n      \"$ruimte\": {\n        \".read\": \"$ruimte.length == 32\",\n        \".write\": \"$ruimte.length == 32\",\n        \"$soort\": {\n          \".validate\": \"$soort.matches(/^[a-z]{3,16}$/)\",\n          \"$id\": {\n            \".validate\": \"newData.child('v').isString() && newData.child('v').val().length < 1000000 && newData.child('t').isNumber()\"\n          }\n        }\n      }\n    },\n    \"g\": {\n      \"$kamer\": {\n        \".read\": \"$kamer.length == 32\",\n        \".write\": \"$kamer.length == 32\",\n        \"$soort\": {\n          \".validate\": \"$soort == 'p' || $soort == 'm'\",\n          \"$id\": {\n            \".validate\": \"newData.child('v').isString() && newData.child('v').val().length < 200000 && newData.child('t').isNumber()\"\n          }\n        }\n      }\n    },\n    \"s\": {\n      \"$ruimte\": {\n        \".read\": \"$ruimte.length == 32\",\n        \".write\": \"$ruimte.length == 32\",\n        \"$bestand\": {\n          \"$deel\": {\n            \".validate\": \"newData.child('v').isString() && newData.child('v').val().length < 3000000\"\n          }\n        }\n      }\n    }\n  }\n}\n";
  /** Tekst naar het klembord; geeft een Promise met true als het lukte. */
  function copy(text) {
    const old = () => {
      let ok = false;
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
      } catch (e) {}
      return ok;
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => old());
    } catch (e) {}
    return Promise.resolve(old());
  }

  // ------------------------------------------------------------------ dichtbij of via internet
  const GAME_NAMES = { dampoe: 'Dampoe Wars', schaken: 'Schaken', halma: 'Chinees dammen', backgammon: 'Backgammon', woordbord: 'Woordbord', kronkel: 'Kronkel', tegelrummy: 'Tegelrummy', dammen: 'Dammen', zeeslag: 'Zeeslag', klaverjassen: 'Klaverjassen', verbinding: 'Verbinding testen' };
  const pageDir = (function () { const p = location.pathname.split('/').filter(Boolean); if (p.length && !/\.html?$/.test(p[p.length - 1])) return p[p.length - 1]; return p.length > 1 ? p[p.length - 2] : ''; })();
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  let via = null;        // welke verbinding nu loopt: 'near' | 'inet' | null
  let multi = false;     // groepsspel?
  let last = null;       // laatste aanroep {fn, multi, name}, om van soort te kunnen wisselen
  const INET = window.W2Inet ? window.W2Inet.create({ url: window.W2_INET_URL, emit: inetEvent, onChange: () => drawBadges() }) : null;
  const inetOK = () => !!(INET && INET.available());
  const nearOK = m => !!(native && (!m || native.hostMulti));
  /** Voorkeur: wat je de laatste keer koos. In de webversie kan alleen internet. */
  function pref(m) {
    if (!nearOK(m)) return 'inet';
    if (!inetOK()) return 'near';
    return lsGet('w2-net-via') === 'inet' ? 'inet' : 'near';
  }

  function inetEvent(ev) {
    if (via !== 'inet') return;
    if (ev.type === 'error' && (ev.where === 'host' || ev.where === 'join')) {
      via = null;
      if (ev.code === 'inet-rules') showRulesSheet();
      else if (ev.where === 'join' && sheet.kind === 'code') showCodeError(explain(ev)); else closeSheet();
    }
    if (ev.type === 'connecting' || ev.type === 'connected') { if (sheet.kind === 'code') closeSheet(); }
    if (ev.type === 'connected' && !multi && sheet.kind === 'host') closeSheet();
    if (ev.type === 'stopped') { via = null; closeSheet(); }
    if (ev.type === 'disconnected' && INET && !INET.info().active) via = null;   // eruit gezet: de sessie is voorbij
    deliver(ev);
    drawBadges();
  }

  /** Spel maken of meedoen, op de gekozen manier. */
  function start(fn, m, name, mode) {
    name = name || 'Speler';
    stopTok++;
    last = { fn, multi: m, name };
    multi = m;
    if (mode === 'inet' && !inetOK()) mode = 'near';
    if (mode === 'near' && !nearOK(m)) mode = inetOK() ? 'inet' : 'near';
    if (mode === 'inet') {
      if (via === 'near' && native) { try { native.stop(); } catch (e) {} }   // de "gestopt" van dichtbij komt er niet meer doorheen
      via = 'inet';
      if (fn === 'host') {
        const was = INET.info();
        INET.host(name, { multi: m, game: pageDir });
        // Bij twee spelers is de code het volgende wat je nodig hebt: meteen laten zien. Bij een groepsspel staat hij in het balkje.
        if (!m && !(was.active && was.role === 'host')) showHostSheet();
      } else {
        deliver({ type: 'searching' });
        showCodeSheet();
      }
    } else {
      if (via === 'inet' && INET) INET.stop(true);
      closeSheet();
      via = 'near';
      if (native) {
        if (fn === 'host') (m ? native.hostMulti : native.host).call(native, name);
        else (m ? native.joinMulti : native.join).call(native, name);
      }
    }
    drawBadges();
  }
  function switchTo(mode) {
    lsSet('w2-net-via', mode);
    closeSheet();
    if (last && via) start(last.fn, last.multi, last.name, mode);
    drawBadges();
  }

  // ---- knopje in de lobby + blad (eigen opmaak, los van die van het spel)
  const sheet = { kind: null, el: null };
  let styled = false, stopTok = 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const prettyCode = c => String(c || '').replace(/^(.{3})(.{3})$/, '$1 $2');
  function style() {
    if (styled) return;
    styled = true;
    const st = document.createElement('style');
    st.id = 'w2n-css';
    st.textContent = `
.w2n-chip{display:inline-flex;align-items:center;gap:8px;max-width:100%;min-height:44px;padding:8px 14px;border-radius:999px;cursor:pointer;font:600 15px/1.2 system-ui,sans-serif;color:inherit;
  background:rgba(128,128,128,.14);border:1px solid rgba(128,128,128,.5);-webkit-tap-highlight-color:transparent;align-self:flex-start;text-align:left}
.w2n-chip b{font-weight:800;letter-spacing:.1em;font-variant-numeric:tabular-nums}
.w2n-chip i{font-style:normal;opacity:.7;font-weight:600}
.w2n-chip svg{width:18px;height:18px;flex:none}
.w2n-back{position:fixed;inset:0;z-index:9100;background:rgba(8,9,14,.62);display:flex;align-items:flex-end;justify-content:center}
.w2n-sheet{width:100%;max-width:520px;max-height:92vh;overflow:auto;background:#1d202c;color:#f2efe8;border-radius:22px 22px 0 0;border:1px solid #30344a;border-bottom:0;
  padding:22px 20px calc(env(safe-area-inset-bottom,0px) + 20px);font:16px/1.45 system-ui,sans-serif;display:flex;flex-direction:column;gap:14px;-webkit-user-select:none;user-select:none}
.w2n-sheet h2{margin:0;font:800 22px/1.2 var(--f-display,system-ui),system-ui,sans-serif;color:#f2efe8}
.w2n-sheet p{margin:0;color:#c9cbd8}
.w2n-code{font:800 44px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-align:center;color:#ffc83d;background:#14161f;border-radius:16px;padding:20px 8px;-webkit-user-select:text;user-select:text}
.w2n-in{width:100%;box-sizing:border-box;font:800 30px/1.2 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;text-align:center;text-transform:uppercase;color:#f2efe8;background:#14161f;border:2px solid #454a66;border-radius:16px;padding:16px 8px;-webkit-user-select:text;user-select:text}
.w2n-in:focus{outline:none;border-color:#ffc83d}
.w2n-in::placeholder{color:#5d627c;letter-spacing:.14em}
.w2n-btn{border:0;border-radius:14px;min-height:52px;padding:14px 16px;font:700 17px/1.2 system-ui,sans-serif;background:#ffc83d;color:#211a05;cursor:pointer;width:100%}
.w2n-btn.alt{background:#262a3b;color:#f2efe8;border:1px solid #454a66}
.w2n-btn.txt{background:none;color:#a3a6b9;min-height:44px;font-weight:600}
.w2n-btn:disabled{opacity:.5}
.w2n-opt{display:flex;gap:14px;align-items:center;text-align:left;border:1px solid #454a66;background:#262a3b;color:#f2efe8;border-radius:16px;padding:14px;min-height:64px;font:inherit;cursor:pointer;width:100%}
.w2n-opt.on{border-color:#ffc83d;background:#2f2a1c}
.w2n-opt svg{width:30px;height:30px;flex:none;color:#ffc83d}
.w2n-opt b{display:block;font-weight:800}
.w2n-opt span span{display:block;font-size:14px;color:#c9cbd8}
.w2n-sheet .w2n-err{color:#ff9d85;font-weight:600}
.w2n-note{font-size:14px;color:#a3a6b9}
@media (prefers-reduced-motion:no-preference){.w2n-sheet{animation:w2nup .18s ease-out}@keyframes w2nup{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}}`;
    document.head.appendChild(st);
  }
  const IC = {
    near: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10-5 5V2l5 5L7 17"/></svg>',
    inet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>'
  };

  /** Knopje voor in de lobby van een spel: laat zien hoe er verbonden wordt (of de spelcode) en opent bij tikken het blad. */
  function badge() {
    if (!inetOK()) return '';
    let html = '', what = 'mode', label = '';
    if (via === 'inet') {
      const i = INET.info();
      if (!i.active || i.role !== 'host') return '';
      what = 'code';
      html = IC.inet + (i.live ? `<span>Spelcode <b>${esc(prettyCode(i.code))}</b></span><i>· delen</i>` : '<span>Spel klaarzetten…</span>');
      label = 'Spelcode tonen en delen';
    } else if (native) {
      const m = via || pref(multi);
      html = IC[m] + `<span>${m === 'inet' ? 'Via internet' : 'Dichtbij'}</span><i>· wijzig</i>`;
      label = 'Kiezen: dichtbij via Bluetooth en wifi, of via internet';
    } else return '';
    style();
    return `<button type="button" class="w2n-chip" data-w2net="${what}" aria-label="${label}">${html}</button>`;
  }
  /** Knopjes die al op het scherm staan bijwerken (het spel tekent niet bij elke verandering opnieuw). */
  function drawBadges() {
    try {
      document.querySelectorAll('[data-w2net]').forEach(el => {
        const html = badge();
        if (!html) { el.remove(); return; }
        if (el.outerHTML !== html) { const t = document.createElement('template'); t.innerHTML = html; el.replaceWith(t.content.firstChild); }
      });
    } catch (e) {}
  }
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-w2net]') : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.dataset.w2net === 'code') showHostSheet(); else showModeSheet();
  }, true);

  function closeSheet() {
    if (sheet.el) sheet.el.remove();
    sheet.el = null; sheet.kind = null;
  }
  function openSheet(kind, html, onCancel) {
    closeSheet();
    style();
    const back = document.createElement('div');
    back.className = 'w2n-back';
    back.innerHTML = `<div class="w2n-sheet" role="dialog" aria-modal="true" aria-labelledby="w2n-title">${html}</div>`;
    back.addEventListener('click', e => { if (e.target === back) (onCancel || closeSheet)(); });
    back.addEventListener('keydown', e => { if (e.key === 'Escape') (onCancel || closeSheet)(); });
    (document.body || document.documentElement).appendChild(back);
    sheet.el = back; sheet.kind = kind; sheet.cancel = onCancel || closeSheet;
    return back;
  }
  const otherWay = () => (nearOK(multi) && inetOK() ? '<button type="button" class="w2n-btn txt" data-w="near">Liever dichtbij, zonder internet</button>' : '');

  function showHostSheet() {
    const i = INET ? INET.info() : {};
    if (!i.active) return;
    const game = GAME_NAMES[pageDir] || 'het spel';
    const el = openSheet('host', `
      <h2 id="w2n-title">Jouw spelcode</h2>
      <div class="w2n-code" aria-label="Spelcode ${esc(i.code.split('').join(' '))}">${esc(prettyCode(i.code))}</div>
      <p>De ander opent ${esc(game)}, kiest <b>${multi ? 'meedoen' : 'Meedoen'}</b> en typt deze code. Jullie hebben allebei internet nodig.</p>
      <button type="button" class="w2n-btn" data-w="share">Code delen</button>
      <button type="button" class="w2n-btn alt" data-w="ok">Verder</button>
      ${otherWay()}
      <p class="w2n-note" id="w2n-msg" aria-live="polite"></p>`);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      if (b.dataset.w === 'ok') closeSheet();
      else if (b.dataset.w === 'near') switchTo('near');
      else if (b.dataset.w === 'share') {
        const text = `Speel mee met ${game} in W2 Apps. Spelcode: ${prettyCode(i.code)}\nGeen app? Het kan ook in je browser: https://woetoe.github.io/W2-apps-uitgifte/web/`;
        const msg = el.querySelector('#w2n-msg');
        const copied = () => { msg.textContent = 'Gekopieerd. Plak het in een bericht aan de ander.'; };
        if (navigator.share && !native) navigator.share({ text }).catch(() => {});
        else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(copied, () => { msg.textContent = 'Kopiëren lukte niet. Lees de code voor of typ hem over.'; });
        else msg.textContent = 'Lees de code voor of typ hem over.';
      }
    });
    const ok = el.querySelector('[data-w=ok]'); if (ok) ok.focus();
  }

  /** De database kent spelen via internet nog niet: uitleggen wat er moet gebeuren, met de regels meteen te kopiëren. */
  function showRulesSheet() {
    const link = native ? '<b>console.firebase.google.com</b>' : '<a href="https://console.firebase.google.com/project/w2-samen/database/w2-samen-default-rtdb/rules" target="_blank" rel="noopener" style="color:#ffc83d">console.firebase.google.com</a>';
    const el = openSheet('rules', `
      <h2 id="w2n-title">Spelen via internet staat nog niet aan</h2>
      <p>De database van W2 (Firebase) moet de nieuwe regels nog krijgen. Dat hoeft maar één keer${native ? '' : ', en alleen door wie de database beheert'}.</p>
      <ol style="margin:0;padding-left:22px;color:#c9cbd8">
        <li>Tik hieronder op <b>Regels kopiëren</b>.</li>
        <li>Open ${link} › project <b>w2-samen</b> › <b>Realtime Database</b> › tabblad <b>Regels</b>.</li>
        <li>Vervang alles door wat je gekopieerd hebt en kies <b>Publiceren</b>.</li>
        <li>Kom terug en probeer het opnieuw.</li>
      </ol>
      <button type="button" class="w2n-btn" data-w="copy">Regels kopiëren</button>
      <p class="w2n-note" id="w2n-msg" aria-live="polite"></p>
      ${nearOK(multi) ? '<button type="button" class="w2n-btn alt" data-w="near">Nu dichtbij spelen (Bluetooth en wifi)</button>' : ''}
      <button type="button" class="w2n-btn txt" data-w="x">Sluiten</button>`);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      if (b.dataset.w === 'x') closeSheet();
      else if (b.dataset.w === 'near') { lsSet('w2-net-via', 'near'); closeSheet(); if (last) start(last.fn, last.multi, last.name, 'near'); }
      else if (b.dataset.w === 'copy') copy(REGELS).then(ok => {
        el.querySelector('#w2n-msg').textContent = ok ? 'Gekopieerd. Plak ze nu in Firebase en kies Publiceren.' : 'Kopiëren lukte niet. Kopieer ze in de app via Instellingen › Samen.';
      });
    });
  }

  function cancelJoin() {
    if (INET) INET.stop(true);
    via = null;
    closeSheet();
    deliver({ type: 'stopped' });
    drawBadges();
  }
  function showCodeSheet() {
    const el = openSheet('code', `
      <h2 id="w2n-title">Spelcode invullen</h2>
      <p>Vraag de code aan wie het spel heeft gemaakt. Jullie hebben allebei internet nodig.</p>
      <input class="w2n-in" id="w2n-code" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="40" placeholder="ABC 234" aria-label="Spelcode" value="${esc(prettyCode(INET.lastJoinCode()))}">
      <p class="w2n-err" id="w2n-err" role="alert" hidden></p>
      <button type="button" class="w2n-btn" data-w="go">Verbinden</button>
      <button type="button" class="w2n-btn alt" data-w="cancel">Annuleren</button>
      ${otherWay()}`, cancelJoin);
    const input = el.querySelector('#w2n-code'), go = el.querySelector('[data-w=go]'), err = el.querySelector('#w2n-err');
    const submit = () => {
      const code = window.W2Inet.cleanCode(input.value);
      if (!code) { err.hidden = false; err.textContent = 'Die code klopt niet. Een spelcode heeft 6 letters en cijfers.'; input.focus(); return; }
      err.hidden = true;
      go.disabled = true; go.textContent = 'Verbinden…'; input.disabled = true;
      if (via !== 'inet') { via = 'inet'; deliver({ type: 'searching' }); }
      INET.join(last ? last.name : 'Speler', code, { multi, game: pageDir });
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      if (b.dataset.w === 'go') submit();
      else if (b.dataset.w === 'cancel') cancelJoin();
      else if (b.dataset.w === 'near') switchTo('near');
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    try { input.focus(); input.select(); } catch (e) {}
  }
  function showCodeError(text) {
    if (sheet.kind !== 'code' || !sheet.el) return;
    const input = sheet.el.querySelector('#w2n-code'), go = sheet.el.querySelector('[data-w=go]'), err = sheet.el.querySelector('#w2n-err');
    err.hidden = false; err.textContent = text;
    go.disabled = false; go.textContent = 'Opnieuw proberen'; input.disabled = false;
    try { input.focus(); } catch (e) {}
  }
  function showModeSheet() {
    const cur = via || pref(multi);
    const opt = (mode, title, sub) => `<button type="button" class="w2n-opt${cur === mode ? ' on' : ''}" data-w="${mode}" aria-pressed="${cur === mode}">${IC[mode]}<span><b>${title}</b><span>${sub}</span></span></button>`;
    const el = openSheet('mode', `
      <h2 id="w2n-title">Hoe wil je verbinden?</h2>
      ${opt('near', 'Dichtbij', 'Bluetooth en wifi, zonder internet. Voor als je bij elkaar zit, ook in het vliegtuig.')}
      ${opt('inet', 'Via internet', 'Met een spelcode. Voor als je niet bij elkaar bent, of als de ander een iPhone of laptop heeft.')}
      <button type="button" class="w2n-btn txt" data-w="x">Sluiten</button>`);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      if (b.dataset.w === 'x' || b.dataset.w === cur) closeSheet();
      else switchTo(b.dataset.w);
    });
  }

  // Android-terugknop: eerst het blad dicht, dan pas wat de pagina zelf doet.
  (function () {
    let pageBack;
    try {
      Object.defineProperty(window, '__w2back', {
        configurable: true,
        get() { return function () { if (sheet.kind) { sheet.cancel(); return true; } return pageBack ? pageBack() : false; }; },
        set(fn) { pageBack = fn; }
      });
    } catch (e) {}
  })();

  // Uitleg bij foutcodes van Nearby, in gewone taal
  function explain(ev) {
    const c = String(ev.code || '');
    if (c === 'bt-off') return 'Bluetooth staat uit. Zet Bluetooth aan (in vliegtuigmodus mag dat) en probeer opnieuw.';
    if (c === 'location-off') return 'Locatie staat uit. Zonder locatie vindt Android geen telefoons in de buurt. Zet Locatie aan en probeer opnieuw.';
    if (c === 'gms') return 'Google Play-services ontbreekt of moet worden bijgewerkt. Werk het bij via de Play Store; zonder Play-services werkt spelen met meer telefoons niet.';
    if (c === 'permission-blocked') return 'De app mag geen telefoons in de buurt zoeken. Zet bij Rechten "Apparaten in de buurt" en "Locatie" aan (ongeveer is genoeg); het scherm daarvoor is net geopend.';
    if (c === 'nearby-timeout') return 'De verbinding in de buurt reageert niet. Probeer het nog eens; helpt dat niet, zet Bluetooth even uit en aan of herstart de telefoon.';
    if (c === 'too-big') return 'Er ging iets mis bij het versturen (bericht te groot). Meld dit even.';
    if (c === 'inet-offline') return 'Geen internet, dus via internet spelen kan nu niet.' + (native ? ' Zit je bij elkaar? Kies dan Dichtbij (Bluetooth en wifi).' : ' Samen op één telefoon of tegen de computer kan wel.');
    if (c === 'inet-rules') return 'Spelen via internet staat nog niet aan: de database-regels in Firebase moeten eerst worden bijgewerkt (in de app: Instellingen › Samen › Database-regels kopiëren).';
    if (c === 'inet-nohost') return 'Geen spel gevonden met deze code. Klopt de code, en staat het spel bij de ander nog open?';
    if (c === 'inet-busy') return 'Dat spel is al begonnen of zit vol.';
    if (c === 'inet-other') return 'Deze code is van een ander spel' + (GAME_NAMES[ev.game] ? ' (' + GAME_NAMES[ev.game] + ')' : '') + '. Open hetzelfde spel als de ander en probeer het daar.';
    if (c === 'inet-code') return 'Die code klopt niet. Een spelcode heeft 6 letters en cijfers.';
    if (c === 'inet-crypto') return 'Deze browser kan niet via internet spelen (te oud, of de pagina is niet beveiligd geopend).';
    if (c === 'permission') return 'Zonder toestemming voor Apparaten in de buurt en Locatie (ongeveer is genoeg) kan de app geen andere telefoon vinden. Zet die aan via Instellingen › Apps › W2 Apps › Rechten.';
    if (c === '8007' || c === '17') return 'Bluetooth of wifi lijkt uit te staan. Zet Bluetooth aan (in vliegtuigmodus mag dat) en probeer opnieuw.';
    if (/^80(29|3\d)$/.test(c)) return 'De app mist toestemming (' + c + '). Geef W2 Apps toestemming voor Apparaten in de buurt én Locatie (ongeveer is genoeg) via Instellingen › Apps › W2 Apps › Rechten, en probeer opnieuw.';
    if (c === '8008' || c === '8001' || c === '8002') return 'De verbinding was nog bezig. Ga terug, open het spel opnieuw en probeer nog een keer.';
    if (c === '8050') return 'Een andere app gebruikt de verbinding in de buurt al. Sluit die app en probeer opnieuw.';
    if (c === '8011') return 'Kon geen verbinding maken. Houd de telefoons dicht bij elkaar en probeer opnieuw.';
    if (c === '8012') return 'De andere telefoon is net buiten bereik of gestopt. Probeer opnieuw.';
    if (c === '13' || c === '8') return 'Er ging iets mis met Google Play-services. Herstart de app en probeer opnieuw.';
    return 'Er ging iets mis (' + (ev.where || '') + ' ' + c + '). Check of Bluetooth, wifi en locatie aanstaan en probeer opnieuw.';
  }

  window.W2 = {
    inApp: !!native,
    net: {
      available: () => !!native || inetOK(),
      on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      host(name, how) { start('host', false, name, how || (via && last && !last.multi ? via : pref(false))); },
      join(name, how) { start('join', false, name, how || pref(false)); },
      connect(id) { if (via !== 'inet' && native) native.connect(id); },
      send(obj) { if (via === 'inet') INET.send(JSON.stringify(obj)); else if (native) native.send(JSON.stringify(obj)); },
      stop() {
        if (via === 'inet') {
          INET.stop(true); via = null; closeSheet(); drawBadges();
          // "gestopt" komt net als bij dichtbij even later; begint het spel intussen alweer iets nieuws, dan niet meer
          const tok = ++stopTok;
          setTimeout(() => { if (tok === stopTok && !via) deliver({ type: 'stopped' }); }, 0);
          return;
        }
        via = null; closeSheet(); drawBadges();
        native && native.stop();
      },
      stopSearching() {
        if (via === 'inet') {
          const i = INET.info();
          if (i.role === 'join' && !i.up) { INET.stop(true); via = null; } else INET.close();
          closeSheet(); drawBadges();
          return;
        }
        native && native.stopSearching();
      },
      isConnected() { if (via === 'inet') return INET.isConnected(); try { return !!(native && native.isConnected()); } catch (e) { return false; } },
      // Groepsspellen: één host, meerdere telefoons (dichtbij vanaf app-versie met native 3; via internet altijd)
      multiAvailable: () => !!(native && native.hostMulti) || inetOK(),
      hostMulti(name, how) { start('host', true, name, how || (via && last && last.multi ? via : pref(true))); },
      joinMulti(name, how) { start('join', true, name, how || pref(true)); },
      sendTo(id, obj) { if (via === 'inet') INET.sendTo(id, JSON.stringify(obj)); else native && native.sendTo && native.sendTo(id, JSON.stringify(obj)); },
      disconnect(id) { if (via === 'inet') INET.disconnect(id); else native && native.disconnect && native.disconnect(id); },
      peers() { if (via === 'inet') return INET.peers(); try { return JSON.parse(native.peers()); } catch (e) { return []; } },
      /** Hoe loopt de verbinding nu ('near' | 'inet' | null), en wat kan er op dit apparaat. */
      via: () => via,
      /** Welke manier gekozen is, ook als er nu niets loopt (bv. na een fout): 'near' | 'inet'. */
      mode: () => via || pref(multi),
      /** Uitleg tonen als de database-regels nog ontbreken. */
      showRules: showRulesSheet,
      can: () => ({ near: !!native, inet: inetOK() }),
      /** Knopje voor in de lobby: laat de manier van verbinden of de spelcode zien; tikken opent de keuze. '' als er niets te kiezen valt. */
      badge,
      /** Korte uitleg voor de keuze "met meer telefoons" in een spel. */
      how: () => (native ? (inetOK() ? 'Dichtbij zonder internet, of via internet met een code' : 'Via Bluetooth en wifi, internet niet nodig') : 'Via internet, met een spelcode'),
      /** Tip onder de lobby. */
      tip: () => (native
        ? '<b>In het vliegtuig?</b> Zet vliegtuigmodus aan en daarna Bluetooth en wifi weer aan. Internet is niet nodig.' + (inetOK() ? ' <b>Niet bij elkaar?</b> Tik hierboven op Dichtbij en kies Via internet; dat werkt ook met een iPhone of laptop.' : '')
        : '<b>Via internet:</b> wie het spel maakt krijgt een spelcode, de ander typt die in. Zonder internet kun je samen op één telefoon spelen of tegen de computer.'),
      // Controle voor het scherm Verbinding testen (vanaf native 5)
      diag() { try { return native && native.diag ? JSON.parse(native.diag()) : null; } catch (e) { return null; } },
      fix(kind) { native && native.openSettings && native.openSettings(kind); },
      askPerms() { native && native.requestPerms && native.requestPerms(); },
      note(t) { try { native && native.logNote && native.logNote(String(t)); } catch (e) {} },
      explain
    },
    /** Database-regels (voor Firebase) en ze kopiëren. */
    regels: REGELS,
    copy,
    copyRules: () => copy(REGELS),
    // Updates: nieuwe spelbestanden ophalen zonder nieuwe APK (zie Updater.java)
    update: {
      available: () => !!(native && native.checkUpdate),
      info() { try { return JSON.parse(native.updateInfo()); } catch (e) { return {}; } },
      on(fn) { const f = ev => { if (ev.type === 'update') fn(ev); }; listeners.add(f); return () => listeners.delete(f); },
      check() { native && native.checkUpdate && native.checkUpdate(); },
      apply() { native && native.applyUpdate && native.applyUpdate(); },
      installApk() { native && native.installApk && native.installApk(); },
      openReleases() { native && native.openReleases && native.openReleases(); },
      reload() { if (native && native.reloadApp) native.reloadApp(); else location.reload(); }
    },
    // Gegevens doorgeven aan de app zelf (widgets op het startscherm, herinneringen). Vanaf native 9; daarvoor doet het niets.
    publish(key, obj) {
      if (native && native.publish) { try { native.publish(String(key), JSON.stringify(obj)); } catch (e) {} }
    },
    // Scherm aan houden zolang deze pagina het nodig heeft (hardlooptrainer, kookmodus). Vanaf native 8;
    // in de browser via de Wake Lock-API. Spellen houden het scherm vanzelf aan.
    awake(on) {
      if (native && native.keepAwake) { try { native.keepAwake(!!on); } catch (e) {} return; }
      awakeWant = !!on;
      try {
        if (on && navigator.wakeLock && !awakeLock) navigator.wakeLock.request('screen').then(l => { awakeLock = l; if (!awakeWant) { l.release(); awakeLock = null; } }).catch(() => {});
        else if (!on && awakeLock) { awakeLock.release(); awakeLock = null; }
      } catch (e) {}
    },
    // Meldingen (vanaf native 8): toestemming vragen. Geeft 'ok', 'blocked', 'off', 'ask' of 'n/a'.
    notify: {
      available: () => !!(native && native.notifyStatus),
      status() { try { return native.notifyStatus(); } catch (e) { return 'n/a'; } },
      ask() {
        if (!native || !native.notifyAsk) return Promise.resolve('n/a');
        const now = W2.notify.status();
        if (now === 'ok') return Promise.resolve('ok');
        return new Promise(res => {
          let done = false;
          const finish = st => { if (done) return; done = true; listeners.delete(f); document.removeEventListener('visibilitychange', vis); res(st); };
          const f = ev => { if (ev.type === 'notify' && ev.state !== 'blocked' && ev.state !== 'off') finish(ev.state); };
          // naar de instellingen gestuurd: bij terugkomen opnieuw kijken
          const vis = () => { if (!document.hidden) setTimeout(() => finish(W2.notify.status()), 300); };
          listeners.add(f);
          document.addEventListener('visibilitychange', vis);
          setTimeout(() => finish(W2.notify.status()), 120000);
          native.notifyAsk();
        });
      }
    },
    // Foto herkennen op de telefoon (vanaf native 10): tekstregels met plek en streepjescodes.
    // wat = 'tekst' | 'code' | 'alles'. Geeft {ok, w, h, lines:[{t,x,y,w,h}], codes:[…]} of null (kan niet).
    herken: {
      available: () => !!(native && native.scanImage),
      foto(dataUrl, wat) {
        if (!native || !native.scanImage) return Promise.resolve(null);
        return ask('scan', 60000, id => native.scanImage(id, dataUrl, wat || 'alles'));
      }
    },
    // Iets ophalen bij een van de vaste diensten van de Verzameling (TCGdex, MusicBrainz, Discogs…).
    // In de app via de app zelf (native 10), anders gewoon fetch. Geeft {status, body} of {status, b64, type}; status 0 = mislukt.
    async get(url, binary) {
      if (native && native.httpGet) {
        const r = await ask('http', 45000, id => native.httpGet(id, url, !!binary));
        return r || { status: 0, fout: 'geen antwoord' };
      }
      try {
        const r = await fetch(url, { headers: { Accept: binary ? 'image/*' : 'application/json' } });
        if (!binary) return { status: r.status, body: await r.text() };
        const b = await r.blob();
        const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(b); });
        return { status: r.status, b64, type: b.type };
      } catch (e) { return { status: 0, fout: navigator.onLine === false ? 'geen internet' : String(e.message || e) }; }
    }
  };
  let awakeLock = null, awakeWant = false, seq = 0;
  // Schermvergrendeling in de browser: de Wake Lock vervalt als de pagina even weg is; bij terugkomen opnieuw vragen.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && awakeWant && !native) { awakeLock = null; W2.awake(true); }
  });
  // In een spel blijft het scherm aan (de app deed dat zelf al voor de oudste spellen; zo geldt het overal).
  const GAME_DIRS = ['backgammon', 'halma', 'schaken', 'woordbord', 'kronkel', 'tegelrummy', 'legtuit', 'vingerspel', 'verbinding', 'klaverjassen', 'dammen', 'zeeslag'];
  if (GAME_DIRS.includes(pageDir)) { try { W2.awake(true); } catch (e) {} }
  // Liep er een spel via internet op de vorige pagina (ander spel geopend), dan gaat dat hier verder.
  if (INET) { try { if (INET.resume()) { via = 'inet'; const i = INET.info(); multi = !!i.multi; last = { fn: i.role, multi, name: '' }; } } catch (e) {} }
  if (!via) { try { if (native && native.isConnected()) via = 'near'; } catch (e) {} }
  // Native vraag met antwoord via een gebeurtenis {type, id, json}
  function ask(type, timeout, start) {
    return new Promise(res => {
      const id = type + (++seq) + '-' + Date.now().toString(36);
      let t = null;
      const f = ev => {
        if (ev.type !== type || ev.id !== id) return;
        listeners.delete(f); clearTimeout(t);
        try { res(JSON.parse(ev.json)); } catch (e) { res(null); }
      };
      listeners.add(f);
      t = setTimeout(() => { listeners.delete(f); res(null); }, timeout);
      try { start(id); } catch (e) { listeners.delete(f); clearTimeout(t); res(null); }
    });
  }
})();
