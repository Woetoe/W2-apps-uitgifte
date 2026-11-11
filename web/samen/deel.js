/* W2 Apps — onderdelen (Reizen, Recepten, Aftellen) delen via de Samen-ruimte.

   Elk onderdeel houdt zijn eigen opslag op het apparaat (Reizen versleuteld achter het slot, Recepten in
   IndexedDB, Aftellen in localStorage). Deze module houdt die gelijk met de gedeelde ruimte in Firebase:

   - lees() geeft de lokale stand als {id: object}; schrijf(map) zet een nieuwe stand terug en tekent opnieuw.
   - push() na elke lokale wijziging: wat anders is dan bij de laatste synchronisatie gaat naar Firebase.
   - Komt er iets binnen (of is de eerste volledige stand er), dan worden beide kanten samengevoegd:
       * hier sinds de laatste synchronisatie gewijzigd → deze versie wint en gaat opnieuw de deur uit;
       * hier nieuw en nog nooit gedeeld → wordt gedeeld;
       * hier niet veranderd → de gedeelde versie komt binnen (ook verwijderen).
     Per item wordt een vingerafdruk van de laatst gesynchroniseerde versie bewaard (deel-snap-<soort>).
   - bestanden(obj) noemt de bestanden die bij een item horen (tickets, receptfoto's). Die worden in stukjes
     gedeeld en op andere apparaten op de achtergrond binnengehaald, zodat ze ook offline openen.

   Laden ná w2.js, w2data.js en samen/sync.js. */
