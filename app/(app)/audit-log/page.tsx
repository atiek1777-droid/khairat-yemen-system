import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditLogClient } from "./AuditLogClient";

export const metadata = { title: "سجل العمليات — معامل خيرات اليمن" };

export default async function AuditLogPage() {
  const profile = await requireProfile();
  if (profile.role === "distributor") redirect("/dashboard");

  const supabase = createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name, username)")
    .order("created_at", { ascending: false })
    .limit(300);

  return <AuditLogClient logs={(logs as any) ?? []} />;
}
