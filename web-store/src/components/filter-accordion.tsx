"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

/**
 * Accessible collapsible filter section (a client-island accordion).
 *
 * Why a button + region instead of native <details>: we need a consistent
 * glass look with a rotating chevron, controlled default state per section,
 * and the hidden region must still submit its checkboxes with the native
 * GET form even while visually collapsed — so we keep the content mounted and
 * just toggle `hidden`. The native form serialises hidden inputs, so a
 * collapsed-but-selected filter is still applied.
 *
 * Accessibility: header is a real <button> (Enter/Space toggle for free),
 * `aria-expanded` reflects state, `aria-controls` points at the region, and
 * the region has `role="region"` + `aria-labelledby`.
 */
export function FilterAccordion({
  title,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  /** Optional small count shown next to the title (e.g. selected count). */
  badge?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  const headerId = useId();

  return (
    <div className={"f-acc" + (open ? " open" : "")}>
      <button
        type="button"
        id={headerId}
        className="f-acc-head"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="f-acc-title">
          {title}
          {typeof badge === "number" && badge > 0 ? <span className="f-acc-badge">{badge}</span> : null}
        </span>
        <ChevronDown className="f-acc-chev" size={18} aria-hidden />
      </button>
      <div id={regionId} role="region" aria-labelledby={headerId} className="f-acc-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
