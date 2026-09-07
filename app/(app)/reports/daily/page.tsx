import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DailyReportClient } from "./DailyReportClient";
import { todayISO } from "@/lib/format";

export const metadata = { title: "التقرير اليومي — معامل خيرات اليمن" };

export default async function DailyReportPage({ searchParams }: { searchParams: { date?: string; distributor?: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();
  const date = searchParams.date || todayISO();
  const distributorId = searchParams.distributor || "";

  const isDistributor = profile.role === "distributor";

  let salesQuery = supabase.from("sales").select("*, sale_items(*)").eq("sale_date", date).is("deleted_at", null);
  let paymentsQuery = supabase.from("payments").select("amount").eq("payment_date", date).is("deleted_at", null);
  let expensesQuery = supabase.from("expenses").select("category, amount").eq("expense_date", date).is("deleted_at", null);
  let receiptsQuery = supabase.from("inventory_receipts").select("quantity_containers").eq("receipt_date", date).is("deleted_at", null);
  let custodyQuery = supabase.from("distributor_custody").select("current_custody");

  if (isDistributor) {
    salesQuery = salesQuery.eq("distributor_id", profile.distributor_id ?? "");
    paymentsQuery = paymentsQuery.eq("distributor_id", profile.distributor_id ?? "");
    expensesQuery = expensesQuery.eq("distributor_id", profile.distributor_id ?? "");
    receiptsQuery = receiptsQuery.eq("distributor_id", profile.distributor_id ?? "");
    custodyQuery = custodyQuery.eq("distributor_id", profile.distributor_id ?? "");
  } else if (distributorId) {
    salesQuery = salesQuery.eq("distributor_id", distributorId);
    paymentsQuery = paymentsQuery.eq("distributor_id", distributorId);
    expensesQuery = expensesQuery.eq("distributor_id", distributorId);
    receiptsQuery = receiptsQuery.eq("distributor_id", distributorId);
    custodyQuery = custodyQuery.eq("distributor_id", distributorId);
  }

  const [{ data: sales }, { data: payments }, { data: expenses }, { data: receipts }, { data: custody }, { data: distributors }] = await Promise.all([
    salesQuery,
    paymentsQuery,
    expensesQuery,
    receiptsQuery,
    custodyQuery,
    isDistributor
      ? supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
      : supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <DailyReportClient
      date={date}
      distributorId={distributorId}
      distributors={distributors ?? []}
      sales={sales ?? []}
      payments={payments ?? []}
      expenses={expenses ?? []}
      receipts={receipts ?? []}
      totalCustody={(custody ?? []).reduce((s, c) => s + c.current_custody, 0)}
      isDistributor={isDistributor}
    />
  );
}
