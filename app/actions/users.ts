"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { usernameToEmail } from "@/lib/auth-email";
import { generateTempPassword } from "@/lib/password";
import { userCreateSchema, userUpdateSchema, type UserCreateInput, type UserUpdateInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function createUserAction(input: UserCreateInput): Promise<ActionResult & { generatedPassword?: string }> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  if (parsed.data.role === "distributor" && !parsed.data.distributor_id) {
    return { ok: false, message: "يجب اختيار الموزّع المرتبط بهذا المستخدم" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const email = usernameToEmail(parsed.data.username);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { ok: false, message: "تعذر إنشاء المستخدم: " + (createError?.message ?? "خطأ غير معروف") };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: parsed.data.full_name,
    username: parsed.data.username,
    phone: parsed.data.phone || null,
    role: parsed.data.role,
    distributor_id: parsed.data.role === "distributor" ? parsed.data.distributor_id : null,
    can_edit: parsed.data.role === "factory_owner" ? parsed.data.can_edit : false,
    can_delete_financial: parsed.data.role === "distributor" ? parsed.data.can_delete_financial : false,
    is_active: true,
    created_by: profile.id,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, message: "تعذر حفظ بيانات المستخدم: " + profileError.message };
  }

  revalidatePath("/users");
  return { ok: true, message: "تم إنشاء المستخدم بنجاح", generatedPassword: parsed.data.password };
}

export async function updateUserAction(input: UserUpdateInput): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      distributor_id: parsed.data.role === "distributor" ? parsed.data.distributor_id : null,
      can_edit: parsed.data.role === "factory_owner" ? parsed.data.can_edit : false,
      can_delete_financial: parsed.data.role === "distributor" ? parsed.data.can_delete_financial : false,
      is_active: parsed.data.is_active,
    })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: "تعذر تحديث المستخدم: " + error.message };
  revalidatePath("/users");
  return { ok: true, message: "تم تحديث بيانات المستخدم" };
}

export async function resetPasswordAction(userId: string): Promise<ActionResult & { generatedPassword?: string }> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const newPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { ok: false, message: "تعذر إعادة تعيين كلمة المرور: " + error.message };

  return { ok: true, message: "تم إنشاء كلمة مرور مؤقتة جديدة", generatedPassword: newPassword };
}

export async function toggleUserActiveAction(userId: string, isActive: boolean): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };
  if (profile.id === userId && !isActive) return { ok: false, message: "لا يمكنك إيقاف حسابك الخاص" };

  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/users");
  return { ok: true };
}
