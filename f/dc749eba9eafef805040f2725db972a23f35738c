/* Kronkel — de simulatie. Alleen de host rekent dit uit; de andere telefoons tekenen wat de host stuurt.
   Speelveld 600×900 eenheden (staand). Een raster van 1 eenheid per vakje onthoudt wie waar een lijn trok
   en wanneer, zodat botsen precies en goedkoop is. 60 stappen per seconde. */
(function (root) {
  'use strict';
  const W = 600, H = 900;
  const HZ = 60;
  const BASE_SPEED = 1.25;      // eenheden per stap
  const BASE_TURN = 0.052;      // radialen per stap
  const BASE_R = 2.6;           // halve lijndikte
  const FX_STEPS = 330;         // power-up werkt 5,5 seconde
  const PU_R = 17;              // straal van een power-up op het veld
  const MAX_PU = 4;

  const POWERS = [
    { id: 'fast_self', kind: 'self', name: 'Sneller', desc: 'Jij gaat sneller', glyph: 'fast' },
    { id: 'slow_self', kind: 'self', name: 'Trager', desc: 'Jij gaat trager', glyph: 'slow' },
    { id: 'thin_self', kind: 'self', name: 'Dunner', desc: 'Jouw lijn wordt dun', glyph: 'thin' },
    { id: 'square_self', kind: 'self', name: 'Haaks', desc: 'Jij stuurt even in rechte hoeken', glyph: 'square' },
    { id: 'ghost_self', kind: 'self', name: 'Spook', desc: 'Geen spoor, en je gaat door lijnen heen', glyph: 'ghost' },
    { id: 'wrap_self', kind: 'self', name: 'Door de rand', desc: 'Jij gaat door de rand heen', glyph: 'wrap' },
    { id: 'fast_others', kind: 'others', name: 'Sneller', desc: 'De anderen gaan sneller', glyph: 'fast' },
    { id: 'slow_others', kind: 'others', name: 'Trager', desc: 'De anderen gaan trager', glyph: 'slow' },
    { id: 'thick_others', kind: 'others', name: 'Dikker', desc: 'De lijn van de anderen wordt dik', glyph: 'thick' },
    { id: 'square_others', kind: 'others', name: 'Haaks', desc: 'De anderen sturen in rechte hoeken', glyph: 'square' },
    { id: 'reverse_others', kind: 'others', name: 'Omgekeerd', desc: 'Links en rechts omgedraaid bij de anderen', glyph: 'reverse' },
    { id: 'walls_all', kind: 'all', name: 'Open rand', desc: 'Iedereen gaat even door de rand', glyph: 'walls' },
    { id: 'clear_all', kind: 'all', name: 'Wissen', desc: 'Alle lijnen verdwijnen', glyph: 'clear' }
  ];
  const PBY = Object.fromEntries(POWERS.map(p => [p.id, p]));

  const LEVELS = {
    easy: { look: 30, every: 6, noise: 0.2, lens: [30], pres: [] },
    normal: { look: 60, every: 3, noise: 0.03, lens: [12, 35], pres: [] },
    strong: { look: 100, every: 2, noise: 0, lens: [6, 15, 30, 55], pres: [12, 30], heads: true }
  };

  function createSim(cfg) {
    const rnd = cfg.random || Math.random;
    const R = (a, b) => a + rnd() * (b - a);
    const owner = new Uint8Array(W * H);   // 0 = leeg, anders speler + 1
    const stamp = new Int32Array(W * H);   // stap waarin het vakje gekleurd werd
    const powers = (cfg.powers || []).filter(id => PBY[id]);
    const wrapMode = cfg.walls === 'wrap';

    const sim = {
      W, H, HZ, t: 0, over: true, round: 0,
      players: cfg.players.map(p => ({ kind: p.kind || 'human', level: p.level || 'normal', score: 0 })),
      pus: [], wallsUntil: 0, nextPu: 0, puSeq: 0,
      owner, stamp
    };

    /* ---------- afgeleide eigenschappen ---------- */
    function attrs(p) {
      let sp = 1, rm = 1, square = false, ghost = false, wrap = false, rev = false;
      for (const f of p.fx) {
        if (f.t === 'fast_self' || f.t === 'fast_others') sp *= 1.55;
        else if (f.t === 'slow_self' || f.t === 'slow_others') sp *= 0.62;
        else if (f.t === 'thin_self') rm *= 0.5;
        else if (f.t === 'thick_others') rm *= 2.1;
        else if (f.t === 'square_self' || f.t === 'square_others') square = true;
        else if (f.t === 'ghost_self') ghost = true;
        else if (f.t === 'wrap_self') wrap = true;
        else if (f.t === 'reverse_others') rev = true;
      }
      sp = Math.min(2.6, Math.max(0.4, sp));
      const r = Math.min(14, Math.max(1.15, BASE_R * rm));
      return {
        v: BASE_SPEED * sp, turn: BASE_TURN * Math.sqrt(sp), r, square, ghost, rev,
        wrap: wrapMode || wrap || sim.t < sim.wallsUntil
      };
    }
    sim.attrs = attrs;
    const grace = (r, v) => Math.ceil((2 * r + 4) / v) + 2;

    /* ---------- raster ---------- */
    function paint(pi, x, y, r, wrap) {
      const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r), rr = r * r;
      for (let iy = y0; iy <= y1; iy++) {
        let gy = iy;
        if (gy < 0 || gy >= H) { if (!wrap) continue; gy = (gy + H) % H; }
        const dy = iy + 0.5 - y;
        for (let ix = x0; ix <= x1; ix++) {
          const dx = ix + 0.5 - x;
          if (dx * dx + dy * dy > rr) continue;
          let gx = ix;
          if (gx < 0 || gx >= W) { if (!wrap) continue; gx = (gx + W) % W; }
          const i = gy * W + gx;
          owner[i] = pi + 1; stamp[i] = sim.t;
        }
      }
    }
    // is dit punt bezet voor speler pi? (eigen verse lijn telt niet)
    function blocked(pi, x, y, g) {
      let ix = Math.floor(x), iy = Math.floor(y);
      if (ix < 0 || ix >= W) ix = (ix % W + W) % W;
      if (iy < 0 || iy >= H) iy = (iy % H + H) % H;
      const i = iy * W + ix, o = owner[i];
      if (!o) return false;
      if (o - 1 !== pi) return true;
      return stamp[i] < sim.t - g;
    }
    const PROBES = [-1.1, -0.55, 0, 0.55, 1.1];
    function hits(pi, x, y, a, r, g) {
      const d = r + 0.6;
      for (const o of PROBES) if (blocked(pi, x + Math.cos(a + o) * d, y + Math.sin(a + o) * d, g)) return true;
      return false;
    }

    /* ---------- ronde ---------- */
    sim.newRound = function () {
      owner.fill(0); stamp.fill(0);
      sim.t = 0; sim.over = false; sim.round++; sim.pus = []; sim.wallsUntil = 0; sim.lastDeaths = [];
      sim.nextPu = Math.round(R(150, 330));
      const placed = [];
      sim.players.forEach((p, i) => {
        let x, y, tries = 0;
        do { x = R(90, W - 90); y = R(130, H - 130); tries++; }
        while (tries < 200 && placed.some(q => (q.x - x) ** 2 + (q.y - y) ** 2 < 120 * 120));
        placed.push({ x, y });
        const toC = Math.atan2(H / 2 - y, W / 2 - x);
        Object.assign(p, {
          x, y, a: toC + R(-1.1, 1.1), alive: true, fx: [], inp: 0, tap: 0, want: 0,
          dist: 0, nextGap: R(110, 300), gapLeft: 0, painted: false, wrapped: false, r: BASE_R, ghost: false
        });
      });
      return sim.players.map(p => [p.x, p.y, p.a]);
    };

    // invoer van een mens: -1 links, 0 rechtdoor, 1 rechts
    sim.setInput = function (i, d) {
      const p = sim.players[i]; if (!p) return;
      d = d < 0 ? -1 : d > 0 ? 1 : 0;
      if (d !== 0 && d !== p.inp) p.tap = d;   // voor haakse bochten: elke nieuwe druk is één hoek
      p.inp = d;
    };

    /* ---------- computer ---------- */
    // hoe lang overleeft een plan? plan = eerst pre stappen rechtdoor, dan len stappen draaien (dir), dan rechtdoor.
    // bij haakse bochten: meteen een hoek van 90° (dir) en daarna rechtdoor
    function survive(pi, p, at, pl, look, others) {
      let x = p.x, y = p.y, a = p.a;
      const g = grace(at.r, at.v);
      if (at.square) a += pl.dir * Math.PI / 2;
      for (let s = 1; s <= look; s++) {
        if (!at.square && s > pl.pre && s <= pl.pre + pl.len) a += pl.dir * at.turn;
        x += Math.cos(a) * at.v; y += Math.sin(a) * at.v;
        if (at.wrap) { x = (x + W) % W; y = (y + H) % H; }
        else if (x < at.r + 1 || x > W - at.r - 1 || y < at.r + 1 || y > H - at.r - 1) return s;
        if (at.ghost) continue;
        if (others) {
          // andere koppen rijden waarschijnlijk rechtdoor: hun komende lijn telt als muur
          for (const q of others) {
            const len = q.v * s, rx = x - q.x, ry = y - q.y;
            const u = Math.max(0, Math.min(len, rx * q.cx + ry * q.cy));
            const ex = rx - q.cx * u, ey = ry - q.cy * u;
            if (ex * ex + ey * ey < (q.r + at.r + 4) ** 2) return s - 0.5;
          }
        }
        const d = at.r + 1.5;
        if (blocked(pi, x + Math.cos(a) * d, y + Math.sin(a) * d, g + s) ||
            blocked(pi, x + Math.cos(a + 0.7) * d, y + Math.sin(a + 0.7) * d, g + s) ||
            blocked(pi, x + Math.cos(a - 0.7) * d, y + Math.sin(a - 0.7) * d, g + s)) return s;
      }
      // vrije ruimte erachter als tiebreak
      let free = 0;
      for (let k = 1; k <= 30; k++) {
        const fx = x + Math.cos(a) * k * 3, fy = y + Math.sin(a) * k * 3;
        if (!at.wrap && (fx < 2 || fx > W - 2 || fy < 2 || fy > H - 2)) break;
        if (blocked(pi, fx, fy, g + look)) break;
        free++;
      }
      return look + free / 30;
    }
    const planCache = {};
    function plansFor(level, square) {
      const key = level + square;
      if (planCache[key]) return planCache[key];
      const L = LEVELS[level] || LEVELS.normal, out = [];
      if (square) [0, -1, 1].forEach(dir => out.push({ pre: 0, dir, len: 0 }));
      else {
        out.push({ pre: 0, dir: 0, len: 0 });
        for (const dir of [-1, 1]) {
          for (const len of L.lens) out.push({ pre: 0, dir, len });
          for (const pre of L.pres) for (const len of L.lens) out.push({ pre, dir, len });
        }
      }
      return (planCache[key] = out);
    }
    function think(pi, p, at) {
      const L = LEVELS[p.level] || LEVELS.normal;
      if (sim.t % L.every !== pi % L.every) return;
      if (L.noise && rnd() < L.noise) { p.want = [-1, 0, 1][Math.floor(rnd() * 3)]; return; }
      let others = null;
      if (L.heads) {
        others = [];
        sim.players.forEach((q, j) => {
          if (j === pi || !q.alive || q.ghost) return;
          if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 > 250 * 250) return;
          const qa = attrs(q);
          others.push({ x: q.x, y: q.y, cx: Math.cos(q.a), cy: Math.sin(q.a), v: qa.v, r: qa.r });
        });
        if (!others.length) others = null;
      }
      let best = null, bs = -1;
      for (const pl of plansFor(p.level, at.square)) {
        let sc = survive(pi, p, at, pl, L.look, others);
        const first = pl.pre > 0 ? 0 : pl.dir;
        if (first === p.want) sc += 0.05;   // niet zenuwachtig wisselen
        if (first === 0) sc += 0.02;
        if (sc > bs) { bs = sc; best = pl; }
      }
      const want = best.pre > 0 ? 0 : best.dir;
      if (at.square) { if (want !== 0) p.tap = want; p.want = 0; }
      else p.want = want;
    }

    /* ---------- één stap ---------- */
    sim.step = function () {
      const ev = [];
      if (sim.over) return ev;
      sim.t++;
      const t = sim.t, dying = [];

      // power-ups verschijnen
      if (powers.length && t >= sim.nextPu) {
        sim.nextPu = t + Math.round(R(170, 400));
        if (sim.pus.length < MAX_PU) {
          let x, y, k = 0;
          do { x = R(40, W - 40); y = R(40, H - 40); k++; }
          while (k < 40 && sim.players.some(p => p.alive && (p.x - x) ** 2 + (p.y - y) ** 2 < 80 * 80));
          const pu = { id: ++sim.puSeq, type: powers[Math.floor(rnd() * powers.length)], x: Math.round(x), y: Math.round(y) };
          sim.pus.push(pu);
          ev.push({ k: 'spawn', id: pu.id, type: pu.type, x: pu.x, y: pu.y });
        }
      }

      sim.players.forEach((p, i) => {
        p.painted = false; p.wrapped = false;
        if (!p.alive) return;
        const before = p.fx.length;
        p.fx = p.fx.filter(f => f.end > t);
        if (p.fx.length !== before) ev.push({ k: 'fx', p: i, l: p.fx.map(f => [f.t, f.end]) });
        const at = attrs(p);
        p.r = at.r; p.ghost = at.ghost;

        // sturen
        const cpu = p.kind === 'cpu';
        if (cpu) think(i, p, at);
        const flip = at.rev && !(cpu && p.level !== 'easy') ? -1 : 1;
        if (at.square) {
          if (p.tap) { p.a += flip * p.tap * Math.PI / 2; }
        } else {
          p.a += flip * (cpu ? p.want : p.inp) * at.turn;
        }
        p.tap = 0;

        // bewegen in kleine stukjes zodat dunne lijnen niet worden overgeslagen
        const n = Math.ceil(at.v / 0.9), dv = at.v / n, g = grace(at.r, at.v);
        for (let k = 0; k < n; k++) {
          p.x += Math.cos(p.a) * dv; p.y += Math.sin(p.a) * dv;
          if (at.wrap) {
            if (p.x < 0) { p.x += W; p.wrapped = true; } else if (p.x >= W) { p.x -= W; p.wrapped = true; }
            if (p.y < 0) { p.y += H; p.wrapped = true; } else if (p.y >= H) { p.y -= H; p.wrapped = true; }
          } else if (p.x < at.r || p.x > W - at.r || p.y < at.r || p.y > H - at.r) {
            p.x = Math.min(W - at.r, Math.max(at.r, p.x)); p.y = Math.min(H - at.r, Math.max(at.r, p.y));
            dying.push(i); return;
          }
          if (!at.ghost && hits(i, p.x, p.y, p.a, at.r, g)) { dying.push(i); return; }
          p.dist += dv;
          if (p.gapLeft > 0) p.gapLeft -= dv;
          else if (p.dist >= p.nextGap) { p.gapLeft = 12 + 2.4 * at.r; p.nextGap = p.dist + p.gapLeft + R(110, 300); }
          if (!at.ghost && p.gapLeft <= 0) { paint(i, p.x, p.y, at.r, at.wrap); p.painted = true; }
        }

        // power-up pakken
        for (let j = sim.pus.length - 1; j >= 0; j--) {
          const pu = sim.pus[j];
          let dx = Math.abs(pu.x - p.x), dy = Math.abs(pu.y - p.y);
          if (dx * dx + dy * dy > (PU_R + at.r) ** 2) continue;
          sim.pus.splice(j, 1);
          ev.push({ k: 'take', id: pu.id, p: i, type: pu.type });
          applyPower(i, pu.type, ev);
        }
      });

      if (dying.length) {
        dying.forEach(i => { sim.players[i].alive = false; });
        const alive = sim.players.map((p, i) => p.alive ? i : -1).filter(i => i >= 0);
        dying.forEach(i => {
          alive.forEach(j => { sim.players[j].score++; });
          ev.push({ k: 'die', p: i, x: Math.round(sim.players[i].x), y: Math.round(sim.players[i].y) });
        });
        if (alive.length <= 1) {
          sim.over = true;
          ev.push({ k: 'round', winner: alive.length ? alive[0] : -1 });
        }
      }
      return ev;
    };

    function applyPower(i, type, ev) {
      const pw = PBY[type]; if (!pw) return;
      const end = sim.t + FX_STEPS;
      if (type === 'clear_all') { owner.fill(0); ev.push({ k: 'clear' }); return; }
      if (type === 'walls_all') { sim.wallsUntil = end; ev.push({ k: 'walls', end }); return; }
      const targets = pw.kind === 'self' ? [i] : sim.players.map((p, j) => (j !== i && p.alive ? j : -1)).filter(j => j >= 0);
      targets.forEach(j => {
        const p = sim.players[j];
        p.fx.push({ t: type, end });
        ev.push({ k: 'fx', p: j, l: p.fx.map(f => [f.t, f.end]) });
      });
    }

    // klassieke telling: doel 10 × (spelers − 1), winnen met minstens 2 punten verschil
    sim.target = () => 10 * (sim.players.length - 1);
    sim.winner = function () {
      const s = sim.players.map((p, i) => ({ i, s: p.score })).sort((a, b) => b.s - a.s);
      if (s.length < 2) return -1;
      if (s[0].s >= sim.target() && s[0].s - s[1].s >= 2) return s[0].i;
      return -1;
    };
    return sim;
  }

  root.KRONKEL = { W, H, HZ, POWERS, PBY, LEVELS, FX_STEPS, PU_R, createSim };
})(typeof window !== 'undefined' ? window : globalThis);
