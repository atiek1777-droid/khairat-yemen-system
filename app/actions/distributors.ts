"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { distributorSchema, type DistributorInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function createDistributorAction(input: DistributorInput): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  const parsed = distributorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase.from("distributors").insert({
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    area: parsed.data.area || null,
    notes: parsed.data.notes || null,
    is_active: parsed.data.is_active,
    created_by: profile.id,
  });

  if (error) return { ok: false, message: "تعذر إضافة الموزّع: " + error.message };
  revalidatePath("/distributors");
  return { ok: true, message: "تمت إضافة الموزّع بنجاح" };
}

export async function updateDistributorAction(id: string, input: DistributorInput): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  const parsed = distributorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase
    .from("distributors")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      area: parsed.data.area || null,
      notes: parsed.data.notes || null,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);

  if (error) return { ok: false, message: "تعذر تحديث الموزّع: " + error.message };
  revalidatePath("/distributors");
  return { ok: true, message: "تم تحديث بيانات الموزّع" };
}

export async function toggleDistributorActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  const supabase = createClient();
  const { error } = await supabase.from("distributors").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/distributors");
  return { ok: true };
}
