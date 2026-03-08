const base = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">${body}</svg>`;

export const ICONS = {
  x: base(
    `<line x1="18" y1="4" x2="6" y2="20"/>
     <line x1="6"  y1="4" x2="18" y2="20"/>`
  ),

  bluesky: base(
    `<path d="M12 18c-3-4-8-7-7-11 .5-2 3-3 5-1.5s2 4.5 2 4.5 0-3 2-4.5 4.5-1 5 1c1 4-4 7-7 11z"/>`
  ),

  facebook: base(
    `<path d="M18 2h-3a4 4 0 00-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 011-1h3z"/>`
  ),

  mastodon: base(
    `<path d="M17 8c0-2.8-2-5-5-5S7 5.2 7 8v4c0 2.8 2 5 5 5h.5l2.5 2v-2c1.7-.5 3-2 3-3.5V8z"/>
     <line x1="9.5" y1="10" x2="14.5" y2="10"/>
     <line x1="9.5" y1="13" x2="13"   y2="13"/>`
  ),

  instagram: base(
    `<rect x="2" y="2" width="20" height="20" rx="5"/>
     <circle cx="12" cy="12" r="4.5"/>
     <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>`
  ),

  tiktok: base(
    `<path d="M9 17a3.5 3.5 0 103.5-3.5V3.5A5.5 5.5 0 0018 9"/>`
  ),

  share: base(
    `<path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
     <polyline points="16 6 12 2 8 6"/>
     <line x1="12" y1="2" x2="12" y2="15"/>`
  ),
};
