/* Woordbord — computer denkt na buiten de pagina, zodat het scherm soepel blijft. */
importScripts('engine.js');
self.onmessage = function (e) {
  const d = e.data;
  WB.loadDict(d.dict).then(dict => {
    const set = WB.SETS[WB.DICTS[d.dict].set];
    const ctx = { dict, values: set.values, prem: d.prem };
    const mv = WB.choose(ctx, d.board, d.rack, d.level, d.bag, WB.DICTS[d.dict].set);
    self.postMessage({ id: d.id, mv });
  }).catch(err => self.postMessage({ id: d.id, error: String(err) }));
};
