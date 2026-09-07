"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { factorySettingsSchema, productCostSchema, type FactorySettingsInput, type ProductCostInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function updateFactorySettingsAction(id: string, input: FactorySettingsInput): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  const parsed = factorySettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase
    .from("factories")
    .update({
      name_ar: parsed.data.name_ar,
      name: parsed.data.name_ar,
      address: parsed.data.address,
      phone_primary: parsed.data.phone_primary,
      phone_secondary: parsed.data.phone_secondary || null,
      currency: parsed.data.currency,
    })
    .eq("id", id);

  if (error) return { ok: false, message: "تعذر حفظ بيانات المصنع: " + error.message };
  revalidatePath("/factory-settings");
  return { ok: true, message: "تم حفظ بيانات المصنع" };
}

export async function updateProductCostAction(id: string, input: ProductCostInput): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, message: "هذا الإجراء متاح للمدير فقط" };

  const parsed = productCostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({ factory_cost: parsed.data.factory_cost, updated_by: profile.id })
    .eq("id", id);

  if (error) return { ok: false, message: "تعذر تحديث التكلفة: " + error.message };
  revalidatePath("/product-settings");
  return { ok: true, message: "تم تحديث تكلفة العبوة بنجاح" };
}
