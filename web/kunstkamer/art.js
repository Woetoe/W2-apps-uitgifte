/* Kunstkamer — tekeningen op canvas: het raster (vloer, muren, bewakers, kisten …), de kluis en de gang.
   Alles zelf getekend; de schilderijen zelf zijn rechtenvrije afbeeldingen in werken/. */
(function (root) {
  'use strict';
  const C = {
    void: '#0b0806', floorA: '#6a5d4c', floorB: '#4a4033', wallTop: '#22180f', wallFace: '#120c07', wallLine: '#3e2d1d',
    gold: '#e2b84a', goldDark: '#9a7424', light: 'rgba(255,214,120,', coat: '#24406b', coatDark: '#162a47', skin: '#e9c49f',
    hood: '#2f7a3a', hoodDark: '#1d4f25', red: '#e5533d', crate: '#9a6532', crateDark: '#5e3a1a', brass: '#b8913d'
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // afbeelding passend in (x, y, w, h), bijgesneden vanuit het midden
  function cover(ctx, img, x, y, w, h) {
    if (!img || !img.complete || !img.naturalWidth) { ctx.fillStyle = '#5a4630'; ctx.fillRect(x, y, w, h); return; }
    const ir = img.naturalWidth / img.naturalHeight, r = w / h;
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (ir > r) { sw = sh * r; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / r; sy = (img.naturalHeight - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  const ROT = { U: -Math.PI / 2, D: Math.PI / 2, L: Math.PI, R: 0 };

  /* ---------------- figuren (midden cx, cy; maat s = tegelgrootte) */
  function guard(ctx, cx, cy, s, dir, opts) {
    opts = opts || {};
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ROT[dir] || 0);
    const u = s / 40;
    // lantaarngloed
    const gl = ctx.createRadialGradient(15 * u, 0, 1, 15 * u, 0, 18 * u);
    gl.addColorStop(0, 'rgba(255,220,130,.9)'); gl.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(15 * u, 0, 18 * u, 0, Math.PI * 2); ctx.fill();
    // lijf (jas) en schouders
    ctx.fillStyle = C.coatDark; ctx.beginPath(); ctx.ellipse(0, 0, 11 * u, 15 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.coat; ctx.beginPath(); ctx.ellipse(1 * u, 0, 9.5 * u, 13.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    // arm met lantaarn
    ctx.strokeStyle = C.coat; ctx.lineWidth = 4 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(3 * u, 8 * u); ctx.lineTo(12 * u, 5 * u); ctx.stroke();
    ctx.fillStyle = '#3a2a14'; ctx.fillRect(11 * u, 1 * u, 7 * u, 8 * u);
    ctx.fillStyle = '#ffe28a'; ctx.fillRect(12.5 * u, 2.5 * u, 4 * u, 5 * u);
    // hoed (breed, zwart) met veer
    ctx.fillStyle = '#121212'; ctx.beginPath(); ctx.arc(0, 0, 8.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#262626'; ctx.beginPath(); ctx.arc(0.5 * u, 0, 5.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2efe6'; ctx.beginPath(); ctx.ellipse(-4 * u, -5 * u, 4.5 * u, 1.6 * u, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (opts.listen) {   // fluitje: vraagteken boven het hoofd
      ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(s * 0.42)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('?', cx, cy - s * 0.48); ctx.fillText('?', cx, cy - s * 0.48);
    }
  }
  function thief(ctx, cx, cy, s, dir, carrying) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ROT[dir] || 0);
    const u = s / 40;
    if (carrying) {   // schilderij op de rug
      ctx.fillStyle = C.goldDark; ctx.fillRect(-17 * u, -9 * u, 9 * u, 18 * u);
      ctx.fillStyle = C.gold; ctx.fillRect(-16 * u, -8 * u, 7 * u, 16 * u);
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-14.5 * u, -6 * u, 4 * u, 12 * u);
    }
    // cape
    ctx.fillStyle = C.hoodDark; ctx.beginPath(); ctx.ellipse(-1 * u, 0, 11 * u, 13 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.hood; ctx.beginPath(); ctx.ellipse(0, 0, 9 * u, 11.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    // kap met punt naar achter
    ctx.fillStyle = C.hoodDark; ctx.beginPath(); ctx.moveTo(-12 * u, 0); ctx.lineTo(-3 * u, -6 * u); ctx.lineTo(-3 * u, 6 * u); ctx.closePath(); ctx.fill();
    // gezicht met masker
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(3 * u, 0, 5.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#151515'; ctx.fillRect(5 * u, -5.5 * u, 3 * u, 11 * u);
    ctx.fillStyle = '#fff'; ctx.fillRect(6 * u, -3.6 * u, 1.6 * u, 2 * u); ctx.fillRect(6 * u, 1.6 * u, 1.6 * u, 2 * u);
    // rode veer
    ctx.strokeStyle = C.red; ctx.lineWidth = 2.4 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4 * u, -7 * u); ctx.quadraticCurveTo(-10 * u, -14 * u, -16 * u, -11 * u); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- het raster
     v = { g, s, pos: {x,y} van de dief (getekend, met tussenstap), dir, guards: [{x,y,dir,listen}], crates: [{x,y}],
           lit: Set, next: [{i,dir}], hint: [i], img, t, flash } */
  function grid(ctx, W, H, v) {
    const g = v.g, ts = v.ts, ox = v.ox, oy = v.oy, s = v.s;
    ctx.fillStyle = C.void; ctx.fillRect(0, 0, W, H);
    const gates = v.gatesOpen;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x, b = g.base[i], px = ox + x * ts, py = oy + y * ts;
      if (b === ' ') continue;
      if (b === '#') continue;
      // vloer: geblokt marmer zoals bij Vermeer
      ctx.fillStyle = (x + y) % 2 ? C.floorA : C.floorB; ctx.fillRect(px, py, ts, ts);
      if (g.route.has(i)) { ctx.fillStyle = 'rgba(160,190,255,.10)'; ctx.beginPath(); ctx.arc(px + ts / 2, py + ts / 2, ts * 0.08, 0, Math.PI * 2); ctx.fill(); }
      if (b === 'E') {
        ctx.fillStyle = 'rgba(111,191,115,.22)'; ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
        ctx.strokeStyle = '#6fbf73'; ctx.lineWidth = Math.max(2, ts * 0.06); ctx.strokeRect(px + ts * 0.18, py + ts * 0.12, ts * 0.64, ts * 0.76);
        ctx.fillStyle = '#bff0c1'; ctx.font = `800 ${Math.round(ts * 0.26)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('UIT', px + ts / 2, py + ts / 2);
      }
      if (b === 'o') {
        ctx.fillStyle = '#4e3d1a'; ctx.beginPath(); ctx.arc(px + ts / 2, py + ts / 2, ts * 0.34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.brass; ctx.beginPath(); ctx.arc(px + ts / 2, py + ts / 2, ts * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e6c46e'; ctx.beginPath(); ctx.arc(px + ts * 0.44, py + ts * 0.44, ts * 0.09, 0, Math.PI * 2); ctx.fill();
      }
      if (b === 'D') {
        if (v.opened.includes(i)) {
          ctx.fillStyle = '#6b3f1f'; ctx.fillRect(px, py, ts * 0.14, ts);
        } else {
          ctx.fillStyle = '#5a3418'; ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
          ctx.fillStyle = '#7a4a24'; ctx.fillRect(px + ts * 0.1, py + ts * 0.08, ts * 0.8, ts * 0.84);
          ctx.fillStyle = '#3b3b3b'; ctx.fillRect(px + ts * 0.1, py + ts * 0.25, ts * 0.8, ts * 0.07); ctx.fillRect(px + ts * 0.1, py + ts * 0.68, ts * 0.8, ts * 0.07);
          ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(px + ts * 0.5, py + ts * 0.47, ts * 0.09, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1a1a1a'; ctx.fillRect(px + ts * 0.48, py + ts * 0.47, ts * 0.04, ts * 0.1);
        }
      }
      if (b === 'H') {
        ctx.strokeStyle = gates ? 'rgba(170,170,170,.35)' : '#9a9a9a'; ctx.lineWidth = Math.max(2, ts * 0.07);
        if (gates) { ctx.beginPath(); ctx.moveTo(px + 3, py + 4); ctx.lineTo(px + ts - 3, py + 4); ctx.stroke(); }
        else { for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(px + ts * k / 5, py + 2); ctx.lineTo(px + ts * k / 5, py + ts - 2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(px + 2, py + ts * 0.3); ctx.lineTo(px + ts - 2, py + ts * 0.3); ctx.stroke(); }
      }
    }
    // muren als blokken met een lichte bovenkant
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x; if (g.base[i] !== '#') continue;
      const px = ox + x * ts, py = oy + y * ts;
      ctx.fillStyle = C.wallFace; ctx.fillRect(px, py, ts, ts);
      const below = y + 1 < g.h ? g.base[i + g.w] : '#';
      ctx.fillStyle = C.wallTop; ctx.fillRect(px, py, ts, below === '#' || below === ' ' ? ts : ts * 0.72);
      ctx.strokeStyle = C.wallLine; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, (below === '#' || below === ' ' ? ts : ts * 0.72) - 1);
    }
    // licht van de lantaarns
    v.lit.forEach(i => {
      const x = i % g.w, y = (i / g.w) | 0;
      ctx.fillStyle = C.light + (v.flash ? '.55)' : '.30)'); ctx.fillRect(ox + x * ts, oy + y * ts, ts, ts);
    });
    // volgende stap van de bewakers (pijltje)
    if (v.next) v.next.forEach(n => {
      const x = n.i % g.w, y = (n.i / g.w) | 0, cx = ox + x * ts + ts / 2, cy = oy + y * ts + ts / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ROT[n.dir] || 0);
      ctx.strokeStyle = 'rgba(160,190,255,.55)'; ctx.lineWidth = Math.max(2, ts * 0.06); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-ts * 0.1, -ts * 0.14); ctx.lineTo(ts * 0.06, 0); ctx.lineTo(-ts * 0.1, ts * 0.14); ctx.stroke();
      ctx.restore();
    });
    // route-hint van de plattegrond
    if (v.hint) v.hint.forEach((i, k) => {
      const x = i % g.w, y = (i / g.w) | 0;
      ctx.fillStyle = `rgba(226,184,74,${0.9 - k * 0.08})`; ctx.beginPath(); ctx.arc(ox + x * ts + ts / 2, oy + y * ts + ts / 2, ts * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1b1208'; ctx.font = `800 ${Math.round(ts * 0.16)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(k + 1), ox + x * ts + ts / 2, oy + y * ts + ts / 2 + 1);
    });
    // voorwerpen
    const at = i => [ox + (i % g.w) * ts, oy + ((i / g.w) | 0) * ts];
    if (!v.art && g.art >= 0) {
      const [px, py] = at(g.art), pulse = 0.5 + 0.5 * Math.sin(v.t * 4);
      ctx.fillStyle = `rgba(226,184,74,${0.15 + 0.2 * pulse})`; ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = C.goldDark; ctx.fillRect(px + ts * 0.14, py + ts * 0.1, ts * 0.72, ts * 0.8);
      ctx.fillStyle = C.gold; ctx.fillRect(px + ts * 0.18, py + ts * 0.14, ts * 0.64, ts * 0.72);
      cover(ctx, v.img, px + ts * 0.25, py + ts * 0.21, ts * 0.5, ts * 0.58);
    }
    if (!v.purse && g.purse >= 0) {
      const [px, py] = at(g.purse);
      ctx.fillStyle = '#7a5a33'; ctx.beginPath(); ctx.ellipse(px + ts / 2, py + ts * 0.58, ts * 0.24, ts * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a4022'; ctx.beginPath(); ctx.moveTo(px + ts * 0.38, py + ts * 0.3); ctx.lineTo(px + ts * 0.62, py + ts * 0.3); ctx.lineTo(px + ts * 0.56, py + ts * 0.4); ctx.lineTo(px + ts * 0.44, py + ts * 0.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(px + ts * 0.5, py + ts * 0.6, ts * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.goldDark; ctx.font = `800 ${Math.round(ts * 0.14)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', px + ts * 0.5, py + ts * 0.61);
    }
    g.keys.forEach(i => {
      if (v.taken.includes(i)) return;
      const [px, py] = at(i);
      ctx.strokeStyle = C.gold; ctx.lineWidth = Math.max(2, ts * 0.07); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(px + ts * 0.36, py + ts * 0.5, ts * 0.12, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + ts * 0.48, py + ts * 0.5); ctx.lineTo(px + ts * 0.76, py + ts * 0.5); ctx.moveTo(px + ts * 0.68, py + ts * 0.5); ctx.lineTo(px + ts * 0.68, py + ts * 0.62); ctx.stroke();
    });
    v.crates.forEach(c => {
      const px = ox + c.x * ts, py = oy + c.y * ts, m = ts * 0.08;
      ctx.fillStyle = C.crateDark; ctx.fillRect(px + m, py + m, ts - 2 * m, ts - 2 * m);
      ctx.fillStyle = C.crate; ctx.fillRect(px + m * 1.8, py + m * 1.8, ts - 3.6 * m, ts - 3.6 * m);
      ctx.strokeStyle = C.crateDark; ctx.lineWidth = Math.max(2, ts * 0.06);
      ctx.beginPath(); ctx.moveTo(px + m * 1.8, py + m * 1.8); ctx.lineTo(px + ts - m * 1.8, py + ts - m * 1.8); ctx.moveTo(px + ts - m * 1.8, py + m * 1.8); ctx.lineTo(px + m * 1.8, py + ts - m * 1.8); ctx.stroke();
    });
    v.guards.forEach(gu => guard(ctx, ox + gu.x * ts + ts / 2, oy + gu.y * ts + ts / 2, ts, gu.dir, { listen: gu.listen }));
    thief(ctx, ox + v.pos.x * ts + ts / 2, oy + v.pos.y * ts + ts / 2, ts, v.dir, v.art);
    if (v.caught) {
      const x = ox + v.pos.x * ts + ts / 2, y = oy + v.pos.y * ts + ts / 2;
      ctx.fillStyle = C.red; ctx.font = `800 ${Math.round(ts * 0.6)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText('!', x, y - ts * 0.6); ctx.fillText('!', x, y - ts * 0.6);
    }
  }

  /* ---------------- de kluis: draaiknop met groen vak */
  function dial(ctx, W, H, k, fx) {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.44;
    // deur van de kluis
    const bg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.15);
    bg.addColorStop(0, '#5d6670'); bg.addColorStop(1, '#2a2f35');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1d21'; ctx.lineWidth = R * 0.04; ctx.stroke();
    // streepjes
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2 - Math.PI / 2, l = i % 5 === 0 ? 0.12 : 0.06;
      ctx.strokeStyle = i % 5 === 0 ? '#d9dee3' : '#8d959e'; ctx.lineWidth = i % 5 === 0 ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); ctx.lineTo(cx + Math.cos(a) * R * (0.92 - l), cy + Math.sin(a) * R * (0.92 - l)); ctx.stroke();
    }
    const tu = k.tumblers[k.idx];
    if (tu) {   // groen vak
      const a0 = tu.c - tu.w / 2 - Math.PI / 2, a1 = tu.c + tu.w / 2 - Math.PI / 2;
      ctx.strokeStyle = k.inZone() ? '#9ff2a2' : '#4fc25a'; ctx.lineWidth = R * 0.13; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.78, a0, a1); ctx.stroke();
    }
    // knop
    const kn = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, R * 0.05, cx, cy, R * 0.55);
    kn.addColorStop(0, '#c8ced4'); kn.addColorStop(1, '#6b737c');
    ctx.fillStyle = kn; ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#41474e'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2 + k.angle; ctx.strokeStyle = 'rgba(40,44,50,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.44, cy + Math.sin(a) * R * 0.44); ctx.lineTo(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5); ctx.stroke(); }
    // draairichting en sloten (op de knop)
    if (tu) {
      ctx.fillStyle = '#2a2f35'; ctx.font = `800 ${Math.round(R * 0.2)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tu.dir > 0 ? '↻' : '↺', cx, cy + R * 0.25);
    }
    const nT = k.tumblers.length;
    for (let i = 0; i < nT; i++) {
      const x = cx + (i - (nT - 1) / 2) * R * 0.14, y = cy - R * 0.26;
      ctx.fillStyle = i < k.idx ? '#4fc25a' : i === k.idx ? '#e2b84a' : '#41474e';
      ctx.beginPath(); ctx.arc(x, y, R * 0.045, 0, Math.PI * 2); ctx.fill();
    }
    // wijzer
    const a = k.angle - Math.PI / 2;
    ctx.strokeStyle = fx && fx.miss > 0 ? '#ff6a55' : C.gold; ctx.lineWidth = R * 0.05; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86); ctx.stroke();
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(cx, cy, R * 0.07, 0, Math.PI * 2); ctx.fill();
    if (fx && fx.hit > 0) { ctx.strokeStyle = `rgba(159,242,162,${fx.hit})`; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.arc(cx, cy, R * (1.06 + (1 - fx.hit) * 0.1), 0, Math.PI * 2); ctx.stroke(); }
  }

  /* ---------------- de gang (zijaanzicht, camera volgt de dief) */
  function corridor(ctx, W, H, gm, imgs, t) {
    const scale = W / 46;                  // 46 eenheden in beeld
    const cam = Math.max(0, Math.min(gm.len + 6 - 46, gm.x - 14));
    const X = u => (u - cam) * scale;
    const floorY = H * 0.78, ceilY = H * 0.1;
    // muur
    const wall = ctx.createLinearGradient(0, ceilY, 0, floorY);
    wall.addColorStop(0, '#2b1f17'); wall.addColorStop(1, '#3a2a1e');
    ctx.fillStyle = '#120d09'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = wall; ctx.fillRect(0, ceilY, W, floorY - ceilY);
    // lambrisering
    ctx.fillStyle = '#24170f'; ctx.fillRect(0, floorY - H * 0.12, W, H * 0.12);
    // schilderijen aan de muur (elke 11 eenheden)
    for (let u = 4; u < gm.len + 10; u += 11) {
      const x = X(u); if (x < -80 || x > W + 80) continue;
      const fw = scale * 5, fh = scale * 4.2, fy = ceilY + (floorY - ceilY) * 0.2;
      ctx.fillStyle = C.goldDark; ctx.fillRect(x - fw / 2 - 4, fy - 4, fw + 8, fh + 8);
      ctx.fillStyle = C.gold; ctx.fillRect(x - fw / 2 - 2, fy - 2, fw + 4, fh + 4);
      const im = imgs[(Math.round(u / 11)) % imgs.length];
      cover(ctx, im, x - fw / 2, fy, fw, fh);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - fw / 2, fy, fw, fh);
    }
    // vloer: zwart-wit geblokt
    for (let u = Math.floor(cam) - 1; u < cam + 48; u += 2) {
      ctx.fillStyle = Math.round(u / 2) % 2 ? '#3d3429' : '#221c16';
      ctx.fillRect(X(u), floorY, scale * 2 + 1, H - floorY);
    }
    // finish
    const fx = X(gm.len);
    ctx.fillStyle = 'rgba(111,191,115,.25)'; ctx.fillRect(fx, ceilY, W, floorY - ceilY);
    ctx.fillStyle = '#6fbf73'; ctx.fillRect(fx - 3, ceilY, 6, H - ceilY);
    // lampen
    gm.zones.forEach(z => {
      const a = X(z.a), b = X(z.b), mid = (a + b) / 2;
      if (b < -40 || a > W + 40) return;
      const st = gm.zoneState(z);
      const flick = st === 'warn' && Math.floor(t * 12) % 2 === 0;
      // vloermarkering
      ctx.fillStyle = st === 'warn' ? 'rgba(255,214,120,.22)' : 'rgba(255,214,120,.13)'; ctx.fillRect(a, floorY, b - a, H - floorY);
      ctx.strokeStyle = 'rgba(226,184,74,.55)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(a, floorY); ctx.lineTo(a, H); ctx.moveTo(b, floorY); ctx.lineTo(b, H); ctx.stroke(); ctx.setLineDash([]);
      if (st === 'on' || flick) {
        const grd = ctx.createLinearGradient(0, ceilY, 0, H);
        grd.addColorStop(0, st === 'on' ? 'rgba(255,220,130,.75)' : 'rgba(255,220,130,.35)'); grd.addColorStop(1, st === 'on' ? 'rgba(255,200,90,.35)' : 'rgba(255,200,90,.12)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(mid - scale, ceilY + 8); ctx.lineTo(mid + scale, ceilY + 8); ctx.lineTo(b, H); ctx.lineTo(a, H); ctx.closePath(); ctx.fill();
      }
      // lamp aan het plafond
      ctx.fillStyle = '#1b1510'; ctx.fillRect(mid - 2, 0, 4, ceilY + 2);
      ctx.fillStyle = st === 'on' ? '#ffe28a' : flick ? '#c9a752' : '#4a3f2c';
      ctx.beginPath(); ctx.moveTo(mid - scale * 1.1, ceilY + 10); ctx.lineTo(mid + scale * 1.1, ceilY + 10); ctx.lineTo(mid + scale * 0.6, ceilY); ctx.lineTo(mid - scale * 0.6, ceilY); ctx.closePath(); ctx.fill();
    });
    // dief van opzij
    const px = X(gm.x), s = scale * 4.2, step = gm.hold ? Math.sin(t * 14) : 0;
    ctx.save(); ctx.translate(px, floorY);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 2, s * 0.5, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d1d1d'; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.55); ctx.lineTo(-s * 0.2 * step - s * 0.08, 0); ctx.moveTo(0, -s * 0.55); ctx.lineTo(s * 0.2 * step + s * 0.1, 0); ctx.stroke();
    ctx.fillStyle = C.hoodDark; ctx.beginPath(); ctx.ellipse(-s * 0.05, -s * 0.85, s * 0.3, s * 0.42, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.hood; ctx.beginPath(); ctx.ellipse(s * 0.02, -s * 0.85, s * 0.24, s * 0.36, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(s * 0.12, -s * 1.28, s * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.hoodDark; ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 1.2); ctx.quadraticCurveTo(s * 0.05, -s * 1.7, s * 0.3, -s * 1.38); ctx.lineTo(s * 0.02, -s * 1.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#151515'; ctx.fillRect(s * 0.1, -s * 1.34, s * 0.2, s * 0.07);
    ctx.strokeStyle = C.red; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 1.42); ctx.quadraticCurveTo(-s * 0.4, -s * 1.7, -s * 0.55, -s * 1.55); ctx.stroke();
    ctx.restore();
    if (gm.inv > 0) { ctx.fillStyle = `rgba(229,83,61,${Math.min(0.45, gm.inv * 0.4)})`; ctx.fillRect(0, 0, W, H); }
    if (gm.dark > 0) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H); }
  }

  root.KUNSTKAMER_ART = { C, rr, cover, guard, thief, grid, dial, corridor };
})(typeof window !== 'undefined' ? window : globalThis);
