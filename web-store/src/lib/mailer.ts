import { storefront } from "@/lib/storefront";

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailSendResult = { ok: true; provider: "resend" | "console" } | { ok: false; error: string };

function logToConsole({ to, subject, text }: SendArgs): MailSendResult {
  console.info(`[mailer:console] to=${to} subject=${subject}\n${text}`);
  return { ok: true, provider: "console" };
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

export async function sendMail(args: SendArgs): Promise<MailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || `${storefront.brand} <noreply@climat-simf.ru>`;

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
