import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { WeeklyReportClient } from "./WeeklyReportClient";
import { todayISO } from "@/lib/format";

export const metadata = { title: "التقرير الأسبوعي — معامل خيرات اليمن" };

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function WeeklyReportPage({ searchParams }: { searchParams: { start?: string; end?: string; distributor?: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();
  const start = searchParams.start || daysAgoISO(6);
  const end = searchParams.end || todayISO();
  const distributorId = searchParams.distributor || "";
  const isDistributor = profile.role === "distributor";

  let salesQuery = supabase.from("sales").select("*, sale_items(*)").gte("sale_date", start).lte("sale_date", end).is("deleted_at", null);
  let paymentsQuery = supabase.from("payments").select("amount").gte("payment_date", start).lte("payment_date", end).is("deleted_at", null);
  let expensesQuery = supabase.from("expenses").select("category, amount").gte("expense_date", start).lte("expense_date", end).is("deleted_at", null);
  let receiptsQuery = supabase.from("inventory_receipts").select("quantity_containers").gte("receipt_date", start).lte("receipt_date", end).is("deleted_at", null);
  let custodyQuery = supabase.from("distributor_custody").select("current_custody");
  let settlementsQuery = supabase.from("weekly_settlements").select("*").gte("week_start", start).lte("week_end", end);

  if (isDistributor) {
    const id = profile.distributor_id ?? "";
    salesQuery = salesQuery.eq("distributor_id", id);
    paymentsQuery = paymentsQuery.eq("distributor_id", id);
    expensesQuery = expensesQuery.eq("distributor_id", id);
    receiptsQuery = receiptsQuery.eq("distributor_id", id);
    custodyQuery = custodyQuery.eq("distributor_id", id);
    settlementsQuery = settlementsQuery.eq("distributor_id", id);
  } else if (distributorId) {
    salesQuery = salesQuery.eq("distributor_id", distributorId);
    paymentsQuery = paymentsQuery.eq("distributor_id", distributorId);
    expensesQuery = expensesQuery.eq("distributor_id", distributorId);
    receiptsQuery = receiptsQuery.eq("distributor_id", distributorId);
    custodyQuery = custodyQuery.eq("distributor_id", distributorId);
    settlementsQuery = settlementsQuery.eq("distributor_id", distributorId);
  }

  const [{ data: sales }, { data: payments }, { data: expenses }, { data: receipts }, { data: custody }, { data: settlements }, { data: debt }, { data: distributors }] = await Promise.all([
    salesQuery, paymentsQuery, expensesQuery, receiptsQuery, custodyQuery, settlementsQuery,
    supabase.from("customer_balances").select("total_debt, distributor_id"),
    isDistributor
      ? supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
      : supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
  ]);

  const scopedDebt = (debt ?? []).filter((d) => (isDistributor ? d.distributor_id === profile.distributor_id : !distributorId || d.distributor_id === distributorId));

  return (
    <WeeklyReportClient
      start={start} end={end} distributorId={distributorId} distributors={distributors ?? []}
      sales={sales ?? []} payments={payments ?? []} expenses={expenses ?? []} receipts={receipts ?? []}
      totalCustody={(custody ?? []).reduce((s, c) => s + c.current_custody, 0)}
      totalDebt={scopedDebt.reduce((s, d) => s + d.total_debt, 0)}
      settlements={settlements ?? []}
      isDistributor={isDistributor}
    />
  );
}
