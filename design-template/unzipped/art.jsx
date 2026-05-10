/* Inline SVG product illustrations — placeholders that look real */

const Art = {
  // Side-by-side fridge — main hero/product art
  Fridge: ({ size = 320, accent = "#3B5BFF", style }) => (
    <svg viewBox="0 0 240 320" width={size} height={size * 320/240} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fr-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8fbff"/>
          <stop offset="1" stopColor="#dde8ff"/>
        </linearGradient>
        <linearGradient id="fr-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1538"/>
          <stop offset="1" stopColor="#1a2858"/>
        </linearGradient>
        <linearGradient id="fr-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55"/>
          <stop offset=".4" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="120" cy="305" rx="92" ry="9" fill="#1a2858" opacity=".18"/>
      {/* Body */}
      <rect x="22" y="14" width="196" height="288" rx="14" fill="url(#fr-body)" stroke="#c4d4f0" strokeWidth="1.5"/>
      {/* Top divider (freezer) */}
      <rect x="22" y="14" width="196" height="86" rx="14" fill="url(#fr-body)" stroke="#c4d4f0" strokeWidth="1.5"/>
      <line x1="34" y1="100" x2="206" y2="100" stroke="#c4d4f0" strokeWidth="1.5"/>
      {/* Vertical split */}
      <line x1="120" y1="14" x2="120" y2="302" stroke="#c4d4f0" strokeWidth="1.5"/>
      {/* Display */}
      <rect x="138" y="28" width="60" height="22" rx="5" fill="url(#fr-screen)"/>
      <text x="168" y="43" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#7aa9ff" textAnchor="middle" fontWeight="700">−18°C</text>
      <circle cx="146" cy="39" r="2" fill="#22dd88"/>
      {/* Handles */}
      <rect x="106" y="120" width="6" height="80" rx="3" fill="#9ab5dd"/>
      <rect x="128" y="120" width="6" height="80" rx="3" fill="#9ab5dd"/>
      {/* Water dispenser */}
      <rect x="40" y="40" width="56" height="42" rx="5" fill="#e8f0ff" stroke="#c4d4f0" strokeWidth="1"/>
      <circle cx="68" cy="61" r="4" fill={accent} opacity=".5"/>
      <rect x="58" y="70" width="20" height="3" rx="1.5" fill="#c4d4f0"/>
      {/* Shine */}
      <rect x="22" y="14" width="98" height="288" rx="14" fill="url(#fr-shine)"/>
      {/* Brand notch */}
      <rect x="100" y="282" width="40" height="3" rx="1.5" fill="#9ab5dd"/>
      {/* Feet */}
      <rect x="34" y="302" width="14" height="6" rx="2" fill="#1a2858"/>
      <rect x="192" y="302" width="14" height="6" rx="2" fill="#1a2858"/>
    </svg>
  ),

  // Coffee machine
  Coffee: ({ size = 280, accent = "#3B5BFF", style }) => (
    <svg viewBox="0 0 240 280" width={size} height={size * 280/240} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a3450"/>
          <stop offset="1" stopColor="#0a1538"/>
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="265" rx="80" ry="7" fill="#1a2858" opacity=".18"/>
      <rect x="40" y="20" width="160" height="220" rx="20" fill="url(#cf-body)"/>
      {/* Top panel */}
      <rect x="50" y="32" width="140" height="56" rx="10" fill="#1a2240"/>
      <circle cx="78" cy="60" r="9" fill={accent}/>
      <circle cx="78" cy="60" r="4" fill="#fff" opacity=".9"/>
      <rect x="98" y="48" width="84" height="8" rx="3" fill="#3a4a78"/>
      <rect x="98" y="62" width="56" height="6" rx="3" fill="#2a3458"/>
      <rect x="98" y="74" width="40" height="6" rx="3" fill="#2a3458"/>
      {/* Spout */}
      <rect x="100" y="120" width="40" height="36" rx="4" fill="#0a1230"/>
      <rect x="112" y="156" width="16" height="14" rx="2" fill="#9ab5dd"/>
      <rect x="115" y="170" width="10" height="3" rx="1" fill={accent}/>
      {/* Cup */}
      <path d="M88 220 L92 196 H148 L152 220 Z" fill="#fff" stroke="#c4d4f0" strokeWidth="1"/>
      <ellipse cx="120" cy="200" rx="28" ry="3" fill="#6b3a1a"/>
      {/* Steam */}
      <path d="M108 188c2-4 0-8 2-12M120 188c2-4 0-8 2-12M132 188c2-4 0-8 2-12" stroke="#9ab5dd" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
      {/* Water tank shine */}
      <rect x="170" y="100" width="22" height="80" rx="4" fill="#3a4a78" opacity=".4"/>
    </svg>
  ),

  // Washing machine
  Washer: ({ size = 280, accent = "#3B5BFF", style }) => (
    <svg viewBox="0 0 240 280" width={size} height={size * 280/240} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wm-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8fbff"/>
          <stop offset="1" stopColor="#dde8ff"/>
        </linearGradient>
        <radialGradient id="wm-drum" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#0a1538"/>
          <stop offset=".7" stopColor="#1a2858"/>
          <stop offset="1" stopColor="#2a3458"/>
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="265" rx="86" ry="7" fill="#1a2858" opacity=".18"/>
      <rect x="32" y="20" width="176" height="240" rx="14" fill="url(#wm-body)" stroke="#c4d4f0" strokeWidth="1.5"/>
      {/* Top panel */}
      <rect x="44" y="34" width="152" height="42" rx="6" fill="#eef4ff" stroke="#c4d4f0"/>
      <circle cx="64" cy="55" r="6" fill={accent} opacity=".7"/>
      <rect x="80" y="48" width="100" height="14" rx="3" fill="#1a2858"/>
      <text x="130" y="59" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#7aa9ff" textAnchor="middle" fontWeight="700">40° · 1400</text>
      {/* Drum door */}
      <circle cx="120" cy="160" r="68" fill="#c4d4f0"/>
      <circle cx="120" cy="160" r="58" fill="url(#wm-drum)"/>
      <circle cx="120" cy="160" r="50" fill="none" stroke="#3a4a78" strokeWidth="2" strokeDasharray="3 5"/>
      {/* Reflection */}
      <ellipse cx="100" cy="138" rx="26" ry="14" fill="#fff" opacity=".18"/>
      {/* Water inside */}
      <path d="M70 170 Q90 178 120 170 T170 170 V210 H70 Z" fill={accent} opacity=".25"/>
    </svg>
  ),

  // AC indoor unit
  AC: ({ size = 280, accent = "#3B5BFF", style }) => (
    <svg viewBox="0 0 280 200" width={size} height={size * 200/280} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="140" cy="180" rx="100" ry="6" fill="#1a2858" opacity=".15"/>
      <rect x="20" y="40" width="240" height="80" rx="14" fill="#fff" stroke="#c4d4f0" strokeWidth="1.5"/>
      <rect x="20" y="40" width="240" height="80" rx="14" fill="url(#fr-shine)"/>
      {/* Vent */}
      <rect x="36" y="92" width="208" height="22" rx="4" fill="#1a2240"/>
      {/* Display */}
      <rect x="200" y="58" width="46" height="20" rx="4" fill="#1a2240"/>
      <text x="223" y="72" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#7aa9ff" textAnchor="middle" fontWeight="700">22°</text>
      {/* Logo */}
      <rect x="36" y="62" width="48" height="6" rx="3" fill="#9ab5dd"/>
      {/* Air streams */}
      <path d="M70 130 Q60 145 80 160" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <path d="M120 130 Q110 145 130 160" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <path d="M170 130 Q160 145 180 160" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
    </svg>
  ),

  // Generic appliance icon for catalog cards (compact)
  Generic: ({ kind = "fridge", color = "#3B5BFF", size = 110 }) => {
    const c = color;
    if (kind === "fridge")
      return (
        <svg viewBox="0 0 80 110" width={size * 80/110} height={size} fill="none">
          <rect x="10" y="6" width="60" height="98" rx="8" fill="#fff" stroke="#c4d4f0"/>
          <line x1="10" y1="42" x2="70" y2="42" stroke="#c4d4f0"/>
          <rect x="58" y="14" width="3" height="22" rx="1.5" fill={c}/>
          <rect x="58" y="50" width="3" height="44" rx="1.5" fill={c}/>
          <rect x="18" y="16" width="20" height="18" rx="3" fill={c} opacity=".15"/>
        </svg>
      );
    if (kind === "washer")
      return (
        <svg viewBox="0 0 80 110" width={size * 80/110} height={size} fill="none">
          <rect x="6" y="10" width="68" height="90" rx="8" fill="#fff" stroke="#c4d4f0"/>
          <rect x="14" y="18" width="52" height="14" rx="3" fill="#eef4ff"/>
          <circle cx="40" cy="62" r="22" fill="#eef4ff" stroke="#c4d4f0"/>
          <circle cx="40" cy="62" r="14" fill={c} opacity=".18"/>
        </svg>
      );
    if (kind === "tv")
      return (
        <svg viewBox="0 0 110 80" width={size} height={size * 80/110} fill="none">
          <rect x="6" y="6" width="98" height="58" rx="6" fill="#0a1538"/>
          <rect x="12" y="12" width="86" height="46" rx="3" fill={c} opacity=".25"/>
          <rect x="44" y="68" width="22" height="3" rx="1.5" fill="#9ab5dd"/>
        </svg>
      );
    if (kind === "ac")
      return (
        <svg viewBox="0 0 110 60" width={size} height={size * 60/110} fill="none">
          <rect x="6" y="10" width="98" height="34" rx="6" fill="#fff" stroke="#c4d4f0"/>
          <rect x="14" y="32" width="82" height="6" rx="2" fill="#1a2240"/>
          <path d="M30 50 Q26 55 34 60M55 50 Q51 55 59 60M80 50 Q76 55 84 60" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
        </svg>
      );
    if (kind === "kettle")
      return (
        <svg viewBox="0 0 80 90" width={size * 80/90} height={size} fill="none">
          <path d="M18 30 L62 30 L58 80 L22 80 Z" fill="#fff" stroke="#c4d4f0"/>
          <path d="M62 40 Q72 44 70 56" stroke="#c4d4f0" fill="none"/>
          <rect x="32" y="20" width="16" height="10" rx="2" fill={c}/>
          <ellipse cx="40" cy="48" rx="14" ry="3" fill={c} opacity=".25"/>
        </svg>
      );
    if (kind === "vacuum")
      return (
        <svg viewBox="0 0 110 80" width={size} height={size * 80/110} fill="none">
          <ellipse cx="55" cy="58" rx="48" ry="18" fill="#fff" stroke="#c4d4f0"/>
          <circle cx="55" cy="50" r="22" fill={c} opacity=".25"/>
          <circle cx="55" cy="50" r="10" fill="#0a1538"/>
        </svg>
      );
    if (kind === "coffee")
      return (
        <svg viewBox="0 0 80 110" width={size * 80/110} height={size} fill="none">
          <rect x="14" y="6" width="52" height="76" rx="8" fill="#1a2240"/>
          <rect x="20" y="14" width="40" height="20" rx="3" fill="#0a1230"/>
          <circle cx="28" cy="24" r="3" fill={c}/>
          <rect x="36" y="22" width="20" height="2" rx="1" fill="#3a4a78"/>
          <rect x="36" y="28" width="14" height="2" rx="1" fill="#3a4a78"/>
          <rect x="32" y="46" width="16" height="14" rx="2" fill="#0a1230"/>
          <path d="M28 90 L34 78 H46 L52 90 Z" fill="#fff" stroke="#c4d4f0"/>
          <ellipse cx="40" cy="80" rx="8" ry="1.5" fill="#6b3a1a"/>
        </svg>
      );
    return null;
  },
};

window.Art = Art;
