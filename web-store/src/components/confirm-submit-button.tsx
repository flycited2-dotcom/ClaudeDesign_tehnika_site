"use client";

/**
 * Submit button that asks for native confirmation before submitting its form.
 * Receives only serialisable props (strings / nodes), so it is safe to render
 * from server components (no function props cross the RSC boundary).
 */
export function ConfirmSubmitButton({
  confirmText,
  className,
  children,
}: {
  confirmText: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
