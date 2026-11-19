/* High Pressure — de spelregels. Eigen spel in de geest van de oude bellen-kapotschieten-spellen,
   maar dan in rasta-stijl: dikke rookwolken stuiteren door het beeld, jij schiet er een groeiende
   wietplant op af. Een geraakte wolk splitst in twee kleinere; de kleinste verdwijnt.

   Veld 400 × 300 (y naar beneden, vloer op y = 300). 60 stappen per seconde.
   Alleen de host (of de telefoon bij alleen spelen) rekent dit uit; de andere telefoon krijgt
   20× per seconde een momentopname (snap) en tekent die. Samen spelen = samen in hetzelfde level. */
(function (root) {
  'use strict';
  const W = 400, H = 300, HZ = 60;
  const GRAV = 0.11;                         // zwaartekracht per stap²
  const RADIUS = [0, 6, 10, 15, 21, 28, 37];  // straal per maat (1 = kleinste, 6 = reus)
  const APEX = [0, 62, 96, 130, 162, 190, 212]; // hoe hoog de onderkant na een stuit komt
  const POP_PTS = [0, 100, 70, 50, 35, 25, 15];
  const BALL_VX = 1.15;
  const HOP = 3.0;                           // kleine sprong omhoog na splitsen
  const PW = 18, PH = 30;                    // speler: breedte en hoogte (raakvlak)
  const P_SPEED = 2.35;
  const PLANT_SPEED = 6.5, PLANT_START = 24, PLANT_HALF = 2.5;
  const STICK_STEPS = 4 * HZ;
  const CHILL_STEPS = 4 * HZ;
  const GRACE_STEPS = 50;                    // even onkwetsbaar bij de start van een level
  const SHIELD_INV = 90;
  const ITEM_LIFE = 7 * HZ, ITEM_FALL = 1.6;
  const DROP_CHANCE = 0.13;
  const CEIL_BONUS = 50;                    // per maat, als een wolk het plafond raakt
  const START_LIVES = 5, MAX_LIVES = 9;
  const WALL_HALF = 4;
  const LEVELS_N = 100;

  const ITEMS = [
    { id: 'dubbel', name: 'Dubbele plant', desc: 'Twee planten tegelijk afschieten, dit level', w: 3 },
    { id: 'plak', name: 'Plakplant', desc: 'Je plant blijft 4 s aan het plafond hangen, dit level; nog eens schieten laat los', w: 3 },
    { id: 'chill', name: 'Chill-klok', desc: 'Alle wolken staan 4 seconden stil', w: 3 },
    { id: 'schild', name: 'Schild', desc: 'Eén keer geraakt worden zonder leven kwijt; gaat mee naar het volgende level', w: 3 },
    { id: 'leven', name: 'Extra leven', desc: 'Eén leven erbij voor jullie samen', w: 1 }
  ];
  const IBY = Object.fromEntries(ITEMS.map((it, i) => [it.id, i]));
  const ITEM_WSUM = ITEMS.reduce((a, it) => a + it.w, 0);

  const WORLDS = [
    { id: 'strand', name: 'Strand & palmen', grav: 1, speed: 1 },
    { id: 'jungle', name: 'Jungle & bergen', grav: 1, speed: 1.05 },
    { id: 'stad', name: 'Reggae-stad', grav: 1, speed: 1.08 },
    { id: 'ruimte', name: 'Ruimte', grav: 0.6, speed: 0.92 }
  ];
  const worldOf = n => Math.min(3, Math.floor((n - 1) / 25));

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ================================================================ levels
     Elk level: wolken (x, y, maat, richting), plankjes (waar wolken op stuiten en je plant tegen
     stopt) en tussenmuren (die zakken weg zodra een kant leeg is). Per wereld 25 levels; de
     recepten zijn per wereld gelijk van opbouw maar steeds zwaarder, en elke wereld heeft z'n eigen
     trucje: strand open, jungle plankjes, stad tussenmuren, ruimte lage zwaartekracht. */
  const b = (x, s, dir, y) => ({ x: x * W, y: (y == null ? 0.22 : y) * H, s, dir: dir || 1 });
  const p = (x, y, w) => ({ x0: (x - w / 2) * W, x1: (x + w / 2) * W, y0: y * H, y1: y * H + 10 });
  const wl = x => ({ x: x * W });
  const rain = (n, s, y) => Array.from({ length: n }, (_, i) => b((i + 0.5) / n, s, i % 2 ? 1 : -1, y == null ? 0.12 + (i % 3) * 0.07 : y));

  // Recepten: k = moeilijkheid binnen de wereld (0..24), w = wereld, up = maat-ophoging.
  const RECIPES = [
    (w, u) => ({ balls: [b(0.3, 2 + u)] }),
    (w, u) => ({ balls: [b(0.7, 3 + u, -1)] }),
    (w, u) => ({ balls: [b(0.2, 2 + u), b(0.8, 2 + u, -1)] }),
    (w, u) => ({ balls: [b(0.25, 4 + u)] }),
    (w, u) => ({ balls: rain(5 + u * 2, 1) }),
    (w, u) => ({ balls: [b(0.15, 3 + u), b(0.85, 3, -1)], plats: w === 1 ? [p(0.5, 0.42, 0.3)] : [] }),
    (w, u) => ({ balls: [b(0.5, 3 + u, 1, 0.12)], plats: [p(0.25, 0.5, 0.22), p(0.75, 0.5, 0.22)] }),
    (w, u) => ({ balls: [b(0.15, 2 + u), b(0.5, 2 + u, -1), b(0.85, 2 + u)] }),
    (w, u) => ({ balls: [b(0.3, 4 + u), b(0.75, 2, -1)], walls: w >= 2 ? [wl(0.55)] : [] }),
    (w, u) => ({ balls: [b(0.4, 5 + Math.min(u, 1))] }),
    (w, u) => ({ balls: rain(8 + u * 2, 1, 0.1).concat([b(0.5, 2 + u, 1, 0.3)]) }),
    (w, u) => ({ balls: [b(0.2, 3 + u), b(0.8, 3 + u, -1)], plats: [p(0.2, 0.45, 0.16), p(0.8, 0.45, 0.16)] }),
    (w, u) => ({ balls: [b(0.5, 4 + u, -1, 0.1)], plats: [p(0.5, 0.38, 0.4)] }),
    (w, u) => ({ balls: [b(0.12, 2 + u), b(0.37, 2 + u, -1, 0.3), b(0.63, 2 + u, 1, 0.15), b(0.88, 2 + u, -1, 0.35)] }),
    (w, u) => ({ balls: [b(0.17, 3 + Math.min(u, 1)), b(0.5, 3 + Math.min(u, 1), -1), b(0.83, 3 + Math.min(u, 1))], walls: w >= 2 ? [wl(0.34), wl(0.67)] : [] }),
    (w, u) => ({ balls: [b(0.25, 4 + u), b(0.75, 4, -1)] }),
    (w, u) => ({ balls: [b(0.15, 2 + u, 1, 0.08), b(0.45, 2 + u, 1, 0.08), b(0.75, 2 + u, -1, 0.08)], plats: [p(0.2, 0.62, 0.14), p(0.45, 0.48, 0.14), p(0.7, 0.34, 0.14)] }),
    (w, u) => ({ balls: [b(0.5, 5 + Math.min(u, 1)), b(0.1, 1), b(0.9, 1, -1)] }),
    (w, u) => ({ balls: rain(6, 2 + Math.min(u, 1), 0.15), walls: w >= 2 ? [wl(0.5)] : [] }),
    (w, u) => ({ balls: [b(0.25, 4 + u), b(0.75, 4 + u, -1)], plats: [p(0.5, 0.45, 0.26)] }),
    (w, u) => { const s = 3 + Math.min(u, 1); return { balls: [b(0.12, s), b(0.38, s, -1), b(0.62, s), b(0.88, s, -1)] }; },
    (w, u) => ({ balls: rain(12 + u * 2, 1, 0.08).concat([b(0.3, 3), b(0.7, 3, -1)]) }),
    (w, u) => ({ balls: [b(0.3, 5 + Math.min(u, 1)), b(0.75, 3 + u, -1)], plats: w === 1 || w === 3 ? [p(0.75, 0.5, 0.2)] : [], walls: w >= 2 ? [wl(0.6)] : [] }),
    (w, u) => ({ balls: [b(0.2, 4 + u), b(0.5, 3 + u, -1, 0.1), b(0.8, 4 + u, -1)], walls: w === 2 ? [wl(0.35), wl(0.65)] : [] }),
    // eindbaas van de wereld
    (w, u) => w === 0 ? { balls: [b(0.3, 5), b(0.7, 4, -1)], boss: true }
      : w === 1 ? { balls: [b(0.25, 5), b(0.75, 5, -1)], plats: [p(0.5, 0.36, 0.2)], boss: true }
      : w === 2 ? { balls: [b(0.5, 6, 1, 0.08), b(0.12, 3), b(0.88, 3, -1)], walls: [wl(0.3), wl(0.7)], boss: true }
      : { balls: [b(0.28, 6, 1, 0.12), b(0.72, 6, -1, 0.12)], boss: true }
  ];
  // Hoeveel maten erbij per wereld, en vanaf welk punt in de wereld (zodat het geleidelijk zwaarder wordt).
  function upOf(w, k) { return w === 0 ? (k >= 15 ? 1 : 0) : w === 1 ? (k >= 10 ? 1 : 0) + (k >= 20 ? 0 : 0) : w === 2 ? 1 : (k >= 8 ? 2 : 1); }
  // Extra plankjes in de jungle en ruimte, zodat elke wereld anders voelt.
  const JUNGLE_PLATS = [[], [p(0.5, 0.4, 0.18)], [p(0.3, 0.42, 0.14), p(0.7, 0.42, 0.14)], [p(0.5, 0.3, 0.12)]];

  const levelCache = new Map();
  function levelDef(n) {
    n = Math.max(1, Math.min(LEVELS_N, n | 0));
    if (levelCache.has(n)) return levelCache.get(n);
    const w = worldOf(n), k = (n - 1) % 25;
    const r = RECIPES[k](w, upOf(w, k));
    // Reuzen (maat 6) alleen bij een eindbaas.
    const balls = r.balls.map(q => Object.assign({}, q, { s: Math.max(1, Math.min(r.boss ? 6 : 5, q.s)) }));
    let plats = (r.plats || []).slice();
    if (w === 1 && !plats.length && k % 3 !== 0) plats = JUNGLE_PLATS[k % 4].slice();
    if (w === 3 && !plats.length && k % 4 === 2) plats = [p(0.5, 0.5, 0.2)];
    const walls = (r.walls || []).slice();
    // Plankjes mogen niet in de weg zitten van een tussenmuur.
    plats = plats.filter(pl => !walls.some(wa => wa.x > pl.x0 - 14 && wa.x < pl.x1 + 14));
    // Wolken niet in een plankje laten beginnen.
    balls.forEach(q => {
      const r0 = RADIUS[q.s];
      q.x = Math.max(r0 + 2, Math.min(W - r0 - 2, q.x));
      q.y = Math.max(r0 + 2, q.y);
      for (const pl of plats) if (q.x + r0 > pl.x0 && q.x - r0 < pl.x1 && q.y + r0 > pl.y0 - 2 && q.y - r0 < pl.y1 + 2) q.y = Math.max(r0 + 2, pl.y0 - r0 - 4);
      for (const wa of walls) if (Math.abs(q.x - wa.x) < r0 + WALL_HALF + 2) q.x = wa.x + (q.x < wa.x ? -1 : 1) * (r0 + WALL_HALF + 3);
    });
    const pops = balls.reduce((a, q) => a + (2 ** q.s - 1), 0);
    const time = Math.round(Math.min(240, Math.max(30, 18 + pops * 1.9 + plats.length * 6 + walls.length * 8) * (w === 3 ? 1.12 : 1)) / 5) * 5;
    const def = { n, world: w, k, balls, plats, walls, time, boss: !!r.boss, pops };
    levelCache.set(n, def);
    return def;
  }

  /* ================================================================ simulatie */
  function createSim(cfg) {
    cfg = cfg || {};
    const rnd = cfg.random || (cfg.seed != null ? mulberry(cfg.seed) : Math.random);
    const np = Math.max(1, Math.min(2, cfg.players || 1));
    const sim = {
      W, H, t: 0, level: 0, phase: 'idle', lives: cfg.lives || START_LIVES, score: cfg.score || 0, god: !!cfg.god,
      balls: [], plants: [], items: [], plats: [], walls: [], freeze: 0, tl: 0, timeMax: 0, world: 0, grav: GRAV, vx: BALL_VX,
      events: [], pops: [0, 0], players: []
    };
    for (let i = 0; i < np; i++) sim.players.push(newPlayer(i));
    let id = 1;
    const ev = e => sim.events.push(e);

    function newPlayer(i) {
      return { i, x: 0, face: 1, d: 0, fq: 0, active: true, cpu: false, moving: false, dbl: false, plak: false, shield: false, inv: 0, grace: 0, hit: false };
    }
    function spawnX(i) {
      const n = sim.players.filter(q => q.active).length;
      if (n <= 1) return W * 0.5;
      return W * (i === 0 ? 0.4 : 0.6);
    }

    sim.startLevel = function (n) {
      const L = levelDef(n || sim.level || 1);
      const Wd = WORLDS[L.world];
      sim.level = L.n; sim.world = L.world; sim.grav = GRAV * Wd.grav; sim.vx = BALL_VX * Wd.speed;
      sim.t = 0; sim.phase = 'play'; sim.freeze = 0; sim.events = [];
      sim.tl = L.time * HZ; sim.timeMax = sim.tl;
      sim.balls = L.balls.map(q => ({ id: id++, x: q.x, y: q.y, vx: sim.vx * (q.dir < 0 ? -1 : 1), vy: 0, s: q.s }));
      sim.plats = L.plats.map(pl => Object.assign({}, pl));
      sim.walls = L.walls.map(wa => ({ x: wa.x, open: 0 }));
      sim.plants = []; sim.items = [];
      sim.players.forEach((pl, i) => {
        // dubbele plant en plakplant gelden maar één level; het schild blijft tot het een klap opvangt
        Object.assign(pl, { x: spawnX(i), face: i === 0 ? 1 : -1, d: 0, fq: 0, moving: false, inv: 0, grace: GRACE_STEPS, hit: false, dbl: false, plak: false });
        // tussenmuren: zet de speler in een vak, niet in de muur
        for (const wa of sim.walls) if (Math.abs(pl.x - wa.x) < PW / 2 + WALL_HALF + 2) pl.x = wa.x + (i === 0 ? -1 : 1) * (PW / 2 + WALL_HALF + 4);
      });
      return sim;
    };
    sim.restartLevel = () => sim.startLevel(sim.level);
    sim.setInput = (i, d) => { const q = sim.players[i]; if (q) q.d = d > 0 ? 1 : d < 0 ? -1 : 0; };
    sim.fire = i => { const q = sim.players[i]; if (q && q.active) q.fq = 1; };
    sim.setActive = (i, on) => {
      const q = sim.players[i]; if (!q) return;
      q.active = !!on; q.d = 0; q.fq = 0;
      if (!on) sim.plants = sim.plants.filter(pt => pt.o !== i);
      else { q.x = spawnX(i); q.grace = GRACE_STEPS * 2; }
    };
    sim.setCpu = (i, on) => { const q = sim.players[i]; if (q) { q.cpu = !!on; q.d = 0; q.fq = 0; } };

    /* ---------------- hulpjes ---------------- */
    function wallBlocks(wa) { return wa.open < 1; }
    function wallTop(wa) { return wa.open * H; }   // muur zakt omhoog weg: onderkant stijgt
    // Grenzen van het vak waar x in staat (alleen dichte muren tellen).
    function roomOf(x) {
      let lo = 0, hi = W;
      for (const wa of sim.walls) if (wallBlocks(wa)) { if (wa.x <= x && wa.x > lo) lo = wa.x; if (wa.x > x && wa.x < hi) hi = wa.x; }
      return [lo, hi];
    }
    // Hoe hoog een plant boven x kan groeien: tot het plafond of de onderkant van een plankje.
    function plantLimit(x) {
      let lim = 0;
      for (const pl of sim.plats) if (x >= pl.x0 - PLANT_HALF && x <= pl.x1 + PLANT_HALF && pl.y1 > lim) lim = pl.y1;
      return lim;
    }
    function bounceV(s) { return Math.sqrt(2 * sim.grav * APEX[s]); }

    /* ---------------- stap ---------------- */
    sim.step = function () {
      sim.events = [];
      if (sim.phase !== 'play') return sim.events;
      sim.t++;
      if (!sim.god && sim.tl > 0) sim.tl--;
      players();
      plants();
      if (sim.freeze > 0) sim.freeze--; else balls();
      hitPlants();
      items();
      walls();
      hitPlayers();
      if (sim.phase === 'play' && sim.balls.length === 0) {
        sim.phase = 'clear';
        const secs = Math.ceil(sim.tl / HZ), bonus = secs * 10;
        sim.score += bonus;
        ev(['clear', bonus, secs]);
      } else if (sim.phase === 'play' && sim.tl <= 0 && !sim.god) {
        loseLife(-1, 'time');
      }
      return sim.events;
    };

    function players() {
      sim.players.forEach((q, i) => {
        if (!q.active) return;
        if (q.cpu) botThink(i);
        if (q.inv > 0) q.inv--;
        if (q.grace > 0) q.grace--;
        q.moving = false;
        if (q.d) {
          q.face = q.d;
          const [lo, hi] = roomOf(q.x);
          const minX = (lo === 0 ? 0 : lo + WALL_HALF) + PW / 2, maxX = (hi === W ? W : hi - WALL_HALF) - PW / 2;
          const nx = Math.max(minX, Math.min(maxX, q.x + q.d * P_SPEED));
          if (nx !== q.x) q.moving = true;
          q.x = nx;
        }
        if (q.fq) {
          q.fq = 0;
          let mine = sim.plants.filter(pt => pt.o === i).length;
          if (mine >= (q.dbl ? 2 : 1)) {
            // nog een keer schieten: de oudste plakkende plant laat los, en er gaat meteen een nieuwe omhoog
            const held = sim.plants.find(pt => pt.o === i && pt.held);
            if (held) { held.gone = true; sim.plants = sim.plants.filter(pt => !pt.gone); mine--; ev(['loose', i]); }
          }
          if (mine < (q.dbl ? 2 : 1)) {
            const lim = plantLimit(q.x);
            sim.plants.push({ id: id++, o: i, x: q.x, top: H - PLANT_START, lim, stuck: 0, plak: q.plak });
            ev(['shoot', i]);
          }
        }
      });
    }

    function plants() {
      for (const pt of sim.plants) {
        if (pt.held) { if (--pt.stuck <= 0) pt.gone = true; continue; }
        pt.top -= PLANT_SPEED;
        if (pt.top <= pt.lim) {
          pt.top = pt.lim;
          if (pt.plak) { pt.held = true; pt.stuck = STICK_STEPS; ev(['stick', pt.o]); }
          else pt.gone = true;
        }
      }
      sim.plants = sim.plants.filter(pt => !pt.gone);
    }

    function balls() {
      const g = sim.grav;
      for (const q of sim.balls) {
        const r = RADIUS[q.s];
        q.vy += g;
        q.x += q.vx; q.y += q.vy;
        // vloer
        if (q.y + r >= H) { q.y = H - r; q.vy = -bounceV(q.s); }
        // plafond
        if (q.y - r <= 0) { q.y = r; q.ceil = true; continue; }
        // zijkanten
        if (q.x - r < 0) { q.x = r; q.vx = Math.abs(q.vx); }
        if (q.x + r > W) { q.x = W - r; q.vx = -Math.abs(q.vx); }
        // tussenmuren
        for (const wa of sim.walls) {
          if (!wallBlocks(wa)) continue;
          const top = wallTop(wa);
          if (q.y + r < top) continue;
          if (Math.abs(q.x - wa.x) < r + WALL_HALF) {
            if (q.x < wa.x) { q.x = wa.x - WALL_HALF - r; q.vx = -Math.abs(q.vx); }
            else { q.x = wa.x + WALL_HALF + r; q.vx = Math.abs(q.vx); }
          }
        }
        // plankjes
        for (const pl of sim.plats) collideRect(q, r, pl);
      }
      if (sim.balls.some(q => q.ceil)) {
        for (const q of sim.balls) if (q.ceil) {
          const pts = ceilPts(q.s);
          sim.score += pts;
          ev(['ceil', q.s, Math.round(q.x), Math.round(q.y), pts]);
        }
        sim.balls = sim.balls.filter(q => !q.ceil);
      }
    }
    // Punten voor een wolk die het plafond raakt: alle wolkjes die erin zitten, plus een bonus.
    function ceilPts(s) {
      let p = 0;
      for (let k = 1; k <= s; k++) p += 2 ** (s - k) * POP_PTS[k];
      return p + CEIL_BONUS * s;
    }
    // Stuiteren op een plankje: nooit zo hoog dat de wolk vanzelf het plafond raakt.
    function platBounce(q, pl) {
      const h = Math.min(APEX[q.s], pl.y0 - 2 * RADIUS[q.s] - 4);
      return -Math.sqrt(2 * sim.grav * Math.max(4, h));
    }
    function collideRect(q, r, pl) {
      const cx = Math.max(pl.x0, Math.min(pl.x1, q.x)), cy = Math.max(pl.y0, Math.min(pl.y1, q.y));
      const dx = q.x - cx, dy = q.y - cy, d2 = dx * dx + dy * dy;
      if (d2 >= r * r) return;
      if (dx === 0 && dy === 0) {           // midden zit erin: naar boven duwen
        q.y = pl.y0 - r; q.vy = platBounce(q, pl); return;
      }
      if (dx === 0) {
        if (q.y < pl.y0) { q.y = pl.y0 - r; if (q.vy > 0) q.vy = platBounce(q, pl); }
        else { q.y = pl.y1 + r; q.vy = Math.abs(q.vy); }
      } else if (dy === 0) {
        if (q.x < pl.x0) { q.x = pl.x0 - r; q.vx = -Math.abs(q.vx); }
        else { q.x = pl.x1 + r; q.vx = Math.abs(q.vx); }
      } else {
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        q.x = cx + nx * r; q.y = cy + ny * r;
        if (nx * q.vx < 0) q.vx = -q.vx;
        if (ny < 0) { if (q.vy > 0) q.vy = platBounce(q, pl); }
        else if (q.vy < 0) q.vy = -q.vy;
      }
    }

    function hitPlants() {
      for (const pt of sim.plants) {
        if (pt.gone) continue;
        for (let k = 0; k < sim.balls.length; k++) {
          const q = sim.balls[k], r = RADIUS[q.s];
          if (Math.abs(q.x - pt.x) < r + PLANT_HALF && q.y + r > pt.top && q.y - r < H) {
            pop(k, pt.o); pt.gone = true; break;
          }
        }
      }
      sim.plants = sim.plants.filter(pt => !pt.gone);
    }
    function pop(k, by) {
      const q = sim.balls[k];
      sim.balls.splice(k, 1);
      sim.score += POP_PTS[q.s];
      if (by >= 0 && by < 2) sim.pops[by]++;
      ev(['pop', q.s, Math.round(q.x), Math.round(q.y), by]);
      if (q.s > 1) {
        const s = q.s - 1, r = RADIUS[s], sp = Math.abs(q.vx) || sim.vx;
        const y = Math.max(r + 1, q.y);
        sim.balls.push({ id: id++, x: Math.max(r, q.x - 2), y, vx: -sp, vy: -HOP, s });
        sim.balls.push({ id: id++, x: Math.min(W - r, q.x + 2), y, vx: sp, vy: -HOP, s });
      }
      if (rnd() < DROP_CHANCE && sim.balls.length > 0) {
        let roll = rnd() * ITEM_WSUM, t = 0;
        while (t < ITEMS.length - 1 && roll >= ITEMS[t].w) { roll -= ITEMS[t].w; t++; }
        sim.items.push({ id: id++, x: Math.max(8, Math.min(W - 8, q.x)), y: q.y, t, life: ITEM_LIFE, land: false });
      }
    }

    function items() {
      for (const it of sim.items) {
        if (!it.land) {
          it.y += ITEM_FALL;
          const floor = H - 8;
          // op een plankje blijven liggen
          let stop = floor;
          for (const pl of sim.plats) if (it.x > pl.x0 && it.x < pl.x1 && pl.y0 - 8 >= it.y - ITEM_FALL - 0.01 && pl.y0 - 8 < stop) stop = pl.y0 - 8;
          if (it.y >= stop) { it.y = stop; it.land = true; }
        } else it.life--;
        if (it.life <= 0) { it.gone = true; continue; }
        if (it.y < H - 40) continue;   // alleen op de vloer te pakken
        for (const q of sim.players) {
          if (!q.active || Math.abs(q.x - it.x) > PW / 2 + 8) continue;
          take(q, it); it.gone = true; break;
        }
      }
      sim.items = sim.items.filter(it => !it.gone);
    }
    function take(q, it) {
      const id_ = ITEMS[it.t].id;
      if (id_ === 'dubbel') q.dbl = true;
      else if (id_ === 'plak') q.plak = true;
      else if (id_ === 'chill') sim.freeze = CHILL_STEPS;
      else if (id_ === 'schild') q.shield = true;
      else if (id_ === 'leven') sim.lives = Math.min(MAX_LIVES, sim.lives + 1);
      ev(['item', q.i, id_]);
    }

    function walls() {
      sim.walls.forEach((wa, k) => {
        if (wa.open > 0) { if (wa.open < 1) wa.open = Math.min(1, wa.open + 1 / 40); return; }
        const left = sim.walls.filter(o => o !== wa && o.open < 1 && o.x < wa.x).reduce((a, o) => Math.max(a, o.x), 0);
        const right = sim.walls.filter(o => o !== wa && o.open < 1 && o.x > wa.x).reduce((a, o) => Math.min(a, o.x), W);
        const lEmpty = !sim.balls.some(q => q.x > left && q.x < wa.x);
        const rEmpty = !sim.balls.some(q => q.x > wa.x && q.x < right);
        if (lEmpty || rEmpty) { wa.open = 1 / 40; ev(['wall', k]); }
      });
    }

    function hitPlayers() {
      if (sim.phase !== 'play') return;
      for (const q of sim.players) {
        if (!q.active || q.inv > 0 || q.grace > 0) continue;
        const x0 = q.x - PW / 2 + 2, x1 = q.x + PW / 2 - 2, y0 = H - PH + 3, y1 = H;
        for (const bl of sim.balls) {
          const r = RADIUS[bl.s] * 0.9;
          const cx = Math.max(x0, Math.min(x1, bl.x)), cy = Math.max(y0, Math.min(y1, bl.y));
          if ((bl.x - cx) ** 2 + (bl.y - cy) ** 2 < r * r) {
            if (sim.god) break;
            if (q.shield) { q.shield = false; q.inv = SHIELD_INV; ev(['shield', q.i]); break; }
            q.hit = true;
            loseLife(q.i, 'hit');
            return;
          }
        }
      }
    }
    function loseLife(i, why) {
      sim.lives = Math.max(0, sim.lives - 1);
      sim.phase = sim.lives > 0 ? 'hit' : 'over';
      // wie geraakt is, of bij tijd op iedereen, raakt z'n extra's kwijt
      sim.players.forEach(q => { if (i < 0 || q.i === i) { q.dbl = false; q.plak = false; q.shield = false; } });
      sim.plants = [];
      ev([why === 'time' ? 'time' : 'hit', i, sim.lives]);
    }

    /* ---------------- computer (neemt het over als een telefoon wegvalt; ook voor de tests) ---------------- */
    function botThink(i) {
      const q = sim.players[i];
      const [lo, hi] = roomOf(q.x);
      const inRoom = sim.balls.filter(bl => bl.x > lo && bl.x < hi);
      // Vooruitkijken: waar zijn de wolken de komende ~0,6 s (simpele baan: zwaartekracht, vloer, randen)?
      const T = 36, fut = [];
      if (!sim.freeze) for (const bl of sim.balls) {
        if (Math.abs(bl.x - q.x) > 140) continue;
        const r = RADIUS[bl.s] + 3; let x = bl.x, y = bl.y, vx = bl.vx, vy = bl.vy;
        const path = [];
        for (let t = 0; t < T; t++) {
          vy += sim.grav; x += vx; y += vy;
          if (y + r - 3 >= H) { y = H - r + 3; vy = -bounceV(bl.s); }
          if (x < r) { x = r; vx = -vx; } else if (x > W - r) { x = W - r; vx = -vx; }
          path.push(x, y);
        }
        fut.push([r, path]);
      }
      const minX = (lo === 0 ? 0 : lo + WALL_HALF) + PW / 2, maxX = (hi === W ? W : hi - WALL_HALF) - PW / 2;
      const safeFor = dd => {
        if (q.inv > 0 || q.grace > 6) return T;
        for (let t = 0; t < T; t++) {
          const px = Math.max(minX, Math.min(maxX, q.x + dd * P_SPEED * (t + 1)));
          for (const [r, path] of fut) {
            const bx = path[t * 2], by = path[t * 2 + 1];
            const cx = Math.max(px - PW / 2, Math.min(px + PW / 2, bx)), cy = Math.max(H - PH, Math.min(H, by));
            if ((bx - cx) ** 2 + (by - cy) ** 2 < r * r) return t;
          }
        }
        return T;
      };
      // doel: de wolk die je het snelst raakt (in je eigen vak), kleine eerst als ze laag zijn
      let tgt = null, best = 1e9;
      for (const bl of (inRoom.length ? inRoom : sim.balls)) {
        const dist = Math.abs(bl.x - q.x) + (bl.y < plantLimit(bl.x) + RADIUS[bl.s] ? 400 : 0);
        if (dist < best) { best = dist; tgt = bl; }
      }
      let d = 0;
      if (tgt) {
        // waar is de wolk als de plant op zijn hoogte is?
        const steps = Math.max(0, (H - PLANT_START - tgt.y) / PLANT_SPEED);
        let fx = tgt.x + (sim.freeze ? 0 : tgt.vx * steps);
        fx = Math.max(lo + 4, Math.min(hi - 4, fx));
        if (Math.abs(fx - q.x) > RADIUS[tgt.s] * 0.6) d = fx > q.x ? 1 : -1;
        const mine = sim.plants.filter(pt => pt.o === i).length;
        if (Math.abs(fx - q.x) < RADIUS[tgt.s] + 2 && mine < (q.dbl ? 2 : 1)) q.fq = 1;
      }
      if (!sim.god && fut.length) {
        // gekozen stap niet veilig? dan de veiligste van de drie (bij gelijk: stil blijven)
        if (safeFor(d) < T) {
          let bd = d, bs = -1;
          for (const dd of [0, -1, 1]) { const s = safeFor(dd); if (s > bs) { bs = s; bd = dd; } }
          d = bd;
        }
      }
      q.d = d;
    }
    sim.botThink = botThink;

    /* ---------------- momentopname (voor tekenen en het netwerk) ---------------- */
    sim.snap = function () {
      const b_ = [];
      for (const q of sim.balls) b_.push(Math.round(q.x * 10), Math.round(q.y * 10), q.s, q.id);
      const pl = [];
      for (const pt of sim.plants) pl.push(Math.round(pt.x * 10), Math.round(pt.top * 10), pt.o, pt.id, pt.stuck > 0 ? Math.ceil(pt.stuck / HZ) : 0);
      const it = [];
      for (const x of sim.items) it.push(Math.round(x.x * 10), Math.round(x.y * 10), x.t, x.id, x.land && x.life < 2 * HZ ? 1 : 0);
      return {
        b: b_, pl, it,
        p: sim.players.map(q => [Math.round(q.x * 10), (q.active ? 1 : 0) | (q.moving ? 2 : 0) | (q.shield ? 4 : 0) | (q.inv > 0 || q.grace > 0 ? 8 : 0) | (q.dbl ? 16 : 0) | (q.plak ? 32 : 0) | (q.face < 0 ? 64 : 0) | (q.hit ? 128 : 0)]),
        w: sim.walls.map(wa => Math.round(wa.open * 100)),
        tl: Math.ceil(sim.tl / HZ), fz: sim.freeze > 0 ? Math.ceil(sim.freeze / HZ) : 0,
        lv: sim.lives, sc: sim.score, n: sim.level
      };
    };
    return sim;
  }

  root.HIGHP = { W, H, HZ, RADIUS, APEX, POP_PTS, ITEMS, IBY, WORLDS, LEVELS_N, START_LIVES, MAX_LIVES, PW, PH, PLANT_START, WALL_HALF, levelDef, worldOf, createSim };
})(typeof window !== 'undefined' ? window : globalThis);
