const DEFAULT_MARKUP_PRESETS = [10, 15, 20, 25];
const DEFAULT_SEARCH_LIMIT = 20;

function splitValues(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[;,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseTelegramUserIds(value: string | undefined): number[] {
  const tokens = splitValues(value);
  const ids = tokens.map(Number);
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("B2B_ASSISTANT_TELEGRAM_USER_IDS содержит некорректный Telegram ID.");
  }
  return [...new Set(ids)];
}

export function parseMarkupPresets(value: string | undefined): number[] {
  const tokens = splitValues(value);
  if (tokens.length === 0) return DEFAULT_MARKUP_PRESETS;
  const presets = tokens.map((token) => Number(token.replace(",", ".")));
  if (presets.some((preset) => !Number.isFinite(preset) || preset < 0 || preset > 1_000)) {
    throw new Error("B2B_ASSISTANT_MARKUP_PRESETS содержит некорректную наценку.");
  }
  return [...new Set(presets)].slice(0, 8);
}

export function b2bAssistantToken(): string {
  const token = process.env.B2B_ASSISTANT_TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Укажите B2B_ASSISTANT_TELEGRAM_BOT_TOKEN.");
  return token;
}

export function b2bAssistantAllowedUserIds(): Set<number> {
  const ids = parseTelegramUserIds(process.env.B2B_ASSISTANT_TELEGRAM_USER_IDS);
  if (ids.length === 0) {
    throw new Error("Укажите хотя бы один ID в B2B_ASSISTANT_TELEGRAM_USER_IDS.");
  }
  return new Set(ids);
}

export function b2bAssistantMarkupPresets(): number[] {
  return parseMarkupPresets(process.env.B2B_ASSISTANT_MARKUP_PRESETS);
}

export function b2bAssistantDefaultMarkupPercent(): number {
  const raw = process.env.B2B_ASSISTANT_DEFAULT_MARKUP_PERCENT;
  const value = raw ? Number(raw) : b2bAssistantMarkupPresets()[0];
  if (!Number.isFinite(value) || value < 0 || value > 1_000) {
    throw new Error("B2B_ASSISTANT_DEFAULT_MARKUP_PERCENT должен быть числом от 0 до 1000.");
  }
  return value;
}

export function b2bAssistantRoundingStep(): number {
  const raw = process.env.B2B_ASSISTANT_PRICE_ROUNDING_RUB;
  const value = raw ? Number(raw) : 100;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("B2B_ASSISTANT_PRICE_ROUNDING_RUB должен быть положительным числом.");
  }
  return value;
}

export function b2bAssistantSearchLimit(): number {
  const raw = process.env.B2B_ASSISTANT_SEARCH_LIMIT;
  const value = raw ? Number(raw) : DEFAULT_SEARCH_LIMIT;
  if (!Number.isSafeInteger(value) || value < 1 || value > 20) {
    throw new Error("B2B_ASSISTANT_SEARCH_LIMIT должен быть целым числом от 1 до 20.");
  }
  return value;
}

export function b2bAssistantSiteUrl(): string {
  const raw = process.env.B2B_ASSISTANT_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (!raw) throw new Error("Укажите B2B_ASSISTANT_SITE_URL или SITE_URL.");
  return new URL(raw).toString().replace(/\/$/, "");
}

export function b2bAssistantStateFile(): string {
  return process.env.B2B_ASSISTANT_STATE_FILE?.trim() || ".runtime/b2b-assistant-bot-state.json";
}
