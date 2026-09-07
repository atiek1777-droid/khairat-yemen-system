"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role === "factory_owner") return { ok: false, message: "هذا الحساب للعرض فقط" };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const distributorId = profile.role === "distributor" ? profile.distributor_id : parsed.data.distributor_id || null;

  const supabase = createClient();
  const { error } = await supabase.from("expenses").insert({
    distributor_id: distributorId,
    category: parsed.data.category,
    amount: parsed.data.amount,
    expense_date: parsed.data.expense_date,
    description: parsed.data.description || null,
    created_by: profile.id,
  });

  if (error) return { ok: false, message: "تعذر تسجيل المصروف: " + error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true, message: "تم تسجيل المصروف بنجاح" };
}

export async function softDeleteExpenseAction(id: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("expenses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "تعذر الحذف: " + error.message + " (قد تحتاج صلاحية حذف السجلات المالية)" };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true, message: "تم الحذف" };
}
