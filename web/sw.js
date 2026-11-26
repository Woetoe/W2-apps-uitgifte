/* W2 Apps (webversie): alles op het apparaat bewaren, zodat het ook zonder internet werkt.

   VERSION en FILES worden bij elke uitgave ingevuld door tools/uitgifte.py (pad → sha256 van het bestand).
   - Installeren: alle bestanden ophalen en controleren (klopt de hash niet, bijvoorbeeld omdat de nieuwe versie
     nog niet helemaal online staat, dan mislukt het installeren en blijft de vorige versie gewoon werken; de
     volgende keer openen probeert het opnieuw). Wat niet veranderd is, komt uit de vorige versie.
   - Daarna komt elke pagina uit deze bewaarde versie (dus altijd één versie door elkaar, ook zonder internet).
   - Alleen eigen bestanden; de database (Firebase) gaat er niet doorheen. */
const VERSION = 50;
const FILES = {"aftellen/index.html":"5ce868d034531d34a0ae914caffc601222f8d42c0467379ad71f44d83677c488","backgammon/engine.js":"3da6d85b15011eac2b378dd71711a2c00e0dcdc85fc898f7d243a37453751a82","backgammon/index.html":"9fe02f9c2eaf3986fd933aeea5997cf315e60e21deedf38d2aa090ad5abe9f4b","dammen/ai-worker.js":"a53ae6b6de17d732e7eb19c520958cbf0b10f89392b18299e46adefbd9bbd857","dammen/engine.js":"643de36ff520cd16b8e455ace024fe23d0d54e1452514ec81004343602c99085","dammen/index.html":"0dcb9eb8fed7545a0c57b220e619b4dc1582d85a515715055fbae6f02009c33a","dampoe/art.js":"82d8cfefa2354855a7fbebea3b1770e0058bee17ebe131058e0f588e178484f7","dampoe/engine.js":"72cc755d508ada43d7087d233780e892d39bbeff957bc5eeade6c45584fdf932","dampoe/index.html":"8e80993ab390caee8d4988542dc9f5c799fb21f3a67a4f939c8a7e6d843f73a6","fonts/bricolage-grotesque-latin-600-normal.woff2":"b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca","fonts/bricolage-grotesque-latin-800-normal.woff2":"3e1b5f0a56ee995b7c1445bc54e6ec98c5dffb585ef5c4baf86731cf68e27c61","fonts/dela-gothic-one-latin-400-normal.woff2":"00ffa61fea9edb126e8e4fd3cf2b46e96ad158a0c1078b3cd22a3f6964993a88","fonts/figtree-latin-400-normal.woff2":"8f98dd642986f1fa39c45b89665a57372897c235b36028e0e4a136e43dc5f8ab","fonts/figtree-latin-500-normal.woff2":"953a6a4294b1205a1b4d4b9e5529478e8c9e1c5a67a9aa24a551414cd85b6f51","fonts/figtree-latin-600-normal.woff2":"367d713287918784702563518f59239989da815c80d3c7337686b9816635a08b","fonts/figtree-latin-700-normal.woff2":"7ec4f08d09f91d349917dd6592f6aaae66d8fe1bbd58fa24707961e79236616e","fonts/figtree-latin-800-normal.woff2":"90f6908a05e4dc417647be6d0637eb8ecb7977cab9e577ab284d02c2092111e3","fonts/fonts.css":"e6246d3dcf22d62ba429546b7ddef73c908c55c88e03cf3a69ff9cab454b8ec5","halma/engine.js":"e0a4d60f83c2a40f991c4b08b99711efabb9a759a6b931f48a78f22dd00b4b53","halma/index.html":"5ef03c9d531ef15ab85f9a382e323499bb102e12afb498b96cb491a35e9028d4","icon-180.png":"8b8937f5cd51024318c24e8cf3e1ff575a303bc67c79872949ca07213f85a0e7","icon-192.png":"0c6849e30597ab27f02a58631a0b7f6f431a3311b8d838dac9e5cd9b539f4f34","icon-512.png":"832d8b70a8779c92c7d77d2cb670bbb9ceb7e84bba3cbf9adf73c11b31df744b","index.html":"6c44a476a66fa7f1cddee339363df4e9fbf0f103e14f541fc421edd68a386627","inet.js":"89feca99ea3bea18cc88aa7430fbca5a9e53d377b1a8159f175ab7375ab6fd6d","klaverjassen/ai-worker.js":"a79ba9f3e85df982ed6e9514f67025db5130ef803f3d7d13962b95b7b1496321","klaverjassen/engine.js":"5e132c667e5c077a668228cc5f6a84ef329724f14b2e4127de904ef5e223cbbe","klaverjassen/index.html":"bc2e91321156c8741971f6e0a98a38a695a0e9a2ca7c8860859df58ddfbf56aa","kosten/index.html":"ad1b95cddab2dab38d1ecf2ca20a17767daf8a802f93dac550a80c1edf96c7cc","kosten/reken.js":"a761f372da7c7469c22d5ebdb81ab8bbd70346b85de4c422022feeaf64677aec","kronkel/engine.js":"b578959981ef5ab45daa52ca2cc7485ebbbc7e57384d4af4c809e0b9de574a89","kronkel/index.html":"66748ce03e0500451c051969b1ff6853c1cffaf4e25dfd7d7df50cc60ca58de4","kunstkamer/art.js":"bbeb16adf371f1402700d06b98d6e5d50e72e412bd7d3f9c483bdd5847511ac7","kunstkamer/engine.js":"3e6c972403954294dfe9f4b886045416d58020e979fe1339417041f184e4ecb7","kunstkamer/index.html":"90a8b68a5066da5a8f6035eb655d69a78a037868814e958ab75216026f9f3807","kunstkamer/werken/alkmaar.jpg":"662de093db7b76f55d39d99ef660f0154165af9b8ad6ce2607535c6322688130","kunstkamer/werken/astronoom.jpg":"83cdfbbe5bd2f7bbc2576f1d8d14be2d90a1b70a9b5e92291ce9e3452f49e1c4","kunstkamer/werken/binnenplaats.jpg":"e26e6aea731373f9f78ab6230a1f8924c8a783f28ce9fcafecdf32015ef72554","kunstkamer/werken/cavalier.jpg":"129024747dc4c17292cff948fb7ee48d547da2c169f034f220964b98a4e4f4d4","kunstkamer/werken/dansend.jpg":"a0a8090b3db53085b9f94dc8a2f5ca8521c8c8342f3bd57954adc8c89d4ce7d1","kunstkamer/werken/drinker.jpg":"3b5a3da4ca3993dd4fbec69a760392e5d83ace5b8bedcaf000a94306c41b4aee","kunstkamer/werken/flora.jpg":"62d63c76263cd8be243fdcec8e26e3b3606af55db94e2f13c38d3d558a1915f8","kunstkamer/werken/gebed.jpg":"9a6e23baa009454de97b678a1cef8a1362f7593a8c047d46417229b9876b44df","kunstkamer/werken/geograaf.jpg":"0296d76d3923f51acc891c3d7bce9a37bcf6761d80320f9384f6cfef361cd729","kunstkamer/werken/glaswijn.jpg":"2736a49c30dfde354d370e1dea0528ac4e41c9197b43358d25f0190565613ee8","kunstkamer/werken/hofje.jpg":"9be2ea5ebf812871288194f77bd416cb11f45fd22b44829da4b4b80f997cf60a","kunstkamer/werken/jansix.jpg":"1a13e956dc6a512b981cb29a55de1115bd180030dd6263685ae30eeb932decef","kunstkamer/werken/levensloop.jpg":"478ff6437e263bcea58718a367ccf71fcbd22d92068596033cbce94048ea7a3c","kunstkamer/werken/liefdesbrief.jpg":"b60934323a1c8b97646fe9c38f749a1882b8b611ac97a4b8d51ef351c997832d","kunstkamer/werken/melkmeisje.jpg":"6a321d455d3ff95de0f77e168929cca746b5660b193035bd07a4406142a004c7","kunstkamer/werken/nachtwacht.jpg":"dff469197950b2d99e66c80600f78e41d0728389c004ea6d39efc112eae9b0bd","kunstkamer/werken/storm.jpg":"9f72e4b6f5a56a7835e582fa122d5df4683484ac2d24b2b9a9e444986f407b65","kunstkamer/werken/tulp.jpg":"6aba8e2f106b6a5a20d62b1f917d5a781878144a06907858682cc7176c53f79f","kunstkamer/werken/vissersjongen.jpg":"f6d8019ce21609b6cd3d04feb24096928e097681ef6eae751718762288c9fed0","kunstkamer/werken/weegschaal.jpg":"6d363178f15a3707a9bcf777965a29ea0f6905c371e0a049e9efb20e6589776e","kunstkamer/werken/winter.jpg":"c15b094482fa8e04d3d28b8aba79ea24cf96e6ee64628233c107e28bbe79c4a7","kunstkamer/werken/zelfportret.jpg":"42dfb84039b08ed675e4785186f09eb2b065d6b24dea5c622481cd90ce45f857","kunstkamer/werken/zelfportret2.jpg":"8ebb99ff7d052d8afc9500d1609e4ef7600015f1f273d1fa90ebe112fadbc961","legtuit/index.html":"3240e5be8b690014173f9e75a11420338fb8ece4817e164cd9a2dd184394d36b","manifest.webmanifest":"570778daa56dfc92d5fc8f4355648115e85b58932510cdd12d8e72070275cc5d","netgame.js":"54a2f5dd62385460cc4a13ae19e33d5d3245c52a28142d46f5b608c94b6d09c8","pressure/art.js":"0946ac6191b425283b84164a4373a07243a740b98186c4ce8269fad0a458acf9","pressure/engine.js":"4fc55f23291889c4340e976120e5e13aeaa644144960e7df8a836001653d398a","pressure/index.html":"cec036bae6f8bda86acc0f50201cd2093904d5a41b79eab2cefeeb9fb4341c66","recepten/docx.js":"a38820f5efd77e74487845f52e8b0092adfca1f2d2a520e7228800a3cd83b6e6","recepten/index.html":"fc297e47d7e3f2d48f7804699b5a66e6bff1a2a231adf67f2969ec2bb558739a","recepten/web.js":"aedce86d3f4de1f1e92da9e17abca49efda72268257f9b7d30304b040f2ae51c","reizen/bwip-LICENSE.txt":"82bba405a823b6e1f9fbc499a359c9b56d8e715aed69123edbc6d4865976971f","reizen/bwip.js":"c19dd8b28a12b6a7487f5b4a90283e5542d38e3fb31bb710bfed1ab849c8419f","reizen/index.html":"46b41130d0fbf8c89877f3b9e64085a2f181ee781aee3fd42ffbb66d4bc1dd6e","reizen/invulbestand-reizen.xlsx":"e2754f6363e1a4524a71c5afe9fbe5f73bc49e23ebbcbb38f84591b1e03440bb","reizen/tickets.js":"b85f1fa989d7a29cecc23252dff83f88b24fd9f879ab9de4caf0104c2722af28","reizen/xlsx.js":"66d9a13a53b704627767198d548b46b124ee85e3b3f3e663c170f289d98ac54d","samen/boodschappen.js":"b15ee4536755be5ff6494cdad6a168520a36d0e92e917dfc65dbbdd00e87aa73","samen/deel.js":"e9e8f4a47a5f4c306b81b3bc9c2e9a74fe17df1f341302323303ba633b7a0213","samen/herhaal.js":"496448128a196055bed6d78d8b52671fa173c45b1576e824240df5c5f005625b","samen/index.html":"732ef953f0475507d125782723f812a672a2fcf970900d2910b4e594ea92b8b7","samen/sync.js":"0db6bc8fee9199ff41300b7cd8bd7565ec38cc934ee17173492d15e8a8ef0725","schaken/ai-worker.js":"546348902e0b6cb477c5179d8884b5015d6dc14bdf6f379563d88c472ce07fcf","schaken/engine.js":"f59be8ec0ee8e69589ad0c9ad723abd8c4464c9e77758e1359f425107cd36849","schaken/index.html":"82bf0cf9ff4dc6f9995c01443c8b9d923c25883d0c1cc57a0854a707d42125f7","tegelrummy/ai-worker.js":"2efd7fbd0eeb1f8cb49c960201f24a90600718e18da01781e54bc95be5bcc0c2","tegelrummy/engine.js":"5181ccda71f715a424ece31c7e9d9556d0af60a8dbad7719c3ccee920d8fd4d7","tegelrummy/index.html":"c9d4772805dd3042cfde989677a57a026ce419cf2ca99dea6ac3007ecd6a3f7e","vingerspel/index.html":"ffac971920e6f3853cf2914066cf7b7d6e8c7616daf4e84f6a07853327987c80","w2.js":"e51467d08597cf2b5f948442a42ccd818d227d94f823b08866aaf96dd18bdeac","w2data.js":"fca09d4b9a723c2a2efe37cabfb8447ab7d09c7a57b19a52c78dbf69a3c25ad8","w2game.css":"f9003701ea75e130fde122a433b5d4d7e23497db544d8e1b840586da6c8e0754","w2ui.css":"560352cca534c7c9cf950db1699638015000c788367b434dfd23ede4dc11a7dd","w2ui.js":"b2c019cadbacf336c2930d0eb0e9b9fde51a49371c7882e2041a7cf301f8da84","web.js":"8cea59fe0a88c495a906131d2385b177649d61bb21ed295d9e57541ba2ee54a8","woordbord/LICENSE-opentaal.txt":"4633afec7da0033afad9271d3d4e2d5e531c255339517d65ffe15fbf6e4292d8","woordbord/ai-worker.js":"ad9341c2bec48230644eb010774a1e1d3f3d5460f42a85b21d092271826067e1","woordbord/avatar.js":"a7d494aba1cab3e4f2f3e67a706a9fa32113f0d1796a5310f948f66d3bc8cb85","woordbord/dict-en.bin":"6e3e3df8387677f4e5cd421a666eb0477b5a81e3db5db499aac501f72a9e1505","woordbord/dict-nl.bin":"a2b1eeee2ccf21a6a52b2838ea7da4e05904d13cdc145cfc2904b3a119f63ba4","woordbord/engine.js":"5a7c3d25f49368285b54b07e167b66d215ce92fd16e57a48895e4b98af2434f5","woordbord/index.html":"3d6489bb89915bac385596712df13075a8130009a746f16d2cbb4855d2ac4fc2","woordbord/themes.js":"898523f96654fbbd447a02cb9a7cfe44952600d3ac587ba64e4e17111ee13623","zeeslag/engine.js":"09ba6affcc7b13d2effd54780fdf48353132c68bf3181676bbbbbce0d296e55b","zeeslag/index.html":"366e9fb80aa080aca9c8f944c1af0a2107b76aa7d510711577724c05164338b7"};
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
