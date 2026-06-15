import { Mail, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { FooterSubscribe } from "@/components/footer-subscribe";
import { phoneHref, storefront } from "@/lib/storefront";

const FOOTER_LINKS = [
  ["/catalog", "Каталог"],
  ["/b2b", "Опт (B2B)"],
  ["/gov", "Госзакупки"],
  ["/service", "Сервис"],
  ["/#contacts", "Контакты"],
  ["/privacy", "Персональные данные"],
] as const;

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-sub">
        <div className="sub-title">
          <div className="ic">
            <Mail size={18} aria-hidden />
          </div>
          <div>
            <div>Будьте в курсе новинок</div>
            <div style={{ fontWeight: 500, color: "var(--text-mute)", fontSize: 13, marginTop: 4 }}>
              и эксклюзивных предложений
            </div>
          </div>
        </div>
        <FooterSubscribe email={storefront.email} />
        <div className="socials">
          <a
            className="social"
            title="Telegram"
            href="https://t.me/+79785792995"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
          >
            <Send size={18} aria-hidden />
          </a>
          <a
            className="social"
            title="WhatsApp"
            href="https://wa.me/79785792995"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <MessageCircle size={18} aria-hidden />
          </a>
        </div>
      </div>

      <nav
        style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px", padding: "18px 0 0", fontSize: 14 }}
        aria-label="Разделы сайта"
      >
        {FOOTER_LINKS.map(([href, label]) => (
          <Link key={href} href={href} style={{ color: "var(--text-2)", textDecoration: "none", fontWeight: 600 }}>
            {label}
          </Link>
        ))}
      </nav>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", fontSize: 14, marginTop: 10 }}>
        {storefront.phones.map((phone) => (
          <a key={phone} href={phoneHref(phone)} style={{ color: "var(--text)", textDecoration: "none", fontWeight: 700 }}>
            {phone}
          </a>
        ))}
        <a href={`mailto:${storefront.email}`} style={{ color: "var(--text-2)", textDecoration: "none" }}>
          {storefront.email}
        </a>
      </div>

      <div className="footer-bottom">
        <span>© 2026 {storefront.brand}. ИНН 9102228140 · ОГРН 1149102018830</span>
        <span>Все цены указаны в рублях. Не является публичной офертой.</span>
      </div>
    </footer>
  );
}
