import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";

export const metadata = { title: "المستخدمون — معامل خيرات اليمن" };

export default async function UsersPage() {
  const profile = await requireAdmin();
  const supabase = createClient();

  const [{ data: users }, { data: distributors }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("distributors").select("id, name").eq("is_active", true).order("name"),
  ]);

  return <UsersClient users={users ?? []} distributors={distributors ?? []} currentUserId={profile.id} />;
}
