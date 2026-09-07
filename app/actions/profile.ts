"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { profileUpdateSchema, passwordChangeSchema, type ProfileUpdateInput, type PasswordChangeInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function updateOwnProfileAction(input: ProfileUpdateInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", profile.id);

  if (error) return { ok: false, message: "تعذر تحديث الملف الشخصي: " + error.message };
  revalidatePath("/profile");
  return { ok: true, message: "تم تحديث الملف الشخصي" };
}

export async function changeOwnPasswordAction(input: PasswordChangeInput): Promise<ActionResult> {
  await requireProfile();
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) return { ok: false, message: "تعذر تغيير كلمة المرور: " + error.message };
  return { ok: true, message: "تم تغيير كلمة المرور بنجاح" };
}
