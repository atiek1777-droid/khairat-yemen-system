import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CollectionsClient } from "./CollectionsClient";

export const metadata = { title: "تحصيل الديون — معامل خيرات اليمن" };

export default async function CollectionsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const isDistributor = profile.role === "distributor";

  const [{ data: payments }, { data: customersWithDebt }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, customers(name), sales(invoice_number)")
      .is("deleted_at", null)
      .order("payment_date", { ascending: false })
      .limit(150),
    supabase.from("customer_balances").select("*").gt("total_debt", 0),
  ]);

  const scopedCustomers = (customersWithDebt ?? []).filter((c) => !isDistributor || c.distributor_id === profile.distributor_id);
  const scopedPayments = (payments as any[])?.filter((p: any) => !isDistributor || p.distributor_id === profile.distributor_id) ?? [];

  return <CollectionsClient payments={scopedPayments} customersWithDebt={scopedCustomers} profile={profile} />;
}
