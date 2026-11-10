/* W2 Apps — boodschappen: afdelingen raden, hoeveelheden lezen en dingen op een gedeelde lijst zetten.
   Gebruikt door Samen (de lijsten zelf) en Recepten (ingrediënten naar de boodschappenlijst).
   Laden ná w2data.js en samen/sync.js. */
(function () {
  const D = window.W2D;

const CATS = [
  ['groente', '🥦', 'Groente & fruit', 'groente|fruit|appel|appels|peer|peren|banaan|bananen|sinaasappel|sinaasappels|mandarijn|mandarijnen|citroen|citroenen|limoen|druif|druiven|aardbei|aardbeien|framboos|frambozen|bessen|blauwe bessen|kiwi|mango|ananas|meloen|watermeloen|avocado|tomaat|tomaten|cherrytomaten|komkommer|paprika|paprika\'s|ui|uien|rode ui|knoflook|prei|wortel|wortels|winterpeen|courgette|aubergine|broccoli|bloemkool|spinazie|sla|ijsbergsla|rucola|andijvie|boerenkool|spruitjes|champignon|champignons|paddenstoelen|aardappel|aardappels|aardappelen|krieltjes|zoete aardappel|sperziebonen|peultjes|maïs|mais|gember|peterselie|basilicum|koriander|bieslook|munt|verse kruiden|lente-ui|bosui|radijs|selderij|bleekselderij|venkel|pompoen|bietjes|rabarber|granaatappel|vijgen|pruimen|perzik|nectarine|kersen|salade|roerbakgroente|soepgroente'],
  ['brood', '🍞', 'Brood & bakkerij', 'brood|bruinbrood|witbrood|volkoren|stokbrood|baguette|croissant|croissants|beschuit|crackers|knäckebröd|krentenbollen|bolletjes|broodjes|pistolets|wraps|wrap|tortilla|tortilla\'s|pita|naan|ontbijtkoek|tijgerbrood|afbakbroodjes'],
  ['zuivel', '🧀', 'Zuivel & eieren', 'melk|halfvolle melk|karnemelk|yoghurt|kwark|vla|room|slagroom|kookroom|crème fraîche|creme fraiche|zure room|boter|roomboter|margarine|halvarine|kaas|geraspte kaas|mozzarella|feta|parmezaan|brie|camembert|geitenkaas|roomkaas|philadelphia|cottage cheese|ei|eieren|skyr|havermelk|sojamelk|amandelmelk|mascarpone|ricotta|griekse yoghurt'],
  ['vlees', '🥩', 'Vlees, vis & vega', 'vlees|gehakt|kip|kipfilet|kippendijen|drumsticks|rundvlees|biefstuk|steak|varkensvlees|speklapjes|spekjes|bacon|ham|rookvlees|salami|chorizo|worst|worstjes|rookworst|braadworst|hamburger|hamburgers|shoarma|gyros|schnitzel|karbonade|spareribs|vis|zalm|tonijn|kabeljauw|pangasius|garnalen|mosselen|haring|makreel|vegaburger|tofu|tempeh|falafel|kipstukjes|vegetarische|filet americain|beleg'],
  ['voorraad', '🥫', 'Voorraad', 'pasta|spaghetti|macaroni|penne|fusilli|lasagne|lasagnebladen|tagliatelle|noedels|mie|rijst|basmati|zilvervliesrijst|couscous|quinoa|bulgur|bloem|meel|zelfrijzend bakmeel|suiker|basterdsuiker|poedersuiker|zout|peper|kruiden|paprikapoeder|kerrie|olie|olijfolie|zonnebloemolie|azijn|ketchup|mayonaise|mayo|mosterd|sambal|sojasaus|ketjap|pesto|tomatenpuree|passata|gepelde tomaten|tomatenblokjes|saus|pastasaus|soep|bouillon|bouillonblokjes|kikkererwten|linzen|kidneybonen|bonen|pindakaas|jam|hagelslag|chocopasta|nutella|honing|stroop|muesli|cornflakes|havermout|cruesli|granola|noten|pinda\'s|rozijnen|koffie|koffiebonen|koffiepads|koffiecups|thee|bakpoeder|gist|vanillesuiker|cacao|kokosmelk|tacos|taco\'s|kruidenmix|boemboe|blikje|blik'],
  ['snacks', '🍪', 'Snacks & snoep', 'chips|borrelnootjes|nootjes|koek|koekjes|snoep|drop|chocola|chocolade|reep|popcorn|toastjes|zoutjes|stroopwafels|mueslirepen|kauwgom|dipsaus|tortillachips|nacho\'s'],
  ['diepvries', '🧊', 'Diepvries', 'diepvries|ijs|ijsjes|ijsblokjes|pizza|pizza\'s|patat|friet|frites|kroketten|bitterballen|frikandellen|loempia|loempia\'s|diepvriesgroente'],
  ['drinken', '🥤', 'Drinken', 'water|spa|bruiswater|frisdrank|cola|fanta|sprite|sinas|ice tea|icetea|sap|jus|jus d\'orange|appelsap|sinaasappelsap|limonade|siroop|ranja|bier|biertjes|wijn|rode wijn|witte wijn|rosé|prosecco|champagne|radler|energiedrank|tonic'],
  ['huishouden', '🧻', 'Huishouden', 'wc-papier|wcpapier|toiletpapier|keukenpapier|keukenrol|tissues|zakdoekjes|afwasmiddel|vaatwastabletten|vaatwasblokjes|wasmiddel|wasverzachter|allesreiniger|schoonmaakmiddel|bleek|sponsjes|spons|vuilniszakken|afvalzakken|pedaalemmerzakken|aluminiumfolie|vershoudfolie|bakpapier|diepvrieszakjes|batterijen|lampje|kaarsen|lucifers|ontkalker|wc-blokjes|vaatdoekje|theedoek|glorix'],
  ['verzorging', '🧴', 'Verzorging', 'tandpasta|tandenborstel|shampoo|conditioner|douchegel|zeep|handzeep|deodorant|deo|scheermesjes|scheerschuim|maandverband|tampons|inlegkruisjes|wattenschijfjes|wattenstaafjes|bodylotion|zonnebrand|pleisters|paracetamol|ibuprofen|vitamines|lenzenvloeistof|mondwater|flosdraad']
].map(([id, emoji, naam, kw]) => ({ id, emoji, naam, kw: kw.split('|') }));
CATS.push({ id: 'overig', emoji: '📦', naam: 'Overig', kw: [] });
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));

