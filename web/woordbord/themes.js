/* Woordbord — 30 bordthema's. Elk thema is een kleurenset plus een paar plaatjes (emoji)
   die zachtjes op het bord staan en in het middenvak. Volgorde = volgorde in de kiezer. */
(function () {
  const K = 'id name emo font room room2 panel line text muted board cell cellLine tile tileInk tileEdge dl tl dw tw prInk accent accentInk'.split(' ');
  const raw = [
    ['klassiek', 'Klassiek', '⭐', 'display', '#11241d', '#18302a', '#1f3a33', '#2f5047', '#f3efe3', '#a9bdb5', '#0d3b2e', '#e9e2cc', '#0d3b2e', '#f6e7c1', '#2b1d0e', '#c9a96b', '#9fd3e8', '#3c8fc4', '#f2b8b0', '#d9473b', '#10261f', '#f2b134', '#2a1c02'],
    ['horror', 'Horror', '💀 🦇 🕷️ 🩸', 'gothic', '#0b0607', '#160b0d', '#1e0f12', '#3a1a1f', '#f1e6e6', '#b19a9c', '#1a0a0c', '#2a1a1c', '#0b0607', '#e8e0cf', '#3a0a0f', '#8a7a66', '#3f5246', '#2f6a4a', '#6e1a22', '#b3121f', '#f1e6e6', '#c4161c', '#fff1ee'],
    ['anime', 'Anime', '🌸 ✨ ⭐ 🍡', 'gothic', '#1d1530', '#2a1f45', '#33285a', '#4a3d78', '#fff3fb', '#c9b8e6', '#ffd6ea', '#fff4fa', '#ffb7d5', '#ffffff', '#3b2d73', '#ff8fc2', '#c9e7ff', '#7cc4ff', '#ffc7e2', '#ff5ea8', '#3b2d73', '#ff5ea8', '#ffffff'],
    ['eenhoorns', 'Eenhoorns', '🦄 🌈 ✨ 💖', 'gothic', '#2b1b3d', '#3a2752', '#462f63', '#5f4585', '#fff7ff', '#d8c6ef', '#fbe3ff', '#fffaff', '#f0c8ff', '#fffdf4', '#6a2c91', '#ffd36e', '#c3f0e6', '#7ad8c4', '#ffd0ec', '#ff7fc8', '#4a1f66', '#b77cff', '#ffffff'],
    ['dieren', 'Dieren', '🐶 🐱 🦊 🐼 🐸', 'display', '#1f2a17', '#2a3820', '#334426', '#4a5f37', '#f6f1e3', '#c3c9ab', '#7a9a4f', '#efe6c8', '#6c8a45', '#f4d9a0', '#3d2a12', '#b3884a', '#cfe6a3', '#8ab84e', '#f2c38a', '#d8743a', '#2b2010', '#e6a23c', '#2b1a05'],
    ['monsters', 'Gekke monsters', '👾 👹 👻 🤪 👽', 'gothic', '#170f2b', '#23173f', '#2d1e52', '#45307a', '#f2fff0', '#b9b2d9', '#6b2fd1', '#e9ffd8', '#4c1fa0', '#b8ff5a', '#2a0b5c', '#6ec71f', '#ffe066', '#ffb02e', '#ff8ad8', '#ff3fa4', '#2a0b5c', '#b8ff5a', '#1a0640'],
    ['koken', 'Koken', '🍳 🥕 🧀 🍝 🍅', 'display', '#2a1712', '#3a2119', '#47281e', '#64382a', '#fff6ec', '#dcc0ad', '#c8102e', '#fffaf2', '#e9d7c2', '#ffe7b8', '#4a2412', '#d29b4c', '#d7ecd0', '#7fb86b', '#ffd4c4', '#e5532f', '#3a1a0e', '#ffb703', '#3a1a00'],
    ['future', 'Future', '🚀 🛸 🤖 💠', 'mono', '#050a18', '#0a1430', '#0f1d42', '#1d3470', '#e6fbff', '#8fb3cc', '#07122b', '#0d1c3d', '#1a3a77', '#d9fbff', '#032033', '#33e1ff', '#0d5d73', '#0b8fb3', '#5b2a8f', '#b23cff', '#e6fbff', '#33e1ff', '#001820'],
    ['grappig', 'Grappig', '😂 🤡 🎈 🍌 🙃', 'gothic', '#2b2200', '#3a2e05', '#4a3b0b', '#6b5617', '#fffbe8', '#e3d6a4', '#ffd400', '#fff9d6', '#ffe766', '#ffffff', '#2b2200', '#ff7a00', '#9ee6ff', '#2fb4ff', '#ffb3d9', '#ff3b6b', '#2b2200', '#ff3b6b', '#ffffff'],
    ['sexy', 'Sexy', '💋 🌹 🍷 🖤', 'serif', '#12060a', '#1e0a10', '#2a0e17', '#4a1626', '#fbe9ec', '#c9a1aa', '#2b0710', '#3a0d18', '#1a0408', '#f3e1d0', '#5a0b1e', '#c79a6b', '#5a1f33', '#7d2440', '#a3123a', '#d4123f', '#fbe9ec', '#d4a24c', '#2a0a00'],
    ['oceaan', 'Oceaan', '🐠 🐙 🐚 🌊', 'display', '#04202e', '#083047', '#0b3b57', '#145676', '#e9fbff', '#9cc7d6', '#0b5e85', '#d8f3f7', '#0b5e85', '#fff3d6', '#073248', '#e2b86b', '#a8e6f0', '#3ec1d3', '#ffc7b3', '#ff6f59', '#073248', '#ffcf5c', '#2a1c00'],
    ['ruimte', 'Ruimte', '🪐 ⭐ ☄️ 🌙', 'display', '#07051a', '#110c2e', '#18123f', '#2c2366', '#f1eeff', '#a49dcc', '#1b1240', '#261a57', '#120b30', '#fff2c7', '#1b1240', '#ffc24b', '#33407a', '#4a5fd1', '#7a3a9e', '#e05bd8', '#f1eeff', '#ffc24b', '#241500'],
    ['jungle', 'Jungle', '🌴 🦜 🐒 🍃', 'display', '#0c1f12', '#12301b', '#173d23', '#245a34', '#f0fbe9', '#a9c9a8', '#1e6b37', '#e7f2d3', '#1e6b37', '#f7e3a8', '#233a12', '#b98a2f', '#b9e3a5', '#5fb85a', '#ffd28a', '#f2783a', '#183010', '#ffcc33', '#2a1f00'],
    ['snoep', 'Snoep', '🍭 🍬 🧁 🍩', 'gothic', '#2a1430', '#3a1c42', '#4a2453', '#6b3577', '#fff4fb', '#e2bfdc', '#ff9ccf', '#fff0f7', '#ffc1e0', '#ffffff', '#8a1b5a', '#7ee0d2', '#c8f5ee', '#63d6c6', '#ffe08a', '#ff6aa2', '#5a103a', '#63d6c6', '#0d2e2a'],
    ['winter', 'Winter', '❄️ ⛄ 🧣 🎿', 'display', '#0e1a2b', '#16263d', '#1d3050', '#2d4770', '#f2f8ff', '#a9bdd6', '#bfe0f5', '#f7fbff', '#cfe3f2', '#ffffff', '#1d3b5c', '#8fb8d8', '#d7ecfa', '#7fb8e3', '#d8d5f2', '#6d6ad8', '#1d3b5c', '#8fd3ff', '#062033'],
    ['kerst', 'Kerst', '🎄 🎅 🎁 ⭐', 'display', '#0f1d14', '#17291d', '#1d3424', '#2c4b35', '#fff8ef', '#c6cdb9', '#b3121f', '#fff6ea', '#e3cfbf', '#fff1d6', '#6b0c14', '#d4a24c', '#cfe8d2', '#2e8b57', '#ffd1cc', '#c8102e', '#2a1a10', '#d4a24c', '#2a1600'],
    ['halloween', 'Halloween', '🎃 👻 🕸️ 🍬', 'gothic', '#170d1f', '#22122d', '#2c1739', '#45255a', '#fff3e6', '#c8b0c9', '#3a1a4f', '#2a1238', '#170d1f', '#ffb347', '#2a0f00', '#c2620a', '#4d2f6b', '#6d3fa0', '#8a3b0f', '#ff7518', '#fff3e6', '#ff7518', '#200800'],
    ['strand', 'Strand', '🏖️ ☀️ 🍦 🐚', 'display', '#1b2a33', '#243945', '#2d4654', '#3f6273', '#fffaf0', '#c5d3d8', '#f2d59b', '#fff6e0', '#e8c67e', '#ffffff', '#1d4e63', '#4fb3d9', '#b8ecf5', '#3fb8dd', '#ffd0b5', '#ff7a59', '#1d3b48', '#ff7a59', '#ffffff'],
    ['piraten', 'Piraten', '🏴‍☠️ ⚓ 🦜 💰', 'serif', '#120f0b', '#1d1812', '#282018', '#3f3324', '#f5ead6', '#bfae92', '#5a3a1e', '#e8d4a8', '#8a6a3e', '#f2e2b8', '#2a1a0a', '#8c6a35', '#c7d8c0', '#6f9a7b', '#e6b8a0', '#a83a2a', '#2a1a0a', '#d9a520', '#1e1400'],
    ['ridders', 'Ridders & draken', '🏰 🐉 ⚔️ 👑', 'serif', '#15151c', '#1f1f29', '#282836', '#3e3e52', '#f3efe4', '#b4b0c0', '#4a4f5a', '#d9d4c7', '#4a4f5a', '#efe4c8', '#2a1f3a', '#9b8a5c', '#b9c6e0', '#4a6aa8', '#e0b9b9', '#8f2a2a', '#1a1a26', '#c9a43a', '#1e1600'],
    ['arcade', 'Retro arcade', '🕹️ 👾 💾 ⭐', 'mono', '#0a0014', '#140228', '#1c0538', '#35106b', '#fff0ff', '#b79bd6', '#12002b', '#1a0540', '#3a0f80', '#ffe600', '#1a0033', '#ff00a8', '#004d66', '#00a5c9', '#6b005e', '#ff00a8', '#fff0ff', '#00f0ff', '#001518'],
    ['dojo', 'Dojo', '🥋 🏅 🎌', 'display', '#161210', '#211b17', '#2b231e', '#43372f', '#f6f0e6', '#bfb3a3', '#c9b48a', '#e8dcc0', '#a89366', '#ffffff', '#1a1a1a', '#2b2b2b', '#d6e0c8', '#7f9a5a', '#e8c4b8', '#b0302a', '#1a1a1a', '#b0302a', '#ffffff'],
    ['bos', 'Bos', '🍄 🌲 🦔 🍂', 'display', '#17140d', '#221d13', '#2c2519', '#453a26', '#f5efe0', '#c0b597', '#4f6b3a', '#ece2c6', '#4f6b3a', '#f0d9a8', '#3a2412', '#94683a', '#d4e3b5', '#7f9f4f', '#f0c9a0', '#c2552d', '#2e1d0e', '#e09a3a', '#2a1600'],
    ['bloemen', 'Bloemen', '🌷 🌻 🌼 🌸', 'display', '#2a1a24', '#382331', '#452c3d', '#604256', '#fff6fa', '#dcc2d0', '#c6e6b5', '#fffdf6', '#d9edcc', '#fff8e1', '#5a2a48', '#e9b949', '#e5d4ff', '#a77bff', '#ffd3e3', '#ff5c8a', '#4a1f3a', '#ff8fb3', '#3a0a1e'],
    ['voetbal', 'Voetbal', '⚽ 🥅 🏆', 'gothic', '#0c1a0f', '#122616', '#17311c', '#24492b', '#f2fff2', '#a8c8ad', '#2e8b3a', '#e9f5e4', '#2e8b3a', '#ffffff', '#10240f', '#1a1a1a', '#c3e8c0', '#5cb85c', '#ffe08a', '#f2a516', '#10240f', '#f2a516', '#201400'],
    ['hollands', 'Hollands', '🌷 🧀 🚲 🌬️', 'display', '#0d1b33', '#142748', '#1a3159', '#294a80', '#f5f8ff', '#a9bad9', '#1f4fa3', '#f7f9ff', '#c8d6f0', '#ffffff', '#1f3f8a', '#ff7a00', '#cfdcf5', '#4f79c9', '#ffd1a6', '#ff7a00', '#13285a', '#ff7a00', '#ffffff'],
    ['woestijn', 'Woestijn', '🌵 🐪 ☀️ 🦂', 'display', '#2a1a0e', '#382313', '#462c18', '#644023', '#fff5e6', '#dcc2a0', '#e0a85e', '#f8e6c4', '#d79a4e', '#fff1d8', '#5a2d0c', '#b5651d', '#cde3c0', '#7fae6a', '#f7c19a', '#d9542a', '#3e1f08', '#f0b429', '#2a1800'],
    ['disco', 'Disco', '🪩 🎶 🕺 💃', 'gothic', '#0e0618', '#190b2b', '#23103d', '#3b1b63', '#fff4ff', '#c3a7e0', '#2a0f4a', '#3a1866', '#1d0a36', '#e6e6f0', '#2a0f4a', '#ff4fd8', '#1f5c8a', '#2fb8ff', '#8a1f7a', '#ff4fd8', '#fff4ff', '#ffd23f', '#241800'],
    ['muziek', 'Muziek', '🎸 🎹 🎤 🎧', 'display', '#121212', '#1c1c1e', '#26262a', '#3a3a40', '#f5f5f5', '#a8a8b0', '#1c1c1e', '#f4f1ea', '#2a2a2a', '#1a1a1a', '#f4f1ea', '#000000', '#d9e4ff', '#6b8dff', '#ffe0b3', '#ff9f1c', '#121212', '#ff9f1c', '#1a0f00'],
    ['minimaal', 'Minimaal (licht)', '', 'body', '#f2f0eb', '#e8e5de', '#ffffff', '#d3cfc6', '#1d1c1a', '#6b675f', '#1d1c1a', '#faf9f6', '#1d1c1a', '#1d1c1a', '#faf9f6', '#000000', '#e2e0da', '#b8b4aa', '#c9c4ba', '#8a857a', '#1d1c1a', '#1d1c1a', '#faf9f6']
  ];
  const FONTS = {
    display: '"Bricolage Grotesque",system-ui,sans-serif',
    gothic: '"Dela Gothic One","Bricolage Grotesque",system-ui,sans-serif',
    body: '"Figtree",system-ui,sans-serif',
    serif: 'Georgia,"Noto Serif",serif',
    mono: 'ui-monospace,"Roboto Mono","DejaVu Sans Mono",monospace'
  };
  const list = raw.map(r => { const t = {}; K.forEach((k, i) => { t[k] = r[i]; }); t.emo = t.emo ? t.emo.split(' ') : []; t.fontStack = FONTS[t.font]; return t; });
  const byId = {}; list.forEach(t => { byId[t.id] = t; });
  // licht thema? (voor color-scheme en schaduwen)
  function light(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; }
  function apply(id, el) {
    const t = byId[id] || list[0];
    const s = (el || document.documentElement).style;
    for (const k of K.slice(4)) s.setProperty('--' + k, t[k]);
    s.setProperty('--f-tile', t.fontStack);
    s.setProperty('--ng-accent', t.accent); s.setProperty('--ng-accent-ink', t.accentInk);
    s.setProperty('--ng-panel', t.panel); s.setProperty('--ng-line', t.line);
    s.colorScheme = light(t.room) ? 'light' : 'dark';
    return t;
  }
  window.WB_THEMES = { list, byId, apply, light };
})();
