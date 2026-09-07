"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Truck, Pencil, Power } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { distributorSchema, type DistributorInput } from "@/lib/validations";
import { createDistributorAction, updateDistributorAction, toggleDistributorActiveAction } from "@/app/actions/distributors";
import { formatDate } from "@/lib/format";
import type { Database } from "@/types/database.types";

type Distributor = Database["public"]["Tables"]["distributors"]["Row"];

export function DistributorsClient({ distributors, isAdmin }: { distributors: Distributor[]; isAdmin: boolean }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DistributorInput>({ resolver: zodResolver(distributorSchema), defaultValues: { is_active: true } });

  function openCreate() {
    setEditing(null);
    reset({ name: "", phone: "", area: "", notes: "", is_active: true });
    setModalOpen(true);
  }

  function openEdit(d: Distributor) {
    setEditing(d);
    reset({ name: d.name, phone: d.phone ?? "", area: d.area ?? "", notes: d.notes ?? "", is_active: d.is_active });
    setModalOpen(true);
  }

  async function onSubmit(values: DistributorInput) {
    const result = editing
      ? await updateDistributorAction(editing.id, values)
      : await createDistributorAction(values);

    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الحفظ");
    setModalOpen(false);
    router.refresh();
  }

  function onToggleActive(d: Distributor) {
    confirm({
      title: d.is_active ? "إيقاف الموزّع" : "تفعيل الموزّع",
      description: d.is_active
        ? `سيتم إيقاف حساب الموزّع "${d.name}" ولن يتمكن من الدخول أو تسجيل عمليات جديدة.`
        : `سيتم إعادة تفعيل الموزّع "${d.name}".`,
      danger: d.is_active,
      onConfirm: async () => {
        const result = await toggleDistributorActiveAction(d.id, !d.is_active);
        if (!result.ok) toast.error(result.message ?? "حدث خطأ");
        else {
          toast.success("تم التحديث");
          router.refresh();
        }
      },
    });
  }

  const columns: Column<Distributor>[] = [
    { header: "الاسم", accessor: (d) => d.name, mobilePrimary: true },
    { header: "الهاتف", accessor: (d) => d.phone || "—" },
    { header: "المنطقة", accessor: (d) => d.area || "—" },
    { header: "الحالة", accessor: (d) => <Badge variant={d.is_active ? "success" : "danger"}>{d.is_active ? "نشط" : "موقوف"}</Badge> },
    { header: "تاريخ الإضافة", accessor: (d) => formatDate(d.created_at) },
    ...(isAdmin
      ? [
          {
            header: "إجراءات",
            accessor: (d: Distributor) => (
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" title="تعديل">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onToggleActive(d)}
                  className={`rounded-lg p-1.5 hover:bg-navy-50 ${d.is_active ? "text-danger" : "text-success"}`}
                  title={d.is_active ? "إيقاف" : "تفعيل"}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="الموزّعون"
        subtitle="إدارة الموزّعين المسؤولين عن عهدة الزيت والمبيعات الميدانية"
        action={
          isAdmin && (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> إضافة موزّع
            </button>
          )
        }
      />

      {distributors.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="لا يوجد موزّعون بعد"
          description="أضف أول موزّع لبدء تسجيل عمليات الاستلام والمبيعات."
          action={
            isAdmin && (
              <button onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> إضافة موزّع
              </button>
            )
          }
        />
      ) : (
        <div className="card p-3 sm:p-4">
          <DataTable columns={columns} rows={distributors} />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "تعديل الموزّع" : "إضافة موزّع جديد"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="اسم الموزّع" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="رقم الهاتف" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" {...register("phone")} />
          </Field>
          <Field label="المنطقة / خط السير" htmlFor="area" error={errors.area?.message}>
            <Input id="area" {...register("area")} />
          </Field>
          <Field label="ملاحظات" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" {...register("notes")} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">
              إلغاء
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? "جارِ الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </Modal>

      {dialog}
    </div>
  );
}
