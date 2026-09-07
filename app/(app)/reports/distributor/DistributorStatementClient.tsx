"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ReportToolbar } from "@/components/domain/ReportToolbar";
import { ReportHeader } from "@/components/domain/ReportHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatMoney, formatNumber, formatDate, settlementStatusLabel } from "@/lib/format";

type DistributorOption = { id: string; name: string };

export function DistributorStatementClient({
  distributors, distributorId, receipts, sales, expenses, settlements, totalCustody,
}: {
  distributors: DistributorOption[]; distributorId: string;
  receipts: { quantity_containers: number; unit_cost: number; receipt_date: string }[];
  sales: { sale_type: "cash" | "credit"; total_amount: number; total_cost: number; paid_amount: number; sale_date: string }[];
  expenses: { amount: number; category: string; expense_date: string }[];
  settlements: { id: string; week_start: string; week_end: string; status: "open" | "settled"; amount_due_to_factory: number; amount_paid_to_factory: number }[];
  totalCustody: number;
}) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const distributor = distributors.find((d) => d.id === distributorId);

  const figures = useMemo(() => {
    const totalReceived = receipts.reduce((s, r) => s + r.quantity_containers, 0);
    const totalReceivedValue = receipts.reduce((s, r) => s + r.quantity_containers * r.unit_cost, 0);
    const totalSales = sales.reduce((s, sale) => s + sale.total_amount, 0);
    const totalCost = sales.reduce((s, sale) => s + sale.total_cost, 0);
    const totalCollected = sales.reduce((s, sale) => s + sale.paid_amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const grossProfit = totalSales - totalCost;
    const netProfit = grossProfit - totalExpenses;
    const totalDueToFactory = settlements.reduce((s, st) => s + (st.amount_due_to_factory - st.amount_paid_to_factory), 0);
    return { totalReceived, totalReceivedValue, totalSales, totalCost, totalCollected, totalExpenses, grossProfit, netProfit, totalDueToFactory };
  }, [receipts, sales, expenses, settlements]);

  function updateDistributor(id: string) {
    router.push(`/reports/distributor?distributor=${id}`);
  }

  const rows: [string, string][] = [
    ["إجمالي العبوات المستلمة", formatNumber(figures.totalReceived)],
    ["قيمة العبوات المستلمة (تكلفة)", formatMoney(figures.totalReceivedValue)],
    ["إجمالي المبيعات", formatMoney(figures.totalSales)],
    ["تكلفة البضاعة المباعة", formatMoney(figures.totalCost)],
    ["إجمالي المحصّل", formatMoney(figures.totalCollected)],
    ["إجمالي المصروفات", formatMoney(figures.totalExpenses)],
    ["الربح الإجمالي", formatMoney(figures.grossProfit)],
    ["صافي الربح", formatMoney(figures.netProfit)],
    ["العهدة الحالية (عبوة)", formatNumber(totalCustody)],
    ["مستحق للمصنع (تسويات مفتوحة)", formatMoney(figures.totalDueToFactory)],
  ];

  const whatsappMessage = [
    `كشف حساب الموزّع: ${distributor?.name ?? ""}`,
    `إجمالي المبيعات: ${formatMoney(figures.totalSales)}`,
    `صافي الربح: ${formatMoney(figures.netProfit)}`,
    `مستحق للمصنع: ${formatMoney(figures.totalDueToFactory)}`,
    "— معامل خيرات اليمن",
  ].join("\n");

  const excelRows = rows.map(([label, value]) => ({ البند: label, القيمة: value }));

  return (
    <div>
      <PageHeader title="كشف حساب موزّع" action={<ReportToolbar targetRef={printRef} fileName={`كشف-موزع-${distributor?.name ?? ""}`} excelRows={excelRows} whatsappMessage={whatsappMessage} />} />

      {distributors.length > 1 && (
        <div className="no-print mb-5 w-64">
          <Select value={distributorId} onChange={(e) => updateDistributor(e.target.value)}>
            {distributors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </Select>
        </div>
      )}

      <div ref={printRef} className="card p-5 sm:p-6">
        <ReportHeader title="كشف حساب موزّع" subtitle={distributor?.name ?? ""} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-navy-50 px-3 py-2.5 text-sm">
              <span className="text-navy-500">{label}</span>
              <span className="font-bold text-navy-900">{value}</span>
            </div>
          ))}
        </div>

        {settlements.length > 0 && (
          <div className="mt-5 border-t border-navy-100 pt-4">
            <p className="mb-2 text-sm font-bold text-navy-700">سجل التسويات</p>
            <div className="space-y-2">
              {settlements.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-navy-50 px-3 py-2 text-sm">
                  <span className="text-navy-600">{formatDate(s.week_start)} — {formatDate(s.week_end)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900">{formatMoney(s.amount_due_to_factory - s.amount_paid_to_factory)} متبقي</span>
                    <Badge variant={s.status === "settled" ? "success" : "warning"}>{settlementStatusLabel(s.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
