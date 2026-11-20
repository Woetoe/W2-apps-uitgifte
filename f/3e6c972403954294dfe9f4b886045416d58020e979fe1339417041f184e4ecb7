/* Kunstkamer — de spelregels. Jij bent de Robin Hood van de kunst: je steelt beroemde werken terug van
   hebzuchtige verzamelaars en hangt ze in je eigen, gratis museum.

   Elke wereld heeft 15 levels met wisselende minigames:
   - sluip   rasterpuzzel in beurten: bewakers lopen een vaste ronde met een lantaarn; pak het werk en ga naar de uitgang.
             Ook kisten duwen, drukplaten, sleutels en deuren (Sokoban-achtig) zitten in dit raster.
   - schuif  schuifpuzzel van het werk zelf; soms komt er een lantaarn langs en dan mag je niets schuiven.
   - kluis   draaiknop: tik als de wijzer in het groene vak staat.
   - gang    sluip door een gang: houd ingedrukt om te lopen, sta stil als een lamp aangaat.
   - kraak   meerdere fases achter elkaar (de meesterkraak van een wereld).

   Sterren: 1 = gestolen, 2 en 3 = per level een doel (zetten, tijd, onopgemerkt, buidel voor de armen).
   Sterren leveren gereedschap op (verbruik): na gebruik is het weg.
   Mislukt = alleen de buit van die poging kwijt (en het gereedschap dat je gebruikte). */
