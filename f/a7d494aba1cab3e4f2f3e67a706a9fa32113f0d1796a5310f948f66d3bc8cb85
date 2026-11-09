/* Woordbord — zelf samengestelde avatars, getekend als SVG (klein genoeg om mee te sturen
   naar de andere telefoon). Een avatar is een object met per onderdeel een keuze. */
(function () {
  const OPT = {
    bg: ['#ff6b5b', '#ffb703', '#2ec4b6', '#3a86ff', '#8338ec', '#ff4fa3', '#06d6a0', '#5c677d', '#e9c46a', '#1d3557'],
    skin: ['#f9d7b9', '#e9b48a', '#c68a5e', '#8d5a3b', '#5b3a26', '#9be08a', '#a9c8ff', '#d6d6de'],
    eyes: ['dots', 'happy', 'big', 'sleepy', 'wink', 'shades', 'robot'],
    mouth: ['smile', 'grin', 'o', 'tongue', 'flat', 'fangs', 'mustache'],
    hair: ['none', 'short', 'long', 'curly', 'mohawk', 'bun', 'cap', 'beanie', 'crown', 'horns', 'antenna'],
    hc: ['#2b1d14', '#6b4226', '#c68642', '#f1c27d', '#d1495b', '#8d99ae', '#f8f9fa', '#3a86ff'],
    acc: ['none', 'glasses', 'blush', 'freckles']
  };
  const LABEL = { bg: 'Achtergrond', skin: 'Gezicht', eyes: 'Ogen', mouth: 'Mond', hair: 'Haar of hoed', hc: 'Haarkleur', acc: 'Extra' };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function random() {
    const av = {};
    for (const k in OPT) av[k] = pick(OPT[k]);
    if (av.eyes === 'robot') av.skin = '#d6d6de';
    if (av.hair === 'antenna' && av.eyes !== 'robot') av.hair = 'short';
    return av;
  }
  function robot(level) {
    const bg = { easy: '#06d6a0', normal: '#3a86ff', strong: '#8338ec' }[level] || '#5c677d';
    return { bg, skin: '#d6d6de', eyes: 'robot', mouth: level === 'strong' ? 'grin' : 'flat', hair: 'antenna', hc: level === 'strong' ? '#ff4fa3' : '#ffb703', acc: 'none' };
  }
  const fix = av => Object.assign({ bg: OPT.bg[3], skin: OPT.skin[0], eyes: 'dots', mouth: 'smile', hair: 'short', hc: OPT.hc[1], acc: 'none' }, av || {});
  const INK = '#24160f';

  function svg(av, size, extraAttr) {
    av = fix(av);
    const s = size || 40, hc = av.hc, sk = av.skin;
    const shade = 'rgba(0,0,0,.14)';
    let back = '', front = '', face = '', top = '';
    // haar achter het hoofd
    if (av.hair === 'long') back = `<path d="M18 58c0-26 14-38 32-38s32 12 32 38v34H18z" fill="${hc}"/>`;
    if (av.hair === 'bun') back = `<circle cx="50" cy="18" r="10" fill="${hc}"/>`;
    // hoofd
    const head = av.eyes === 'robot'
      ? `<rect x="22" y="28" width="56" height="54" rx="14" fill="${sk}"/><rect x="22" y="70" width="56" height="12" rx="6" fill="${shade}"/>`
      : `<circle cx="50" cy="57" r="29" fill="${sk}"/><path d="M27 70a29 29 0 0 0 46 0" fill="${shade}"/>`;
    // ogen
    const E = {
      dots: `<circle cx="40" cy="55" r="3.6" fill="${INK}"/><circle cx="60" cy="55" r="3.6" fill="${INK}"/>`,
      happy: `<path d="M35.5 57q4.5-6 9 0M55.5 57q4.5-6 9 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      big: `<ellipse cx="40" cy="54" rx="5.4" ry="6.6" fill="${INK}"/><ellipse cx="60" cy="54" rx="5.4" ry="6.6" fill="${INK}"/><circle cx="42" cy="51.5" r="2" fill="#fff"/><circle cx="62" cy="51.5" r="2" fill="#fff"/><circle cx="38.6" cy="56.5" r="1" fill="#fff"/><circle cx="58.6" cy="56.5" r="1" fill="#fff"/>`,
      sleepy: `<path d="M35 55h10M55 55h10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M36 56q4 4 8 0M56 56q4 4 8 0" fill="${INK}"/>`,
      wink: `<circle cx="40" cy="55" r="3.6" fill="${INK}"/><path d="M55.5 56q4.5-5 9 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      shades: `<path d="M31 50h38v4c0 6-4 9-9 9s-8-3-9-8h-2c-1 5-4 8-9 8s-9-3-9-9z" fill="#111"/><path d="M34 52h10M56 52h10" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`,
      robot: `<rect x="33" y="48" width="12" height="9" rx="2.5" fill="#1b2a3a"/><rect x="55" y="48" width="12" height="9" rx="2.5" fill="#1b2a3a"/><rect x="36" y="50.5" width="5" height="4" rx="1" fill="#3cf"/><rect x="58" y="50.5" width="5" height="4" rx="1" fill="#3cf"/>`
    };
    face += E[av.eyes] || E.dots;
    // mond
    const M = {
      smile: `<path d="M41 67q9 8 18 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      grin: `<path d="M39 65q11 13 22 0z" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`,
      o: `<ellipse cx="50" cy="69" rx="4.2" ry="5.2" fill="${INK}"/>`,
      tongue: `<path d="M41 66q9 8 18 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M47 70h7v3a3.5 3.5 0 0 1-7 0z" fill="#ff6f91"/>`,
      flat: `<path d="M43 69h14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      fangs: `<path d="M40 66q10 7 20 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M44 67.6l2 5 2-4.4M52 68.4l2 4.4 2-5" fill="#fff" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,
      mustache: `<path d="M50 64c-4-4-11-3-14 2 5-1 9 0 14-1 5 1 9 0 14 1-3-5-10-6-14-2z" fill="${hc}"/><path d="M45 70q5 3 10 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
    };
    face += M[av.mouth] || M.smile;
    // extra
    if (av.acc === 'blush') face += `<ellipse cx="33" cy="63" rx="5" ry="3" fill="#ff6f91" opacity=".55"/><ellipse cx="67" cy="63" rx="5" ry="3" fill="#ff6f91" opacity=".55"/>`;
    if (av.acc === 'freckles') face += `<g fill="#8a4b2a" opacity=".7"><circle cx="34" cy="62" r="1.2"/><circle cx="38" cy="64" r="1.2"/><circle cx="33" cy="66" r="1.2"/><circle cx="66" cy="62" r="1.2"/><circle cx="62" cy="64" r="1.2"/><circle cx="67" cy="66" r="1.2"/></g>`;
    if (av.acc === 'glasses' && av.eyes !== 'shades') face += `<g fill="none" stroke="${INK}" stroke-width="2.4"><circle cx="40" cy="55" r="8"/><circle cx="60" cy="55" r="8"/><path d="M48 55h4M32 54l-6-2M68 54l6-2"/></g>`;
    // haar/hoed boven
    const H = {
      none: '',
      short: `<path d="M21 56c0-22 13-34 29-34s29 12 29 34c-5-11-15-17-29-17s-24 6-29 17z" fill="${hc}"/>`,
      long: `<path d="M21 56c0-22 13-34 29-34s29 12 29 34c-4-12-12-15-20-15-4 6-14 9-24 8-6 2-11 4-14 7z" fill="${hc}"/>`,
      curly: `<g fill="${hc}"><circle cx="28" cy="44" r="9"/><circle cx="38" cy="33" r="10"/><circle cx="50" cy="29" r="10"/><circle cx="62" cy="33" r="10"/><circle cx="72" cy="44" r="9"/><circle cx="24" cy="54" r="6"/><circle cx="76" cy="54" r="6"/></g>`,
      mohawk: `<path d="M44 36l2-10 4 6 2-11 4 9 3-7 1 13c-6-2-11-2-16 0z" fill="${hc}"/><path d="M42 38c4-4 12-4 16 0l-2 4c-4-2-8-2-12 0z" fill="${hc}"/>`,
      bun: `<path d="M21 56c0-22 13-34 29-34s29 12 29 34c-5-11-15-17-29-17s-24 6-29 17z" fill="${hc}"/>`,
      cap: `<path d="M21 48c0-18 13-28 29-28s29 10 29 28z" fill="${hc}"/><path d="M50 48h38c0 4-3 6-8 6H50z" fill="${hc}"/><path d="M21 48h58" stroke="rgba(0,0,0,.25)" stroke-width="2"/><circle cx="50" cy="20" r="3" fill="rgba(0,0,0,.25)"/>`,
      beanie: `<path d="M22 50c0-19 12-30 28-30s28 11 28 30z" fill="${hc}"/><rect x="20" y="44" width="60" height="10" rx="5" fill="${hc}"/><rect x="20" y="44" width="60" height="10" rx="5" fill="rgba(0,0,0,.18)"/><circle cx="50" cy="18" r="6" fill="${hc}"/>`,
      crown: `<path d="M30 40l-2-18 11 9 11-14 11 14 11-9-2 18z" fill="#ffc83d" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="31" r="2.6" fill="#e5484d"/>`,
      horns: `<path d="M30 37c-6-6-7-15-3-22 2 8 7 12 12 14z" fill="${hc}"/><path d="M70 37c6-6 7-15 3-22-2 8-7 12-12 14z" fill="${hc}"/>`,
      antenna: `<path d="M50 28V14" stroke="#5c677d" stroke-width="3"/><circle cx="50" cy="12" r="5" fill="${hc}"/>`
    };
    top = H[av.hair] || '';
    return `<svg viewBox="0 0 100 100" width="${s}" height="${s}" ${extraAttr || ''} aria-hidden="true"><rect width="100" height="100" rx="26" fill="${av.bg}"/>${back}${head}${face}${top}${front}</svg>`;
  }
  window.WB_AVATAR = { OPT, LABEL, random, robot, svg, fix };
})();
