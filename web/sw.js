/* W2 Apps (webversie): alles op het apparaat bewaren, zodat het ook zonder internet werkt.

   VERSION en FILES worden bij elke uitgave ingevuld door tools/uitgifte.py (pad → sha256 van het bestand).
   - Installeren: alle bestanden ophalen en controleren (klopt de hash niet, bijvoorbeeld omdat de nieuwe versie
     nog niet helemaal online staat, dan mislukt het installeren en blijft de vorige versie gewoon werken; de
     volgende keer openen probeert het opnieuw). Wat niet veranderd is, komt uit de vorige versie.
   - Daarna komt elke pagina uit deze bewaarde versie (dus altijd één versie door elkaar, ook zonder internet).
   - Alleen eigen bestanden; de database (Firebase) gaat er niet doorheen. */
const VERSION = 34;
const FILES = {"aftellen/index.html":"5ce868d034531d34a0ae914caffc601222f8d42c0467379ad71f44d83677c488","backgammon/engine.js":"3da6d85b15011eac2b378dd71711a2c00e0dcdc85fc898f7d243a37453751a82","backgammon/index.html":"9fe02f9c2eaf3986fd933aeea5997cf315e60e21deedf38d2aa090ad5abe9f4b","dammen/ai-worker.js":"a53ae6b6de17d732e7eb19c520958cbf0b10f89392b18299e46adefbd9bbd857","dammen/engine.js":"643de36ff520cd16b8e455ace024fe23d0d54e1452514ec81004343602c99085","dammen/index.html":"0dcb9eb8fed7545a0c57b220e619b4dc1582d85a515715055fbae6f02009c33a","dampoe/art.js":"82d8cfefa2354855a7fbebea3b1770e0058bee17ebe131058e0f588e178484f7","dampoe/engine.js":"72cc755d508ada43d7087d233780e892d39bbeff957bc5eeade6c45584fdf932","dampoe/index.html":"8e80993ab390caee8d4988542dc9f5c799fb21f3a67a4f939c8a7e6d843f73a6","fonts/bricolage-grotesque-latin-600-normal.woff2":"b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca","fonts/bricolage-grotesque-latin-800-normal.woff2":"3e1b5f0a56ee995b7c1445bc54e6ec98c5dffb585ef5c4baf86731cf68e27c61","fonts/dela-gothic-one-latin-400-normal.woff2":"00ffa61fea9edb126e8e4fd3cf2b46e96ad158a0c1078b3cd22a3f6964993a88","fonts/figtree-latin-400-normal.woff2":"8f98dd642986f1fa39c45b89665a57372897c235b36028e0e4a136e43dc5f8ab","fonts/figtree-latin-500-normal.woff2":"953a6a4294b1205a1b4d4b9e5529478e8c9e1c5a67a9aa24a551414cd85b6f51","fonts/figtree-latin-600-normal.woff2":"367d713287918784702563518f59239989da815c80d3c7337686b9816635a08b","fonts/figtree-latin-700-normal.woff2":"7ec4f08d09f91d349917dd6592f6aaae66d8fe1bbd58fa24707961e79236616e","fonts/figtree-latin-800-normal.woff2":"90f6908a05e4dc417647be6d0637eb8ecb7977cab9e577ab284d02c2092111e3","fonts/fonts.css":"e6246d3dcf22d62ba429546b7ddef73c908c55c88e03cf3a69ff9cab454b8ec5","halma/engine.js":"e0a4d60f83c2a40f991c4b08b99711efabb9a759a6b931f48a78f22dd00b4b53","halma/index.html":"5ef03c9d531ef15ab85f9a382e323499bb102e12afb498b96cb491a35e9028d4","icon-180.png":"8b8937f5cd51024318c24e8cf3e1ff575a303bc67c79872949ca07213f85a0e7","icon-192.png":"0c6849e30597ab27f02a58631a0b7f6f431a3311b8d838dac9e5cd9b539f4f34","icon-512.png":"832d8b70a8779c92c7d77d2cb670bbb9ceb7e84bba3cbf9adf73c11b31df744b","index.html":"9d8215914a75a67de0804a4afd6ef3485164bf085feda883d208929d2cb109e3","inet.js":"89feca99ea3bea18cc88aa7430fbca5a9e53d377b1a8159f175ab7375ab6fd6d","klaverjassen/ai-worker.js":"a79ba9f3e85df982ed6e9514f67025db5130ef803f3d7d13962b95b7b1496321","klaverjassen/engine.js":"5e132c667e5c077a668228cc5f6a84ef329724f14b2e4127de904ef5e223cbbe","klaverjassen/index.html":"bc2e91321156c8741971f6e0a98a38a695a0e9a2ca7c8860859df58ddfbf56aa","kronkel/engine.js":"b578959981ef5ab45daa52ca2cc7485ebbbc7e57384d4af4c809e0b9de574a89","kronkel/index.html":"66748ce03e0500451c051969b1ff6853c1cffaf4e25dfd7d7df50cc60ca58de4","legtuit/index.html":"26ca42906cb5de0f13cd79b1091e3e5fba2e2a10db9468f78fafc69f0d86920e","manifest.webmanifest":"570778daa56dfc92d5fc8f4355648115e85b58932510cdd12d8e72070275cc5d","netgame.js":"54a2f5dd62385460cc4a13ae19e33d5d3245c52a28142d46f5b608c94b6d09c8","recepten/docx.js":"a38820f5efd77e74487845f52e8b0092adfca1f2d2a520e7228800a3cd83b6e6","recepten/index.html":"fdcf507fa702f9924b42ccfea914a02f6db2053342f4c9c1d3cb2d3efa8e3d4a","reizen/index.html":"53c05d03f84b6c0b93b18a46eb4483390597b20890885d0f3dea57861e565782","reizen/invulbestand-reizen.xlsx":"e2754f6363e1a4524a71c5afe9fbe5f73bc49e23ebbcbb38f84591b1e03440bb","reizen/xlsx.js":"6b365d42217c5cc5d66e835bffff8b2bca73017c35e99e9eed392daa20e9bbeb","samen/boodschappen.js":"b15ee4536755be5ff6494cdad6a168520a36d0e92e917dfc65dbbdd00e87aa73","samen/deel.js":"1ff432782cb57357fccf827295733bc860ecc64dd6465a64f196ea13bb2da7cc","samen/index.html":"18f389c1fa7d69e54f7999ca180665e6a1f44a0801de9f81a0e3650607e06e50","samen/sync.js":"f3ef29de43145a9318c0b7340f1535ca54d0bd777a9dd1a2bec4a7229e00a5ff","schaken/ai-worker.js":"546348902e0b6cb477c5179d8884b5015d6dc14bdf6f379563d88c472ce07fcf","schaken/engine.js":"f59be8ec0ee8e69589ad0c9ad723abd8c4464c9e77758e1359f425107cd36849","schaken/index.html":"82bf0cf9ff4dc6f9995c01443c8b9d923c25883d0c1cc57a0854a707d42125f7","tegelrummy/ai-worker.js":"2efd7fbd0eeb1f8cb49c960201f24a90600718e18da01781e54bc95be5bcc0c2","tegelrummy/engine.js":"5181ccda71f715a424ece31c7e9d9556d0af60a8dbad7719c3ccee920d8fd4d7","tegelrummy/index.html":"c9d4772805dd3042cfde989677a57a026ce419cf2ca99dea6ac3007ecd6a3f7e","vingerspel/index.html":"ffac971920e6f3853cf2914066cf7b7d6e8c7616daf4e84f6a07853327987c80","w2.js":"74a6e2e1e9aba9bf7bf987cb0cb07fb275eb3ea906d6cd0a5a989d269f31c8a3","w2data.js":"04fe2a444af2f892d8756e6fd663fee54d1ffe1e630287302af14c3b0b319e1a","w2game.css":"f9003701ea75e130fde122a433b5d4d7e23497db544d8e1b840586da6c8e0754","w2ui.css":"560352cca534c7c9cf950db1699638015000c788367b434dfd23ede4dc11a7dd","w2ui.js":"26be4651475c8fe98578c2a0d48bf6ea0ee901d901b96214c91ae34b7f326fcd","web.js":"8cea59fe0a88c495a906131d2385b177649d61bb21ed295d9e57541ba2ee54a8","woordbord/LICENSE-opentaal.txt":"4633afec7da0033afad9271d3d4e2d5e531c255339517d65ffe15fbf6e4292d8","woordbord/ai-worker.js":"ad9341c2bec48230644eb010774a1e1d3f3d5460f42a85b21d092271826067e1","woordbord/avatar.js":"a7d494aba1cab3e4f2f3e67a706a9fa32113f0d1796a5310f948f66d3bc8cb85","woordbord/dict-en.bin":"6e3e3df8387677f4e5cd421a666eb0477b5a81e3db5db499aac501f72a9e1505","woordbord/dict-nl.bin":"a2b1eeee2ccf21a6a52b2838ea7da4e05904d13cdc145cfc2904b3a119f63ba4","woordbord/engine.js":"5a7c3d25f49368285b54b07e167b66d215ce92fd16e57a48895e4b98af2434f5","woordbord/index.html":"3d6489bb89915bac385596712df13075a8130009a746f16d2cbb4855d2ac4fc2","woordbord/themes.js":"898523f96654fbbd447a02cb9a7cfe44952600d3ac587ba64e4e17111ee13623","zeeslag/engine.js":"09ba6affcc7b13d2effd54780fdf48353132c68bf3181676bbbbbce0d296e55b","zeeslag/index.html":"366e9fb80aa080aca9c8f944c1af0a2107b76aa7d510711577724c05164338b7"};
const PREFIX = 'w2-web-';
const CACHE = PREFIX + VERSION;
const SCOPE = new URL('./', self.location).pathname;
const LIST = '__bestanden.json';

