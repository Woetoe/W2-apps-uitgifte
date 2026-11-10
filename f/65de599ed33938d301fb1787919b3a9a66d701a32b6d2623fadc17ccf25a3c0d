/* W2 Apps — gegevens voor de tools (Overzicht, Reizen, Kluis, Aftellen, Hardlopen, Recepten).
   Laden ná w2.js.

   - W2D.get/set: gewone opslag op de telefoon (localStorage), voor dingen die niet geheim zijn.
   - W2D.secret: versleutelde opslag per onderdeel (in de app via de Android Keystore), achter het slot als dat aan staat.
   - W2D.files: bestanden (tickets, documenten) versleuteld bewaren en openen met een andere app.
   - W2D.lock: slot met vingerafdruk of pincode van de telefoon.
   - W2D.idb: grotere verzamelingen (recepten) in IndexedDB.
   - W2D.backup: alles in één versleuteld bestand, bv. naar een map in je Google Drive, en weer terugzetten.

   Iedereen die de app installeert begint met een lege app: alles staat alleen op die telefoon.
   In de browser (zonder app) valt alles terug op localStorage/IndexedDB, zonder slot. */
(function () {
  const N = window.W2Native || null;
  const has = f => !!(N && typeof N[f] === 'function');
  const inApp = !!N;
  // Oude app (zonder kluis) met nieuwe spelbestanden: niet stiekem in de browseropslag gaan bewaren.
  const native = has('secretGet');
  const outdated = inApp && !native;

  const P = 'w2d-';
  const get = (k, d) => { try { const v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  // Antwoorden van Android komen als events binnen (zie Kluis.java); per verzoek een nummer.
  const waiting = new Map();
  let seq = 0;
  const ask = (type, start) => new Promise(res => {
    const req = 'r' + (++seq) + '_' + Date.now();
    waiting.set(req, { type, res });
    start(req);
  });
  if (window.W2 && W2.net) W2.net.on(ev => {
    if (!ev || !ev.req || !waiting.has(ev.req)) return;
    const w = waiting.get(ev.req);
    if (w.type !== ev.type) return;
    waiting.delete(ev.req);
    w.res(ev);
  });

  const uid = () => {
    const a = new Uint8Array(9);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256);
    return Array.from(a, b => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
  };

  class Locked extends Error { constructor(area) { super('LOCKED'); this.area = area; } }
  const check = (r, area) => {
    if (r === 'LOCKED') throw new Locked(area);
    if (r === 'DENIED') throw new Error('Dit onderdeel mag niet bij de kluis.');
    if (r === 'ERROR:KEYGONE') throw new Error('De sleutel van het slot bestaat niet meer (schermvergrendeling van de telefoon weggehaald of gewijzigd). Zet je back-up terug via Instellingen › Back-up.');
    if (typeof r === 'string' && r.startsWith('ERROR:')) throw new Error(r.slice(6));
    return r;
  };

  // ---------------------------------------------------------------- IndexedDB
  function idb(name, store) {
    store = store || 'items';
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open(name, 1);
      r.onupgradeneeded = () => r.result.objectStoreNames.contains(store) || r.result.createObjectStore(store);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const tx = (mode, fn) => open().then(db => new Promise((res, rej) => {
      const t = db.transaction(store, mode), s = t.objectStore(store);
      let out;
      Promise.resolve(fn(s)).then(v => { out = v; });
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
    const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    return {
      get: k => tx('readonly', s => req(s.get(k))),
      put: (k, v) => tx('readwrite', s => { s.put(v, k); }),
      del: k => tx('readwrite', s => { s.delete(k); }),
      clear: () => tx('readwrite', s => { s.clear(); }),
      keys: () => tx('readonly', s => req(s.getAllKeys())),
      all: () => tx('readonly', s => req(s.getAll())),
      putMany: entries => tx('readwrite', s => { entries.forEach(([k, v]) => s.put(v, k)); })
    };
  }
  const fileDb = idb('w2-bestanden');

  // ---------------------------------------------------------------- slot
  const lock = {
    available: () => native && has('lockStatus'),
    status() {
      if (!lock.available()) return { can: 'nohw', unlocked: true, areas: {} };
      try { return JSON.parse(N.lockStatus()); } catch (e) { return { can: 'nohw', unlocked: true, areas: {} }; }
    },
    isOn: area => !!lock.status().areas[area],
    needed(area) { const s = lock.status(); return !!s.areas[area] && !s.unlocked && s.can === 'ok'; },
    /** Vingerafdruk/pincode vragen. Geeft true bij succes. */
    unlock(title) {
      if (!lock.available()) return Promise.resolve(true);
      return ask('lock', req => N.unlock(req, title || '')).then(ev => ev.state === 'ok');
    },
    /** Slot aan/uit; geeft {ok, state}. state 'none' = telefoon heeft geen schermvergrendeling. */
    set(area, on) {
      if (!lock.available()) return Promise.resolve({ ok: false, state: 'nohw' });
      return ask('lock', req => N.setLock(req, area, !!on)).then(ev => ({ ok: ev.state === 'ok', state: ev.state }));
    },
    lockNow() { has('lockNow') && N.lockNow(); }
  };

  // ---------------------------------------------------------------- geheime gegevens per onderdeel
  const secret = {
    get(area, def) {
      if (!native) return Promise.resolve(get('geheim-' + area, def));
      const r = check(N.secretGet(area), area);
      return Promise.resolve(r ? JSON.parse(r) : def);
    },
    set(area, val) {
      if (!native) { set('geheim-' + area, val); return Promise.resolve(); }
      check(N.secretPut(area, JSON.stringify(val)), area);
      return Promise.resolve();
    }
  };

  // ---------------------------------------------------------------- bestanden
  const toB64 = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).replace(/^data:[^,]*,/, ''));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
  const fromB64 = (b64, mime) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: mime || 'application/octet-stream' });
  };
  const files = {
    /** Bestand (File/Blob) versleuteld bewaren; geeft {id, name, size, mime, added}. */
    async put(area, file) {
      const id = uid();
      const b64 = await toB64(file);
      if (native) check(N.filePut(area, id, b64), area);
      else await fileDb.put(area + '/' + id, b64);
      return { id, name: file.name || 'bestand', size: file.size || 0, mime: file.type || mimeOf(file.name), added: Date.now() };
    },
    async get(area, id) {
      if (native) return check(N.fileGet(area, id), area);
      return (await fileDb.get(area + '/' + id)) || '';
    },
    async putRaw(area, id, b64) {
      if (native) check(N.filePut(area, id, b64), area);
      else await fileDb.put(area + '/' + id, b64);
    },
    async list(area) {
      if (native) return JSON.parse(N.fileList(area));
      return (await fileDb.keys()).filter(k => k.startsWith(area + '/')).map(k => k.slice(area.length + 1));
    },
    async del(area, id) {
      if (native) check(N.fileDel(area, id), area);
      else await fileDb.del(area + '/' + id);
    },
    /** Openen met een andere app (pdf-lezer, foto's, wallet…). */
    async open(area, f) {
      if (native) { check(N.fileOpen(area, f.id, f.name, f.mime || mimeOf(f.name)), area); return; }
      const b64 = await files.get(area, f.id);
      if (!b64) throw new Error('Bestand niet gevonden');
      const url = URL.createObjectURL(fromB64(b64, f.mime));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    },
    /** Kleine afbeelding als voorbeeld (data-URL), alleen voor plaatjes. */
    async thumb(area, f) {
      if (!/^image\//.test(f.mime || '')) return '';
      const b64 = await files.get(area, f.id);
      return b64 ? 'data:' + f.mime + ';base64,' + b64 : '';
    }
  };
  function mimeOf(name) {
    const e = String(name || '').toLowerCase().split('.').pop();
    return ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', gif: 'image/gif',
      doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain',
      pkpass: 'application/vnd.apple.pkpass', html: 'text/html', ics: 'text/calendar' })[e] || 'application/octet-stream';
  }

  // ---------------------------------------------------------------- bewaren als
  function saveAs(name, mime, b64) {
    if (has('saveAs')) return ask('saved', req => N.saveAs(req, name, mime, b64)).then(ev => ev.state);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(fromB64(b64, mime));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    return Promise.resolve('ok');
  }

  // ---------------------------------------------------------------- back-up (versleuteld met een wachtwoord)
  const AREAS = ['kluis', 'reizen'];
  const IDBS = ['w2-recepten', 'w2-recepten-foto', 'w2-verzameling', 'w2-verzameling-foto'];
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64u = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); };
  const u8b = b64 => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  // Nieuwe back-ups: 600.000 rondes (OWASP-advies voor PBKDF2-SHA256). Oude back-ups noemen hun eigen aantal in "kdf".
  const ROUNDS = 600000, MIN_PASS = 10;
  async function passKey(password, salt, rounds) {
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: rounds || ROUNDS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const roundsOf = kdf => { const m = /^PBKDF2-SHA256-(\d+)$/.exec(kdf || ''); return m ? +m[1] : 210000; };
  // Alles uit localStorage behalve wat alleen voor deze telefoon/sessie telt.
  const SKIP_LOCAL = /^w2-upd-(last|new)$/;
  const backup = {
    /** Alles verzamelen, versleutelen en laten bewaren. Geeft 'ok' | 'cancel' | 'error'. */
    async make(password, progress) {
      progress = progress || (() => {});
      if (AREAS.some(a => lock.needed(a)) && !(await lock.unlock('Back-up maken'))) return 'cancel';
      const data = { v: 1, made: new Date().toISOString(), local: {}, secret: {}, files: {}, idb: {} };
      progress('Gegevens verzamelen…');
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !SKIP_LOCAL.test(k)) data.local[k] = localStorage.getItem(k);
      }
      for (const a of AREAS) {
        data.secret[a] = await secret.get(a, null);
        data.files[a] = {};
        const ids = await files.list(a);
        for (let i = 0; i < ids.length; i++) {
          progress(`Bestanden ${a}: ${i + 1} van ${ids.length}`);
          data.files[a][ids[i]] = await files.get(a, ids[i]);
        }
      }
      data.idb = {};
      for (const name of IDBS) {
        progress('Recepten…');
        const db = idb(name), keys = await db.keys(), vals = await db.all();
        data.idb[name] = keys.map((k, i) => [k, vals[i]]);
      }
      progress('Versleutelen…');
      const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      if (String(password || '').length < MIN_PASS) throw new Error('Kies een wachtwoord van minstens ' + MIN_PASS + ' tekens.');
      const key = await passKey(password, salt, ROUNDS);
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data))));
      const file = JSON.stringify({ w2backup: 1, kdf: 'PBKDF2-SHA256-' + ROUNDS, salt: b64u(salt), iv: b64u(iv), data: b64u(ct) });
      const d = new Date(), name = `W2-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.w2backup`;
      progress('Kies waar je hem bewaart…');
      const st = await saveAs(name, 'application/octet-stream', b64u(enc.encode(file)));
      if (st === 'ok') set('backup-last', Date.now());
      return st;
    },
    /** Automatische back-up (vanaf native 9): de gewone gegevens verzamelen; de app voegt Kluis en Reizen toe,
        versleutelt met het opgeslagen wachtwoord en schrijft naar het gekozen bestand. Alleen als het tijd is. */
    async auto(force) {
      if (!native || !N.autoBackupStatus) return 'n/a';
      let st = {};
      try { st = JSON.parse(N.autoBackupStatus()); } catch (e) { return 'n/a'; }
      if (!force && !st.due) return 'not-due';
      if (!st.hasFile || !st.hasPass) return 'setup';
      const data = { v: 1, made: new Date().toISOString(), local: {}, secret: {}, files: {}, idb: {} };
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !SKIP_LOCAL.test(k)) data.local[k] = localStorage.getItem(k);
      }
      for (const name of IDBS) {
        try { const db = idb(name), keys = await db.keys(), vals = await db.all(); data.idb[name] = keys.map((k, i) => [k, vals[i]]); } catch (e) {}
      }
      N.autoBackupRun(JSON.stringify(data), !!force);
      return 'started';
    },
    autoStatus() { try { return native && N.autoBackupStatus ? JSON.parse(N.autoBackupStatus()) : null; } catch (e) { return null; } },
    /** Back-upbestand terugzetten. Gooit een fout bij verkeerd wachtwoord. */
    async restore(file, password, progress) {
      progress = progress || (() => {});
      const outer = JSON.parse(await file.text());
      if (!outer || outer.w2backup !== 1) throw new Error('Dit is geen W2-back-up.');
      const key = await passKey(password, u8b(outer.salt), roundsOf(outer.kdf));
      let plain;
      try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8b(outer.iv) }, key, u8b(outer.data)); }
      catch (e) { throw new Error('Wachtwoord klopt niet.'); }
      const data = JSON.parse(dec.decode(plain));
      if (AREAS.some(a => lock.needed(a)) && !(await lock.unlock('Back-up terugzetten'))) return 'cancel';
      progress('Gegevens terugzetten…');
      Object.entries(data.local || {}).forEach(([k, v]) => { if (SKIP_LOCAL.test(k)) return; try { localStorage.setItem(k, v); } catch (e) {} });
      for (const a of AREAS) {
        if (data.secret && data.secret[a] != null) await secret.set(a, data.secret[a]);
        const fs = (data.files || {})[a] || {};
        const ids = Object.keys(fs);
        for (let i = 0; i < ids.length; i++) { progress(`Bestanden ${a}: ${i + 1} van ${ids.length}`); await files.putRaw(a, ids[i], fs[ids[i]]); }
      }
      for (const name of IDBS) {
        const rows = (data.idb || {})[name];
        if (rows && rows.length) { progress(name.includes('verzameling') ? 'Verzameling…' : 'Recepten…'); await idb(name).putMany(rows); }
      }
      return 'ok';
    }
  };

  // ---------------------------------------------------------------- datums (lokaal, zonder tijdzone-gedoe)
  const pad = n => String(n).padStart(2, '0');
  const date = {
    today() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
    parse(s) { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; },
    /** Dagen van vandaag tot s (negatief = voorbij). */
    days(s) { const d = date.parse(s); if (!d) return null; const t = date.parse(date.today()); return Math.round((d - t) / 864e5); },
    nice(s, opts) { const d = date.parse(s); return d ? d.toLocaleDateString('nl-NL', opts || { weekday: 'short', day: 'numeric', month: 'short' }) : ''; },
    /** "vandaag", "morgen", "over 12 dagen", "3 dagen geleden" */
    rel(n) {
      if (n == null) return '';
      if (n === 0) return 'vandaag';
      if (n === 1) return 'morgen';
      if (n === -1) return 'gisteren';
      if (n > 1) return n < 60 ? `over ${n} dagen` : n < 365 ? `over ${Math.round(n / 7)} weken` : `over ${Math.round(n / 30.4)} maanden`;
      return `${-n} dagen geleden`;
    },
    /** Volgende verjaardag (YYYY-MM-DD) bij een geboortedatum met of zonder jaar ("--MM-DD"). */
    nextBirthday(s) {
      const m = /(\d{4}|-)-(\d\d)-(\d\d)$/.exec(s || ''); if (!m) return null;
      const t = date.parse(date.today());
      let y = t.getFullYear();
      let d = new Date(y, m[2] - 1, +m[3]);
      if (d < t) d = new Date(++y, m[2] - 1, +m[3]);
      return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, age: /\d{4}/.test(m[1]) ? d.getFullYear() - +m[1] : null };
    }
  };

  // Laatst geopende onderdelen, voor snelkoppelingen op het overzicht
  function recent(id) {
    const r = get('recent', []).filter(x => x !== id);
    r.unshift(id);
    set('recent', r.slice(0, 8));
  }

  backup.MIN_PASS = MIN_PASS;
  window.W2D = { inApp, native, outdated, get, set, uid, idb, lock, secret, files, saveAs, backup, date, recent, Locked, mimeOf, toB64 };
})();
