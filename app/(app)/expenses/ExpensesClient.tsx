"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import { createExpenseAction, softDeleteExpenseAction } from "@/app/actions/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/calculations";
import { formatMoney, formatDate, todayISO } from "@/lib/format";
import type { CurrentProfile } from "@/lib/auth";
import type { Database } from "@/types/database.types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & { distributors?: { name: string } };
type DistributorOption = { id: string; name: string };

export function ExpensesClient({ expenses, distributors, profile }: { expenses: Expense[]; distributors: DistributorOption[]; profile: CurrentProfile }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const { confirm, dialog } = useConfirmDialog();
  const canWrite = profile.role !== "factory_owner" || profile.can_edit;
  const canDelete = profile.role === "admin" || (profile.role === "distributor" && profile.can_delete_financial);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { distributor_id: profile.distributor_id ?? null, expense_date: todayISO(), category: "مواصلات" },
  });

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return EXPENSE_CATEGORIES.map((cat) => ({ category: cat, total: map.get(cat) ?? 0 }));
  }, [expenses]);

  const cashWithAtiq = byCategory.find((c) => c.category === "نقد مع عتيق")?.total ?? 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  function openCreate() {
    reset({ distributor_id: profile.distributor_id ?? null, category: "مواصلات", expense_date: todayISO() });
    setModalOpen(true);
  }

  async function onSubmit(values: ExpenseInput) {
    const result = await createExpenseAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الحفظ");
    setModalOpen(false);
    router.refresh();
  }

  function onDelete(e: Expense) {
    confirm({
      title: "حذف المصروف",
      description: `سيتم حذف مصروف "${e.category}" بقيمة ${formatMoney(e.amount)}.`,
      danger: true,
      onConfirm: async () => {
        const result = await softDeleteExpenseAction(e.id);
        if (!result.ok) toast.error(result.message ?? "حدث خطأ");
        else {
          toast.success("تم الحذف");
          router.refresh();
        }
      },
    });
  }

  const columns: Column<Expense>[] = [
    { header: "التاريخ", accessor: (e) => formatDate(e.expense_date), mobilePrimary: true },
    { header: "التصنيف", accessor: (e) => <Badge variant={e.category === "نقد مع عتيق" ? "gold" : "navy"}>{e.category}</Badge> },
    { header: "الموزّع", accessor: (e) => e.distributors?.name || "عام" },
    { header: "المبلغ", accessor: (e) => formatMoney(e.amount) },
    { header: "الوصف", accessor: (e) => e.description || "—" },
    ...(canDelete
      ? [{ header: "", accessor: (e: Expense) => (
          <button onClick={() => onDelete(e)} className="rounded-lg p-1.5 text-danger hover:bg-navy-50"><Trash2 className="h-4 w-4" /></button>
        ) }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="المصروفات"
        subtitle="تسجيل ومتابعة المصروفات اليومية بحسب التصنيف"
        action={canWrite && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> إضافة مصروف</button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {byCategory.map((c) => (
          <Card key={c.category} className={c.category === "نقد مع عتيق" ? "border-2 border-gold-400" : ""}>
            <p className="text-xs font-bold text-navy-400">{c.category}</p>
            <p className="mt-2 text-lg font-extrabold text-navy-900">{formatMoney(c.total)}</p>
          </Card>
        ))}
      </div>
      <Card className="bg-navy-900 text-white">
        <p className="text-xs font-bold text-white/60">إجمالي المصروفات (شامل نقد مع عتيق: {formatMoney(cashWithAtiq)})</p>
        <p className="mt-2 text-2xl font-extrabold">{formatMoney(totalExpenses)}</p>
      </Card>

      <Card>
        <CardHeader title="سجل المصروفات" />
        {expenses.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="لا توجد مصروفات مسجلة بعد" />
        ) : (
          <DataTable columns={columns} rows={expenses} />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="إضافة مصروف">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {profile.role !== "distributor" && (
            <Field label="الموزّع (اتركه فارغاً لمصروف عام)" htmlFor="ex_distributor" error={errors.distributor_id?.message}>
              <Select id="ex_distributor" {...register("distributor_id")}>
                <option value="">مصروف عام للمصنع</option>
                {distributors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            </Field>
          )}
          <Field label="التصنيف" htmlFor="ex_category" error={errors.category?.message} required>
            <Select id="ex_category" {...register("category")}>
              {EXPENSE_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </Select>
          </Field>
          <Field label="المبلغ" htmlFor="ex_amount" error={errors.amount?.message} required>
            <Input id="ex_amount" type="number" step="any" {...register("amount")} />
          </Field>
          <Field label="التاريخ" htmlFor="ex_date" error={errors.expense_date?.message} required>
            <Input id="ex_date" type="date" {...register("expense_date")} />
          </Field>
          <Field label="الوصف" htmlFor="ex_desc" error={errors.description?.message}>
            <Textarea id="ex_desc" {...register("description")} />
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