const hex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');

async function precache() {
  const cache = await caches.open(CACHE);
  // vorige versie: wat dezelfde hash heeft hoeft niet opnieuw opgehaald
  let old = null, oldFiles = {};
  for (const name of await caches.keys()) {
    if (!name.startsWith(PREFIX) || name === CACHE) continue;
    const c = await caches.open(name);
    const r = await c.match(SCOPE + LIST);
    if (!r) continue;
    try { oldFiles = await r.json(); old = c; } catch (e) {}
  }
  const paths = Object.keys(FILES);
  let next = 0;
  async function worker() {
    while (next < paths.length) {
      const p = paths[next++], want = FILES[p];
      if (await cache.match(SCOPE + p)) continue;   // al binnen bij een eerdere poging
      if (old && oldFiles[p] === want) {
        const r = await old.match(SCOPE + p);
        if (r) { await cache.put(SCOPE + p, r); continue; }
      }
      const r = await fetch(SCOPE + p + '?v=' + want.slice(0, 12), { cache: 'no-store' });
      if (!r.ok) throw new Error('ophalen mislukt: ' + p + ' (' + r.status + ')');
      const buf = await r.arrayBuffer();
      if (hex(await crypto.subtle.digest('SHA-256', buf)) !== want) throw new Error('nog niet de nieuwe versie: ' + p);
      await cache.put(SCOPE + p, new Response(buf, { headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/octet-stream' } }));
    }
  }
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  await cache.put(SCOPE + LIST, new Response(JSON.stringify(FILES), { headers: { 'Content-Type': 'application/json' } }));
}

self.addEventListener('install', e => e.waitUntil(precache().then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const name of await caches.keys()) if ((name.startsWith(PREFIX) && name !== CACHE) || name === 'w2-samen-web') await caches.delete(name);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin || !u.pathname.startsWith(SCOPE)) return;
  let rel = u.pathname.slice(SCOPE.length);
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(SCOPE + rel);
    if (hit) return hit;
    return fetch(req);
  })());
});

self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'status' || !e.ports || !e.ports[0]) return;
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    e.ports[0].postMessage({ version: VERSION, ready: !!(await cache.match(SCOPE + LIST)), files: Object.keys(FILES).length });
  })());
});
