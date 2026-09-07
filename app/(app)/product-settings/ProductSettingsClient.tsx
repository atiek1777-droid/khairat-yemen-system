"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, History } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { productCostSchema, type ProductCostInput } from "@/lib/validations";
import { updateProductCostAction } from "@/app/actions/settings";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Database } from "@/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type CostHistory = Database["public"]["Tables"]["product_cost_history"]["Row"];

export function ProductSettingsClient({ product, history }: { product: Product; history: CostHistory[] }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductCostInput>({
    resolver: zodResolver(productCostSchema),
    defaultValues: { factory_cost: product.factory_cost },
  });

  async function onSubmit(values: ProductCostInput) {
    const result = await updateProductCostAction(product.id, values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الحفظ");
    router.refresh();
  }

  const columns: Column<CostHistory & { id: string }>[] = [
    { header: "التكلفة السابقة", accessor: (h) => formatMoney(h.old_cost) },
    { header: "التكلفة الجديدة", accessor: (h) => formatMoney(h.new_cost), mobilePrimary: true },
    { header: "التاريخ", accessor: (h) => formatDateTime(h.changed_at) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="المنتج والتكلفة" subtitle="تعديل تكلفة عبوة الزيت من المصنع (5 لتر)" />

      <Card className="max-w-xl">
        <CardHeader title={product.name} subtitle={`حجم العبوة: ${product.container_size_liters} لتر`} />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="تكلفة العبوة من المصنع (ريال يمني)" htmlFor="factory_cost" error={errors.factory_cost?.message} required>
            <Input id="factory_cost" type="number" step="any" {...register("factory_cost")} />
          </Field>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save className="h-4 w-4" /> حفظ التكلفة الجديدة
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader title="سجل تغييرات التكلفة" action={<History className="h-4.5 w-4.5 text-navy-300" />} />
        <DataTable columns={columns} rows={history} emptyMessage="لا توجد تغييرات مسجلة بعد" />
      </Card>
    </div>
  );
}
