/* Rekent de computerzet uit buiten de hoofdthread. */
importScripts('engine.js');
self.onmessage = function (e) {
  const { pos, level, id } = e.data;
  let mv = null;
  try { mv = self.DAM.chooseMove(pos, level); } catch (err) { mv = null; }
  self.postMessage({ id, mv });
};
