"use client";

// Last-resort boundary for errors thrown in the ROOT layout itself (e.g. a DB
// failure inside getRoleContext). global-error replaces the whole document, so
// it renders its own <html>/<body> and uses inline styles (no globals.css here).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          background: "#f4f6fb",
          color: "#0f1f4b",
        }}
      >
        <div style={{ maxWidth: 480, padding: 28, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Сервис временно недоступен</h1>
          <p style={{ color: "#5c6a8c", marginTop: 10, lineHeight: 1.5 }}>
            Произошла ошибка. Обновите страницу через минуту.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 18,
              padding: "10px 18px",
              borderRadius: 12,
              border: 0,
              background: "#426dff",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
