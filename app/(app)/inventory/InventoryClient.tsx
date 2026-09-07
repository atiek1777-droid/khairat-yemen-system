"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Package, Boxes, Trash2, AlertTriangle } from "lucide-react";
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
import { receiptSchema, adjustmentSchema, type ReceiptInput, type AdjustmentInput } from "@/lib/validations";
import { createReceiptAction, createAdjustmentAction, softDeleteReceiptAction } from "@/app/actions/inventory";
import { formatDate, formatMoney, formatNumber, adjustmentTypeLabel, todayISO } from "@/lib/format";
import type { CurrentProfile } from "@/lib/auth";
import type { Database } from "@/types/database.types";

type Custody = Database["public"]["Views"]["distributor_custody"]["Row"];
type Receipt = Database["public"]["Tables"]["inventory_receipts"]["Row"] & { distributors?: { name: string }; products?: { name: string } };
type Adjustment = Database["public"]["Tables"]["inventory_adjustments"]["Row"] & { distributors?: { name: string }; products?: { name: string } };
type DistributorOption = { id: string; name: string };
type ProductOption = { id: string; name: string; factory_cost: number } | null;

export function InventoryClient({
  custody,
  receipts,
  adjustments,
  distributors,
  product,
  profile,
}: {
  custody: Custody[];
  receipts: Receipt[];
  adjustments: Adjustment[];
  distributors: DistributorOption[];
  product: ProductOption;
  profile: CurrentProfile;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"custody" | "receipts" | "adjustments">("custody");
  const [receiptModal, setReceiptModal] = useState(false);
  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const { confirm, dialog } = useConfirmDialog();
  const canWrite = profile.role !== "factory_owner" || profile.can_edit;
  const canDelete = profile.role === "admin" || (profile.role === "distributor" && profile.can_delete_financial);

  const receiptForm = useForm<ReceiptInput>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      distributor_id: profile.distributor_id ?? undefined,
      product_id: product?.id,
      unit_cost: product?.factory_cost,
      receipt_date: todayISO(),
    },
  });
  const adjustmentForm = useForm<AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      distributor_id: profile.distributor_id ?? undefined,
      product_id: product?.id,
      adjustment_type: "damaged",
      adjustment_date: todayISO(),
    },
  });

  async function onSubmitReceipt(values: ReceiptInput) {
    const result = await createReceiptAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الحفظ");
    setReceiptModal(false);
    router.refresh();
  }

  async function onSubmitAdjustment(values: AdjustmentInput) {
    const result = await createAdjustmentAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الحفظ");
    setAdjustmentModal(false);
    router.refresh();
  }

  function onDeleteReceipt(r: Receipt) {
    confirm({
      title: "حذف سجل الاستلام",
      description: `سيتم حذف استلام ${r.quantity_containers} عبوة بتاريخ ${formatDate(r.receipt_date)}.`,
      danger: true,
      onConfirm: async () => {
        const result = await softDeleteReceiptAction(r.id);
        if (!result.ok) toast.error(result.message ?? "حدث خطأ");
        else {
          toast.success("تم الحذف");
          router.refresh();
        }
      },
    });
  }

  const receiptColumns: Column<Receipt>[] = [
    { header: "التاريخ", accessor: (r) => formatDate(r.receipt_date), mobilePrimary: true },
    { header: "الموزّع", accessor: (r) => r.distributors?.name || "—" },
    { header: "العدد", accessor: (r) => formatNumber(r.quantity_containers) + " عبوة" },
    { header: "تكلفة العبوة", accessor: (r) => formatMoney(r.unit_cost) },
    { header: "الإجمالي", accessor: (r) => formatMoney(r.quantity_containers * r.unit_cost) },
    ...(canDelete
      ? [
          {
            header: "",
            accessor: (r: Receipt) => (
              <button onClick={() => onDeleteReceipt(r)} className="rounded-lg p-1.5 text-danger hover:bg-navy-50">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  const adjustmentColumns: Column<Adjustment>[] = [
    { header: "التاريخ", accessor: (a) => formatDate(a.adjustment_date), mobilePrimary: true },
    { header: "الموزّع", accessor: (a) => a.distributors?.name || "—" },
    { header: "النوع", accessor: (a) => <Badge variant={a.adjustment_type === "damaged" ? "danger" : "warning"}>{adjustmentTypeLabel(a.adjustment_type)}</Badge> },
    { header: "العدد", accessor: (a) => formatNumber(a.quantity_containers) + " عبوة" },
    { header: "السبب", accessor: (a) => a.reason || "—" },
  ];

  return (
    <div>
      <PageHeader
        title="الاستلام والعهدة"
        subtitle="تسجيل استلام العبوات من المصنع ومتابعة العهدة الحالية لكل موزّع"
        action={
          canWrite && (
            <>
              <button onClick={() => setReceiptModal(true)} className="btn-primary">
                <Plus className="h-4 w-4" /> تسجيل استلام
              </button>
              <button onClick={() => setAdjustmentModal(true)} className="btn-outline">
                <AlertTriangle className="h-4 w-4" /> تالف / مرتجع
              </button>
            </>
          )
        }
      />

      <div className="no-print mb-4 flex gap-1 rounded-xl bg-navy-50 p-1">
        {[
          { key: "custody", label: "العهدة الحالية" },
          { key: "receipts", label: "سجل الاستلام" },
          { key: "adjustments", label: "التالف والمرتجع" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${tab === t.key ? "bg-white text-emerald-700 shadow-sm" : "text-navy-500"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "custody" && (
        custody.length === 0 ? (
          <EmptyState icon={Boxes} title="لا توجد بيانات عهدة بعد" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {custody.map((c) => (
              <Card key={`${c.distributor_id}-${c.product_id}`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-navy-900">{c.distributor_name}</p>
                  <Package className="h-4.5 w-4.5 text-gold-600" />
                </div>
                <p className="mt-1 text-xs text-navy-400">{c.product_name}</p>
                <p className="mt-4 text-3xl font-extrabold text-emerald-700">{formatNumber(c.current_custody)}</p>
                <p className="text-xs text-navy-400">عبوة متبقية في العهدة</p>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-navy-50 pt-3 text-center text-xs">
                  <div><p className="font-bold text-navy-700">{formatNumber(c.received_containers)}</p><p className="text-navy-400">مستلم</p></div>
                  <div><p className="font-bold text-navy-700">{formatNumber(c.sold_containers)}</p><p className="text-navy-400">مباع</p></div>
                  <div><p className="font-bold text-navy-700">{formatNumber(c.damaged_containers + c.returned_containers)}</p><p className="text-navy-400">تالف/مرتجع</p></div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "receipts" && (
        <Card className="p-3 sm:p-4">
          <DataTable columns={receiptColumns} rows={receipts} emptyMessage="لا توجد سجلات استلام بعد" />
        </Card>
      )}

      {tab === "adjustments" && (
        <Card className="p-3 sm:p-4">
          <DataTable columns={adjustmentColumns} rows={adjustments} emptyMessage="لا توجد سجلات تالف أو مرتجع بعد" />
        </Card>
      )}

      <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="تسجيل استلام عبوات">
        <form onSubmit={receiptForm.handleSubmit(onSubmitReceipt)} className="space-y-4" noValidate>
          {profile.role !== "distributor" && (
            <Field label="الموزّع" htmlFor="r_distributor" error={receiptForm.formState.errors.distributor_id?.message} required>
              <Select id="r_distributor" {...receiptForm.register("distributor_id")}>
                <option value="">اختر الموزّع</option>
                {distributors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            </Field>
          )}
          <input type="hidden" {...receiptForm.register("product_id")} />
          <Field label="عدد العبوات" htmlFor="r_qty" error={receiptForm.formState.errors.quantity_containers?.message} required>
            <Input id="r_qty" type="number" min={1} {...receiptForm.register("quantity_containers")} />
          </Field>
          <Field label="تكلفة العبوة" htmlFor="r_cost" error={receiptForm.formState.errors.unit_cost?.message} required hint="القيمة الافتراضية من إعدادات المنتج، يمكن تعديلها">
            <Input id="r_cost" type="number" step="any" {...receiptForm.register("unit_cost")} />
          </Field>
          <Field label="تاريخ الاستلام" htmlFor="r_date" error={receiptForm.formState.errors.receipt_date?.message} required>
            <Input id="r_date" type="date" {...receiptForm.register("receipt_date")} />
          </Field>
          <Field label="ملاحظات" htmlFor="r_notes" error={receiptForm.formState.errors.notes?.message}>
            <Textarea id="r_notes" {...receiptForm.register("notes")} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setReceiptModal(false)} className="btn-outline flex-1">إلغاء</button>
            <button type="submit" disabled={receiptForm.formState.isSubmitting} className="btn-primary flex-1">حفظ</button>
          </div>
        </form>
      </Modal>

      <Modal open={adjustmentModal} onClose={() => setAdjustmentModal(false)} title="تسجيل تالف / مرتجع">
        <form onSubmit={adjustmentForm.handleSubmit(onSubmitAdjustment)} className="space-y-4" noValidate>
          {profile.role !== "distributor" && (
            <Field label="الموزّع" htmlFor="a_distributor" error={adjustmentForm.formState.errors.distributor_id?.message} required>
              <Select id="a_distributor" {...adjustmentForm.register("distributor_id")}>
                <option value="">اختر الموزّع</option>
                {distributors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            </Field>
          )}
          <input type="hidden" {...adjustmentForm.register("product_id")} />
          <Field label="النوع" htmlFor="a_type" error={adjustmentForm.formState.errors.adjustment_type?.message} required>
            <Select id="a_type" {...adjustmentForm.register("adjustment_type")}>
              <option value="damaged">تالف</option>
              <option value="returned">مرتجع</option>
            </Select>
          </Field>
          <Field label="عدد العبوات" htmlFor="a_qty" error={adjustmentForm.formState.errors.quantity_containers?.message} required>
            <Input id="a_qty" type="number" min={1} {...adjustmentForm.register("quantity_containers")} />
          </Field>
          <Field label="تاريخ" htmlFor="a_date" error={adjustmentForm.formState.errors.adjustment_date?.message} required>
            <Input id="a_date" type="date" {...adjustmentForm.register("adjustment_date")} />
          </Field>
          <Field label="السبب" htmlFor="a_reason" error={adjustmentForm.formState.errors.reason?.message}>
            <Textarea id="a_reason" {...adjustmentForm.register("reason")} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setAdjustmentModal(false)} className="btn-outline flex-1">إلغاء</button>
            <button type="submit" disabled={adjustmentForm.formState.isSubmitting} className="btn-primary flex-1">حفظ</button>
          </div>
        </form>
      </Modal>

      {dialog}
    </div>
  );
}
