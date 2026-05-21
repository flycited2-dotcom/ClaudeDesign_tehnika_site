# Email Phase 1 — Outbound (Postfix) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make magic-link login/registration emails actually send and arrive in RU inboxes (Mail.ru, Yandex), via a self-hosted Postfix + OpenDKIM relay on the VPS.

**Architecture:** App sends via localhost Postfix (no auth, `mynetworks=127.0.0.0/8`). OpenDKIM milter signs outbound for the domain. Deliverability rests on PTR + SPF + DKIM + DMARC DNS records. Receiving + Dovecot + Roundcube are Phase 2.

**Tech Stack:** Postfix, OpenDKIM (Ubuntu 24), nodemailer (existing), Next.js 16, pm2.

**Reference spec:** `web-store/docs/superpowers/specs/2026-05-21-email-setup-postfix-design.md`

**Legend:** 🟦 = executor (me, VPS root SSH / repo). 🟨 = owner (manual, Sprintbox panel).

---

## Task 1: mailer.ts — dual sender + no-auth localhost SMTP

**Files:**
- Modify: `web-store/src/lib/mailer.ts`
- Modify: `web-store/src/lib/mailer.test.ts`
- Modify: `web-store/src/app/admin/role-requests/actions.ts`
- Modify: `web-store/.env.example`

- [ ] **Step 1: Write failing tests for from-address helpers**

Append to `web-store/src/lib/mailer.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mailFromNoreply, mailFromInfo } from "@/lib/mailer";

describe("mail from-address helpers", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    delete process.env.MAIL_FROM;
    delete process.env.MAIL_FROM_NOREPLY;
    delete process.env.MAIL_FROM_INFO;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("mailFromNoreply falls back to default noreply when no env", () => {
    expect(mailFromNoreply()).toContain("noreply@climat-simf.ru");
  });

  it("mailFromNoreply prefers MAIL_FROM_NOREPLY, then legacy MAIL_FROM", () => {
    process.env.MAIL_FROM = "Legacy <legacy@climat-simf.ru>";
    expect(mailFromNoreply()).toBe("Legacy <legacy@climat-simf.ru>");
    process.env.MAIL_FROM_NOREPLY = "NR <noreply@climat-simf.ru>";
    expect(mailFromNoreply()).toBe("NR <noreply@climat-simf.ru>");
  });

  it("mailFromInfo uses MAIL_FROM_INFO when set, else falls back to noreply", () => {
    expect(mailFromInfo()).toContain("noreply@climat-simf.ru");
    process.env.MAIL_FROM_INFO = "Info <info@climat-simf.ru>";
    expect(mailFromInfo()).toBe("Info <info@climat-simf.ru>");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web-store && npx vitest run src/lib/mailer.test.ts`
Expected: FAIL — `mailFromNoreply`/`mailFromInfo` not exported.

- [ ] **Step 3: Add `from` to SendArgs and the from-helpers**

In `web-store/src/lib/mailer.ts`, change the `SendArgs` type (top of file):
```ts
type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
};
```

Add the helpers immediately above `export async function sendMail` (after the `sendViaResend` function):
```ts
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
```

- [ ] **Step 4: Resolve `from` from args in sendMail**

In `web-store/src/lib/mailer.ts`, replace the first line of `sendMail`:
```ts
  const from = process.env.MAIL_FROM || `${storefront.brand} <noreply@climat-simf.ru>`;
```
with:
```ts
  const from = args.from ?? mailFromNoreply();
```

- [ ] **Step 5: Allow SMTP without auth for localhost relay**

In `web-store/src/lib/mailer.ts`, replace the body of `getSmtpTransport` up to and including the `createTransport` call:
```ts
function getSmtpTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !portStr) return null;

  const port = Number(portStr);
  if (!Number.isFinite(port) || port <= 0) return null;

  const hasAuth = Boolean(user && pass);
  const key = `${host}:${port}:${user ?? "noauth"}`;
  if (cachedSmtp && cachedSmtpKey === key) return cachedSmtp;

  // 465 → implicit TLS, 587/25 → STARTTLS upgrade. Local relay (127.0.0.1:25)
  // needs no auth — Postfix accepts from mynetworks.
  const secure = port === 465;
  cachedSmtp = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(hasAuth ? { auth: { user, pass } } : {}),
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  cachedSmtpKey = key;
  return cachedSmtp;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd web-store && npx vitest run src/lib/mailer.test.ts`
