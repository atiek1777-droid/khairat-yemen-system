"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { signInAction } from "@/app/actions/auth";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const result = await signInAction(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof LoginInput, { message });
        });
      }
      if (result.message) toast.error(result.message);
      return;
    }

    toast.success("تم تسجيل الدخول بنجاح");
    const next = searchParams.get("next") || "/dashboard";
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="اسم المستخدم" htmlFor="username" error={errors.username?.message} required>
        <Input id="username" autoComplete="username" placeholder="مثال: admin" {...register("username")} />
      </Field>

      <Field label="كلمة المرور" htmlFor="password" error={errors.password?.message} required>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
      </Field>

      <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
        <LogIn className="h-4.5 w-4.5" />
        {submitting ? "جارِ الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}
