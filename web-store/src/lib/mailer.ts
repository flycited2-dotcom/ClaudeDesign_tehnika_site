import nodemailer, { type Transporter } from "nodemailer";
import { storefront } from "@/lib/storefront";

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
  if (!host || !portStr || !user || !pass) return null;

  const port = Number(portStr);
  if (!Number.isFinite(port) || port <= 0) return null;

  const key = `${host}:${port}:${user}`;
  if (cachedSmtp && cachedSmtpKey === key) return cachedSmtp;

  // 465 → implicit TLS, 587/25 → STARTTLS upgrade.
  const secure = port === 465;
  cachedSmtp = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
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
export async function sendMail(args: SendArgs): Promise<MailSendResult> {
  const from = process.env.MAIL_FROM || `${storefront.brand} <noreply@climat-simf.ru>`;

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
