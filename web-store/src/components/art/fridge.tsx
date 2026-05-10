type FridgeProps = {
  size?: number;
  accent?: string;
  className?: string;
};

export function Fridge({ size = 320, accent = "#3B5BFF", className }: FridgeProps) {
  return (
    <svg
      viewBox="0 0 240 320"
      width={size}
      height={(size * 320) / 240}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="fr-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8fbff" />
          <stop offset="1" stopColor="#dde8ff" />
        </linearGradient>
        <linearGradient id="fr-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1538" />
          <stop offset="1" stopColor="#1a2858" />
        </linearGradient>
        <linearGradient id="fr-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="305" rx="92" ry="9" fill="#1a2858" opacity=".18" />
      <rect x="22" y="14" width="196" height="288" rx="14" fill="url(#fr-body)" stroke="#c4d4f0" strokeWidth="1.5" />
      <rect x="22" y="14" width="196" height="86" rx="14" fill="url(#fr-body)" stroke="#c4d4f0" strokeWidth="1.5" />
      <line x1="34" y1="100" x2="206" y2="100" stroke="#c4d4f0" strokeWidth="1.5" />
      <line x1="120" y1="14" x2="120" y2="302" stroke="#c4d4f0" strokeWidth="1.5" />
      <rect x="138" y="28" width="60" height="22" rx="5" fill="url(#fr-screen)" />
      <text
        x="168"
        y="43"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        fill="#7aa9ff"
        textAnchor="middle"
        fontWeight="700"
      >
        −18°C
      </text>
      <circle cx="146" cy="39" r="2" fill="#22dd88" />
      <rect x="106" y="120" width="6" height="80" rx="3" fill="#9ab5dd" />
      <rect x="128" y="120" width="6" height="80" rx="3" fill="#9ab5dd" />
      <rect x="40" y="40" width="56" height="42" rx="5" fill="#e8f0ff" stroke="#c4d4f0" strokeWidth="1" />
      <circle cx="68" cy="61" r="4" fill={accent} opacity=".5" />
      <rect x="58" y="70" width="20" height="3" rx="1.5" fill="#c4d4f0" />
      <rect x="22" y="14" width="98" height="288" rx="14" fill="url(#fr-shine)" />
      <rect x="100" y="282" width="40" height="3" rx="1.5" fill="#9ab5dd" />
      <rect x="34" y="302" width="14" height="6" rx="2" fill="#1a2858" />
      <rect x="192" y="302" width="14" height="6" rx="2" fill="#1a2858" />
    </svg>
  );
}
