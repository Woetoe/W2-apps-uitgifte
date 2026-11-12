/* W2 Apps — spelen via internet met een spelcode.

   Naast de verbinding dichtbij (Bluetooth/wifi, alleen in de Android-app) kunnen telefoons ook via internet
   tegen elkaar spelen: Android-app, iPhone of laptop (webversie), maakt niet uit. Dit bestand is alleen het
   transport; w2.js kiest tussen dichtbij en internet en geeft de spellen precies dezelfde gebeurtenissen
   (hosting, searching, connecting, connected, disconnected, message, stopped, error).

   Hoe het werkt
   - Wie een spel maakt krijgt een spelcode (6 tekens). Uit de code komen via HKDF-SHA256 een kamer-id (pad in
     Firebase) en een AES-GCM-sleutel. Alles wat naar Firebase gaat is versleuteld; de code zelf gaat nooit mee.
   - /g/<kamer>/p/<wie>  : aanwezigheid {v, t}. Hierin staat ook met wie je verbonden bent (zie "schakels").
   - /g/<kamer>/m/<wie>-<nr> : berichten {v, t}, per afzender oplopend genummerd.
   - Meelezen via de REST-stream (EventSource); lukt dat niet, dan elke 1,5 s ophalen.
   - Versturen gaat één verzoek tegelijk (volgorde blijft kloppen), meerdere berichten in één keer als het druk is.

   Schakels (zo weten beide kanten zeker of ze verbonden zijn)
   - Elke kant zet per andere telefoon in zijn aanwezigheid k[<ander>] = [ronde, vanaf]: de ronde van de schakel
     en vanaf welk berichtnummer zijn berichten voor die ander tellen (null = nog niet klaar).
   - Een schakel staat pas als beide kanten dezelfde ronde hebben en allebei klaar zijn. Raakt een kant de ander
     kwijt (te lang niets gehoord, berichten gemist), dan hoogt hij de ronde op; de ander neemt de hogere ronde
     over. Zo krijgen beide spellen "verbinding kwijt" en daarna weer "verbonden", net als bij Bluetooth, en
     sturen ze elkaar opnieuw de stand.
   - "Te lang niets gehoord" wordt gemeten met de klok van de server: de tijd van de ander vergeleken met de tijd
     van mijn eigen laatste teken van leven. De klok van de telefoons zelf doet er dus niet toe.

   Laden vóór w2.js. In Node (tests) is alles in te vullen via `env`. */
