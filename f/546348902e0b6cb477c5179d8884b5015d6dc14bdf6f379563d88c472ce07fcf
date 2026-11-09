/* Rekent de computerzet uit buiten de hoofdthread, zodat het scherm niet hapert. */
importScripts('engine.js');
self.onmessage = function (e) {
  const { pos, level, id } = e.data;
  let mv = null;
  try { mv = self.CHESS.chooseMove(pos, level); } catch (err) { mv = null; }
  self.postMessage({ id, mv });
};
