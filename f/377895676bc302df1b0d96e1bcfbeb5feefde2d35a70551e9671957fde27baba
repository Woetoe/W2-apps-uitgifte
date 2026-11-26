/* W2 Apps — Feedback versturen: eerst op de telefoon bewaren (W2D 'feedback'), dan versleuteld naar Firebase /f/<id>.
   Lukt het niet (geen internet, database-regels nog niet geplakt), dan blijft het staan en gaat het later alsnog.
   Elke week haalt een GitHub-workflow /f op naar de branch "feedback" (tools/feedback/ophalen.js) en neemt Claude
   het door (tools/feedback/LEESMIJ.md). */
(function (root) {
  'use strict';
  const DEFAULT_URL = 'https://w2-samen-default-rtdb.europe-west1.firebasedatabase.app';
  const KEY = 'feedback';
  const SOORTEN = { idee: '💡 Idee', fout: '🐞 Fout', anders: '💬 Anders' };

  /** Op tijd te sorteren id: tijd in base36 + willekeurig stuk (alleen a-z0-9, zoals de regels eisen). */
  function nieuwId() {
    const a = (root.crypto || globalThis.crypto).getRandomValues(new Uint8Array(6));
    return Date.now().toString(36) + Array.from(a, b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  }

  /** Eén bericht naar Firebase. Gooit een fout met .status bij weigering (401 = regels ontbreken). */
  async function stuur(item, opts) {
    opts = opts || {};
    const Z = opts.zegel || root.W2Zegel || (typeof module === 'object' && module.exports ? require('./zegel.js') : null);
    const f = opts.fetch || root.fetch.bind(root);
    const url = String(opts.url || root.W2_SAMEN_URL || DEFAULT_URL).replace(/\/+$/, '');
    const inhoud = { soort: item.soort, onderdeel: item.onderdeel, tekst: item.tekst, naam: item.naam || '', op: item.op, versie: item.versie || '', apparaat: item.apparaat || '' };
    const v = await Z.seal(inhoud);
    const r = await f(url + '/f/' + item.id + '.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v, t: { '.sv': 'timestamp' } }) });
    if (!r.ok) {
      // Eerder toch aangekomen (alleen het antwoord niet)? Dan weigeren de regels een tweede keer; dat is goed.
      try { const g = await f(url + '/f/' + item.id + '.json'); if (g.ok && await g.json()) return true; } catch (e) {}
      const e = new Error('Firebase weigerde (' + r.status + ')'); e.status = r.status; throw e;
    }
    return true;
  }

  /** Alles wat nog wacht versturen. Geeft { verstuurd, wacht, regels } terug (regels = database-regels ontbreken). */
  async function inhalen(D, opts) {
    const st = D.get(KEY, null) || { lijst: [] };
    let verstuurd = 0, regels = false;
    for (const it of st.lijst) {
      if (it.status === 'verstuurd') continue;
      try { await stuur(it, opts); it.status = 'verstuurd'; it.verstuurd = Date.now(); verstuurd++; }
      catch (e) {
        if (e.status === 401 || e.status === 403) regels = true;
        it.fout = e.status ? 'geweigerd (' + e.status + ')' : 'geen verbinding';
        if (!e.status) break;   // geen internet: de rest ook niet proberen
      }
    }
    D.set(KEY, st);
    return { verstuurd, wacht: st.lijst.filter(x => x.status !== 'verstuurd').length, regels };
  }

  /** Nieuw bericht bewaren (status 'wacht') en meteen proberen te versturen. */
  async function nieuw(D, velden, opts) {
    const st = D.get(KEY, null) || { lijst: [] };
    const it = Object.assign({ id: nieuwId(), op: new Date().toISOString(), status: 'wacht' }, velden);
    it.tekst = String(it.tekst || '').trim().slice(0, 4000);
    st.lijst.unshift(it);
    D.set(KEY, st);
    const r = await inhalen(D, opts);
    return Object.assign({ item: (D.get(KEY, null) || { lijst: [] }).lijst.find(x => x.id === it.id) || it }, r);
  }

  const api = { DEFAULT_URL, KEY, SOORTEN, nieuwId, stuur, inhalen, nieuw };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.W2Feedback = api;
})(typeof window !== 'undefined' ? window : globalThis);
