import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CustomerStatementClient } from "./CustomerStatementClient";

export const metadata = { title: "كشف حساب عميل — معامل خيرات اليمن" };

export default async function CustomerStatementPage({ params }: { params: { id: string } }) {
  await requireProfile();
  const supabase = createClient();

  const { data: customer } = await supabase.from("customers").select("*, distributors(name)").eq("id", params.id).single();
  if (!customer) notFound();

  const { data: sales } = await supabase
    .from("sales")
    .select("*, sale_items(*, products(name))")
    .eq("customer_id", params.id)
    .is("deleted_at", null)
    .order("sale_date", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("*, sales(invoice_number)")
    .eq("customer_id", params.id)
    .is("deleted_at", null)
    .order("payment_date", { ascending: true });

  return <CustomerStatementClient customer={customer as any} sales={(sales as any) ?? []} payments={(payments as any) ?? []} />;
}
