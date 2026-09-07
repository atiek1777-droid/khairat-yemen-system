"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { settlementCreateSchema, settlementPaymentSchema, type SettlementCreateInput, type SettlementPaymentInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function createSettlementAction(input: SettlementCreateInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = settlementCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const v = parsed.data;

  if (profile.role === "distributor" && v.distributor_id !== profile.distributor_id) {
    return { ok: false, message: "لا يمكنك إنشاء تسوية خارج نطاقك" };
  }
  if (profile.role === "factory_owner") return { ok: false, message: "هذا الحساب للعرض فقط" };

  const supabase = createClient();

  const { data: sales } = await supabase
    .from("sales")
    .select("total_amount, total_cost")
    .eq("distributor_id", v.distributor_id)
    .is("deleted_at", null)
    .gte("sale_date", v.week_start)
    .lte("sale_date", v.week_end);

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("distributor_id", v.distributor_id)
    .is("deleted_at", null)
    .gte("payment_date", v.week_start)
    .lte("payment_date", v.week_end);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("distributor_id", v.distributor_id)
    .is("deleted_at", null)
    .gte("expense_date", v.week_start)
    .lte("expense_date", v.week_end);

  const totalSales = (sales ?? []).reduce((sum, s) => sum + s.total_amount, 0);
  const totalCost = (sales ?? []).reduce((sum, s) => sum + s.total_cost, 0);
  const totalCollected = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

  const { error } = await supabase.from("weekly_settlements").insert({
    distributor_id: v.distributor_id,
    week_start: v.week_start,
    week_end: v.week_end,
    total_sales: totalSales,
    total_cost: totalCost,
    total_collected: totalCollected,
    total_expenses: totalExpenses,
    amount_due_to_factory: totalCost,
    notes: v.notes || null,
    created_by: profile.id,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "توجد تسوية مسجلة مسبقاً لنفس الموزّع ونفس الأسبوع" };
    return { ok: false, message: "تعذر إنشاء التسوية: " + error.message };
  }

  revalidatePath("/settlements");
  return { ok: true, message: "تم إنشاء التسوية الأسبوعية بنجاح" };
}

export async function addSettlementPaymentAction(input: SettlementPaymentInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = settlementPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  if (profile.role === "factory_owner") return { ok: false, message: "هذا الحساب للعرض فقط" };

  const supabase = createClient();
  const { error } = await supabase.from("settlement_payments").insert({
    settlement_id: parsed.data.settlement_id,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    method: parsed.data.method || "نقدي",
    notes: parsed.data.notes || null,
    created_by: profile.id,
  });

  if (error) return { ok: false, message: "تعذر تسجيل الدفعة: " + error.message };
  revalidatePath("/settlements");
  return { ok: true, message: "تم تسجيل الدفعة للمصنع" };
}
