import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CustomersClient } from "./CustomersClient";

export const metadata = { title: "العملاء — معامل خيرات اليمن" };

export default async function CustomersPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ data: customers }, { data: balances }, { data: distributors }] = await Promise.all([
    supabase.from("customers").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("customer_balances").select("*"),
    profile.role === "distributor"
      ? supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
      : supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <CustomersClient
      customers={customers ?? []}
      balances={balances ?? []}
      distributors={distributors ?? []}
      profile={profile}
    />
  );
}
