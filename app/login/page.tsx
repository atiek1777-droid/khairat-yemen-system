import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "تسجيل الدخول — معامل خيرات اليمن" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 py-10">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #F4C542 0, transparent 45%), radial-gradient(circle at 80% 80%, #1F8A5B 0, transparent 45%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={110} />
          <h1 className="mt-3 text-lg font-extrabold text-white">معامل خيرات اليمن</h1>
          <p className="mt-1 text-sm text-white/60">نظام إدارة التوزيع والمبيعات والحسابات</p>
        </div>

        <div className="card p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          الحصبة – شارع عمران – جوار جامع السلام · 784355755
        </p>
      </div>
    </div>
  );
}
