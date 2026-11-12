/* Dampoe Wars — alle tekeningen, met de hand op canvas getekend (geen plaatjes van buiten).
   De figuurtjes zijn eigen anime-achtige personages: grote ogen, groot hoofd, klein lijfje.
   Alles in "vakjes": 1 = één vakje van het veld; de aanroeper schaalt. */
(function (root) {
  'use strict';

  const CHARS = [
    { id: 'kaito', name: 'Kaito', col: '#ff5a4a', hair: '#e8402e', hair2: '#b52a1d', eye: '#c9441f', style: 'spiky', skin: '#ffe2cc', desc: 'Stekelhaar en hoofdband' },
    { id: 'yumi', name: 'Yumi', col: '#ff6fb6', hair: '#ff8fcb', hair2: '#e0609f', eye: '#9b4dff', style: 'tails', skin: '#ffe6d6', desc: 'Twee staartjes met strikjes' },
    { id: 'ren', name: 'Ren', col: '#3f8cff', hair: '#3a6dea', hair2: '#2547a8', eye: '#2f8fff', style: 'messy', skin: '#ffe0c6', desc: 'Lange pony en een sprietje' },
    { id: 'hana', name: 'Hana', col: '#ffb21f', hair: '#ffd34a', hair2: '#e0a92a', eye: '#2fae6a', style: 'long', skin: '#ffe4cf', desc: 'Lang haar met een bloem' },
    { id: 'taro', name: 'Taro', col: '#2fbf71', hair: '#3a8f5c', hair2: '#26663f', eye: '#8a5a2b', style: 'cap', skin: '#f8d6b8', desc: 'Petje achterstevoren' },
    { id: 'mika', name: 'Mika', col: '#a77bff', hair: '#8f63f0', hair2: '#6541c0', eye: '#f2b705', style: 'cat', skin: '#ffe6d9', desc: 'Kattenoortjes' }
  ];
  const CBY = Object.fromEntries(CHARS.map((c, i) => [c.id, i]));

  const TAU = Math.PI * 2;
  const ell = (c, x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
  function rrect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const HY = -0.17, HR = 0.335;   // hoofd: midden en straal

  /* ---------------- figuurtje ----------------
     face: 1 rug (omhoog), 2 rechts, 3 voorkant (omlaag), 4 links. frame 0 stil, 1/2 stapje. */
  function drawChar(c, ci, face, frame, o) {
    const C = CHARS[ci] || CHARS[0];
    o = o || {};
    c.save();
    const back = face === 1, side = face === 2 || face === 4;
    if (face === 4) c.scale(-1, 1);
    const bob = frame ? -0.02 : 0;
    // schaduw
    c.fillStyle = 'rgba(40,25,10,.22)'; ell(c, 0, 0.41, 0.25, 0.07); c.fill();
    // voetjes
    const lo = frame === 1 ? 0.05 : frame === 2 ? -0.05 : 0;
    c.fillStyle = '#3b2f4a';
    if (side) { ell(c, -0.05 + lo, 0.38, 0.08, 0.05); c.fill(); ell(c, 0.07 - lo, 0.38, 0.08, 0.05); c.fill(); }
    else { ell(c, -0.09, 0.38 + lo * 0.6, 0.07, 0.05); c.fill(); ell(c, 0.09, 0.38 - lo * 0.6, 0.07, 0.05); c.fill(); }
    c.translate(0, bob);
    // lang haar achter het lijf
    if (!back) backHair(c, C, side);
    // lijfje
    c.fillStyle = C.col; rrect(c, -0.17, 0.03, 0.34, 0.31, 0.11); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    if (!back) { c.beginPath(); c.moveTo(-0.08, 0.04); c.lineTo(0, 0.13); c.lineTo(0.08, 0.04); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-0.17, 0.23, 0.34, 0.035);
    // armpjes
    const sw = frame === 1 ? 0.04 : frame === 2 ? -0.04 : 0;
    c.fillStyle = C.skin;
    if (side) { circ(c, 0.02 - sw * 2, 0.19, 0.06); c.fill(); }
    else { circ(c, -0.205, 0.17 + sw, 0.058); c.fill(); circ(c, 0.205, 0.17 - sw, 0.058); c.fill(); }
    // hoofd
    if (back) { hairBack(c, C); }
    else {
      c.fillStyle = C.skin; circ(c, 0, HY, HR); c.fill();
      // oortjes op de zijkant
      if (side) { ell(c, -0.12, HY + 0.02, 0.05, 0.07); c.fill(); }
      faceDraw(c, C, side ? 0.085 : 0, side, o);
      hairFront(c, C, side);
      if (o.peg) peg(c, side ? 0.2 : 0, HY + 0.14);
    }
    c.restore();
  }

  function faceDraw(c, C, ox, side, o) {
    const ey = HY + 0.075;
    const eyes = side ? [[0.05 + ox, 1], [-0.12 + ox, 0.62]] : [[-0.125, 1], [0.125, 1]];
    if (o.dead) {
      c.strokeStyle = '#3a2a3a'; c.lineWidth = 0.035; c.lineCap = 'round';
      eyes.forEach(([x, k]) => { const r = 0.05 * k; c.beginPath(); c.moveTo(x - r, ey - 0.05); c.lineTo(x + r, ey + 0.05); c.moveTo(x + r, ey - 0.05); c.lineTo(x - r, ey + 0.05); c.stroke(); });
    } else if (o.blink) {
      c.strokeStyle = '#2a1f2d'; c.lineWidth = 0.03; c.lineCap = 'round';
      eyes.forEach(([x, k]) => { c.beginPath(); c.moveTo(x - 0.065 * k, ey + 0.01); c.quadraticCurveTo(x, ey + 0.05, x + 0.065 * k, ey + 0.01); c.stroke(); });
    } else {
      eyes.forEach(([x, k]) => {
        c.fillStyle = '#fff'; ell(c, x, ey, 0.072 * k, 0.095); c.fill();
        const g = c.createLinearGradient(0, ey - 0.08, 0, ey + 0.09);
        g.addColorStop(0, '#1d1630'); g.addColorStop(0.45, C.eye); g.addColorStop(1, shade(C.eye, 0.35));
        c.fillStyle = g; ell(c, x + (side ? 0.012 : 0), ey + 0.012, 0.058 * k, 0.083); c.fill();
        c.fillStyle = '#140e1e'; ell(c, x + (side ? 0.016 : 0), ey + 0.02, 0.028 * k, 0.045); c.fill();
        c.fillStyle = '#fff'; circ(c, x - 0.022 * k, ey - 0.028, 0.024 * Math.max(0.7, k)); c.fill();
        circ(c, x + 0.022 * k, ey + 0.04, 0.012); c.fill();
        c.strokeStyle = '#21172a'; c.lineWidth = 0.028; c.lineCap = 'round';
        c.beginPath(); c.ellipse(x, ey + 0.004, 0.074 * k, 0.096, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
      });
    }
    // blosjes en mondje
    c.fillStyle = 'rgba(255,120,140,.42)';
    if (side) { ell(c, 0.13 + ox * 0.6, HY + 0.17, 0.05, 0.026); c.fill(); }
    else { ell(c, -0.2, HY + 0.17, 0.052, 0.027); c.fill(); ell(c, 0.2, HY + 0.17, 0.052, 0.027); c.fill(); }
    c.strokeStyle = '#7a3b3b'; c.lineWidth = 0.024; c.lineCap = 'round';
    const mx = side ? 0.16 : 0;
    c.beginPath();
    if (o.dead) { c.moveTo(mx - 0.035, HY + 0.24); c.quadraticCurveTo(mx, HY + 0.2, mx + 0.035, HY + 0.24); }
    else if (o.happy) { c.fillStyle = '#b5434b'; c.moveTo(mx - 0.045, HY + 0.2); c.quadraticCurveTo(mx, HY + 0.28, mx + 0.045, HY + 0.2); c.closePath(); c.fill(); }
    else { c.moveTo(mx - 0.03, HY + 0.215); c.quadraticCurveTo(mx, HY + 0.245, mx + 0.03, HY + 0.215); }
    c.stroke();
  }

  // haarkap met pony; tips = punten van de pony
  function capPath(c, side, tips, depth) {
    const r = HR + 0.04;
    c.beginPath();
    c.arc(0, HY, r, Math.PI * 1.0, Math.PI * 2.0);
    const n = tips.length, x0 = side ? -0.25 : r, x1 = side ? r + 0.02 : -r;
    if (side) {
      // zijkant: haar achter het oor naar beneden, pony vooraan
      c.lineTo(r + 0.01, HY + 0.02);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = r - t * (r - 0.0);
        c.lineTo(x + 0.02, HY - 0.02 + tips[i] * depth);
        c.lineTo(x - (r / n) * 0.5, HY - 0.1);
      }
      c.lineTo(-0.08, HY - 0.06); c.lineTo(-0.2, HY + 0.12); c.lineTo(-r, HY + 0.06);
    } else {
      c.lineTo(r, HY + 0.06);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t;
        c.lineTo(x, HY - 0.02 + tips[i] * depth);
        c.lineTo(x + (x1 - x0) / n * 0.5, HY - 0.11);
      }
      c.lineTo(-r, HY + 0.06);
    }
    c.closePath();
  }
  function hairFill(c, C) {
    const g = c.createLinearGradient(0, HY - 0.4, 0, HY + 0.1);
    g.addColorStop(0, shade(C.hair, -0.18)); g.addColorStop(1, C.hair2);
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.018; c.stroke();
  }
  function shine(c, side) {
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.03; c.lineCap = 'round';
    c.beginPath(); c.arc(side ? 0.04 : -0.04, HY - 0.06, 0.24, Math.PI * 1.18, Math.PI * 1.42); c.stroke();
  }

  function backHair(c, C, side) {
    c.save();
    if (C.style === 'long' || C.style === 'cat') {
      c.fillStyle = C.hair2;
      if (side) { rrect(c, -0.37, HY - 0.05, 0.42, 0.52, 0.16); c.fill(); }
      else { rrect(c, -0.39, HY - 0.05, 0.78, 0.5, 0.18); c.fill(); }
    }
    if (C.style === 'tails') {
      c.fillStyle = C.hair;
      if (side) { ell(c, -0.36, HY + 0.12, 0.11, 0.21, 0.35); c.fill(); }
      else { ell(c, -0.44, HY + 0.1, 0.11, 0.22, 0.3); c.fill(); ell(c, 0.44, HY + 0.1, 0.11, 0.22, -0.3); c.fill(); }
    }
    c.restore();
  }

  function hairFront(c, C, side) {
    const st = C.style;
    if (st === 'spiky') {
      // stekels omhoog
      c.beginPath();
      const sp = side ? [[-0.36, -0.1], [-0.42, -0.34], [-0.2, -0.4], [-0.18, -0.6], [0.02, -0.46], [0.12, -0.62], [0.22, -0.42], [0.42, -0.42], [0.36, -0.12]]
        : [[-0.38, -0.08], [-0.5, -0.3], [-0.28, -0.4], [-0.3, -0.62], [-0.08, -0.48], [0.02, -0.7], [0.12, -0.48], [0.32, -0.62], [0.28, -0.4], [0.5, -0.3], [0.38, -0.08]];
      c.moveTo(sp[0][0], HY + sp[0][1] + 0.1);
      sp.forEach(([x, y]) => c.lineTo(x, HY + y + 0.1));
      c.closePath(); hairFill(c, C);
      capPath(c, side, [1, 0.7, 1.1, 0.8, 1], 0.12); hairFill(c, C);
      // hoofdband
      c.fillStyle = '#f6f2ea'; c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 0.015;
      c.beginPath(); c.ellipse(0, HY - 0.03, HR + 0.045, 0.2, 0, Math.PI * 1.08, Math.PI * 1.92); c.lineTo(HR * 0.88, HY - 0.08); c.ellipse(0, HY + 0.035, HR + 0.02, 0.2, 0, Math.PI * 1.92, Math.PI * 1.08, true); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e8402e'; circ(c, side ? 0.2 : 0, HY - 0.205, 0.035); c.fill();
      shine(c, side);
    } else if (st === 'tails') {
      capPath(c, side, [0.8, 1, 0.7, 1, 0.8], 0.13); hairFill(c, C);
      // strikjes
      const bows = side ? [[-0.26, HY - 0.3]] : [[-0.33, HY - 0.26], [0.33, HY - 0.26]];
      bows.forEach(([x, y]) => {
        c.fillStyle = '#ff3d8a';
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.11, y - 0.07); c.lineTo(x - 0.11, y + 0.07); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.11, y - 0.07); c.lineTo(x + 0.11, y + 0.07); c.closePath(); c.fill();
        c.fillStyle = '#ffd0e4'; circ(c, x, y, 0.035); c.fill();
      });
      shine(c, side);
    } else if (st === 'messy') {
      capPath(c, side, [1.2, 0.6, 1.5, 1.9, 1.2], 0.12); hairFill(c, C);
      // sprietje
      c.strokeStyle = C.hair; c.lineWidth = 0.045; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0.02, HY - HR - 0.02); c.quadraticCurveTo(0.12, HY - HR - 0.22, 0.2, HY - HR - 0.12); c.stroke();
      shine(c, side);
    } else if (st === 'long') {
      capPath(c, side, [0.7, 1, 0.9, 1, 0.7], 0.11); hairFill(c, C);
      // bloem
      const fx = side ? -0.12 : 0.27, fy = HY - 0.27;
      c.fillStyle = '#fff';
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; circ(c, fx + Math.cos(a) * 0.055, fy + Math.sin(a) * 0.055, 0.045); c.fill(); }
      c.fillStyle = '#ffb21f'; circ(c, fx, fy, 0.035); c.fill();
      shine(c, side);
    } else if (st === 'cap') {
      capPath(c, side, [1, 1.2, 0.9, 1.2, 1], 0.1); hairFill(c, C);
      // pet (achterstevoren: klep achter)
      c.fillStyle = '#ff8a1f';
      c.beginPath(); c.arc(0, HY - 0.06, HR + 0.03, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();
      c.fillStyle = '#e06f0a';
      if (side) { rrect(c, -0.5, HY - 0.16, 0.2, 0.06, 0.03); c.fill(); }
      c.fillStyle = '#fff'; circ(c, side ? 0.1 : 0, HY - 0.25, 0.04); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-0.3, HY - 0.1, 0.6, 0.025);
    } else if (st === 'cat') {
      // oortjes
      const ears = side ? [[-0.05, 1]] : [[-0.22, -1], [0.22, 1]];
      ears.forEach(([x, s]) => {
        c.fillStyle = C.hair; c.beginPath(); c.moveTo(x - 0.13, HY - 0.24); c.lineTo(x + s * 0.06, HY - 0.56); c.lineTo(x + 0.13, HY - 0.24); c.closePath(); c.fill();
        c.fillStyle = '#ffb3cf'; c.beginPath(); c.moveTo(x - 0.07, HY - 0.27); c.lineTo(x + s * 0.045, HY - 0.47); c.lineTo(x + 0.07, HY - 0.27); c.closePath(); c.fill();
      });
      capPath(c, side, [0.9, 1.3, 0.8, 1.3, 0.9], 0.12); hairFill(c, C);
      shine(c, side);
    }
  }

  function hairBack(c, C) {
    // achterkant: alleen haar
    if (C.style === 'long' || C.style === 'cat') { c.fillStyle = C.hair2; rrect(c, -0.39, HY - 0.05, 0.78, 0.5, 0.18); c.fill(); }
    if (C.style === 'tails') { c.fillStyle = C.hair; ell(c, -0.44, HY + 0.1, 0.11, 0.22, 0.3); c.fill(); ell(c, 0.44, HY + 0.1, 0.11, 0.22, -0.3); c.fill(); }
    if (C.style === 'cat') {
      [[-0.22, -1], [0.22, 1]].forEach(([x, s]) => { c.fillStyle = C.hair; c.beginPath(); c.moveTo(x - 0.13, HY - 0.24); c.lineTo(x + s * 0.06, HY - 0.56); c.lineTo(x + 0.13, HY - 0.24); c.closePath(); c.fill(); });
    }
    if (C.style === 'spiky') {
      c.beginPath();
      [[-0.38, 0.02], [-0.5, -0.3], [-0.28, -0.4], [-0.3, -0.62], [-0.08, -0.48], [0.02, -0.7], [0.12, -0.48], [0.32, -0.62], [0.28, -0.4], [0.5, -0.3], [0.38, 0.02]]
        .forEach(([x, y], k) => (k ? c.lineTo(x, HY + y + 0.1) : c.moveTo(x, HY + y + 0.1)));
      c.closePath(); hairFill(c, C);
    }
    c.beginPath(); c.arc(0, HY, HR + 0.03, 0, TAU); hairFill(c, C);
    if (C.style === 'spiky') { c.fillStyle = '#f6f2ea'; c.fillRect(-HR, HY - 0.08, HR * 2, 0.08); c.fillRect(-0.05, HY - 0.04, 0.05, 0.22); c.fillRect(0.02, HY - 0.04, 0.05, 0.18); }
    if (C.style === 'cap') { c.fillStyle = '#ff8a1f'; c.beginPath(); c.arc(0, HY - 0.06, HR + 0.04, Math.PI, TAU); c.closePath(); c.fill(); c.fillStyle = '#e06f0a'; rrect(c, -0.17, HY - 0.07, 0.34, 0.1, 0.04); c.fill(); }
    if (C.style === 'tails') { c.fillStyle = '#ff3d8a'; [[-0.33, HY - 0.26], [0.33, HY - 0.26]].forEach(([x, y]) => { circ(c, x, y, 0.06); c.fill(); }); }
    c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 0.02;
    c.beginPath(); c.moveTo(0, HY - 0.3); c.quadraticCurveTo(-0.05, HY, 0, HY + 0.3); c.stroke();
  }

  // wasknijper op de neus
  function peg(c, x, y) {
    c.save(); c.translate(x, y); c.rotate(-0.25);
    c.fillStyle = '#d9a35b'; c.strokeStyle = '#8d5f26'; c.lineWidth = 0.012;
    rrect(c, -0.035, -0.02, 0.07, 0.2, 0.03); c.fill(); c.stroke();
    rrect(c, -0.035, -0.18, 0.07, 0.17, 0.03); c.fill(); c.stroke();
    c.fillStyle = '#a7b0bb'; circ(c, 0, -0.01, 0.03); c.fill();
    c.restore();
  }

  /* ---------------- scheet (gelegd) ---------------- */
  function drawFart(c, t, fuseLeft, col) {
    const k = Math.max(0, Math.min(1, fuseLeft / 150));
    const rate = 5 + (1 - k) * 16;
    const pulse = 1 + 0.06 * Math.sin(t * rate) + (1 - k) * 0.08;
    const hot = fuseLeft < 45 && Math.sin(t * 30) > 0;
    c.save();
    c.fillStyle = 'rgba(40,25,10,.2)'; ell(c, 0, 0.36, 0.3, 0.07); c.fill();
    c.scale(pulse, pulse);
    const puffs = [[-0.15, 0.1, 0.19], [0.15, 0.1, 0.19], [0, -0.04, 0.25], [-0.2, -0.06, 0.12], [0.21, -0.03, 0.12]];
    c.fillStyle = '#5b6d1c';
    puffs.forEach(([x, y, r]) => { circ(c, x, y, r + 0.035); c.fill(); });
    c.fillStyle = hot ? '#e2d04a' : '#a9cf45';
    puffs.forEach(([x, y, r]) => { circ(c, x, y, r); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.35)'; circ(c, -0.07, -0.12, 0.08); c.fill();
    // gezichtje
    c.fillStyle = '#2d3a0c';
    ell(c, -0.07, 0.02, 0.028, 0.04); c.fill(); ell(c, 0.07, 0.02, 0.028, 0.04); c.fill();
    c.strokeStyle = '#2d3a0c'; c.lineWidth = 0.025; c.lineCap = 'round';
    c.beginPath(); c.arc(0, 0.08, 0.05, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    // eigenaar: gekleurd stipje
    if (col) { c.fillStyle = col; circ(c, 0.2, 0.17, 0.05); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 0.02; c.stroke(); }
    c.restore();
    // stinklijntjes
    c.strokeStyle = 'rgba(110,140,40,.75)'; c.lineWidth = 0.035; c.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const ph = (t * 1.6 + i * 0.33) % 1, y0 = -0.3 - ph * 0.3;
      c.globalAlpha = 1 - ph;
      c.beginPath(); c.moveTo(i * 0.13, y0);
      c.bezierCurveTo(i * 0.13 + 0.06, y0 - 0.06, i * 0.13 - 0.06, y0 - 0.1, i * 0.13, y0 - 0.16); c.stroke();
    }
    c.globalAlpha = 1;
  }

  /* ---------------- stinkwolk (één vakje) ---------------- */
  function drawCloud(c, stage, seed, t) {
    const k = stage / 4;
    const h = n => { const s = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return s - Math.floor(s); };
    c.save();
    c.globalAlpha = 0.45 + 0.5 * k;
    const r = 0.3 + 0.16 * k;
    const pts = [[0, 0], [-0.22, -0.18], [0.22, -0.16], [-0.2, 0.2], [0.21, 0.18]];
    c.fillStyle = '#7fae2e';
    pts.forEach(([x, y], i) => { circ(c, x + (h(i) - 0.5) * 0.12, y + (h(i + 9) - 0.5) * 0.12 + Math.sin(t * 3 + i) * 0.02, r * (0.8 + h(i + 3) * 0.3)); c.fill(); });
    c.fillStyle = '#c6e86a';
    pts.forEach(([x, y], i) => { circ(c, x * 0.8 + (h(i) - 0.5) * 0.1, y * 0.8 + (h(i + 9) - 0.5) * 0.1 - 0.03, r * 0.62 * (0.8 + h(i + 3) * 0.3)); c.fill(); });
    c.fillStyle = 'rgba(255,255,230,.5)'; circ(c, -0.05, -0.08, r * 0.3); c.fill();
    // kringeltjes
    c.strokeStyle = 'rgba(70,95,20,.55)'; c.lineWidth = 0.03;
    c.beginPath(); c.arc((h(5) - 0.5) * 0.3, (h(6) - 0.5) * 0.3, 0.08, t * 4 + seed, t * 4 + seed + 4.2); c.stroke();
    c.restore();
  }

  /* ---------------- vakjes ---------------- */
  function drawFloor(c, x, y) {
    c.fillStyle = (x + y) % 2 ? '#e7d8a6' : '#efe2b6'; c.fillRect(-0.5, -0.5, 1, 1);
    c.strokeStyle = 'rgba(150,120,60,.18)'; c.lineWidth = 0.02;
    c.beginPath(); c.moveTo(-0.5, -0.2); c.lineTo(0.5, -0.2); c.moveTo(-0.5, 0.2); c.lineTo(0.5, 0.2); c.stroke();
  }
  function drawHard(c, border, shrink) {
    c.fillStyle = shrink ? '#5d4a5f' : border ? '#4a4f5c' : '#626a7a'; c.fillRect(-0.5, -0.5, 1, 1);
    c.fillStyle = shrink ? '#7a6280' : border ? '#5d6373' : '#7c8597'; rrect(c, -0.44, -0.46, 0.88, 0.8, 0.08); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-0.4, -0.42, 0.8, 0.08);
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(-0.5, 0.36, 1, 0.14);
    if (shrink) { c.strokeStyle = 'rgba(255,220,120,.5)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(-0.3, -0.25); c.lineTo(0.3, 0.2); c.moveTo(0.3, -0.25); c.lineTo(-0.3, 0.2); c.stroke(); }
  }
  function drawCrate(c) {
    c.fillStyle = 'rgba(40,25,10,.2)'; c.fillRect(-0.44, 0.34, 0.9, 0.12);
    c.fillStyle = '#b97a3a'; rrect(c, -0.45, -0.42, 0.9, 0.82, 0.06); c.fill();
    c.fillStyle = '#d39a55'; rrect(c, -0.45, -0.42, 0.9, 0.3, 0.06); c.fill();
    c.fillStyle = '#e9c27f'; c.fillRect(-0.08, -0.42, 0.16, 0.82);
    c.strokeStyle = 'rgba(90,50,15,.45)'; c.lineWidth = 0.03;
    c.beginPath(); c.moveTo(-0.45, -0.12); c.lineTo(0.45, -0.12); c.stroke();
    c.strokeStyle = 'rgba(90,50,15,.35)'; c.lineWidth = 0.025;
    rrect(c, -0.45, -0.42, 0.9, 0.82, 0.06); c.stroke();
  }

  /* ---------------- power-ups ---------------- */
  function drawItem(c, id) {
    c.fillStyle = 'rgba(40,25,10,.2)'; ell(c, 0, 0.38, 0.28, 0.06); c.fill();
    c.fillStyle = '#fff7e2'; rrect(c, -0.38, -0.38, 0.76, 0.76, 0.16); c.fill();
    c.strokeStyle = '#e0a52e'; c.lineWidth = 0.05; c.stroke();
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (id === 'bonen') {
      c.fillStyle = '#c2c8d0'; rrect(c, -0.2, -0.24, 0.4, 0.48, 0.05); c.fill();
      c.fillStyle = '#e8622c'; c.fillRect(-0.2, -0.13, 0.4, 0.27);
      c.fillStyle = '#a24b1c';
      [[-0.09, -0.04], [0.02, 0.03], [0.1, -0.05], [-0.04, 0.07]].forEach(([x, y]) => { ell(c, x, y, 0.045, 0.03, 0.5); c.fill(); });
      c.fillStyle = '#9aa2ad'; c.fillRect(-0.2, -0.24, 0.4, 0.04);
    } else if (id === 'spruit') {
      c.fillStyle = '#4c9a2a'; circ(c, 0, 0.02, 0.22); c.fill();
      c.fillStyle = '#7cc64a'; circ(c, -0.04, -0.02, 0.15); c.fill();
      c.strokeStyle = '#2f6b18'; c.lineWidth = 0.03;
      c.beginPath(); c.arc(0.02, 0.02, 0.16, -2.4, -0.4); c.stroke();
      c.beginPath(); c.arc(-0.02, 0.06, 0.13, 2.6, 4.2); c.stroke();
      c.fillStyle = '#e9f6d6'; c.font = '700 0.22px sans-serif';
    } else if (id === 'peper') {
      c.strokeStyle = '#d4231c'; c.lineWidth = 0.16;
      c.beginPath(); c.moveTo(-0.16, -0.12); c.quadraticCurveTo(0.12, -0.08, 0.14, 0.2); c.stroke();
      c.strokeStyle = '#ff6a5c'; c.lineWidth = 0.04;
      c.beginPath(); c.moveTo(-0.12, -0.15); c.quadraticCurveTo(0.08, -0.13, 0.1, 0.05); c.stroke();
      c.strokeStyle = '#3d8a24'; c.lineWidth = 0.06;
      c.beginPath(); c.moveTo(-0.2, -0.14); c.lineTo(-0.27, -0.24); c.stroke();
    } else if (id === 'sneaker') {
      c.fillStyle = '#ffffff'; c.strokeStyle = '#3a4252'; c.lineWidth = 0.03;
      c.beginPath(); c.moveTo(-0.26, 0.12); c.lineTo(-0.24, -0.12); c.lineTo(-0.06, -0.12); c.lineTo(0.02, 0); c.quadraticCurveTo(0.26, 0.02, 0.28, 0.12); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#3f8cff'; c.beginPath(); c.moveTo(-0.18, 0.06); c.quadraticCurveTo(0, -0.02, 0.16, 0.06); c.lineTo(-0.18, 0.1); c.closePath(); c.fill();
      c.fillStyle = '#3a4252'; c.fillRect(-0.27, 0.12, 0.56, 0.05);
      c.strokeStyle = '#3f8cff'; c.lineWidth = 0.03;
      c.beginPath(); c.moveTo(-0.34, -0.06); c.lineTo(-0.4, -0.06); c.moveTo(-0.32, 0.03); c.lineTo(-0.4, 0.03); c.stroke();
    } else if (id === 'trap') {
      c.fillStyle = '#7a4a2a'; c.strokeStyle = '#3d2412'; c.lineWidth = 0.025;
      c.beginPath(); c.moveTo(-0.24, -0.24); c.lineTo(-0.06, -0.24); c.lineTo(-0.06, 0.02); c.quadraticCurveTo(0.16, 0.02, 0.18, 0.14); c.lineTo(-0.24, 0.14); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#a9cf45'; circ(c, 0.24, -0.06, 0.08); c.fill();
      c.strokeStyle = '#5b6d1c'; c.lineWidth = 0.02; c.stroke();
      c.strokeStyle = '#e0a52e'; c.lineWidth = 0.03;
      c.beginPath(); c.moveTo(0.06, -0.12); c.lineTo(0.12, -0.18); c.moveTo(0.08, -0.04); c.lineTo(0.14, -0.06); c.stroke();
    } else if (id === 'knijper') {
      c.rotate(0.6);
      c.fillStyle = '#d9a35b'; c.strokeStyle = '#8d5f26'; c.lineWidth = 0.02;
      rrect(c, -0.06, -0.3, 0.12, 0.6, 0.05); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(141,95,38,.6)'; c.beginPath(); c.moveTo(0, -0.3); c.lineTo(0, 0.3); c.stroke();
      c.fillStyle = '#a7b0bb'; circ(c, 0, 0.02, 0.06); c.fill();
    }
    c.restore();
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v + (255 - v) * -amt : v * (1 - amt))));
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /* ---------------- losse plaatjes (voor menu's) ---------------- */
  const urlCache = {};
  function toURL(key, w, h, fn) {
    if (urlCache[key]) return urlCache[key];
    try {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const c = cv.getContext('2d'); fn(c);
      return (urlCache[key] = cv.toDataURL());
    } catch (e) { return ''; }
  }
  // hoofdje (rond plaatje voor lijsten en de stand)
  function avatarURL(ci, happy) {
    return toURL('av' + ci + (happy ? 'h' : ''), 96, 96, c => {
      const C = CHARS[ci];
      c.fillStyle = shade(C.col, 0.55); c.beginPath(); c.arc(48, 48, 48, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(48, 48, 48, 0, TAU); c.clip();
      c.translate(48, 64); c.scale(92, 92); drawChar(c, ci, 3, 0, { happy });
      c.restore();
    });
  }
  function itemURL(id) { return toURL('it' + id, 64, 64, c => { c.translate(32, 30); c.scale(64, 64); drawItem(c, id); }); }
  function fartURL() { return toURL('fart', 64, 64, c => { c.translate(32, 36); c.scale(56, 56); drawFart(c, 0.3, 150, null); }); }

  root.DAMPOE_ART = { CHARS, CBY, drawChar, drawFart, drawCloud, drawFloor, drawHard, drawCrate, drawItem, avatarURL, itemURL, fartURL, shade, rrect };
})(typeof window !== 'undefined' ? window : globalThis);
