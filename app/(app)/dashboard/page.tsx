import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import { todayISO } from "@/lib/format";

export const metadata = { title: "لوحة التحكم — معامل خيرات اليمن" };

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const today = todayISO();
  const rangeStart = daysAgoISO(13); // last 14 days including today

  const [
    { data: todaySales },
    { data: rangeSales },
    { data: rangePayments },
    { data: rangeExpenses },
    { data: custody },
    { data: debt },
    { data: settlements },
  ] = await Promise.all([
    supabase.from("sales").select("sale_type, total_amount, total_cost").eq("sale_date", today).is("deleted_at", null),
    supabase.from("sales").select("sale_date, sale_type, total_amount, total_cost").gte("sale_date", rangeStart).lte("sale_date", today).is("deleted_at", null),
    supabase.from("payments").select("payment_date, amount").gte("payment_date", rangeStart).lte("payment_date", today).is("deleted_at", null),
    supabase.from("expenses").select("expense_date, category, amount").gte("expense_date", rangeStart).lte("expense_date", today).is("deleted_at", null),
    supabase.from("distributor_custody").select("current_custody"),
    supabase.from("customer_balances").select("total_debt"),
    supabase.from("weekly_settlements").select("amount_due_to_factory, amount_paid_to_factory").eq("status", "open"),
  ]);

  return (
    <DashboardClient
      profile={profile}
      todaySales={todaySales ?? []}
      rangeSales={rangeSales ?? []}
      rangePayments={rangePayments ?? []}
      rangeExpenses={rangeExpenses ?? []}
      totalCustody={(custody ?? []).reduce((sum, c) => sum + c.current_custody, 0)}
      totalDebt={(debt ?? []).reduce((sum, d) => sum + d.total_debt, 0)}
      amountDueToFactory={(settlements ?? []).reduce((sum, s) => sum + (s.amount_due_to_factory - s.amount_paid_to_factory), 0)}
    />
  );
}
