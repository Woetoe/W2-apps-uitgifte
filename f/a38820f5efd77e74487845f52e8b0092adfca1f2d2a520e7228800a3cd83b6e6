/* Recepten uit Word-bestanden (.docx) halen, helemaal op de telefoon (geen internet, niets naar buiten).
   Een .docx is een zip met XML. We pakken word/document.xml uit, lopen alle alinea's en tabellen langs
   en knippen het document in recepten:
   - zijn er koppen (Kop 1/2, Titel), dan begint elk recept bij een kop van het hoogste niveau dat vaker voorkomt;
   - anders bij korte, vetgedrukte regels;
   - lukt dat niet, dan is het hele bestand één recept.
   Binnen een recept zoeken we "Ingrediënten", "Bereiding", "Tips" en het aantal personen. */
(function () {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

  // ---------------------------------------------------------------- zip
  async function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('Geen geldig Word-bestand (.docx). Oude .doc-bestanden eerst in Word opslaan als .docx.');
    const n = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const entries = {};
    const td = new TextDecoder();
    for (let i = 0; i < n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = td.decode(u8.subarray(p + 46, p + 46 + nl));
      entries[name] = { method, csize, off };
      p += 46 + nl + xl + cl;
    }
    async function read(name) {
      const e = entries[name];
      if (!e) return null;
      const lnl = dv.getUint16(e.off + 26, true), lxl = dv.getUint16(e.off + 28, true);
      const start = e.off + 30 + lnl + lxl, data = u8.subarray(start, start + e.csize);
      if (e.method === 0) return data;
      if (e.method !== 8) throw new Error('Onbekende compressie in het bestand');
      if (typeof DecompressionStream === 'undefined') throw new Error('Deze telefoon kan het bestand niet uitpakken (WebView te oud). Werk Android System WebView bij via de Play Store.');
      const ds = new DecompressionStream('deflate-raw');
      const out = new Response(new Blob([data]).stream().pipeThrough(ds));
      return new Uint8Array(await out.arrayBuffer());
    }
    return { names: Object.keys(entries), read, text: async name => { const b = await read(name); return b ? td.decode(b) : null; } };
  }

  // ---------------------------------------------------------------- word-xml naar blokken
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const kids = (el, ns, local) => Array.from(el.childNodes).filter(c => c.nodeType === 1 && c.namespaceURI === ns && c.localName === local);
  const kid = (el, ns, local) => kids(el, ns, local)[0] || null;
  const attr = (el, local) => el ? (el.getAttributeNS(W, local) || el.getAttribute('w:' + local)) : null;

  function styleLevels(stylesXml) {
    const lv = {};
    if (!stylesXml) return lv;
    const doc = xml(stylesXml);
    Array.from(doc.getElementsByTagNameNS(W, 'style')).forEach(st => {
      const id = attr(st, 'styleId');
      const name = (attr(kid(st, W, 'name'), 'val') || '').toLowerCase();
      let m = /^(heading|kop)\s*(\d)$/.exec(name);
      if (m) lv[id] = +m[2];
      else if (/^(title|titel)$/.test(name)) lv[id] = 0;
      else {
        const ppr = kid(st, W, 'pPr'), ol = ppr && kid(ppr, W, 'outlineLvl');
        if (ol) lv[id] = +attr(ol, 'val') + 1;
      }
    });
    return lv;
  }

  function paraText(p) {
    let t = '';
    const walk = el => {
      for (const c of Array.from(el.childNodes)) {
        if (c.nodeType !== 1) continue;
        if (c.namespaceURI === W) {
          if (c.localName === 't') t += c.textContent;
          else if (c.localName === 'tab') t += ' ';
          else if (c.localName === 'br' || c.localName === 'cr') t += '\n';
          else if (c.localName === 'delText' || c.localName === 'instrText') continue;
          else walk(c);
        } else walk(c);
      }
    };
    walk(p);
    return t.replace(/[  ]+/g, ' ').trim();
  }
  function isBold(p) {
    const runs = Array.from(p.getElementsByTagNameNS(W, 'r')).filter(r => (r.getElementsByTagNameNS(W, 't')[0] || {}).textContent);
    if (!runs.length) return false;
    return runs.every(r => { const rpr = kid(r, W, 'rPr'); const b = rpr && kid(rpr, W, 'b'); return b && attr(b, 'val') !== '0' && attr(b, 'val') !== 'false'; });
  }
  function bigFont(p) {
    const sz = Array.from(p.getElementsByTagNameNS(W, 'sz')).map(s => +attr(s, 'val') || 0);
    return sz.length && Math.min(...sz) >= 30; // 15pt of groter
  }

  async function blocks(zip) {
    const docXml = await zip.text('word/document.xml');
    if (!docXml) throw new Error('Geen Word-document gevonden in dit bestand.');
    const levels = styleLevels(await zip.text('word/styles.xml'));
    const relsXml = await zip.text('word/_rels/document.xml.rels');
    const rels = {};
    if (relsXml) Array.from(xml(relsXml).getElementsByTagName('Relationship')).forEach(r => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const doc = xml(docXml);
    const body = doc.getElementsByTagNameNS(W, 'body')[0];
    const out = [];
    const para = p => {
      const ppr = kid(p, W, 'pPr');
      const sid = ppr && attr(kid(ppr, W, 'pStyle'), 'val');
      let level = sid != null && levels[sid] != null ? levels[sid] : null;
      const ol = ppr && kid(ppr, W, 'outlineLvl');
      if (level == null && ol) level = +attr(ol, 'val') + 1;
      const list = !!(ppr && kid(ppr, W, 'numPr')) || /^list|lijst/i.test(sid || '');
      const imgs = Array.from(p.getElementsByTagNameNS(A, 'blip')).map(b => b.getAttributeNS(R, 'embed') || b.getAttribute('r:embed')).filter(Boolean).map(id => rels[id]).filter(Boolean);
      const text = paraText(p);
      if (!text && !imgs.length) return;
      out.push({ text, level, list, bold: isBold(p), big: bigFont(p), imgs });
    };
    const walk = el => {
      for (const c of Array.from(el.childNodes)) {
        if (c.nodeType !== 1 || c.namespaceURI !== W) continue;
        if (c.localName === 'p') para(c);
        else if (c.localName === 'tbl') {
          kids(c, W, 'tr').forEach(tr => {
            const cells = kids(tr, W, 'tc').map(tc => kids(tc, W, 'p').map(paraText).filter(Boolean).join(' ')).filter(Boolean);
            if (cells.length) out.push({ text: cells.join(cells.length <= 3 ? ' ' : ' · '), level: null, list: true, bold: false, big: false, imgs: [] });
          });
        } else if (c.localName === 'sdt' || c.localName === 'sdtContent' || c.localName === 'customXml') walk(c);
      }
    };
    walk(body);
    return out;
  }

  // ---------------------------------------------------------------- herkennen
  const RX = {
    ing: /^(ingredi[eë]nten|benodigdheden|wat heb je nodig|nodig|boodschappen(lijst)?)\b/i,
    step: /^(bereiding(swijze)?|werkwijze|instructies|aan de slag|zo maak je het|methode|stappen|recept|voorbereiding)\b/i,
    tip: /^(tips?|variatie|variaties|serveertips?|notities?|opmerkingen?|let op)\b/i,
    pers: /(\d+)\s*(personen|persoon|pers\b|porties|portie|mensen|stuks)/i,
    time: /(?:(\d+)\s*(?:uur|u\b))?\s*(?:en\s*)?(\d+)\s*(?:min(?:uten|uut)?\b)/i,
    qty: /^(\d|½|¼|¾|⅓|⅔|een\s|twee\s|drie\s|vier\s|snufje|scheutje|handje|eetlepel|theelepel|el\b|tl\b)/i,
    bullet: /^[-•·*–]\s*/
  };
  const isSection = t => RX.ing.test(t) || RX.step.test(t) || RX.tip.test(t);

  function split(bs, fileTitle) {
    // 1. echte koppen
    const lv = bs.filter(b => b.level != null && b.text).map(b => b.level);
    let cut = null;
    if (lv.length) {
      const uniq = Array.from(new Set(lv)).sort((a, b) => a - b);
      for (const L of uniq) {
        const heads = bs.filter(b => b.level === L && b.text && !isSection(b.text));
        if (heads.length >= 2) { cut = b => b.level === L && b.text && !isSection(b.text); break; }
      }
      if (!cut && uniq.length) {
        const L = uniq[0], heads = bs.filter(b => b.level === L && b.text && !isSection(b.text));
        if (heads.length === 1) cut = b => b === heads[0];
      }
    }
    // 2. korte vetgedrukte of grote regels
    if (!cut) {
      const cand = b => (b.bold || b.big) && !b.list && b.text && b.text.length <= 70 && !/[:.]$/.test(b.text) && !isSection(b.text) && !RX.qty.test(b.text);
      if (bs.filter(cand).length >= 2) cut = cand;
    }
    const groups = [];
    let curG = null;
    bs.forEach(b => {
      if (cut && cut(b)) { curG = { title: b.text, items: [] }; groups.push(curG); return; }
      if (!curG) { curG = { title: null, items: [] }; groups.push(curG); }
      curG.items.push(b);
    });
    // Losse tekst vóór het eerste recept (inleiding, inhoudsopgave) weggooien als er meerdere recepten zijn
    let gs = groups.filter(g => g.items.some(b => b.text) || g.title);
    if (gs.length > 1 && !gs[0].title) gs = gs.slice(1);
    return gs.map(g => toRecipe(g.title || firstLine(g.items) || fileTitle, g.items, !g.title));
  }
  function firstLine(items) {
    const b = items.find(x => x.text && x.text.length <= 70 && !isSection(x.text));
    if (b) { b._title = true; return b.text; }
    return null;
  }

  function toRecipe(title, items, titleInBody) {
    const r = { titel: title.replace(/\s+/g, ' ').trim(), personen: null, tijd: null, ingr: [], stappen: [], tips: [], intro: [], imgs: [] };
    let sec = null;
    items.forEach(b => {
      b.imgs.forEach(i => r.imgs.push(i));
      if (!b.text || (titleInBody && b._title)) return;
      b.text.split('\n').map(x => x.trim()).filter(Boolean).forEach(line => {
        const clean = line.replace(/[:：]\s*$/, '');
        const head = clean.length <= 60 && (b.level != null || b.bold || /:$/.test(line) || clean.split(' ').length <= 4);
        if (head && RX.ing.test(clean)) { sec = 'ing'; meta(r, clean); return; }
        if (head && RX.step.test(clean)) { sec = 'step'; meta(r, clean); return; }
        if (head && RX.tip.test(clean)) { sec = 'tip'; return; }
        if (!sec && line.length <= 80) meta(r, line);
        const t = line.replace(RX.bullet, '').replace(/^\d+[.)]\s+(?=\D)/, m => sec === 'ing' ? m : '');
        if (sec === 'ing') r.ingr.push(t);
        else if (sec === 'step') r.stappen.push(t);
        else if (sec === 'tip') r.tips.push(t);
        else r.intro.push({ t, list: b.list, short: line.length <= 60 });
      });
    });
    // Geen kopjes gevonden: raden. Korte regels met een hoeveelheid of in een lijst vóór de lange tekst = ingrediënten.
    if (!r.ingr.length && !r.stappen.length && r.intro.length) {
      let i = 0;
      const rest = [];
      const lines = r.intro;
      // Inleidende zinnen en meta-regels overslaan tot de eerste ingrediëntachtige regel
      while (i < lines.length && !(RX.qty.test(lines[i].t) || lines[i].list) ) { rest.push(lines[i].t); i++; }
      while (i < lines.length && (lines[i].short && (RX.qty.test(lines[i].t) || lines[i].list))) { r.ingr.push(lines[i].t); i++; }
      for (; i < lines.length; i++) r.stappen.push(lines[i].t);
      if (!r.ingr.length) { r.stappen = rest.concat(r.stappen); rest.length = 0; }
      r.intro = rest;
    } else r.intro = r.intro.map(x => x.t);
    r.intro = r.intro.filter(x => !((RX.pers.test(x) || /tijd|minuten/i.test(x)) && x.length < 70));
    return r;
  }
  function meta(r, line) {
    const p = RX.pers.exec(line);
    if (p && !r.personen && +p[1] > 0 && +p[1] < 100) r.personen = +p[1];
    if (/tijd|bereiding|klaar|duur|minuten|min\b/i.test(line)) {
      const t = RX.time.exec(line);
      if (t && !r.tijd) r.tijd = (+t[1] || 0) * 60 + (+t[2] || 0);
    }
  }

  // ---------------------------------------------------------------- foto's
  async function photo(zip, target) {
    const path = target.startsWith('/') ? target.slice(1) : 'word/' + target.replace(/^\.\//, '');
    const bytes = await zip.read(path);
    if (!bytes || bytes.length < 2000) return '';
    const ext = path.split('.').pop().toLowerCase();
    if (!/^(png|jpe?g|gif|webp|bmp)$/.test(ext)) return '';
    const blob = new Blob([bytes], { type: 'image/' + (ext === 'jpg' ? 'jpeg' : ext) });
    try {
      const bmp = await createImageBitmap(blob);
      const s = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
      if (bmp.width < 120 || bmp.height < 120) return '';
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', .74);
    } catch (e) { return ''; }
  }

  /** Lees één .docx. mode: 'auto' (knippen in recepten) of 'one' (hele bestand = één recept). */
  async function parse(file, opts) {
    opts = opts || {};
    const zip = await unzip(await file.arrayBuffer());
    const bs = await blocks(zip);
    const fileTitle = file.name.replace(/\.docx$/i, '').replace(/[_]+/g, ' ').trim();
    const recipes = opts.mode === 'one' ? [toRecipe(fileTitle, bs, false)] : split(bs, fileTitle);
    if (opts.photos !== false) {
      for (const r of recipes) {
        for (const t of r.imgs) { const d = await photo(zip, t); if (d) { r.foto = d; break; } }
      }
    }
    recipes.forEach(r => { delete r.imgs; r.boek = fileTitle; r.bron = file.name; });
    return recipes.filter(r => r.titel && (r.ingr.length || r.stappen.length || r.intro.length));
  }

  window.Docx = { parse };
})();