Expected: PASS (all, including the new 3).

- [ ] **Step 7: Route role-status emails through info@**

In `web-store/src/app/admin/role-requests/actions.ts`:
- Change the import on line 7 to add the helper:
```ts
import { buildRoleApprovedEmail, buildRoleRejectedEmail, mailFromInfo, sendMail } from "@/lib/mailer";
```
- In the approved branch, change the `sendMail({ to: user.email, ... })` call to include `from`:
```ts
      await sendMail({ from: mailFromInfo(), to: user.email, subject: mail.subject, text: mail.text, html: mail.html });
```
- In the rejected branch, change the `sendMail({ to: updated.user.email, ... })` call:
```ts
    await sendMail({ from: mailFromInfo(), to: updated.user.email, subject: mail.subject, text: mail.text, html: mail.html });
```

- [ ] **Step 8: Document env vars in .env.example**

In `web-store/.env.example`, find the existing SMTP block and replace/extend it so it reads:
```
# Mail (Phase 1: self-hosted Postfix relay on the VPS, localhost no-auth)
SMTP_HOST=127.0.0.1
SMTP_PORT=25
# SMTP_USER / SMTP_PASSWORD — only for authenticated external relays; leave empty for localhost Postfix.
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM_NOREPLY="БытТехОпт <noreply@climat-simf.ru>"
MAIL_FROM_INFO="БытТехОпт <info@climat-simf.ru>"
```
(If `.env.example` has no SMTP block, append the above at the end.)

- [ ] **Step 9: Lint + full test + build**

Run: `cd web-store && npm run lint && npm run test && npm run build`
Expected: lint clean; tests pass (was 161 → now 164, +3); build succeeds.

- [ ] **Step 10: Commit**

```bash
git add web-store/src/lib/mailer.ts web-store/src/lib/mailer.test.ts web-store/src/app/admin/role-requests/actions.ts web-store/.env.example
git commit -m "feat(mail): dual sender (noreply@/info@) + no-auth localhost SMTP for Postfix relay"
```

---

## Task 2: 🟦 Install & configure Postfix + OpenDKIM on VPS

All commands run via `ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150`.

- [ ] **Step 1: Install Postfix + OpenDKIM (non-interactive, "Internet Site")**

```bash
export DEBIAN_FRONTEND=noninteractive
debconf-set-selections <<< "postfix postfix/mailname string mail.climat-simf.ru"
debconf-set-selections <<< "postfix postfix/main_mailer_type string 'Internet Site'"
apt-get update
apt-get install -y postfix opendkim opendkim-tools
```
Expected: packages install without prompting.

- [ ] **Step 2: Generate the DKIM key (selector `mail`)**

```bash
mkdir -p /etc/opendkim/keys/climat-simf.ru
opendkim-genkey -b 2048 -d climat-simf.ru -D /etc/opendkim/keys/climat-simf.ru -s mail -v
chown -R opendkim:opendkim /etc/opendkim
chmod 600 /etc/opendkim/keys/climat-simf.ru/mail.private
cat /etc/opendkim/keys/climat-simf.ru/mail.txt
```
Expected: `mail.txt` prints a `mail._domainkey ... v=DKIM1; k=rsa; p=...` TXT record. **Save this output verbatim — it is the DKIM DNS value for Task 3.**

- [ ] **Step 3: Configure OpenDKIM**

