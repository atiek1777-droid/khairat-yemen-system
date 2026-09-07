"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { receiptSchema, adjustmentSchema, type ReceiptInput, type AdjustmentInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function createReceiptAction(input: ReceiptInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  if (profile.role === "distributor" && parsed.data.distributor_id !== profile.distributor_id) {
    return { ok: false, message: "لا يمكنك تسجيل استلام خارج نطاقك" };
  }
  if (profile.role === "factory_owner") return { ok: false, message: "هذا الحساب للعرض فقط" };

  const supabase = createClient();
  const { error } = await supabase.from("inventory_receipts").insert({
    distributor_id: parsed.data.distributor_id,
    product_id: parsed.data.product_id,
    quantity_containers: parsed.data.quantity_containers,
    unit_cost: parsed.data.unit_cost,
    receipt_date: parsed.data.receipt_date,
    notes: parsed.data.notes || null,
    created_by: profile.id,
  });

  if (error) return { ok: false, message: "تعذر تسجيل الاستلام: " + error.message };
  revalidatePath("/inventory");
  return { ok: true, message: "تم تسجيل استلام العبوات بنجاح" };
}

export async function softDeleteReceiptAction(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("inventory_receipts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "تعذر الحذف: " + error.message + " (قد تحتاج صلاحية حذف السجلات المالية)" };
  revalidatePath("/inventory");
  return { ok: true, message: "تم الحذف" };
}

export async function createAdjustmentAction(input: AdjustmentInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  if (profile.role === "distributor" && parsed.data.distributor_id !== profile.distributor_id) {
    return { ok: false, message: "لا يمكنك تسجيل تعديل خارج نطاقك" };
  }
  if (profile.role === "factory_owner") return { ok: false, message: "هذا الحساب للعرض فقط" };

  const supabase = createClient();
  const { error } = await supabase.from("inventory_adjustments").insert({
    distributor_id: parsed.data.distributor_id,
    product_id: parsed.data.product_id,
    adjustment_type: parsed.data.adjustment_type,
    quantity_containers: parsed.data.quantity_containers,
    adjustment_date: parsed.data.adjustment_date,
    reason: parsed.data.reason || null,
    created_by: profile.id,
  });

  if (error) return { ok: false, message: "تعذر تسجيل التعديل: " + error.message };
  revalidatePath("/inventory");
  return { ok: true, message: "تم تسجيل التعديل بنجاح" };
}
