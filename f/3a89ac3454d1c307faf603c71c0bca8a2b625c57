/* Reizen uit een Excel-bestand (.xlsx) halen, helemaal op de telefoon (geen internet, niets naar buiten).
   Een .xlsx is een zip met XML. We lezen alle tabbladen als tabellen (rij 1 met kopjes) en zoeken daarin:
   - Reizen:      Reis | Emoji | Bestemming | Vertrek | Terug | Paklijst erbij | Notities
   - Gegevens:    Reis | Wat | Waarde
   - Paklijst:    Reis | Spullen | Ingepakt
   - Te regelen:  Reis | Taak | Uiterlijk | Klaar | Toelichting | Bij wie
   Tabbladen en kolommen worden op naam herkend (hoofdletters en volgorde maken niet uit).
   XLSX.parse(arrayBuffer) geeft { trips: [...], warnings: [...] }. */
(function () {
  // ---------------------------------------------------------------- zip
  async function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) {
      const head = new TextDecoder('latin1').decode(u8.subarray(0, 16));
      if (head.includes('MSMAMARPCRYPT')) throw new Error('Dit bestand is versleuteld door Microsoft-bedrijfsbeveiliging (Intune), bijvoorbeeld omdat het met een werkaccount in Excel is opgeslagen. Open het in Excel, kopieer alles naar een nieuw bestand onder je eigen account (of Google Sheets) en sla dat op als .xlsx.');
      if (u8[0] === 0xd0 && u8[1] === 0xcf && u8[2] === 0x11 && u8[3] === 0xe0) throw new Error('Dit is een oud .xls-bestand of een Excel-bestand met wachtwoord. Haal het wachtwoord eraf en sla het op als .xlsx.');
      throw new Error('Geen geldig Excel-bestand (.xlsx).');
    }
    const n = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const entries = {};
    const td = new TextDecoder();
    for (let i = 0; i < n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = td.decode(u8.subarray(p + 46, p + 46 + nl));
      entries[name.toLowerCase()] = { method, csize, off };
      p += 46 + nl + xl + cl;
    }
    async function read(name) {
      const e = entries[name.toLowerCase()];
      if (!e) return null;
      const lnl = dv.getUint16(e.off + 26, true), lxl = dv.getUint16(e.off + 28, true);
      const start = e.off + 30 + lnl + lxl, data = u8.subarray(start, start + e.csize);
      if (e.method === 0) return data;
      if (e.method !== 8) throw new Error('Onbekende compressie in het bestand');
      if (typeof DecompressionStream === 'undefined') throw new Error('Deze telefoon kan het bestand niet uitpakken (WebView te oud). Werk Android System WebView bij via de Play Store.');
      const out = new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')));
      return new Uint8Array(await out.arrayBuffer());
    }
    return { text: async name => { const b = await read(name); return b ? td.decode(b) : null; } };
  }

  // ---------------------------------------------------------------- werkmap naar tabellen
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const byTag = (el, tag) => Array.from(el.getElementsByTagNameNS('*', tag));
  const child = (el, tag) => Array.from(el.childNodes).find(c => c.nodeType === 1 && c.localName === tag) || null;
  const colNum = ref => { let n = 0; for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + ch.toUpperCase().charCodeAt(0) - 64; return n - 1; };

  // Tekst van een <si> of <is>: losse <t> en opgemaakte stukjes (<r><t>), zonder uitspraakhulp (<rPh>).
  function richText(el) {
    if (!el) return '';
    const t = child(el, 't');
    if (t) return t.textContent;
    return Array.from(el.childNodes).filter(c => c.nodeType === 1 && c.localName === 'r').map(r => { const x = child(r, 't'); return x ? x.textContent : ''; }).join('');
  }

  // Welke celopmaak is een datum? (ingebouwde nummers 14–22, 45–47 en eigen formaten met d/m/j)
  function dateStyles(stylesXml) {
    const set = new Set();
    if (!stylesXml) return set;
    const doc = xml(stylesXml);
    const custom = {};
    byTag(doc, 'numFmt').forEach(f => { custom[f.getAttribute('numFmtId')] = f.getAttribute('formatCode') || ''; });
    const isDate = id => {
      id = +id;
      if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (id >= 27 && id <= 36) || (id >= 50 && id <= 58)) return true;
      const code = (custom[id] || '').replace(/"[^"]*"|\[[^\]]*\]|\\./g, '');
      return /[dmyj]/i.test(code) && !/^[#0.,%\s]*$/.test(code);
    };
    const xfs = byTag(doc, 'cellXfs')[0];
    if (xfs) Array.from(xfs.childNodes).filter(c => c.nodeType === 1 && c.localName === 'xf').forEach((xf, i) => { if (isDate(xf.getAttribute('numFmtId'))) set.add(i); });
    return set;
  }

  async function workbook(buf) {
    const z = await unzip(buf);
    const wbXml = await z.text('xl/workbook.xml');
    if (!wbXml) throw new Error('Dit is geen Excel-bestand (geen werkmap gevonden).');
    const wb = xml(wbXml);
    const date1904 = byTag(wb, 'workbookPr').some(e => /^(1|true)$/.test(e.getAttribute('date1904') || ''));
    const rels = {};
    const relXml = await z.text('xl/_rels/workbook.xml.rels');
    if (relXml) byTag(xml(relXml), 'Relationship').forEach(r => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const ssXml = await z.text('xl/sharedStrings.xml');
    const shared = ssXml ? byTag(xml(ssXml), 'si').map(richText) : [];
    const dates = dateStyles(await z.text('xl/styles.xml'));

    const sheets = [];
    for (const s of byTag(wb, 'sheet')) {
      const rid = s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || s.getAttribute('r:id');
      let target = rels[rid];
      if (!target) continue;
      target = target.replace(/^\/+/, '');
      if (!/^xl\//i.test(target)) target = 'xl/' + target;
      const sx = await z.text(target);
      if (!sx) continue;
      const rows = [];
      byTag(xml(sx), 'row').forEach((row, ri) => {
        const r = +(row.getAttribute('r') || ri + 1) - 1;
        const cells = [];
        let ci = 0;
        Array.from(row.childNodes).filter(c => c.nodeType === 1 && c.localName === 'c').forEach(c => {
          const ref = c.getAttribute('r');
          if (ref) ci = colNum(ref);
          const t = c.getAttribute('t') || 'n', v = child(c, 'v');
          let val = null;
          if (t === 's') val = v ? shared[+v.textContent] : '';
          else if (t === 'inlineStr') val = richText(child(c, 'is'));
          else if (t === 'str') val = v ? v.textContent : '';
          else if (t === 'b') val = v ? v.textContent === '1' : false;
          else if (t === 'd') val = v ? { date: v.textContent.slice(0, 10) } : '';
          else if (t === 'e') val = '';
          else if (v) {
            const num = +v.textContent;
            val = dates.has(+(c.getAttribute('s') || 0)) ? { date: serialDate(num, date1904) } : num;
          }
          cells[ci++] = val;
        });
        rows[r] = cells;
      });
      sheets.push({ name: s.getAttribute('name') || '', rows: Array.from(rows, x => x || []) });
    }
    return sheets;
  }

  function serialDate(n, date1904) {
    const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
    return new Date(base + Math.round(n) * 86400000).toISOString().slice(0, 10);
  }

  // ---------------------------------------------------------------- waarden
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
  const MONTHS = { jan: 1, feb: 2, maa: 3, mrt: 3, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dec: 12 };

  function text(v) {
    if (v == null) return '';
    if (typeof v === 'object' && v.date) return v.date;
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(+v.toFixed(10)).replace('.', ',');
    if (typeof v === 'boolean') return v ? 'ja' : 'nee';
    return String(v).replace(/\r\n?/g, '\n').trim();
  }

  // Datum uit een cel: Excel-datum, getal (serieel), 2027-03-12, 12-3-2027, 12/03/27, 12 maart 2027.
  function toDate(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'object' && v.date) return v.date;
    if (typeof v === 'number') return v > 20000 && v < 80000 ? serialDate(v, false) : null;
    const s = String(v).trim().toLowerCase();
    if (!s) return '';
    const pad = n => String(n).padStart(2, '0');
    const ok = (y, m, d) => {
      if (y < 100) y += 2000;
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
    };
    let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s);
    if (m) return ok(+m[1], +m[2], +m[3]);
    m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(s);
    if (m) return ok(+m[3], +m[2], +m[1]);
    m = /^(?:[a-z]+\.?,?\s+)?(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/.exec(s);
    if (m && MONTHS[m[2].slice(0, 3)]) return ok(+m[3], MONTHS[m[2].slice(0, 3)], +m[1]);
    return null;
  }

  const YES = /^(ja|j|yes|y|x|v|ok|true|waar|klaar|gedaan|ingepakt|1|✓|✔|✔️|☑|☑️|✅)$/i;
  const yes = v => typeof v === 'boolean' ? v : (typeof v === 'number' ? v === 1 : YES.test(text(v)));

  // ---------------------------------------------------------------- tabellen herkennen
  const SHEETS = {
    reizen: ['reizen', 'reis', 'trips', 'trip', 'overzicht'],
    codes: ['gegevens', 'belangrijkegegevens', 'codes', 'boekingen', 'info'],
    pak: ['paklijst', 'inpakken', 'packlist', 'packing'],
    todo: ['teregelen', 'regelen', 'todo', 'taken', 'checklist']
  };
  const COLS = {
    reis: ['reis', 'naam', 'trip', 'reisnaam'],
    emoji: ['emoji', 'icoon', 'icon'],
    bestemming: ['bestemming', 'plaats', 'land', 'waar'],
    van: ['vertrek', 'van', 'heen', 'begin', 'start', 'vertrekdatum'],
    tot: ['terug', 'tot', 'eind', 'einde', 'terugkomst', 'retour'],
    sjablonen: ['paklijsterbij', 'sjablonen', 'sjabloon', 'lijsterbij', 'paklijstsjablonen'],
    notities: ['notities', 'notitie', 'opmerkingen', 'notes'],
    wat: ['wat', 'label', 'soort', 'gegeven'],
    waarde: ['waarde', 'code', 'gegevens', 'inhoud'],
    item: ['spullen', 'item', 'wat', 'ding', 'spul', 'paklijst', 'omschrijving'],
    taak: ['taak', 'wat', 'teregelen', 'actie', 'omschrijving'],
    klaar: ['klaar', 'gedaan', 'ingepakt', 'ok', 'af', 'status'],
    dl: ['uiterlijk', 'deadline', 'voor', 'uiterstedatum', 'wanneer', 'datum', 'einddatum'],
    info: ['toelichting', 'waaromnu', 'waarom', 'notitie', 'notities', 'opmerking', 'opmerkingen', 'uitleg'],
    bij: ['bijwie', 'aanbieder', 'contact', 'wie']
  };

  // Zoek de kopjesrij (in de eerste 10 rijen) en geef per veld het kolomnummer.
  function header(rows, fields) {
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const cells = (rows[r] || []).map(norm);
      const map = {};
      fields.forEach(f => {
        for (const alias of COLS[f]) { const i = cells.indexOf(alias); if (i >= 0 && !Object.values(map).includes(i)) { map[f] = i; break; } }
      });
      if (map.reis != null && Object.keys(map).length >= 2) return { row: r, map };
    }
    return null;
  }

  function findSheet(sheets, kind) {
    return sheets.find(s => SHEETS[kind].includes(norm(s.name))) || null;
  }

  const TPL_ALIAS = { basis: 'basis', zon: 'zon', zonstrand: 'zon', strand: 'zon', kou: 'kou', kousneeuw: 'kou', sneeuw: 'kou', winter: 'kou', stad: 'stad', stedentrip: 'stad', vliegen: 'vliegen', vlucht: 'vliegen' };

  async function parse(buf) {
    const sheets = await workbook(buf);
    const warnings = [];
    const trips = new Map();
    const get = name => {
      const key = norm(name);
      if (!trips.has(key)) trips.set(key, { naam: name, emoji: '', bestemming: '', van: '', tot: '', sjablonen: [], notities: '', codes: [], pak: [], todo: [] });
      return trips.get(key);
    };
    const each = (kind, fields, fn) => {
      const sh = findSheet(sheets, kind);
      if (!sh) return false;
      const h = header(sh.rows, fields);
      if (!h) { warnings.push(`Tabblad "${sh.name}": kolom "Reis" niet gevonden, overgeslagen.`); return true; }
      for (let r = h.row + 1; r < sh.rows.length; r++) {
        const row = sh.rows[r] || [];
        const cell = f => h.map[f] == null ? null : row[h.map[f]];
        const naam = text(cell('reis'));
        if (!naam) { if (fields.some(f => f !== 'reis' && text(cell(f)))) warnings.push(`${sh.name}, rij ${r + 1}: geen reis ingevuld, overgeslagen.`); continue; }
        fn(naam, cell, `${sh.name}, rij ${r + 1}`);
      }
      return true;
    };

    const listed = new Set();
    const hadTrips = each('reizen', ['reis', 'emoji', 'bestemming', 'van', 'tot', 'sjablonen', 'notities'], (naam, cell, where) => {
      const t = get(naam);
      listed.add(norm(naam));
      t.emoji = text(cell('emoji')) || t.emoji;
      t.bestemming = text(cell('bestemming')) || t.bestemming;
      t.notities = text(cell('notities')) || t.notities;
      for (const k of ['van', 'tot']) {
        const d = toDate(cell(k));
        if (d === null) warnings.push(`${where}: "${text(cell(k))}" is geen datum die ik snap (gebruik bv. 12-3-2027).`);
        else if (d) t[k] = d;
      }
      text(cell('sjablonen')).split(/[,;+\n]|\sen\s/).map(norm).filter(Boolean).forEach(s => {
        const k = TPL_ALIAS[s];
        if (k) { if (!t.sjablonen.includes(k)) t.sjablonen.push(k); }
        else warnings.push(`${where}: paklijst "${s}" ken ik niet (kies uit Basis, Zon & strand, Kou & sneeuw, Stedentrip, Vliegen).`);
      });
    });
    each('codes', ['reis', 'wat', 'waarde'], (naam, cell) => {
      const label = text(cell('wat')), waarde = text(cell('waarde'));
      if (label || waarde) get(naam).codes.push({ label: label || 'Gegeven', waarde });
    });
    each('pak', ['reis', 'item', 'klaar'], (naam, cell) => {
      const t = text(cell('item'));
      if (t) get(naam).pak.push({ t, ok: yes(cell('klaar')) });
    });
    each('todo', ['reis', 'taak', 'klaar', 'dl', 'info', 'bij'], (naam, cell, where) => {
      const t = text(cell('taak'));
      if (!t) return;
      const it = { t, ok: yes(cell('klaar')) };
      const d = toDate(cell('dl'));
      if (d === null) warnings.push(`${where}: "${text(cell('dl'))}" is geen datum die ik snap.`);
      else if (d) it.dl = d;
      const bij = text(cell('bij')), info = text(cell('info'));
      const extra = bij && !/^[-—–]$/.test(bij) ? `Bij: ${bij}` : '';
      if (info || extra) it.info = [info, extra].filter(Boolean).join('\n');
      get(naam).todo.push(it);
    });

    if (!hadTrips && !trips.size) throw new Error('Geen tabblad "Reizen" gevonden. Gebruik het invulbestand (knop "Invulbestand").');
    const list = Array.from(trips.values());
    list.forEach(t => {
      if (hadTrips && !listed.has(norm(t.naam))) warnings.push(`"${t.naam}" staat niet op tabblad Reizen (typfout?). Wordt een nieuwe reis.`);
      if (t.van && t.tot && t.tot < t.van) { warnings.push(`${t.naam}: terug ligt vóór vertrek, data omgedraaid.`); [t.van, t.tot] = [t.tot, t.van]; }
    });
    return { trips: list, warnings };
  }

  window.XLSX = { parse, _toDate: toDate };
})();
