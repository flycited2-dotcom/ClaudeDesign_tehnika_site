"use client";

import { useState } from "react";

/**
 * Normalize any user input to a Russian phone that always starts with a locked
 * "+7 ". The single leading 7/8 (the prefix itself, or a pasted country code) is
 * stripped, then up to 10 subscriber digits are grouped. Empty input collapses
 * back to "+7 " so the user can never delete the prefix.
 */
export function formatRuPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = digits.slice(1);
  else if (digits.startsWith("7")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  const groups: string[] = [];
  if (digits.length > 0) groups.push(digits.slice(0, 3));
  if (digits.length > 3) groups.push(digits.slice(3, 6));
  if (digits.length > 6) groups.push(digits.slice(6, 8));
  if (digits.length > 8) groups.push(digits.slice(8, 10));

  return groups.length ? `+7 ${groups.join(" ")}` : "+7 ";
}

/**
 * Phone input with a locked "+7" prefix, used in every site form so visitors
 * only type the 10 digits and never have to add the country code themselves.
 */
export function PhoneField({
  name = "phone",
  required,
  className = "input",
  style,
  defaultValue,
}: {
  name?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(() => formatRuPhone(defaultValue ?? ""));

  return (
    <input
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      required={required}
      maxLength={20}
      className={className}
      style={style}
      value={value}
      onChange={(event) => setValue(formatRuPhone(event.target.value))}
    />
  );
}
