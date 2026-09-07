import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MonthlyReportClient } from "./MonthlyReportClient";

export const metadata = { title: "التقرير الشهري — معامل خيرات اليمن" };

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = new Date(y, m, 0); // last day of month
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

export default async function MonthlyReportPage({ searchParams }: { searchParams: { month?: string; distributor?: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();
  const month = searchParams.month || currentMonth();
  const { start, end } = monthRange(month);
  const distributorId = searchParams.distributor || "";
  const isDistributor = profile.role === "distributor";

  let salesQuery = supabase.from("sales").select("*, customers(name)").gte("sale_date", start).lte("sale_date", end).is("deleted_at", null);
  let expensesQuery = supabase.from("expenses").select("amount").gte("expense_date", start).lte("expense_date", end).is("deleted_at", null);
  let custodyQuery = supabase.from("distributor_custody").select("current_custody");

  if (isDistributor) {
    const id = profile.distributor_id ?? "";
    salesQuery = salesQuery.eq("distributor_id", id);
    expensesQuery = expensesQuery.eq("distributor_id", id);
    custodyQuery = custodyQuery.eq("distributor_id", id);
  } else if (distributorId) {
    salesQuery = salesQuery.eq("distributor_id", distributorId);
    expensesQuery = expensesQuery.eq("distributor_id", distributorId);
    custodyQuery = custodyQuery.eq("distributor_id", distributorId);
  }

  const [{ data: sales }, { data: expenses }, { data: custody }, { data: debt }, { data: distributors }] = await Promise.all([
    salesQuery, expensesQuery, custodyQuery,
    supabase.from("customer_balances").select("total_debt, distributor_id"),
    isDistributor
      ? supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
      : supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
  ]);

  const scopedDebt = (debt ?? []).filter((d) => (isDistributor ? d.distributor_id === profile.distributor_id : !distributorId || d.distributor_id === distributorId));

  return (
    <MonthlyReportClient
      month={month} distributorId={distributorId} distributors={distributors ?? []}
      sales={(sales as any) ?? []} expenses={expenses ?? []}
      totalCustody={(custody ?? []).reduce((s, c) => s + c.current_custody, 0)}
      totalDebt={scopedDebt.reduce((s, d) => s + d.total_debt, 0)}
      isDistributor={isDistributor}
    />
  );
}
