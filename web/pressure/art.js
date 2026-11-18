/* High Pressure — alle tekeningen, met de hand op canvas getekend (geen plaatjes van buiten).
   Eigen figuurtjes in rasta-stijl, rookwolken, de wietplant die je afschiet en vier werelden.
   Figuurtjes: 1 eenheid ≈ lengte van het figuurtje; (0,0) = tussen de voeten. */
(function (root) {
  'use strict';
  const RED = '#e8402e', GOLD = '#ffcc33', GREEN = '#2fa84f', INK = '#20140c';
  const RASTA = [RED, GOLD, GREEN];

  const CHARS = [
    { id: 'kofi', name: 'Kofi', col: '#3fbf4f', shirt: '#2f9e48', skin: '#7a4a2a', kind: 'dreads', desc: 'Dreads en een gestreepte muts' },
    { id: 'nyah', name: 'Nyah', col: '#ffc933', shirt: '#f0b21e', skin: '#a8693f', kind: 'wrap', desc: 'Hoofddoek en grote oorringen' },
    { id: 'leo', name: 'Leo', col: '#ff5a46', shirt: '#d93a2b', skin: '#e3a640', kind: 'lion', desc: 'Leeuw met een wilde manen' },
    { id: 'sam', name: 'Sam', col: '#33c9b8', shirt: '#24a597', skin: '#a08a6f', kind: 'sloth', desc: 'Luiaard, nergens haast mee' },
    { id: 'tuki', name: 'Tuki', col: '#ff8c1a', shirt: '#e8730e', skin: '#1d1a22', kind: 'toucan', desc: 'Toekan met een kleurige snavel' },
    { id: 'koos', name: 'Koos', col: '#a77bff', shirt: '#8a5ef0', skin: '#5fbf4a', kind: 'frog', desc: 'Kikker met een zweetbandje' }
  ];
  // Kleur per wolkmaat (1 = kleinste)
  const CLOUD = [null,
    { fill: '#52c86a', dark: '#2a8a40', light: '#a9f0b4' },
    { fill: '#ffd34d', dark: '#d19a12', light: '#fff1b0' },
    { fill: '#f0603f', dark: '#b33622', light: '#ffb3a0' },
    { fill: '#3fb35a', dark: '#1f7a37', light: '#98e6a8' },
    { fill: '#f6c235', dark: '#c4880e', light: '#ffe79a' },
    { fill: '#d9442f', dark: '#8f2417', light: '#ff9d86' }];

  const TAU = Math.PI * 2;
  const ell = (c, x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); };
  const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); };
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function stripes(c, x, y, w, h, vertical) {   // rood-goud-groen binnen het huidige pad (clip)
    c.save(); c.clip();
    RASTA.forEach((col, i) => { c.fillStyle = col; if (vertical) c.fillRect(x + i * w / 3, y, w / 3 + 0.002, h); else c.fillRect(x, y + i * h / 3, w, h / 3 + 0.002); });
    c.restore();
  }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ================================================================ figuurtjes */
  // o: { face: 1 rechts / -1 links, frame: 0 stil, 1/2 stapje, hit, blink, front }
  function drawChar(c, ci, o) {
    const C = CHARS[ci] || CHARS[0];
    o = o || {};
    const f = o.front ? 0 : (o.face < 0 ? -1 : 1);
    c.save();
    // schaduw
    c.fillStyle = 'rgba(20,10,0,.28)'; ell(c, 0, 0, 0.26, 0.05); c.fill();
    // benen
    const st = o.frame === 1 ? 0.06 : o.frame === 2 ? -0.06 : 0;
    c.fillStyle = '#2f2a3a';
    rrect(c, -0.14 + st, -0.3, 0.1, 0.27, 0.04); c.fill();
    rrect(c, 0.04 - st, -0.3, 0.1, 0.27, 0.04); c.fill();
    c.fillStyle = INK;
    ell(c, -0.09 + st + f * 0.02, -0.025, 0.08, 0.04); c.fill();
    ell(c, 0.09 - st + f * 0.02, -0.025, 0.08, 0.04); c.fill();
    // achterkant van het hoofd (haar/manen) achter het lijf
    behind(c, C, f, o);
    // lijf
    c.fillStyle = C.shirt; rrect(c, -0.2, -0.64, 0.4, 0.38, 0.12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.14)'; rrect(c, -0.2, -0.64, 0.4, 0.12, 0.1); c.fill();
    // rasta-band over het shirt
    c.save(); rrect(c, -0.2, -0.43, 0.4, 0.09, 0.02); stripes(c, -0.2, -0.43, 0.4, 0.09, false); c.restore();
    // armen
    const sw = o.frame === 1 ? 0.03 : o.frame === 2 ? -0.03 : 0;
    const hand = C.kind === 'toucan' ? '#2b2733' : C.kind === 'frog' ? '#4caa3a' : C.skin;
    c.fillStyle = C.shirt;
    ell(c, -0.215, -0.52 + sw, 0.06, 0.1, 0.25); c.fill(); ell(c, 0.215, -0.52 - sw, 0.06, 0.1, -0.25); c.fill();
    c.fillStyle = hand;
    circ(c, -0.24, -0.42 + sw, 0.05); c.fill(); circ(c, 0.24, -0.42 - sw, 0.05); c.fill();
    head(c, C, f, o);
    c.restore();
  }
  function behind(c, C, f, o) {
    if (C.kind === 'dreads') {
      c.fillStyle = '#2a1a10';
      for (let k = -4; k <= 4; k++) { const x = k * 0.055; rrect(c, x - 0.028, -0.98, 0.056, 0.47 + (k % 2 ? 0.04 : 0) - Math.abs(k) * 0.02, 0.028); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.08)';
      for (let k = -4; k <= 4; k += 2) { c.fillRect(k * 0.055 - 0.006, -0.9, 0.012, 0.35); }
    } else if (C.kind === 'lion') {
      c.fillStyle = '#b5591a';
      c.beginPath();
      for (let k = 0; k <= 22; k++) { const a = k / 22 * TAU, r = k % 2 ? 0.27 : 0.33; c.lineTo(Math.cos(a) * r, -0.82 + Math.sin(a) * r); }
      c.closePath(); c.fill();
      c.fillStyle = '#d9772a'; circ(c, 0, -0.82, 0.25); c.fill();
    } else if (C.kind === 'wrap') {
      c.fillStyle = '#2a1a10'; ell(c, 0, -0.74, 0.2, 0.14); c.fill();
    }
  }
  function eyes(c, x1, x2, y, r, f, o, col) {
    if (o.hit) {
      c.strokeStyle = INK; c.lineWidth = 0.03; c.lineCap = 'round';
      [x1, x2].forEach(x => { c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke(); });
      return;
    }
    if (o.blink) {
      c.strokeStyle = INK; c.lineWidth = 0.025; c.lineCap = 'round';
      [x1, x2].forEach(x => { c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x, y + r * 0.8, x + r, y); c.stroke(); });
      return;
    }
    [x1, x2].forEach(x => {
      c.fillStyle = '#fff'; ell(c, x, y, r, r * 1.2); c.fill();
      c.fillStyle = col || INK; circ(c, x + f * r * 0.35, y + r * 0.1, r * 0.62); c.fill();
      c.fillStyle = '#fff'; circ(c, x + f * r * 0.35 - r * 0.2, y - r * 0.2, r * 0.22); c.fill();
    });
  }
  function smile(c, x, y, w, col) {
    c.strokeStyle = col || INK; c.lineWidth = 0.025; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * 0.9, x + w, y); c.stroke();
  }
  function tam(c, x, y, rx, ry, tilt) {
    c.save(); c.translate(x, y); c.rotate(tilt || 0);
    ell(c, 0, 0, rx, ry); stripes(c, -rx, -ry, rx * 2, ry * 2, false);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.012; ell(c, 0, 0, rx, ry); c.stroke();
    c.fillStyle = INK; rrect(c, -rx * 0.8, ry * 0.55, rx * 1.6, ry * 0.45, 0.02); c.fill();
    c.restore();
  }
  function head(c, C, f, o) {
    const hy = -0.82, ox = f * 0.025;
    switch (C.kind) {
      case 'dreads': {
        c.fillStyle = C.skin; circ(c, 0, hy, 0.19); c.fill();
        c.fillStyle = '#2a1a10';   // pony-dreads voor
        for (let k = -2; k <= 2; k++) { rrect(c, k * 0.06 - 0.025 + ox, hy - 0.2, 0.05, 0.1 + (k % 2 ? 0.02 : 0), 0.025); c.fill(); }
        eyes(c, -0.07 + ox, 0.07 + ox, hy + 0.01, 0.042, f, o);
        c.fillStyle = '#2a1a10'; ell(c, ox, hy + 0.11, 0.09, 0.05); c.fill();   // baardje
        smile(c, ox, hy + 0.075, 0.05, '#f3d8c6');
        tam(c, ox * 0.5, hy - 0.2, 0.27, 0.12, -0.08 * (f || 1));
        break;
      }
      case 'wrap': {
        c.fillStyle = C.skin; circ(c, 0, hy, 0.18); c.fill();
        c.fillStyle = GOLD; circ(c, -0.18, hy + 0.06, 0.035); c.lineWidth = 0.016; c.strokeStyle = GOLD; c.stroke();
        c.beginPath(); c.arc(-0.18, hy + 0.08, 0.04, 0, TAU); c.stroke(); c.beginPath(); c.arc(0.18, hy + 0.08, 0.04, 0, TAU); c.stroke();
        eyes(c, -0.065 + ox, 0.065 + ox, hy + 0.02, 0.04, f, o);
        c.fillStyle = '#7a2f2a'; ell(c, ox, hy + 0.1, 0.045, 0.022); c.fill();
        // hoofddoek: hoog opgebonden, schuine strepen, knoop voor
        c.save(); c.beginPath(); c.moveTo(-0.2, hy - 0.04); c.quadraticCurveTo(-0.24, hy - 0.42, 0.02, hy - 0.4); c.quadraticCurveTo(0.26, hy - 0.38, 0.2, hy - 0.04); c.quadraticCurveTo(0, hy - 0.14, -0.2, hy - 0.04); c.closePath();
        c.clip();
        for (let k = -6; k < 8; k++) { c.fillStyle = RASTA[(k + 9) % 3]; c.beginPath(); c.moveTo(-0.3 + k * 0.07, hy); c.lineTo(-0.3 + k * 0.07 + 0.07, hy); c.lineTo(-0.1 + k * 0.07 + 0.07, hy - 0.45); c.lineTo(-0.1 + k * 0.07, hy - 0.45); c.closePath(); c.fill(); }
        c.restore();
        c.fillStyle = RED; ell(c, 0.05, hy - 0.12, 0.07, 0.045, 0.5); c.fill(); ell(c, -0.04, hy - 0.11, 0.06, 0.04, -0.5); c.fill();
        c.fillStyle = GOLD; circ(c, 0.005, hy - 0.115, 0.03); c.fill();
        break;
      }
      case 'lion': {
        c.fillStyle = C.skin; circ(c, 0, hy, 0.19); c.fill();
        c.fillStyle = '#c98a2a'; circ(c, -0.15, hy - 0.15, 0.06); c.fill(); circ(c, 0.15, hy - 0.15, 0.06); c.fill();
        c.fillStyle = '#f6d58f'; ell(c, ox, hy + 0.07, 0.12, 0.08); c.fill();
        eyes(c, -0.07 + ox, 0.07 + ox, hy - 0.03, 0.042, f, o, '#5a3a10');
        c.fillStyle = '#4a2a14'; c.beginPath(); c.moveTo(ox - 0.04, hy + 0.03); c.lineTo(ox + 0.04, hy + 0.03); c.lineTo(ox, hy + 0.075); c.closePath(); c.fill();
        smile(c, ox, hy + 0.1, 0.04, '#4a2a14');
        c.strokeStyle = 'rgba(74,42,20,.6)'; c.lineWidth = 0.01;
        [[-1, 0.06], [-1, 0.09], [1, 0.06], [1, 0.09]].forEach(([s, y]) => { c.beginPath(); c.moveTo(ox + s * 0.07, hy + y); c.lineTo(ox + s * 0.16, hy + y - 0.01); c.stroke(); });
        tam(c, ox * 0.4 + 0.04, hy - 0.22, 0.17, 0.08, 0.18);
        break;
      }
      case 'sloth': {
        c.fillStyle = C.skin; circ(c, 0, hy, 0.2); c.fill();
        c.fillStyle = '#e8d8bb'; ell(c, ox, hy + 0.02, 0.16, 0.13); c.fill();
        c.fillStyle = '#4a3a2c';
        ell(c, -0.075 + ox, hy + 0.01, 0.06, 0.035, 0.4); c.fill(); ell(c, 0.075 + ox, hy + 0.01, 0.06, 0.035, -0.4); c.fill();
        if (o.hit || o.blink) eyes(c, -0.075 + ox, 0.075 + ox, hy + 0.01, 0.025, f, o);
        else { c.fillStyle = '#fff'; circ(c, -0.07 + ox + f * 0.008, hy + 0.005, 0.016); c.fill(); circ(c, 0.08 + ox + f * 0.008, hy + 0.005, 0.016); c.fill(); }
        c.fillStyle = '#3a2a1e'; ell(c, ox, hy + 0.06, 0.035, 0.022); c.fill();
        smile(c, ox, hy + 0.09, 0.045, '#3a2a1e');
        // muts met pompon
        c.save(); c.beginPath(); c.moveTo(-0.2, hy - 0.08); c.quadraticCurveTo(-0.18, hy - 0.34, 0, hy - 0.34); c.quadraticCurveTo(0.18, hy - 0.34, 0.2, hy - 0.08); c.closePath(); stripes(c, -0.2, hy - 0.34, 0.4, 0.26, false); c.restore();
        c.fillStyle = '#f2ece0'; rrect(c, -0.21, hy - 0.12, 0.42, 0.06, 0.03); c.fill();
        c.fillStyle = GOLD; circ(c, 0, hy - 0.36, 0.05); c.fill();
        break;
      }
      case 'toucan': {
        c.fillStyle = C.skin; circ(c, 0, hy, 0.19); c.fill();
        c.fillStyle = '#fff6dc'; ell(c, f * 0.06, hy + 0.08, 0.11, 0.09); c.fill();
        // snavel
        const s = f || 1;
        c.save(); c.translate(s * 0.1, hy - 0.01); c.scale(s, 1);
        c.beginPath(); c.moveTo(0, -0.07); c.quadraticCurveTo(0.2, -0.12, 0.34, -0.02); c.quadraticCurveTo(0.3, 0.04, 0.2, 0.04); c.lineTo(0, 0.05); c.closePath();
        const gr = c.createLinearGradient(0, 0, 0.34, 0); gr.addColorStop(0, GREEN); gr.addColorStop(0.45, GOLD); gr.addColorStop(0.85, '#ff7a1a'); gr.addColorStop(1, RED);
        c.fillStyle = gr; c.fill();
        c.fillStyle = INK; ell(c, 0.32, -0.015, 0.025, 0.03); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.01; c.beginPath(); c.moveTo(0.02, 0.0); c.quadraticCurveTo(0.18, -0.02, 0.3, 0.0); c.stroke();
        c.restore();
        c.fillStyle = '#58b8ff'; circ(c, s * 0.02 + (f ? 0 : -0.07), hy - 0.04, 0.05); c.fill();
        if (!f) { circ(c, 0.07, hy - 0.04, 0.05); c.fill(); }
        eyes(c, s * 0.02 + (f ? 0 : -0.07), f ? s * 0.02 : 0.07, hy - 0.04, 0.03, f, o);
        // hoofdbandje
        c.save(); rrect(c, -0.19, hy - 0.16, 0.38, 0.06, 0.03); stripes(c, -0.19, hy - 0.16, 0.38, 0.06, true); c.restore();
        c.fillStyle = C.skin; ell(c, -s * 0.08, hy - 0.22, 0.05, 0.04, -0.6 * s); c.fill();
        break;
      }
      case 'frog': {
        c.fillStyle = C.skin; ell(c, 0, hy + 0.02, 0.24, 0.17); c.fill();
        c.fillStyle = '#4caa3a'; circ(c, -0.11, hy - 0.13, 0.085); c.fill(); circ(c, 0.11, hy - 0.13, 0.085); c.fill();
        eyes(c, -0.11, 0.11, hy - 0.13, 0.06, f, o);
        c.fillStyle = '#ff8fa0'; ell(c, -0.15, hy + 0.07, 0.04, 0.022); c.fill(); ell(c, 0.15, hy + 0.07, 0.04, 0.022); c.fill();
        smile(c, ox, hy + 0.05, 0.12, '#1f4a1a');
        c.save(); rrect(c, -0.235, hy - 0.04, 0.47, 0.05, 0.025); stripes(c, -0.235, hy - 0.04, 0.47, 0.05, true); c.restore();
        break;
      }
    }
    if (o.hit) {   // sterretjes
      c.fillStyle = GOLD;
      for (let k = 0; k < 3; k++) { const a = (o.t || 0) * 5 + k * TAU / 3; star(c, Math.cos(a) * 0.25, hy - 0.28 + Math.sin(a) * 0.06, 0.05); }
    }
  }
  function star(c, x, y, r) {
    c.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fill();
  }

  /* ================================================================ wietplant (het wapen) */
  // Eén blad met 7 vingers; s = lengte van de middelste vinger.
  function drawLeaf(c, x, y, s, ang, col, dark) {
    c.save(); c.translate(x, y); c.rotate(ang);
    const L = [0.38, 0.62, 0.86, 1, 0.86, 0.62, 0.38], A = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
    c.fillStyle = col || '#3fae3a';
    for (let k = 0; k < 7; k++) {
      const l = L[k] * s, w = l * 0.17;
      c.save(); c.rotate(A[k] * 0.62);
      c.beginPath(); c.moveTo(0, 0);
      // gezaagde rand
      const n = 5;
      for (let j = 1; j <= n; j++) { const t = j / n, yy = -l * t, ww = w * Math.sin(Math.PI * Math.min(1, t * 1.05)); c.lineTo(ww * 1.15, yy + l * 0.05); c.lineTo(ww * 0.8, yy); }
      c.lineTo(0, -l);
      for (let j = n; j >= 1; j--) { const t = j / n, yy = -l * t, ww = w * Math.sin(Math.PI * Math.min(1, t * 1.05)); c.lineTo(-ww * 0.8, yy); c.lineTo(-ww * 1.15, yy + l * 0.05); }
      c.closePath(); c.fill();
      c.strokeStyle = dark || 'rgba(20,70,20,.55)'; c.lineWidth = s * 0.03;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -l * 0.92); c.stroke();
      c.restore();
    }
    c.restore();
  }
  // Plant van de vloer (bottom) tot top, in wereldeenheden. col = kleur van de speler (bloempje bovenin).
  function drawPlant(c, x, top, bottom, t, col, stuck) {
    const len = bottom - top;
    if (len <= 0) return;
    c.save();
    // stengel, licht golvend
    c.strokeStyle = '#2f7d2a'; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath();
    for (let y = bottom; y >= top; y -= 6) { const sw = Math.sin(y * 0.09 + t * 6) * 1.1; y === bottom ? c.moveTo(x + sw, y) : c.lineTo(x + sw, y); }
    c.lineTo(x, top); c.stroke();
    c.strokeStyle = 'rgba(180,255,150,.5)'; c.lineWidth = 1; c.stroke();
    // blaadjes om en om
    let k = 0;
    for (let y = bottom - 16; y > top + 16; y -= 22, k++) {
      const s = k % 2 ? 1 : -1, sw = Math.sin(y * 0.09 + t * 6) * 1.1;
      drawLeaf(c, x + sw, y, 11, s * 0.95, k % 3 === 0 ? '#45b83e' : '#3aa335');
    }
    // kroon bovenin
    drawLeaf(c, x, top + 12, 15, 0, '#4cc544');
    if (stuck) {
      c.fillStyle = 'rgba(255,214,77,.9)';
      for (let j = 0; j < 4; j++) { const dx = (j - 1.5) * 4, dy = ((t * 18 + j * 7) % 14); ell(c, x + dx, top + 2 + dy, 1.4, 2.2); c.fill(); }
      c.strokeStyle = 'rgba(255,214,77,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 7, top + 1); c.lineTo(x + 7, top + 1); c.stroke();
    }
    c.fillStyle = col || GOLD; circ(c, x, top + 3, 2.4); c.fill();
    c.restore();
  }

  /* ================================================================ rookwolken */
  // Tekent een wolk met straal r rond (0,0). id bepaalt de vorm, t laat hem zachtjes golven.
  function drawCloud(c, s, r, t, id, frozen) {
    const K = CLOUD[s] || CLOUD[3];
    const R = rng(id * 97 + s);
    const bumps = 7 + (s > 3 ? 2 : 0);
    const ph = R() * TAU;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, 0, r * 0.9, r * 0.8, r * 0.18); c.fill();
    // buitenrand donker, dan vulling, dan licht
    const shape = (k, grow) => {
      circ(c, 0, 0, r * 0.82 * k + grow); c.fill();
      for (let i = 0; i < bumps; i++) {
        const a = ph + i * TAU / bumps + Math.sin(t * 1.3 + i) * 0.05;
        const br = r * (0.36 + ((i * 7) % 3) * 0.04) * k;
        circ(c, Math.cos(a) * r * 0.62 * k, Math.sin(a) * r * 0.58 * k, br + grow); c.fill();
      }
    };
    c.fillStyle = frozen ? '#4c86b8' : K.dark; shape(1, Math.max(0.8, r * 0.07));
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, frozen ? '#e4f4ff' : K.light); g.addColorStop(0.55, frozen ? '#a9d6f5' : K.fill); g.addColorStop(1, frozen ? '#7fb6e0' : K.fill);
    c.fillStyle = g; shape(1, 0);
    c.fillStyle = 'rgba(255,255,255,.35)'; ell(c, -r * 0.35, -r * 0.42, r * 0.25, r * 0.13, -0.4); c.fill();
    // gezichtje (vanaf maat 2)
    if (s >= 2) {
      const e = r * 0.13, ey = -r * 0.02;
      c.fillStyle = '#fff'; ell(c, -r * 0.24, ey, e, e * 1.1); c.fill(); ell(c, r * 0.24, ey, e, e * 1.1); c.fill();
      c.fillStyle = INK; circ(c, -r * 0.22, ey + e * 0.2, e * 0.55); c.fill(); circ(c, r * 0.26, ey + e * 0.2, e * 0.55); c.fill();
      c.strokeStyle = INK; c.lineWidth = Math.max(0.8, r * 0.06); c.lineCap = 'round';
      c.beginPath(); c.moveTo(-r * 0.38, ey - e * 1.5); c.lineTo(-r * 0.12, ey - e * 0.9); c.moveTo(r * 0.38, ey - e * 1.5); c.lineTo(r * 0.12, ey - e * 0.9); c.stroke();
      c.beginPath(); c.moveTo(-r * 0.12, r * 0.28); c.quadraticCurveTo(0, r * 0.2, r * 0.12, r * 0.28); c.stroke();
    } else {
      c.fillStyle = INK; circ(c, -r * 0.25, 0, r * 0.13); c.fill(); circ(c, r * 0.25, 0, r * 0.13); c.fill();
    }
    if (frozen) {
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(0.6, r * 0.05);
      for (let i = 0; i < 3; i++) { const a = i * TAU / 6; c.beginPath(); c.moveTo(r * 0.55 + Math.cos(a) * r * 0.16, -r * 0.55 + Math.sin(a) * r * 0.16); c.lineTo(r * 0.55 - Math.cos(a) * r * 0.16, -r * 0.55 - Math.sin(a) * r * 0.16); c.stroke(); }
    }
    c.restore();
  }
  // Rookpluimpje na een knal (k = 0..1)
  function drawPuff(c, s, r, k, seed) {
    const K = CLOUD[s] || CLOUD[3], R = rng(seed);
    c.save(); c.globalAlpha = Math.max(0, 1 - k);
    for (let i = 0; i < 7; i++) {
      const a = R() * TAU, d = r * (0.4 + k * (0.9 + R() * 0.8));
      c.fillStyle = i % 2 ? K.light : K.fill;
      circ(c, Math.cos(a) * d, Math.sin(a) * d - k * r * 0.6, r * (0.28 + R() * 0.2) * (1 - k * 0.5)); c.fill();
    }
    c.restore();
  }

  /* ================================================================ power-ups */
  // In een rondje met straal 0.5 rond (0,0).
  function drawItem(c, id) {
    c.save();
    c.fillStyle = 'rgba(255,255,255,.92)'; circ(c, 0, 0, 0.5); c.fill();
    c.lineWidth = 0.07;
    c.save(); circ(c, 0, 0, 0.5); c.clip(); c.lineWidth = 0.14;
    RASTA.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(0, 0, 0.47, (i / 3) * TAU - Math.PI / 2, ((i + 1) / 3) * TAU - Math.PI / 2); c.stroke(); });
    c.restore();
    if (id === 'dubbel') { drawLeaf(c, -0.13, 0.28, 0.4, -0.15); drawLeaf(c, 0.13, 0.28, 0.4, 0.15); }
    else if (id === 'plak') {
      drawLeaf(c, 0, 0.3, 0.46, 0);
      c.fillStyle = '#ffb800'; ell(c, -0.18, -0.02, 0.06, 0.09); c.fill(); ell(c, 0.14, 0.1, 0.05, 0.08); c.fill(); ell(c, 0.02, -0.25, 0.05, 0.07); c.fill();
    } else if (id === 'chill') {
      c.fillStyle = '#58b8ff'; circ(c, 0, 0.02, 0.3); c.fill();
      c.fillStyle = '#fff'; circ(c, 0, 0.02, 0.23); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.05; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0.02); c.lineTo(0, -0.14); c.moveTo(0, 0.02); c.lineTo(0.1, 0.08); c.stroke();
      c.fillStyle = '#58b8ff'; c.font = 'bold 0.2px sans-serif'; c.fillText('z', 0.2, -0.22); c.font = 'bold 0.14px sans-serif'; c.fillText('z', 0.32, -0.32);
    } else if (id === 'schild') {
      c.beginPath(); c.moveTo(0, -0.33); c.lineTo(0.27, -0.22); c.quadraticCurveTo(0.27, 0.15, 0, 0.34); c.quadraticCurveTo(-0.27, 0.15, -0.27, -0.22); c.closePath();
      stripes(c, -0.27, -0.33, 0.54, 0.67, false);
      c.strokeStyle = INK; c.lineWidth = 0.04; c.beginPath(); c.moveTo(0, -0.33); c.lineTo(0.27, -0.22); c.quadraticCurveTo(0.27, 0.15, 0, 0.34); c.quadraticCurveTo(-0.27, 0.15, -0.27, -0.22); c.closePath(); c.stroke();
    } else if (id === 'leven') {
      c.beginPath(); c.moveTo(0, 0.3); c.bezierCurveTo(-0.42, 0.02, -0.26, -0.36, 0, -0.14); c.bezierCurveTo(0.26, -0.36, 0.42, 0.02, 0, 0.3); c.closePath();
      stripes(c, -0.34, -0.3, 0.68, 0.6, false);
      c.fillStyle = '#fff'; c.font = 'bold 0.2px sans-serif'; c.textAlign = 'center'; c.fillText('+1', 0, 0.06);
    }
    c.restore();
  }

  /* ================================================================ werelden */
  // Achtergrond van het hele veld (w × h wereldeenheden; vloer op y = h, eronder pad grond).
  function drawWorld(c, wi, w, h, pad) {
    const R = rng(1234 + wi);
    c.save();
    if (wi === 0) {          // strand bij zonsondergang
      let g = c.createLinearGradient(0, 0, 0, h * 0.62);
      g.addColorStop(0, '#47206e'); g.addColorStop(0.45, '#c2406b'); g.addColorStop(0.8, '#ff8a4d'); g.addColorStop(1, '#ffd27a');
      c.fillStyle = g; c.fillRect(0, 0, w, h * 0.62);
      c.fillStyle = 'rgba(255,240,180,.95)'; circ(c, w * 0.62, h * 0.6, 34); c.fill();
      c.fillStyle = 'rgba(255,200,120,.35)'; circ(c, w * 0.62, h * 0.6, 52); c.fill();
      // wolkjes
      c.fillStyle = 'rgba(255,190,170,.45)';
      [[60, 50, 40], [300, 80, 55], [180, 35, 30]].forEach(([x, y, s]) => { ell(c, x, y, s, s * 0.22); c.fill(); ell(c, x + s * 0.4, y - 5, s * 0.5, s * 0.2); c.fill(); });
      // zee
      g = c.createLinearGradient(0, h * 0.62, 0, h * 0.84); g.addColorStop(0, '#5a5fb0'); g.addColorStop(1, '#1f3f7a');
      c.fillStyle = g; c.fillRect(0, h * 0.62, w, h * 0.22);
      c.fillStyle = 'rgba(255,220,150,.55)';
      for (let k = 0; k < 9; k++) { const y = h * 0.635 + k * 6.5, ww = 50 - k * 4; c.fillRect(w * 0.62 - ww / 2 + (R() - 0.5) * 6, y, ww, 1.6); }
      // zand
      g = c.createLinearGradient(0, h * 0.82, 0, h + pad); g.addColorStop(0, '#f2cf8a'); g.addColorStop(1, '#d9a95c');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, h * 0.86); c.quadraticCurveTo(w * 0.5, h * 0.8, w, h * 0.85); c.lineTo(w, h + pad); c.lineTo(0, h + pad); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(0, h * 0.86); c.quadraticCurveTo(w * 0.5, h * 0.8, w, h * 0.85); c.lineTo(w, h * 0.855); c.quadraticCurveTo(w * 0.5, h * 0.81, 0, h * 0.87); c.fill();
      palm(c, 22, h + 2, 1, 1.05); palm(c, w - 18, h + 2, -1, 0.95); palm(c, w - 62, h + 2, -1, 0.7);
      // hangmat tussen de palmen rechts
      c.strokeStyle = '#6b3d1f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(w - 58, h - 70); c.quadraticCurveTo(w - 40, h - 48, w - 22, h - 82); c.stroke();
      c.save(); c.beginPath(); c.moveTo(w - 54, h - 68); c.quadraticCurveTo(w - 40, h - 50, w - 26, h - 78); c.quadraticCurveTo(w - 40, h - 58, w - 54, h - 68); c.closePath(); stripes(c, w - 56, h - 80, 32, 30, true); c.restore();
    } else if (wi === 1) {   // jungle en bergen
      let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fd8e8'); g.addColorStop(0.6, '#d8f0d0'); g.addColorStop(1, '#bfe0b0');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const ridge = (base, amp, col, seed) => { const r = rng(seed); c.fillStyle = col; c.beginPath(); c.moveTo(0, h); let y = base; for (let x = 0; x <= w + 20; x += 20) { y = base - r() * amp; c.lineTo(x, y); } c.lineTo(w, h); c.closePath(); c.fill(); };
      ridge(h * 0.42, 70, '#7fb8a8', 3); ridge(h * 0.55, 60, '#5f9e7c', 5);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, h * 0.5, w, 18);
      // waterval
      c.fillStyle = '#56806a'; c.beginPath(); c.moveTo(w * 0.62, h * 0.8); c.lineTo(w * 0.64, h * 0.36); c.lineTo(w * 0.76, h * 0.33); c.lineTo(w * 0.79, h * 0.8); c.closePath(); c.fill();
      g = c.createLinearGradient(w * 0.66, 0, w * 0.66 + 22, 0); g.addColorStop(0, '#d8f4ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#bfe8ff');
      c.fillStyle = g; c.fillRect(w * 0.66 + 6, h * 0.36, 22, h * 0.42);
      c.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 7; k++) c.fillRect(w * 0.66 + 8 + R() * 18, h * 0.38 + R() * h * 0.36, 1.5, 10 + R() * 14);
      c.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 6; k++) { ell(c, w * 0.66 + 17 + (R() - 0.5) * 30, h * 0.82, 10 + R() * 8, 5); c.fill(); }
      ridge(h * 0.72, 40, '#3f7d4f', 9);
      // grote bladeren aan de randen
      const bigLeaf = (x, y, a, s, col) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.4, -s * 0.3, s, 0); c.quadraticCurveTo(s * 0.4, s * 0.3, 0, 0); c.fill(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(s, 0); c.stroke(); c.restore(); };
      [[-5, 40, 0.4, 70, '#2f7a3a'], [-5, 110, 0.1, 80, '#3a8f45'], [-5, 190, -0.2, 60, '#2f7a3a'], [w + 5, 60, Math.PI - 0.4, 75, '#3a8f45'], [w + 5, 150, Math.PI - 0.1, 70, '#2f7a3a'], [w + 5, 230, Math.PI + 0.25, 60, '#3a8f45']].forEach(a => bigLeaf(...a));
      // lianen
      c.strokeStyle = '#3f6a2a'; c.lineWidth = 2;
      [[80, 70], [250, 50], [340, 90]].forEach(([x, l]) => { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 10, l * 0.6, x - 4, l); c.stroke(); drawLeaf(c, x - 4, l, 7, Math.PI, '#4a9a3a'); });
      g = c.createLinearGradient(0, h - 10, 0, h + pad); g.addColorStop(0, '#4f8a35'); g.addColorStop(1, '#2f5a20');
      c.fillStyle = g; c.fillRect(0, h - 6, w, pad + 6);
      c.fillStyle = '#5fa040'; for (let x = 0; x < w; x += 5) { c.beginPath(); c.moveTo(x, h - 4); c.lineTo(x + 2, h - 10 - R() * 6); c.lineTo(x + 4, h - 4); c.fill(); }
    } else if (wi === 2) {   // reggae-stad in de avond
      let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a1850'); g.addColorStop(0.55, '#a8456e'); g.addColorStop(1, '#ff9b5a');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 25; k++) { circ(c, R() * w, R() * h * 0.35, R() * 1.1 + 0.3); c.fill(); }
      // huizen
      const cols = ['#e8402e', '#ffcc33', '#2fa84f', '#3fa7ff', '#ff7ac8', '#ff8c1a', '#9d6bff'];
      let x = -10;
      while (x < w) {
        const bw = 40 + R() * 40, bh = 70 + R() * 90, col = cols[Math.floor(R() * cols.length)];
        c.fillStyle = col; c.fillRect(x, h - bh, bw, bh);
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + bw - 6, h - bh, 6, bh);
        c.fillStyle = 'rgba(60,30,20,.55)'; c.beginPath(); c.moveTo(x - 3, h - bh); c.lineTo(x + bw / 2, h - bh - 16); c.lineTo(x + bw + 3, h - bh); c.fill();
        for (let yy = h - bh + 10; yy < h - 26; yy += 20) for (let xx = x + 7; xx < x + bw - 12; xx += 15) { c.fillStyle = R() < 0.6 ? '#ffe9a0' : 'rgba(30,20,40,.6)'; c.fillRect(xx, yy, 8, 10); }
        x += bw + 4;
      }
      // muurschildering: rasta-strepen met een zonnetje
      c.save(); c.globalAlpha = 0.85; rrect(c, 128, h - 46, 70, 26, 3); stripes(c, 128, h - 46, 70, 26, false); c.restore();
      c.fillStyle = '#20140c'; circ(c, 163, h - 33, 7); c.fill(); c.fillStyle = GOLD; circ(c, 163, h - 33, 4.5); c.fill();
      // speakers (sound system) links
      const spk = (sx, sy, s) => { c.fillStyle = '#1a1620'; rrect(c, sx, sy, s, s, 3); c.fill(); c.fillStyle = '#3a3440'; circ(c, sx + s / 2, sy + s / 2, s * 0.36); c.fill(); c.fillStyle = '#111'; circ(c, sx + s / 2, sy + s / 2, s * 0.16); c.fill(); };
      spk(6, h - 34, 32); spk(6, h - 66, 32); spk(40, h - 28, 26); spk(w - 38, h - 34, 32);
      // straat
      c.fillStyle = '#3a3346'; c.fillRect(0, h - 4, w, pad + 4);
      c.fillStyle = '#8a8296'; c.fillRect(0, h - 4, w, 3);
      c.fillStyle = GOLD; for (let xx = 10; xx < w; xx += 40) c.fillRect(xx, h + pad * 0.55, 20, 2);
    } else {                 // ruimte
      let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05061a'); g.addColorStop(1, '#1a1440');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let k = 0; k < 140; k++) { c.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; circ(c, R() * w, R() * h * 0.9, R() * 1.2 + 0.2); c.fill(); }
      // nevel
      g = c.createRadialGradient(w * 0.3, h * 0.3, 5, w * 0.3, h * 0.3, 150); g.addColorStop(0, 'rgba(160,80,200,.35)'); g.addColorStop(1, 'rgba(160,80,200,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      // planeet met ring
      c.fillStyle = '#e8a04a'; circ(c, w * 0.18, h * 0.24, 26); c.fill();
      c.fillStyle = 'rgba(160,80,30,.5)'; c.fillRect(w * 0.18 - 26, h * 0.24 - 6, 52, 5); c.fillRect(w * 0.18 - 24, h * 0.24 + 6, 48, 4);
      c.strokeStyle = 'rgba(255,220,170,.8)'; c.lineWidth = 3; ell(c, w * 0.18, h * 0.24, 44, 9, -0.25); c.stroke();
      c.fillStyle = '#cfd6e8'; circ(c, w * 0.85, h * 0.45, 14); c.fill(); c.fillStyle = 'rgba(120,130,160,.6)'; circ(c, w * 0.85 - 4, h * 0.45 - 3, 3); c.fill(); circ(c, w * 0.85 + 5, h * 0.45 + 4, 2); c.fill();
      // rasta-ufo
      c.save(); c.translate(w * 0.72, h * 0.16);
      c.fillStyle = 'rgba(180,255,200,.25)'; c.beginPath(); c.moveTo(-10, 6); c.lineTo(10, 6); c.lineTo(22, 60); c.lineTo(-22, 60); c.closePath(); c.fill();
      c.fillStyle = '#a8e8ff'; ell(c, 0, -4, 12, 10); c.fill();
      c.fillStyle = '#9aa3b8'; ell(c, 0, 4, 30, 8); c.fill(); c.fillStyle = '#6a7388'; ell(c, 0, 7, 24, 4); c.fill();
      RASTA.forEach((col, i) => { c.fillStyle = col; circ(c, -16 + i * 16, 4, 3); c.fill(); });
      c.restore();
      // maangrond
      c.fillStyle = '#5a5870'; c.beginPath(); c.moveTo(0, h - 8); for (let xx = 0; xx <= w; xx += 25) c.lineTo(xx, h - 8 - R() * 8); c.lineTo(w, h + pad); c.lineTo(0, h + pad); c.closePath(); c.fill();
      c.fillStyle = '#46445a'; for (let k = 0; k < 9; k++) { ell(c, R() * w, h + R() * pad * 0.6, 6 + R() * 8, 2 + R() * 2); c.fill(); }
    }
    c.restore();
  }
  function palm(c, x, y, dir, s) {
    c.save(); c.translate(x, y); c.scale(dir * s, s);
    c.strokeStyle = '#6b4424'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -70, 4, -150); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5;
    for (let k = 1; k < 10; k++) { const t = k / 10, px = 2 * (1 - t) * t * 14 + t * t * 4, py = -150 * t + 0; c.beginPath(); c.moveTo(px - 3, py); c.lineTo(px + 3, py - 2); c.stroke(); }
    c.translate(4, -150);
    const frond = (a, l) => { c.save(); c.rotate(a); c.fillStyle = '#1f6a34'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l * 0.5, -14, l, 8); c.quadraticCurveTo(l * 0.5, -4, 0, 0); c.fill(); c.restore(); };
    [-2.8, -2.2, -1.5, -0.9, -0.3, 0.3].forEach((a, i) => frond(a, 52 + (i % 2) * 10));
    c.fillStyle = '#5a3a18'; circ(c, -2, 4, 4); c.fill(); circ(c, 4, 5, 4); c.fill();
    c.restore();
  }
  // Plankje in de stijl van de wereld.
  function drawPlat(c, wi, x0, y0, x1, y1) {
    const w = x1 - x0, h = y1 - y0;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x0 + 2, y1, w - 2, 3);
    if (wi === 0) {           // bamboe
      c.fillStyle = '#d9b45a'; rrect(c, x0, y0, w, h, h / 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x0 + 3, y0 + 2, w - 6, 2);
      c.fillStyle = '#9c7a2a'; for (let x = x0 + 18; x < x1 - 4; x += 22) c.fillRect(x, y0, 2.5, h);
      c.strokeStyle = '#6a4a14'; c.lineWidth = 1; rrect(c, x0, y0, w, h, h / 2); c.stroke();
    } else if (wi === 1) {    // stam met mos
      c.fillStyle = '#7a4f2a'; rrect(c, x0, y0, w, h, 4); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (let x = x0 + 8; x < x1; x += 13) { c.beginPath(); c.moveTo(x, y0 + 3); c.lineTo(x + 6, y1 - 3); c.stroke(); }
      c.fillStyle = '#5fae3a'; c.beginPath(); c.moveTo(x0, y0 + 3); for (let x = x0; x <= x1; x += 6) c.lineTo(x, y0 - 2 + ((x * 7) % 4)); c.lineTo(x1, y0 + 3); c.closePath(); c.fill();
    } else if (wi === 2) {    // rij speakers
      c.fillStyle = '#1a1620'; rrect(c, x0, y0 - 2, w, h + 4, 2); c.fill();
      for (let x = x0 + 7; x < x1 - 3; x += 14) { c.fillStyle = '#3a3440'; circ(c, x, y0 + h / 2, 4.5); c.fill(); c.fillStyle = '#0a0a0a'; circ(c, x, y0 + h / 2, 1.8); c.fill(); }
      c.save(); c.fillStyle = 'rgba(0,0,0,0)'; rrect(c, x0, y0 - 2, w, 2.5, 1); stripes(c, x0, y0 - 2, w, 2.5, true); c.restore();
    } else {                  // metaal met licht
      const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#c8d0e0'); g.addColorStop(1, '#6a7388');
      c.fillStyle = g; rrect(c, x0, y0, w, h, 2); c.fill();
      c.fillStyle = '#7ff0ff'; c.fillRect(x0 + 2, y1 - 2, w - 4, 1.5);
      c.fillStyle = '#4a5268'; for (let x = x0 + 6; x < x1; x += 16) { circ(c, x, y0 + h / 2 - 1, 1.2); c.fill(); }
    }
    c.restore();
  }
  // Tussenmuur; open = 0..1 (zakt omhoog weg).
  function drawWall(c, wi, x, h, open, hw) {
    const top = 0, bot = h * (1 - open);
    if (bot <= 1) return;
    c.save();
    if (wi === 3) {
      c.fillStyle = 'rgba(127,240,255,.35)'; c.fillRect(x - hw - 2, top, hw * 2 + 4, bot);
      c.fillStyle = '#bff8ff'; c.fillRect(x - 1.2, top, 2.4, bot);
    } else {
      const col = wi === 0 ? '#c79a45' : wi === 1 ? '#6b4424' : '#8a3a2a';
      c.fillStyle = col; c.fillRect(x - hw, top, hw * 2, bot);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x - hw, top, 2, bot);
      c.fillStyle = 'rgba(0,0,0,.25)';
      if (wi === 2) for (let y = bot - 8; y > 0; y -= 8) c.fillRect(x - hw, y, hw * 2, 1.2);
      else for (let y = bot - 20; y > 0; y -= 24) c.fillRect(x - hw, y, hw * 2, 2);
    }
    // rasta-rand onderaan
    c.save(); rrect(c, x - hw - 1, bot - 6, hw * 2 + 2, 6, 1); stripes(c, x - hw - 1, bot - 6, hw * 2 + 2, 6, false); c.restore();
    c.restore();
  }

  /* ================================================================ plaatjes voor de schermen */
  const urlCache = new Map();
  function toURL(key, w, h, fn) {
    if (urlCache.has(key)) return urlCache.get(key);
    let url = '';
    try {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      fn(cv.getContext('2d'));
      url = cv.toDataURL('image/png');
    } catch (e) { url = ''; }
    urlCache.set(key, url);
    return url;
  }
  function avatarURL(ci, big) {
    const C = CHARS[ci] || CHARS[0], S = big ? 192 : 96;
    return toURL('av' + ci + (big ? 'b' : ''), S, S, c => {
      c.fillStyle = C.col; circ(c, S / 2, S / 2, S / 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; circ(c, S / 2, S / 2, S * 0.42); c.fill();
      c.save(); circ(c, S / 2, S / 2, S / 2); c.clip();
      c.translate(S / 2, S * 1.39); c.scale(S * 1.15, S * 1.15);
      drawChar(c, ci, { front: true });
      c.restore();
    });
  }
  function itemURL(id) { return toURL('it' + id, 72, 72, c => { c.translate(36, 36); c.scale(68, 68); drawItem(c, id); }); }
  function leafURL() { return toURL('leaf', 96, 96, c => { drawLeaf(c, 48, 84, 44, 0, '#2f7d2a', 'rgba(0,0,0,.3)'); }); }

  root.HIGHP_ART = { CHARS, CLOUD, RASTA, drawChar, drawPlant, drawLeaf, drawCloud, drawPuff, drawItem, drawWorld, drawPlat, drawWall, avatarURL, itemURL, leafURL };
})(typeof window !== 'undefined' ? window : globalThis);
