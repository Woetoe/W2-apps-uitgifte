/* Dampoe Wars — de spelregels. Eigen spel in de geest van de oude doolhof-met-bommen-spellen,
   maar dan met scheten: leg een scheet, ren weg, en de stinkwolk waait als een kruis over het veld.

   Veld 13 × 11 vakjes. Vakjes hebben hun midden op hele getallen (vakje 3 loopt van 2,5 tot 3,5).
   60 stappen per seconde. Alleen de host (of de telefoon bij spelen op één telefoon) rekent dit uit;
   andere telefoons krijgen 20× per seconde een momentopname (snap) en tekenen die. */
(function (root) {
  'use strict';
  const W = 13, H = 11, N = W * H, HZ = 60;
  const FUSE = 150;            // 2,5 s tot de scheet ontploft
  const FLAME = 33;            // stinkwolk blijft ruim een halve seconde hangen
  const END_WAIT = 30;         // even wachten of de laatste ook nog omvalt (dan gelijkspel)
  const SHRINK_EVERY = 9;      // bij krimpen elke 0,15 s een blok erbij
  const KICK_SPEED = 0.16;     // geschopte scheet: ~10 vakjes per seconde
  const INV_STEPS = 100;       // na de wasknijper even onkwetsbaar
  const BASE_SPEED = 0.052, SPEED_STEP = 0.011, MAX_SPD = 4;
  const MAX_FARTS = 8, MAX_RANGE = 9, START_RANGE = 2;
  const EMPTY = 0, HARD = 1, SOFT = 2;
  const DIRS = [null, [0, -1], [1, 0], [0, 1], [-1, 0]];   // 1 omhoog, 2 rechts, 3 omlaag, 4 links
  const STARTS = [[1, 1], [W - 2, H - 2], [W - 2, 1], [1, H - 2]];
  const DENSITY = { few: 0.45, normal: 0.68, many: 0.86 };

  const ITEMS = [
    { id: 'bonen', ch: 'b', name: 'Bonen', desc: 'Eén scheet extra tegelijk', value: 30 },
    { id: 'spruit', ch: 'r', name: 'Spruitjes', desc: 'Stinkwolk een vakje verder', value: 30 },
    { id: 'peper', ch: 'p', name: 'Rode peper', desc: 'Stinkwolk meteen zo ver als het kan', value: 40 },
    { id: 'sneaker', ch: 's', name: 'Sneakers', desc: 'Sneller lopen', value: 26 },
    { id: 'trap', ch: 'k', name: 'Trapschoen', desc: 'Loop tegen een scheet aan en hij schuift weg', value: 16 },
    { id: 'knijper', ch: 'w', name: 'Wasknijper', desc: 'Eén keer stank overleven', value: 34 }
  ];
  const IBY = Object.fromEntries(ITEMS.map((it, i) => [it.id, Object.assign({ n: i + 1 }, it)]));
  const ICH = Object.fromEntries(ITEMS.map((it, i) => [it.ch, i + 1]));
  const ITEM_COUNTS = { bonen: 7, spruit: 7, peper: 1, sneaker: 4, trap: 3, knijper: 3 };

  const LEVELS = {
    easy: { every: 16, react: 30, hunt: 0, mistake: 0.2, wander: 0.4, items: 0.6 },
    normal: { every: 6, react: 9, hunt: 14, trap: 40, mistake: 0.02, wander: 0.15, items: 1 },
    strong: { every: 3, react: 3, hunt: 30, trap: 220, mistake: 0, wander: 0, items: 1 }
  };

  // Vaste volgorde waarin het veld bij krimpen dichtgaat: van buiten naar binnen, met de klok mee.
  const SPIRAL = (() => {
    const out = [];
    let x0 = 1, y0 = 1, x1 = W - 2, y1 = H - 2;
    while (x0 <= x1 && y0 <= y1) {
      for (let x = x0; x <= x1; x++) out.push(y0 * W + x);
      for (let y = y0 + 1; y <= y1; y++) out.push(y * W + x1);
      if (y1 > y0) for (let x = x1 - 1; x >= x0; x--) out.push(y1 * W + x);
      if (x1 > x0) for (let y = y1 - 1; y > y0; y--) out.push(y * W + x0);
      x0++; y0++; x1--; y1--;
    }
    return out;
  })();

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createSim(cfg) {
    const rnd = cfg.random || (cfg.seed != null ? mulberry(cfg.seed) : Math.random);
    const sim = {
      W, H, t: 0, round: 0, over: false, endAt: -1, roundWinner: -1, ver: 0,
      grid: new Uint8Array(N), items: new Uint8Array(N), hidden: new Uint8Array(N), reveal: new Uint8Array(N), flame: new Uint8Array(N), by: new Int8Array(N),
      farts: [], events: [], shrinkAt: Math.max(0, cfg.shrink || 0) * HZ, shrinkIdx: 0,
      blocks: DENSITY[cfg.blocks] ? cfg.blocks : 'normal',
      players: cfg.players.slice(0, 4).map(p => newPlayer(p))
    };
    let fid = 0, dangerCache = null;

    function newPlayer(p) {
      return { kind: p.kind === 'cpu' ? 'cpu' : 'human', level: LEVELS[p.level] ? p.level : 'normal', score: 0, x: 1, y: 1, face: 3, moving: false, alive: true, active: 0, max: 1, range: START_RANGE, spd: 0, kick: false, shield: false, inv: 0, d: 0, fq: 0, ai: newAI() };
    }
    function newAI() { return { path: [], next: 0, ver: -1, esc: false }; }

    const ix = (x, y) => y * W + x;
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const cellOf = p => ix(Math.round(p.x), Math.round(p.y));
    const speedOf = p => BASE_SPEED + SPEED_STEP * p.spd;
    function fartAt(x, y) { for (const f of sim.farts) if (f.x === x && f.y === y) return f; return null; }
    const ev = e => sim.events.push(e);

    /* ---------------- nieuwe ronde ---------------- */
    sim.newRound = function () {
      sim.round++; sim.t = 0; sim.over = false; sim.endAt = -1; sim.roundWinner = -1; sim.shrinkIdx = 0; sim.ver++;
      sim.farts = []; sim.events = []; dangerCache = null;
      const g = sim.grid; g.fill(EMPTY); sim.items.fill(0); sim.hidden.fill(0); sim.reveal.fill(0); sim.flame.fill(0); sim.by.fill(-1);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || (x % 2 === 0 && y % 2 === 0)) g[ix(x, y)] = HARD;
      }
      // Rond elke startplek drie vakjes vrij (hoekje + de twee buren), ook voor plekken zonder speler.
      const free = new Set();
      STARTS.forEach(([sx, sy]) => {
        const dx = sx === 1 ? 1 : -1, dy = sy === 1 ? 1 : -1;
        [[0, 0], [dx, 0], [0, dy]].forEach(([a, b]) => free.add(ix(sx + a, sy + b)));
      });
      const soft = [];
      const dens = DENSITY[sim.blocks];
      for (let c = 0; c < N; c++) if (g[c] === EMPTY && !free.has(c) && rnd() < dens) { g[c] = SOFT; soft.push(c); }
      // Power-ups verstoppen onder de blokken
      for (let i = soft.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [soft[i], soft[j]] = [soft[j], soft[i]]; }
      const scale = Math.min(1, soft.length / 62);
      let k = 0;
      for (const it of ITEMS) {
        const n = Math.max(1, Math.round(ITEM_COUNTS[it.id] * scale));
        for (let q = 0; q < n && k < soft.length; q++) sim.hidden[soft[k++]] = IBY[it.id].n;
      }
      sim.players.forEach((p, i) => {
        const [sx, sy] = STARTS[i];
        Object.assign(p, { x: sx, y: sy, face: 3, moving: false, alive: true, active: 0, max: 1, range: START_RANGE, spd: 0, kick: false, shield: false, inv: 0, d: 0, fq: 0, ai: newAI() });
      });
      return sim;
    };

    /* ---------------- invoer ---------------- */
    sim.setInput = (i, d) => { const p = sim.players[i]; if (p) p.d = d >= 1 && d <= 4 ? d : 0; };
    sim.drop = i => { const p = sim.players[i]; if (p && p.alive) p.fq = 1; };
    sim.setKind = (i, kind, level) => {
      const p = sim.players[i]; if (!p) return;
      p.kind = kind === 'cpu' ? 'cpu' : 'human'; if (level && LEVELS[level]) p.level = level;
      p.d = 0; p.fq = 0; p.ai = newAI();
    };

    /* ---------------- lopen ---------------- */
    function blockedFor(pi, x, y) {
      if (!inside(x, y)) return true;
      if (sim.grid[ix(x, y)] !== EMPTY) return true;
      const f = fartAt(x, y);
      return !!(f && f.pass.indexOf(pi) < 0);
    }
    function tryKick(pi, p, dx, dy) {
      if (!p.kick) return;
      const cx = Math.round(p.x), cy = Math.round(p.y);
      const f = fartAt(cx + dx, cy + dy);
      if (!f || f.slide || f.pass.indexOf(pi) >= 0) return;
      if (Math.abs(p.x - cx) > 0.12 || Math.abs(p.y - cy) > 0.12) return;
      if (slideBlocked(f.x + dx, f.y + dy, f)) return;
      f.slide = [dx, dy]; f.prog = 0; f.pass = []; ev(['kick', pi]);
    }
    function slideBlocked(x, y, self) {
      if (!inside(x, y)) return true;
      const c = ix(x, y);
      if (sim.grid[c] !== EMPTY || sim.items[c]) return true;
      for (const f of sim.farts) if (f !== self && f.x === x && f.y === y) return true;
      for (const p of sim.players) if (p.alive && cellOf(p) === c) return true;
      return false;
    }
    // Eén as: langs `a` bewegen (x of y) met richting s, de andere as (`b`) eerst recht trekken.
    function move(pi, p, d) {
      const [dx, dy] = DIRS[d];
      let dist = speedOf(p);
      const horiz = dx !== 0;
      const cx = Math.round(p.x), cy = Math.round(p.y);
      const off = horiz ? p.y - cy : p.x - cx;
      const ahead = (ox, oy) => blockedFor(pi, ox + dx, oy + dy);
      if (Math.abs(off) > 1e-6) {
        // nog niet in het midden van de rij/kolom: eerst bijsturen, maar alleen als je daarna echt verder kunt
        if (ahead(cx, cy)) { tryKick(pi, p, dx, dy); return false; }
        const st = Math.min(dist, Math.abs(off));
        if (horiz) p.y -= Math.sign(off) * st; else p.x -= Math.sign(off) * st;
        dist -= st;
        if (Math.abs((horiz ? p.y - cy : p.x - cx)) < 1e-6) { if (horiz) p.y = cy; else p.x = cx; }
        if (dist <= 1e-9) return true;
      }
      const cur = horiz ? p.x : p.y, center = horiz ? cx : cy, s = horiz ? dx : dy;
      let target = cur + s * dist;
      if (ahead(cx, cy)) {
        // niet verder dan het midden van je eigen vakje (of waar je al bent)
        target = s < 0 ? Math.max(target, Math.min(cur, center)) : Math.min(target, Math.max(cur, center));
        if (Math.abs(target - center) < 1e-6) tryKick(pi, p, dx, dy);
      }
      const moved = Math.abs(target - cur) > 1e-9;
      if (horiz) p.x = target; else p.y = target;
      return moved;
    }

    /* ---------------- ontploffen ---------------- */
    function ignite(c, o) { sim.flame[c] = FLAME; sim.by[c] = o; }
    function burst(f) {
      const o = sim.players[f.owner]; if (o) o.active = Math.max(0, o.active - 1);
      ev(['boom', f.x, f.y, f.owner]);
      ignite(ix(f.x, f.y), f.owner);
      for (let d = 1; d <= 4; d++) {
        const [dx, dy] = DIRS[d];
        for (let k = 1; k <= f.range; k++) {
          const x = f.x + dx * k, y = f.y + dy * k;
          if (!inside(x, y)) break;
          const c = ix(x, y), g = sim.grid[c];
          if (g === HARD) break;
          if (g === SOFT) { sim.grid[c] = EMPTY; sim.reveal[c] = sim.hidden[c]; sim.hidden[c] = 0; ignite(c, f.owner); ev(['crate', x, y]); break; }
          if (sim.items[c]) { sim.items[c] = 0; ignite(c, f.owner); ev(['burn', x, y]); break; }
          ignite(c, f.owner);
          if (fartAt(x, y)) break;
        }
      }
    }
    function booms() {
      let again = true, any = false;
      while (again) {
        again = false;
        for (let k = 0; k < sim.farts.length; k++) {
          const f = sim.farts[k];
          if (f.fuse <= 0 || sim.flame[ix(f.x, f.y)] > 0) { sim.farts.splice(k, 1); k--; burst(f); again = true; any = true; }
        }
      }
      if (any) sim.ver++;
    }
    function removeFartsAt(c) {
      for (let k = sim.farts.length - 1; k >= 0; k--) {
        const f = sim.farts[k];
        if (ix(f.x, f.y) === c) { const o = sim.players[f.owner]; if (o) o.active = Math.max(0, o.active - 1); sim.farts.splice(k, 1); sim.ver++; }
      }
    }
    // why: 0 stank, 1 muur (krimpen); by: wiens scheet het was (-1 = muur)
    function kill(i, why, by) {
      const p = sim.players[i];
      p.alive = false; p.moving = false; p.d = 0; p.fq = 0;
      ev(['die', i, why || 0, by == null ? -1 : by]);
    }

    /* ---------------- één stap ---------------- */
    sim.step = function () {
      sim.events = [];
      if (sim.over) return sim.events;
      sim.t++;
      dangerCache = null;
      const P = sim.players;
      // 1. computer denkt na
      P.forEach((p, i) => { if (p.alive && p.kind === 'cpu') think(i, p); });
      // 2. scheten leggen
      P.forEach((p, i) => {
        if (!p.alive || !p.fq) return;
        p.fq = 0;
        const x = Math.round(p.x), y = Math.round(p.y), c = ix(x, y);
        if (p.active >= p.max || fartAt(x, y) || sim.grid[c] !== EMPTY) return;
        const pass = [];
        P.forEach((q, j) => { if (q.alive && cellOf(q) === c) pass.push(j); });
        sim.farts.push({ id: ++fid, x, y, owner: i, range: p.range, fuse: FUSE, pass, slide: null, prog: 0 });
        p.active++; sim.ver++; dangerCache = null;
        ev(['drop', i]);
      });
      // 3. lopen
      P.forEach((p, i) => {
        if (!p.alive) { p.moving = false; return; }
        if (p.inv > 0) p.inv--;
        if (p.d) { p.face = p.d; p.moving = move(i, p, p.d); } else p.moving = false;
      });
      // 4. wie van een scheet af is gestapt, kan er niet meer terug doorheen
      for (const f of sim.farts) if (f.pass.length) f.pass = f.pass.filter(j => P[j].alive && cellOf(P[j]) === ix(f.x, f.y));
      // 5. geschopte scheten schuiven
      for (const f of sim.farts) {
        if (!f.slide) continue;
        const [dx, dy] = f.slide;
        if (slideBlocked(f.x + dx, f.y + dy, f)) { f.slide = null; f.prog = 0; sim.ver++; continue; }
        f.prog += KICK_SPEED;
        if (f.prog >= 1) { f.x += dx; f.y += dy; f.prog -= 1; sim.ver++; }
      }
      // 6. lontjes en wolken
      for (const f of sim.farts) f.fuse--;
      const fl = sim.flame;
      for (let c = 0; c < N; c++) if (fl[c] > 0) { fl[c]--; if (fl[c] === 0 && sim.reveal[c]) { sim.items[c] = sim.reveal[c]; sim.reveal[c] = 0; } }
      booms();
      // 7. power-ups pakken
      P.forEach((p, i) => {
        if (!p.alive) return;
        const c = cellOf(p), it = sim.items[c];
        if (!it || fl[c] > 0) return;
        sim.items[c] = 0;
        const id = ITEMS[it - 1].id;
        if (id === 'bonen') p.max = Math.min(MAX_FARTS, p.max + 1);
        else if (id === 'spruit') p.range = Math.min(MAX_RANGE, p.range + 1);
        else if (id === 'peper') p.range = MAX_RANGE;
        else if (id === 'sneaker') p.spd = Math.min(MAX_SPD, p.spd + 1);
        else if (id === 'trap') p.kick = true;
        else if (id === 'knijper') p.shield = true;
        ev(['item', i, id]);
      });
      // 8. krimpen
      if (sim.endAt < 0 && sim.shrinkAt > 0 && sim.t >= sim.shrinkAt && sim.shrinkIdx < SPIRAL.length && (sim.t - sim.shrinkAt) % SHRINK_EVERY === 0) {
        let c = SPIRAL[sim.shrinkIdx++];
        while (sim.grid[c] === HARD && sim.shrinkIdx < SPIRAL.length) c = SPIRAL[sim.shrinkIdx++];
        if (sim.grid[c] !== HARD) {
          sim.grid[c] = HARD; sim.items[c] = 0; sim.hidden[c] = 0; sim.reveal[c] = 0; fl[c] = 0;
          removeFartsAt(c);
          ev(['wall', c % W, Math.floor(c / W)]);
          P.forEach((p, i) => { if (p.alive && cellOf(p) === c) kill(i, 1); });
        }
      }
      // 9. stank raakt
      P.forEach((p, i) => {
        if (!p.alive) return;
        const c = cellOf(p);
        if (fl[c] <= 0 || p.inv > 0) return;
        if (p.shield) { p.shield = false; p.inv = INV_STEPS; ev(['shield', i]); return; }
        kill(i, 0, sim.by[c]);
      });
      // 10. einde ronde
      const alive = [];
      P.forEach((p, i) => { if (p.alive) alive.push(i); });
      if (sim.endAt < 0 && alive.length <= 1 && P.length > 1) {
        // wie overblijft terwijl de muren dichtgaan, wint meteen (anders pakt de muur hem ook nog)
        const shrinking = sim.shrinkAt > 0 && sim.t >= sim.shrinkAt && alive.length === 1 && !sim.flame.some(v => v > 0) && !sim.farts.length;
        sim.endAt = sim.t + (shrinking ? 0 : END_WAIT);
      }
      if (sim.endAt >= 0 && sim.t >= sim.endAt) {
        sim.over = true;
        sim.roundWinner = alive.length === 1 ? alive[0] : -1;
        if (sim.roundWinner >= 0) P[sim.roundWinner].score++;
        ev(['round', sim.roundWinner]);
      }
      return sim.events;
    };
    sim.winner = target => { const i = sim.players.findIndex(p => p.score >= target); return i; };

    /* ---------------- momentopname voor het tekenen (ook wat de host verstuurt) ---------------- */
    sim.snap = function () {
      let g = '';
      for (let c = 0; c < N; c++) {
        const f = sim.flame[c];
        if (f > 0) g += String.fromCharCode(48 + Math.max(1, Math.ceil(f * 4 / FLAME)));
        else if (sim.grid[c] === HARD) g += '#';
        else if (sim.grid[c] === SOFT) g += 'x';
        else if (sim.items[c]) g += ITEMS[sim.items[c] - 1].ch;
        else g += '.';
      }
      return {
        g,
        f: sim.farts.map(f => {
          const px = f.x + (f.slide ? f.slide[0] * f.prog : 0), py = f.y + (f.slide ? f.slide[1] * f.prog : 0);
          return [Math.round(px * 100), Math.round(py * 100), Math.max(0, f.fuse), f.owner, f.id];
        }),
        p: sim.players.map(p => [Math.round(p.x * 100), Math.round(p.y * 100), p.face,
          (p.alive ? 1 : 0) | (p.moving ? 2 : 0) | (p.shield ? 4 : 0) | (p.inv > 0 ? 8 : 0) | (p.kick ? 16 : 0),
          p.max, p.range, p.spd]),
        tl: sim.shrinkAt > 0 ? Math.max(0, Math.ceil((sim.shrinkAt - sim.t) / HZ)) : -1
      };
    };

    /* ================================================================ computerspelers */
    // Gevaarkaart: per vakje vanaf wanneer (ds) en tot wanneer (de) er stank staat, met kettingreacties.
    function cover(x, y, range, out) {
      out.push(ix(x, y));
      for (let d = 1; d <= 4; d++) {
        const [dx, dy] = DIRS[d];
        for (let k = 1; k <= range; k++) {
          const nx = x + dx * k, ny = y + dy * k;
          if (!inside(nx, ny)) break;
          const c = ix(nx, ny), g = sim.grid[c];
          if (g === HARD) break;
          out.push(c);
          if (g === SOFT || fartAt(nx, ny)) break;   // power-ups houden stank tegen, maar kunnen opgepakt worden: niet op rekenen
        }
      }
      return out;
    }
    function danger(extra) {
      if (!extra && dangerCache) return dangerCache;
      const ds = new Float32Array(N).fill(Infinity), de = new Float32Array(N).fill(-1);
      const list = sim.farts.map(f => ({ x: f.x, y: f.y, range: f.range, t: Math.max(0, f.fuse) }));
      if (extra) list.push({ x: extra.x, y: extra.y, range: extra.range, t: FUSE });
      const cov = list.map(f => cover(f.x, f.y, f.range, []));
      let changed = true, guard = 0;
      while (changed && guard++ < 20) {
        changed = false;
        for (let a = 0; a < list.length; a++) for (let b = 0; b < list.length; b++) {
          if (a === b || list[a].t >= list[b].t) continue;
          if (cov[a].indexOf(ix(list[b].x, list[b].y)) >= 0) { list[b].t = list[a].t; changed = true; }
        }
      }
      list.forEach((f, a) => cov[a].forEach(c => { if (f.t < ds[c]) ds[c] = f.t; if (f.t + FLAME > de[c]) de[c] = f.t + FLAME; }));
      for (let c = 0; c < N; c++) if (sim.flame[c] > 0) { ds[c] = 0; if (sim.flame[c] > de[c]) de[c] = sim.flame[c]; }
      // krimpen: de vakjes die binnenkort dichtgaan, zijn voorgoed gevaarlijk
      if (sim.shrinkAt > 0 && sim.t > sim.shrinkAt - 60) {
        const base = Math.max(0, sim.shrinkAt - sim.t);
        for (let k = 0, q = sim.shrinkIdx; k < 12 && q < SPIRAL.length; q++) {
          const c = SPIRAL[q];
          if (sim.grid[c] === HARD) continue;
          const at = base + k * SHRINK_EVERY;
          if (at < ds[c]) ds[c] = at;
          de[c] = 1e9; k++;
        }
      }
      const D = { ds, de };
      if (!extra) dangerCache = D;
      return D;
    }
    // Zoeken over de vakjes, met aankomsttijd; vakjes waar stank staat als je er bent, tellen niet.
    function bfs(start, D, spc, me) {
      const dist = new Int16Array(N).fill(-1), prev = new Int16Array(N).fill(-1), order = [start];
      dist[start] = 0;
      for (let q = 0; q < order.length; q++) {
        const c = order[q], x = c % W, y = (c - x) / W;
        for (let d = 1; d <= 4; d++) {
          const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
          if (!inside(nx, ny)) continue;
          const n = ix(nx, ny);
          if (dist[n] >= 0 || sim.grid[n] !== EMPTY) continue;
          const f = fartAt(nx, ny);
          if (f && f.pass.indexOf(me) < 0) continue;
          // je bent in vakje n van ongeveer (ta − ½ spc) tot (ta + ½ spc), met wat marge
          const ta = (dist[c] + 1) * spc;
          if (D.ds[n] <= ta + spc * 0.5 + 4 && D.de[n] >= ta - spc * 0.5 - 4) continue;
          dist[n] = dist[c] + 1; prev[n] = c; order.push(n);
        }
      }
      return { dist, prev, order };
    }
    function pathTo(B, target) {
      const path = [];
      for (let c = target; c >= 0 && B.dist[c] > 0; c = B.prev[c]) path.unshift(c);
      return path;
    }
    // Dichtstbijzijnde veilige vakje; liefst niet waar al iemand anders staat (B.order is op afstand).
    function nearestSafe(B, D, spc, maxT, me) {
      let best = -1;
      for (const c of B.order) {
        if (D.ds[c] !== Infinity) continue;
        if (maxT != null && B.dist[c] * spc > maxT) continue;
        if (me != null && sim.players.some((q, j) => j !== me && q.alive && cellOf(q) === c)) { if (best < 0) best = c; continue; }
        return c;
      }
      return best;
    }
    function enemiesInLine(me, x, y, range) {
      let n = 0;
      const hit = c => { sim.players.forEach((q, j) => { if (j !== me && q.alive && cellOf(q) === c) n++; }); };
      hit(ix(x, y));
      for (let d = 1; d <= 4; d++) {
        const [dx, dy] = DIRS[d];
        for (let k = 1; k <= range; k++) {
          const nx = x + dx * k, ny = y + dy * k;
          if (!inside(nx, ny)) break;
          const c = ix(nx, ny);
          if (sim.grid[c] !== EMPTY) break;
          hit(c);
        }
      }
      return n;
    }
    function softsHit(x, y, range) {
      let n = 0;
      for (let d = 1; d <= 4; d++) {
        const [dx, dy] = DIRS[d];
        for (let k = 1; k <= range; k++) {
          const nx = x + dx * k, ny = y + dy * k;
          if (!inside(nx, ny)) break;
          const g = sim.grid[ix(nx, ny)];
          if (g === HARD) break;
          if (g === SOFT) { n++; break; }
          if (sim.items[ix(nx, ny)]) break;
        }
      }
      return n;
    }
    function canEscape(i, p, c, spc, L) {
      if (L.mistake && rnd() < L.mistake) return true;
      const x = c % W, y = (c - x) / W;
      const D2 = danger({ x, y, range: p.range });
      // de nieuwe scheet ligt onder je voeten; daar mag je vanaf
      const B = bfs(c, D2, spc, i);
      return nearestSafe(B, D2, spc, FUSE - spc) >= 0;
    }
    function placeValue(i, p, c, L) {
      const x = c % W, y = (c - x) / W;
      const s = softsHit(x, y, p.range), e = L.hunt ? enemiesInLine(i, x, y, p.range) : 0;
      let v = s * 12 + e * L.hunt;
      // Kan de tegenstander nog weg als ik hier leg? Zo niet: raak.
      if (e && L.trap) {
        const D2 = danger({ x, y, range: p.range });
        sim.players.forEach((q, j) => {
          if (j === i || !q.alive) return;
          const qc = cellOf(q);
          if (D2.ds[qc] === Infinity) return;
          const qs = 1 / speedOf(q) + 1;
          const B = bfs(qc, D2, qs, j);
          if (nearestSafe(B, D2, qs, FUSE - qs) < 0) v += L.trap;
        });
      }
      return v;
    }
    function think(i, p) {
      const L = LEVELS[p.level] || LEVELS.normal, ai = p.ai;
      const cx = Math.round(p.x), cy = Math.round(p.y), here = ix(cx, cy);
      const spc = 1 / speedOf(p) + 1;
      const D = danger();
      const centered = Math.abs(p.x - cx) < 0.15 && Math.abs(p.y - cy) < 0.15;
      if (ai.ver !== sim.ver) { ai.ver = sim.ver; ai.next = Math.min(ai.next, sim.t + L.react); }
      const inDanger = D.ds[here] !== Infinity;
      if (inDanger && !ai.path.length) ai.next = Math.min(ai.next, sim.t + Math.min(L.react, 4));
      if (sim.t >= ai.next || (!ai.path.length && !inDanger && sim.t >= ai.next - L.every)) {
        ai.next = sim.t + L.every;
        plan(i, p, L, D, here, spc, centered, inDanger);
      }
      follow(i, p, D, spc);
    }
    function plan(i, p, L, D, here, spc, centered, inDanger) {
      const ai = p.ai;
      const B = bfs(here, D, spc, i);
      if (inDanger) {
        // al op de vlucht en de weg is nog vrij: gewoon doorlopen
        if (ai.esc && ai.path.length && ai.path.every(c => sim.grid[c] === EMPTY && !fartAt(c % W, (c - c % W) / W)) && D.ds[ai.path[ai.path.length - 1]] === Infinity) return;
        let t = nearestSafe(B, D, spc, null, i);
        if (t < 0) {      // geen veilige plek: dan maar het vakje waar de stank het laatst komt
          let bestT = -1;
          for (const c of B.order) {
            const v = D.ds[c] - (sim.players.some((q, j) => j !== i && q.alive && cellOf(q) === c) ? SHRINK_EVERY * 2 : 0);
            if (v > bestT) { bestT = v; t = c; }
          }
        }
        ai.path = t >= 0 && t !== here ? pathTo(B, t) : [];
        ai.esc = true;
        return;
      }
      ai.esc = false;
      // Hier een scheet leggen?
      if (centered && p.active < p.max && !fartAt(here % W, (here - here % W) / W)) {
        const v = placeValue(i, p, here, L);
        if (v > 0 && canEscape(i, p, here, spc, L)) { p.fq = 1; ai.path = []; ai.next = sim.t + 2; return; }
      }
      // Beste doel zoeken: power-ups, plekken om blokken op te blazen, tegenstanders
      const cands = [];
      for (const c of B.order) {
        const d = B.dist[c];
        let val = 0, needEsc = false;
        const it = sim.items[c];
        if (it) val += ITEMS[it - 1].value * L.items * (ITEMS[it - 1].id === 'sneaker' && p.spd >= MAX_SPD ? 0.1 : 1);
        if (p.active < p.max) {
          const x = c % W, y = (c - x) / W;
          if (!fartAt(x, y)) { const pv = placeValue(i, p, c, L); if (pv > 0) { val += pv; needEsc = true; } }
        }
        if (val > 0) cands.push({ c, s: val - d * 4, needEsc });
      }
      cands.sort((a, b) => b.s - a.s);
      let tries = 0;
      for (const k of cands) {
        if (k.needEsc && !sim.items[k.c]) { if (tries++ > 4) continue; if (!canEscape(i, p, k.c, spc, Object.assign({}, L, { mistake: 0 }))) continue; }
        ai.path = k.c === here ? [] : pathTo(B, k.c);   // hier zelf: eerst naar het midden, dan leggen
        if (k.c === here) ai.next = sim.t + 2;
        return;
      }
      // Niets te doen: richting een tegenstander (sterk) of wat rondlopen
      if (L.hunt) {
        let best = -1, bd = 1e9;
        sim.players.forEach((q, j) => {
          if (j === i || !q.alive) return;
          const qc = cellOf(q);
          for (const c of B.order) {
            const dd = Math.abs(c % W - qc % W) + Math.abs(Math.floor(c / W) - Math.floor(qc / W));
            if (dd < bd && c !== here) { bd = dd; best = c; }
          }
        });
        if (best >= 0 && bd > 1) { ai.path = pathTo(B, best).slice(0, 3); return; }
      }
      if (L.wander && rnd() < L.wander && B.order.length > 1) {
        const c = B.order[1 + Math.floor(rnd() * Math.min(B.order.length - 1, 6))];
        ai.path = pathTo(B, c).slice(0, 2);
        return;
      }
      ai.path = [];
    }
    function follow(i, p, D, spc) {
      const ai = p.ai;
      const cx = Math.round(p.x), cy = Math.round(p.y);
      while (ai.path.length) {
        const t = ai.path[0], tx = t % W, ty = (t - tx) / W;
        if (tx === cx && ty === cy && Math.abs(p.x - tx) < 0.06 && Math.abs(p.y - ty) < 0.06) { ai.path.shift(); continue; }
        break;
      }
      if (!ai.path.length) {
        // naar het midden van het eigen vakje, zodat leggen en afslaan goed gaan
        const ox = p.x - cx, oy = p.y - cy;
        if (Math.abs(ox) > 0.05) p.d = ox > 0 ? 4 : 2;
        else if (Math.abs(oy) > 0.05) p.d = oy > 0 ? 1 : 3;
        else p.d = 0;
        return;
      }
      const t = ai.path[0], tx = t % W, ty = (t - tx) / W;
      if (tx === cx && ty === cy) {
        const ox = p.x - tx, oy = p.y - ty;
        p.d = Math.abs(ox) >= Math.abs(oy) ? (ox > 0 ? 4 : 2) : (oy > 0 ? 1 : 3);
        return;
      }
      // niet een vakje in lopen waar zo meteen stank staat
      if (D.ds[t] <= spc * 1.2 && D.de[t] >= 0 && D.ds[ix(cx, cy)] === Infinity) { p.d = 0; ai.path = []; ai.next = Math.min(ai.next, sim.t + 1); return; }
      if (Math.abs(tx - cx) + Math.abs(ty - cy) !== 1) { ai.path = []; ai.next = sim.t; p.d = 0; return; }
      p.d = tx > cx ? 2 : tx < cx ? 4 : ty > cy ? 3 : 1;
    }

    sim._ai = { danger, bfs, nearestSafe, canEscape: (i, c) => canEscape(i, sim.players[i], c, 1 / speedOf(sim.players[i]) + 1, { mistake: 0 }) };
    return sim;
  }

  // Momentopname uitpakken (voor het tekenen, op elke telefoon hetzelfde)
  function cellChar(g, c) { return g.charCodeAt(c); }

  root.DAMPOE = { W, H, N, HZ, FUSE, FLAME, ITEMS, IBY, ICH, LEVELS, STARTS, SPIRAL, MAX_SPD, MAX_RANGE, MAX_FARTS, createSim, cellChar };
})(typeof window !== 'undefined' ? window : globalThis);
