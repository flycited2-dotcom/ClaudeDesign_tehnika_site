import { Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { storefront } from "@/lib/storefront";

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
        <form className="email-form" action="#" method="post">
          <input name="email" type="email" placeholder="Ваш e-mail" aria-label="Ваш e-mail" />
          <button type="submit">Подписаться</button>
        </form>
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
          <a className="social" title="WhatsApp" href="#" aria-label="WhatsApp">
            <MessageCircle size={18} aria-hidden />
          </a>
          <a className="social" title={storefront.region} href="#" aria-label="Карта">
            <MapPin size={18} aria-hidden />
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 {storefront.brand}. ИНН 9102228140 · ОГРН 1149102018830</span>
        <span>Все цены указаны в рублях. Не является публичной офертой.</span>
      </div>
    </footer>
  );
}
