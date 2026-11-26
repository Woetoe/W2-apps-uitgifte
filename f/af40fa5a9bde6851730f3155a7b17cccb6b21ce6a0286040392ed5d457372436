/* W2 Apps — Feedback versleutelen (en, in tools/feedback/lezen.js, weer openen).

   Feedback komt in Firebase onder /f/<id>. Die plek is voor iedereen leesbaar (de app moet er zonder account
   kunnen schrijven), dus de tekst gaat er versleuteld in: met de publieke sleutel hieronder (ECDH P-256 met een
   eenmalige sleutel per bericht, HKDF-SHA256, AES-GCM). Alleen de privésleutel in tools/feedback/ (privé-repo)
   kan hem openen. Vorm: "f1.<eenmalige publieke sleutel>.<iv>.<versleutelde tekst>", alles base64url. */
(function (root) {
  'use strict';
  const PUB = { kty: 'EC', crv: 'P-256', x: 'Iys9xP-7rr2Sy5XdnyYbv-MIRW6lDoDw9FtyUAmcbVo', y: 'td0y_GtMu5x5vTRerYfJi5HQp0D1QPJF6W02UMxziOE' };
  const INFO = 'w2-feedback-1';
  const EC = { name: 'ECDH', namedCurve: 'P-256' };
  const subtle = () => (root.crypto || globalThis.crypto).subtle;
  const enc = new TextEncoder(), dec = new TextDecoder();

  const b64u = buf => {
    let s = ''; new Uint8Array(buf).forEach(b => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const unb64u = s => {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  async function aesKey(priv, pub, salt, use) {
    const bits = await subtle().deriveBits({ name: 'ECDH', public: pub }, priv, 256);
    const hk = await subtle().importKey('raw', bits, 'HKDF', false, ['deriveKey']);
    return subtle().deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode(INFO) }, hk, { name: 'AES-GCM', length: 256 }, false, [use]);
  }

  /** Object → versleutelde tekst voor Firebase. */
  async function seal(obj, pubJwk) {
    const pub = await subtle().importKey('jwk', pubJwk || PUB, EC, false, []);
    const eph = await subtle().generateKey(EC, true, ['deriveBits']);
    const epub = new Uint8Array(await subtle().exportKey('raw', eph.publicKey));
    const key = await aesKey(eph.privateKey, pub, epub, 'encrypt');
    const iv = (root.crypto || globalThis.crypto).getRandomValues(new Uint8Array(12));
    const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return ['f1', b64u(epub), b64u(iv), b64u(ct)].join('.');
  }

  /** Versleutelde tekst → object (alleen met de privésleutel). */
  async function open(str, privJwk) {
    const p = String(str || '').split('.');
    if (p.length !== 4 || p[0] !== 'f1') throw new Error('geen feedback-bericht');
    const priv = await subtle().importKey('jwk', privJwk, EC, false, ['deriveBits']);
    const epubRaw = unb64u(p[1]);
    const epub = await subtle().importKey('raw', epubRaw, EC, false, []);
    const key = await aesKey(priv, epub, epubRaw, 'decrypt');
    const pt = await subtle().decrypt({ name: 'AES-GCM', iv: unb64u(p[2]) }, key, unb64u(p[3]));
    return JSON.parse(dec.decode(pt));
  }

  const api = { PUB, seal, open };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.W2Zegel = api;
})(typeof window !== 'undefined' ? window : globalThis);
