/* Tegelrummy — de computer denkt na buiten de pagina, zodat het scherm soepel blijft. */
importScripts('engine.js');
self.onmessage = function (e) {
  const d = e.data;
  try { self.postMessage({ id: d.id, mv: TR.choose(d) }); }
  catch (err) { self.postMessage({ id: d.id, error: String(err) }); }
};
