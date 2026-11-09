/* W2 Apps — Samen: lijsten delen tussen telefoons via een Firebase Realtime Database.

   Geen accounts. Wie dezelfde koppelcode heeft (16 tekens), deelt dezelfde "ruimte":
   - uit de code worden twee dingen afgeleid (HKDF-SHA256): de ruimte-id (pad in Firebase) en een AES-GCM-sleutel;
   - alles wat naar Firebase gaat is per lijst/item versleuteld ({v: iv+versleuteld, t: tijd}),
     dus in Firebase staat alleen onleesbare tekst en de code zelf gaat nooit over de lijn;
   - live meelezen via de REST-stream (EventSource); lukt dat niet, dan elke paar seconden ophalen;
   - wijzigingen gaan eerst lokaal (direct zichtbaar, ook zonder internet) en daarna via een wachtrij naar Firebase.
     Laatste wijziging per item wint.

   Opslag op de telefoon (W2D): samen-cfg (code, server, wie ben ik), samen-data (ontsleutelde kopie),
   samen-queue (wat nog verstuurd moet), dash-samen (samenvatting voor het startscherm).

   Laden ná w2.js en w2data.js. */
(function () {
  const D = window.W2D;

  // Standaard-database (Firebase Realtime Database van Wouter). Leeg = vragen bij het koppelen.
  const DEFAULT_URL = 'https://w2-samen-default-rtdb.europe-west1.firebasedatabase.app';

  // lijsten/items/leden: Samen-lijsten. reizen/recepten/aftellen: gedeelde onderdelen (via deel.js).
  // bestanden: beschrijving van een gedeeld bestand; de inhoud staat in stukjes onder /s/<ruimte>/<id>/<n>.
  const KINDS = ['lijsten', 'items', 'leden', 'reizen', 'recepten', 'aftellen', 'bestanden'];
  const BASIC = new Set(['lijsten', 'items', 'leden']);
  // Niet als leesbare kopie op de telefoon bewaren: Reizen heeft zijn eigen versleutelde opslag achter het slot.
  const PRIVATE = new Set(['reizen']);
  const CHUNK = 1500000;   // tekens per stukje van een bestand
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // geen I, O, 0, 1

  // ---------------------------------------------------------------- koppelcode
  function newCode() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a, b => ALPHA[b & 31]).join('');
  }
  const prettyCode = c => (c || '').replace(/(.{4})(?=.)/g, '$1-');
  const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  /** Haalt code en (eventueel) server uit wat iemand plakt: alleen de code, of het hele uitnodigingsbericht. */
  function parseInvite(text) {
    const t = String(text || '');
    const url = (/(https:\/\/[a-z0-9.-]+\.(?:firebaseio\.com|firebasedatabase\.app))/i.exec(t) || [])[1] || '';
    let code = '';
    const m = /code\s*[:=]?\s*([A-Z0-9][A-Z0-9 -]{14,30})/i.exec(t);
    const cand = [m && m[1], t.replace(/https?:\/\/\S+/g, '')];
    for (const c of cand) {
      if (!c) continue;
      const groups = c.toUpperCase().match(/[A-Z0-9]{4}(?:[\s-]?[A-Z0-9]{4}){3}/);
      const x = cleanCode(groups ? groups[0] : c);
      if (x.length === 16) { code = x; break; }
    }
    const valid = code.length === 16 && [...code].every(ch => ALPHA.includes(ch));
    return { code: valid ? code : '', url: url.toLowerCase(), badCode: !!code && !valid };
  }
  const cleanUrl = u => String(u || '').trim().replace(/\/+$/, '').toLowerCase();
  const urlOk = u => /^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(cleanUrl(u));

  // ---------------------------------------------------------------- sleutels
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = buf => { let s = ''; new Uint8Array(buf).forEach(b => { s += String.fromCharCode(b); }); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const hex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');

  async function derive(code) {
    const base = await crypto.subtle.importKey('raw', enc.encode('w2-samen:' + code), 'HKDF', false, ['deriveBits', 'deriveKey']);
    const salt = enc.encode('w2-samen-v1');
    const roomBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('ruimte') }, base, 128);
    const key = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('sleutel') }, base,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { room: hex(roomBits), key };
  }
  async function seal(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    const out = new Uint8Array(12 + ct.byteLength);
    out.set(iv); out.set(new Uint8Array(ct), 12);
    return b64(out);
  }
  async function open(key, v) {
    const raw = unb64(v);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12));
    return JSON.parse(dec.decode(pt));
  }

  // ---------------------------------------------------------------- toestand
  const listeners = new Set();
  const emptyData = () => Object.fromEntries(KINDS.map(k => [k, {}]));
  let cfg = D.get('samen-cfg', null);
  let data = Object.assign(emptyData(), D.get('samen-data', null) || {});
  let queue = D.get('samen-queue', []) || [];      // [{k, id, n, del}] (n = volgnummer, del = verwijderen)
  let seq = queue.reduce((m, q) => Math.max(m, q.n || 0), 0);
  let keys = null;                                 // {room, key}
  let raw = emptyData();                           // zoals het in Firebase staat: {kind: {id: {v, t}}}
  const seenV = {};                                // kind/id -> v die al ontsleuteld is
  let synced = false;                              // eerste volledige stand binnen?
  let status = 'uit', statusMsg = '', lastSync = D.get('samen-last', 0) || 0;
  let es = null, esFails = 0, esGotData = false, pollT = null, retryT = null, flushing = false, backoff = 2000;
  let rulesOld = false;   // database-regels kennen de nieuwe soorten nog niet

  const emit = what => { saveDash(); listeners.forEach(fn => { try { fn(what || 'data'); } catch (e) { console.error(e); } }); };
  const saveData = () => D.set('samen-data', Object.fromEntries(KINDS.filter(k => !PRIVATE.has(k)).map(k => [k, data[k]])));
  const saveQueue = () => D.set('samen-queue', queue);
  const setStatus = (s, msg) => { if (s === status && (msg || '') === statusMsg) return; status = s; statusMsg = msg || ''; emit('status'); };
  const pending = () => new Set(queue.map(q => q.k + '/' + q.id)).size;
  const base = () => cfg.url + '/r/' + keys.room;

  // ---------------------------------------------------------------- binnenkomende gegevens
  function applyPut(path, val) {
    const p = path.split('/').filter(Boolean);
    if (!p.length) { raw = emptyData(); if (val && typeof val === 'object') KINDS.forEach(k => { raw[k] = val[k] || {}; }); return; }
    if (!KINDS.includes(p[0])) return;
    if (p.length === 1) { raw[p[0]] = val || {}; return; }
    const id = p[1];
    if (p.length === 2) { if (val == null) delete raw[p[0]][id]; else raw[p[0]][id] = val; return; }
    // dieper pad (bv. items/x/v): binnen het item zetten
    const node = raw[p[0]][id] = Object.assign({}, raw[p[0]][id] || {});
    if (val == null) delete node[p[2]]; else node[p[2]] = val;
  }
  function applyPatch(path, obj) {
    Object.entries(obj || {}).forEach(([k, v]) => applyPut((path === '/' ? '' : path) + '/' + k, v));
  }

  let reconciling = Promise.resolve();
  function reconcile(full) {
    reconciling = reconciling.then(async () => {
      if (!keys) return;
      const waiting = new Set(queue.map(q => q.k + '/' + q.id));
      let changed = false;
      for (const k of KINDS) {
        for (const [id, node] of Object.entries(raw[k])) {
          const tag = k + '/' + id;
          if (!node || typeof node.v !== 'string' || waiting.has(tag)) continue;
          if (seenV[tag] === node.v && data[k][id]) continue;
          try {
            const obj = await open(keys.key, node.v);
            seenV[tag] = node.v;
            // De stand in Firebase is leidend (de volgorde waarin de server het kreeg), behalve wat hier nog wacht.
            if (JSON.stringify(data[k][id] || null) !== JSON.stringify(obj)) { data[k][id] = obj; changed = true; }
          } catch (e) {
            // Niet te ontsleutelen: andere code of kapot. Overslaan.
            seenV[tag] = node.v;
          }
        }
        // Verwijderd bij de ander: alleen na een volledige stand, en niet als hier nog iets op versturen wacht.
        if (synced) {
          for (const id of Object.keys(data[k])) {
            const tag = k + '/' + id;
            if (!raw[k][id] && !waiting.has(tag)) { delete data[k][id]; delete seenV[tag]; changed = true; }
          }
        }
      }
      if (full) { lastSync = Date.now(); D.set('samen-last', lastSync); }
      if (changed) saveData();
      emit(changed ? 'data' : 'sync');
    }).catch(e => console.error(e));
    return reconciling;
  }

  // ---------------------------------------------------------------- live verbinding
  function startStream() {
    stopStream();
    if (!cfg || !keys) return;
    if (navigator.onLine === false) { setStatus('offline'); return; }
    if (esFails >= 3 || typeof EventSource !== 'function') { startPoll(); return; }
    setStatus(status === 'live' ? 'live' : 'verbinden');
    esGotData = false;
    try { es = new EventSource(base() + '.json'); } catch (e) { esFails++; startPoll(); return; }
    es.addEventListener('put', ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      esGotData = true; esFails = 0; backoff = 2000;
      const full = m.path === '/';
      applyPut(m.path, m.data);
      if (full) synced = true;
      setStatus('live');
      reconcile(full);
      if (full) flush();
    });
    es.addEventListener('patch', ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      applyPatch(m.path, m.data);
      reconcile(false);
    });
    es.addEventListener('keep-alive', () => { if (status !== 'live' && synced) setStatus('live'); });
    es.addEventListener('cancel', () => { stopStream(); setStatus('fout', 'Geen toegang tot de database. Kloppen de regels in Firebase?'); });
    es.onerror = () => {
      if (!es) return;
      if (es.readyState === 2 /* CLOSED */) {
        stopStream();
        if (!esGotData) esFails++;
        setStatus(navigator.onLine === false ? 'offline' : 'verbinden');
        retry(startStream);
      } else if (!esGotData) {
        // Blijft hangen bij opnieuw verbinden zonder ooit iets te krijgen: na een paar keer overstappen op ophalen.
        if (++esFails >= 3) { stopStream(); startPoll(); }
        else setStatus(navigator.onLine === false ? 'offline' : 'verbinden');
      } else setStatus(navigator.onLine === false ? 'offline' : 'verbinden');
    };
  }
  function stopStream() {
    if (es) { try { es.close(); } catch (e) {} es = null; }
    clearTimeout(pollT); pollT = null;
  }
  function retry(fn) {
    clearTimeout(retryT);
    retryT = setTimeout(fn, backoff);
    backoff = Math.min(backoff * 2, 60000);
  }

  async function fetchAll() {
    const r = await fetch(base() + '.json', { cache: 'no-store' });
    if (r.status === 401 || r.status === 403) throw Object.assign(new Error('Geen toegang tot de database. Kloppen de regels in Firebase?'), { fatal: true });
    if (r.status === 404) throw Object.assign(new Error('Database niet gevonden. Klopt het adres?'), { fatal: true });
    if (!r.ok) throw new Error('Database gaf fout ' + r.status);
    return r.json();
  }
  function startPoll() {
    stopStream();
    const tick = async () => {
      if (document.hidden || !keys) return;
      try {
        const all = await fetchAll();
        applyPut('/', all); synced = true;
        setStatus('live', 'ophalen');
        await reconcile(true);
        flush();
        backoff = 2000;
        pollT = setTimeout(tick, 4000);
      } catch (e) {
        if (e.fatal) { setStatus('fout', e.message); return; }
        setStatus(navigator.onLine === false ? 'offline' : 'verbinden');
        pollT = setTimeout(tick, backoff); backoff = Math.min(backoff * 2, 60000);
      }
    };
    tick();
    // Af en toe toch weer de stream proberen
    clearTimeout(retryT);
    retryT = setTimeout(() => { esFails = 0; startStream(); }, 5 * 60000);
  }

  // ---------------------------------------------------------------- versturen
  async function send(body) {
    const r = await fetch(base() + '.json', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.status;
  }
  async function flush() {
    if (flushing || !keys || !queue.length || navigator.onLine === false) return;
    flushing = true;
    const batch = queue.slice();
    try {
      // Samen-lijsten en de rest apart versturen: als de regels in Firebase de nieuwe soorten nog niet kennen,
      // blijven de lijsten gewoon werken.
      const groups = [{}, {}], sentN = [new Set(), new Set()];
      const seen = new Set();
      for (const q of batch.slice().reverse()) {   // laatste wijziging per item telt
        const tag = q.k + '/' + q.id, g = BASIC.has(q.k) ? 0 : 1;
        sentN[g].add(q.n);
        if (seen.has(tag)) continue;
        seen.add(tag);
        const obj = data[q.k] && data[q.k][q.id];
        if (obj) {
          const v = await seal(keys.key, obj);
          groups[g][tag] = { v, t: obj.t || Date.now() };
          seenV[tag] = v;
        } else if (q.del) groups[g][tag] = null;
        // anders: inhoud niet meer bekend (app herstart); deel.js stuurt het later opnieuw
      }
      const done = new Set();
      let refused = '';
      for (const g of [0, 1]) {
        if (!sentN[g].size) continue;
        if (g === 1 && rulesOld && Date.now() - rulesOld < 60000) continue;
        if (Object.keys(groups[g]).length) {
          const st = await send(groups[g]);
          if (st === 401 || st === 403 || st === 400) {
            if (g === 1) { rulesOld = Date.now(); refused = 'De database-regels in Firebase kennen recepten/reizen/aftellen nog niet. Plak de nieuwe regels in Firebase.'; continue; }
            setStatus('fout', 'Opslaan geweigerd door de database. Kloppen de regels in Firebase?'); flushing = false; return;
          }
          if (st < 200 || st >= 300) throw new Error('fout ' + st);
          if (g === 1) rulesOld = false;
          Object.entries(groups[g]).forEach(([tag, val]) => { const [k, id] = tag.split('/'); if (val) raw[k][id] = val; else delete raw[k][id]; });
        }
        sentN[g].forEach(n => done.add(n));
      }
      queue = queue.filter(q => !done.has(q.n));
      saveQueue();
      flushing = false;
      if (refused) { setStatus('fout', refused); clearTimeout(flush._t); flush._t = setTimeout(flush, 60000); }
      emit('sync');
      if (queue.some(q => BASIC.has(q.k) || !rulesOld)) flush();
      else if (!refused && status !== 'live') startStream();
    } catch (e) {
      flushing = false;
      setStatus(navigator.onLine === false ? 'offline' : 'verbinden');
      clearTimeout(flush._t);
      flush._t = setTimeout(flush, backoff);
    }
  }

  function put(kind, id, obj) {
    obj = Object.assign({}, obj, { t: Date.now() });
    data[kind][id] = obj;
    queue.push({ k: kind, id, n: ++seq });
    saveData(); saveQueue(); emit('data');
    flush();
    return obj;
  }
  function del(kind, id) {
    if (!data[kind][id] && !PRIVATE.has(kind)) return;
    delete data[kind][id];
    queue.push({ k: kind, id, n: ++seq, del: true });
    saveData(); saveQueue(); emit('data');
    flush();
  }
  const update = (kind, id, patch) => data[kind][id] ? put(kind, id, Object.assign({}, data[kind][id], patch)) : null;

  // ---------------------------------------------------------------- bestanden (documenten, foto's)
  const sbase = id => cfg.url + '/s/' + keys.room + '/' + id;
  /** Bestand delen: inhoud (base64 of andere tekst) in versleutelde stukjes, daarna de beschrijving. */
  async function uploadFile(id, meta, text) {
    if (!keys) throw new Error('niet gekoppeld');
    const n = Math.max(1, Math.ceil(text.length / CHUNK));
    for (let i = 0; i < n; i++) {
      const v = await seal(keys.key, { d: text.slice(i * CHUNK, (i + 1) * CHUNK) });
      const r = await fetch(sbase(id) + '/' + i + '.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v, t: Date.now() }) });
      if (r.status === 401 || r.status === 403 || r.status === 400) { rulesOld = Date.now(); throw new Error('regels'); }
      if (!r.ok) throw new Error('fout ' + r.status);
    }
    put('bestanden', id, Object.assign({}, meta, { delen: n, lengte: text.length }));
  }
  async function downloadFile(id) {
    const meta = data.bestanden[id];
    if (!meta || !keys) return null;
    const r = await fetch(sbase(id) + '.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('fout ' + r.status);
    const parts = (await r.json()) || {};
    let out = '';
    for (let i = 0; i < meta.delen; i++) {
      const node = Array.isArray(parts) ? parts[i] : parts[i] || parts[String(i)];
      if (!node) return null;   // nog niet helemaal geüpload
      out += (await open(keys.key, node.v)).d;
    }
    return out.length === meta.lengte ? out : null;
  }
  async function deleteFile(id) {
    if (!keys) return;
    del('bestanden', id);
    try { await fetch(sbase(id) + '.json', { method: 'DELETE' }); } catch (e) {}
  }

  // ---------------------------------------------------------------- samenvatting voor startscherm
  function summary() {
    const lijsten = Object.entries(data.lijsten).map(([id, l]) => Object.assign({ id }, l))
      .sort((a, b) => (a.pos || 0) - (b.pos || 0) || (a.gemaakt || 0) - (b.gemaakt || 0));
    const items = Object.entries(data.items).map(([id, it]) => Object.assign({ id }, it));
    const seen = D.get('samen-seen', {}) || {};
    const me = cfg && cfg.me ? cfg.me.id : '';
    return {
      lijsten: lijsten.map(l => {
        const its = items.filter(i => i.lijst === l.id);
        const open = its.filter(i => !i.ok);
        const t = D.date.today();
        return {
          id: l.id, naam: l.naam, emoji: l.emoji, kleur: l.kleur, soort: l.soort,
          open: open.length, klaar: its.length - open.length,
          laat: open.filter(i => i.datum && i.datum < t).length,
          nieuw: open.filter(i => i.door !== me && (i.gemaakt || 0) > (seen[l.id] || 0)).length
        };
      }),
      todo: items.filter(i => !i.ok && i.datum && (!i.wie || i.wie === 'samen' || i.wie === me))
        .map(i => ({ id: i.id, lijst: i.lijst, tekst: i.tekst, datum: i.datum, wie: i.wie }))
        .sort((a, b) => a.datum < b.datum ? -1 : 1).slice(0, 6),
      leden: Object.values(data.leden).map(m => m.naam),
      t: Date.now()
    };
  }
  function saveDash() { if (cfg) D.set('dash-samen', summary()); }

  // ---------------------------------------------------------------- opstarten
  let started = false, wired = false;
  async function start() {
    if (!cfg || started) return !!cfg;
    started = true;
    keys = await derive(cfg.code);
    if (wired) { startStream(); flush(); return true; }
    wired = true;
    addEventListener('online', () => { esFails = 0; backoff = 2000; startStream(); flush(); });
    addEventListener('offline', () => { stopStream(); setStatus('offline'); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stopStream(); clearTimeout(retryT); }
      else { backoff = 2000; startStream(); flush(); }
    });
    startStream();
    flush();
    return true;
  }
  function stop() { stopStream(); clearTimeout(retryT); }

  /** Eenmalig ophalen (startscherm): samenvatting bijwerken zonder live verbinding. */
  async function peek() {
    if (!cfg || navigator.onLine === false) return false;
    try {
      keys = keys || await derive(cfg.code);
      const all = await fetchAll();
      applyPut('/', all); synced = true;
      await reconcile(true);
      if (queue.length) await flush();
      return true;
    } catch (e) { return false; }
  }

  /** Vooraf kijken wat er bij een code staat (bij meedoen): wie er al lid zijn en hoeveel lijsten. */
  async function preview(urlIn, code) {
    const url = cleanUrl(urlIn || DEFAULT_URL);
    if (!urlOk(url)) throw new Error('Dat database-adres klopt niet. Het eindigt op firebaseio.com of firebasedatabase.app.');
    const k = await derive(code);
    const r = await fetch(url + '/r/' + k.room + '.json', { cache: 'no-store' }).catch(() => null);
    if (!r) throw new Error('Geen verbinding met de database. Heb je internet?');
    if (r.status === 401 || r.status === 403) throw new Error('De database weigert toegang. Staan de regels in Firebase goed?');
    if (r.status === 404) throw new Error('Database niet gevonden. Klopt het adres?');
    if (!r.ok) throw new Error('De database gaf een fout (' + r.status + ').');
    const all = (await r.json()) || {};
    const leden = [];
    for (const [id, node] of Object.entries(all.leden || {})) {
      try { const m = await open(k.key, node.v); leden.push(Object.assign({ id }, m)); } catch (e) {}
    }
    leden.sort((a, b) => (a.sinds || 0) - (b.sinds || 0));
    return { url, leden, lijsten: Object.keys(all.lijsten || {}).length };
  }

  /** Koppelen. Nieuw: lege ruimte met een paar lijsten. Meedoen: eerst kijken of er iets staat. */
  async function setup(opts) {
    const url = cleanUrl(opts.url || DEFAULT_URL);
    if (!urlOk(url)) throw new Error('Dat database-adres klopt niet. Het eindigt op firebaseio.com of firebasedatabase.app.');
    const code = opts.code || newCode();
    // Meedoen als iemand die al lid is (bv. dezelfde persoon op een tweede apparaat): zelfde id, naam en kleur.
    const me = opts.als ? { id: opts.als.id, naam: opts.als.naam, kleur: opts.als.kleur || '#ff7eb6' }
      : { id: D.uid(), naam: (opts.naam || '').trim() || 'Ik', kleur: opts.kleur || '#ff7eb6' };
    const next = { url, code, me, sinds: Date.now() };
    const k = await derive(code);
    let found = null;
    if (opts.check !== false) {
      const r = await fetch(url + '/r/' + k.room + '.json', { cache: 'no-store' }).catch(() => null);
      if (!r) throw new Error('Geen verbinding met de database. Heb je internet?');
      if (r.status === 401 || r.status === 403) throw new Error('De database weigert toegang. Staan de regels in Firebase goed?');
      if (r.status === 404) throw new Error('Database niet gevonden. Klopt het adres?');
      if (!r.ok) throw new Error('De database gaf een fout (' + r.status + ').');
      found = await r.json();
    }
    if (opts.join && opts.check !== false && !(found && found.lijsten)) {
      const e = new Error('Bij deze code staan nog geen lijsten. Klopt de code?');
      e.empty = true; throw e;
    }
    cfg = next; D.set('samen-cfg', cfg);
    data = emptyData(); queue = []; raw = emptyData(); synced = false;
    saveData(); saveQueue();
    keys = k;
    if (!opts.als) put('leden', me.id, { naam: me.naam, kleur: me.kleur, sinds: Date.now() });
    if (!opts.join) {
      const now = Date.now();
      put('lijsten', D.uid(), { naam: 'Boodschappen', soort: 'boodschappen', emoji: '🛒', kleur: '#5ee07a', pos: 1, door: me.id, gemaakt: now });
      put('lijsten', D.uid(), { naam: "To-do's", soort: 'todo', emoji: '✅', kleur: '#4d8dff', pos: 2, door: me.id, gemaakt: now + 1 });
    }
    started = false;
    await start();
    return cfg;
  }

  function leave() {
    stop();
    cfg = null; keys = null; started = false; synced = false;
    data = emptyData(); queue = []; raw = emptyData();
    ['samen-cfg', 'samen-data', 'samen-queue', 'dash-samen', 'samen-seen', 'samen-last'].forEach(k => { try { localStorage.removeItem('w2d-' + k); } catch (e) {} });
    setStatus('uit');
  }

  function setMe(patch) {
    cfg.me = Object.assign({}, cfg.me, patch);
    D.set('samen-cfg', cfg);
    update('leden', cfg.me.id, patch) || put('leden', cfg.me.id, Object.assign({ sinds: Date.now() }, { naam: cfg.me.naam, kleur: cfg.me.kleur }));
  }

  function invite() {
    return 'Doe mee met onze gedeelde lijstjes in W2 Apps (tabblad Samen › Ik heb een code).\n' +
      'Code: ' + prettyCode(cfg.code) + '\n' +
      (cfg.url !== DEFAULT_URL ? 'Server: ' + cfg.url + '\n' : '') +
      'App nog niet? https://github.com/Woetoe/W2-apps-uitgifte/releases (W2-Apps.apk)';
  }

  window.Samen = {
    DEFAULT_URL,
    get cfg() { return cfg; },
    get data() { return data; },
    get status() { return { status, msg: statusMsg, pending: pending(), lastSync, synced }; },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    start, stop, peek, preview, setup, uploadFile, downloadFile, deleteFile, KINDS, leave, setMe, invite, put, del, update, summary,
    newCode, prettyCode, parseInvite, urlOk, cleanUrl, flush,
    _derive: derive, _seal: seal, _open: open
  };
})();
