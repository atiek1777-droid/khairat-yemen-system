"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function createCustomerAction(input: CustomerInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  if (profile.role === "distributor" && parsed.data.distributor_id !== profile.distributor_id) {
    return { ok: false, message: "لا يمكنك إضافة عميل خارج نطاق موزّعك" };
  }
  if (profile.role === "factory_owner" && !profile.can_edit) {
    return { ok: false, message: "ليس لديك صلاحية التعديل" };
  }

  const supabase = createClient();
  const { error } = await supabase.from("customers").insert({
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    distributor_id: parsed.data.distributor_id,
    notes: parsed.data.notes || null,
    created_by: profile.id,
  });

  if (error) return { ok: false, message: "تعذر إضافة العميل: " + error.message };
  revalidatePath("/customers");
  return { ok: true, message: "تمت إضافة العميل بنجاح" };
}

export async function updateCustomerAction(id: string, input: CustomerInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { ok: false, message: "تعذر تحديث العميل: " + error.message };
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true, message: "تم تحديث بيانات العميل" };
}

export async function softDeleteCustomerAction(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("customers").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "تعذر حذف العميل: " + error.message };
  revalidatePath("/customers");
  return { ok: true, message: "تم حذف العميل" };
}
