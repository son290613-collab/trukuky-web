/* ==========================================================================
   TRUKUKY v2 — Illustrated placeholder art (pink editorial palette)
   Each product renders TWO frames (art-a / art-b) for the hover-swap
   interaction. Swap-ready: replace productArtSVG()'s output with real
   <img> photography per product once available.
   ========================================================================== */

const ART_PALETTES = [
  ['#FBE2E4', '#F3B9C4', '#BE3455'],
  ['#F7ECD8', '#E9C98A', '#A5732B'],
  ['#F6D9DE', '#E88DA3', '#8C2A45'],
  ['#FDF1EE', '#F1B7C2', '#9C2745'],
  ['#F3E0D6', '#E0AE8C', '#8A5A34'],
  ['#FBE9EC', '#EAA9B7', '#B23A55'],
];

const ART_ICONS = {
  'matching-floral': `<path d="M70 46 Q76 30 88 34 Q96 20 104 34 Q116 30 120 46 Q126 52 118 58 L112 56 L110 130 Q95 138 80 130 L78 56 L72 58 Q64 52 70 46 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/><circle cx="95" cy="46" r="3" fill="var(--art-stroke)"/>
  <path d="M138 78 Q142 68 150 70 Q155 62 161 70 Q169 68 170 78 Q174 82 168 86 L165 84 L163 128 Q152 133 143 128 L141 84 L138 86 Q134 82 138 78 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2" stroke-linejoin="round"/>`,
  'matching-gingham': `<path d="M62 44 L128 44 L120 64 L112 60 L112 132 Q95 140 78 132 L78 60 L70 64 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>
  <rect x="86" y="56" width="10" height="10" fill="var(--art-stroke)" opacity="0.18"/><rect x="104" y="56" width="10" height="10" fill="var(--art-stroke)" opacity="0.18"/>
  <path d="M140 82 L164 82 L159 96 L154 93 L154 130 Q152 134 145 130 L145 93 L141 96 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2" stroke-linejoin="round"/>`,
  'dress-ruffle': `<ellipse cx="100" cy="50" rx="16" ry="14" fill="none" stroke="var(--art-stroke)" stroke-width="2.2"/>
  <path d="M84 62 Q100 56 116 62 L126 90 Q112 84 100 90 Q88 84 74 90 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2" stroke-linejoin="round"/>
  <path d="M78 90 Q100 82 122 90 L132 128 Q100 140 68 128 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>`,
  'dress-twirl': `<ellipse cx="100" cy="46" rx="14" ry="12" fill="none" stroke="var(--art-stroke)" stroke-width="2.2"/>
  <path d="M88 56 L112 56 L118 82 L82 82 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2"/>
  <path d="M70 82 Q100 72 130 82 Q140 112 120 136 Q100 126 80 136 Q60 112 70 82 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>`,
  'jacket-denim': `<path d="M70 50 L60 58 L68 76 L78 68 L78 132 L122 132 L122 68 L132 76 L140 58 L130 50 L114 42 Q100 50 86 42 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>
  <line x1="100" y1="52" x2="100" y2="132" stroke="var(--art-stroke)" stroke-width="1.4" stroke-dasharray="2 3"/>`,
  'dress-formal': `<ellipse cx="100" cy="44" rx="13" ry="12" fill="none" stroke="var(--art-stroke)" stroke-width="2.2"/>
  <path d="M90 54 L110 54 L118 90 Q100 84 82 90 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2"/>
  <path d="M78 92 Q100 100 122 92 L134 136 Q100 148 66 136 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>`,
  'top-sport': `<path d="M78 50 L64 60 L74 78 L84 70 L84 118 L116 118 L116 70 L126 78 L136 60 L122 50 L108 44 Q100 52 92 44 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>`,
  'jacket-cardigan': `<path d="M72 48 L62 56 L70 72 L80 64 L80 134 L96 134 L96 78 L104 78 L104 134 L120 134 L120 64 L130 72 L138 56 L128 48 L112 40 Q100 50 88 40 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>`,
  'bag-tote': `<path d="M78 76 L122 76 L128 138 L72 138 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M84 76 Q84 54 100 54 Q116 54 116 76" fill="none" stroke="var(--art-stroke)" stroke-width="2.2"/>`,
  'shoe-sneaker': `<path d="M50 118 Q60 96 84 96 Q92 88 106 92 L140 104 Q150 106 150 118 L150 128 L50 128 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2" stroke-linejoin="round"/>
  <line x1="70" y1="128" x2="70" y2="118" stroke="var(--art-stroke)" stroke-width="1.6"/><line x1="90" y1="128" x2="90" y2="115" stroke="var(--art-stroke)" stroke-width="1.6"/>`,
  'hat-bow': `<ellipse cx="100" cy="90" rx="46" ry="14" fill="none" stroke="var(--art-stroke)" stroke-width="2.2"/>
  <path d="M78 90 Q78 60 100 60 Q122 60 122 90" fill="none" stroke="var(--art-stroke)" stroke-width="2.2"/>
  <path d="M92 60 L100 68 L108 60 Q112 50 104 48 Q100 52 100 56 Q100 52 96 48 Q88 50 92 60 Z" fill="var(--art-stroke)" opacity="0.7"/>`,
  'detail-close': `<circle cx="100" cy="90" r="38" fill="none" stroke="var(--art-stroke)" stroke-width="1.6" stroke-dasharray="3 4"/>
  <path d="M80 90 Q100 72 120 90 Q100 108 80 90 Z" fill="none" stroke="var(--art-stroke)" stroke-width="2.2"/>
  <circle cx="100" cy="90" r="6" fill="var(--art-stroke)" opacity="0.6"/>`,
};

function productArtSVG(key, index = 0) {
  const palette = ART_PALETTES[index % ART_PALETTES.length];
  const icon = ART_ICONS[key] || ART_ICONS['dress-ruffle'];
  const gid = `artGrad-${key}-${index}-${Math.random().toString(36).slice(2, 7)}`;
  return `
  <svg class="art-canvas" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" style="--art-stroke:${palette[2]};width:100%;height:100%">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette[0]}"/>
        <stop offset="100%" stop-color="${palette[1]}"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#${gid})"/>
    <circle cx="26" cy="172" r="42" fill="#ffffff" opacity="0.16"/>
    <circle cx="176" cy="22" r="28" fill="#ffffff" opacity="0.14"/>
    <g opacity="0.88">${icon}</g>
  </svg>`;
}

function dualArtHTML(keyA, keyB, index) {
  return `<span class="art-a">${productArtSVG(keyA, index)}</span><span class="art-b">${productArtSVG(keyB, index + 3)}</span>`;
}