function guessCat(text) {
  const t = text.toLowerCase();
  const hist = (D.get('samen-hist', {}) || {})[t];
  if (hist && hist.cat) return hist.cat;
  const words = t.split(/[^a-zà-ÿ'-]+/).filter(Boolean);
  let best = 'overig', score = 0;
  for (const c of CATS) for (const k of c.kw) {
    let hit = false;
    if (k.includes(' ')) hit = t.includes(k);
    else hit = words.some(w => w === k || (k.length >= 4 && (w.startsWith(k) || w.endsWith(k))));
    if (hit && k.length > score) { best = c.id; score = k.length; }
  }
  return best;
}
/** "2 melk", "2x melk", "500 g gehakt", "eieren 2x" → {tekst, aantal} */
function parseQty(s) {
  s = s.trim().replace(/\s+/g, ' ');
  let m = /^(\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔])\s*(x|st|stuks?|g|gr|gram|kg|kilo|l|liter|ml|cl|pak|pakken|zak|zakken|blik|blikken|fles|flessen|bos|bossen|bosje|bosjes|doos|dozen|pot|potten|rol|rollen|stuk)?\.?\s+(.+)$/i.exec(s);
  if (m) return { tekst: m[3], aantal: m[1].replace(/\s+/g, '') + (m[2] && m[2].toLowerCase() !== 'x' ? ' ' + m[2].toLowerCase() : '') };
  m = /^(.+?)\s+(?:(\d+)\s*x|x\s*(\d+))$/i.exec(s);
  if (m) return { tekst: m[1], aantal: m[2] || m[3] };
  return { tekst: s, aantal: '' };
}
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

function remember(tekst, cat) {
  const h = D.get('samen-hist', {}) || {};
  const k = tekst.toLowerCase();
  h[k] = { tekst, cat, n: ((h[k] && h[k].n) || 0) + 1, t: Date.now() };
  const keys = Object.keys(h);
  if (keys.length > 400) keys.sort((a, b) => h[a].t - h[b].t).slice(0, keys.length - 400).forEach(x => delete h[x]);
  D.set('samen-hist', h);
}

  // Een receptregel als boodschap: "2 el olijfolie" → "olijfolie", "1 rode ui, gesnipperd" → "1 rode ui",
  // "200 g bloem (of speltmeel)" → "200 g bloem". Lepels, snufjes en teentjes koop je niet los: die hoeveelheid valt weg.
  const SMALL = /^\s*(?:\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔]|\d+\s*\/\s*\d+)?(?:\s*(?:-|–|tot|à)\s*\d+(?:[.,]\d+)?)?\s*(?:el|tl|eetlepels?|theelepels?|kl|koffielepels?|snufje|snuf|mespuntje|mespunt|scheutje|scheut|takjes?|teentjes?|tenen|teen|blaadjes?|beetje|handje|handjevol|plakjes?|schijfjes?|druppels?)\b\.?\s*(?:van\s+)?(?:de\s+|het\s+)?/i;
  function fromRecipe(line) {
    let t = String(line || '').replace(/\([^)]*\)/g, ' ').replace(/\s*[,;:].*$/, '').replace(/\s+naar smaak\s*$/i, '');
    t = t.replace(/\b(?:ca\.?|circa|ongeveer|±)\s*/gi, '').replace(SMALL, '').replace(/\s+/g, ' ').trim();
    return t;
  }
  // Wat je meestal al in huis hebt: staat in de lijst, maar niet aangevinkt.
  const STAPLE = /^(water|zout|peper|zout en peper|peper en zout|zwarte peper|olie|olijfolie|zonnebloemolie|suiker|bloem|boter|ijsblokjes|kraanwater|heet water|kokend water)$/i;
  const isStaple = t => STAPLE.test(parseQty(t).tekst.trim());

  /** Zet regels op een boodschappenlijst. Geeft {added, dup}. */
  function addLines(lijstId, lines, notitie) {
    const S = window.Samen;
    const me = S.cfg.me.id;
    const open = Object.entries(S.data.items).filter(([, i]) => i.lijst === lijstId && !i.ok).map(([id, i]) => Object.assign({ id }, i));
    let added = 0, dup = 0;
    for (const raw of lines) {
      const q = parseQty(raw);
      const tekst = cap(q.tekst.trim());
      if (!tekst) continue;
      if (open.some(i => i.tekst.toLowerCase() === tekst.toLowerCase())) { dup++; continue; }
      const it = { lijst: lijstId, tekst, aantal: q.aantal, cat: guessCat(tekst), ok: false, door: me, gemaakt: Date.now() };
      if (notitie) it.notitie = notitie;
      remember(tekst, it.cat);
      S.put('items', D.uid(), it);
      open.push(it);
      added++;
    }
    return { added, dup };
  }
  const lists = () => !window.Samen || !Samen.cfg ? [] : Object.entries(Samen.data.lijsten).map(([id, l]) => Object.assign({ id }, l))
    .filter(l => l.soort === 'boodschappen').sort((a, b) => (a.pos || 0) - (b.pos || 0) || (a.gemaakt || 0) - (b.gemaakt || 0));

  // ---------------------------------------------------------------- hoeveelheden omrekenen (porties) en optellen
  const FR = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3 };
  const QTY = /^(\d+(?:[.,]\d+)?(?:\s*[½¼¾⅓⅔])?|[½¼¾⅓⅔]|\d+\s*\/\s*\d+)(\s*(?:-|–|tot)\s*(\d+(?:[.,]\d+)?|[½¼¾]))?/;
  function num(s) {
    s = String(s).trim();
    if (FR[s] != null) return FR[s];
    const f = /^(\d+)\s*\/\s*(\d+)$/.exec(s); if (f) return +f[1] / +f[2];
    const m = /^(\d+(?:[.,]\d+)?)\s*([½¼¾⅓⅔])?$/.exec(s); if (m) return parseFloat(m[1].replace(',', '.')) + (m[2] ? FR[m[2]] : 0);
    return NaN;
  }
  function fmt(n) {
    if (n >= 10) return String(Math.round(n));
    const w = Math.floor(n), r = n - w;
    const fr = [[0, ''], [.25, '¼'], [1 / 3, '⅓'], [.5, '½'], [2 / 3, '⅔'], [.75, '¾'], [1, '']];
    let best = fr[0], d = 9;
    fr.forEach(f => { const x = Math.abs(r - f[0]); if (x < d) { d = x; best = f; } });
    if (d < .04) { const ww = best[0] === 1 ? w + 1 : w; return (ww ? ww : '') + best[1] || '0'; }
    return (Math.round(n * 10) / 10).toString().replace('.', ',');
  }
  /** "200 g bloem" × 1,5 → "300 g bloem". */
  function scaleText(line, f) {
    const m = f === 1 ? null : QTY.exec(line);
    if (!m) return line;
    const a = num(m[1]); if (!isFinite(a)) return line;
    let s = fmt(a * f);
    if (m[3]) { const b = num(m[3]); if (isFinite(b)) s += '–' + fmt(b * f); }
    return s + line.slice(m[0].length);
  }
  /** Dezelfde boodschap uit meerdere recepten samennemen: "200 g gehakt" + "300 g gehakt" → "500 g gehakt". */
  function combine(lines) {
    const by = new Map();
    lines.forEach(l => {
      const q = parseQty(l), key = q.tekst.trim().toLowerCase();
      if (!key) return;
      const m = /^(\S+?)\s*(\S*)$/.exec(q.aantal || '');
      const n = m ? num(m[1]) : NaN, unit = m ? m[2] : '';
      const cur = by.get(key);
      if (!cur) { by.set(key, { tekst: q.tekst.trim(), parts: [{ n, unit, raw: q.aantal }] }); return; }
      const same = cur.parts.find(p => p.unit === unit && isFinite(p.n) && isFinite(n));
      if (same) same.n += n; else cur.parts.push({ n, unit, raw: q.aantal });
    });
    return [...by.values()].map(x => {
      const aantal = x.parts.map(p => isFinite(p.n) ? fmt(p.n) + (p.unit ? ' ' + p.unit : '') : p.raw).filter(Boolean).join(' + ');
      return (aantal ? aantal + ' ' : '') + x.tekst;
    });
  }

  window.Boodschappen = { CATS, CAT, guessCat, parseQty, cap, remember, fromRecipe, isStaple, addLines, lists, scaleText, combine, num, fmt };
})();
