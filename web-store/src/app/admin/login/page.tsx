import { LoginForm } from "@/app/admin/login/login-form";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Закрытый раздел</p>
      <h1 className="mt-2 text-3xl font-black tracking-normal text-zinc-950">Вход администратора</h1>
      <p className="mb-6 mt-3 text-zinc-600">Доступ задается через ADMIN_EMAIL и ADMIN_PASSWORD на сервере.</p>
      <LoginForm />
    </div>
  );
}