(function () {
  const D = window.W2D, S = window.Samen;

  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }
  function hash(o) {
    const s = stable(o);
    let h1 = 5381, h2 = 52711;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 33) ^ c; }
    return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) + s.length.toString(36);
  }
  const copy = o => JSON.parse(JSON.stringify(o));

  function koppel(opts) {
    const kind = opts.kind;
    const SNAP = 'deel-snap-' + kind, WACHT = 'deel-wacht-' + kind, GEZIEN = 'deel-gezien-' + kind;
    let snap = D.get(SNAP, {}) || {};
    // wacht: verstuurd maar nog niet bevestigd door Firebase (id → vingerafdruk van wat we stuurden).
    // gezien: stond ooit echt in Firebase. Alleen dan mag "ontbreekt in Firebase" betekenen: elders verwijderd.
    const wacht = D.get(WACHT, {}) || {}, gezien = D.get(GEZIEN, {}) || {};
    const saveSnap = () => { D.set(SNAP, snap); D.set(WACHT, wacht); D.set(GEZIEN, gezien); };
    const onServer = id => S.onServer ? S.onServer(kind, id) : true;
    const pendingHere = id => S.isPending ? S.isPending(kind, id) : false;
    let chain = Promise.resolve(), timer = null, busyFiles = false, active = false;
    const tried = new Set();   // bestanden die deze sessie al geprobeerd zijn

    const remoteMap = () => {
      const out = {};
      Object.entries(S.data[kind] || {}).forEach(([id, w]) => { if (w && w.o) out[id] = w.o; });
      return out;
    };
    const queue = fn => (chain = chain.then(fn).catch(e => console.error('deel', kind, e)));

    /** Lokale wijzigingen versturen. */
    function push() {
      if (!active) return Promise.resolve();
      return queue(async () => {
        const local = await opts.lees();
        const me = S.cfg && S.cfg.me ? S.cfg.me.id : '';
        Object.entries(local).forEach(([id, o]) => {
          const h = hash(o);
          if (snap[id] === h) return;
          S.put(kind, id, { o: copy(o), door: me });
          snap[id] = h; wacht[id] = h;
        });
        Object.keys(snap).forEach(id => {
          if (local[id]) return;
          S.del(kind, id);
          delete snap[id]; delete wacht[id]; delete gezien[id];
        });
        saveSnap();
        files(local, false);
      });
    }
    const pushSoon = () => { clearTimeout(timer); timer = setTimeout(push, 250); };

    /** Samenvoegen met wat er in de gedeelde ruimte staat. */
    function reconcile() {
      if (!active || !S.status.synced) return Promise.resolve();
      return queue(async () => {
        const local = await opts.lees();
        const remote = remoteMap();
        const merged = {}, out = [], changed = [];
        const me = S.cfg && S.cfg.me ? S.cfg.me.id : '';
        // Bevestigd: Firebase heeft precies wat wij stuurden en er wacht niets meer.
        for (const [id, r] of Object.entries(remote)) {
          if (!onServer(id) || pendingHere(id)) continue;
          if (wacht[id] && hash(r) === wacht[id]) delete wacht[id];
          if (!wacht[id]) gezien[id] = true;
        }
        for (const [id, r] of Object.entries(remote)) {
          const l = local[id];
          const hl = l ? hash(l) : '', hr = hash(r);
          if (l && hl === hr) { merged[id] = l; snap[id] = hr; continue; }
          // hier gewijzigd, of verstuurd maar nooit bevestigd (bv. app dicht zonder internet): de versie hier wint
          if (l && (snap[id] !== hl || wacht[id])) { merged[id] = l; out.push(id); continue; }
          merged[id] = r; snap[id] = hr; changed.push(id);
        }
        for (const [id, l] of Object.entries(local)) {
          if (remote[id]) continue;
          if (onServer(id)) { merged[id] = l; continue; }   // staat in Firebase maar is nog niet ontsleuteld: afwachten
          if (gezien[id] && !wacht[id] && !pendingHere(id) && snap[id] === hash(l)) {   // stond in Firebase, nu weg: elders verwijderd
            delete snap[id]; delete gezien[id]; changed.push(id); continue;
          }
          merged[id] = l; out.push(id);   // nieuw hier, nooit aangekomen, of hier gewijzigd na verwijderen elders: (opnieuw) delen
        }
        out.forEach(id => { const h = hash(merged[id]); S.put(kind, id, { o: copy(merged[id]), door: me }); snap[id] = h; wacht[id] = h; });
        saveSnap();
        if (changed.length) await opts.schrijf(merged, changed);
        files(merged, true);
      });
    }

    /** Bestanden: delen wat hier staat en elders ontbreekt, binnenhalen wat hier ontbreekt, opruimen wat niemand meer gebruikt. */
    async function files(map, cleanup) {
      if (!opts.bestanden || busyFiles || !S.status.synced) return;
      busyFiles = true;
      try {
        const need = new Map();
        Object.values(map).forEach(o => (opts.bestanden(o) || []).forEach(f => need.set(f.id, f)));
        for (const f of need.values()) {
          const meta = S.data.bestanden[f.id];
          if (tried.has(f.id)) continue;
          if (!meta) {
            let text = '';
            try { text = await f.get(); } catch (e) { text = ''; }
            if (!text) continue;   // hier ook niet: wacht op het apparaat dat hem heeft
            tried.add(f.id);
            try { await S.uploadFile(f.id, { soort: kind, naam: f.naam || '', mime: f.mime || '' }, text); }
            catch (e) { tried.delete(f.id); }
          } else {
            let have = '';
            try { have = await f.get(); } catch (e) { have = e && e.message === 'LOCKED' ? 'op slot' : ''; }   // op slot: later
            if (have) continue;
            tried.add(f.id);
            try {
              const text = await S.downloadFile(f.id);
              if (text) { await f.put(text); if (opts.bestandBinnen) opts.bestandBinnen(f.id); }
              else tried.delete(f.id);
            } catch (e) { tried.delete(f.id); }
          }
        }
        // Opruimen: beschrijvingen van dit onderdeel die geen enkel item meer gebruikt
        if (cleanup) Object.entries(S.data.bestanden).forEach(([id, m]) => { if (m && m.soort === kind && !need.has(id)) S.deleteFile(id); });
      } finally { busyFiles = false; }
    }

    const api = {
      get active() { return active; },
      push: pushSoon,
      pushNow: push,
      reconcile,
      /** Bestand nu ophalen (bv. bij openen als het nog niet binnen is). */
      async fetchFile(f) {
        if (!active || !S.data.bestanden[f.id]) return false;
        const text = await S.downloadFile(f.id);
        if (!text) return false;
        await f.put(text);
        return true;
      }
    };

    if (S && S.cfg) {
      active = true;
      S.on(what => { if (what === 'data' || what === 'sync') { clearTimeout(api._r); api._r = setTimeout(reconcile, 150); } });
      S.start();
      addEventListener('online', () => setTimeout(push, 1000));
    }
    return api;
  }

  /** Klein statuslabel in de kopbalk: gedeeld (live/offline) of uitnodiging om te koppelen. */
  function badge(top) {
    top = top || document.querySelector('.top');
    if (!top || !S) return;
    const b = document.createElement('a');
    b.className = 'deelst';
    b.href = '../samen/index.html';
    const css = document.createElement('style');
    css.textContent = '.deelst{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700;background:var(--panel);color:var(--muted);text-decoration:none;flex:none;white-space:nowrap}' +
      '.deelst i{width:8px;height:8px;border-radius:4px;background:var(--muted)}.deelst.live i{background:var(--ok)}.deelst.verbinden i{background:#ffc83d}.deelst.fout{color:var(--danger)}.deelst.fout i{background:var(--danger)}';
    document.head.appendChild(css);
    const h1 = top.querySelector('h1');
    h1 && h1.nextSibling ? top.insertBefore(b, h1.nextSibling) : top.appendChild(b);
    const draw = () => {
      if (!S.cfg) { b.className = 'deelst'; b.innerHTML = '<i></i>Niet gedeeld'; b.title = 'Koppel Samen om dit met je partner te delen'; return; }
      const st = S.status;
      b.className = 'deelst ' + st.status;
      b.innerHTML = '<i></i>' + (st.status === 'live' ? 'Gedeeld' : st.status === 'offline' ? 'Offline' : st.status === 'fout' ? 'Fout' : 'Verbinden…');
      b.title = st.msg || '';
    };
    b.addEventListener('click', e => {
      if (!S.cfg) return;   // naar Samen om te koppelen
      e.preventDefault();
      const st = S.status;
      const t = st.status === 'fout' ? st.msg : st.status === 'live' ? 'Gedeeld met ' + Object.values(S.data.leden).map(m => m.naam).join(' & ') + '. Wijzigingen gaan meteen naar de anderen.'
        : st.status === 'offline' ? 'Geen internet. Wijzigingen gaan mee zodra je weer online bent.' : 'Bezig met verbinden…';
      window.UI ? UI.toast(t, 4500) : alert(t);
    });
    S.on(w => { if (w === 'status' || w === 'sync') draw(); });
    draw();
  }

  window.W2Deel = { koppel, badge, hash, stable };
})();
