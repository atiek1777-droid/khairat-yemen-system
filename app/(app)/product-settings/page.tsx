import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductSettingsClient } from "./ProductSettingsClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package } from "lucide-react";

export const metadata = { title: "المنتج والتكلفة — معامل خيرات اليمن" };

export default async function ProductSettingsPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data: product } = await supabase.from("products").select("*").eq("is_active", true).limit(1).single();
  const { data: history } = await supabase
    .from("product_cost_history")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(20);

  if (!product) {
    return <EmptyState icon={Package} title="لا يوجد منتج بعد" description="شغّل ملف supabase/seed.sql لإنشاء المنتج الأساسي." />;
  }

  return <ProductSettingsClient product={product} history={history ?? []} />;
}
