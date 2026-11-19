/* Tickets bij Reizen: alles met een scanbare code (instapkaart, treinkaartje, toegangsbewijs) als kaart, zoals een wallet.
   - Uit een pdf of screenshot: de app zoekt de code (W2.herken.ticket, native 12) en tekent hem hier opnieuw, scherp.
     Een uitsnede van het origineel gaat mee als reserve.
   - Uit een .pkpass (Apple Wallet-bestand): pass.json uitlezen, ook in de webversie.
   - Instapkaarten (IATA-code "M1…") worden ontleed: van → naar, vlucht, stoel, datum.
   Een ticket: { id, titel, sub, soort, wanneer ('jjjj-mm-dd' of 'jjjj-mm-ddTuu:mm'), fmt, data, b64, tekst, velden:[[k,v]], crop, doc, bron }.
   Tekenen gebruikt bwip.js (BWIP); die laadt pas als er iets getekend moet worden. */
(function () {
  'use strict';
  const FMT = {
    qr: 'qrcode', aztec: 'azteccode', pdf417: 'pdf417', datamatrix: 'datamatrix',
    code128: 'code128', code39: 'code39', itf: 'interleaved2of5', ean13: 'ean13'
  };
  const LINEAIR = { code128: 1, code39: 1, itf: 1, ean13: 1, ean8: 1, upca: 1, upce: 1, code93: 1, codabar: 1 };
  const FMT_NAAM = { qr: 'QR-code', aztec: 'Aztec-code', pdf417: 'PDF417', datamatrix: 'DataMatrix', code128: 'streepjescode', code39: 'streepjescode', itf: 'streepjescode', ean13: 'streepjescode', ean8: 'streepjescode', upca: 'streepjescode', upce: 'streepjescode', code93: 'streepjescode', codabar: 'streepjescode' };
  const SOORT = ['Vlucht', 'Trein', 'Bus', 'Boot', 'Evenement', 'Verblijf', 'Huurauto', 'Excursie', 'Ticket'];
  const SOORT_EMOJI = { Vlucht: '✈️', Trein: '🚆', Bus: '🚌', Boot: '⛴️', Evenement: '🎟️', Verblijf: '🏨', Huurauto: '🚗', Excursie: '🧭', Ticket: '🎫' };
  const LUCHTHAVEN = {
    AMS: 'Amsterdam', EIN: 'Eindhoven', RTM: 'Rotterdam', MST: 'Maastricht', GRQ: 'Groningen', BRU: 'Brussel', DUS: 'Düsseldorf',
    BON: 'Bonaire', AUA: 'Aruba', CUR: 'Curaçao', SXM: 'Sint Maarten', PBM: 'Paramaribo',
    TOS: 'Tromsø', OSL: 'Oslo', BGO: 'Bergen', TRD: 'Trondheim', BOO: 'Bodø', EVE: 'Harstad/Narvik', LYR: 'Longyearbyen',
    CPH: 'Kopenhagen', ARN: 'Stockholm', HEL: 'Helsinki', LHR: 'Londen', LGW: 'Londen', CDG: 'Parijs', FRA: 'Frankfurt', MUC: 'München',
    MAD: 'Madrid', BCN: 'Barcelona', LIS: 'Lissabon', FCO: 'Rome', ATL: 'Atlanta', MIA: 'Miami', JFK: 'New York', EWR: 'Newark'
  };

  // ---------------------------------------------------------------- bytes
  const b64ToBytes = b64 => { const s = atob(b64 || ''); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const bytesToB64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const utf8 = s => new TextEncoder().encode(s);
  const latin1 = s => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };
  const leesbaar = u => { for (const c of u) if (c < 32 || c > 126) return false; return true; };

  /** De bytes die in de code moeten (precies zoals gescand). */
  function bytesOf(t) {
    if (t.b64) return b64ToBytes(t.b64);
    if (t.enc === 'latin1' && !/[^\u0000-\u00ff]/.test(t.data || '')) return latin1(t.data || '');
    return utf8(t.data || '');
  }
  /** Tekst voor bwip: gewone tekens zo, de rest als ^NNN (met parse). */
  function bwipText(u) {
    if (leesbaar(u) && !u.includes(94)) return { text: String.fromCharCode.apply(null, u), parse: false };
    let s = '';
    for (const c of u) s += c >= 32 && c <= 126 && c !== 94 ? String.fromCharCode(c) : '^' + String(c).padStart(3, '0');
    return { text: s, parse: true };
  }

  // ---------------------------------------------------------------- tekenen
  let bwipLaden = null;
  const BASE = ((typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  function bwip() {
    if (window.BWIP) return Promise.resolve(window.BWIP);
    if (!bwipLaden) bwipLaden = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = (Tickets._base || BASE) + 'bwip.js';
      s.onload = () => res(window.BWIP);
      s.onerror = () => { bwipLaden = null; rej(new Error('Tekenmodule niet gevonden')); };
      document.head.appendChild(s);
    });
    return bwipLaden;
  }
  const kanTekenen = t => !!(FMT[t.fmt] && (t.data || t.b64));

  /** SVG van de code (bwip scale 1 = twee pixels per blokje, altijd hele pixels), of '' als dit soort code niet
      getekend kan worden. Met een witte rand van 4 blokjes (streepjescodes 10), die scanners nodig hebben. */
  function svgSync(B, t) {
    if (!kanTekenen(t)) return '';
    const { text, parse } = bwipText(bytesOf(t));
    const o = { bcid: FMT[t.fmt], text, parse, scale: 1, backgroundcolor: 'FFFFFF', paddingwidth: 8, paddingheight: 8 };
    if (LINEAIR[t.fmt]) { o.height = 18; o.paddingwidth = 20; o.paddingheight = 4; }
    if (t.fmt === 'pdf417') { o.paddingwidth = 8; o.rowmult = 3; }
    if (t.fmt === 'ean13') o.includetext = false;
    try {
      const svg = B[FMT[t.fmt]](o, B.drawingSVG());
      return svg.replace('<svg ', '<svg shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" ');
    } catch (e) { Tickets.fout = String(e && e.message || e); return ''; }
  }
  async function svg(t) { return svgSync(await bwip(), t); }
  const maat = s => { const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s); return m ? [+m[1], +m[2]] : [0, 0]; };

  /** PNG (base64) voor de widget: hele pixels per blokje ("exact"), de app vergroot zonder vervaging.
      Kan hij niet getekend worden, dan de uitsnede van het origineel. */
  async function png(t) {
    const s = await svg(t);
    if (!s) return t.crop ? { png: t.crop, exact: false } : null;
    let [w, h] = maat(s);
    w = Math.round(w); h = Math.round(h);
    if (!w || !h) return null;
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('svg')); img.src = 'data:image/svg+xml;base64,' + btoa(s); });
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
    // drempel: alleen zwart en wit
    const d = g.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const v = p[i] + p[i + 1] + p[i + 2] < 382 ? 0 : 255; p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    return { png: c.toDataURL('image/png').replace(/^data:[^,]*,/, ''), exact: true };
  }

  // ---------------------------------------------------------------- datums
  const pad = n => String(n).padStart(2, '0');
  const isoDag = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isoLokaal = d => `${isoDag(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  /** ISO-tijd uit een wallet-bestand naar 'jjjj-mm-ddTuu:mm'. Staat er een tijd bij, dan die (de klok ter plekke,
      zoals vertrektijden op een ticket), niet omgerekend naar de tijdzone van de telefoon. */
  function lokaal(s) {
    if (!s || typeof s !== 'string') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    const d = new Date(s);
    return isNaN(d) ? '' : isoLokaal(d);
  }
  /** Dagnummer in het jaar (1–366) naar een datum zo dicht mogelijk bij de reis (of vandaag). */
  function juliaans(n, ref) {
    const r = ref ? new Date(ref + 'T12:00:00') : new Date();
    let best = null;
    for (const y of [r.getFullYear() - 1, r.getFullYear(), r.getFullYear() + 1]) {
      const d = new Date(y, 0, n, 12);
      if (d.getFullYear() !== y) continue;
      if (!best || Math.abs(d - r) < Math.abs(best - r)) best = d;
    }
    return best ? isoDag(best) : '';
  }
  const dagVan = w => (w || '').slice(0, 10);
  const tijdVan = w => /T\d\d:\d\d/.test(w || '') ? w.slice(11, 16) : '';

  // ---------------------------------------------------------------- instapkaart (IATA BCBP)
  const mooi = s => s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, m => m.toUpperCase());
  function bcbp(s) {
    if (typeof s !== 'string' || !/^M[1-4]/.test(s) || s.length < 58) return null;
    const van = s.slice(30, 33), naar = s.slice(33, 36), jd = +s.slice(44, 47);
    if (!/^[A-Z]{3}$/.test(van) || !/^[A-Z]{3}$/.test(naar) || !(jd >= 1 && jd <= 366)) return null;
    const ruw = s.slice(2, 22).trim();
    const [achter, voor] = ruw.split('/');
    const voornaam = (voor || '').replace(/\s+(MR|MRS|MS|MISS|MSTR|DR|CHD|INF)$/i, '').trim();
    const naam = mooi([voornaam, achter].filter(Boolean).join(' ').trim());
    const car = s.slice(36, 39).trim(), nr = s.slice(39, 44).trim().replace(/^0+(?=\d)/, '');
    const stoel = s.slice(48, 52).trim().replace(/^0+(?=\d)/, '');
    const seq = s.slice(52, 57).trim().replace(/^0+(?=\d)/, '');
    return { naam, pnr: s.slice(23, 30).trim(), van, naar, vlucht: (car + ' ' + nr).trim(), jd, stoel, seq, klasse: s.slice(47, 48) };
  }
  const plek = c => LUCHTHAVEN[c] ? `${LUCHTHAVEN[c]} (${c})` : c;

  // ---------------------------------------------------------------- tickets maken
  const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const sleutel = t => (t.fmt || '') + '|' + (t.b64 || t.data || '');

  /** Uit een gevonden code ({f, v, b64, crop, page}) een ticket. ctx: {titel, soort, ref (datum van de reis), doc}. */
  function fromScan(it, ctx) {
    ctx = ctx || {};
    const raw = it.b64 ? b64ToBytes(it.b64) : null;
    // tekst als de bytes gewone tekst zijn (en overeenkomen met wat ML Kit las), anders de bytes bewaren
    let data = it.v || '', b64 = '';
    if (raw && raw.length) {
      let txt = null;
      try { txt = new TextDecoder('utf-8', { fatal: true }).decode(raw); } catch (e) { txt = null; }
      if (txt === null || txt !== data || /[\u0000-\u0008\u000e-\u001f]/.test(txt)) { b64 = it.b64; data = txt !== null && !/[\u0000-\u0008\u000e-\u001f]/.test(txt) ? txt : ''; }
    }
    const t = { id: uid(), titel: ctx.titel || 'Ticket', sub: '', soort: ctx.soort || 'Ticket', wanneer: '', fmt: it.f || 'qr', data, b64, tekst: '', velden: [], crop: it.crop || '', doc: ctx.doc || '', bron: 'scan', made: Date.now() };
    const bp = bcbp(data);
    if (bp) {
      Object.assign(t, {
        titel: `${bp.van} → ${bp.naar}`, soort: 'Vlucht', wanneer: juliaans(bp.jd, ctx.ref),
        sub: [bp.vlucht, bp.stoel && 'stoel ' + bp.stoel, bp.naam].filter(Boolean).join(' · '),
        velden: [['Van', plek(bp.van)], ['Naar', plek(bp.naar)], ['Vlucht', bp.vlucht], ['Stoel', bp.stoel], ['Passagier', bp.naam], ['Boekingscode', bp.pnr], ['Volgnummer', bp.seq]].filter(x => x[1])
      });
    }
    if (!FMT[t.fmt] && !t.crop) return null; // niet te tekenen en geen plaatje: niets aan
    return t;
  }

  function kleur(s) {
    const m = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s || '');
    if (m) return '#' + [m[1], m[2], m[3]].map(x => pad((+x).toString(16))).join('');
    return /^#[0-9a-f]{6}$/i.test(s || '') ? s : '';
  }
  function veldWaarde(f) {
    let v = f.value;
    if (v == null) return '';
    if (typeof v === 'number') return f.currencyCode ? `${f.currencyCode} ${v.toFixed(2)}` : String(v);
    v = String(v);
    if ((f.dateStyle || f.timeStyle || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) && !isNaN(new Date(v))) {
      const d = new Date(v), o = {};
      if (f.dateStyle !== 'PKDateStyleNone') Object.assign(o, { weekday: 'short', day: 'numeric', month: 'short' });
      if (f.timeStyle !== 'PKDateStyleNone') Object.assign(o, { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleString('nl-NL', o);
    }
    return v;
  }

  /** Uit pass.json (Apple Wallet). */
  function fromPass(p, ctx) {
    ctx = ctx || {};
    const bc = (Array.isArray(p.barcodes) && p.barcodes[0]) || p.barcode;
    if (!bc || !bc.message) return null;
    const kind = ['boardingPass', 'eventTicket', 'coupon', 'storeCard', 'generic'].find(k => p[k]) || 'generic';
    const st = p[kind] || {};
    const f = k => Array.isArray(st[k]) ? st[k] : [];
    const prim = f('primaryFields');
    const fmt = { PKBarcodeFormatQR: 'qr', PKBarcodeFormatPDF417: 'pdf417', PKBarcodeFormatAztec: 'aztec', PKBarcodeFormatCode128: 'code128' }[bc.format] || 'qr';
    const tt = st.transitType || '';
    const soort = kind === 'boardingPass' ? ({ PKTransitTypeAir: 'Vlucht', PKTransitTypeTrain: 'Trein', PKTransitTypeBus: 'Bus', PKTransitTypeBoat: 'Boot' }[tt] || 'Ticket')
      : kind === 'eventTicket' ? 'Evenement' : 'Ticket';
    const naam = p.logoText || p.organizationName || '';
    let titel = '';
    if (kind === 'boardingPass' && prim.length >= 2) titel = `${veldWaarde(prim[0])} → ${veldWaarde(prim[1])}`;
    else if (prim.length) titel = veldWaarde(prim[0]);
    titel = titel || naam || p.description || 'Ticket';
    const subs = [naam, p.description].filter((x, i, a) => x && x !== titel && a.indexOf(x) === i);
    let wanneer = lokaal(p.relevantDate);
    if (!wanneer && Array.isArray(p.relevantDates) && p.relevantDates[0]) wanneer = lokaal(p.relevantDates[0].startDate || p.relevantDates[0].relevantDate || p.relevantDates[0].date);
    const alle = [].concat(f('headerFields'), prim, f('secondaryFields'), f('auxiliaryFields'));
    if (!wanneer) { const d = alle.find(x => (x.dateStyle || x.timeStyle) && typeof x.value === 'string' && !isNaN(new Date(x.value))); if (d) wanneer = lokaal(d.value); }
    const velden = alle.filter(x => !(kind === 'boardingPass' && prim.slice(0, 2).includes(x)))
      .map(x => [String(x.label || x.key || '').trim(), veldWaarde(x)]).filter(x => x[0] && x[1]).slice(0, 10);
    const enc = String(bc.messageEncoding || 'iso-8859-1').toLowerCase();
    const t = { id: uid(), titel, sub: subs.join(' · '), soort, wanneer, fmt, data: String(bc.message), b64: '', enc: /utf-?8/.test(enc) ? '' : 'latin1',
      tekst: bc.altText || '', velden, crop: '', doc: ctx.doc || '', bron: 'pkpass', kleur: kleur(p.backgroundColor), made: Date.now() };
    // instapkaart in een wallet-bestand: datum en stoel ook uit de code halen als die ontbreken
    const bp = bcbp(t.data);
    if (bp && !t.wanneer) t.wanneer = juliaans(bp.jd, ctx.ref);
    return t;
  }

  /** .pkpass (zip) → ticket. Gebruikt de zip-lezer van xlsx.js. */
  async function readPkpass(buf, ctx) {
    if (!window.XLSX || !XLSX.unzip) throw new Error('zip-lezer ontbreekt');
    let z;
    try { z = await XLSX.unzip(buf); } catch (e) { throw new Error('Geen geldig wallet-bestand (.pkpass).'); }
    let txt = await z.text('pass.json');
    if (!txt) throw new Error('Geen pass.json in dit wallet-bestand.');
    txt = txt.replace(/^\uFEFF/, '').replace(/,\s*([}\]])/g, '$1'); // sommige uitgevers laten komma's staan
    let p;
    try { p = JSON.parse(txt); } catch (e) { throw new Error('pass.json is niet te lezen.'); }
    const t = fromPass(p, ctx);
    if (!t) throw new Error('Dit wallet-bestand heeft geen code om te scannen.');
    return t;
  }

  // ---------------------------------------------------------------- volgorde
  const vandaag = () => isoDag(new Date());
  /** Komt nog (of vandaag)? Zonder datum: zolang de reis niet voorbij is. */
  function komt(t, trip, today) {
    today = today || vandaag();
    if (t.wanneer) return dagVan(t.wanneer) >= today;
    return !trip || !(trip.tot || trip.van) || (trip.tot || trip.van) >= today;
  }
  const volgKey = (t, trip) => t.wanneer ? (t.wanneer.length === 10 ? t.wanneer + 'T99' : t.wanneer) : ((trip && (trip.tot || trip.van)) || '9999') + 'U';
  /** Alle komende tickets van alle reizen, eerstvolgende eerst: [{t, trip}]. */
  function komend(trips, today) {
    const out = [];
    (trips || []).forEach(trip => (trip.tickets || []).forEach(t => { if (komt(t, trip, today)) out.push({ t, trip }); }));
    return out.sort((a, b) => volgKey(a.t, a.trip) < volgKey(b.t, b.trip) ? -1 : volgKey(a.t, a.trip) > volgKey(b.t, b.trip) ? 1 : 0);
  }
  function sorteer(list, trip) { return list.slice().sort((a, b) => volgKey(a, trip) < volgKey(b, trip) ? -1 : 1); }

  /** Wat de widget krijgt (zonder plaatje; dat zet de pagina erbij). */
  function widgetItem(t, trip) {
    const w = t.wanneer || '';
    const d = dagVan(w);
    return {
      id: t.id, titel: t.titel, sub: t.sub || '', wanneer: w, tot: (trip && (trip.tot || trip.van)) || '',
      dag: d ? new Date(d + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : '',
      reis: trip ? trip.naam : '', emoji: SOORT_EMOJI[t.soort] || (trip && trip.emoji) || '🎫',
      tekst: t.tekst || (LINEAIR[t.fmt] && t.data && t.data.length <= 40 ? t.data : ''),
      velden: (t.velden || []).slice(0, 6)
    };
  }

  window.Tickets = {
    FMT, FMT_NAAM, LINEAIR, SOORT, SOORT_EMOJI, kanTekenen, svg, svgSync, png, bwip, maat,
    bcbp, fromScan, fromPass, readPkpass, juliaans, lokaal, komt, komend, sorteer, sleutel, widgetItem,
    dagVan, tijdVan, bytesOf, bwipText, _bytesToB64: bytesToB64, _base: ''
  };
})();