(function (root) {
  'use strict';

  /* ================================================================ werken */
  // Rechtenvrije werken (17e eeuw). Eén zinnetje om te kijken, geen lesstof.
  const WORKS = {
    melkmeisje: { t: 'Het melkmeisje', a: 'Johannes Vermeer', j: 'ca. 1658', z: 'Een keukenmeid schenkt heel geconcentreerd melk in, in het licht van het raam.' },
    vissersjongen: { t: 'Vissersjongen', a: 'Frans Hals', j: 'ca. 1630', z: 'Een lachende jongen met een mand vis, geschilderd met snelle, losse streken.' },
    drinker: { t: 'De vrolijke drinker', a: 'Judith Leyster', j: '1629', z: 'Hij heft zijn kan en lacht je recht aan.' },
    binnenplaats: { t: 'Binnenplaats van een huis in Delft', a: 'Pieter de Hooch', j: '1658', z: 'Door de gang kijk je zo de straat op; op het plaatsje een vrouw met een kind.' },
    winter: { t: 'Winterlandschap', a: 'Esaias van de Velde', j: '1629', z: 'Schaatsers op het ijs bij een besneeuwde boerderij.' },
    liefdesbrief: { t: 'De liefdesbrief', a: 'Johannes Vermeer', j: 'ca. 1670', z: 'Door een deuropening zie je een dame met een luit, net als ze een brief krijgt.' },
    dansend: { t: 'Het dansende paar', a: 'Jan Steen', j: '1663', z: 'Feest onder een prieel: dansen, drinken en overal iets te ontdekken.' },
    alkmaar: { t: 'Gezicht op Alkmaar', a: 'Jacob van Ruisdael', j: 'ca. 1670', z: 'Een laag land, de stad ver weg en een enorme wolkenlucht.' },
    geograaf: { t: 'De geograaf', a: 'Johannes Vermeer', j: 'ca. 1669', z: 'Een geleerde met een passer kijkt even op van zijn kaart.' },
    flora: { t: 'Flora', a: 'Rembrandt', j: 'ca. 1654', z: 'De godin van de lente, met bloemen in haar schort.' },
    weegschaal: { t: 'Vrouw met weegschaal', a: 'Johannes Vermeer', j: 'ca. 1664', z: 'Een vrouw houdt een weegschaal in balans, in zacht licht.' },
    cavalier: { t: 'De lachende cavalier', a: 'Frans Hals', j: '1624', z: 'Hij lacht niet echt, maar zijn snor en ogen doen het wel.' },
    astronoom: { t: 'De astronoom', a: 'Johannes Vermeer', j: '1668', z: 'Een geleerde reikt naar een hemelglobe.' },
    jansix: { t: 'Portret van Jan Six', a: 'Rembrandt', j: '1654', z: 'Jan Six trekt net zijn handschoen aan, een rode mantel over zijn schouder.' },
    nachtwacht: { t: 'De Nachtwacht', a: 'Rembrandt', j: '1642', z: 'De schutterij trekt uit, vol licht, schaduw en beweging.' },
    // zeldzaam: alleen uit de dagelijkse kraak
    zelfportret: { t: 'Zelfportret met baret', a: 'Rembrandt', j: '', z: 'De schilder kijkt je zelf aan.', rare: true },
    storm: { t: 'Het IJ bij stormweer', a: 'Jacob van Ruisdael', j: '', z: 'Woeste golven, een zeilschip in de wind.', rare: true },
    tulp: { t: 'Tulp', a: 'Judith Leyster', j: '1643', z: 'Eén tulp, rood en wit gevlamd.', rare: true },
    glaswijn: { t: 'Het glas wijn', a: 'Johannes Vermeer', j: 'ca. 1660', z: 'Een heer wacht tot de dame haar glas leeg heeft.', rare: true },
    levensloop: { t: 'Het leven van de mens', a: 'Jan Steen', j: 'ca. 1665', z: 'Een volle herberg: van baby tot opa, iedereen is er.', rare: true },
    hofje: { t: 'Binnenplaats in Delft', a: 'Pieter de Hooch', j: '', z: 'Drinken in de zon op een Delfts plaatsje.', rare: true },
    gebed: { t: 'Het gebed voor de maaltijd', a: 'Jan Steen', j: '1665', z: 'Even stil voor het eten, het hele gezin rond de tafel.', rare: true },
    zelfportret2: { t: 'Zelfportret met hoed', a: 'Rembrandt', j: '', z: 'Jong, zelfverzekerd, met brede hoed.', rare: true }
  };
  const RARE = Object.keys(WORKS).filter(k => WORKS[k].rare);

  /* ================================================================ gereedschap */
  const TOOLS = [
    { id: 'sleutel', name: 'Lopersleutel', desc: 'Opent één dichte deur, of slaat bij een kluis één slot over.', from: 1, modes: ['sluip', 'kluis'] },
    { id: 'fluit', name: 'Lokfluitje', desc: 'Bewakers blijven 3 beurten staan luisteren. In de gang: lampen 4 s uit.', from: 2, modes: ['sluip', 'gang'] },
    { id: 'zand', name: 'Zandloper', desc: 'Alles gaat langzamer: de lantaarn blijft 20 s weg, de kluiswijzer en de lampen trager.', from: 3, modes: ['schuif', 'kluis', 'gang'] },
    { id: 'kaart', name: 'Plattegrond', desc: 'Toont de veilige route voor de komende stappen.', from: 5, modes: ['sluip'] }
  ];
  const TOOL = Object.fromEntries(TOOLS.map(t => [t.id, t]));
  const MAX_CARRY = 2;
  const START_TOOLS = { sleutel: 1, fluit: 1 };

  /* ================================================================ hulpjes */
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => a / gcd(a, b) * b;
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const TURN = { u: 'U', d: 'D', l: 'L', r: 'R' };

  /* ================================================================ sluip (raster in beurten)
     Kaart: '#' muur, ' ' buiten, '.' vloer, 'S' start, 'E' uitgang, 'P' het werk, '$' buidel (voor de armen),
     'k' sleutel, 'D' dichte deur, 'C' kist, 'o' drukplaat, 'H' hek (open als op álle drukplaten een kist staat).
     Bewaker: { x, y, f: kijkrichting, path } — U/D/L/R = stap, u/d/l/r = alleen draaien, '.' = staan.
     De ronde moet terugkomen op de beginplek (de kijkrichting springt dan terug naar de eerste). */
  function parseGrid(def) {
    const h = def.map.length, w = Math.max(...def.map.map(r => r.length));
    const base = new Array(w * h).fill(' ');
    const g = { w, h, range: def.range || 3, base, start: -1, exit: -1, art: -1, purse: -1, keys: [], doors: [], crates: [], plates: [], gates: [], guards: [] };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = def.map[y][x] || ' ', i = y * w + x;
      let b = c;
      if (c === 'S') { g.start = i; b = '.'; }
      else if (c === 'E') { g.exit = i; b = 'E'; }
      else if (c === 'P') { g.art = i; b = '.'; }
      else if (c === '$') { g.purse = i; b = '.'; }
      else if (c === 'k') { g.keys.push(i); b = '.'; }
      else if (c === 'D') { g.doors.push(i); b = 'D'; }
      else if (c === 'C') { g.crates.push(i); b = '.'; }
      else if (c === 'o') { g.plates.push(i); b = 'o'; }
      else if (c === 'H') { g.gates.push(i); b = 'H'; }
      base[i] = b;
    }
    // bewakers: positie en kijkrichting per tik van de ronde
    let period = 1;
    g.guards = (def.guards || []).map(gd => {
      let x = gd.x, y = gd.y, f = gd.f || 'D';
      const pos = [], dir = [];
      pos.push(y * w + x); dir.push(f);
      for (const ch of gd.path) {
        if (DIRS[ch]) { x += DIRS[ch][0]; y += DIRS[ch][1]; f = ch; }
        else if (TURN[ch]) f = TURN[ch];
        pos.push(y * w + x); dir.push(f);
      }
      const n = gd.path.length;
      const ok = pos[n] === pos[0];
      pos.pop(); dir.pop();
      period = lcm(period, n);
      return { pos, dir, n, ok };
    });
    g.period = period;
    // cellen waar een bewaker ooit staat: daar mag geen kist heen
    g.route = new Set();
    g.guards.forEach(gg => gg.pos.forEach(p => g.route.add(p)));
    return g;
  }

  // toestand: compact en makkelijk te kopiëren
  function gridState(g) {
    return { pos: g.start, art: false, purse: false, keys: 0, taken: [], opened: [], crates: g.crates.slice(), gt: 0, frozen: 0, moves: 0, status: 'play', usedTools: [] };
  }
  const cloneState = s => ({ pos: s.pos, art: s.art, purse: s.purse, keys: s.keys, taken: s.taken.slice(), opened: s.opened.slice(), crates: s.crates.slice(), gt: s.gt, frozen: s.frozen, moves: s.moves, status: s.status, usedTools: s.usedTools.slice() });

  function gatesOpen(g, s) { return g.plates.length > 0 && g.plates.every(p => s.crates.includes(p)); }
  function blocksSight(g, s, i) {
    const b = g.base[i];
    if (b === '#' || b === ' ') return true;
    if (b === 'D' && !s.opened.includes(i)) return true;
    if (b === 'H' && !gatesOpen(g, s)) return true;
    return s.crates.includes(i);
  }
  function guardsAt(g, t) { return g.guards.map(gg => ({ pos: gg.pos[t % gg.n], dir: gg.dir[t % gg.n] })); }
  function litCells(g, s, t) {
    const lit = new Set();
    for (const gu of guardsAt(g, t === undefined ? s.gt : t)) {
      lit.add(gu.pos);
      const [dx, dy] = DIRS[gu.dir];
      let x = gu.pos % g.w, y = (gu.pos / g.w) | 0;
      for (let r = 0; r < g.range; r++) {
        x += dx; y += dy;
        if (x < 0 || y < 0 || x >= g.w || y >= g.h) break;
        const i = y * g.w + x;
        if (blocksSight(g, s, i)) break;
        lit.add(i);
      }
    }
    return lit;
  }
  // kan een kist hier heen?
  function crateFree(g, s, i) {
    const b = g.base[i];
    if (b !== '.' && b !== 'o') return false;
    if (s.crates.includes(i) || g.route.has(i)) return false;
    if (i === g.art && !s.art) return false;
    if (i === g.purse && !s.purse) return false;
    if (g.keys.includes(i) && !s.taken.includes(i)) return false;
    return true;
  }

  /* Eén beurt. act = 'U' | 'D' | 'L' | 'R' | 'W' (wachten). tools = { sleutel: aantal mee } (wordt bijgewerkt).
     Geeft { s, ev } terug; ev.invalid = beurt telde niet. */
  function gridStep(g, s0, act, tools) {
    const ev = { invalid: false, events: [] };
    if (s0.status !== 'play') return { s: s0, ev: Object.assign(ev, { invalid: true }) };
    const s = cloneState(s0);
    if (act !== 'W') {
      const d = DIRS[act];
      const x = s.pos % g.w + d[0], y = ((s.pos / g.w) | 0) + d[1];
      if (x < 0 || y < 0 || x >= g.w || y >= g.h) { ev.invalid = true; return { s: s0, ev }; }
      const t = y * g.w + x, b = g.base[t];
      if (b === '#' || b === ' ') { ev.invalid = true; return { s: s0, ev }; }
      if (b === 'H' && !gatesOpen(g, s)) { ev.invalid = true; ev.events.push('gate'); return { s: s0, ev }; }
      if (b === 'D' && !s.opened.includes(t)) {
        if (s.keys > 0) { s.keys--; s.opened.push(t); ev.events.push('door'); }
        else if (tools && tools.sleutel > 0) { tools.sleutel--; s.usedTools.push('sleutel'); s.opened.push(t); ev.events.push('door', 'tool:sleutel'); }
        else { ev.invalid = true; ev.events.push('locked'); return { s: s0, ev }; }
      }
      const ci = s.crates.indexOf(t);
      if (ci >= 0) {
        const t2 = (y + d[1]) * g.w + (x + d[0]);
        const x2 = x + d[0], y2 = y + d[1];
        if (x2 < 0 || y2 < 0 || x2 >= g.w || y2 >= g.h || !crateFree(g, s, t2) || guardsAt(g, s.gt).some(gu => gu.pos === t2)) {
          ev.invalid = true; ev.events.push('stuck'); return { s: s0, ev };
        }
        const wasOpen = gatesOpen(g, s);
        s.crates[ci] = t2; ev.events.push('push');
        if (gatesOpen(g, s) !== wasOpen) ev.events.push(wasOpen ? 'gateclose' : 'gateopen');
      }
      s.pos = t;
      if (guardsAt(g, s.gt).some(gu => gu.pos === t)) { s.status = 'caught'; s.moves++; ev.events.push('caught'); return { s, ev }; }
      if (t === g.art && !s.art) { s.art = true; ev.events.push('art'); }
      if (t === g.purse && !s.purse) { s.purse = true; ev.events.push('purse'); }
      if (g.keys.includes(t) && !s.taken.includes(t)) { s.taken.push(t); s.keys++; ev.events.push('key'); }
    }
    s.moves++;
    if (litCells(g, s).has(s.pos)) { s.status = 'caught'; ev.events.push('caught'); return { s, ev }; }
    if (s.art && s.pos === g.exit) { s.status = 'won'; ev.events.push('won'); return { s, ev }; }
    if (s.frozen > 0) s.frozen--; else s.gt++;
    if (litCells(g, s).has(s.pos)) { s.status = 'caught'; ev.events.push('caught'); }
    return { s, ev };
  }

  /* Oplosser (breedte eerst): kortste aantal beurten tot de uitgang met het werk (en desgewenst de buidel).
     Gereedschap telt niet mee (behalve een al lopend fluitje). Geeft { moves, path } of null. */
  function solveGrid(g, from, opts) {
    opts = opts || {};
    const needPurse = !!opts.purse, limit = opts.limit || 400000;
    const start = from ? cloneState(from) : gridState(g);
    const key = s => s.pos + '|' + (s.art ? 1 : 0) + (needPurse && s.purse ? 1 : 0) + '|' + s.keys + '|' + s.taken.join(',') + '|' + s.opened.slice().sort().join(',') + '|' + s.crates.slice().sort((a, b) => a - b).join(',') + '|' + (s.gt % g.period) + '|' + s.frozen;
    const seen = new Map([[key(start), null]]);
    let frontier = [{ s: start, path: '' }];
    let count = 0;
    while (frontier.length) {
      const next = [];
      for (const node of frontier) {
        for (const a of ['W', 'U', 'D', 'L', 'R']) {
          const { s, ev } = gridStep(g, node.s, a, null);
          if (ev.invalid || s.status === 'caught') continue;
          const path = node.path + a;
          if (s.status === 'won') { if (!needPurse || s.purse) return { moves: s.moves - start.moves, path }; continue; }
          const k = key(s);
          if (seen.has(k)) continue;
          seen.set(k, null);
          if (++count > limit) return null;
          next.push({ s, path });
        }
      }
      frontier = next;
    }
    return null;
  }

  /* ================================================================ schuif */
  function createSchuif(cfg) {
    const n = cfg.n, N = n * n, rnd = mulberry(cfg.seed || 1);
    const tiles = []; for (let i = 0; i < N; i++) tiles.push(i);
    let blank = N - 1;
    // husselen met echte schuifzetten (altijd oplosbaar), zonder meteen terug te schuiven
    let prev = -1;
    const adj = i => { const x = i % n, y = (i / n) | 0, r = []; if (x > 0) r.push(i - 1); if (x < n - 1) r.push(i + 1); if (y > 0) r.push(i - n); if (y < n - 1) r.push(i + n); return r; };
    for (let k = 0; k < cfg.shuffle || isSolvedArr(tiles); k++) {
      const opts = adj(blank).filter(i => i !== prev);
      const pick = opts[(rnd() * opts.length) | 0];
      tiles[blank] = tiles[pick]; tiles[pick] = N - 1; prev = blank; blank = pick;
      if (k > cfg.shuffle + 500) break;
    }
    const L = cfg.light || null;
    const S = {
      n, tiles, blank, moves: 0, t: 0, spotted: 0, maxAlarm: cfg.maxAlarm || 3, status: 'play', inv: 0, lightOff: 0, usedTools: [],
      light: L,
      lightState() {
        if (!L || S.lightOff > 0) return 'off';
        const ph = (S.t + (L.offset || 0)) % L.every;
        if (ph >= L.every - L.on) return 'on';
        if (ph >= L.every - L.on - L.warn) return 'warn';
        return 'off';
      },
      step(dt) {
        if (S.status !== 'play') return [];
        S.t += dt; if (S.inv > 0) S.inv -= dt;
        if (S.lightOff > 0) S.lightOff = Math.max(0, S.lightOff - dt);
        if (S.lightState() !== 'on') S.inv = 0;
        return [];
      },
      // tik op tegel i: schuift alles tussen tegel en gat op (zelfde rij of kolom)
      tap(i) {
        if (S.status !== 'play' || i === S.blank) return null;
        const bx = S.blank % n, by = (S.blank / n) | 0, x = i % n, y = (i / n) | 0;
        if (bx !== x && by !== y) return null;
        const step = bx === x ? (y > by ? n : -n) : (x > bx ? 1 : -1);
        const ev = { moved: [], spotted: false, solved: false };
        while (S.blank !== i) {
          const nx = S.blank + step;
          S.tiles[S.blank] = S.tiles[nx]; S.tiles[nx] = N - 1;
          ev.moved.push({ from: nx, to: S.blank, tile: S.tiles[S.blank] });
          S.blank = nx; S.moves++;
        }
        if (S.lightState() === 'on' && S.inv <= 0) {
          S.spotted++; S.inv = 99; ev.spotted = true;
          if (S.spotted >= S.maxAlarm) { S.status = 'caught'; return ev; }
        }
        if (isSolvedArr(S.tiles)) { S.status = 'won'; ev.solved = true; }
        return ev;
      },
      useZand() { S.lightOff = 20; S.usedTools.push('zand'); }
    };
    return S;
  }
  function isSolvedArr(t) { for (let i = 0; i < t.length; i++) if (t[i] !== i) return false; return true; }
  // kleinste aantal zetten (3×3, breedte eerst over alle standen)
  function solveSlide3(tiles) {
    const goal = '012345678', startK = tiles.join('');
    if (startK === goal) return 0;
    const seen = new Set([startK]);
    let frontier = [startK], d = 0;
    while (frontier.length) {
      d++;
      const next = [];
      for (const k of frontier) {
        const b = k.indexOf('8'), bx = b % 3, by = (b / 3) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = bx + dx, y = by + dy;
          if (x < 0 || y < 0 || x > 2 || y > 2) continue;
          const j = y * 3 + x, a = k.split('');
          a[b] = a[j]; a[j] = '8';
          const nk = a.join('');
          if (nk === goal) return d;
          if (!seen.has(nk)) { seen.add(nk); next.push(nk); }
        }
      }
      frontier = next;
    }
    return -1;
  }

  /* ================================================================ kluis */
  const TAU = Math.PI * 2;
  const angDist = (a, b) => { let d = Math.abs(((a - b) % TAU + TAU) % TAU); return d > Math.PI ? TAU - d : d; };
  function createKluis(cfg) {
    const rnd = mulberry(cfg.seed || 7);
    const tumblers = [];
    let at = 0;
    for (let i = 0; i < cfg.n; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      // doel minstens een kwart slag verder in de draairichting
      const gap = Math.PI * (0.6 + rnd() * 1.1);
      const c = ((at + dir * gap) % TAU + TAU) % TAU;
      tumblers.push({ dir, c, w: Math.max(0.2, cfg.width - i * (cfg.narrow || 0)), speed: cfg.speed + i * (cfg.speedUp || 0) });
      at = c;
    }
    const K = {
      tumblers, idx: 0, angle: 0, t: 0, misses: 0, maxMiss: cfg.maxMiss || 3, status: 'play', slow: 1, usedTools: [],
      step(dt) {
        if (K.status !== 'play') return;
        K.t += dt;
        const tu = K.tumblers[K.idx];
        K.angle = ((K.angle + tu.dir * tu.speed * K.slow * dt) % TAU + TAU) % TAU;
      },
      inZone() { const tu = K.tumblers[K.idx]; return !!tu && angDist(K.angle, tu.c) <= tu.w / 2; },
      tap() {
        if (K.status !== 'play') return null;
        if (K.inZone()) { K.idx++; if (K.idx >= K.tumblers.length) K.status = 'won'; return 'hit'; }
        K.misses++;
        if (K.misses >= K.maxMiss) K.status = 'caught';
        return 'miss';
      },
      useSleutel() { if (K.status !== 'play') return; K.usedTools.push('sleutel'); K.idx++; if (K.idx >= K.tumblers.length) K.status = 'won'; },
      useZand() { K.usedTools.push('zand'); K.slow = 0.6; }
    };
    return K;
  }

  /* ================================================================ gang */
  function createGang(cfg) {
    const G = {
      len: cfg.len, speed: cfg.speed, x: 0, t: 0, lt: 0, hold: false, spotted: 0, maxAlarm: cfg.maxAlarm || 3, inv: 0, status: 'play', usedTools: [],
      zones: cfg.zones.map(z => Object.assign({ warn: 0.7 }, z)), slow: 1, dark: 0,
      zoneState(z) {
        if (G.dark > 0) return 'off';
        const per = z.on + z.off, ph = ((G.lt + z.phase) % per + per) % per;
        if (ph >= z.off) return 'on';
        if (ph >= z.off - z.warn) return 'warn';
        return 'off';
      },
      step(dt) {
        const ev = [];
        if (G.status !== 'play') return ev;
        G.t += dt; G.lt += dt / G.slow;
        if (G.inv > 0) G.inv -= dt;
        if (G.dark > 0) G.dark = Math.max(0, G.dark - dt);
        if (G.hold && G.inv <= 0) G.x = Math.min(G.len, G.x + G.speed * dt);
        if (G.x >= G.len) { G.status = 'won'; ev.push('won'); return ev; }
        if (G.inv <= 0) {
          for (const z of G.zones) {
            if (G.x > z.a && G.x < z.b && G.zoneState(z) === 'on') {
              G.spotted++; ev.push('spotted');
              if (G.spotted >= G.maxAlarm) { G.status = 'caught'; ev.push('caught'); return ev; }
              G.x = Math.max(0, z.a - 2); G.inv = 1.2; G.hold = false;
              break;
            }
          }
        }
        return ev;
      },
      useZand() { G.usedTools.push('zand'); G.slow = 1.6; },
      useFluit() { G.usedTools.push('fluit'); G.dark = 4; }
    };
    return G;
  }

  /* ================================================================ levels
     stars: de doelen voor ster 2 en 3. k = 'moves' (≤ v beurten/zetten), 'time' (≤ v seconden),
     'unseen' (geen alarm), 'purse' (buidel meegenomen). */
  const LEVELS = [
    { n: 1, work: 'melkmeisje', mode: 'schuif', titel: 'Een keuken in Delft', intro: 'Het werk hangt in stukjes in een kast. Schuif het weer heel.',
      cfg: { n: 3, seed: 11, shuffle: 40 }, stars: [{ k: 'time', v: 90 }, { k: 'moves', v: 30 }] },
    { n: 2, work: 'vissersjongen', mode: 'sluip', titel: 'De eerste ronde', intro: 'Eén bewaker loopt zijn ronde. Blijf uit zijn lichtbundel, pak het werk en kom terug bij de uitgang.',
      grid: { map: [
        '#########',
        '#$..#..P#',
        '#.#.#.#.#',
        '#.......#',
        '#.#.#.#.#',
        '#.......#',
        '###.#####',
        '#S.....E#',
        '#########'], guards: [{ x: 1, y: 3, f: 'R', path: 'RRRRRRLLLLLL' }] },
      stars: [{ k: 'moves', v: 40 }, { k: 'purse' }] },
    { n: 3, work: 'drinker', mode: 'kluis', titel: 'De wandkluis', intro: 'Tik als de wijzer in het groene vak staat. Drie keer mis en het alarm gaat af.',
      cfg: { n: 3, seed: 31, speed: 1.7, speedUp: 0.2, width: 0.62, narrow: 0.04 }, stars: [{ k: 'time', v: 12 }, { k: 'unseen' }] },
    { n: 4, work: 'winter', mode: 'sluip', titel: 'Sleutels van de baron', intro: 'De deur zit op slot. Zoek de sleutel, en let op de twee bewakers.',
      grid: { map: [
        '#########',
        '#k..#.P.#',
        '#.#.#...#',
        '#.#.##D##',
        '#.......#',
        '#.#.#.#.#',
        '#...$...#',
        '#S.....E#',
        '#########'], guards: [
        { x: 1, y: 4, f: 'R', path: 'RRRRRRLLLLLL' },
        { x: 7, y: 6, f: 'L', path: 'LLLLLLRRRRRR' }] },
      stars: [{ k: 'moves', v: 49 }, { k: 'purse' }] },
    { n: 5, work: 'binnenplaats', mode: 'schuif', titel: 'Lantaarn in de gang', intro: 'Schuif het werk heel. Gaat de lantaarn aan, dan niets aanraken!',
      cfg: { n: 3, seed: 41, shuffle: 60, light: { every: 9, on: 2.6, warn: 1.4 } }, stars: [{ k: 'time', v: 100 }, { k: 'unseen' }] },
    { n: 6, work: 'dansend', mode: 'sluip', titel: 'Kisten in de opslag', intro: 'Duw de kist op de drukplaat: dan gaat het hek open. Kisten kun je alleen duwen, niet trekken.',
      grid: { map: [
        '#########',
        '#$..P...#',
        '###H#####',
        '#.......#',
        '#.C...C.#',
        '#...o...#',
        '#.......#',
        '#S.....E#',
        '#########'], guards: [] },
      stars: [{ k: 'moves', v: 31 }, { k: 'purse' }] },
    { n: 7, work: 'liefdesbrief', mode: 'gang', titel: 'De lange galerij', intro: 'Houd ingedrukt om te sluipen. Gaat een lamp aan terwijl je eronder staat, dan word je gezien.',
      cfg: { len: 100, speed: 11, zones: [
        { a: 14, b: 27, on: 1.6, off: 2.4, phase: 0 },
        { a: 38, b: 52, on: 1.8, off: 2.4, phase: 1.2 },
        { a: 62, b: 76, on: 1.5, off: 2.2, phase: 0.4 },
        { a: 84, b: 96, on: 1.7, off: 2.0, phase: 1.6 }] },
      stars: [{ k: 'time', v: 20 }, { k: 'unseen' }] },
    { n: 8, work: 'geograaf', mode: 'sluip', titel: 'Kist als schild', intro: 'Een kist houdt het licht tegen. Duw hem tussen jou en de bewaker.',
      grid: { map: [
        '#########',
        '#$.#..P.#',
        '#..#.####',
        '#.......#',
        '#.......#',
        '#..C....#',
        '#.......#',
        '#S.....E#',
        '#########'], guards: [{ x: 7, y: 3, f: 'L', path: '....d' }] },
      stars: [{ k: 'moves', v: 34 }, { k: 'purse' }] },
    { n: 9, work: 'alkmaar', mode: 'kluis', titel: 'De brandkast', intro: 'Vijf sloten, en de wijzer draait steeds sneller.',
      cfg: { n: 5, seed: 83, speed: 2.1, speedUp: 0.28, width: 0.5, narrow: 0.04 }, stars: [{ k: 'time', v: 14 }, { k: 'unseen' }] },
    { n: 10, work: 'weegschaal', mode: 'sluip', titel: 'De wisseling van de wacht', intro: 'Drie bewakers, en ze kijken ook om zich heen.',
      grid: { map: [
        '#########',
        '#P..#..$#',
        '#.#.#.#.#',
        '#.......#',
        '#.#.#.#.#',
        '#.......#',
        '#.##.##.#',
        '#S.....E#',
        '#########'], guards: [
        { x: 4, y: 3, f: 'L', path: 'LLLlrRRRRRRlLLL' + 'r' },
        { x: 4, y: 5, f: 'R', path: 'RRRrlLLLLLLrRRR' + 'l' },
        { x: 3, y: 1, f: 'L', path: 'dlLuRr' }] },
      stars: [{ k: 'moves', v: 45 }, { k: 'purse' }] },
    { n: 11, work: 'flora', mode: 'schuif', titel: 'Vier bij vier', intro: 'Groter, en de lantaarn komt vaker langs.',
      cfg: { n: 4, seed: 101, shuffle: 90, light: { every: 10, on: 3, warn: 1.4 } }, stars: [{ k: 'time', v: 240 }, { k: 'unseen' }] },
    { n: 12, work: 'astronoom', mode: 'sluip', titel: 'Het observatorium', intro: 'Kisten, een hek en een bewaker. Denk eerst na, dan pas lopen.',
      grid: { map: [
        '#########',
        '#$..#.P.#',
        '#.#.#...#',
        '#...#H###',
        '#.C.....#',
        '#...o.C.#',
        '#.#...#.#',
        '#S.....E#',
        '#########'], guards: [{ x: 1, y: 1, f: 'R', path: 'RRDDLLUU' }] },
      stars: [{ k: 'moves', v: 40 }, { k: 'purse' }] },
    { n: 13, work: 'cavalier', mode: 'gang', titel: 'Spiegelzaal', intro: 'Meer lampen, kortere pauzes.',
      cfg: { len: 120, speed: 11, zones: [
        { a: 8, b: 22, on: 1.4, off: 1.9, phase: 0.3 },
        { a: 28, b: 43, on: 1.6, off: 1.8, phase: 1.5 },
        { a: 48, b: 63, on: 1.2, off: 1.9, phase: 0.8 },
        { a: 68, b: 82, on: 1.7, off: 1.8, phase: 2.2 },
        { a: 87, b: 102, on: 1.3, off: 1.9, phase: 0.1 },
        { a: 106, b: 117, on: 1.5, off: 1.6, phase: 1.1 }] },
      stars: [{ k: 'time', v: 26 }, { k: 'unseen' }] },
    { n: 14, work: 'jansix', mode: 'sluip', titel: 'Het grachtenpand', intro: 'Alles komt samen: sleutel, deur, kist en drie bewakers.',
      grid: { map: [
        '#########',
        '#P.D....#',
        '#..#.#.$#',
        '####H####',
        '#k......#',
        '#.C.o.C.#',
        '#.......#',
        '#S.....E#',
        '#########'], guards: [
        { x: 7, y: 4, f: 'L', path: 'LLLLLLRRRRRR' },
        { x: 1, y: 6, f: 'R', path: 'RRRRRRLLLLLL' }] },
      stars: [{ k: 'moves', v: 49 }, { k: 'purse' }] },
    { n: 15, work: 'nachtwacht', mode: 'kraak', titel: 'De meesterkraak', intro: 'De Nachtwacht. Eerst de gang, dan de kluis, dan het werk zelf. Drie keer alarm in totaal en je bent erbij.',
      phases: [
        { mode: 'gang', cfg: { len: 90, speed: 12, zones: [
          { a: 12, b: 24, on: 1.3, off: 1.8, phase: 0.5 },
          { a: 34, b: 48, on: 1.5, off: 1.7, phase: 1.4 },
          { a: 58, b: 70, on: 1.2, off: 1.8, phase: 0 },
          { a: 76, b: 86, on: 1.4, off: 1.6, phase: 0.9 }] } },
        { mode: 'kluis', cfg: { n: 4, seed: 151, speed: 2.5, speedUp: 0.3, width: 0.46, narrow: 0.04 } },
        { mode: 'schuif', cfg: { n: 3, seed: 153, shuffle: 70, light: { every: 8, on: 2.4, warn: 1.2 } } }],
      stars: [{ k: 'time', v: 150 }, { k: 'unseen' }] }
  ];
  LEVELS.forEach(l => { if (l.grid) { l.grid.range = l.range || l.grid.range; } });
  const WORLDS = [
    { id: 'meesters', name: 'Hollandse Meesters', villain: 'Baron van Grachtenhuys', levels: LEVELS.map(l => l.n) },
    { id: 'egypte', name: 'Oud-Egypte', soon: true },
    { id: 'japan', name: 'Japanse prenten', soon: true },
    { id: 'handschrift', name: 'Middeleeuwse handschriften', soon: true }
  ];
  const levelDef = n => LEVELS.find(l => l.n === n) || null;
  const GRIDS = {};
  function gridOf(n) { if (!GRIDS[n]) { const l = levelDef(n); GRIDS[n] = parseGrid(Object.assign({ range: l.range }, l.grid)); } return GRIDS[n]; }
  const modesOf = l => (l.mode === 'kraak' ? l.phases.map(p => p.mode) : [l.mode]);
  const toolsFor = l => { const m = modesOf(l); return TOOLS.filter(t => t.modes.some(x => m.includes(x))).map(t => t.id); };

  /* ================================================================ sterren en voortgang */
  // res: { moves, time, alarms, purse }
  function starsFor(l, res) {
    const got = [true];
    for (const st of l.stars) {
      if (st.k === 'moves') got.push(res.moves <= st.v);
      else if (st.k === 'time') got.push(res.time <= st.v);
      else if (st.k === 'unseen') got.push(!res.alarms);
      else if (st.k === 'purse') got.push(!!res.purse);
      else got.push(false);
    }
    return got;
  }
  const starText = st => (st.k === 'moves' ? `Binnen ${st.v} ${st.v === 1 ? 'zet' : 'zetten'}` : st.k === 'time' ? `Binnen ${st.v} seconden` : st.k === 'unseen' ? 'Onopgemerkt (geen alarm)' : st.k === 'purse' ? 'Buidel voor de armen mee' : '?');

  function newProgress() { return { v: 1, stars: {}, tools: Object.assign({}, START_TOOLS), works: [], rare: [], clean: [], daily: { day: '', done: false, streak: 0, last: '' }, seen: false }; }
  function fixProgress(p) {
    const q = Object.assign(newProgress(), p || {});
    if (!q.stars || typeof q.stars !== 'object') q.stars = {};
    if (!q.tools || typeof q.tools !== 'object') q.tools = Object.assign({}, START_TOOLS);
    for (const t of TOOLS) q.tools[t.id] = Math.max(0, Math.min(99, (q.tools[t.id] | 0)));
    ['works', 'rare', 'clean'].forEach(k => { if (!Array.isArray(q[k])) q[k] = []; });
    if (!q.daily || typeof q.daily !== 'object') q.daily = { day: '', done: false, streak: 0, last: '' };
    return q;
  }
  const starMask = (p, n) => p.stars[n] | 0;
  const starCount = (p, n) => { const m = starMask(p, n); return (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1); };
  const totalStars = p => LEVELS.reduce((a, l) => a + starCount(p, l.n), 0);
  const isDone = (p, n) => (starMask(p, n) & 1) === 1;
  const unlocked = (p, n) => n === 1 || isDone(p, n - 1);
  const topLevel = p => { let t = 1; for (const l of LEVELS) if (unlocked(p, l.n)) t = l.n; return t; };
  const toolsUnlocked = p => TOOLS.filter(t => t.from <= topLevel(p)).map(t => t.id);

  /* Level gehaald: werkt de voortgang bij en zegt wat je kreeg.
     Elke nieuwe ster = één gereedschap naar keuze (picks). Eerste keer zonder gereedschap gehaald = bonus. */
  function finishLevel(p, n, got, usedTools) {
    const before = starMask(p, n);
    let mask = 0; got.forEach((g, i) => { if (g) mask |= 1 << i; });
    const after = before | mask;
    p.stars[n] = after;
    let newStars = 0; for (let i = 0; i < 3; i++) if ((after >> i & 1) && !(before >> i & 1)) newStars++;
    const l = levelDef(n);
    const firstWork = !p.works.includes(l.work);
    if (firstWork) p.works.push(l.work);
    let bonus = null;
    if (!usedTools.length && !p.clean.includes(n)) {
      p.clean.push(n);
      const pool = toolsUnlocked(p);
      bonus = pool[hashStr('bonus' + n) % pool.length];
      p.tools[bonus] = Math.min(99, (p.tools[bonus] | 0) + 1);
    }
    return { newStars, picks: newStars, bonus, firstWork, mask: after, gotMask: mask };
  }
  function addTool(p, id, k) { p.tools[id] = Math.min(99, (p.tools[id] | 0) + (k || 1)); }
  function useTool(p, id) { if ((p.tools[id] | 0) <= 0) return false; p.tools[id]--; return true; }

  /* ================================================================ dagelijkse kraak
     Elke dag hetzelfde level voor die dag, gekozen uit wat je al gehaald hebt (niet de meesterkraak).
     Eerste keer gehaald die dag: 2 gereedschap en (zolang er nog zijn) een zeldzaam werk. */
  const DAILY_FROM = 3;
  function dailyLevel(p, day) {
    const done = LEVELS.filter(l => l.mode !== 'kraak' && isDone(p, l.n)).map(l => l.n);
    if (done.length < DAILY_FROM) return null;
    return done[hashStr('kraak' + day) % done.length];
  }
  function dailySeed(day) { return hashStr('seed' + day) % 100000 + 1; }
  const prevDay = day => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
  function finishDaily(p, day) {
    if (p.daily.day === day && p.daily.done) return null;
    const streak = p.daily.last === prevDay(day) ? (p.daily.streak | 0) + 1 : 1;
    p.daily = { day, done: true, streak, last: day };
    const pool = toolsUnlocked(p), h = hashStr('dag' + day);
    const tools = [pool[h % pool.length], pool[(h >>> 8) % pool.length]];
    tools.forEach(t => addTool(p, t, 1));
    const left = RARE.filter(r => !p.rare.includes(r));
    let rare = null;
    if (left.length) { rare = left[h % left.length]; p.rare.push(rare); }
    else { addTool(p, pool[(h >>> 16) % pool.length], 1); tools.push(pool[(h >>> 16) % pool.length]); }
    return { tools, rare, streak };
  }

  root.KUNSTKAMER = {
    WORKS, RARE, TOOLS, TOOL, MAX_CARRY, LEVELS, WORLDS, DIRS, DAILY_FROM,
    mulberry, hashStr, parseGrid, gridState, cloneState, gridStep, solveGrid, litCells, guardsAt, gatesOpen, gridOf,
    createSchuif, solveSlide3, isSolvedArr, createKluis, angDist, createGang,
    levelDef, modesOf, toolsFor, starsFor, starText,
    newProgress, fixProgress, starMask, starCount, totalStars, isDone, unlocked, topLevel, toolsUnlocked, finishLevel, addTool, useTool,
    dailyLevel, dailySeed, finishDaily, prevDay
  };
})(typeof window !== 'undefined' ? window : globalThis);
