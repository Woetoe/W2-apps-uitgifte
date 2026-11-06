/* Chinees dammen: sterbord met 121 gaatjes, regels en computer. Geen DOM.
   Gaatjes in kubuscoördinaten (x, y, z) met x+y+z = 0. De ster is de vereniging van
   twee grote driehoeken: alle coördinaten ≤ 4, of alle coördinaten ≥ -4.
   Zes hoeken (thuisvakken) van 10 gaatjes; hoek k staat tegenover hoek (k+3) % 6. */
(function (root) {
  const cells = [];       // {x,y,z,px,py,corner}
  const index = new Map();
  const key = (x, y) => x + ',' + y;
  for (let x = -8; x <= 8; x++) for (let y = -8; y <= 8; y++) {
    const z = -x - y;
    if (z < -8 || z > 8) continue;
    const a = x <= 4 && y <= 4 && z <= 4, b = x >= -4 && y >= -4 && z >= -4;
    if (!a && !b) continue;
    // scherm: q = x, r = z
    cells.push({ x, y, z, px: Math.sqrt(3) * (x + z / 2), py: 1.5 * z, corner: -1 });
  }
  // hoeken bepalen en op volgorde rond het bord zetten, hoek 0 = onderaan
  const preds = [c => c.z >= 5, c => c.z <= -5, c => c.x >= 5, c => c.x <= -5, c => c.y >= 5, c => c.y <= -5];
  const groups = preds.map(p => cells.filter(p));
  const ang = g => { const cx = g.reduce((s, c) => s + c.px, 0) / g.length, cy = g.reduce((s, c) => s + c.py, 0) / g.length; return Math.atan2(cy, cx); };
  const bottom = Math.PI / 2;
  const sorted = groups.map(g => ({ g, a: ang(g) })).sort((u, v) => {
    const du = ((u.a - bottom) + 4 * Math.PI) % (2 * Math.PI), dv = ((v.a - bottom) + 4 * Math.PI) % (2 * Math.PI);
    return du - dv;
  });
  cells.forEach((c, i) => index.set(key(c.x, c.y), i));
  const CORNER = sorted.map(({ g }) => g.map(c => index.get(key(c.x, c.y))));
  CORNER.forEach((list, k) => list.forEach(i => { cells[i].corner = k; }));
  const DIRS = [[1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1]]; // (dx, dy), dz = -dx-dy
  const NB = cells.map(c => DIRS.map(([dx, dy]) => { const j = index.get(key(c.x + dx, c.y + dy)); return j === undefined ? -1 : j; }));
  const N = cells.length;
  // punt van elke hoek (verst van het midden)
  const APEX = CORNER.map(list => list.reduce((best, i) => (dist0(i) > dist0(best) ? i : best), list[0]));
  function dist0(i) { const c = cells[i]; return Math.max(Math.abs(c.x), Math.abs(c.y), Math.abs(c.z)); }
  function dist(i, j) { const a = cells[i], b = cells[j]; return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z)); }

  const SEATS = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
  const target = seat => (seat + 3) % 6;

  // bord als string: per gaatje '.' of het spelernummer ('0'..'5')
  function setup(nPlayers) {
    const a = Array(N).fill('.');
    SEATS[nPlayers].forEach((seat, p) => CORNER[seat].forEach(i => { a[i] = String(p); }));
    return a.join('');
  }

  // alle bestemmingen voor de knikker op 'from': Map(doel -> pad)
  function destinations(board, from) {
    const out = new Map();
    for (const j of NB[from]) if (j >= 0 && board[j] === '.') out.set(j, [from, j]);
    // springen: over een buur (van wie dan ook) naar een leeg gaatje erachter, zo vaak je wilt
    const seen = new Set([from]);
    const queue = [[from, [from]]];
    while (queue.length) {
      const [cur, path] = queue.shift();
      for (let d = 0; d < 6; d++) {
        const mid = NB[cur][d]; if (mid < 0 || mid === from || board[mid] === '.') continue;
        const land = NB[mid][d]; if (land < 0 || seen.has(land)) continue;
        if (board[land] !== '.' && land !== from) continue;
        if (land === from) continue;
        seen.add(land);
        const np = path.concat([land]);
        if (!out.has(land) || out.get(land).length > np.length) out.set(land, np);
        queue.push([land, np]);
      }
    }
    return out;
  }
  function move(board, from, to) {
    const a = board.split(''); a[to] = a[from]; a[from] = '.'; return a.join('');
  }
  function hasWon(board, p, seat) {
    const tgt = CORNER[target(seat)];
    let mine = 0, full = 0;
    for (const i of tgt) { if (board[i] !== '.') full++; if (board[i] === String(p)) mine++; }
    // alle 10 binnen, of het vak zit vol en jij staat er minstens met één in (tegen blokkeren)
    return mine === 10 || (full === 10 && mine >= 1);
  }
  function progress(board, p, seat) {
    // totale afstand tot de punt van het doelvak (lager is beter)
    const apex = APEX[target(seat)];
    let s = 0;
    for (let i = 0; i < N; i++) if (board[i] === String(p)) s += dist(i, apex);
    return s;
  }
  function allMoves(board, p) {
    const out = [];
    for (let i = 0; i < N; i++) if (board[i] === String(p)) for (const [to, path] of destinations(board, i)) out.push({ from: i, to, path });
    return out;
  }
  function chooseMove(board, p, seat, level) {
    const apex = APEX[target(seat)], tgt = new Set(CORNER[target(seat)]);
    const ms = allMoves(board, p);
    if (!ms.length) return null;
    let best = null, bestSc = -Infinity;
    for (const m of ms) {
      const gain = dist(m.from, apex) - dist(m.to, apex);
      let sc = gain * 10;
      // achterblijvers eerst meenemen, niet uit het doelvak stappen
      sc += dist(m.from, apex) * 0.8;
      if (tgt.has(m.from) && !tgt.has(m.to)) sc -= 40;
      if (!tgt.has(m.from) && tgt.has(m.to)) sc += 6;
      if (level === 'easy') sc += Math.random() * 25; else sc += Math.random() * 2;
      if (level !== 'easy') {
        // kijk één zet vooruit: hoeveel kun je daarna verder springen?
        const nb = move(board, m.from, m.to);
        let follow = 0;
        for (const [to] of destinations(nb, m.to)) follow = Math.max(follow, dist(m.to, apex) - dist(to, apex));
        sc += follow * 1.5;
        if (hasWon(nb, p, seat)) sc += 10000;
      }
      if (sc > bestSc) { bestSc = sc; best = m; }
    }
    return best;
  }

  const api = { cells, CORNER, APEX, NB, N, SEATS, target, setup, destinations, move, hasWon, progress, allMoves, chooseMove, dist };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HALMA = api;
})(typeof window !== 'undefined' ? window : globalThis);
