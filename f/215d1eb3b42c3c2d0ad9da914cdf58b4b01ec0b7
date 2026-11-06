/* Backgammon-regels en computertegenstander. Geen DOM: ook te testen met node.
   Bord: p[0..23]. Positief = speler 0 (beweegt van 23 naar 0, thuisbord 0..5),
   negatief = speler 1 (beweegt van 0 naar 23, thuisbord 18..23).
   Een zet = {from, to, die, hit}. from = BAR (-1) vanaf de bar, to = OFF (-2) eraf spelen. */
(function (root) {
  const BAR = -1, OFF = -2;

  function newBoard() {
    const p = Array(24).fill(0);
    p[23] = 2; p[12] = 5; p[7] = 3; p[5] = 5;
    p[0] = -2; p[11] = -5; p[16] = -3; p[18] = -5;
    return { p, bar: [0, 0], off: [0, 0] };
  }
  const clone = b => ({ p: b.p.slice(), bar: b.bar.slice(), off: b.off.slice() });
  const sgn = pl => (pl === 0 ? 1 : -1);
  const own = (b, pl, i) => Math.max(0, b.p[i] * sgn(pl));
  const opp = (b, pl, i) => Math.max(0, -b.p[i] * sgn(pl));
  const entry = (pl, d) => (pl === 0 ? 24 - d : d - 1);
  const dest = (pl, i, d) => (pl === 0 ? i - d : i + d);
  // afstand tot eraf, vanuit dit punt (1..24)
  const pipOf = (pl, i) => (pl === 0 ? i + 1 : 24 - i);

  function allHome(b, pl) {
    if (b.bar[pl]) return false;
    for (let i = 0; i < 24; i++) {
      if (own(b, pl, i) && pipOf(pl, i) > 6) return false;
    }
    return true;
  }

  function singleMoves(b, pl, d) {
    const out = [];
    if (b.bar[pl] > 0) {
      const t = entry(pl, d);
      if (opp(b, pl, t) <= 1) out.push({ from: BAR, to: t, die: d, hit: opp(b, pl, t) === 1 });
      return out;
    }
    const home = allHome(b, pl);
    for (let i = 0; i < 24; i++) {
      if (!own(b, pl, i)) continue;
      const t = dest(pl, i, d);
      if (t >= 0 && t <= 23) {
        if (opp(b, pl, t) <= 1) out.push({ from: i, to: t, die: d, hit: opp(b, pl, t) === 1 });
      } else if (home) {
        const pip = pipOf(pl, i);
        if (pip === d) out.push({ from: i, to: OFF, die: d, hit: false });
        else if (pip < d) {
          // met een hoger getal mag je alleen eraf als er geen schijf verder weg staat
          let further = false;
          for (let j = 0; j < 24; j++) if (own(b, pl, j) && pipOf(pl, j) > pip) { further = true; break; }
          if (!further) out.push({ from: i, to: OFF, die: d, hit: false });
        }
      }
    }
    return out;
  }

  function applyMove(b, pl, m) {
    const n = clone(b), s = sgn(pl);
    if (m.from === BAR) n.bar[pl]--; else n.p[m.from] -= s;
    if (m.to === OFF) n.off[pl]++;
    else {
      if (n.p[m.to] === -s) { n.p[m.to] = 0; n.bar[1 - pl]++; }
      n.p[m.to] += s;
    }
    return n;
  }

  const moveKey = m => m.from + '>' + m.to + '/' + m.die;
  const sameMove = (a, b) => a.from === b.from && a.to === b.to && a.die === b.die;
  const boardKey = b => b.p.join(',') + '|' + b.bar.join(',') + '|' + b.off.join(',');

  /* Alle toegestane zetreeksen. Regels: zoveel mogelijk dobbelstenen gebruiken;
     kan maar één van twee verschillende stenen, dan de hoogste als dat kan. */
  function legalSequences(b, pl, dice) {
    const isDouble = dice.length === 2 && dice[0] === dice[1];
    const pool = isDouble ? [dice[0], dice[0], dice[0], dice[0]] : dice.slice();
    const seqs = [];
    const seen = new Set();
    let maxLen = 0;
    function rec(board, left, seq) {
      let any = false;
      const tried = new Set();
      for (let k = 0; k < left.length; k++) {
        const d = left[k];
        if (tried.has(d)) continue;
        tried.add(d);
        const rest = left.slice(0, k).concat(left.slice(k + 1));
        for (const m of singleMoves(board, pl, d)) {
          any = true;
          rec(applyMove(board, pl, m), rest, seq.concat([m]));
        }
      }
      if (!any) {
        if (seq.length < maxLen) return;
        const key = seq.map(moveKey).join(' ');
        if (seen.has(key)) return;
        seen.add(key);
        if (seq.length > maxLen) maxLen = seq.length;
        seqs.push(seq);
      }
    }
    rec(b, pool, []);
    let res = seqs.filter(s => s.length === maxLen);
    if (!isDouble && maxLen === 1 && dice[0] !== dice[1]) {
      const hi = Math.max(dice[0], dice[1]);
      if (res.some(s => s[0].die === hi)) res = res.filter(s => s[0].die === hi);
    }
    return { seqs: res, maxLen };
  }

  // Reeksen die passen bij wat al gespeeld is
  function remaining(all, played) {
    return all.filter(s => played.every((m, i) => s[i] && sameMove(s[i], m)));
  }

  /* Bestemmingen vanaf een punt (ook gecombineerde zetten met dezelfde schijf).
     Geeft Map: doel -> lijst zetten. */
  function targetsFrom(rem, playedLen, from) {
    const out = new Map();
    for (const s of rem) {
      let cur = from, path = [];
      for (let k = playedLen; k < s.length; k++) {
        if (s[k].from !== cur) break;
        path = path.concat([s[k]]);
        const to = s[k].to;
        const prev = out.get(to);
        if (!prev || prev.length > path.length) out.set(to, path);
        if (to === OFF) break;
        cur = to;
      }
    }
    return out;
  }

  function sources(rem, playedLen) {
    const set = new Set();
    for (const s of rem) if (s[playedLen]) set.add(s[playedLen].from);
    return set;
  }

  function pips(b, pl) {
    let n = b.bar[pl] * 25;
    for (let i = 0; i < 24; i++) n += own(b, pl, i) * pipOf(pl, i);
    return n;
  }

  // Uitslag als speler pl net alles eraf heeft: 1 = gewoon, 2 = gammon, 3 = backgammon
  function winKind(b, winner) {
    const loser = 1 - winner;
    if (b.off[loser] > 0) return 1;
    if (b.bar[loser] > 0) return 3;
    for (let i = 0; i < 24; i++) if (own(b, loser, i) && pipOf(winner, i) <= 6) return 3;
    return 2;
  }

  function contact(b) {
    // is er nog contact? (kan iemand nog geslagen worden)
    if (b.bar[0] || b.bar[1]) return true;
    let back0 = -1, back1 = 24;
    for (let i = 0; i < 24; i++) {
      if (b.p[i] > 0) back0 = Math.max(back0, i);
      if (b.p[i] < 0) back1 = Math.min(back1, i);
    }
    return back0 > back1;
  }

  /* ---------------- Computer ---------------- */
  // kans dat een losse schijf op afstand d (in ogen) geraakt wordt met één worp (ruw)
  const HIT = [0, 11, 12, 14, 15, 15, 17, 6, 6, 5, 3, 2, 3, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1].map(x => x / 36);

  function evaluate(b, pl) {
    const o = 1 - pl;
    const myPip = pips(b, pl), opPip = pips(b, o);
    if (b.off[pl] === 15) return 10000;
    if (!contact(b)) {
      return (opPip - myPip) * 2 + b.off[pl] * 3 - b.off[o] * 3;
    }
    let score = (opPip - myPip) * 0.6;
    score += b.bar[o] * 9 - b.bar[pl] * 9;
    score += b.off[pl] * 2;

    // gemaakte punten, prime, ankers
    let run = 0, bestRun = 0;
    for (let n = 1; n <= 24; n++) {
      const i = pl === 0 ? n - 1 : 24 - n; // n = eigen nummering
      const c = own(b, pl, i);
      if (c >= 2) {
        score += 1.5;
        if (n <= 6) score += 2.5;
        if (n === 5 || n === 4 || n === 7) score += 2;
        if (n >= 19) score += 2.5; // anker bij de tegenstander
        if (c > 4) score -= (c - 4) * 0.6; // te hoge stapel
        run++; bestRun = Math.max(bestRun, run);
      } else run = 0;
    }
    score += bestRun >= 3 ? bestRun * bestRun * 0.9 : 0;

    // losse schijven en hoe makkelijk ze geraakt worden
    for (let i = 0; i < 24; i++) {
      if (own(b, pl, i) !== 1) continue;
      let p = 0;
      const shooters = [];
      for (let j = 0; j < 24; j++) {
        if (!opp(b, pl, j)) continue;
        const d = pl === 0 ? i - j : j - i; // tegenstander beweegt de andere kant op
        if (d > 0 && d < HIT.length) shooters.push(d);
      }
      if (b.bar[o]) {
        const d = pl === 0 ? i + 1 : 24 - i; // tegenstander komt binnen vanaf de rand
        if (d > 0 && d <= 6) shooters.push(d);
      }
      const uniq = [...new Set(shooters)];
      for (const d of uniq) p += HIT[d];
      p = Math.min(1, p);
      const lost = 25 - pipOf(pl, i); // afgelegde weg die je kwijtraakt
      score -= p * (6 + lost * 0.35);
    }
    return score;
  }

  function chooseMove(b, pl, dice, level) {
    const { seqs } = legalSequences(b, pl, dice);
    if (!seqs.length || !seqs[0].length) return [];
    if (level === 'easy') {
      // vooral willekeurig, maar slaat graag
      const hitting = seqs.filter(s => s.some(m => m.hit));
      const pool = hitting.length && rnd(3) === 0 ? hitting : seqs;
      return pool[rnd(pool.length)];
    }
    let best = null, bestScore = -Infinity;
    const done = new Map();
    for (const s of seqs) {
      let nb = b;
      for (const m of s) nb = applyMove(nb, pl, m);
      const k = boardKey(nb);
      if (done.has(k)) continue;
      const sc = evaluate(nb, pl) + Math.random() * 0.05;
      done.set(k, sc);
      if (sc > bestScore) { bestScore = sc; best = s; }
    }
    return best;
  }

  // Verdubbelen: grof op basis van pips en positie
  function cubeLead(b, pl) {
    const my = pips(b, pl), op = pips(b, 1 - pl);
    return (op - my) / Math.max(1, my);
  }
  function aiShouldDouble(b, pl, level) {
    if (level === 'easy') return false;
    const lead = cubeLead(b, pl);
    if (!contact(b)) return lead > 0.08 && pips(b, pl) < 120;
    return lead > 0.12 && b.bar[1 - pl] >= 1 || lead > 0.2;
  }
  function aiShouldTake(b, pl, level) {
    if (level === 'easy') return true;
    const lead = cubeLead(b, 1 - pl); // voorsprong van de verdubbelaar
    if (!contact(b)) return lead < 0.12;
    return lead < 0.25;
  }

  function rnd(n) {
    if (root.crypto && root.crypto.getRandomValues) {
      const a = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n;
      let x; do { root.crypto.getRandomValues(a); x = a[0]; } while (x >= lim);
      return x % n;
    }
    return Math.floor(Math.random() * n);
  }
  const rollDie = () => rnd(6) + 1;

  const api = {
    BAR, OFF, newBoard, clone, own, opp, pips, pipOf, allHome, singleMoves, applyMove,
    legalSequences, remaining, targetsFrom, sources, sameMove, winKind, contact,
    evaluate, chooseMove, aiShouldDouble, aiShouldTake, rollDie, rnd
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BGE = api;
})(typeof window !== 'undefined' ? window : globalThis);