Write `/etc/opendkim.conf`:
```bash
cat > /etc/opendkim.conf <<'EOF'
Syslog                  yes
UMask                   002
Mode                    s
Canonicalization        relaxed/simple
OversignHeaders         From
Socket                  inet:8891@localhost
PidFile                 /run/opendkim/opendkim.pid
KeyTable                /etc/opendkim/KeyTable
SigningTable            refile:/etc/opendkim/SigningTable
InternalHosts           /etc/opendkim/TrustedHosts
EOF

cat > /etc/opendkim/KeyTable <<'EOF'
mail._domainkey.climat-simf.ru climat-simf.ru:mail:/etc/opendkim/keys/climat-simf.ru/mail.private
EOF

cat > /etc/opendkim/SigningTable <<'EOF'
*@climat-simf.ru mail._domainkey.climat-simf.ru
EOF

cat > /etc/opendkim/TrustedHosts <<'EOF'
127.0.0.1
::1
localhost
climat-simf.ru
EOF

systemctl restart opendkim
systemctl enable opendkim
systemctl is-active opendkim
```
Expected: `active`.

- [ ] **Step 4: Wire Postfix → OpenDKIM milter + relay/identity settings**

```bash
postconf -e 'myhostname = mail.climat-simf.ru'
postconf -e 'mydomain = climat-simf.ru'
postconf -e 'myorigin = $mydomain'
postconf -e 'mynetworks = 127.0.0.0/8 [::1]/128'
postconf -e 'inet_interfaces = all'
postconf -e 'milter_default_action = accept'
postconf -e 'milter_protocol = 6'
postconf -e 'smtpd_milters = inet:localhost:8891'
postconf -e 'non_smtpd_milters = inet:localhost:8891'
postconf -e 'smtp_tls_security_level = may'
postconf -e 'smtpd_tls_security_level = may'
systemctl restart postfix
systemctl is-active postfix
```
Expected: `active`. (Outbound opportunistic TLS needs no local cert; inbound cert is Phase 2.)

- [ ] **Step 5: Confirm not an open relay + localhost relay works**

```bash
postconf mynetworks
echo "relay check (should be 127/8 only): $(postconf -h mynetworks)"
# Local injection test (queues a mail; delivery verified in Task 5):
echo "Test body" | mail -s "postfix-local-test" -r noreply@climat-simf.ru postmaster@climat-simf.ru 2>/dev/null || true
mailq | tail -5
```
Expected: `mynetworks` is `127.0.0.0/8 [::1]/128` (NOT a public range). No external relay permitted.

---

## Task 3: 🟨 Owner — DNS records + PTR (Sprintbox panel)

Executor provides the exact values (DKIM from Task 2 Step 2). Owner adds them.

- [ ] **Step 1: Add DNS records (Sprintbox → Домены → DNS-записи)**

| Тип | Имя | Значение |
|-----|-----|----------|
| `A` | `mail` | `212.116.115.150` |
| `TXT` | `@` (SPF) | `v=spf1 a mx ip4:212.116.115.150 -all` |
| `TXT` | `mail._domainkey` (DKIM) | значение из Task 2 Step 2 (`v=DKIM1; k=rsa; p=...`) |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@climat-simf.ru` |

Do NOT change the root `A @ = 212.116.115.150`. (MX is added in Phase 2 — receiving.)

- [ ] **Step 2: Change PTR / rDNS (Sprintbox → Боксы → rDNS for 212.116.115.150)**

Set reverse DNS for `212.116.115.150` → `mail.climat-simf.ru`.

- [ ] **Step 3: 🟦 Verify DNS + PTR propagated**

```bash
nslookup -type=A mail.climat-simf.ru 8.8.8.8
nslookup -type=TXT climat-simf.ru 8.8.8.8 | grep spf1
nslookup -type=TXT mail._domainkey.climat-simf.ru 8.8.8.8 | grep DKIM1
nslookup -type=TXT _dmarc.climat-simf.ru 8.8.8.8 | grep DMARC1
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 "host 212.116.115.150"
```
Expected: A=212.116.115.150; SPF, DKIM, DMARC present; PTR → `mail.climat-simf.ru`. (DNS may take minutes to propagate.)

---

## Task 4: 🟦 Point the app at the local Postfix relay

- [ ] **Step 1: Add SMTP env to the prod .env**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'cd /var/www/climat-simf.ru && cp .env .env.bak-$(date +%Y%m%d%H%M%S) && cat >> .env <<EOF

# Mail — self-hosted Postfix relay (Phase 1)
SMTP_HOST=127.0.0.1
SMTP_PORT=25
MAIL_FROM_NOREPLY="БытТехОпт <noreply@climat-simf.ru>"
MAIL_FROM_INFO="БытТехОпт <info@climat-simf.ru>"
EOF'
```
Note: do NOT set `SMTP_USER`/`SMTP_PASSWORD` (localhost relay is unauthenticated). If they already exist in `.env`, blank them.

