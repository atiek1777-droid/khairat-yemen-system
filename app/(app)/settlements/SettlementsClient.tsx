"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Handshake, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { settlementCreateSchema, settlementPaymentSchema, type SettlementCreateInput, type SettlementPaymentInput } from "@/lib/validations";
import { createSettlementAction, addSettlementPaymentAction } from "@/app/actions/settlements";
import { formatMoney, formatDate, settlementStatusLabel, todayISO } from "@/lib/format";
import type { CurrentProfile } from "@/lib/auth";

type Settlement = {
  id: string;
  distributor_id: string;
  week_start: string;
  week_end: string;
  total_sales: number;
  total_cost: number;
  total_collected: number;
  total_expenses: number;
  amount_due_to_factory: number;
  amount_paid_to_factory: number;
  status: "open" | "settled";
  distributors?: { name: string };
  settlement_payments?: { id: string; amount: number; payment_date: string; method: string }[];
};
type DistributorOption = { id: string; name: string };

export function SettlementsClient({ settlements, distributors, profile }: { settlements: Settlement[]; distributors: DistributorOption[]; profile: CurrentProfile }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<Settlement | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const canWrite = profile.role !== "factory_owner";

  const createForm = useForm<SettlementCreateInput>({
    resolver: zodResolver(settlementCreateSchema),
    defaultValues: { distributor_id: profile.distributor_id ?? undefined },
  });
  const payForm = useForm<SettlementPaymentInput>({
    resolver: zodResolver(settlementPaymentSchema),
    defaultValues: { payment_date: todayISO(), method: "نقدي" },
  });

  async function onCreateSubmit(values: SettlementCreateInput) {
    const result = await createSettlementAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم الإنشاء");
    setCreateOpen(false);
    router.refresh();
  }

  function openPay(s: Settlement) {
    setPayOpen(s);
    payForm.reset({ settlement_id: s.id, payment_date: todayISO(), method: "نقدي", amount: s.amount_due_to_factory - s.amount_paid_to_factory });
  }

  async function onPaySubmit(values: SettlementPaymentInput) {
    const result = await addSettlementPaymentAction(values);
    if (!result.ok) {
      toast.error(result.message ?? "حدث خطأ");
      return;
    }
    toast.success(result.message ?? "تم التسجيل");
    setPayOpen(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="التسوية الأسبوعية"
        subtitle="احتساب مستحقات المصنع من كل موزّع أسبوعياً وتسجيل السداد"
        action={canWrite && <button onClick={() => { createForm.reset({ distributor_id: profile.distributor_id ?? undefined }); setCreateOpen(true); }} className="btn-primary"><Plus className="h-4 w-4" /> تسوية جديدة</button>}
      />

      {settlements.length === 0 ? (
        <EmptyState icon={Handshake} title="لا توجد تسويات بعد" />
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => {
            const remaining = s.amount_due_to_factory - s.amount_paid_to_factory;
            const isOpenRow = expanded === s.id;
            return (
              <Card key={s.id}>
                <button onClick={() => setExpanded(isOpenRow ? null : s.id)} className="flex w-full items-center justify-between text-right">
                  <div>
                    <p className="font-bold text-navy-900">{s.distributors?.name}</p>
                    <p className="text-xs text-navy-400">{formatDate(s.week_start)} — {formatDate(s.week_end)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={s.status === "settled" ? "success" : "warning"}>{settlementStatusLabel(s.status)}</Badge>
                    {isOpenRow ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
                  </div>
                </button>

                {isOpenRow && (
                  <div className="mt-4 space-y-4 border-t border-navy-100 pt-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Stat label="إجمالي المبيعات" value={s.total_sales} />
                      <Stat label="تكلفة البضاعة" value={s.total_cost} />
                      <Stat label="تحصيلات الأسبوع" value={s.total_collected} />
                      <Stat label="مصروفات الأسبوع" value={s.total_expenses} />
                    </div>
                    <div className="rounded-xl bg-navy-50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-navy-500">مستحق للمصنع</span>
                        <span className="font-bold text-navy-900">{formatMoney(s.amount_due_to_factory)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-sm">
                        <span className="text-navy-500">مدفوع للمصنع</span>
                        <span className="font-bold text-emerald-700">{formatMoney(s.amount_paid_to_factory)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between border-t border-navy-100 pt-1.5 text-sm font-bold">
                        <span>المتبقي</span>
                        <span className={remaining > 0 ? "text-danger" : "text-success"}>{formatMoney(remaining)}</span>
                      </div>
                    </div>

                    {canWrite && remaining > 0.01 && (
                      <button onClick={() => openPay(s)} className="btn-gold w-full">
                        <Wallet className="h-4 w-4" /> تسجيل دفعة للمصنع
                      </button>
                    )}

                    {(s.settlement_payments?.length ?? 0) > 0 && (
                      <div className="space-y-1.5 text-sm">
                        <p className="font-bold text-navy-600">دفعات هذه التسوية</p>
                        {s.settlement_payments!.map((p) => (
                          <div key={p.id} className="flex justify-between text-navy-500">
                            <span>{formatDate(p.payment_date)} — {p.method}</span>
                            <span className="font-bold text-navy-800">{formatMoney(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="تسوية أسبوعية جديدة">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4" noValidate>
          {profile.role !== "distributor" && (
            <Field label="الموزّع" htmlFor="st_distributor" error={createForm.formState.errors.distributor_id?.message} required>
              <Select id="st_distributor" {...createForm.register("distributor_id")}>
                <option value="">اختر الموزّع</option>
                {distributors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="بداية الأسبوع" htmlFor="st_start" error={createForm.formState.errors.week_start?.message} required>
              <Input id="st_start" type="date" {...createForm.register("week_start")} />
            </Field>
            <Field label="نهاية الأسبوع" htmlFor="st_end" error={createForm.formState.errors.week_end?.message} required>
              <Input id="st_end" type="date" {...createForm.register("week_end")} />
            </Field>
          </div>
          <Field label="ملاحظات" htmlFor="st_notes" error={createForm.formState.errors.notes?.message}>
            <Textarea id="st_notes" {...createForm.register("notes")} />
          </Field>
          <p className="text-xs text-navy-400">سيتم احتساب المبيعات والتكلفة والتحصيلات والمصروفات تلقائياً لهذه الفترة.</p>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-outline flex-1">إلغاء</button>
            <button type="submit" disabled={createForm.formState.isSubmitting} className="btn-primary flex-1">إنشاء التسوية</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title="تسجيل دفعة للمصنع">
        <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-4" noValidate>
          <Field label="المبلغ" htmlFor="sp_amount" error={payForm.formState.errors.amount?.message} required>
            <Input id="sp_amount" type="number" step="any" {...payForm.register("amount")} />
          </Field>
          <Field label="تاريخ الدفع" htmlFor="sp_date" error={payForm.formState.errors.payment_date?.message} required>
            <Input id="sp_date" type="date" {...payForm.register("payment_date")} />
          </Field>
          <Field label="طريقة الدفع" htmlFor="sp_method" error={payForm.formState.errors.method?.message}>
            <Input id="sp_method" {...payForm.register("method")} />
          </Field>
          <Field label="ملاحظات" htmlFor="sp_notes" error={payForm.formState.errors.notes?.message}>
            <Textarea id="sp_notes" {...payForm.register("notes")} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setPayOpen(null)} className="btn-outline flex-1">إلغاء</button>
            <button type="submit" disabled={payForm.formState.isSubmitting} className="btn-primary flex-1">تسجيل الدفعة</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-100 p-3">
      <p className="text-[11px] font-bold text-navy-400">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-navy-900">{formatMoney(value)}</p>
    </div>
  );
}
