import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FactoryStatementClient } from "./FactoryStatementClient";

export const metadata = { title: "كشف حساب المصنع — معامل خيرات اليمن" };

export default async function FactoryReportPage() {
  const profile = await requireProfile();
  if (profile.role === "distributor") redirect("/dashboard");

  const supabase = createClient();

  const [{ data: distributors }, { data: sales }, { data: payments }, { data: expenses }, { data: custody }, { data: debt }, { data: settlements }] = await Promise.all([
    supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
    supabase.from("sales").select("distributor_id, sale_type, total_amount, total_cost").is("deleted_at", null),
    supabase.from("payments").select("distributor_id, amount").is("deleted_at", null),
    supabase.from("expenses").select("distributor_id, amount").is("deleted_at", null),
    supabase.from("distributor_custody").select("distributor_id, current_custody"),
    supabase.from("customer_balances").select("distributor_id, total_debt"),
    supabase.from("weekly_settlements").select("distributor_id, amount_due_to_factory, amount_paid_to_factory, status"),
  ]);

  return (
    <FactoryStatementClient
      distributors={distributors ?? []}
      sales={sales ?? []}
      payments={payments ?? []}
      expenses={expenses ?? []}
      custody={custody ?? []}
      debt={debt ?? []}
      settlements={settlements ?? []}
    />
  );
}
