/* W2 Apps — alleen in de webversie (iPhone, laptop). tools/uitgifte.py zet dit bestand vóór w2.js op elke pagina.
   - meldt de service worker aan (sw.js), die alles op het apparaat bewaart zodat het ook zonder internet werkt;
   - maakt de pagina's op een iPhone prettiger: geen zoomen bij dubbeltikken, geen meeveren, geen menu bij lang drukken;
   - geluid: Safari laat een spel pas geluid maken na een tik. Elk spel maakt zijn eigen geluidskanaal; hier
     worden die bij de eerstvolgende tik aangezet. */
(function () {
  window.W2WEB = 1;
  var here = document.currentScript && document.currentScript.src;
  if ('serviceWorker' in navigator && here) {
    try { navigator.serviceWorker.register(new URL('sw.js', here).href, { scope: new URL('./', here).href }).catch(function () {}); } catch (e) {}
  }
  try {
    var st = document.createElement('style');
    st.textContent = 'html{touch-action:manipulation;-webkit-touch-callout:none;overscroll-behavior:none}';
    document.head.appendChild(st);
  } catch (e) {}
  try {
    var A = window.AudioContext || window.webkitAudioContext;
    if (A) {
      var all = [];
      var W = function () { var c = new A(); all.push(c); return c; };
      W.prototype = A.prototype;
      window.AudioContext = W; window.webkitAudioContext = W;
      var kick = function () { all.forEach(function (c) { try { if (c.state !== 'running' && c.state !== 'closed') c.resume().catch(function () {}); } catch (e) {} }); };
      ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (t) { document.addEventListener(t, kick, true); });
    }
  } catch (e) {}
})();
