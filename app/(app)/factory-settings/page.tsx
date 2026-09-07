import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FactorySettingsClient } from "./FactorySettingsClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";

export const metadata = { title: "بيانات المصنع — معامل خيرات اليمن" };

export default async function FactorySettingsPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data: factory } = await supabase.from("factories").select("*").limit(1).single();

  if (!factory) {
    return <EmptyState icon={Settings} title="لم يتم إعداد بيانات المصنع بعد" description="شغّل ملف supabase/seed.sql لإنشاء السجل الأساسي." />;
  }

  return <FactorySettingsClient factory={factory} />;
}
