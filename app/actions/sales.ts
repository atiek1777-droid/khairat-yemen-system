"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { saleSchema, type SaleInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/auth";

export async function createSaleAction(input: SaleInput): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const v = parsed.data;

  if (profile.role === "distributor" && v.distributor_id !== profile.distributor_id) {
    return { ok: false, message: "لا يمكنك تسجيل بيع خارج نطاقك" };
  }
  if (profile.role === "factory_owner") return { ok: false, message: "هذا الحساب للعرض فقط" };
  if (v.paid_amount > v.quantity_containers * v.unit_price) {
    return { ok: false, message: "المبلغ المدفوع أكبر من إجمالي الفاتورة" };
  }

  const supabase = createClient();

  const { data: product } = await supabase.from("products").select("factory_cost").eq("id", v.product_id).single();
  if (!product) return { ok: false, message: "المنتج غير موجود" };

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      distributor_id: v.distributor_id,
      customer_id: v.sale_type === "credit" ? v.customer_id : v.customer_id || null,
      customer_name_cash: v.sale_type === "cash" && !v.customer_id ? v.customer_name_cash || null : null,
      sale_type: v.sale_type,
      due_date: v.sale_type === "credit" ? v.due_date || null : null,
      sale_date: v.sale_date,
      notes: v.notes || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (saleError || !sale) return { ok: false, message: "تعذر إنشاء الفاتورة: " + saleError?.message };

  const { error: itemError } = await supabase.from("sale_items").insert({
    sale_id: sale.id,
    product_id: v.product_id,
    quantity_containers: v.quantity_containers,
    unit_price: v.unit_price,
    unit_cost: product.factory_cost,
  });

  if (itemError) return { ok: false, message: "تعذر حفظ تفاصيل الفاتورة: " + itemError.message };

  const totalAmount = v.quantity_containers * v.unit_price;

  if (v.sale_type === "cash") {
    await supabase.from("sales").update({ paid_amount: totalAmount, payment_status: "paid" }).eq("id", sale.id);
  } else if (v.paid_amount > 0 && v.customer_id) {
    const { error: paymentError } = await supabase.from("payments").insert({
      customer_id: v.customer_id,
      sale_id: sale.id,
      distributor_id: v.distributor_id,
      amount: v.paid_amount,
      payment_date: v.sale_date,
      method: "نقدي",
      notes: "دفعة عند البيع",
      created_by: profile.id,
    });
    if (paymentError) return { ok: false, message: "تم إنشاء الفاتورة لكن تعذر تسجيل الدفعة: " + paymentError.message };
  }

  revalidatePath("/sales");
  revalidatePath("/customers");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true, message: "تم إنشاء الفاتورة بنجاح" };
}

export async function updateSaleDetailsAction(
  saleId: string,
  itemId: string,
  values: { quantity_containers: number; unit_price: number; sale_date: string; due_date?: string; notes?: string }
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role === "factory_owner" && !profile.can_edit) return { ok: false, message: "ليس لديك صلاحية التعديل" };

  const supabase = createClient();

  const { error: itemError } = await supabase
    .from("sale_items")
    .update({ quantity_containers: values.quantity_containers, unit_price: values.unit_price })
    .eq("id", itemId);
  if (itemError) return { ok: false, message: "تعذر تحديث الفاتورة: " + itemError.message };

  const { data: sale } = await supabase.from("sales").select("sale_type, paid_amount, total_amount").eq("id", saleId).single();

  const updatePayload: Record<string, unknown> = {
    sale_date: values.sale_date,
    due_date: values.due_date || null,
    notes: values.notes || null,
  };
  if (sale?.sale_type === "cash") {
    updatePayload.paid_amount = values.quantity_containers * values.unit_price;
    updatePayload.payment_status = "paid";
  }

  const { error: saleError } = await supabase.from("sales").update(updatePayload).eq("id", saleId);
  if (saleError) return { ok: false, message: "تعذر تحديث الفاتورة: " + saleError.message };

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { ok: true, message: "تم تحديث الفاتورة" };
}

export async function softDeleteSaleAction(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from("sales").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "تعذر حذف الفاتورة: " + error.message + " (قد تحتاج صلاحية حذف السجلات المالية)" };
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { ok: true, message: "تم حذف الفاتورة" };
}