(function (root) {
  'use strict';

  const DEFAULT_URL = 'https://w2-samen-default-rtdb.europe-west1.firebasedatabase.app';
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // geen I, O, 0, 1
  const CODE_LEN = 6;
  const T = {
    beat: 8000,          // teken van leven
    stale: 30000,        // zo lang niets gehoord = weg
    staleAsleep: 180000, // idem als de ander de app even op de achtergrond heeft
    outage: 25000,       // zo lang zelf niets kunnen versturen = alles kwijt
    noHost: 8000,        // meedoen: geen spel gevonden bij deze code
    noAccept: 14000,     // meedoen: spel gevonden maar geen reactie
    handshake: 15000,    // host: zo lang mag een nieuwe speler over het verbinden doen
    forget: 300000,      // host: een speler die zo lang weg is telt niet meer mee
    idle: 600000,        // meedoen: zo lang zonder host = sessie opruimen
    resume: 600000,      // na een pagina-wissel of herstart: zo lang is de sessie nog op te pakken
    keepMs: 15000, keepN: 30, batch: 40, poll: 1500, tick: 2000, retry: 1000,
    codeKeep: 12 * 3600000
  };
  const MAX_BYTES = 32 * 1024;   // zelfde grens als Nearby, zodat een spel overal hetzelfde mag versturen

  function cleanCode(text) {
    const t = String(text || '').toUpperCase();
    // heel bericht geplakt: de code staat achter "code"
    const m = /CODE\s*[:=]?\s*([A-Z0-9][A-Z0-9 -]{4,12})/.exec(t);
    for (const cand of [m && m[1], t]) {
      if (!cand) continue;
      const x = cand.replace(/[^A-Z0-9]/g, '');
      if (x.length === CODE_LEN && [...x].every(ch => ALPHA.includes(ch))) return x;
    }
    return '';
  }

  function browserEnv() {
    const w = root;
    let st = null;
    try { st = w.localStorage; st.getItem('w2-inet'); } catch (e) { st = null; }
    return {
      fetch: (u, o) => w.fetch(u, o),
      EventSource: w.EventSource,
      crypto: w.crypto,
      storage: st,
      now: () => Date.now(),
      setTimeout: (f, ms) => w.setTimeout(f, ms),
      clearTimeout: id => w.clearTimeout(id),
      online: () => !w.navigator || w.navigator.onLine !== false,
      hidden: () => !!(w.document && w.document.hidden),
      listen(type, fn) {
        const target = type === 'visibilitychange' ? w.document : w;
        if (target && target.addEventListener) target.addEventListener(type, fn);
      }
    };
  }

  function create(opts) {
    opts = opts || {};
    const env = Object.assign(browserEnv(), opts.env || {});
    const URL_BASE = String(opts.url || DEFAULT_URL).replace(/\/+$/, '');
    const out = ev => { try { opts.emit && opts.emit(ev); } catch (e) { if (root.console) root.console.error(e); } };
    const changed = () => { try { opts.onChange && opts.onChange(); } catch (e) {} };
    const C = env.crypto, subtle = C && C.subtle;
    const te = new TextEncoder(), td = new TextDecoder();

    let S = null;               // de lopende sessie
    let chain = Promise.resolve();
    let wired = false;

    // ---------------------------------------------------------------- hulpjes
    const b64 = buf => { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
    const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const hex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
    function rnd(n, alphabet) {
      const a = new Uint8Array(n);
      C.getRandomValues(a);
      return Array.from(a, b => alphabet[b % alphabet.length]).join('');
    }
    const newCode = () => rnd(CODE_LEN, ALPHA);                 // 32 tekens: b % 32 is eerlijk verdeeld
    const newPid = () => rnd(10, 'abcdefghijklmnopqrstuvwxyz234567');
    const pad = n => String(n).padStart(9, '0');
    const mkey = (pid, seq) => pid + '-' + pad(seq);

    async function derive(code) {
      const base = await subtle.importKey('raw', te.encode('w2-spel:' + code), 'HKDF', false, ['deriveBits', 'deriveKey']);
      const salt = te.encode('w2-spel-v1');
      const bits = await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode('kamer') }, base, 128);
      const key = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode('sleutel') }, base,
        { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      return { room: hex(bits), key };
    }
    async function seal(key, obj) {
      const iv = C.getRandomValues(new Uint8Array(12));
      const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj)));
      const o = new Uint8Array(12 + ct.byteLength);
      o.set(iv); o.set(new Uint8Array(ct), 12);
      return b64(o);
    }
    async function unseal(key, v) {
      const raw = unb64(v);
      const pt = await subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12));
      return JSON.parse(td.decode(pt));
    }

    const sget = k => { try { return env.storage ? env.storage.getItem(k) : null; } catch (e) { return null; } };
    const sset = (k, v) => { try { if (env.storage) { if (v == null) env.storage.removeItem(k); else env.storage.setItem(k, v); } } catch (e) {} };
    const sjson = k => { try { return JSON.parse(sget(k) || 'null'); } catch (e) { return null; } };

    const base = s => URL_BASE + '/g/' + s.room;
    const available = () => !!(subtle && env.fetch && typeof TextEncoder === 'function');

    // ---------------------------------------------------------------- bewaren (pagina-wissel, herstart)
    function persist() {
      const s = S;
      if (!s) { sset('w2-inet', null); return; }
      sset('w2-inet', JSON.stringify({
        code: s.code, pid: s.pid, role: s.role, multi: s.multi, name: s.name, game: s.game, open: s.open,
        e: s.e, seqMax: s.seqMax, everUp: s.everUp, ban: [...s.ban],
        links: [...s.links].map(([pid, l]) => [pid, { g: l.g, ready: l.ready, up: l.up, next: l.next, name: l.name, pe: l.pe }]),
        ts: env.now()
      }));
    }

    // ---------------------------------------------------------------- sessie
    function blank(o) {
      return Object.assign({
        code: '', room: '', key: null, pid: newPid(), role: 'host', multi: false, name: 'Speler', game: '', open: true,
        e: 1, seq: 0, seqMax: 0, s0: 1, links: new Map(), ban: new Set(), everUp: false,
        tree: { p: {}, m: {} }, dec: new Map(),
        dirty: true, out: [], pumping: false, fail: 0, everOk: false, lastOk: env.now(),
        needEcho: true, echoBase: 0, presJson: '', presV: '',
        es: null, esFails: 0, pollT: null, retryT: null, tickT: null, beatT: null, backoff: T.retry,
        startAt: env.now(), hostSeenAt: 0, hostPid: '', announced: false, asleep: false, lonelyAt: 0, ready: null
      }, o);
    }
    function link(s, pid, name) {
      let l = s.links.get(pid);
      if (!l) { l = { g: 0, ready: null, up: false, next: 1, name: name || '', pe: 0, since: env.now(), said: false, downAt: 0 }; s.links.set(pid, l); }
      return l;
    }
    function nextSeq(s) {
      s.seq++;
      if (s.seq >= s.seqMax) { s.seqMax = s.seq + 200; persist(); }
      return s.seq;
    }
    function presence(s) {
      const k = {};
      s.links.forEach((l, pid) => { if (l.g > 0) k[pid] = [l.g, l.ready]; });
      const p = { n: s.name, h: s.role === 'host' ? 1 : 0, mu: s.multi ? 1 : 0, gm: s.game, e: s.e, s0: s.s0, k };
      if (s.role === 'host') { p.o = s.open ? 1 : 0; if (s.ban.size) p.ban = [...s.ban]; }
      if (s.asleep) p.z = 1;
      return p;
    }

    function teardown() {
      const s = S;
      if (!s) return;
      S = null;
      stopStream(s);
      env.clearTimeout(s.tickT); env.clearTimeout(s.beatT); env.clearTimeout(s.retryT);
      persist();
      changed();
    }
    function fatal(s, where, code) {
      if (S !== s) return;
      teardown();
      out({ type: 'error', where, code, message: code });
    }

    // ---------------------------------------------------------------- binnenkomende gegevens
    function applyPut(tree, path, val) {
      const seg = String(path || '/').split('/').filter(Boolean);
      if (!seg.length) { tree.p = (val && val.p) || {}; tree.m = (val && val.m) || {}; return; }
      if (seg[0] !== 'p' && seg[0] !== 'm') return;
      if (seg.length === 1) { tree[seg[0]] = val || {}; return; }
      const box = tree[seg[0]];
      if (seg.length === 2) { if (val == null) delete box[seg[1]]; else box[seg[1]] = val; return; }
      const node = box[seg[1]] = Object.assign({}, box[seg[1]] || {});
      if (val == null) delete node[seg[2]]; else node[seg[2]] = val;
    }
    function applyPatch(tree, path, obj) {
      Object.entries(obj || {}).forEach(([k, v]) => applyPut(tree, (path === '/' ? '' : path) + '/' + k, v));
    }

    function stopStream(s) {
      if (s.es) { try { s.es.close(); } catch (e) {} s.es = null; }
      env.clearTimeout(s.pollT); s.pollT = null;
      env.clearTimeout(s.retryT); s.retryT = null;
    }
    function startStream() {
      const s = S;
      if (!s || !s.key) return;
      stopStream(s);
      if (env.hidden() || !env.online()) return;
      if (s.esFails >= 3 || typeof env.EventSource !== 'function') { startPoll(s); return; }
      let got = false, es;
      try { es = new env.EventSource(base(s) + '.json'); } catch (e) { s.esFails++; startPoll(s); return; }
      s.es = es;
      const data = fn => ev => {
        if (S !== s || s.es !== es) return;
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (!m) return;
        got = true; s.esFails = 0; s.backoff = T.retry;
        fn(m);
        refresh();
      };
      es.addEventListener('put', data(m => applyPut(s.tree, m.path, m.data)));
      es.addEventListener('patch', data(m => applyPatch(s.tree, m.path, m.data)));
      const denied = () => { if (S === s && s.es === es) fatal(s, s.role, 'inet-rules'); };
      es.addEventListener('cancel', denied);
      es.addEventListener('auth_revoked', denied);
      es.onerror = () => {
        if (S !== s || s.es !== es) return;
        if (es.readyState === 2) {
          stopStream(s);
          if (!got) s.esFails++;
          s.retryT = env.setTimeout(() => { if (S === s) startStream(); }, s.backoff);
          s.backoff = Math.min(s.backoff * 2, 15000);
        } else if (!got && ++s.esFails >= 3) { stopStream(s); startPoll(s); }
      };
    }
    function startPoll(s) {
      stopStream(s);
      const tick = async () => {
        if (S !== s || env.hidden()) return;
        let wait = T.poll;
        try {
          const r = await env.fetch(base(s) + '.json', { cache: 'no-store' });
          if (S !== s) return;
          if (r.status === 401 || r.status === 403) { fatal(s, s.role, 'inet-rules'); return; }
          if (r.ok) { applyPut(s.tree, '/', await r.json()); if (S !== s) return; refresh(); }
          else wait = 4000;
        } catch (e) { wait = 4000; }
        if (S === s && !s.es) s.pollT = env.setTimeout(tick, wait);
      };
      tick();
      // af en toe toch weer de stream proberen
      s.retryT = env.setTimeout(() => { if (S === s) { s.esFails = 0; startStream(); } }, 120000);
    }

    // ---------------------------------------------------------------- versturen
    function pump() {
      const s = S;
      if (!s || s.pumping || !s.key) return;
      s.pumping = true;
      (async () => {
        try {
          while (S === s && (s.dirty || s.out.length)) {
            const body = {};
            const withP = s.dirty;
            if (withP) {
              s.dirty = false;
              const json = JSON.stringify(presence(s));
              if (json !== s.presJson) { s.presV = await seal(s.key, JSON.parse(json)); s.presJson = json; }
              body['p/' + s.pid] = { v: s.presV, t: { '.sv': 'timestamp' } };
            }
            const batch = s.out.slice(0, T.batch);
            for (const m of batch) {
              if (!m.v) m.v = await seal(s.key, { to: m.to, d: m.d });
              body['m/' + mkey(s.pid, m.seq)] = { v: m.v, t: { '.sv': 'timestamp' } };
            }
            // eigen oude berichten opruimen: alles behalve de laatste paar en wat nog vers is
            const myT = (s.tree.p[s.pid] && s.tree.p[s.pid].t) || 0;
            for (const key of Object.keys(s.tree.m)) {
              if (key.slice(0, s.pid.length + 1) !== s.pid + '-') continue;
              const n = +key.slice(s.pid.length + 1), node = s.tree.m[key];
              if (n <= s.seq - T.keepN && node && typeof node.t === 'number' && myT - node.t > T.keepMs) body['m/' + key] = null;
            }
            if (S !== s) return;
            let st = 0;
            if (env.online()) {
              try {
                const r = await env.fetch(base(s) + '.json', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                st = r.status;
              } catch (e) { st = 0; }
            }
            if (S !== s) return;
            if (st >= 200 && st < 300) {
              s.out.splice(0, batch.length);
              s.fail = 0; s.everOk = true; s.lastOk = env.now();
              if (s.role === 'host' && !s.announced) { s.announced = true; out({ type: 'hosting' }); changed(); }
              continue;
            }
            if (withP) s.dirty = true;
            if (st === 400 || st === 401 || st === 403) { fatal(s, s.role, 'inet-rules'); return; }
            s.fail++;
            // Nog nooit gelukt: er is geen internet (of de database is onbereikbaar). Niet eindeloos blijven proberen.
            if (!s.everOk && s.fail >= 2) { fatal(s, s.role, 'inet-offline'); return; }
            await pause(s, Math.min(1000 * s.fail, 8000));
          }
        } finally {
          s.pumping = false;
        }
      })();
    }
    const pause = (s, ms) => new Promise(res => env.setTimeout(res, ms));

    // ---------------------------------------------------------------- de stand beoordelen
    function refresh() {
      chain = chain.then(evaluate).catch(e => { if (root.console) root.console.error(e); });
      return chain;
    }

    /** Schakel omlaag: het spel hoort "verbinding kwijt"; de ronde gaat omhoog zodat de ander dat ook hoort. */
    function drop(s, pid, l, evs) {
      if (l.up) { l.up = false; evs.push({ type: 'disconnected', id: pid }); }
      l.g++; l.ready = null; l.downAt = env.now();
      s.dirty = true;
    }

    async function evaluate() {
      const s = S;
      if (!s || !s.key) return;
      const now = env.now(), me = s.pid, evs = [];

      // 1. aanwezigheid ontsleutelen (alleen wat veranderd is). Tijdens het wachten kan er nieuws binnenkomen;
      //    daarom net zo lang tot alles wat er nu staat ontsleuteld is, en daarna in één keer beoordelen.
      for (let again = true; again;) {
        again = false;
        for (const pid of Object.keys(s.tree.p)) {
          const node = s.tree.p[pid];
          if (!node || typeof node.v !== 'string') continue;
          const c = s.dec.get(pid);
          if (c && c.v === node.v) continue;
          const v = node.v;
          let obj = null;
          try { obj = await unseal(s.key, v); } catch (e) { obj = null; }
          if (S !== s) return;
          s.dec.set(pid, { v, obj });
          again = true;
        }
      }
      const P = {};
      for (const pid of Object.keys(s.tree.p)) {
        const node = s.tree.p[pid], c = s.dec.get(pid);
        if (node && c && c.v === node.v && c.obj && typeof c.obj === 'object') P[pid] = { o: c.obj, t: typeof node.t === 'number' ? node.t : 0 };
      }
      for (const pid of [...s.dec.keys()]) if (!s.tree.p[pid]) s.dec.delete(pid);

      // 2. mijn eigen teken van leven terug van de server: vanaf dan is te beoordelen wie er nog is
      const myT = (s.tree.p[me] && typeof s.tree.p[me].t === 'number' && s.tree.p[me].t) || 0;
      if (s.needEcho && myT > s.echoBase) s.needEcho = false;
      const judge = !s.needEcho && myT > 0;
      const fresh = pid => {
        const p = P[pid];
        if (!p) return false;
        if (!judge) return null;
        return myT - p.t < (p.o.z ? T.staleAsleep : T.stale);
      };
      const theirs = pid => {
        const p = P[pid], k = p && p.o.k && p.o.k[me];
        return Array.isArray(k) ? { g: +k[0] || 0, ready: k[1] == null ? null : +k[1] } : { g: -1, ready: null };
      };

      /** De regels voor één schakel; geeft true als hij (nog) staat. */
      const step = pid => {
        const l = s.links.get(pid), p = P[pid], th = theirs(pid);
        if (p) l.name = String(p.o.n || l.name || '');
        // de ander heeft een hogere ronde: overnemen
        if (th.g > l.g) {
          if (l.up) { l.up = false; evs.push({ type: 'disconnected', id: pid }); }
          l.g = th.g; l.ready = null; s.dirty = true;
        }
        const f = fresh(pid);
        if (f === null) return l.up;
        // zelfde ronde en de ander is er: ik ben klaar, mijn berichten tellen vanaf hier
        if (f && l.g > 0 && th.g === l.g && l.ready == null) { l.ready = s.seq + 1; s.dirty = true; }
        const should = !!f && l.g > 0 && th.g === l.g && l.ready != null && th.ready != null;
        if (l.up && !should) drop(s, pid, l, evs);
        else if (!l.up && should) {
          l.up = true; l.next = Math.max(th.ready, +p.o.s0 || 1); l.pe = p.o.e || 0; l.downAt = 0; s.everUp = true;
          evs.push({ type: 'connected', id: pid, name: l.name });
        }
        return l.up;
      };

      if (s.role === 'host') {
        // nieuwe spelers toelaten
        const anyUp = () => [...s.links.values()].some(l => l.up);
        const busy = () => [...s.links.values()].some(l => !l.up && !l.downAt && now - l.since < T.handshake);
        for (const pid of Object.keys(P)) {
          if (pid === me || P[pid].o.h || s.ban.has(pid) || s.links.has(pid)) continue;
          if (fresh(pid) !== true || !s.open) continue;
          if (s.multi ? s.links.size >= 12 : (anyUp() || busy())) continue;
          if (!!P[pid].o.mu !== s.multi) continue;       // ander soort spel: die krijgt zelf een melding
          if (!s.multi) for (const [old, lo] of [...s.links]) if (!lo.up) s.links.delete(old);   // oude, verbroken schakel maakt plaats
          const l = link(s, pid, P[pid].o.n);
          l.g = Math.max(1, theirs(pid).g + 1);
          s.dirty = true;
          evs.push({ type: 'connecting', id: pid, name: l.name });
          l.said = true;
        }
        for (const [pid, l] of [...s.links]) {
          const gone = !P[pid];
          const up = gone ? false : step(pid);
          if (gone || (!up && fresh(pid) === false && (!l.downAt || now - l.downAt > T.forget) && now - l.since > T.handshake)) {
            // weg (afgemeld) of nooit echt aangekomen / te lang weg: opruimen
            if (l.up) evs.push({ type: 'disconnected', id: pid });
            const never = !l.downAt && !l.up;
            s.links.delete(pid); s.dirty = true;
            if (never && s.open && !anyUp()) evs.push({ type: 'hosting' });   // spel staat weer gewoon open
          }
        }
      } else {
        // meedoen: de host is wie het spel gemaakt heeft (de verste aanwezigheid met h = 1)
        // Blijf bij de host die je had zolang die er nog is; anders de meest recente.
        let hostPid = '';
        if (s.hostPid && P[s.hostPid] && P[s.hostPid].o.h && fresh(s.hostPid) !== false) hostPid = s.hostPid;
        else for (const pid of Object.keys(P)) if (pid !== me && P[pid].o.h && (!hostPid || P[pid].t > P[hostPid].t)) hostPid = pid;
        if (hostPid !== s.hostPid) {
          // andere host dan eerst (spel opnieuw gemaakt met dezelfde code): oude schakel weg
          for (const [pid, l] of [...s.links]) {
            if (pid === hostPid) continue;
            if (l.up) evs.push({ type: 'disconnected', id: pid });
            s.links.delete(pid); s.dirty = true;
          }
          s.hostPid = hostPid; s.hostSeenAt = hostPid ? now : 0;
        }
        if (hostPid) {
          const hp = P[hostPid].o;
          if (Array.isArray(hp.ban) && hp.ban.includes(me)) {
            const l = s.links.get(hostPid);
            const was = !!(l && l.up);
            teardown();
            if (was) out({ type: 'disconnected', id: hostPid });
            else out({ type: 'error', where: 'join', code: 'inet-busy', message: 'inet-busy' });
            return;
          }
          if (!!hp.mu !== s.multi) {
            teardown();
            out({ type: 'error', where: 'join', code: 'inet-other', message: 'inet-other', game: hp.gm || '' });
            return;
          }
          const l = link(s, hostPid, hp.n);
          if (!l.said && fresh(hostPid) !== false) { l.said = true; evs.push({ type: 'connecting', id: hostPid, name: String(hp.n || '') }); }
          step(hostPid);
        }
        const up = hostPid && s.links.get(hostPid) && s.links.get(hostPid).up;
        if (up) s.lonelyAt = 0; else if (!s.lonelyAt) s.lonelyAt = now;
        if (!up && judge) {
          if (!s.everUp) {
            // eerste keer verbinden lukt niet: zeggen waarom, dan kan de speler de code nakijken
            const waited = now - s.startAt;
            const hostOk = hostPid && fresh(hostPid) === true;
            if (!hostOk && waited > T.noHost) { teardown(); out({ type: 'error', where: 'join', code: 'inet-nohost', message: 'inet-nohost' }); return; }
            if (hostOk && now - s.hostSeenAt > T.noAccept) {
              const hp = P[hostPid].o, full = !hp.o || (!hp.mu && Object.keys(hp.k || {}).some(k => k !== me));
              teardown();
              out({ type: 'error', where: 'join', code: full ? 'inet-busy' : 'inet-nohost', message: 'inet' });
              return;
            }
          } else if (now - s.lonelyAt > T.idle) { teardown(); return; }   // host komt niet meer terug: stil opruimen
        }
      }

      // 3. berichten afleveren, per afzender op volgorde. Eerst vastleggen wat er nu ligt (nummer + inhoud):
      //    tijdens het ontsleutelen kan de ander al aan het opruimen zijn, en dan mag er niets tussendoor vallen.
      const per = new Map();
      for (const key of Object.keys(s.tree.m)) {
        const i = key.lastIndexOf('-');
        if (i < 1) continue;
        const pid = key.slice(0, i), l = s.links.get(pid);
        if (!l || !l.up) continue;
        const n = +key.slice(i + 1), node = s.tree.m[key];
        if (!(n >= l.next) || !node) continue;
        if (!per.has(pid)) per.set(pid, []);
        per.get(pid).push([n, node.v]);
      }
      const work = [];
      for (const [pid, list] of per) {
        const l = s.links.get(pid), p = P[pid];
        list.sort((a, b) => a[0] - b[0]);
        // nieuwe pagina bij de ander (ander spel geopend): de nummering springt, dat is geen gat
        const jump = next => (p && p.o.e !== l.pe && +p.o.s0 > next ? +p.o.s0 : 0);
        let next = l.next, gap = false, pe = l.pe;
        const items = [];
        for (const [n, v] of list) {
          if (n < next) continue;
          if (n > next) {
            const to = jump(next);
            if (to) { next = to; pe = p.o.e; }
            if (n < next) continue;
            if (n > next) { gap = true; break; }   // berichten gemist (al opgeruimd)
          }
          items.push([n, v]);
          next = n + 1;
        }
        if (!gap && p && p.o.e !== pe) { const to = jump(next); if (to) next = to; pe = p.o.e; }
        work.push({ pid, l, items, gap, next, pe });
      }
      for (const w of work) {
        for (const [n, v] of w.items) {
          let msg = null;
          try { msg = await unseal(s.key, v); } catch (e) { msg = null; }
          if (S !== s) return;
          w.l.next = n + 1;
          if (msg && (msg.to == null || msg.to === me) && typeof msg.d === 'string') evs.push({ type: 'message', id: w.pid, data: msg.d });
        }
        if (w.gap) drop(s, w.pid, w.l, evs);   // schakel opnieuw opbouwen; daarna sturen de spellen elkaar de stand
        else { w.l.next = Math.max(w.l.next, w.next); w.l.pe = w.pe; }
      }

      if (s.dirty) pump();
      if (evs.some(e => e.type !== 'message')) { persist(); changed(); }
      for (const ev of evs) { if (S !== s && ev.type === 'message') break; out(ev); }
    }

    // ---------------------------------------------------------------- klok
    function wire() {
      if (wired) return;
      wired = true;
      env.listen('online', () => { const s = S; if (s) { s.esFails = 0; s.backoff = T.retry; wake(s); } });
      env.listen('offline', () => { const s = S; if (s) stopStream(s); });
      env.listen('visibilitychange', () => { const s = S; if (!s) return; if (env.hidden()) sleep(s); else wake(s); });
      env.listen('pagehide', () => { const s = S; if (s) sleep(s); });
      env.listen('pageshow', () => { const s = S; if (s && !env.hidden()) wake(s); });
    }
    /** Pagina naar de achtergrond (of weg): laten weten dat we "even weg" zijn, zodat de ander niet meteen afhaakt. */
    function sleep(s) {
      if (s.asleep || !s.key) { persist(); return; }
      s.asleep = true;
      persist();
      stopStream(s);
      // los verzoek dat de pagina mag overleven; de gewone wachtrij loopt op de achtergrond niet betrouwbaar door
      (async () => {
        try {
          const v = await seal(s.key, presence(s));
          if (S !== s || !s.asleep) return;
          const body = {}; body['p/' + s.pid] = { v, t: { '.sv': 'timestamp' } };
          env.fetch(base(s) + '.json', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
        } catch (e) {}
      })();
    }
    function wake(s) {
      if (env.hidden()) return;
      const was = s.asleep;
      s.asleep = false;
      if (!s.key) return;
      if (was) { s.needEcho = true; s.echoBase = (s.tree.p[s.pid] && s.tree.p[s.pid].t) || 0; s.lastOk = env.now(); }
      s.dirty = true; s.presJson = '';
      pump();
      if (was || (!s.es && !s.pollT)) startStream();
    }
    function clocks(s) {
      const beat = () => {
        if (S !== s) return;
        if (!env.hidden() && !s.asleep) { s.dirty = true; pump(); persist(); }
        s.beatT = env.setTimeout(beat, T.beat);
      };
      const tick = () => {
        if (S !== s) return;
        if (!env.hidden() && !s.asleep) {
          // zelf te lang niets kunnen versturen: voor het spel is de verbinding dan weg
          if (s.everOk && env.now() - s.lastOk > T.outage) {
            const evs = [];
            s.links.forEach((l, pid) => { if (l.up) drop(s, pid, l, evs); });
            s.needEcho = true; s.echoBase = (s.tree.p[s.pid] && s.tree.p[s.pid].t) || 0; s.lastOk = env.now();
            if (evs.length) { persist(); changed(); evs.forEach(out); }
            if (S !== s) return;
            startStream();
          }
          refresh();
        }
        s.tickT = env.setTimeout(tick, T.tick);
      };
      s.beatT = env.setTimeout(beat, T.beat);
      s.tickT = env.setTimeout(tick, T.tick);
    }

    async function begin(s, fresh) {
      wire();
      try {
        const k = await derive(s.code);
        if (S !== s) return;
        s.room = k.room; s.key = k.key;
      } catch (e) { fatal(s, s.role, 'inet-crypto'); return; }
      if (fresh && s.role === 'host') {
        // een schone kamer: resten van een vorig spel met dezelfde code weg
        try {
          const r = await env.fetch(base(s) + '.json', { method: 'DELETE' });
          if (S !== s) return;
          if (r.status === 401 || r.status === 403) { fatal(s, 'host', 'inet-rules'); return; }
        } catch (e) { if (S !== s) return; fatal(s, 'host', 'inet-offline'); return; }
      }
      if (S !== s) return;
      if (env.hidden()) s.asleep = true;
      clocks(s);
      pump();
      startStream();
      changed();
    }

    // ---------------------------------------------------------------- wat w2.js aanroept
    function hostCode() {
      const c = sjson('w2-inet-code');
      if (c && cleanCode(c.code) && env.now() - (c.at || 0) < T.codeKeep) return c.code;
      const code = newCode();
      sset('w2-inet-code', JSON.stringify({ code, at: env.now() }));
      return code;
    }

    const api = {
      DEFAULT_URL, CODE_LEN, cleanCode, available, newCode,
      /** Spel maken. Loopt er al een spel dat ik gemaakt heb (zelfde soort), dan gaat dat weer open voor nieuwe spelers. */
      host(name, o) {
        o = o || {};
        if (!available()) { out({ type: 'error', where: 'host', code: 'inet-crypto', message: 'inet-crypto' }); return; }
        if (S && S.role === 'host' && !!S.multi === !!o.multi) {
          const s = S;
          if (name) s.name = String(name).slice(0, 24);
          if (o.game) s.game = o.game;
          s.open = true; s.dirty = true;
          persist(); pump(); changed();
          if (s.announced) out({ type: 'hosting' });
          return;
        }
        if (S) api.stop(true);
        const s = S = blank({ role: 'host', multi: !!o.multi, name: String(name || 'Speler').slice(0, 24), game: o.game || '', code: o.code ? cleanCode(o.code) : hostCode() });
        persist();
        begin(s, true);
      },
      /** Meedoen met een spelcode. */
      join(name, code, o) {
        o = o || {};
        if (!available()) { out({ type: 'error', where: 'join', code: 'inet-crypto', message: 'inet-crypto' }); return; }
        const c = cleanCode(code);
        if (!c) { out({ type: 'error', where: 'join', code: 'inet-code', message: 'inet-code' }); return; }
        if (S) api.stop(true);
        sset('w2-inet-join', c);
        const s = S = blank({ role: 'join', multi: !!o.multi, name: String(name || 'Speler').slice(0, 24), game: o.game || '', code: c });
        persist();
        begin(s, false);
      },
      lastJoinCode: () => cleanCode(sget('w2-inet-join') || ''),
      /** Niet meer open voor nieuwe spelers (het spel is begonnen of het wachten is gestopt). Bestaande verbindingen blijven. */
      close() {
        const s = S;
        if (!s || s.role !== 'host' || !s.open) return;
        s.open = false; s.dirty = true;
        persist(); pump(); changed();
      },
      stop(silent) {
        const s = S;
        if (s) {
          const url = s.room ? base(s) + (s.role === 'host' ? '' : '/p/' + s.pid) + '.json' : '';
          teardown();
          if (url) { try { env.fetch(url, { method: 'DELETE', keepalive: true }).catch(() => {}); } catch (e) {} }
        }
        if (!silent) out({ type: 'stopped' });
      },
      send(text, to) {
        const s = S;
        if (!s) return;
        if (typeof text !== 'string') text = JSON.stringify(text);
        if (te.encode(text).length > MAX_BYTES) { out({ type: 'error', where: 'send', code: 'too-big', message: 'Bericht te groot' }); return; }
        if (to != null) { const l = s.links.get(to); if (!l || l.ready == null) return; }
        else if (![...s.links.values()].some(l => l.ready != null)) return;   // niemand verbonden: net als bij Bluetooth valt het weg
        s.out.push({ seq: nextSeq(s), to: to == null ? null : to, d: text, v: '' });
        pump();
      },
      sendTo(id, text) { api.send(text, id); },
      /** Host: een speler eruit zetten (spel vol). */
      disconnect(id) {
        const s = S;
        if (!s || s.role !== 'host') return;
        s.links.delete(id); s.ban.add(id); s.dirty = true;
        persist(); pump(); changed();
      },
      peers: () => (S ? [...S.links].filter(([, l]) => l.up).map(([id, l]) => ({ id, name: l.name })) : []),
      isConnected: () => !!S && [...S.links.values()].some(l => l.up),
      info() {
        const s = S;
        if (!s) return { active: false };
        return { active: true, role: s.role, multi: s.multi, code: s.code, open: s.open, live: s.announced || s.role === 'join', up: [...s.links.values()].filter(l => l.up).length };
      },
      /** Sessie van een vorige pagina (ander spel geopend, app even weg) weer oppakken. Geeft true als er een was. */
      resume() {
        if (S || !available()) return !!S;
        const d = sjson('w2-inet');
        if (!d || !cleanCode(d.code) || !d.pid || env.now() - (d.ts || 0) > T.resume) { sset('w2-inet', null); return false; }
        const s = S = blank({
          code: d.code, pid: d.pid, role: d.role === 'join' ? 'join' : 'host', multi: !!d.multi, name: d.name || 'Speler', game: d.game || '', open: !!d.open,
          e: (d.e || 1) + 1, seq: d.seqMax || 0, seqMax: d.seqMax || 0, everUp: !!d.everUp, ban: new Set(d.ban || []), announced: true
        });
        s.s0 = s.seq + 1;
        (d.links || []).forEach(([pid, l]) => s.links.set(pid, { g: l.g || 0, ready: l.ready == null ? null : l.ready, up: !!l.up, next: l.next || 1, name: l.name || '', pe: l.pe || 0, since: env.now(), said: true, downAt: l.up ? 0 : env.now() }));
        if (s.role === 'join') { s.hostPid = [...s.links.keys()][0] || ''; s.hostSeenAt = env.now(); }
        nextSeq(s); s.seq--;      // nieuwe reeks nummers vastleggen
        persist();
        begin(s, false);
        return true;
      },
      _T: T, _state: () => S,
      /** Alleen voor tests: de pagina "verdwijnt" (geen afmelden, opslag blijft staan). */
      _kill() { const s = S; if (!s) return; S = null; stopStream(s); env.clearTimeout(s.tickT); env.clearTimeout(s.beatT); }
    };
    return api;
  }

  root.W2Inet = { create, cleanCode, DEFAULT_URL, CODE_LEN };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.W2Inet;
})(typeof window !== 'undefined' ? window : globalThis);
