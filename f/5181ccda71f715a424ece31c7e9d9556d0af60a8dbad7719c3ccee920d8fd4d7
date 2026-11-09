/* Tegelrummy — regels, puntentelling en de computer.
   Geen DOM: de pagina én de worker gebruiken dit bestand.

   Stenen zijn getallen 0..105:
   - 0..103: kleur = floor(id / 26) (0 zwart, 1 rood, 2 blauw, 3 oranje), cijfer = id % 13 + 1 (elk twee keer)
   - 104, 105: jokers
   Een rij op tafel is een array van ids, in de volgorde waarin hij ligt. */
(function (root) {
  const N = 13, JOKER_PENALTY = 30, FIRST_MELD = 30, RACK = 14;
  const isJ = id => id >= 104;
  const col = id => Math.floor(id / 26);
  const num = id => (id % 13) + 1;
  const typ = id => (isJ(id) ? 52 : col(id) * 13 + num(id) - 1);
  const value = id => (isJ(id) ? JOKER_PENALTY : num(id));

  function rnd(n) {
    if (n <= 1) return 0;
    try {
      const c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
      if (c) { const a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; let x; do { c.getRandomValues(a); x = a[0]; } while (x >= lim); return x % n; }
    } catch (e) {}
    return Math.floor(Math.random() * n);
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const newPool = () => shuffle(Array.from({ length: 106 }, (_, i) => i));

  /* ---------------- rijen ---------------- */
  // Geeft aan of een rij klopt in de volgorde waarin hij ligt, en wat de jokers voorstellen.
  function analyze(set) {
    const n = set.length;
    if (n < 3) return { ok: false, why: 'kort' };
    const real = set.filter(t => !isJ(t));
    let group = null, run = null;
    if (n <= 4) {
      const nums = new Set(real.map(num)), cols = new Set(real.map(col));
      if (nums.size === 1 && cols.size === real.length) {
        const v = num(real[0]);
        group = { ok: true, kind: 'group', value: v * n, n: v, missing: [0, 1, 2, 3].filter(c => !cols.has(c)) };
      }
    }
    const c0 = col(real[0]);
    if (n <= N && real.every(t => col(t) === c0)) {
      let s = null, ok = true;
      set.forEach((t, i) => { if (!isJ(t)) { const v = num(t) - i; if (s === null) s = v; else if (s !== v) ok = false; } });
      if (ok && s >= 1 && s + n - 1 <= N) run = { ok: true, kind: 'run', value: n * (2 * s + n - 1) / 2, start: s, color: c0 };
    }
    if (group && run) return run.value > group.value ? run : group;
    return group || run || { ok: false, why: real.length && new Set(real.map(num)).size === 1 ? 'groep' : 'rij' };
  }
  // Wat een joker op plek i voorstelt (voor tonen en vervangen); null als de rij niet klopt.
  function jokerMeaning(set, i) {
    const a = analyze(set);
    if (!a.ok) return null;
    if (a.kind === 'run') return { color: a.color, n: a.start + i };
    return { n: a.n, colors: a.missing };
  }
  // Kan steen `id` de joker op plek `i` vervangen?
  function canReplaceJoker(set, i, id) {
    if (!isJ(set[i]) || isJ(id)) return false;
    const m = jokerMeaning(set, i);
    if (!m) return false;
    if (m.colors) return num(id) === m.n && m.colors.includes(col(id));
    return num(id) === m.n && col(id) === m.color;
  }

  const byColNum = (a, b) => (isJ(a) - isJ(b)) || (col(a) - col(b)) || (num(a) - num(b)) || (a - b);
  const byNumCol = (a, b) => (isJ(a) - isJ(b)) || (num(a) - num(b)) || (col(a) - col(b)) || (a - b);

  // Zet een rij netjes neer: klopt hij al, dan blijft de volgorde staan; anders als groep of reeks.
  function arrange(set, preferLow) {
    if (analyze(set).ok) return set.slice();
    const real = set.filter(t => !isJ(t)), jk = set.filter(isJ);
    if (!real.length) return set.slice();
    const nums = new Set(real.map(num)), cols = new Set(real.map(col));
    if (nums.size === 1 && cols.size === real.length && set.length <= 4) return real.sort(byColNum).concat(jk);
    const r = buildRun(real, jk, preferLow);
    if (r) return r;
    return set.slice().sort(byColNum);
  }
  function buildRun(real, jk, preferLow) {
    if (new Set(real.map(col)).size !== 1) return null;
    const s = real.slice().sort(byNumCol);
    for (let i = 1; i < s.length; i++) if (num(s[i]) === num(s[i - 1])) return null;
    const lo = num(s[0]), hi = num(s[s.length - 1]), gaps = hi - lo + 1 - s.length;
    if (gaps > jk.length) return null;
    const J = jk.slice(), out = [];
    for (let v = lo, k = 0; v <= hi; v++) { if (k < s.length && num(s[k]) === v) out.push(s[k++]); else out.push(J.shift()); }
    const extra = J.length, canHi = hi + extra <= N, canLo = lo - extra >= 1;
    if (!extra) return out;
    if (canLo && (preferLow || !canHi)) return J.concat(out);
    if (canHi) return out.concat(J);
    const down = lo - 1, up = extra - down;  // aan beide kanten verdelen
    if (hi + up > N) return null;
    return J.slice(0, down).concat(out, J.slice(down));
  }
  // Leftover joker van de ene naar de andere kant van een reeks schuiven
  function flipJoker(set) {
    const a = analyze(set);
    if (!a.ok || a.kind !== 'run') return null;
    const n = set.length;
    if (isJ(set[n - 1]) && a.start > 1) { const t = [set[n - 1]].concat(set.slice(0, n - 1)); if (analyze(t).ok) return t; }
    if (isJ(set[0]) && a.start + n - 1 < N) { const t = set.slice(1).concat([set[0]]); if (analyze(t).ok) return t; }
    return null;
  }

  /* ---------------- beurt controleren ---------------- */
  // before: { table, rack, melded }   after: { table }
  // Geeft { ok, msg, bad: [rij-indexen], played, rack, meld } terug.
  function checkTurn(before, after) {
    const out = { ok: false, msg: '', bad: [], played: [], rack: before.rack.slice(), meld: 0 };
    const table = after.table.filter(s => s.length);
    const prev = new Set(before.table.flat()), now = table.flat(), nowSet = new Set(now), rackSet = new Set(before.rack);
    if (nowSet.size !== now.length) { out.msg = 'Er ligt een steen dubbel.'; return out; }
    for (const t of prev) if (!nowSet.has(t)) { out.msg = 'Stenen van tafel mogen niet terug naar je rek.'; return out; }
    out.played = now.filter(t => !prev.has(t));
    for (const t of out.played) if (!rackSet.has(t)) { out.msg = 'Die steen hoort niet bij jou.'; return out; }
    out.rack = before.rack.filter(t => !nowSet.has(t));
    table.forEach((s, i) => { if (!analyze(s).ok) out.bad.push(i); });
    if (!out.played.length) { out.msg = 'Leg minstens één steen uit je rek.'; return out; }
    if (out.bad.length) { out.msg = out.bad.length === 1 ? 'Eén rij klopt nog niet.' : out.bad.length + ' rijen kloppen nog niet.'; return out; }
    if (!before.melded) {
      const sig = s => s.slice().sort((x, y) => x - y).join(',');
      const old = new Map();
      before.table.forEach(s => { const k = sig(s); old.set(k, (old.get(k) || 0) + 1); });
      for (const s of table) {
        const fromTable = s.filter(t => prev.has(t)).length;
        if (fromTable === s.length) {
          const k = sig(s), c = old.get(k) || 0;
          if (!c) { out.msg = 'Bij je eerste uitkomst mag je de tafel nog niet veranderen.'; return out; }
          old.set(k, c - 1);
        } else if (fromTable) { out.msg = 'Bij je eerste uitkomst gebruik je alleen eigen stenen, in nieuwe rijen.'; return out; }
        else out.meld += analyze(s).value;
      }
      if (out.meld < FIRST_MELD) { out.msg = `Je eerste uitkomst moet samen minstens ${FIRST_MELD} punten zijn (nu ${out.meld}).`; return out; }
    }
    out.ok = true;
    return out;
  }

  const rackValue = rack => rack.reduce((a, t) => a + value(t), 0);
  // Puntentelling na een spel. out = index van wie uit is, of -1 als de pot op is en niemand meer kan.
  function scoreGame(racks, out) {
    const vals = racks.map(rackValue), d = racks.map(() => 0);
    let winners;
    if (out >= 0) {
      winners = [out];
      vals.forEach((v, i) => { if (i !== out) { d[i] -= v; d[out] += v; } });
    } else {
      const low = Math.min(...vals);
      winners = vals.map((v, i) => (v === low ? i : -1)).filter(i => i >= 0);
      let sum = 0;
      vals.forEach((v, i) => { if (!winners.includes(i)) { d[i] -= v - low; sum += v - low; } });
      winners.forEach((w, k) => { d[w] += Math.floor(sum / winners.length) + (k < sum % winners.length ? 1 : 0); });
    }
    return { deltas: d, winners, values: vals };
  }

  // Wie begint: iedereen trekt een steen, hoogste cijfer begint (jokers en gelijkspel: opnieuw).
  function drawForStart(nPlayers) {
    let alive = Array.from({ length: nPlayers }, (_, i) => i);
    const rounds = [];
    for (let guard = 0; guard < 20; guard++) {
      const pool = shuffle(Array.from({ length: 104 }, (_, i) => i));
      const r = alive.map((p, k) => ({ p, t: pool[k] }));
      rounds.push(r);
      const hi = Math.max(...r.map(x => num(x.t)));
      alive = r.filter(x => num(x.t) === hi).map(x => x.p);
      if (alive.length === 1) return { first: alive[0], rounds };
    }
    return { first: alive[0], rounds };
  }

  /* ---------------- de computer ----------------
     Kern: dynamisch programmeren over de cijfers 1..13. Per kleur houden we twee lopende reeksen bij
     (lengte 0, 1, 2 of 3+), plus hoeveel jokers al gebruikt zijn. Bij elk cijfer kiezen we per kleur
     welke reeksen doorlopen, beginnen of stoppen, en hoeveel stenen naar groepen gaan. Stenen die al
     op tafel liggen moeten allemaal terugkomen; stenen uit het rek mogen. Zo vindt de computer ook
     zetten waarbij de tafel helemaal wordt omgebouwd. */
  const PAIRS = [], PIDX = new Array(16).fill(-1);
  for (let a = 0; a < 4; a++) for (let b = a; b < 4; b++) { PIDX[a * 4 + b] = PAIRS.length; PAIRS.push([a, b]); }
  const pidx = (a, b) => (a <= b ? PIDX[a * 4 + b] : PIDX[b * 4 + a]);
  const SLOT = [
    [[0, 0, '-'], [1, 1, 's']],   // leeg: niks of beginnen
    [[2, 1, 'e']],                // 1 lang: moet door
    [[3, 1, 'e']],                // 2 lang: moet door
    [[3, 1, 'e'], [0, 0, 'x']]    // 3+: door of stoppen
  ];
  function groupsOk(g) {
    let one = 0, two = 0;
    for (const x of g) { if (x === 1) one++; else if (x === 2) two++; }
    if (!two) return one === 0 || one >= 3;
    return two + Math.floor(one / 2) >= 3;
  }

  // tc/rc: aantallen per type (0..51) op tafel / in rek. tj/rj: jokers op tafel / in rek.
  // mode 'meld': waarde van alle gelegde stenen telt (alleen rek); anders weegt elke rekst. met w(n), rekjoker met jw.
  function dp(tc, rc, tj, rj, mode, w, jw, deadline) {
    const JT = tj + rj;
    let cur = new Map([[0, { s: 0 }]]);
    const layers = [];
    for (let n = 1; n <= N; n++) {
      const next = new Map();
      for (const [key, entry] of cur) {
        if (deadline && (n & 1) && Date.now() > deadline) return null;
        const ju0 = key % 3; let pk = Math.floor(key / 3);
        const pp = [0, 0, 0, 0];
        for (let c = 3; c >= 0; c--) { pp[c] = pk % 10; pk = Math.floor(pk / 10); }
        const np = [0, 0, 0, 0], g = [0, 0, 0, 0], dec = [null, null, null, null];
        const rec = (c, ju, sc) => {
          if (c === 4) {
            if (!groupsOk(g)) return;
            const k = (((np[0] * 10 + np[1]) * 10 + np[2]) * 10 + np[3]) * 3 + ju;
            const ex = next.get(k);
            if (!ex || ex.s < sc) next.set(k, { s: sc, prev: key, dec: dec.slice() });
            return;
          }
          const [a, b] = PAIRS[pp[c]], ty = c * 13 + n - 1, t = tc[ty], r = rc[ty], left = JT - ju;
          for (const oa of SLOT[a]) for (const ob of SLOT[b]) {
            const need = oa[1] + ob[1];
            for (let gg = 0; gg <= 2; gg++) {
              const tot = need + gg;
              if (tot > t + r + left || tot < t) continue;
              for (let u = Math.min(tot, t + r); u >= Math.max(t, tot - left); u--) {
                const j = tot - u;
                np[c] = pidx(oa[0], ob[0]); g[c] = gg; dec[c] = [oa[2], ob[2], gg, u, j];
                const gain = mode === 'meld' ? tot * n : (u - t) * w(n);
                rec(c + 1, ju + j, sc + gain);
              }
            }
          }
        };
        rec(0, ju0, entry.s);
      }
      layers.push(next);
      cur = next;
      if (!cur.size) return null;
    }
    let best = null, bestKey = -1;
    for (const [key, e] of cur) {
      const ju = key % 3; let pk = Math.floor(key / 3), ok = true;
      for (let c = 0; c < 4; c++) { const [a, b] = PAIRS[pk % 10]; pk = Math.floor(pk / 10); if ((a !== 0 && a !== 3) || (b !== 0 && b !== 3)) ok = false; }
      if (!ok || ju < tj) continue;
      const s = e.s + (mode === 'meld' ? 0 : (ju - tj) * jw);
      if (!best || s > best.s) { best = { s }; bestKey = key; }
    }
    if (!best) return null;
    const path = [];
    let k = bestKey;
    for (let n = N; n >= 1; n--) { const e = layers[n - 1].get(k); path[n - 1] = e.dec; k = e.prev; }
    best.path = path;
    return best;
  }

  // Van het DP-pad terug naar echte rijen met echte stenen.
  function buildSets(path, tableIds, rackIds) {
    const pools = {}, take = (src, ty, k) => src[ty].splice(0, k);
    const tByType = {}, rByType = {};
    for (let ty = 0; ty <= 52; ty++) { tByType[ty] = []; rByType[ty] = []; }
    tableIds.forEach(t => tByType[typ(t)].push(t));
    rackIds.forEach(t => rByType[typ(t)].push(t));
    const jokers = tByType[52].concat(rByType[52]);
    const sets = [], played = [];
    const slots = [0, 1, 2, 3].map(() => [{ len: 0, tiles: [] }, { len: 0, tiles: [] }]);
    for (let n = 1; n <= N; n++) {
      const gm = [];
      for (let c = 0; c < 4; c++) {
        const [aa, ab, gg, u, j] = path[n - 1][c], ty = c * 13 + n - 1;
        const tCount = tByType[ty].length;
        const fromT = take(tByType, ty, Math.min(u, tCount)), fromR = take(rByType, ty, u - fromT.length);
        played.push(...fromR);
        const J = jokers.splice(0, j);
        J.forEach(x => { if (rackIds.includes(x)) played.push(x); });
        const supply = fromT.concat(fromR, J);
        const sl = slots[c];
        sl.sort((x, y) => Math.min(x.len, 3) - Math.min(y.len, 3));
        [aa, ab].forEach((act, i) => {
          const s = sl[i];
          if (act === 's') { s.len = 1; s.tiles = [supply.shift()]; }
          else if (act === 'e') { s.len++; s.tiles.push(supply.shift()); }
          else if (act === 'x') { sets.push(s.tiles); s.len = 0; s.tiles = []; }
        });
        for (let k = 0; k < gg; k++) gm.push([c, supply.shift()]);
      }
      if (gm.length) {
        const cnt = [0, 0, 0, 0]; gm.forEach(([c]) => cnt[c]++);
        if (Math.max(...cnt) === 1) sets.push(gm.map(x => x[1]));
        else {
          const A = [], B = [], seen = new Set();
          gm.forEach(([c, t]) => { if (cnt[c] === 2) { (seen.has(c) ? B : A).push(t); seen.add(c); } });
          gm.forEach(([c, t]) => { if (cnt[c] === 1) (A.length <= B.length ? A : B).push(t); });
          sets.push(A, B);
        }
      }
    }
    slots.forEach(sl => sl.forEach(s => { if (s.len >= 3) sets.push(s.tiles); }));
    return { sets: sets.map(s => arrange(s)), played };
  }

  // Rijen die nog precies zo bestaan op hun oude plek laten staan; uitwisselbare stenen terugzetten.
  function keepLayout(oldTable, sets) {
    const out = sets.map(s => s.slice());
    const sigT = s => s.map(typ).sort((a, b) => a - b).join(',');
    const used = new Set(), placed = [];
    oldTable.forEach((os, oi) => {
      const sg = sigT(os);
      const k = out.findIndex((s, i) => !used.has(i) && sigT(s) === sg);
      if (k < 0) return;
      used.add(k);
      // stenen van hetzelfde type omwisselen zodat de oude ids op hun plek staan
      const target = arrangeLike(out[k], os);
      for (let p = 0; p < target.length; p++) {
        const want = target[p], have = out[k][p];
        if (want === have) continue;
        for (let q = 0; q < out.length; q++) {
          const at = out[q].indexOf(want);
          if (at >= 0) { out[q][at] = have; out[k][p] = want; break; }
        }
      }
      placed[oi] = k;
    });
    const res = [];
    oldTable.forEach((_, oi) => { if (placed[oi] !== undefined) res.push(out[placed[oi]]); });
    out.forEach((s, i) => { if (!used.has(i)) res.push(s); });
    return res;
  }
  // volgorde van `os` overnemen voor rij `s` (zelfde types)
  function arrangeLike(s, os) {
    const pool = s.slice(), tgt = [];
    for (const o of os) {
      let k = pool.indexOf(o);
      if (k < 0) k = pool.findIndex(x => typ(x) === typ(o));
      tgt.push(pool[k]); pool.splice(k, 1);
    }
    return analyze(tgt).ok ? tgt : s;
  }

  const counts = ids => { const a = new Array(52).fill(0); let j = 0; ids.forEach(t => { if (isJ(t)) j++; else a[typ(t)]++; }); return [a, j]; };
  const ZERO = new Array(52).fill(0);

  // Alleen nieuwe rijen uit het rek
  function rackOnly(rack, mode, w, jw, deadline) {
    const [rc, rj] = counts(rack);
    const r = dp(ZERO, rc, 0, rj, mode, w, jw, deadline);
    if (!r) return { sets: [], played: [] };
    return buildSets(r.path, [], rack);
  }
  // Losse stenen aan bestaande rijen hangen (alleen achteraan/vooraan of als vierde in een groep)
  function appendGreedy(table, rack, useJokers) {
    const T = table.map(s => s.slice()), left = rack.slice().sort(byNumCol), played = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of left.slice()) {
        if (isJ(t) && !useJokers) continue;
        for (let i = 0; i < T.length; i++) {
          const cand = arrange(T[i].concat([t]));
          if (analyze(cand).ok) { T[i] = cand; left.splice(left.indexOf(t), 1); played.push(t); changed = true; break; }
        }
      }
    }
    return { table: T, played };
  }
  function scorePlay(played, w, jw) { return played.reduce((a, t) => a + (isJ(t) ? jw : w(num(t))), 0); }

  // Kies een zet. inp: { table, rack, melded, level }
  function choose(inp) {
    const { table, rack, melded, level } = inp;
    const deadline = Date.now() + (level === 'strong' ? 2500 : 1200);
    const realLeft = rack.filter(t => !isJ(t)).length;
    const w = n => 100 + n;
    const jw = level === 'strong' ? (realLeft <= 3 ? 60 : -40) : 50;
    const valid = (newTable) => {
      const ck = checkTurn({ table, rack, melded }, { table: newTable });
      return ck.ok ? { kind: 'play', table: newTable.filter(s => s.length), played: ck.played, meld: ck.meld } : null;
    };

    if (!melded) {
      const r = rackOnly(rack, 'meld', w, 0, deadline);
      const val = r.sets.reduce((a, s) => a + analyze(s).value, 0);
      if (val >= FIRST_MELD) { const mv = valid(table.concat(r.sets)); if (mv) return mv; }
      return { kind: 'draw' };
    }

    const cands = [];
    // A: eerst nieuwe rijen uit het rek, dan aanhangen
    {
      const r = rackOnly(rack, 'play', w, level === 'easy' ? 50 : jw, deadline);
      let T = table.concat(r.sets), played = r.played.slice();
      if (!(level === 'easy' && rnd(100) < 35)) {
        const ap = appendGreedy(T, rack.filter(t => !played.includes(t)), level !== 'easy');
        T = ap.table; played = played.concat(ap.played);
      }
      cands.push({ table: T, played });
    }
    // B: eerst aanhangen, dan nieuwe rijen
    if (level !== 'easy') {
      const ap = appendGreedy(table, rack, true);
      const left = rack.filter(t => !ap.played.includes(t));
      const r = rackOnly(left, 'play', w, jw, deadline);
      cands.push({ table: ap.table.concat(r.sets), played: ap.played.concat(r.played) });
    }
    // C: de hele tafel opnieuw bouwen
    if (level === 'strong' || (level === 'normal' && rnd(100) < 60)) {
      const [tc, tj] = counts(table.flat()), [rc, rj] = counts(rack);
      const r = dp(tc, rc, tj, rj, 'play', w, jw, deadline);
      if (r) {
        const b = buildSets(r.path, table.flat(), rack);
        cands.push({ table: keepLayout(table, b.sets), played: b.played, full: true });
      }
    }
    let best = null, bestS = 0;
    for (const c of cands) {
      if (!c.played.length) continue;
      let s = scorePlay(c.played, w, level === 'easy' ? 50 : jw);
      if (c.played.length === rack.length) s += 100000;   // uitgaan wint altijd
      if (c.full) s -= 1;                                 // bij gelijke stand liever de tafel laten liggen
      if (!best || s > bestS) { const mv = valid(c.table); if (mv) { best = mv; bestS = s; } }
    }
    if (best && bestS <= 0 && rack.length > 2) return { kind: 'draw' };
    return best || { kind: 'draw' };
  }

  const api = { N, RACK, FIRST_MELD, JOKER_PENALTY, isJ, col, num, typ, value, rnd, shuffle, newPool,
    analyze, arrange, flipJoker, jokerMeaning, canReplaceJoker, checkTurn, rackValue, scoreGame, drawForStart,
    byColNum, byNumCol, choose, _dp: dp, _buildSets: buildSets };
  root.TR = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof self !== 'undefined' ? self : this);
