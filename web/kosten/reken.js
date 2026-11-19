/* W2 Apps — kosten delen: rekenwerk (los, zodat het getest kan worden).
   Bedragen in centen. Een uitgave: { bedrag, valuta, betaald: persoonId, voor: { persoonId: gewicht } }.
   Een terugbetaling: { soort: 'terug', bedrag, valuta, betaald: van, voor: { naar: 1 } } – zelfde vorm, werkt vanzelf. */
(function (root) {
  /** Omrekenen naar de hoofdvaluta van de groep (koersen[valuta] = hoeveel hoofdvaluta voor 1 eenheid). */
  function inHoofd(u, groep) {
    if (!u.valuta || u.valuta === groep.valuta) return u.bedrag;
    const k = (groep.koersen || {})[u.valuta];
    return Math.round(u.bedrag * (k > 0 ? k : 1));
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

  const SYMBOOL = { EUR: '€', USD: '$', GBP: '£', NOK: 'kr', SEK: 'kr', DKK: 'kr', CHF: 'CHF', ANG: 'ƒ', AWG: 'ƒ', JPY: '¥' };
  function geld(cent, valuta) {
    const neg = cent < 0, a = Math.abs(cent) / 100;
    const s = a.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sym = SYMBOOL[valuta || 'EUR'] || valuta;
    return (neg ? '−' : '') + (sym.length > 1 && sym !== 'kr' ? s + ' ' + sym : sym === 'kr' ? s + ' kr' : sym + ' ' + s);
  }

  const api = { inHoofd, verdeel, saldi, verrekenen, leesBedrag, geld, SYMBOOL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Kosten = api;
})(typeof window !== 'undefined' ? window : globalThis);
