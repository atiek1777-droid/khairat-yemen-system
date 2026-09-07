"use server";

import { createClient } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/auth-email";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { redirect } from "next/navigation";

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function signInAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      fieldErrors[String(issue.path[0])] = issue.message;
    });
    return { ok: false, fieldErrors };
  }

  const supabase = createClient();
  const email = usernameToEmail(parsed.data.username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { ok: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, message: "لا يوجد حساب مرتبط بهذا المستخدم. تواصل مع المدير." };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, message: "تم إيقاف هذا الحساب. تواصل مع المدير." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: data.user.id,
    action: "login",
    entity_type: "auth",
    description: "تسجيل دخول ناجح",
  });

  return { ok: true };
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
