import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettlementsClient } from "./SettlementsClient";

export const metadata = { title: "التسوية الأسبوعية — معامل خيرات اليمن" };

export default async function SettlementsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const isDistributor = profile.role === "distributor";

  let settlementsQuery = supabase
    .from("weekly_settlements")
    .select("*, distributors(name), settlement_payments(*)")
    .order("week_start", { ascending: false })
    .limit(100);
  if (isDistributor) settlementsQuery = settlementsQuery.eq("distributor_id", profile.distributor_id ?? "");

  const [{ data: settlements }, { data: distributors }] = await Promise.all([
    settlementsQuery,
    isDistributor
      ? supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
      : supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
  ]);

  return <SettlementsClient settlements={(settlements as any) ?? []} distributors={distributors ?? []} profile={profile} />;
}
