/* W2 Apps — Zeeslag: vloot, schoten en de computer.
   Zee van 10×10 (veld i = rij*10 + kolom). Klassieke vloot: 5, 4, 3, 3, 2. Schepen mogen elkaar standaard niet raken
   (ook niet schuin). */
(function (root) {
  const SIZE = 10, N = 100;
  const FLEET = [
    { id: 'v', naam: 'Vliegdekschip', l: 5 }, { id: 's', naam: 'Slagschip', l: 4 }, { id: 'k', naam: 'Kruiser', l: 3 },
    { id: 'o', naam: 'Onderzeeër', l: 3 }, { id: 'm', naam: 'Mijnenveger', l: 2 }
  ];
  const r = i => Math.floor(i / SIZE), c = i => i % SIZE;
  const cellsOf = (start, len, dir) => {
    const out = [];
    for (let k = 0; k < len; k++) {
      const rr = r(start) + (dir === 'v' ? k : 0), cc = c(start) + (dir === 'h' ? k : 0);
      if (rr >= SIZE || cc >= SIZE) return null;
      out.push(rr * SIZE + cc);
    }
    return out;
  };
  const around = i => { const out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r(i) + dr, cc = c(i) + dc; if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) out.push(rr * SIZE + cc); } return out; };

  /** Kan dit schip hier liggen tussen de andere (behalve het schip met id skip)? */
  function fits(ships, cells, skip, touch) {
    if (!cells) return false;
    const taken = new Set();
    ships.forEach(s => { if (s.id === skip) return; s.cells.forEach(x => { if (touch) taken.add(x); else around(x).forEach(y => taken.add(y)); }); });
    return cells.every(x => !taken.has(x));
  }
  function place(ship, start, dir) { return Object.assign({}, ship, { start, dir, cells: cellsOf(start, ship.l, dir) }); }

  /** Dichtstbijzijnde plek waar het schip past, met de kop zo dicht mogelijk bij (row, col); die mag ook buiten de zee
      vallen (dan schuift hij vanzelf naar binnen). maxDist: hoe ver hij mag opschuiven (in vakken); null is onbeperkt. */
  function nearestFit(ships, ship, row, col, dir, touch, maxDist) {
    let best = null, bd = Infinity;
    const lim = maxDist == null ? Infinity : maxDist * maxDist + 1e-9;
    for (let rr = 0; rr < SIZE; rr++) for (let cc = 0; cc < SIZE; cc++) {
      const d = (rr - row) * (rr - row) + (cc - col) * (cc - col);
      if (d >= bd || d > lim) continue;
      const s = place(ship, rr * SIZE + cc, dir);
      if (s.cells && fits(ships, s.cells, ship.id, touch)) { best = s; bd = d; }
    }
    return best;
  }
  /** Draai een schip om zijn k-de vak; past dat niet precies, dan de dichtstbijzijnde plek waar het gedraaid wel past. */
  function rotateAt(ships, ship, k, touch) {
    k = Math.max(0, Math.min(ship.l - 1, k | 0));
    const pivot = ship.cells[k], dir = ship.dir === 'h' ? 'v' : 'h';
    const row = r(pivot) - (dir === 'v' ? k : 0), col = c(pivot) - (dir === 'h' ? k : 0);
    return nearestFit(ships, ship, row, col, dir, touch, null);
  }
  /** Leg het schip precies hier (binnen de rand geschoven); schepen die in de weg liggen gaan naar de dichtstbijzijnde
      vrije plek. Geeft de nieuwe vloot (zelfde volgorde) of null als het echt niet kan. */
  function forcePlace(ships, ship, row, col, dir, touch) {
    row = Math.max(0, Math.min(SIZE - (dir === 'v' ? ship.l : 1), row));
    col = Math.max(0, Math.min(SIZE - (dir === 'h' ? ship.l : 1), col));
    const s = place(ship, row * SIZE + col, dir);
    const others = ships.filter(x => x.id !== ship.id);
    const fleet = [s].concat(others.filter(o => fits([s], o.cells, o.id, touch)));
    const moving = others.filter(o => !fits([s], o.cells, o.id, touch)).sort((a, b) => b.l - a.l);
    for (const o of moving) {
      const n = nearestFit(fleet, o, r(o.start), c(o.start), o.dir, touch, null) || nearestFit(fleet, o, r(o.start), c(o.start), o.dir === 'h' ? 'v' : 'h', touch, null);
      if (!n) return null;
      fleet.push(n);
    }
    return ships.map(x => fleet.find(y => y.id === x.id));
  }
  /** Draaien met de hele vloot erbij: liefst zonder iets te verschuiven, anders maken de andere schepen plaats. */
  function rotateFleet(ships, ship, k, touch) {
    const r1 = rotateAt(ships, ship, k, touch);
    if (r1) return ships.map(x => x.id === ship.id ? r1 : x);
    k = Math.max(0, Math.min(ship.l - 1, k | 0));
    const pivot = ship.cells[k], dir = ship.dir === 'h' ? 'v' : 'h';
    return forcePlace(ships, ship, r(pivot) - (dir === 'v' ? k : 0), c(pivot) - (dir === 'h' ? k : 0), dir, touch);
  }

  function randomFleet(rnd, touch) {
    rnd = rnd || Math.random;
    for (let tries = 0; tries < 200; tries++) {
      const ships = [];
      let ok = true;
      for (const f of FLEET) {
        let done = false;
        for (let t = 0; t < 300 && !done; t++) {
          const dir = rnd() < .5 ? 'h' : 'v', start = Math.floor(rnd() * N);
          const s = place(f, start, dir);
          if (fits(ships, s.cells, null, touch)) { ships.push(s); done = true; }
        }
        if (!done) { ok = false; break; }
      }
      if (ok) return ships;
    }
    throw new Error('geen vloot');
  }
  function validFleet(ships, touch) {
    if (!Array.isArray(ships) || ships.length !== FLEET.length) return false;
    return ships.every((s, i) => s.cells && s.cells.length === FLEET.find(f => f.id === s.id).l && fits(ships.slice(0, i), s.cells, null, touch));
  }

  /** Uitslag van een schot op een vloot, gegeven alle eerdere schoten (inclusief dit). */
  function result(ships, shots, i) {
    const hit = ships.find(s => s.cells.includes(i));
    if (!hit) return { type: 'mis' };
    const set = new Set(shots);
    if (hit.cells.every(x => set.has(x))) return { type: 'gezonken', ship: hit };
    return { type: 'raak' };
  }
  const sunkShips = (ships, shots) => { const set = new Set(shots); return ships.filter(s => s.cells.every(x => set.has(x))); };
  const allSunk = (ships, shots) => sunkShips(ships, shots).length === ships.length;

  // ---------------------------------------------------------------- computer
  /** Wat de schutter weet: per veld 'mis', 'raak' of 'zonk' (cel van gezonken schip) en welke lengtes nog drijven. */
  function knowledge(ships, shots) {
    const k = Array(N).fill('');
    const sunk = sunkShips(ships, shots), sunkCells = new Set(sunk.flatMap(s => s.cells));
    shots.forEach(i => { k[i] = sunkCells.has(i) ? 'zonk' : ships.some(s => s.cells.includes(i)) ? 'raak' : 'mis'; });
    const left = FLEET.filter(f => !sunk.some(s => s.id === f.id)).map(f => f.l);
    return { k, left };
  }
  function chooseShot(ships, shots, level, touch, rnd) {
    rnd = rnd || Math.random;
    const { k, left } = knowledge(ships, shots);
    const free = [...Array(N).keys()].filter(i => !k[i]);
    if (!free.length) return null;
    // zonder raken: velden naast een gezonken schip kunnen nooit een schip zijn
    const blocked = new Set();
    if (!touch) k.forEach((v, i) => { if (v === 'zonk') around(i).forEach(x => blocked.add(x)); });
    const open = free.filter(i => !blocked.has(i));
    const pool = open.length ? open : free;
    const hits = k.map((v, i) => v === 'raak' ? i : -1).filter(i => i >= 0);
    if (level === 'easy') {
      if (hits.length && rnd() < .6) {
        const nb = hits.flatMap(h => [h - 10, h + 10, c(h) > 0 ? h - 1 : -1, c(h) < 9 ? h + 1 : -1]).filter(i => i >= 0 && i < N && pool.includes(i));
        if (nb.length) return nb[Math.floor(rnd() * nb.length)];
      }
      return pool[Math.floor(rnd() * pool.length)];
    }
    // kansdichtheid: tel hoeveel nog drijvende schepen over elk veld passen
    const score = Array(N).fill(0);
    for (const L of left) for (const dir of ['h', 'v']) for (let s = 0; s < N; s++) {
      const cells = cellsOf(s, L, dir);
      if (!cells || cells.some(x => k[x] === 'mis' || k[x] === 'zonk' || blocked.has(x))) continue;
      const nh = cells.filter(x => k[x] === 'raak').length;
      if (hits.length && !nh) { if (level === 'strong') continue; }
      const w = hits.length ? (nh ? 1 + nh * 40 : 1) : 1;
      cells.forEach(x => { if (!k[x]) score[x] += w; });
    }
    if (level === 'normal' && !hits.length) {
      // normaal: wat losser, zonder dambordpatroon
      const cand = pool.filter(i => score[i] > 0);
      const best = Math.max(...cand.map(i => score[i]));
      const top = cand.filter(i => score[i] >= best * .6);
      return top[Math.floor(rnd() * top.length)];
    }
    if (!hits.length) {
      // sterk: alleen een dambordpatroon (de kleinste boot is minstens 2 lang)
      const minL = Math.min(...left);
      const par = pool.filter(i => (r(i) + c(i)) % minL === 0 && score[i] > 0);
      if (par.length) { const b = Math.max(...par.map(i => score[i])); const top = par.filter(i => score[i] === b); return top[Math.floor(rnd() * top.length)]; }
    }
    const best = Math.max(...pool.map(i => score[i]));
    const top = pool.filter(i => score[i] === best);
    return top[Math.floor(rnd() * top.length)];
  }

  const label = i => 'ABCDEFGHIJ'[c(i)] + (r(i) + 1);
  const api = { SIZE, N, FLEET, cellsOf, fits, place, nearestFit, rotateAt, forcePlace, rotateFleet, randomFleet, validFleet, result, sunkShips, allSunk, chooseShot, knowledge, label, around };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ZEE = api;
})(typeof window !== 'undefined' ? window : globalThis);
