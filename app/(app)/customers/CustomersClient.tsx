"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, UserSquare2, Pencil, Trash2, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import { createCustomerAction, updateCustomerAction, softDeleteCustomerAction } from "@/app/actions/customers";
import { formatMoney, formatDate } from "@/lib/format";
import type { CurrentProfile } from "@/lib/auth";
import type { Database } from "@/types/database.types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Balance = Database["public"]["Views"]["customer_balances"]["Row"];
type DistributorOption = { id: string; name: string };

export function CustomersClient({
  customers,
  balances,
  distributors,
  profile,
}: {
  customers: Customer[];
  balances: Balance[];
  distributors: DistributorOption[];
  profile: CurrentProfile;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const balanceMap = useMemo(() => new Map(balances.map((b) => [b.customer_id, b])), [balances]);
  const canDelete = profile.role === "admin";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { distributor_id: profile.distributor_id ?? undefined },
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", phone: "", address: "", distributor_id: profile.distributor_id ?? undefined, notes: "" });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    reset({ name: c.name, phone: c.phone ?? "", address: c.address ?? "", distributor_id: c.distributor_id, notes: c.notes ?? "" });
    setModalOpen(true);
  }

  async function onSubmit(values: CustomerInput) {
    const result = editing ? await updateCustomerAction(editing.id, values) : await createCustomerAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الحفظ");
    setModalOpen(false);
    router.refresh();
  }

  function onDelete(c: Customer) {
    confirm({
      title: "حذف العميل",
      description: `سيتم حذف "${c.name}" من القائمة. لن يتم حذف فواتيره السابقة.`,
      danger: true,
      onConfirm: async () => {
        const result = await softDeleteCustomerAction(c.id);
        if (!result.ok) toast.error(result.message ?? "حدث خطأ");
        else {
          toast.success("تم الحذف");
          router.refresh();
        }
      },
    });
  }

  const columns: Column<Customer>[] = [
    {
      header: "اسم العميل",
      accessor: (c) => (
        <Link href={`/customers/${c.id}`} className="font-bold text-emerald-700 hover:underline">
          {c.name}
        </Link>
      ),
      mobilePrimary: true,
    },
    { header: "الهاتف", accessor: (c) => c.phone || "—" },
    {
      header: "الدين الحالي",
      accessor: (c) => {
        const debt = balanceMap.get(c.id)?.total_debt ?? 0;
        return debt > 0 ? <span className="font-bold text-danger">{formatMoney(debt)}</span> : <span className="text-success">لا يوجد دين</span>;
      },
    },
    { header: "آخر عملية", accessor: (c) => formatDate(balanceMap.get(c.id)?.last_sale_date) },
    {
      header: "إجراءات",
      accessor: (c) => (
        <div className="flex items-center gap-2">
          <Link href={`/customers/${c.id}`} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" title="كشف الحساب">
            <FileText className="h-4 w-4" />
          </Link>
          <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" title="تعديل">
            <Pencil className="h-4 w-4" />
          </button>
          {canDelete && (
            <button onClick={() => onDelete(c)} className="rounded-lg p-1.5 text-danger hover:bg-navy-50" title="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="العملاء"
        subtitle="إدارة عملاء البيع النقدي والآجل ومتابعة أرصدتهم"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> إضافة عميل
          </button>
        }
      />

      {customers.length === 0 ? (
        <EmptyState icon={UserSquare2} title="لا يوجد عملاء بعد" action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> إضافة عميل</button>} />
      ) : (
        <div className="card p-3 sm:p-4">
          <DataTable columns={columns} rows={customers} />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "تعديل العميل" : "إضافة عميل جديد"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="اسم العميل" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field label="رقم الهاتف" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" {...register("phone")} />
          </Field>
          <Field label="العنوان" htmlFor="address" error={errors.address?.message}>
            <Input id="address" {...register("address")} />
          </Field>
          {profile.role !== "distributor" && (
            <Field label="الموزّع" htmlFor="distributor_id" error={errors.distributor_id?.message} required>
              <Select id="distributor_id" disabled={!!editing} {...register("distributor_id")}>
                <option value="">اختر الموزّع</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="ملاحظات" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" {...register("notes")} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">حفظ</button>
          </div>
        </form>
      </Modal>

      {dialog}
    </div>
  );
}
