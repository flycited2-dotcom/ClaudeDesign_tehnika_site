import { LoginForm } from "@/app/admin/login/login-form";

export default function AdminLoginPage() {
  return (
    <div className="adm-auth">
      <div className="adm-auth-card glass-strong" style={{ borderRadius: "var(--radius-lg)", padding: 32 }}>
        <p className="adm-topbar-tag">Закрытый раздел</p>
        <h1 style={{ marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
          Вход администратора
        </h1>
        <p style={{ marginTop: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.5, color: "var(--text-mute)" }}>
          Доступ задаётся через ADMIN_EMAIL и ADMIN_PASSWORD на сервере.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
