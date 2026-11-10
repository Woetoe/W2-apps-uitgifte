/* W2 Apps — gedeelde hulp voor alle pagina's.
   - Trillen via de app (de WebView zelf kan niet trillen).
   - W2.net: verbinding met een tweede telefoon via Bluetooth/wifi (Google Nearby).
   - W2.update: updates zoeken en installeren. */
(function () {
  const native = window.W2Native || null;

  // navigator.vibrate laten werken binnen de app
  if (native) {
    try {
      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: function (p) { try { native.vibrate(JSON.stringify(p)); } catch (e) {} return true; }
      });
    } catch (e) {}
  }

  const listeners = new Set();
  window.__w2native = function (json) {
    let ev; try { ev = JSON.parse(json); } catch (e) { return; }
    listeners.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
  };

  // Uitleg bij foutcodes van Nearby, in gewone taal
  function explain(ev) {
    const c = String(ev.code || '');
    if (c === 'bt-off') return 'Bluetooth staat uit. Zet Bluetooth aan (in vliegtuigmodus mag dat) en probeer opnieuw.';
    if (c === 'location-off') return 'Locatie staat uit. Zonder locatie vindt Android geen telefoons in de buurt. Zet Locatie aan en probeer opnieuw.';
    if (c === 'gms') return 'Google Play-services ontbreekt of moet worden bijgewerkt. Werk het bij via de Play Store; zonder Play-services werkt spelen met meer telefoons niet.';
    if (c === 'permission-blocked') return 'De app mag geen telefoons in de buurt zoeken. Zet bij Rechten "Apparaten in de buurt" en "Locatie" aan (ongeveer is genoeg); het scherm daarvoor is net geopend.';
    if (c === 'nearby-timeout') return 'De verbinding in de buurt reageert niet. Probeer het nog eens; helpt dat niet, zet Bluetooth even uit en aan of herstart de telefoon.';
    if (c === 'too-big') return 'Er ging iets mis bij het versturen (bericht te groot). Meld dit even.';
    if (c === 'permission') return 'Zonder toestemming voor Apparaten in de buurt en Locatie (ongeveer is genoeg) kan de app geen andere telefoon vinden. Zet die aan via Instellingen › Apps › W2 Apps › Rechten.';
    if (c === '8007' || c === '17') return 'Bluetooth of wifi lijkt uit te staan. Zet Bluetooth aan (in vliegtuigmodus mag dat) en probeer opnieuw.';
    if (/^80(29|3\d)$/.test(c)) return 'De app mist toestemming (' + c + '). Geef W2 Apps toestemming voor Apparaten in de buurt én Locatie (ongeveer is genoeg) via Instellingen › Apps › W2 Apps › Rechten, en probeer opnieuw.';
    if (c === '8008' || c === '8001' || c === '8002') return 'De verbinding was nog bezig. Ga terug, open het spel opnieuw en probeer nog een keer.';
    if (c === '8050') return 'Een andere app gebruikt de verbinding in de buurt al. Sluit die app en probeer opnieuw.';
    if (c === '8011') return 'Kon geen verbinding maken. Houd de telefoons dicht bij elkaar en probeer opnieuw.';
    if (c === '8012') return 'De andere telefoon is net buiten bereik of gestopt. Probeer opnieuw.';
    if (c === '13' || c === '8') return 'Er ging iets mis met Google Play-services. Herstart de app en probeer opnieuw.';
    return 'Er ging iets mis (' + (ev.where || '') + ' ' + c + '). Check of Bluetooth, wifi en locatie aanstaan en probeer opnieuw.';
  }

  window.W2 = {
    inApp: !!native,
    net: {
      available: () => !!native,
      on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      host(name) { native && native.host(name || 'Speler'); },
      join(name) { native && native.join(name || 'Speler'); },
      connect(id) { native && native.connect(id); },
      send(obj) { native && native.send(JSON.stringify(obj)); },
      stop() { native && native.stop(); },
      stopSearching() { native && native.stopSearching(); },
      isConnected() { try { return !!(native && native.isConnected()); } catch (e) { return false; } },
      // Groepsspellen: één host, meerdere telefoons (vanaf app-versie met native 3)
      multiAvailable: () => !!(native && native.hostMulti),
      hostMulti(name) { native && native.hostMulti && native.hostMulti(name || 'Speler'); },
      joinMulti(name) { native && native.joinMulti && native.joinMulti(name || 'Speler'); },
      sendTo(id, obj) { native && native.sendTo && native.sendTo(id, JSON.stringify(obj)); },
      disconnect(id) { native && native.disconnect && native.disconnect(id); },
      peers() { try { return JSON.parse(native.peers()); } catch (e) { return []; } },
      // Controle voor het scherm Verbinding testen (vanaf native 5)
      diag() { try { return native && native.diag ? JSON.parse(native.diag()) : null; } catch (e) { return null; } },
      fix(kind) { native && native.openSettings && native.openSettings(kind); },
      askPerms() { native && native.requestPerms && native.requestPerms(); },
      note(t) { try { native && native.logNote && native.logNote(String(t)); } catch (e) {} },
      explain
    },
    // Updates: nieuwe spelbestanden ophalen zonder nieuwe APK (zie Updater.java)
    update: {
      available: () => !!(native && native.checkUpdate),
      info() { try { return JSON.parse(native.updateInfo()); } catch (e) { return {}; } },
      on(fn) { const f = ev => { if (ev.type === 'update') fn(ev); }; listeners.add(f); return () => listeners.delete(f); },
      check() { native && native.checkUpdate && native.checkUpdate(); },
      apply() { native && native.applyUpdate && native.applyUpdate(); },
      installApk() { native && native.installApk && native.installApk(); },
      openReleases() { native && native.openReleases && native.openReleases(); },
      reload() { if (native && native.reloadApp) native.reloadApp(); else location.reload(); }
    },
    // Gegevens doorgeven aan de app zelf (widgets op het startscherm, herinneringen). Vanaf native 9; daarvoor doet het niets.
    publish(key, obj) {
      if (native && native.publish) { try { native.publish(String(key), JSON.stringify(obj)); } catch (e) {} }
    },
    // Scherm aan houden zolang deze pagina het nodig heeft (hardlooptrainer, kookmodus). Vanaf native 8;
    // in de browser via de Wake Lock-API. Spellen houden het scherm vanzelf aan.
    awake(on) {
      if (native && native.keepAwake) { try { native.keepAwake(!!on); } catch (e) {} return; }
      try {
        if (on && navigator.wakeLock && !awakeLock) navigator.wakeLock.request('screen').then(l => { awakeLock = l; }).catch(() => {});
        else if (!on && awakeLock) { awakeLock.release(); awakeLock = null; }
      } catch (e) {}
    },
    // Meldingen (vanaf native 8): toestemming vragen. Geeft 'ok', 'blocked', 'off', 'ask' of 'n/a'.
    notify: {
      available: () => !!(native && native.notifyStatus),
      status() { try { return native.notifyStatus(); } catch (e) { return 'n/a'; } },
      ask() {
        if (!native || !native.notifyAsk) return Promise.resolve('n/a');
        const now = W2.notify.status();
        if (now === 'ok') return Promise.resolve('ok');
        return new Promise(res => {
          let done = false;
          const finish = st => { if (done) return; done = true; listeners.delete(f); document.removeEventListener('visibilitychange', vis); res(st); };
          const f = ev => { if (ev.type === 'notify' && ev.state !== 'blocked' && ev.state !== 'off') finish(ev.state); };
          // naar de instellingen gestuurd: bij terugkomen opnieuw kijken
          const vis = () => { if (!document.hidden) setTimeout(() => finish(W2.notify.status()), 300); };
          listeners.add(f);
          document.addEventListener('visibilitychange', vis);
          setTimeout(() => finish(W2.notify.status()), 120000);
          native.notifyAsk();
        });
      }
    },
    // Foto herkennen op de telefoon (vanaf native 10): tekstregels met plek en streepjescodes.
    // wat = 'tekst' | 'code' | 'alles'. Geeft {ok, w, h, lines:[{t,x,y,w,h}], codes:[…]} of null (kan niet).
    herken: {
      available: () => !!(native && native.scanImage),
      foto(dataUrl, wat) {
        if (!native || !native.scanImage) return Promise.resolve(null);
        return ask('scan', 60000, id => native.scanImage(id, dataUrl, wat || 'alles'));
      }
    },
    // Iets ophalen bij een van de vaste diensten van de Verzameling (TCGdex, MusicBrainz, Discogs…).
    // In de app via de app zelf (native 10), anders gewoon fetch. Geeft {status, body} of {status, b64, type}; status 0 = mislukt.
    async get(url, binary) {
      if (native && native.httpGet) {
        const r = await ask('http', 45000, id => native.httpGet(id, url, !!binary));
        return r || { status: 0, fout: 'geen antwoord' };
      }
      try {
        const r = await fetch(url, { headers: { Accept: binary ? 'image/*' : 'application/json' } });
        if (!binary) return { status: r.status, body: await r.text() };
        const b = await r.blob();
        const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(b); });
        return { status: r.status, b64, type: b.type };
      } catch (e) { return { status: 0, fout: navigator.onLine === false ? 'geen internet' : String(e.message || e) }; }
    }
  };
  let awakeLock = null, seq = 0;
  // Native vraag met antwoord via een gebeurtenis {type, id, json}
  function ask(type, timeout, start) {
    return new Promise(res => {
      const id = type + (++seq) + '-' + Date.now().toString(36);
      let t = null;
      const f = ev => {
        if (ev.type !== type || ev.id !== id) return;
        listeners.delete(f); clearTimeout(t);
        try { res(JSON.parse(ev.json)); } catch (e) { res(null); }
      };
      listeners.add(f);
      t = setTimeout(() => { listeners.delete(f); res(null); }, timeout);
      try { start(id); } catch (e) { listeners.delete(f); clearTimeout(t); res(null); }
    });
  }
})();
