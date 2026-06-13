import nodemailer, { type Transporter } from "nodemailer";
import type { OrderQuote } from "@/lib/checkout/validation";
import { formatRub } from "@/lib/format";
import { storefront } from "@/lib/storefront";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
};

export type MailSendResult =
  | { ok: true; provider: "smtp" | "resend" | "console" }
  | { ok: false; error: string };

function logToConsole({ to, subject, text }: SendArgs): MailSendResult {
  console.info(`[mailer:console] to=${to} subject=${subject}\n${text}`);
  return { ok: true, provider: "console" };
}

// SMTP transporter is cached per-process: opening a TLS connection per email
// is wasteful and Sprinthost will rate-limit fresh connections.
let cachedSmtp: Transporter | null = null;
let cachedSmtpKey: string | null = null;

function getSmtpTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !portStr) return null;

  const port = Number(portStr);
  if (!Number.isFinite(port) || port <= 0) return null;

  const hasAuth = Boolean(user && pass);
  const isLoopback = host === "127.0.0.1" || host === "localhost" || host === "::1";
  const key = `${host}:${port}:${user ?? "noauth"}`;
  if (cachedSmtp && cachedSmtpKey === key) return cachedSmtp;

  // 465 → implicit TLS, 587/25 → STARTTLS upgrade. A loopback relay (local
  // Postfix) advertises STARTTLS with a self-signed cert that nodemailer would
  // reject ("self-signed certificate"). Skip STARTTLS for loopback — the hop
  // never leaves the host, so plaintext is fine.
  const secure = port === 465;
  cachedSmtp = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(hasAuth ? { auth: { user, pass } } : {}),
    ...(isLoopback ? { ignoreTLS: true } : {}),
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  cachedSmtpKey = key;
  return cachedSmtp;
}

async function sendViaSmtp(args: SendArgs, from: string): Promise<MailSendResult> {
  const transport = getSmtpTransport();
  if (!transport) return { ok: false, error: "smtp env not configured" };
  try {
    await transport.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });
    return { ok: true, provider: "smtp" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

async function sendViaResend(args: SendArgs, apiKey: string, from: string): Promise<MailSendResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        text: args.text,
        html: args.html,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, error: `resend ${response.status}: ${text}` };
    }
    return { ok: true, provider: "resend" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown" };
  }
}

/**
 * Order of preference:
 *   1. SMTP (SMTP_HOST + port + user + password) — production path for
 *      Sprinthost mailbox (typically noreply@climat-simf.ru).
 *   2. Resend (RESEND_API_KEY) — legacy fallback if someone sets it later.
 *   3. Console — dev fallback, prints to pm2 logs. Use only locally.
 */
const DEFAULT_NOREPLY_ADDRESS = "noreply@climat-simf.ru";

export function mailFromNoreply(): string {
  return (
    process.env.MAIL_FROM_NOREPLY ||
    process.env.MAIL_FROM ||
    `${storefront.brand} <${DEFAULT_NOREPLY_ADDRESS}>`
  );
}

export function mailFromInfo(): string {
  return process.env.MAIL_FROM_INFO || mailFromNoreply();
}

export async function sendMail(args: SendArgs): Promise<MailSendResult> {
  const from = args.from ?? mailFromNoreply();

  if (getSmtpTransport()) {
    const result = await sendViaSmtp(args, from);
    if (result.ok) return result;
    // Surface SMTP errors instead of silently falling back — otherwise the
    // user thinks login worked but no email is sent.
    console.error("[mailer:smtp] failed:", result.error);
    return result;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return sendViaResend(args, apiKey, from);
  }

  return logToConsole(args);
}

export function buildMagicLinkEmail({
  url,
  email,
}: {
  url: string;
  email: string;
}): { subject: string; text: string; html: string } {
  const subject = `Вход в личный кабинет ${storefront.brand}`;
  const text = [
    `Здравствуйте!`,
    ``,
    `Чтобы войти в личный кабинет ${storefront.brand} (${email}), перейдите по ссылке:`,
    url,
    ``,
    `Ссылка действует 15 минут и срабатывает один раз.`,
    `Если вы не запрашивали вход — просто проигнорируйте это письмо.`,
    ``,
    `${storefront.phones[0]} · ${storefront.email}`,
  ].join("\n");
  const html = `<p>Здравствуйте!</p>
<p>Чтобы войти в личный кабинет <b>${storefront.brand}</b> (${email}), перейдите по ссылке:</p>
<p><a href="${url}">${url}</a></p>
<p>Ссылка действует 15 минут и срабатывает один раз.<br>Если вы не запрашивали вход — просто проигнорируйте это письмо.</p>
<p style="color:#666;font-size:12px">${storefront.phones[0]} · ${storefront.email}</p>`;
  return { subject, text, html };
}

