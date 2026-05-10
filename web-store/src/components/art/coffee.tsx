type CoffeeProps = {
  size?: number;
  accent?: string;
  className?: string;
};

export function Coffee({ size = 280, accent = "#3B5BFF", className }: CoffeeProps) {
  return (
    <svg
      viewBox="0 0 240 280"
      width={size}
      height={(size * 280) / 240}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="cf-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a3450" />
          <stop offset="1" stopColor="#0a1538" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="265" rx="80" ry="7" fill="#1a2858" opacity=".18" />
      <rect x="40" y="20" width="160" height="220" rx="20" fill="url(#cf-body)" />
      <rect x="50" y="32" width="140" height="56" rx="10" fill="#1a2240" />
      <circle cx="78" cy="60" r="9" fill={accent} />
      <circle cx="78" cy="60" r="4" fill="#fff" opacity=".9" />
      <rect x="98" y="48" width="84" height="8" rx="3" fill="#3a4a78" />
      <rect x="98" y="62" width="56" height="6" rx="3" fill="#2a3458" />
      <rect x="98" y="74" width="40" height="6" rx="3" fill="#2a3458" />
      <rect x="100" y="120" width="40" height="36" rx="4" fill="#0a1230" />
      <rect x="112" y="156" width="16" height="14" rx="2" fill="#9ab5dd" />
      <rect x="115" y="170" width="10" height="3" rx="1" fill={accent} />
      <path d="M88 220 L92 196 H148 L152 220 Z" fill="#fff" stroke="#c4d4f0" strokeWidth="1" />
      <ellipse cx="120" cy="200" rx="28" ry="3" fill="#6b3a1a" />
      <path
        d="M108 188c2-4 0-8 2-12M120 188c2-4 0-8 2-12M132 188c2-4 0-8 2-12"
        stroke="#9ab5dd"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".6"
      />
      <rect x="170" y="100" width="22" height="80" rx="4" fill="#3a4a78" opacity=".4" />
    </svg>
  );
}
