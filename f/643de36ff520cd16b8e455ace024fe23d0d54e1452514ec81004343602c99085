/* W2 Apps — Dammen (internationaal, 10×10): regels en computer.
   Velden 1–50 zoals in de damnotatie: 1 linksboven (zwarte kant), 50 rechtsonder (witte kant). Wit begint.
   Regels: slaan is verplicht en je moet de meeste stukken slaan (dam en schijf tellen even zwaar);
   schijven slaan ook achteruit; de dam is "vliegend"; geslagen stukken gaan pas na de hele slag van het bord
   (je mag niet twee keer over hetzelfde stuk); promoveren alleen als je zet op de achterste rij eindigt.
   Remise: 25 zetten achter elkaar alleen met dammen zonder slaan, of drie keer dezelfde stand. */
(function (root) {
  const N = 50;
  const rc = n => { const r = Math.floor((n - 1) / 5), i = (n - 1) % 5; return [r, r % 2 === 0 ? 2 * i + 1 : 2 * i]; };
  const sq = (r, c) => (r < 0 || r > 9 || c < 0 || c > 9 || (r + c) % 2 === 0) ? 0 : r * 5 + Math.floor(c / 2) + 1;
  const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  // RAYS[n][d] = velden in richting d vanaf n
  const RAYS = [[]];
  for (let n = 1; n <= N; n++) {
    const [r, c] = rc(n);
    RAYS[n] = DIRS.map(([dr, dc]) => { const out = []; let rr = r + dr, cc = c + dc; while (sq(rr, cc)) { out.push(sq(rr, cc)); rr += dr; cc += dc; } return out; });
  }
  const isW = p => p === 'w' || p === 'W', isB = p => p === 'b' || p === 'B';
  const own = (p, t) => t === 'w' ? isW(p) : isB(p);
  const king = p => p === 'W' || p === 'B';

  function newGame() {
    const b = Array(N + 1).fill('');
    for (let n = 1; n <= 20; n++) b[n] = 'b';
    for (let n = 31; n <= 50; n++) b[n] = 'w';
    return { b, turn: 'w', quiet: 0 };
  }

  // ---------------------------------------------------------------- zetten
  function captures(b, from, piece, t) {
    const out = [];
    const opp = p => p && !own(p, t);
    function walk(cur, path, caps, taken) {
      let any = false;
      for (let d = 0; d < 4; d++) {
        const ray = RAYS[cur];
        if (king(piece)) {
          let i = 0;
          const leeg = v => !b[v] || v === from;   // het beginveld is leeg zodra de dam vertrekt
          while (i < ray[d].length && leeg(ray[d][i])) i++;
          if (i >= ray[d].length) continue;
          const v = ray[d][i];
          if (!opp(b[v]) || taken.has(v)) continue;
          for (let j = i + 1; j < ray[d].length; j++) {
            const land = ray[d][j];
            if (b[land] && land !== from) break;   // het eigen beginveld is vrij geworden
            if (taken.has(land)) break;
            any = true;
            taken.add(v);
            walk(land, path.concat(land), caps.concat(v), taken);
            taken.delete(v);
          }
        } else {
          if (ray[d].length < 2) continue;
          const v = ray[d][0], land = ray[d][1];
          if (!opp(b[v]) || taken.has(v)) continue;
          if (b[land] && land !== from) continue;
          any = true;
          taken.add(v);
          walk(land, path.concat(land), caps.concat(v), taken);
          taken.delete(v);
        }
      }
      if (!any && caps.length) out.push({ from, to: cur, path, caps });
    }
    walk(from, [from], [], new Set());
    return out;
  }

  function legal(pos) {
    const { b, turn: t } = pos;
    let caps = [];
    for (let n = 1; n <= N; n++) if (own(b[n], t)) caps = caps.concat(captures(b, n, b[n], t));
    if (caps.length) {
      const mx = Math.max(...caps.map(m => m.caps.length));
      // dubbele (zelfde van, naar en geslagen stukken via een andere weg) weglaten
      const seen = new Set();
      return caps.filter(m => m.caps.length === mx).filter(m => { const k = m.from + '-' + m.to + ':' + m.caps.slice().sort((a, c) => a - c).join(','); if (seen.has(k)) return false; seen.add(k); return true; });
    }
    const out = [];
    const fwd = t === 'w' ? [0, 1] : [2, 3];
    for (let n = 1; n <= N; n++) {
      const p = b[n];
      if (!own(p, t)) continue;
      if (king(p)) {
        for (let d = 0; d < 4; d++) for (const v of RAYS[n][d]) { if (b[v]) break; out.push({ from: n, to: v, path: [n, v], caps: [] }); }
      } else {
        for (const d of fwd) { const v = RAYS[n][d][0]; if (v && !b[v]) out.push({ from: n, to: v, path: [n, v], caps: [] }); }
      }
    }
    return out;
  }

  function make(pos, m) {
    const b = pos.b.slice(), p = b[m.from];
    b[m.from] = '';
    m.caps.forEach(c => { b[c] = ''; });
    const r = rc(m.to)[0];
    b[m.to] = p === 'w' && r === 0 ? 'W' : p === 'b' && r === 9 ? 'B' : p;
    const quiet = king(p) && !m.caps.length ? (pos.quiet || 0) + 1 : 0;
    return { b, turn: pos.turn === 'w' ? 'b' : 'w', quiet };
  }

  const key = pos => pos.turn + pos.b.slice(1).map(x => x || '.').join('');
  const notation = m => m.caps.length ? m.path.join('x') : m.from + '-' + m.to;
  const count = (pos, t) => pos.b.reduce((s, p) => s + (own(p, t) ? 1 : 0), 0);

  /** null, of { type: 'gewonnen' | 'remise', winner, reden } */
  function status(pos, keys) {
    if (!legal(pos).length) return { type: 'gewonnen', winner: pos.turn === 'w' ? 'b' : 'w', reden: count(pos, pos.turn) ? 'kan niet meer zetten' : 'geen stukken meer' };
    if ((pos.quiet || 0) >= 50) return { type: 'remise', winner: null, reden: '25 zetten alleen met dammen' };
    if (keys && keys.length) { const k = key(pos); if (keys.filter(x => x === k).length >= 3) return { type: 'remise', winner: null, reden: 'drie keer dezelfde stand' }; }
    return null;
  }

  // ---------------------------------------------------------------- computer
  const CENTER = new Set([22, 23, 24, 27, 28, 29]);
  function evaluate(pos) {
    // vanuit wit gezien
    let s = 0;
    const b = pos.b;
    let wm = 0, bm = 0, wk = 0, bk = 0;
    for (let n = 1; n <= N; n++) {
      const p = b[n]; if (!p) continue;
      const r = rc(n)[0];
      if (p === 'w') { wm++; s += 100 + (9 - r) * 3 + (CENTER.has(n) ? 6 : 0) + (r === 9 ? 4 : 0); }
      else if (p === 'b') { bm++; s -= 100 + r * 3 + (CENTER.has(n) ? 6 : 0) + (r === 0 ? 4 : 0); }
      else if (p === 'W') { wk++; s += 320; }
      else { bk++; s -= 320; }
    }
    // ruilen als je voor staat
    const tot = wm + bm + wk + bk;
    if (s > 0) s += (40 - tot) * 2; else if (s < 0) s -= (40 - tot) * 2;
    return s;
  }
  function search(pos, depth, alpha, beta, deadline, stats) {
    const ms = legal(pos);
    const sign = pos.turn === 'w' ? 1 : -1;
    if (!ms.length) return -100000 - depth;
    if (depth <= 0 && !ms[0].caps.length) return sign * evaluate(pos);
    if (depth <= -6) return sign * evaluate(pos);   // slagwisselingen niet eindeloos uitrekenen
    if (++stats.n % 2048 === 0 && Date.now() > deadline) stats.out = true;
    if (stats.out) return 0;
    ms.sort((a, c) => c.caps.length - a.caps.length);
    let best = -Infinity;
    for (const m of ms) {
      const v = -search(make(pos, m), depth - 1, -beta, -alpha, deadline, stats);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
  const LEVEL = { easy: { depth: 2, noise: 60, ms: 300 }, normal: { depth: 5, noise: 8, ms: 900 }, strong: { depth: 9, noise: 0, ms: 2200 } };
  function chooseMove(pos, level, rnd) {
    rnd = rnd || Math.random;
    const L = LEVEL[level] || LEVEL.normal;
    const ms = legal(pos);
    if (ms.length <= 1) return ms[0] || null;
    const deadline = Date.now() + L.ms;
    let best = ms[0], scores = null;
    for (let d = 1; d <= L.depth; d++) {
      const stats = { n: 0, out: false };
      const sc = ms.map(m => -search(make(pos, m), d - 1, -Infinity, Infinity, deadline, stats));
      if (stats.out && d > 1) break;
      scores = sc;
      if (Date.now() > deadline) break;
    }
    const noisy = scores.map(v => v + (L.noise ? (rnd() - .5) * 2 * L.noise : 0));
    let bi = 0;
    noisy.forEach((v, i) => { if (v > noisy[bi]) bi = i; });
    best = ms[bi];
    return best;
  }

  const api = { N, rc, sq, newGame, legal, make, status, key, notation, chooseMove, evaluate, count, king, own };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DAM = api;
})(typeof window !== 'undefined' ? window : globalThis);
