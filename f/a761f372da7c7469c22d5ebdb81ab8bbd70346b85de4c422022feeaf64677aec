/* W2 Apps — kosten delen: rekenwerk (los, zodat het getest kan worden).
   Bedragen in centen. Een uitgave: { bedrag, valuta, betaald: persoonId, voor: { persoonId: gewicht } }.
   Een terugbetaling: { soort: 'terug', bedrag, valuta, betaald: van, voor: { naar: 1 } } – zelfde vorm, werkt vanzelf. */
(function (root) {
  /** Omrekenen naar de hoofdvaluta van de groep (koersen[valuta] = hoeveel hoofdvaluta voor 1 eenheid). */
  function inHoofd(u, groep) {
    if (!u.valuta || u.valuta === groep.valuta) return u.bedrag;
    const k = koers(groep, u.valuta);
    return Math.round(u.bedrag * k);
  }

  /** Verdeel centen naar gewicht; restcenten naar de grootste aandelen, zodat het altijd precies klopt. */
  function verdeel(cent, voor) {
    const ids = Object.keys(voor).filter(id => voor[id] > 0);
    const tot = ids.reduce((s, id) => s + voor[id], 0);
    if (!ids.length || !tot) return {};
    const out = {}, rest = [];
    let som = 0;
    ids.forEach(id => { const x = cent * voor[id] / tot, f = Math.floor(x); out[id] = f; som += f; rest.push([x - f, id]); });
    rest.sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : 1));
    for (let i = 0; i < cent - som; i++) out[rest[i % rest.length][1]]++;
    return out;
  }

  /** Saldo per persoon in centen: positief = krijgt geld, negatief = moet betalen. Telt altijd op tot 0. */
  function saldi(groep, uitgaven) {
    const s = {};
    (groep.mensen || []).forEach(m => { s[m.id] = 0; });
    uitgaven.forEach(u => {
      const c = inHoofd(u, groep);
      s[u.betaald] = (s[u.betaald] || 0) + c;
      const v = verdeel(c, u.voor || {});
      Object.entries(v).forEach(([id, x]) => { s[id] = (s[id] || 0) - x; });
    });
    return s;
  }

  /** Zo weinig mogelijk overboekingen om alles gelijk te trekken: [{ van, naar, bedrag }]. */
  function verrekenen(s) {
    const pos = [], neg = [];
    Object.entries(s).forEach(([id, c]) => { if (c > 0) pos.push([id, c]); else if (c < 0) neg.push([id, -c]); });
    pos.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    neg.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    const out = [];
    let i = 0, j = 0;
    while (i < neg.length && j < pos.length) {
      const x = Math.min(neg[i][1], pos[j][1]);
      if (x > 0) out.push({ van: neg[i][0], naar: pos[j][0], bedrag: x });
      neg[i][1] -= x; pos[j][1] -= x;
      if (!neg[i][1]) i++;
      if (!pos[j][1]) j++;
    }
    return out;
  }

  /** "12,50" / "12.50" / "1.234,56" / "€ 7" → centen (of NaN). */
  function leesBedrag(v) {
    let t = String(v == null ? '' : v).replace(/[€$\s]|eur|usd|nok/gi, '');
    if (!t) return NaN;
    if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(/,/g, '');
    const n = parseFloat(t);
    return isFinite(n) ? Math.round(n * 100) : NaN;
  }

  const SYMBOOL = { EUR: '€', USD: '$', GBP: '£', NOK: 'kr', SEK: 'kr', DKK: 'kr', CHF: 'CHF', ANG: 'ƒ', AWG: 'ƒ', XCG: 'Cg', JPY: '¥' };
  function geld(cent, valuta) {
    const neg = cent < 0, a = Math.abs(cent) / 100;
    const s = a.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sym = SYMBOOL[valuta || 'EUR'] || valuta;
    return (neg ? '−' : '') + (sym.length > 1 && sym !== 'kr' ? s + ' ' + sym : sym === 'kr' ? s + ' kr' : sym + ' ' + s);
  }

  /** Noodkoers als er nog geen dagkoers is (geen internet): hoeveel euro voor 1 eenheid. Nooit 1 op 1. */
  const START_KOERS = { USD: 0.91, GBP: 1.19, NOK: 0.093, SEK: 0.089, DKK: 0.134, CHF: 1.08, ANG: 0.51, AWG: 0.51, XCG: 0.51 };
  const PEG_USD = { ANG: 1.79, AWG: 1.79, XCG: 1.79 };   // Antilliaanse/Caribische gulden en florin: vast aan de dollar

  /** Koers voor een munt in deze groep: eigen/dagkoers, anders de noodkoers. */
  function koers(groep, v) {
    if (!v || v === (groep.valuta || 'EUR')) return 1;
    const k = (groep.koersen || {})[v];
    // koers 1 voor een vreemde munt kwam uit de oude versie (niet ingevuld), tenzij je hem zelf zo zette
    if (k > 0 && (k !== 1 || (groep.eigenKoers || {})[v] || !START_KOERS[v])) return k;
    return START_KOERS[v] || 1;
  }

  /** Antwoord van de koersendienst (ECB via frankfurter: { base:'EUR', date, rates:{USD:1.09,...} }) → euro per eenheid. */
  function dagkoersen(json) {
    const r = (json && json.rates) || {};
    if (!json || (json.base && json.base !== 'EUR')) return null;
    const out = {};
    Object.entries(r).forEach(([v, x]) => { if (x > 0) out[v] = rond(1 / x); });
    if (out.USD) Object.entries(PEG_USD).forEach(([v, n]) => { out[v] = rond(out.USD / n); });
    return Object.keys(out).length ? out : null;
  }
  const rond = x => Math.round(x * 1e6) / 1e6;

  /** Dagkoersen overnemen in een groep, voor elke munt die erin gebruikt wordt (niet als je die koers zelf hebt gezet).
      Alleen bij een verschil van meer dan 0,2%, zodat telefoons niet om de paar cent blijven schrijven. Geeft true bij verandering. */
  function koersenBijwerken(groep, uitgaven, dag) {
    if (!dag) return false;
    const eigen = groep.eigenKoers || {};
    const munten = new Set(uitgaven.map(u => u.valuta).filter(v => v && v !== (groep.valuta || 'EUR')));
    let veranderd = false;
    munten.forEach(v => {
      if (eigen[v] || !(dag[v] > 0)) return;
      const nu = (groep.koersen || {})[v];
      if (nu > 0 && Math.abs(nu - dag[v]) / dag[v] <= 0.002) return;
      groep.koersen = Object.assign({}, groep.koersen, { [v]: dag[v] });
      veranderd = true;
    });
    return veranderd;
  }

  /** Groep in een andere munt dan euro omzetten naar euro: elke uitgave houdt zijn eigen bedrag en munt,
      de koersen worden euro per eenheid. Geeft true als er iets veranderde. */
  function naarEuro(groep, uitgaven) {
    const oud = groep.valuta || 'EUR';
    if (oud === 'EUR') { if (!groep.valuta) { groep.valuta = 'EUR'; return true; } return false; }
    const k = groep.koersen || {};
    // Let op: de oude versie zette een euro-uitgave in een dollargroep op koers 1 (geen echte koers); die telt niet.
    const r = k.EUR > 0 && k.EUR !== 1 ? 1 / k.EUR : START_KOERS[oud] || 1;   // euro voor 1 oude eenheid
    const nieuw = { [oud]: Math.round(r * 1e6) / 1e6 };
    Object.entries(k).forEach(([v, x]) => { if (v !== 'EUR' && v !== oud && x > 0) nieuw[v] = Math.round(x * r * 1e6) / 1e6; });
    uitgaven.forEach(u => { if (!u.valuta) u.valuta = oud; });
    groep.valuta = 'EUR';
    groep.koersen = nieuw;
    delete groep.lastValuta;
    return true;
  }

  const api = { inHoofd, verdeel, saldi, verrekenen, leesBedrag, geld, naarEuro, koers, dagkoersen, koersenBijwerken, SYMBOOL, START_KOERS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Kosten = api;
})(typeof window !== 'undefined' ? window : globalThis);
