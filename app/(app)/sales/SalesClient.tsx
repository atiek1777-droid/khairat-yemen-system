"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ShoppingCart, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PaymentStatusBadge, Badge } from "@/components/ui/Badge";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { saleSchema, type SaleInput } from "@/lib/validations";
import { createSaleAction, updateSaleDetailsAction, softDeleteSaleAction } from "@/app/actions/sales";
import { formatMoney, formatDate, saleTypeLabel, todayISO } from "@/lib/format";
import type { CurrentProfile } from "@/lib/auth";

type Sale = {
  id: string;
  invoice_number: string;
  distributor_id: string;
  customer_id: string | null;
  customer_name_cash: string | null;
  sale_type: "cash" | "credit";
  total_amount: number;
  paid_amount: number;
  payment_status: "paid" | "partial" | "unpaid";
  sale_date: string;
  due_date: string | null;
  notes: string | null;
  distributors?: { name: string };
  customers?: { name: string };
  sale_items?: { id: string; quantity_containers: number; unit_price: number; products?: { name: string } }[];
};
type DistributorOption = { id: string; name: string };
type CustomerOption = { id: string; name: string; distributor_id: string };
type ProductOption = { id: string; name: string; factory_cost: number } | null;

export function SalesClient({
  sales,
  distributors,
  customers,
  product,
  profile,
}: {
  sales: Sale[];
  distributors: DistributorOption[];
  customers: CustomerOption[];
  product: ProductOption;
  profile: CurrentProfile;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { confirm, dialog } = useConfirmDialog();
  const canWrite = profile.role !== "factory_owner" || profile.can_edit;
  const canDelete = profile.role === "admin" || (profile.role === "distributor" && profile.can_delete_financial);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleInput>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      distributor_id: profile.distributor_id ?? undefined,
      sale_type: "cash",
      product_id: product?.id,
      sale_date: todayISO(),
      paid_amount: 0,
    },
  });

  const selectedDistributor = watch("distributor_id");
  const selectedSaleType = watch("sale_type");
  const filteredCustomers = useMemo(
    () => customers.filter((c) => !selectedDistributor || c.distributor_id === selectedDistributor),
    [customers, selectedDistributor]
  );

  const filteredSales = useMemo(
    () => (statusFilter === "all" ? sales : sales.filter((s) => s.payment_status === statusFilter)),
    [sales, statusFilter]
  );

  function openCreate() {
    setEditing(null);
    reset({
      distributor_id: profile.distributor_id ?? undefined,
      sale_type: "cash",
      product_id: product?.id,
      sale_date: todayISO(),
      paid_amount: 0,
      quantity_containers: 1,
      unit_price: product?.factory_cost,
    });
    setModalOpen(true);
  }

  async function onSubmitCreate(values: SaleInput) {
    const result = await createSaleAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم إنشاء الفاتورة");
    setModalOpen(false);
    router.refresh();
  }

  function onEditSimple(s: Sale) {
    const item = s.sale_items?.[0];
    if (!item) return;
    const newQty = prompt("عدد العبوات:", String(item.quantity_containers));
    if (newQty === null) return;
    const newPrice = prompt("سعر البيع للعبوة:", String(item.unit_price));
    if (newPrice === null) return;

    updateSaleDetailsAction(s.id, item.id, {
      quantity_containers: Number(newQty),
      unit_price: Number(newPrice),
      sale_date: s.sale_date,
      due_date: s.due_date ?? undefined,
      notes: s.notes ?? undefined,
    }).then((result) => {
      if (!result.ok) toast.error(result.message ?? "حدث خطأ");
      else {
        toast.success("تم التحديث");
        router.refresh();
      }
    });
  }

  function onDelete(s: Sale) {
    confirm({
      title: "حذف الفاتورة",
      description: `سيتم حذف الفاتورة ${s.invoice_number} نهائياً من التقارير.`,
      danger: true,
      onConfirm: async () => {
        const result = await softDeleteSaleAction(s.id);
        if (!result.ok) toast.error(result.message ?? "حدث خطأ");
        else {
          toast.success("تم الحذف");
          router.refresh();
        }
      },
    });
  }

  const columns: Column<Sale>[] = [
    { header: "الفاتورة", accessor: (s) => s.invoice_number, mobilePrimary: true },
    { header: "التاريخ", accessor: (s) => formatDate(s.sale_date) },
    { header: "الموزّع", accessor: (s) => s.distributors?.name || "—" },
    { header: "العميل", accessor: (s) => s.customers?.name || s.customer_name_cash || "عميل نقدي" },
    { header: "النوع", accessor: (s) => <Badge variant={s.sale_type === "cash" ? "emerald" : "gold"}>{saleTypeLabel(s.sale_type)}</Badge> },
    { header: "الإجمالي", accessor: (s) => formatMoney(s.total_amount) },
    { header: "الحالة", accessor: (s) => <PaymentStatusBadge status={s.payment_status} /> },
    {
      header: "إجراءات",
      accessor: (s) => (
        <div className="flex items-center gap-2">
          {canWrite && (
            <button onClick={() => onEditSimple(s)} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" title="تعديل الكمية/السعر">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(s)} className="rounded-lg p-1.5 text-danger hover:bg-navy-50" title="حذف">
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
        title="المبيعات"
        subtitle="تسجيل فواتير البيع النقدي والآجل"
        action={
          canWrite && (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> فاتورة جديدة
            </button>
          )
        }
      />

      <div className="no-print mb-4 flex gap-1 overflow-x-auto rounded-xl bg-navy-50 p-1">
        {[
          { key: "all", label: "الكل" },
          { key: "unpaid", label: "غير مسدد" },
          { key: "partial", label: "جزئي" },
          { key: "paid", label: "مسدد" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${statusFilter === f.key ? "bg-white text-emerald-700 shadow-sm" : "text-navy-500"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredSales.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="لا توجد فواتير بعد" action={canWrite && <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> فاتورة جديدة</button>} />
      ) : (
        <Card className="p-3 sm:p-4">
          <DataTable columns={columns} rows={filteredSales} />
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="فاتورة بيع جديدة">
        <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4" noValidate>
          {profile.role !== "distributor" && (
            <Field label="الموزّع" htmlFor="s_distributor" error={errors.distributor_id?.message} required>
              <Select id="s_distributor" {...register("distributor_id")}>
                <option value="">اختر الموزّع</option>
                {distributors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            </Field>
          )}
          <Field label="نوع البيع" htmlFor="s_type" error={errors.sale_type?.message} required>
            <Select id="s_type" {...register("sale_type")}>
              <option value="cash">نقدي</option>
              <option value="credit">آجل</option>
            </Select>
          </Field>

          {selectedSaleType === "credit" ? (
            <Field label="العميل" htmlFor="s_customer" error={errors.customer_id?.message} required>
              <Select id="s_customer" {...register("customer_id")}>
                <option value="">اختر العميل</option>
                {filteredCustomers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </Field>
          ) : (
            <Field label="اسم العميل (اختياري لبيع نقدي)" htmlFor="s_customer_name" error={errors.customer_name_cash?.message}>
              <Input id="s_customer_name" placeholder="عميل نقدي" {...register("customer_name_cash")} />
            </Field>
          )}

          <input type="hidden" {...register("product_id")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="عدد العبوات" htmlFor="s_qty" error={errors.quantity_containers?.message} required>
              <Input id="s_qty" type="number" min={1} {...register("quantity_containers")} />
            </Field>
            <Field label="سعر البيع للعبوة" htmlFor="s_price" error={errors.unit_price?.message} required>
              <Input id="s_price" type="number" step="any" {...register("unit_price")} />
            </Field>
          </div>
          <Field label="تاريخ البيع" htmlFor="s_date" error={errors.sale_date?.message} required>
            <Input id="s_date" type="date" {...register("sale_date")} />
          </Field>
          {selectedSaleType === "credit" && (
            <>
              <Field label="تاريخ الاستحقاق" htmlFor="s_due" error={errors.due_date?.message}>
                <Input id="s_due" type="date" {...register("due_date")} />
              </Field>
              <Field label="دفعة عند البيع (اختياري)" htmlFor="s_paid" error={errors.paid_amount?.message}>
                <Input id="s_paid" type="number" step="any" {...register("paid_amount")} />
              </Field>
            </>
          )}
          <Field label="ملاحظات" htmlFor="s_notes" error={errors.notes?.message}>
            <Textarea id="s_notes" {...register("notes")} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">حفظ الفاتورة</button>
          </div>
        </form>
      </Modal>

      {dialog}
    </div>
  );
}
