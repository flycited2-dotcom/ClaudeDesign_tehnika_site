import { X } from "lucide-react";
import Link from "next/link";

export type ActiveFilterChip = {
  /** Human-readable chip text, e.g. "Бренд: Bosch" or "От 10 000 ₽". */
  label: string;
  /** URL that removes just this one filter (keeps everything else). */
  removeHref: string;
};

/**
 * Row of active-filter chips shown above the product listing. Each chip is a
 * link that removes its own filter; a trailing "Сбросить всё" link resets to
 * `basePath` (clears every filter).
 *
 * This is a server-renderable component (plain links, no client state) — safe
 * to drop into the RSC `catalog-view`. The caller pre-computes every
 * `removeHref` on the server (no functions passed across the boundary).
 *
 * Renders nothing when there are no active chips.
 */
export function ActiveFilterChips({
  chips,
  basePath,
}: {
  chips: ActiveFilterChip[];
  basePath: string;
}) {
  if (!chips.length) return null;

  return (
    <div className="active-chips" aria-label="Активные фильтры">
      {chips.map((chip) => (
        <Link key={chip.label} href={chip.removeHref} className="active-chip" title={`Убрать: ${chip.label}`}>
          <span className="active-chip-label">{chip.label}</span>
          <X className="active-chip-x" size={13} aria-hidden />
        </Link>
      ))}
      <Link href={basePath} className="active-chip active-chip-reset">
        Сбросить всё
      </Link>
    </div>
  );
}
