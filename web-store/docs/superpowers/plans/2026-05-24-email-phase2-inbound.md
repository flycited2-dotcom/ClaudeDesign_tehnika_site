# Email Phase 2 — Inbound (info@ mailbox + webmail) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Steps use checkbox (`- [ ]`).

**Goal:** Receive email at `info@climat-simf.ru` and read/reply it in a browser webmail.

**Architecture:** External MX → Postfix (virtual mailbox domain `climat-simf.ru`) → LMTP → Dovecot (Maildir for info@). Roundcube webmail on `webmail.climat-simf.ru` reads via Dovecot IMAP (localhost) and sends via Postfix (localhost:25, already relays from mynetworks; OpenDKIM signs). TLS via Let's Encrypt.

**Tech Stack:** Postfix (virtual), Dovecot (imapd+lmtpd), Roundcube + php8.3-fpm, nginx, certbot. Ubuntu 24.04.

**Reference spec:** `web-store/docs/superpowers/specs/2026-05-21-email-setup-postfix-design.md`

**Legend:** 🟦 executor (VPS root SSH). 🟨 owner (Sprintbox panel).

**Recon (2026-05-24):** Ubuntu 24.04, PHP 8.3.6, certbot 2.9, nginx 80/443, no dovecot/roundcube, `climat-simf.ru` NOT in Postfix mydestination.

---

## Task 1: 🟨 Owner — DNS (Sprintbox → DNS-записи)

- [ ] **Step 1: Add MX + webmail A**

| Тип | Имя | Значение |
|-----|-----|----------|
| `MX` | `climat-simf.ru` (`@`) | `10 mail.climat-simf.ru.` |
| `A` | `webmail` | `212.116.115.150` |

- [ ] **Step 2: 🟦 Verify**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'dig +short MX climat-simf.ru @ns1.sprinthost.ru; dig +short A webmail.climat-simf.ru @ns1.sprinthost.ru'
```
Expected: MX → `10 mail.climat-simf.ru.`; webmail A → `212.116.115.150`.

---

## Task 2: 🟦 Dovecot — IMAP + LMTP + info@ mailbox

- [ ] **Step 1: Install Dovecot**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'DEBIAN_FRONTEND=noninteractive apt-get install -y dovecot-core dovecot-imapd dovecot-lmtpd && dovecot --version'
```
Expected: version prints.

- [ ] **Step 2: Create vmail user + maildir root**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'getent group vmail || groupadd -g 5000 vmail; getent passwd vmail || useradd -u 5000 -g vmail -d /var/vmail -s /usr/sbin/nologin vmail; mkdir -p /var/vmail; chown -R vmail:vmail /var/vmail; chmod 770 /var/vmail'
```

- [ ] **Step 3: Generate info@ password + Dovecot passwd-file**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'PW=$(openssl rand -base64 15); HASH=$(doveadm pw -s SHA512-CRYPT -p "$PW"); echo "info@climat-simf.ru:$HASH::::::" > /etc/dovecot/users; chmod 640 /etc/dovecot/users; chown root:dovecot /etc/dovecot/users; echo "INFO_MAILBOX_PASSWORD=$PW"'
```
**Capture the printed `INFO_MAILBOX_PASSWORD` — give it to the owner for webmail login.** Stored only as a hash on the server.

- [ ] **Step 4: Configure Dovecot**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'cat > /etc/dovecot/conf.d/99-climat.conf <<EOF
mail_location = maildir:/var/vmail/%d/%n
mail_uid = vmail
mail_gid = vmail
first_valid_uid = 5000
first_valid_gid = 5000

passdb {
  driver = passwd-file
  args = scheme=SHA512-CRYPT username_format=%u /etc/dovecot/users
}
userdb {
  driver = static
  args = uid=vmail gid=vmail home=/var/vmail/%d/%n
}

ssl = required
ssl_cert = </etc/letsencrypt/live/mail.climat-simf.ru/fullchain.pem
ssl_key = </etc/letsencrypt/live/mail.climat-simf.ru/privkey.pem

service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0600
    user = postfix
    group = postfix
  }
}
service imap-login {
  inet_listener imap { address = 127.0.0.1 ; port = 143 }
  inet_listener imaps { port = 0 }
}
protocols = imap lmtp
EOF
echo "written"'
```
Note: Dovecot won't fully start until the mail.climat-simf.ru cert exists (Task 4). That's fine — LMTP socket + config are in place; restart after Task 4.

---

## Task 3: 🟦 Postfix — accept mail for the domain → LMTP to Dovecot

- [ ] **Step 1: Virtual maps + aliases**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'echo "info@climat-simf.ru OK" > /etc/postfix/vmailbox
cat > /etc/postfix/valias <<EOF
postmaster@climat-simf.ru info@climat-simf.ru
abuse@climat-simf.ru info@climat-simf.ru
noreply@climat-simf.ru info@climat-simf.ru
EOF
postmap /etc/postfix/vmailbox /etc/postfix/valias'
```

