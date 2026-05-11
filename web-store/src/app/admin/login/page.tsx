import { LoginForm } from "@/app/admin/login/login-form";

export default function AdminLoginPage() {
  return (
    <div className="admin-area" style={{ maxWidth: 460, margin: "0 auto", padding: "48px 0" }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent-2)" }}>
        Закрытый раздел
      </p>
      <h1 style={{ marginTop: 8, fontSize: 30, fontWeight: 900, letterSpacing: "-0.01em", color: "var(--text)" }}>
        Вход администратора
      </h1>
      <p style={{ marginTop: 12, marginBottom: 24, color: "var(--text-mute)" }}>
        Доступ задается через ADMIN_EMAIL и ADMIN_PASSWORD на сервере.
      </p>
      <LoginForm />
    </div>
  );
}