- [ ] **Step 2: Restart the app**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 "pm2 restart climat-simf-store && sleep 3 && pm2 status climat-simf-store"
```
Expected: `online`.

---

## Task 5: 🟦 End-to-end deliverability verification

- [ ] **Step 1: Send a magic-link to RU inboxes**

On the prod site `https://climat-simf.ru/login`, request a login link to a personal **@mail.ru** and a **@yandex.ru** address (use real test inboxes you control). Alternatively trigger via curl against the server action is non-trivial — use the UI.

- [ ] **Step 2: Confirm receipt + authentication headers**

In each test inbox (check **Inbox AND Spam**):
- The email arrives.
- View original/headers → `spf=pass`, `dkim=pass`, `dmarc=pass`.

Also send a message to `check-auth@verifier.port25.com` or run mail-tester:
```bash
# On VPS, send to a fresh mail-tester address (get it from https://www.mail-tester.com):
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 "echo 'deliverability test' | mail -s 'mail-tester' -r noreply@climat-simf.ru <MAILTESTER_ADDRESS>"
```
Expected: mail-tester score ≥ 8/10; SPF, DKIM, DMARC all pass.

- [ ] **Step 3: Complete the login flow**

Click the magic link in the received email → redirected to the site, session created, user is logged in.

- [ ] **Step 4: Confirm not an open relay (external)**

From a machine OUTSIDE the VPS, attempt to relay through it:
```bash
swaks --server mail.climat-simf.ru --from test@evil.example --to someone@gmail.com --quit-after RCPT 2>&1 | tail -5
```
Expected: `RCPT` rejected (Relay access denied). If accepted → STOP, fix `mynetworks`/restrictions before going further.

- [ ] **Step 5: Update HANDOFF + memory**

Add a HANDOFF deploy entry (Iter: email Phase 1) and a memory note documenting the VPS-only mail stack (Postfix/OpenDKIM, DKIM selector `mail`, DNS records, PTR) — these live on the VPS and must be repeated on server migration. Commit HANDOFF.

---

## Self-Review

- **Spec coverage (Phase 1 parts):** outbound send ✅ (Task 2,4), DKIM ✅ (Task 2), SPF/DMARC ✅ (Task 3), PTR ✅ (Task 3), code dual-sender + no-auth ✅ (Task 1), deliverability test ✅ (Task 5), not-open-relay ✅ (Task 2 Step 5, Task 5 Step 4). Receiving/Dovecot/Roundcube/MX/TLS-cert → deferred to Phase 2 (out of scope here, by design).
- **Placeholder scan:** `<MAILTESTER_ADDRESS>` and the DKIM value are runtime-produced inputs (mail-tester gives a fresh address; DKIM comes from Task 2 Step 2), not unfilled plan gaps.
- **Consistency:** env names (`SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM_NOREPLY`, `MAIL_FROM_INFO`) and helper names (`mailFromNoreply`, `mailFromInfo`) match across Tasks 1, 4 and the spec.

## Risks (carried from spec)

- Gmail delivery unreliable (outbound :25 to Google blocked) — accepted, RU-focus.
- New-sender reputation: first emails may spam-folder until reputation warms.
- Open-relay safety is verified explicitly (Task 2 Step 5 + Task 5 Step 4) — non-negotiable gate.
