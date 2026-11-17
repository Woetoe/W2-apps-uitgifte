// Herhalende to-do's (Samen): welke datum komt er na het afvinken?
// Los te testen in node (tests/herhaal.test.js); in de pagina als window.Herhaal.
(function (root) {
  'use strict';
  const SOORTEN = [
    ['dag', 'Elke dag'],
    ['werkdag', 'Elke werkdag'],
    ['week', 'Elke week'],
    ['2week', 'Om de week'],
    ['maand', 'Elke maand'],
    ['jaar', 'Elk jaar']
  ];
  const NAAM = Object.fromEntries(SOORTEN);
  const KORT = { dag: 'elke dag', werkdag: 'werkdagen', week: 'elke week', '2week': 'om de week', maand: 'elke maand', jaar: 'elk jaar' };

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null; };
  const dim = (y, m) => new Date(y, m + 1, 0).getDate();   // dagen in maand m (0–11)

  /** Eén stap verder. `dag` = gewenste dag van de maand (voor maand/jaar, zodat 31 jan → 28 feb → 31 mrt). */
  function stap(d, soort, dag) {
    const n = new Date(d.getTime());
    switch (soort) {
      case 'dag': n.setDate(n.getDate() + 1); break;
      case 'werkdag': do { n.setDate(n.getDate() + 1); } while (n.getDay() === 0 || n.getDay() === 6); break;
      case 'week': n.setDate(n.getDate() + 7); break;
      case '2week': n.setDate(n.getDate() + 14); break;
      case 'maand': case 'jaar': {
        const y = n.getFullYear() + (soort === 'jaar' ? 1 : 0), m = n.getMonth() + (soort === 'maand' ? 1 : 0);
        const yy = y + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
        return new Date(yy, mm, Math.min(dag || n.getDate(), dim(yy, mm)), 12);
      }
      default: return null;
    }
    return n;
  }

  /**
   * Volgende datum na afvinken: één stap na de huidige datum, en altijd ná vandaag
   * (te laat afgevinkt → de eerstvolgende keer, niet een rij gemiste keren).
   * Zonder datum telt vandaag als start. `anker` = eerste datum (bewaart de dag van de maand).
   */
  function volgende(datum, soort, vandaag, anker) {
    if (!NAAM[soort]) return null;
    const t = parse(vandaag) || parse(iso(new Date()));
    let d = parse(datum) || t;
    const a = parse(anker) || parse(datum);
    const dag = a ? a.getDate() : d.getDate();
    let guard = 0;
    do { d = stap(d, soort, dag); } while (d <= t && ++guard < 5000);
    return iso(d);
  }

  /** Eerste datum als je herhalen aanzet zonder datum: werkdag → vandaag of eerstvolgende werkdag, anders vandaag. */
  function start(soort, vandaag) {
    const t = parse(vandaag) || parse(iso(new Date()));
    if (soort === 'werkdag') while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() + 1);
    return iso(t);
  }

  const api = { SOORTEN, NAAM, KORT, volgende, start };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Herhaal = api;
})(typeof window !== 'undefined' ? window : this);
