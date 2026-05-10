import { stockLabel } from "@/lib/stock";

type Tone = { bg: string; color: string };

const tones: Record<string, Tone> = {
  out: { bg: "rgba(120,130,160,0.18)", color: "var(--text-mute)" },
  low: { bg: "rgba(255,170,90,0.22)", color: "#a85d00" },
  available: { bg: "rgba(34,221,136,0.18)", color: "#0e6b3a" },
  plenty: { bg: "rgba(79,125,255,0.16)", color: "var(--accent-2)" },
};

export function StockBadge({ state, label }: { state: string; label?: string }) {
  const tone = tones[state] ?? tones.out;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {label ?? stockLabel(state)}
    </span>
  );
}
