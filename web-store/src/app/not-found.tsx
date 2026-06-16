import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
      <div className="glass-strong" style={{ padding: 48, borderRadius: 28 }}>
        <p
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            background: "linear-gradient(135deg,#286bff,#8d75ff 60%,#b594ff)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          404
        </p>
        <h1 style={{ marginTop: 12, fontSize: 26, fontWeight: 900, color: "var(--text)" }}>Страница не найдена</h1>
        <p style={{ margin: "12px auto 0", maxWidth: 440, color: "var(--text-mute)", lineHeight: 1.6 }}>
          Возможно, ссылка устарела или товар снят с продажи. Вернитесь в каталог или на главную — поможем подобрать нужное.
        </p>
        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          <Link href="/catalog" className="btn btn-primary">
            <Search size={18} aria-hidden /> В каталог
          </Link>
          <Link href="/" className="btn btn-soft">
            <Home size={18} aria-hidden /> На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
