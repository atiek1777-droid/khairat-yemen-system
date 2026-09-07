"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { factorySettingsSchema, type FactorySettingsInput } from "@/lib/validations";
import { updateFactorySettingsAction } from "@/app/actions/settings";
import type { Database } from "@/types/database.types";

type Factory = Database["public"]["Tables"]["factories"]["Row"];

export function FactorySettingsClient({ factory }: { factory: Factory }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FactorySettingsInput>({
    resolver: zodResolver(factorySettingsSchema),
    defaultValues: {
      name_ar: factory.name_ar,
      address: factory.address,
      phone_primary: factory.phone_primary,
      phone_secondary: factory.phone_secondary ?? "",
      currency: factory.currency,
    },
  });

  async function onSubmit(values: FactorySettingsInput) {
    const result = await updateFactorySettingsAction(factory.id, values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الحفظ");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="بيانات المصنع" subtitle="هذه البيانات تظهر في الفواتير والتقارير المطبوعة" />
      <Card className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="اسم المصنع" htmlFor="name_ar" error={errors.name_ar?.message} required>
            <Input id="name_ar" {...register("name_ar")} />
          </Field>
          <Field label="العنوان" htmlFor="address" error={errors.address?.message} required>
            <Input id="address" {...register("address")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="هاتف رئيسي" htmlFor="phone_primary" error={errors.phone_primary?.message} required>
              <Input id="phone_primary" {...register("phone_primary")} />
            </Field>
            <Field label="هاتف إضافي" htmlFor="phone_secondary" error={errors.phone_secondary?.message}>
              <Input id="phone_secondary" {...register("phone_secondary")} />
            </Field>
          </div>
          <Field label="العملة" htmlFor="currency" error={errors.currency?.message} required>
            <Input id="currency" {...register("currency")} />
          </Field>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save className="h-4 w-4" /> حفظ التغييرات
          </button>
        </form>
      </Card>
    </div>
  );
}