export function buildRoleApprovedEmail({
  role,
  orgName,
}: {
  role: "b2b" | "gov";
  orgName: string;
}): { subject: string; text: string; html: string } {
  const roleLabel = role === "b2b" ? "опт-клиента" : "госзаказчика";
  const subject = `Ваш статус ${roleLabel} одобрен — ${storefront.brand}`;
  const text = [
    `Здравствуйте!`,
    ``,
    `Статус ${roleLabel} для «${orgName}» одобрен.`,
    `Теперь в личном кабинете и каталоге доступны соответствующие цены и условия.`,
    ``,
    `Войдите по адресу: ${storefront.siteUrl}/login`,
    ``,
    `${storefront.phones[0]} · ${storefront.email}`,
  ].join("\n");
  const html = `<p>Здравствуйте!</p>
<p>Статус ${roleLabel} для <b>«${orgName}»</b> одобрен.</p>
<p>Теперь в личном кабинете и каталоге доступны соответствующие цены и условия.</p>
<p><a href="${storefront.siteUrl}/login">Войти в кабинет</a></p>
<p style="color:#666;font-size:12px">${storefront.phones[0]} · ${storefront.email}</p>`;
  return { subject, text, html };
}

export function buildRoleRejectedEmail({
  role,
  orgName,
  note,
}: {
  role: "b2b" | "gov";
  orgName: string;
  note?: string | null;
}): { subject: string; text: string; html: string } {
  const roleLabel = role === "b2b" ? "опт-клиента" : "госзаказчика";
  const subject = `Заявка на статус ${roleLabel} — ${storefront.brand}`;
  const reason = note ? `Причина: ${note}` : "Свяжитесь с менеджером для уточнения причин.";
  const text = [
    `Здравствуйте!`,
    ``,
    `К сожалению, заявка на статус ${roleLabel} для «${orgName}» отклонена.`,
    reason,
    ``,
    `${storefront.phones[0]} · ${storefront.email}`,
  ].join("\n");
  const html = `<p>Здравствуйте!</p>
<p>К сожалению, заявка на статус ${roleLabel} для <b>«${orgName}»</b> отклонена.</p>
<p>${reason}</p>
<p style="color:#666;font-size:12px">${storefront.phones[0]} · ${storefront.email}</p>`;
  return { subject, text, html };
}

/** Mailbox the manager reads (webmail) — internal order/lead notifications. */
export function orderNotificationRecipient(): string {
  return process.env.ORDER_NOTIFICATION_EMAIL || "info@climat-simf.ru";
}

export function buildOrderEmail({
  orderNumber,
  customerName,
  phone,
  email,
  comment,
  kind,
  sourceUrl,
  quote,
}: {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  kind?: "order" | "quick";
  sourceUrl?: string | null;
  quote: OrderQuote;
}): { subject: string; text: string; html: string } {
  const e = escapeHtml;
  const kindLabel = kind === "quick" ? "Быстрый заказ" : "Новый заказ";
  const subject = `${kindLabel} ${orderNumber} — ${customerName}, ${formatRub(quote.total)}`;

  const text = [
    `${kindLabel} ${orderNumber}`,
    ``,
    `Имя: ${customerName}`,
    `Телефон: ${phone}`,
    email ? `Email: ${email}` : null,
    comment ? `Комментарий: ${comment}` : null,
    sourceUrl ? `Страница: ${sourceUrl}` : null,
    ``,
    `Состав заказа:`,
    ...quote.items.map((i) => `• ${i.name} — ${i.quantity} шт × ${formatRub(i.unitPrice)} = ${formatRub(i.total)} (SKU ${i.sku})`),
    ``,
    `Итого: ${formatRub(quote.total)}`,
    `Дата: ${new Date().toLocaleString("ru-RU")}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const rows = quote.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${e(i.name)}<br><span style="color:#888;font-size:12px">SKU ${i.sku}</span></td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;white-space:nowrap">${i.quantity} шт</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatRub(i.unitPrice)}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap"><b>${formatRub(i.total)}</b></td></tr>`,
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#1a1a2e">
<h2 style="margin:0 0 12px">${e(kindLabel)} <span style="color:#426dff">${e(orderNumber)}</span></h2>
<table style="border-collapse:collapse;margin:0 0 14px;font-size:14px">
<tr><td style="padding:3px 10px 3px 0;color:#666">Имя</td><td style="padding:3px 0"><b>${e(customerName)}</b></td></tr>
<tr><td style="padding:3px 10px 3px 0;color:#666">Телефон</td><td style="padding:3px 0"><b>${e(phone)}</b></td></tr>
${email ? `<tr><td style="padding:3px 10px 3px 0;color:#666">Email</td><td style="padding:3px 0">${e(email)}</td></tr>` : ""}
${comment ? `<tr><td style="padding:3px 10px 3px 0;color:#666">Комментарий</td><td style="padding:3px 0">${e(comment)}</td></tr>` : ""}
${sourceUrl ? `<tr><td style="padding:3px 10px 3px 0;color:#666">Страница</td><td style="padding:3px 0"><a href="${e(sourceUrl)}">${e(sourceUrl)}</a></td></tr>` : ""}
</table>
<table style="border-collapse:collapse;width:100%;font-size:14px;border:1px solid #eee">
<thead><tr style="background:#f5f7ff"><th style="padding:6px 10px;text-align:left">Товар</th><th style="padding:6px 10px">Кол-во</th><th style="padding:6px 10px;text-align:right">Цена</th><th style="padding:6px 10px;text-align:right">Сумма</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="font-size:18px;margin:14px 0 4px"><b>Итого: ${formatRub(quote.total)}</b></p>
<p style="color:#888;font-size:12px">${e(new Date().toLocaleString("ru-RU"))} · ${storefront.brand}</p>
</div>`;

  return { subject, text, html };
}
