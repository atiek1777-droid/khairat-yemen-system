"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { paymentSchema, type PaymentInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

/**
 * Allocates a collected amount across the customer's oldest unpaid/partial
 * credit invoices first (FIFO), never exceeding any single invoice's
 * remaining balance and never exceeding the customer's total debt.
 */
export async function collectPaymentAction(input: PaymentInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const v = parsed.data;

  if (profile.role === "factory_owner") return { ok: false, message: "هذا الحساب للعرض فقط" };

  const supabase = createClient();

  const { data: openSales, error: fetchError } = await supabase
    .from("sales")
    .select("id, distributor_id, total_amount, paid_amount, sale_date")
    .eq("customer_id", v.customer_id)
    .eq("sale_type", "credit")
    .is("deleted_at", null)
    .neq("payment_status", "paid")
    .order("sale_date", { ascending: true });

  if (fetchError) return { ok: false, message: fetchError.message };
  if (!openSales || openSales.length === 0) {
    return { ok: false, message: "لا توجد فواتير آجلة مستحقة على هذا العميل" };
  }

  if (profile.role === "distributor") {
    const belongsToOther = openSales.some((s) => s.distributor_id !== profile.distributor_id);
    if (belongsToOther) return { ok: false, message: "لا يمكنك تحصيل ديون خارج نطاقك" };
  }

  const totalDebt = openSales.reduce((sum, s) => sum + (s.total_amount - s.paid_amount), 0);
  if (v.amount > totalDebt + 0.0001) {
    return { ok: false, message: `المبلغ المدخل (${v.amount}) أكبر من إجمالي دين العميل (${totalDebt})` };
  }

  let remaining = v.amount;
  const rows: { customer_id: string; sale_id: string; distributor_id: string; amount: number; payment_date: string; method: string; notes: string | null; created_by: string }[] = [];

  for (const sale of openSales) {
    if (remaining <= 0) break;
    const due = sale.total_amount - sale.paid_amount;
    const allocation = Math.min(due, remaining);
    if (allocation <= 0) continue;
    rows.push({
      customer_id: v.customer_id,
      sale_id: sale.id,
      distributor_id: sale.distributor_id,
      amount: allocation,
      payment_date: v.payment_date,
      method: v.method || "نقدي",
      notes: v.notes || null,
      created_by: profile.id,
    });
    remaining -= allocation;
  }

  const { error: insertError } = await supabase.from("payments").insert(rows);
  if (insertError) return { ok: false, message: "تعذر تسجيل التحصيل: " + insertError.message };

  revalidatePath("/collections");
  revalidatePath("/customers");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { ok: true, message: `تم تحصيل ${v.amount} وتوزيعها على ${rows.length} فاتورة` };
}

export async function softDeletePaymentAction(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "admin" && !(profile.role === "distributor" && profile.can_delete_financial)) {
    return { ok: false, message: "لا تملك صلاحية حذف السجلات المالية" };
  }
  const supabase = createClient();
  const { error } = await supabase.from("payments").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "تعذر الحذف: " + error.message };
  revalidatePath("/collections");
  return { ok: true, message: "تم حذف عملية التحصيل" };
}
