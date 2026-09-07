import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ExpensesClient } from "./ExpensesClient";

export const metadata = { title: "المصروفات — معامل خيرات اليمن" };

export default async function ExpensesPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const isDistributor = profile.role === "distributor";

  let query = supabase
    .from("expenses")
    .select("*, distributors(name)")
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .limit(200);

  if (isDistributor) query = query.eq("distributor_id", profile.distributor_id ?? "");

  const { data: expenses } = await query;

  const expensesData = (expenses as any) ?? [];

  const { data: distributors } = isDistributor
    ? await supabase.from("distributors").select("id, name").eq("id", profile.distributor_id ?? "")
    : await supabase.from("distributors").select("id, name").eq("is_active", true).order("name");

  return <ExpensesClient expenses={expensesData} distributors={distributors ?? []} profile={profile} />;
}
