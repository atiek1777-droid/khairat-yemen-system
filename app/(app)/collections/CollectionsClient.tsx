"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { paymentSchema, type PaymentInput } from "@/lib/validations";
import { collectPaymentAction, softDeletePaymentAction } from "@/app/actions/payments";
import { formatMoney, formatDate, todayISO } from "@/lib/format";
import type { CurrentProfile } from "@/lib/auth";
import type { Database } from "@/types/database.types";

type Balance = Database["public"]["Views"]["customer_balances"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"] & { customers?: { name: string }; sales?: { invoice_number: string } };

export function CollectionsClient({
  payments,
  customersWithDebt,
  profile,
}: {
  payments: Payment[];
  customersWithDebt: Balance[];
  profile: CurrentProfile;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [preselected, setPreselected] = useState<Balance | null>(null);
  const { confirm, dialog } = useConfirmDialog();
  const canDelete = profile.role === "admin" || (profile.role === "distributor" && profile.can_delete_financial);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({ resolver: zodResolver(paymentSchema), defaultValues: { payment_date: todayISO(), method: "نقدي" } });

  function openCollect(c?: Balance) {
    setPreselected(c ?? null);
    reset({ customer_id: c?.customer_id ?? undefined, amount: c?.total_debt, payment_date: todayISO(), method: "نقدي", notes: "" });
    setModalOpen(true);
  }

  async function onSubmit(values: PaymentInput) {
    const result = await collectPaymentAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم التحصيل");
    setModalOpen(false);
    router.refresh();
  }

  function onDelete(p: Payment) {
    confirm({
      title: "حذف عملية التحصيل",
      description: `سيتم حذف تحصيل ${formatMoney(p.amount)} من فاتورة ${p.sales?.invoice_number ?? ""} وإعادة المبلغ إلى دين العميل.`,
      danger: true,
      onConfirm: async () => {
        const result = await softDeletePaymentAction(p.id);
        if (!result.ok) toast.error(result.message ?? "حدث خطأ");
        else {
          toast.success("تم الحذف");
          router.refresh();
        }
      },
    });
  }

  const debtColumns: Column<Balance>[] = [
    { header: "العميل", accessor: (c) => c.customer_name, mobilePrimary: true },
    { header: "الدين المستحق", accessor: (c) => <span className="font-bold text-danger">{formatMoney(c.total_debt)}</span> },
    { header: "آخر عملية", accessor: (c) => formatDate(c.last_sale_date) },
    {
      header: "",
      accessor: (c) => (
        <button onClick={() => openCollect(c)} className="btn-gold !px-3 !py-1.5 text-xs">
          <HandCoins className="h-3.5 w-3.5" /> تحصيل
        </button>
      ),
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    { header: "التاريخ", accessor: (p) => formatDate(p.payment_date), mobilePrimary: true },
    { header: "العميل", accessor: (p) => p.customers?.name || "—" },
    { header: "الفاتورة", accessor: (p) => p.sales?.invoice_number || "—" },
    { header: "المبلغ", accessor: (p) => formatMoney(p.amount) },
    { header: "الطريقة", accessor: (p) => p.method },
    ...(canDelete
      ? [{ header: "", accessor: (p: Payment) => (
          <button onClick={() => onDelete(p)} className="rounded-lg p-1.5 text-danger hover:bg-navy-50"><Trash2 className="h-4 w-4" /></button>
        ) }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="تحصيل الديون"
        subtitle="سداد الديون يُوزَّع تلقائياً على أقدم الفواتير المستحقة أولاً"
        action={
          <button onClick={() => openCollect()} className="btn-primary">
            <HandCoins className="h-4 w-4" /> تسجيل تحصيل
          </button>
        }
      />

      <Card>
        <CardHeader title="العملاء المدينون حالياً" />
        {customersWithDebt.length === 0 ? (
          <EmptyState icon={HandCoins} title="لا توجد ديون مستحقة حالياً" />
        ) : (
          <DataTable columns={debtColumns} rows={customersWithDebt.map((c) => ({ ...c, id: c.customer_id }))} />
        )}
      </Card>

      <Card>
        <CardHeader title="سجل التحصيلات الأخيرة" />
        <DataTable columns={paymentColumns} rows={payments} emptyMessage="لا توجد عمليات تحصيل بعد" />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="تسجيل تحصيل دين">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="العميل" htmlFor="p_customer" error={errors.customer_id?.message} required>
            <Select id="p_customer" disabled={!!preselected} {...register("customer_id")}>
              <option value="">اختر العميل</option>
              {customersWithDebt.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.customer_name} — دين {formatMoney(c.total_debt)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="المبلغ المُحصَّل" htmlFor="p_amount" error={errors.amount?.message} required>
            <Input id="p_amount" type="number" step="any" {...register("amount")} />
          </Field>
          <Field label="تاريخ التحصيل" htmlFor="p_date" error={errors.payment_date?.message} required>
            <Input id="p_date" type="date" {...register("payment_date")} />
          </Field>
          <Field label="طريقة الدفع" htmlFor="p_method" error={errors.method?.message}>
            <Input id="p_method" {...register("method")} />
          </Field>
          <Field label="ملاحظات" htmlFor="p_notes" error={errors.notes?.message}>
            <Textarea id="p_notes" {...register("notes")} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">تسجيل التحصيل</button>
          </div>
        </form>
      </Modal>

      {dialog}
    </div>
  );
}
