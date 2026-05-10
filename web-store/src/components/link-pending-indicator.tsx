"use client";

import { useLinkStatus } from "next/link";
import { clsx } from "clsx";

export function LinkPendingIndicator({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={clsx(
        "size-4 shrink-0 rounded-full border-2 border-current border-r-transparent opacity-0 transition-opacity duration-150",
        pending && "animate-spin opacity-100",
        className,
      )}
    />
  );
}