- [ ] **Step 2: Wire Postfix virtual delivery to Dovecot LMTP**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'postconf -e "virtual_mailbox_domains = climat-simf.ru"
postconf -e "virtual_transport = lmtp:unix:private/dovecot-lmtp"
postconf -e "virtual_mailbox_maps = hash:/etc/postfix/vmailbox"
postconf -e "virtual_alias_maps = hash:/etc/postfix/valias"
systemctl reload postfix
postconf virtual_mailbox_domains virtual_transport'
```
Expected: settings echo back. (Bounce-loop risk avoided — `climat-simf.ru` is virtual, not in mydestination.)

---

## Task 4: 🟦 TLS certificates (after Task 1 DNS)

- [ ] **Step 1: Issue certs for mail + webmail**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'certbot certonly --nginx --non-interactive --agree-tos -m flycited@gmail.com -d mail.climat-simf.ru -d webmail.climat-simf.ru 2>&1 | tail -8; ls /etc/letsencrypt/live/'
```
Expected: certs issued; `mail.climat-simf.ru` dir appears. (Requires Task 1 webmail A + existing mail A, and port 80 reachable.)

- [ ] **Step 2: Restart Dovecot (now cert exists)**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'systemctl restart dovecot && systemctl enable dovecot && systemctl is-active dovecot && ss -tlnp | grep -E ":143|:24 "'
```
Expected: active; LMTP socket + IMAP 127.0.0.1:143 present.

---

## Task 5: 🟦 Roundcube webmail on webmail.climat-simf.ru

- [ ] **Step 1: Install Roundcube (SQLite) + php-fpm**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'DEBIAN_FRONTEND=noninteractive apt-get install -y php8.3-fpm roundcube roundcube-sqlite3 php8.3-imap php8.3-intl 2>&1 | tail -5; systemctl enable --now php8.3-fpm; ls /var/lib/roundcube || ls /usr/share/roundcube'
```
Note: if apt prompts for dbconfig, preseed: `echo "roundcube-core roundcube/dbconfig-install boolean true" | debconf-set-selections; echo "roundcube-core roundcube/database-type select sqlite3" | debconf-set-selections` before install.

- [ ] **Step 2: Point Roundcube at local Dovecot + Postfix**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'RC=$(test -d /usr/share/roundcube && echo /usr/share/roundcube || echo /var/lib/roundcube)/config/config.inc.php
cat >> "$RC" <<EOF

// climat-simf overrides
\$config["imap_host"] = "localhost:143";
\$config["smtp_host"] = "localhost:25";
\$config["smtp_user"] = "";
\$config["smtp_pass"] = "";
\$config["product_name"] = "БытТехОпт — почта";
EOF
echo "configured $RC"'
```

- [ ] **Step 3: nginx vhost for webmail.climat-simf.ru**

```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'cat > /etc/nginx/sites-available/webmail.climat-simf.ru <<EOF
server {
    listen 443 ssl;
    server_name webmail.climat-simf.ru;
    root /var/lib/roundcube;
    index index.php;
    ssl_certificate /etc/letsencrypt/live/mail.climat-simf.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.climat-simf.ru/privkey.pem;
    client_max_body_size 25m;
    location / { try_files \$uri \$uri/ /index.php?\$query_string; }
    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
    location ~ ^/(config|temp|logs)/ { deny all; }
}
server {
    listen 80;
    server_name webmail.climat-simf.ru;
    return 301 https://\$host\$request_uri;
}
EOF
ln -sf /etc/nginx/sites-available/webmail.climat-simf.ru /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx'
```
Expected: `nginx -t` ok, reload. (cert path: the webmail cert is bundled in the mail.climat-simf.ru cert from Task 4 with both SANs.)

---

## Task 6: 🟦 Verify inbound + webmail

- [ ] **Step 1: External → info@ delivery (log + maildir)**

Owner sends an email from any external account TO `info@climat-simf.ru`. Then:
```bash
ssh -i ~/.ssh/climat_simf_deploy root@212.116.115.150 'grep -iE "info@climat-simf|lmtp|dovecot" /var/log/mail.log | tail -6; find /var/vmail -type f | head'
```
Expected: log shows `status=sent (250 ... dovecot-lmtp)`; a message file appears under `/var/vmail/climat-simf.ru/info/`.

- [ ] **Step 2: Webmail login + read**

Owner opens `https://webmail.climat-simf.ru`, logs in as `info@climat-simf.ru` + the password from Task 2 Step 3, sees the test email.

- [ ] **Step 3: Reply from info@ + check auth**

Reply from Roundcube → arrives at the external sender; headers show `dkim=pass` (OpenDKIM signs domain), `From: info@climat-simf.ru`.

---

## Task 7: 🟦 Docs

- [ ] Update HANDOFF (Phase 2 complete) + memory. Document VPS-only pieces (Dovecot config, vmail, Roundcube vhost, info@ mailbox) — repeat on migration. The info@ password lives only as a hash on the server + with the owner.

## Risks

- **Cert dependency:** Dovecot + webmail vhost need the mail.climat-simf.ru cert (Task 4). Sequencing enforced.
- **Spam to info@:** inbound has no content filtering yet (rspamd is out of scope) — acceptable for low volume.
- **Open relay:** unchanged — sending still localhost-only; Roundcube uses localhost:25 (authenticated by webmail login, From=info@).
- **fail2ban:** recommended later for dovecot/postfix auth (out of scope here).
