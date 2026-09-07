import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { DistributorsClient } from "./DistributorsClient";

export const metadata = { title: "الموزّعون — معامل خيرات اليمن" };

export default async function DistributorsPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: distributors } = await supabase
    .from("distributors")
    .select("*")
    .order("created_at", { ascending: false });

  return <DistributorsClient distributors={distributors ?? []} isAdmin={profile.role === "admin"} />;
}
