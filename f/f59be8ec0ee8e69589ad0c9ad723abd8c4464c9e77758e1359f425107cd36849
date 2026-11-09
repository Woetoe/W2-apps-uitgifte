/* Schaakregels en computertegenstander, zonder DOM (ook te testen met node).
   Veld: sq = rij*8 + lijn, rij 0 = rij 1 (witte kant), lijn 0 = a.
   Stukken: hoofdletter wit, kleine letter zwart (P N B R Q K), '.' is leeg. */
(function (root) {
  const START = 'RNBQKBNR' + 'PPPPPPPP' + '........'.repeat(4) + 'pppppppp' + 'rnbqkbnr';
  const isW = c => c >= 'A' && c <= 'Z';
  const colorOf = c => (c === '.' ? null : isW(c) ? 'w' : 'b');
  const rk = s => s >> 3, fl = s => s & 7;
  const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function newGame() {
    return { b: START, turn: 'w', castle: 'KQkq', ep: -1, half: 0, full: 1 };
  }
  const sqName = s => 'abcdefgh'[fl(s)] + (rk(s) + 1);

  function attacked(b, sq, by) {
    const r = rk(sq), f = fl(sq);
    const W = by === 'w';
    // pion
    const pr = W ? r - 1 : r + 1;
    if (pr >= 0 && pr < 8) for (const df of [-1, 1]) {
      const ff = f + df; if (ff < 0 || ff > 7) continue;
      if (b[pr * 8 + ff] === (W ? 'P' : 'p')) return true;
    }
    for (const [dr, df] of KN) {
      const rr = r + dr, ff = f + df; if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
      if (b[rr * 8 + ff] === (W ? 'N' : 'n')) return true;
    }
    for (const [dr, df] of KG) {
      const rr = r + dr, ff = f + df; if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
      if (b[rr * 8 + ff] === (W ? 'K' : 'k')) return true;
    }
    const slide = (dirs, a, c) => {
      for (const [dr, df] of dirs) {
        let rr = r + dr, ff = f + df;
        while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
          const p = b[rr * 8 + ff];
          if (p !== '.') { if (p === a || p === c) return true; break; }
          rr += dr; ff += df;
        }
      }
      return false;
    };
    if (slide(DIAG, W ? 'B' : 'b', W ? 'Q' : 'q')) return true;
    if (slide(ORTH, W ? 'R' : 'r', W ? 'Q' : 'q')) return true;
    return false;
  }
  function kingSq(b, c) { return b.indexOf(c === 'w' ? 'K' : 'k'); }
  function inCheck(pos, c) { c = c || pos.turn; return attacked(pos.b, kingSq(pos.b, c), c === 'w' ? 'b' : 'w'); }

  function pseudo(pos) {
    const b = pos.b, us = pos.turn, them = us === 'w' ? 'b' : 'w', out = [];
    const add = (from, to, extra) => out.push(Object.assign({ from, to, piece: b[from], cap: b[to] !== '.' ? b[to] : null }, extra || {}));
    for (let s = 0; s < 64; s++) {
      const p = b[s]; if (p === '.' || colorOf(p) !== us) continue;
      const r = rk(s), f = fl(s), t = p.toUpperCase();
      if (t === 'P') {
        const dir = us === 'w' ? 1 : -1, start = us === 'w' ? 1 : 6, last = us === 'w' ? 7 : 0;
        const r1 = r + dir;
        if (r1 >= 0 && r1 < 8) {
          const one = r1 * 8 + f;
          if (b[one] === '.') {
            if (r1 === last) for (const pr of 'QRBN') add(s, one, { promo: pr });
            else {
              add(s, one);
              const two = (r + 2 * dir) * 8 + f;
              if (r === start && b[two] === '.') add(s, two, { dbl: true });
            }
          }
          for (const df of [-1, 1]) {
            const ff = f + df; if (ff < 0 || ff > 7) continue;
            const to = r1 * 8 + ff;
            if (b[to] !== '.' && colorOf(b[to]) === them) {
              if (r1 === last) for (const pr of 'QRBN') add(s, to, { promo: pr });
              else add(s, to);
            } else if (to === pos.ep) add(s, to, { ep: true, cap: us === 'w' ? 'p' : 'P' });
          }
        }
      } else if (t === 'N' || t === 'K') {
        for (const [dr, df] of t === 'N' ? KN : KG) {
          const rr = r + dr, ff = f + df; if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
          const to = rr * 8 + ff;
          if (b[to] === '.' || colorOf(b[to]) === them) add(s, to);
        }
        if (t === 'K') {
          const home = us === 'w' ? 4 : 60;
          if (s === home && !attacked(b, s, them)) {
            const K = us === 'w' ? 'K' : 'k', Q = us === 'w' ? 'Q' : 'q';
            if (pos.castle.includes(K) && b[s + 1] === '.' && b[s + 2] === '.' && b[s + 3] === (us === 'w' ? 'R' : 'r')
                && !attacked(b, s + 1, them) && !attacked(b, s + 2, them)) add(s, s + 2, { castle: 'K' });
            if (pos.castle.includes(Q) && b[s - 1] === '.' && b[s - 2] === '.' && b[s - 3] === '.' && b[s - 4] === (us === 'w' ? 'R' : 'r')
                && !attacked(b, s - 1, them) && !attacked(b, s - 2, them)) add(s, s - 2, { castle: 'Q' });
          }
        }
      } else {
        const dirs = t === 'B' ? DIAG : t === 'R' ? ORTH : DIAG.concat(ORTH);
        for (const [dr, df] of dirs) {
          let rr = r + dr, ff = f + df;
          while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
            const to = rr * 8 + ff;
            if (b[to] === '.') add(s, to);
            else { if (colorOf(b[to]) === them) add(s, to); break; }
            rr += dr; ff += df;
          }
        }
      }
    }
    return out;
  }

  function make(pos, m) {
    const a = pos.b.split('');
    const us = pos.turn;
    let p = a[m.from];
    a[m.from] = '.';
    if (m.ep) a[m.to + (us === 'w' ? -8 : 8)] = '.';
    if (m.promo) p = us === 'w' ? m.promo : m.promo.toLowerCase();
    a[m.to] = p;
    if (m.castle === 'K') { a[m.from + 1] = a[m.from + 3]; a[m.from + 3] = '.'; }
    if (m.castle === 'Q') { a[m.from - 1] = a[m.from - 4]; a[m.from - 4] = '.'; }
    let castle = pos.castle;
    const strip = ch => { castle = castle.replace(ch, ''); };
    if (m.piece === 'K') { strip('K'); strip('Q'); }
    if (m.piece === 'k') { strip('k'); strip('q'); }
    for (const sq of [m.from, m.to]) {
      if (sq === 0) strip('Q'); if (sq === 7) strip('K'); if (sq === 56) strip('q'); if (sq === 63) strip('k');
    }
    return {
      b: a.join(''), turn: us === 'w' ? 'b' : 'w', castle,
      ep: m.dbl ? (m.from + m.to) / 2 : -1,
      half: (m.piece.toUpperCase() === 'P' || m.cap) ? 0 : pos.half + 1,
      full: pos.full + (us === 'b' ? 1 : 0)
    };
  }

  function legal(pos) {
    const us = pos.turn;
    return pseudo(pos).filter(m => !inCheck(make(pos, m), us));
  }

  function posKey(pos) {
    // ep telt alleen als er echt en passant geslagen kan worden; eenvoudig: neem het mee
    return pos.b + pos.turn + pos.castle + pos.ep;
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  function insufficient(b) {
    const pieces = b.replace(/[.Kk]/g, '');
    if (pieces === '') return true;
    if (pieces.length === 1 && /[BbNn]/.test(pieces)) return true;
    if (/^[Bb]+$/.test(pieces)) {
      // alleen lopers: remise als ze allemaal op dezelfde kleur staan
      let col = null;
      for (let s = 0; s < 64; s++) if (b[s] === 'B' || b[s] === 'b') { const c = (rk(s) + fl(s)) % 2; if (col === null) col = c; else if (c !== col) return false; }
      return true;
    }
    return false;
  }

  // status: null (doorspelen) of {type, winner}
  function status(pos, history) {
    const ms = legal(pos);
    if (!ms.length) return inCheck(pos) ? { type: 'mat', winner: pos.turn === 'w' ? 'b' : 'w' } : { type: 'pat' };
    if (pos.half >= 100) return { type: 'vijftig' };
    if (insufficient(pos.b)) return { type: 'materiaal' };
    if (history) {
      const k = hash(posKey(pos));
      let n = 0; for (const h of history) if (h === k) n++;
      if (n >= 3) return { type: 'herhaling' };
    }
    return null;
  }

  // Notatie met Nederlandse letters: K koning, D dame, T toren, L loper, P paard
  const NL = { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'P' };
  function san(pos, m) {
    let s;
    if (m.castle) s = m.castle === 'K' ? 'O-O' : 'O-O-O';
    else {
      const t = m.piece.toUpperCase();
      if (t === 'P') {
        s = (m.cap ? 'abcdefgh'[fl(m.from)] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + NL[m.promo] : '');
      } else {
        const others = legal(pos).filter(o => o.piece === m.piece && o.to === m.to && o.from !== m.from);
        let dis = '';
        if (others.length) {
          if (!others.some(o => fl(o.from) === fl(m.from))) dis = 'abcdefgh'[fl(m.from)];
          else if (!others.some(o => rk(o.from) === rk(m.from))) dis = String(rk(m.from) + 1);
          else dis = sqName(m.from);
        }
        s = NL[t] + dis + (m.cap ? 'x' : '') + sqName(m.to);
      }
    }
    const nx = make(pos, m);
    if (inCheck(nx)) s += legal(nx).length ? '+' : '#';
    return s;
  }

  /* ---------------- Computer ---------------- */
  const VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
  // Stukstabellen vanuit wit gezien, rij 8 bovenaan (eenvoudige, veelgebruikte vuistregels)
  const T = {
    P: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    N: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    B: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    R: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    Q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    K: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
    KE: [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50]
  };
  function evaluate(pos) {
    // score vanuit wie aan zet is
    const b = pos.b;
    let mat = 0, w = 0, bl = 0;
    for (let s = 0; s < 64; s++) { const p = b[s]; if (p !== '.' && p.toUpperCase() !== 'K' && p.toUpperCase() !== 'P') mat += VAL[p.toUpperCase()]; }
    const endgame = mat <= 1600;
    for (let s = 0; s < 64; s++) {
      const p = b[s]; if (p === '.') continue;
      const t = p.toUpperCase(), white = p === t;
      const tbl = t === 'K' && endgame ? T.KE : T[t];
      const idx = white ? (7 - rk(s)) * 8 + fl(s) : rk(s) * 8 + fl(s);
      const v = VAL[t] + tbl[idx];
      if (white) w += v; else bl += v;
    }
    const sc = w - bl;
    return pos.turn === 'w' ? sc : -sc;
  }
  function order(ms) {
    return ms.map(m => ({ m, k: (m.cap ? 10 * VAL[m.cap.toUpperCase()] - VAL[m.piece.toUpperCase()] / 10 + 1000 : 0) + (m.promo ? 800 : 0) }))
      .sort((a, b) => b.k - a.k).map(x => x.m);
  }

  function search(pos, maxDepth, nodeLimit, noise) {
    let nodes = 0, stop = false;
    function qs(p, alpha, beta, d) {
      nodes++;
      const stand = evaluate(p);
      if (stand >= beta) return beta;
      if (alpha < stand) alpha = stand;
      if (d <= 0) return alpha;
      const us = p.turn;
      for (const m of order(pseudo(p).filter(m => m.cap || m.promo))) {
        const n = make(p, m);
        if (inCheck(n, us)) continue;
        const sc = -qs(n, -beta, -alpha, d - 1);
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    function nega(p, depth, alpha, beta, ply) {
      if (nodes > nodeLimit) { stop = true; return 0; }
      nodes++;
      if (depth === 0) return qs(p, alpha, beta, 4);
      const ms = order(legal(p));
      if (!ms.length) return inCheck(p) ? -100000 + ply : 0;
      if (p.half >= 100) return 0;
      for (const m of ms) {
        const sc = -nega(make(p, m), depth - 1, -beta, -alpha, ply + 1);
        if (stop) return 0;
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    const root = order(legal(pos));
    if (!root.length) return null;
    let best = root[0], bestList = root;
    for (let d = 1; d <= maxDepth; d++) {
      const scored = [];
      let alpha = -Infinity;
      for (const m of bestList) {
        // ruisniveau verbreedt het venster zodat bijna-even-goede zetten een eerlijke score houden
        const sc = -nega(make(pos, m), d - 1, -Infinity, -(alpha - (noise || 0)), 1);
        if (stop) break;
        scored.push({ m, sc: sc + (noise ? Math.random() * noise : 0) });
        if (sc > alpha) alpha = sc;
      }
      if (stop && scored.length < bestList.length) {
        if (scored.length) { scored.sort((a, b) => b.sc - a.sc); if (scored[0].sc >= -Infinity) best = scored[0].m; }
        break;
      }
      scored.sort((a, b) => b.sc - a.sc);
      best = scored[0].m;
      bestList = scored.map(x => x.m);
    }
    return best;
  }

  function chooseMove(pos, level) {
    if (level === 'easy') return search(pos, 1, 20000, 120);
    if (level === 'strong') return search(pos, 4, 200000, 0);
    return search(pos, 2, 60000, 15);
  }

  const api = { START, newGame, legal, make, inCheck, attacked, status, san, posKey, hash, sqName, colorOf, evaluate, chooseMove, rk, fl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CHESS = api;
})(typeof window !== 'undefined' ? window : globalThis);
