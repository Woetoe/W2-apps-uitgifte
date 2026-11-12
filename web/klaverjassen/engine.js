/* W2 Apps — Klaverjassen: regels, telling en computerspelers.
   Vier spelers, twee teams: plekken 0+2 (wij) en 1+3 (zij). Er wordt met de klok mee gespeeld (0 → 1 → 2 → 3).
   Kaarten: kleur + waarde, bv. 'hB' = hartenboer. Kleuren: h harten, r ruiten, s schoppen, k klaveren.
   Troef kiezen: vanaf voorhand mag iedereen troef kiezen of passen; past iedereen, dan moet voorhand (verplicht).
   Wie troef kiest speelt; dat team moet meer punten (inclusief roem) halen dan de tegenpartij, anders nat.
   Rotterdams: altijd troeven en overtroeven als je niet kunt bekennen. Amsterdams: niet als je maat de slag heeft. */
(function (root) {
  const SUITS = ['h', 'r', 's', 'k'];
  const SUIT_NAME = { h: 'Harten', r: 'Ruiten', s: 'Schoppen', k: 'Klaveren' };
  const RANKS = ['7', '8', '9', '10', 'B', 'V', 'H', 'A'];             // natuurlijke volgorde (voor roem)
  const RANK_NAME = { '7': 'zeven', '8': 'acht', '9': 'negen', '10': 'tien', B: 'boer', V: 'vrouw', H: 'heer', A: 'aas' };
  const ORDER = ['7', '8', '9', 'B', 'V', 'H', '10', 'A'];             // sterkte zonder troef (laag → hoog)
  const ORDER_T = ['7', '8', 'V', 'H', '10', 'A', '9', 'B'];           // sterkte in troef (laag → hoog)
  const PTS = { '7': 0, '8': 0, '9': 0, '10': 10, B: 2, V: 3, H: 4, A: 11 };
  const PTS_T = { '7': 0, '8': 0, '9': 14, '10': 10, B: 20, V: 3, H: 4, A: 11 };
  const suit = c => c[0], rank = c => c.slice(1);
  const team = p => p % 2;
  const partner = p => (p + 2) % 4;

  function deck() { const d = []; SUITS.forEach(s => RANKS.forEach(r => d.push(s + r))); return d; }
  function shuffle(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((rnd || Math.random)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function deal(rnd) { const d = shuffle(deck(), rnd); return [0, 1, 2, 3].map(p => sortHand(d.slice(p * 8, p * 8 + 8))); }
  function sortHand(h, trump) {
    const so = trump ? [trump].concat(SUITS.filter(s => s !== trump)) : ['s', 'h', 'k', 'r'];
    return h.slice().sort((a, b) => so.indexOf(suit(a)) - so.indexOf(suit(b)) || power(b, trump) - power(a, trump));
  }
  const power = (c, trump) => suit(c) === trump ? 100 + ORDER_T.indexOf(rank(c)) : ORDER.indexOf(rank(c));
  const points = (c, trump) => (suit(c) === trump ? PTS_T : PTS)[rank(c)];

  /** Index (in de slag) van de kaart die de slag wint. trick = [{ p, c }] */
  function winnerIdx(trick, trump) {
    const led = suit(trick[0].c);
    let best = 0;
    for (let i = 1; i < trick.length; i++) {
      const a = trick[best].c, b = trick[i].c;
      const sb = suit(b), sa = suit(a);
      if (sb === trump && sa !== trump) best = i;
      else if (sb === sa && power(b, trump) > power(a, trump)) best = i;
      else if (sb === led && sa !== led && sa !== trump) best = i;
    }
    return best;
  }

  /** Welke kaarten mag je spelen? */
  function legal(hand, trick, trump, variant) {
    if (!trick.length) return hand.slice();
    const led = suit(trick[0].c);
    const follow = hand.filter(c => suit(c) === led);
    const trumps = hand.filter(c => suit(c) === trump);
    const topTrump = trick.filter(t => suit(t.c) === trump).reduce((m, t) => Math.max(m, power(t.c, trump)), -1);
    if (led === trump) {
      if (!follow.length) return hand.slice();
      const higher = follow.filter(c => power(c, trump) > topTrump);
      return higher.length ? higher : follow;
    }
    if (follow.length) return follow;
    // niet kunnen bekennen
    if (variant === 'amsterdams') {
      const me = (trick[0].p + trick.length) % 4;
      const w = trick[winnerIdx(trick, trump)].p;
      if (w === partner(me)) return hand.slice();
    }
    if (!trumps.length) return hand.slice();
    const higher = trumps.filter(c => power(c, trump) > topTrump);
    if (higher.length) return higher;
    // niet over kunnen troeven: niet ondertroeven, tenzij je alleen nog troef hebt
    const other = hand.filter(c => suit(c) !== trump);
    return other.length ? other : trumps;
  }

  /** Roem in één slag: driekaart 20, vierkaart 50, stuk (troefheer + troefvrouw) 20, vier gelijke 100 (boeren 200). */
  function roem(cards, trump) {
    let r = 0;
    const by = {};
    cards.forEach(c => { (by[suit(c)] = by[suit(c)] || []).push(RANKS.indexOf(rank(c))); });
    Object.values(by).forEach(list => {
      list.sort((a, b) => a - b);
      let run = 1, best = 1;
      for (let i = 1; i < list.length; i++) { run = list[i] === list[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); }
      if (best >= 4) r += 50; else if (best === 3) r += 20;
    });
    if (cards.includes(trump + 'H') && cards.includes(trump + 'V')) r += 20;
    if (cards.length === 4 && cards.every(c => rank(c) === rank(cards[0]))) {
      const k = rank(cards[0]);
      if (k === 'B') r += 200; else if (['A', '10', 'H', 'V'].includes(k)) r += 100;
    }
    return r;
  }

  // ---------------------------------------------------------------- een ronde
  function newRound(dealer, rnd, opts) {
    opts = opts || {};
    const voorhand = (dealer + 1) % 4;
    return { dealer, voorhand, hands: deal(rnd), trump: null, speler: null, bids: [], turn: voorhand, phase: 'bid', trick: [], tricks: [], variant: opts.variant || 'rotterdams' };
  }
  /** Troef kiezen of passen ('pas'). */
  function bid(R, p, choice) {
    if (R.phase !== 'bid' || R.turn !== p) return false;
    const forced = R.bids.length === 4;
    if (choice === 'pas') { if (forced) return false; R.bids.push({ p, b: 'pas' }); }
    else { if (!SUITS.includes(choice)) return false; R.bids.push({ p, b: choice }); R.trump = choice; R.speler = p; R.phase = 'play'; R.turn = R.voorhand; R.hands = R.hands.map(h => sortHand(h, choice)); return true; }
    R.turn = (R.turn + 1) % 4;
    return true;
  }
  const mustChoose = R => R.phase === 'bid' && R.bids.length === 4;   // iedereen paste: voorhand moet
  function play(R, p, c) {
    if (R.phase !== 'play' || R.turn !== p) return false;
    if (!legal(R.hands[p], R.trick, R.trump, R.variant).includes(c)) return false;
    R.hands[p] = R.hands[p].filter(x => x !== c);
    R.trick.push({ p, c });
    if (R.trick.length < 4) { R.turn = (p + 1) % 4; return true; }
    const wi = winnerIdx(R.trick, R.trump), w = R.trick[wi].p;
    const cards = R.trick.map(t => t.c);
    const pts = cards.reduce((s, x) => s + points(x, R.trump), 0) + (R.tricks.length === 7 ? 10 : 0);
    R.tricks.push({ cards: R.trick, winner: w, points: pts, roem: roem(cards, R.trump) });
    R.trick = [];
    R.turn = w;
    if (R.tricks.length === 8) R.phase = 'done';
    return true;
  }
  /** Telling van een gespeelde ronde: { pts: [wij, zij], roem: [..], total: [..], nat, pit, speler } */
  function score(R) {
    const pts = [0, 0], rm = [0, 0], cnt = [0, 0];
    R.tricks.forEach(t => { pts[team(t.winner)] += t.points; rm[team(t.winner)] += t.roem; cnt[team(t.winner)]++; });
    const st = team(R.speler), ot = 1 - st;
    let pit = null;
    [0, 1].forEach(tm => { if (cnt[tm] === 8) { rm[tm] += 100; pit = tm; } });
    const total = [pts[0] + rm[0], pts[1] + rm[1]];
    const nat = total[st] <= total[ot];
    if (nat) { total[ot] = total[0] + total[1]; total[st] = 0; }
    return { pts, roem: rm, total, nat, pit, speler: R.speler, trump: R.trump };
  }

  // ---------------------------------------------------------------- computer
  function handValue(hand, s) {
    let v = 0;
    const tr = hand.filter(c => suit(c) === s);
    tr.forEach(c => { v += { B: 26, '9': 18, A: 11, '10': 8, H: 5, V: 4, '8': 3, '7': 3 }[rank(c)]; });
    v += tr.length * 6;
    hand.filter(c => suit(c) !== s).forEach(c => { if (rank(c) === 'A') v += 12; if (rank(c) === '10' && hand.includes(suit(c) + 'A')) v += 7; });
    if (tr.length >= 2 && hand.includes(s + 'H') && hand.includes(s + 'V')) v += 8;
    return v;
  }
  function chooseBid(R, p, level, rnd) {
    rnd = rnd || Math.random;
    const hand = R.hands[p];
    let best = null, bv = -1;
    SUITS.forEach(s => { const v = handValue(hand, s); if (v > bv) { bv = v; best = s; } });
    if (mustChoose(R)) return best;
    const need = level === 'easy' ? 70 + rnd() * 30 : level === 'strong' ? 74 : 78;
    return bv >= need ? best : 'pas';
  }

  // Wat iedereen kan weten: gespeelde kaarten en wie welke kleur niet meer heeft.
  function seen(R) {
    const played = new Set(), voids = [new Set(), new Set(), new Set(), new Set()];
    const scan = trick => {
      if (!trick.length) return;
      const led = suit(trick[0].c);
      trick.forEach((t, i) => {
        played.add(t.c);
        if (suit(t.c) === led) return;
        voids[t.p].add(led);
        // Rotterdams: niet bekennen en niet troeven terwijl er nog geen troef lag = geen troef meer
        if (R.variant !== 'amsterdams' && suit(t.c) !== R.trump && led !== R.trump && !trick.slice(0, i).some(x => suit(x.c) === R.trump)) voids[t.p].add(R.trump);
      });
    };
    R.tricks.forEach(t => scan(t.cards));
    scan(R.trick);
    return { played, voids };
  }
  const highestLeft = (s, R, played, hand) => {
    const ord = s === R.trump ? ORDER_T : ORDER;
    for (let i = ord.length - 1; i >= 0; i--) { const c = s + ord[i]; if (!played.has(c) && !hand.includes(c)) return c; }
    return null;
  };

  /** Snelle regels voor een kaart (gebruikt door de computer en in de simulaties van 'sterk'). */
  function heuristic(R, p, rnd) {
    const hand = R.hands[p], opts = legal(hand, R.trick, R.trump, R.variant);
    if (opts.length === 1) return opts[0];
    const T = R.trump, mine = team(p) === team(R.speler);
    const { played } = seen(R);
    const lowest = list => list.slice().sort((a, b) => points(a, T) - points(b, T) || power(a, T) - power(b, T))[0];
    if (!R.trick.length) {
      // uitkomen
      const trumps = opts.filter(c => suit(c) === T);
      if (mine && trumps.length) {
        const top = highestLeft(T, R, played, []);
        if (top && trumps.includes(top)) return top;                 // hoogste troef die nog in het spel is
        const left = 8 - [...played].filter(c => suit(c) === T).length - trumps.length;
        if (left > 0 && trumps.length >= 3 && p === R.speler) return trumps.sort((a, b) => power(b, T) - power(a, T))[0];
      }
      const winners = opts.filter(c => suit(c) !== T && highestLeft(suit(c), R, played, []) === c);
      if (winners.length) return winners.sort((a, b) => points(b, T) - points(a, T))[0];
      const side = opts.filter(c => suit(c) !== T);
      if (side.length) {
        // kort in een kleur: laag uitkomen, liefst geen tien zonder aas
        const safe = side.filter(c => !(rank(c) === '10' && !played.has(suit(c) + 'A')));
        return lowest(safe.length ? safe : side);
      }
      return lowest(opts);
    }
    const wi = winnerIdx(R.trick, T), w = R.trick[wi].p;
    const last = R.trick.length === 3;
    const partnerWins = w === partner(p);
    const trickPts = R.trick.reduce((s, t) => s + points(t.c, T), 0);
    const beats = c => winnerIdx(R.trick.concat({ p, c }), T) === R.trick.length;
    if (partnerWins) {
      // maat heeft hem: is dat veilig? Dan punten bijgooien
      const wc = R.trick[wi].c;
      const safe = last || (suit(wc) === T ? highestLeft(T, R, played, hand) === null || power(wc, T) > power(highestLeft(T, R, played, hand), T) : highestLeft(suit(wc), R, played, hand) === null || power(wc, T) > power(highestLeft(suit(wc), R, played, hand), T));
      if (safe) {
        const rich = opts.filter(c => suit(c) !== T || !['B', '9'].includes(rank(c)));
        return (rich.length ? rich : opts).sort((a, b) => points(b, T) - points(a, T))[0];
      }
    }
    const winning = opts.filter(beats);
    if (winning.length && (last || trickPts >= 10 || !partnerWins)) {
      // zo goedkoop mogelijk winnen; als laatste: met de meeste punten
      const sorted = winning.slice().sort((a, b) => power(a, T) - power(b, T));
      if (last) return winning.slice().sort((a, b) => points(b, T) - points(a, T) || power(a, T) - power(b, T))[0];
      const top = sorted[sorted.length - 1];
      const unbeatable = sorted.find(c => { const h = highestLeft(suit(c), R, played, hand); return !h || power(c, T) > power(h, T); });
      return unbeatable || (trickPts >= 10 ? top : sorted[0]);
    }
    return lowest(opts);
  }

  /** Sterk: kaarten van de anderen vaak raden (passend bij wat al bekend is) en elke keuze doorspelen. */
  function simulate(R, p, rnd, samples) {
    const opts = legal(R.hands[p], R.trick, R.trump, R.variant);
    if (opts.length === 1) return opts[0];
    const { played, voids } = seen(R);
    const unknown = deck().filter(c => !played.has(c) && !R.hands[p].includes(c));
    const need = [0, 1, 2, 3].map(q => q === p ? 0 : R.hands[q].length);
    const tot = opts.map(() => 0);
    for (let s = 0; s < samples; s++) {
      // verdelen met respect voor renonces (eenvoudig: een paar keer proberen)
      let hands = null;
      for (let tries = 0; tries < 30 && !hands; tries++) {
        const pool = shuffle(unknown, rnd), out = [[], [], [], []];
        let ok = true;
        const order = [0, 1, 2, 3].filter(q => q !== p).sort((a, b) => voids[b].size - voids[a].size);
        for (const q of order) {
          for (let i = 0; i < pool.length && out[q].length < need[q]; i++) {
            if (pool[i] && !voids[q].has(suit(pool[i]))) { out[q].push(pool[i]); pool[i] = null; }
          }
          if (out[q].length < need[q]) { ok = false; break; }
        }
        if (ok) hands = out;
      }
      if (!hands) hands = (() => { const pool = shuffle(unknown, rnd), out = [[], [], [], []]; let k = 0; [0, 1, 2, 3].forEach(q => { if (q !== p) { out[q] = pool.slice(k, k + need[q]); k += need[q]; } }); return out; })();
      opts.forEach((c, i) => {
        const S = JSON.parse(JSON.stringify(R));
        S.hands = hands.map((h, q) => q === p ? R.hands[p].slice() : h);
        play(S, p, c);
        let guard = 0;
        while (S.phase === 'play' && guard++ < 40) play(S, S.turn, heuristic(S, S.turn, rnd));
        const sc = score(S);
        tot[i] += sc.total[team(p)] - sc.total[1 - team(p)];
      });
    }
    let bi = 0; tot.forEach((v, i) => { if (v > tot[bi]) bi = i; });
    return opts[bi];
  }

  function chooseCard(R, p, level, rnd) {
    rnd = rnd || Math.random;
    const opts = legal(R.hands[p], R.trick, R.trump, R.variant);
    if (opts.length === 1) return opts[0];
    if (level === 'easy') return rnd() < .45 ? opts[Math.floor(rnd() * opts.length)] : heuristic(R, p, rnd);
    if (level === 'strong') return simulate(R, p, rnd, R.tricks.length >= 4 ? 40 : 24);
    return heuristic(R, p, rnd);
  }

  const name = c => `${SUIT_NAME[suit(c)].toLowerCase()}${RANK_NAME[rank(c)]}`;
  const api = { SUITS, SUIT_NAME, RANKS, RANK_NAME, suit, rank, team, partner, deck, shuffle, deal, sortHand, power, points, winnerIdx, legal, roem,
    newRound, bid, mustChoose, play, score, handValue, chooseBid, chooseCard, heuristic, seen, name };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KJ = api;
})(typeof window !== 'undefined' ? window : globalThis);
