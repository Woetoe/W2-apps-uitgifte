/* Rekent de kaart van een computerspeler uit buiten de hoofdthread (vooral voor 'sterk'). */
importScripts('engine.js');
self.onmessage = function (e) {
  const { R, p, level, id } = e.data;
  let c = null;
  try { c = self.KJ.chooseCard(R, p, level); } catch (err) { c = null; }
  self.postMessage({ id, c });
};
