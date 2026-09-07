import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DistributorStatementClient } from "./DistributorStatementClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Truck } from "lucide-react";

export const metadata = { title: "كشف حساب موزّع — معامل خيرات اليمن" };

export default async function DistributorReportPage({ searchParams }: { searchParams: { distributor?: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: distributors } = profile.role === "distributor"
    ? await supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
    : await supabase.from("distributors").select("id, name").order("name");
  if (!distributors || distributors.length === 0) {
    return <EmptyState icon={Truck} title="لا يوجد موزّعون بعد" />;
  }

  const distributorId = profile.role === "distributor" ? (profile.distributor_id ?? distributors[0].id) : (searchParams.distributor || distributors[0].id);

  const [{ data: receipts }, { data: sales }, { data: expenses }, { data: settlements }, { data: custody }] = await Promise.all([
    supabase.from("inventory_receipts").select("quantity_containers, unit_cost, receipt_date").eq("distributor_id", distributorId).is("deleted_at", null),
    supabase.from("sales").select("sale_type, total_amount, total_cost, paid_amount, sale_date").eq("distributor_id", distributorId).is("deleted_at", null),
    supabase.from("expenses").select("amount, category, expense_date").eq("distributor_id", distributorId).is("deleted_at", null),
    supabase.from("weekly_settlements").select("*").eq("distributor_id", distributorId).order("week_start", { ascending: false }),
    supabase.from("distributor_custody").select("current_custody").eq("distributor_id", distributorId),
  ]);

  return (
    <DistributorStatementClient
      distributors={distributors}
      distributorId={distributorId}
      receipts={receipts ?? []}
      sales={sales ?? []}
      expenses={expenses ?? []}
      settlements={settlements ?? []}
      totalCustody={(custody ?? []).reduce((s, c) => s + c.current_custody, 0)}
    />
  );
}
