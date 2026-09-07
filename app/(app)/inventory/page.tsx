import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InventoryClient } from "./InventoryClient";

export const metadata = { title: "الاستلام والعهدة — معامل خيرات اليمن" };

export default async function InventoryPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const isDistributor = profile.role === "distributor";

  const [{ data: custody }, { data: receipts }, { data: adjustments }, { data: distributors }, { data: product }] = await Promise.all([
    supabase.from("distributor_custody").select("*"),
    supabase.from("inventory_receipts").select("*, distributors(name), products(name)").is("deleted_at", null).order("receipt_date", { ascending: false }).limit(100),
    supabase.from("inventory_adjustments").select("*, distributors(name), products(name)").is("deleted_at", null).order("adjustment_date", { ascending: false }).limit(100),
    isDistributor
      ? supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
      : supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
    supabase.from("products").select("id, name, factory_cost").eq("is_active", true).limit(1).single(),
  ]);

  return (
    <InventoryClient
      custody={(custody ?? []).filter((c) => !isDistributor || c.distributor_id === profile.distributor_id)}
      receipts={(receipts as any) ?? []}
      adjustments={(adjustments as any) ?? []}
      distributors={distributors ?? []}
      product={product}
      profile={profile}
    />
  );
}
