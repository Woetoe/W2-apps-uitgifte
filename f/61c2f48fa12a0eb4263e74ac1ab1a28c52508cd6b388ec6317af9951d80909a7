// Recept van een website halen (Recepten › Van een website, en via Delen naar W2).
// Bijna alle receptensites (AH Allerhande, Jumbo, Leukerecepten, 24Kitchen, BBC Good Food…) zetten het recept
// voor Google in de pagina als schema.org/Recipe (JSON-LD). Dat lezen we; lukt dat niet, dan microdata (itemprop).
// Los te testen in node (tests/webrecept.test.js); in de pagina als window.WebRecept.
(function (root) {
  'use strict';

  const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', euml: 'ë', iuml: 'ï', ouml: 'ö', uuml: 'ü', auml: 'ä',
    aacute: 'á', agrave: 'à', ecirc: 'ê', ccedil: 'ç', frac12: '½', frac14: '¼', frac34: '¾', deg: '°', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', times: '×' };
  function decode(s) {
    return String(s == null ? '' : s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
      if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1); try { return String.fromCodePoint(n); } catch (x) { return m; } }
      const v = NAMED[e.toLowerCase()]; return v == null ? m : v;
    });
  }
  /** HTML naar platte tekst: <br>/<p>/<li> worden regels, tags weg, entiteiten omgezet. */
  function text(s) {
    return decode(String(s == null ? '' : s)
      .replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ''))
      .replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
  }
  const clean = s => text(s).replace(/\s+/g, ' ').trim();
  const arr = x => x == null ? [] : Array.isArray(x) ? x : [x];

  /** ISO 8601-duur (PT1H30M, P0DT45M) → minuten. Ook "45 min" of een getal. */
  function minutes(d) {
    if (d == null || d === '') return null;
    if (typeof d === 'number') return d > 0 ? Math.round(d) : null;
    const s = String(d).trim();
    const m = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(s);
    if (m && (m[1] || m[2] || m[3] || m[4])) {
      const t = (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0) + (+m[4] || 0) / 60;
      return t > 0 ? Math.round(t) : null;
    }
    const u = /(\d+)\s*(?:uur|u\b|h\b|hours?)(?:\s*(\d+)\s*(?:min|m\b))?/i.exec(s);
    if (u) return +u[1] * 60 + (+u[2] || 0);
    const n = /(\d+)/.exec(s);
    return n ? +n[1] : null;
  }

  /** "4 personen", ["4", "4 servings"], 4 → 4. */
  function persons(y) {
    for (const v of arr(y)) {
      const m = /(\d+)/.exec(String(v));
      if (m && +m[1] > 0 && +m[1] <= 100) return +m[1];
    }
    return null;
  }

  /** Bereiding: tekst, lijst met teksten, HowToStep, HowToSection (met kopje) – alles plat als losse stappen. */
  function steps(ins) {
    const out = [];
    const add = s => text(s).split(/\n+/).map(x => x.replace(/^\s*(?:stap\s*)?\d+[.):]\s+/i, '').trim()).filter(Boolean).forEach(x => out.push(x));
    const walk = x => {
      if (x == null) return;
      if (typeof x === 'string') return add(x);
      if (Array.isArray(x)) return x.forEach(walk);
      if (typeof x !== 'object') return;
      const t = arr(x['@type']).join(' ');
      if (/HowToSection/i.test(t) || (x.itemListElement && !x.text)) {
        if (x.name && arr(x.itemListElement).length) out.push(clean(x.name).replace(/:?$/, ':'));
        return walk(x.itemListElement);
      }
      if (x.text != null) return add(x.text);
      if (x.name != null) return add(x.name);
      if (x.description != null) return add(x.description);
    };
    walk(ins);
    // Kopje zonder stappen erachter weghalen
    return out.filter((s, i) => !(/:$/.test(s) && (i === out.length - 1 || /:$/.test(out[i + 1]))));
  }

  function imageUrl(im, base) {
    for (const x of arr(im)) {
      const u = typeof x === 'string' ? x : x && (x.url || x.contentUrl || (x['@id'] && /^https?:/.test(x['@id']) ? x['@id'] : ''));
      if (u) { try { return new URL(decode(u), base || undefined).href; } catch (e) { /* volgende */ } }
    }
    return '';
  }

  const isRecipe = o => o && typeof o === 'object' && arr(o['@type']).some(t => /(^|\/)Recipe$/i.test(String(t)));
  function findRecipe(x, depth) {
    if (!x || typeof x !== 'object' || depth > 8) return null;
    if (Array.isArray(x)) { for (const y of x) { const r = findRecipe(y, depth + 1); if (r) return r; } return null; }
    if (isRecipe(x)) return x;
    for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item']) { const r = findRecipe(x[k], depth + 1); if (r) return r; }
    return null;
  }

  /** Losse regeleinden en tabs binnen teksten (komt op sommige sites voor) netjes escapen. */
  function fixJson(s) {
    let o = '', inStr = false, esc = false;
    for (const ch of s) {
      if (inStr) {
        if (esc) { esc = false; o += ch; continue; }
        if (ch === '\\') { esc = true; o += ch; continue; }
        if (ch === '"') { inStr = false; o += ch; continue; }
        if (ch === '\n') { o += '\\n'; continue; }
        if (ch < ' ') { o += ch === '\r' ? '' : ' '; continue; }
        o += ch;
      } else { if (ch === '"') inStr = true; o += ch; }
    }
    return o;
  }

  function jsonLd(html) {
    const out = [];
    const rx = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi;
    let m;
    while ((m = rx.exec(html))) {
      let s = m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, '').replace(/^\s*\/\/\s*<!--|-->\s*$/g, '').trim();
      try { out.push(JSON.parse(s)); continue; } catch (e) { /* hieronder nog een poging */ }
      try { out.push(JSON.parse(fixJson(s))); } catch (e) { /* overslaan */ }
    }
    return out;
  }

  function meta(html, prop) {
    const rx = new RegExp(`<meta\\b[^>]*(?:property|name)\\s*=\\s*["']${prop}["'][^>]*>`, 'i');
    const m = rx.exec(html); if (!m) return '';
    const c = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(m[0]);
    return c ? decode(c[1] != null ? c[1] : c[2]).trim() : '';
  }

  /** Microdata (itemprop) als er geen JSON-LD is. Simpel maar genoeg voor oudere sites. */
  function microdata(html) {
    if (!/itemtype\s*=\s*["'][^"']*schema\.org\/Recipe/i.test(html)) return null;
    const props = name => {
      const out = [];
      const rx = new RegExp(`<(\\w+)\\b[^>]*itemprop\\s*=\\s*["'][^"']*\\b${name}\\b[^"']*["'][^>]*>`, 'gi');
      let m;
      while ((m = rx.exec(html))) {
        const tag = m[1].toLowerCase(), open = m[0];
        const c = /content\s*=\s*["']([^"']*)["']/i.exec(open);
        if (c || tag === 'meta') { out.push(decode(c ? c[1] : '')); continue; }
        const end = html.indexOf('</' + tag, rx.lastIndex);
        if (end < 0) continue;
        out.push(html.slice(rx.lastIndex, end));
      }
      return out;
    };
    return {
      '@type': 'Recipe',
      name: props('name')[0],
      recipeIngredient: props('recipeIngredient').concat(props('ingredients')).map(clean),
      recipeInstructions: props('recipeInstructions').join('\n'),
      recipeYield: props('recipeYield')[0],
      totalTime: props('totalTime')[0],
      description: props('description')[0]
    };
  }

  /**
   * HTML van een receptpagina → { titel, personen, tijd, ingr, stappen, tips, intro, bron, fotoUrl }.
   * Gooit een fout met een begrijpelijke tekst als er geen recept in staat.
   */
  function parse(html, url) {
    html = String(html || '');
    let r = null;
    for (const j of jsonLd(html)) { r = findRecipe(j, 0); if (r) break; }
    if (!r) r = microdata(html);
    if (!r) {
      const err = new Error('Op deze pagina staat geen recept dat de app kan lezen. Je kunt het recept zelf typen of de tekst plakken.');
      err.code = 'geen-recept';
      throw err;
    }
    const ingr = arr(r.recipeIngredient || r.ingredients).flatMap(x => text(typeof x === 'object' && x ? (x.text || x.name || '') : x).split(/\n+/)).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const stappen = steps(r.recipeInstructions);
    const titel = clean(r.name || r.headline || '') || clean(meta(html, 'og:title')).replace(/\s+\|\s+[^|]{1,40}$/, '') || 'Recept';
    const tijd = minutes(r.totalTime) || ((minutes(r.prepTime) || 0) + (minutes(r.cookTime) || 0)) || null;
    const desc = clean(r.description || '');
    const tips = [];
    if (r.notes || r.recipeNotes) tips.push(...text(r.notes || r.recipeNotes).split(/\n+/).filter(Boolean));
    if (!ingr.length && !stappen.length) {
      const err = new Error('Het recept op deze pagina is leeg of afgeschermd. Je kunt het zelf typen.');
      err.code = 'leeg';
      throw err;
    }
    return {
      titel: titel.slice(0, 140),
      personen: persons(r.recipeYield || r.yield),
      tijd: tijd && tijd <= 72 * 60 ? tijd : null,
      ingr,
      stappen,
      tips,
      intro: desc ? [desc.length > 600 ? desc.slice(0, 600).replace(/\s+\S*$/, '') + '…' : desc] : [],
      bron: url || '',
      fotoUrl: imageUrl(r.image || r.thumbnailUrl, url) || (meta(html, 'og:image') ? imageUrl(meta(html, 'og:image'), url) : '')
    };
  }

  /** Eerste http(s)-link uit een stuk tekst (bv. "Lekker! https://www.ah.nl/allerhande/recept/R-R1192?x=1"). */
  function findUrl(s) {
    const m = /https?:\/\/[^\s<>"'`]+/i.exec(String(s || ''));
    if (!m) return '';
    return m[0].replace(/[),.;!?]+$/, '');
  }

  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

  const api = { parse, findUrl, host, minutes, persons, steps, decode };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WebRecept = api;
})(typeof window !== 'undefined' ? window : this);
