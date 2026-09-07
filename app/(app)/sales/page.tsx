import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SalesClient } from "./SalesClient";

export const metadata = { title: "المبيعات — معامل خيرات اليمن" };

export default async function SalesPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const isDistributor = profile.role === "distributor";

  const [{ data: sales }, { data: distributors }, { data: customers }, { data: product }] = await Promise.all([
    supabase
      .from("sales")
      .select("*, distributors(name), customers(name), sale_items(*, products(name))")
      .is("deleted_at", null)
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    isDistributor
      ? supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
      : supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, name, distributor_id").is("deleted_at", null).order("name"),
    supabase.from("products").select("id, name, factory_cost").eq("is_active", true).limit(1).single(),
  ]);

  return (
    <SalesClient
      sales={(sales as any) ?? []}
      distributors={distributors ?? []}
      customers={customers ?? []}
      product={product}
      profile={profile}
    />
  );
}
