"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ReportToolbar } from "@/components/domain/ReportToolbar";
import { ReportHeader } from "@/components/domain/ReportHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatMoney, formatNumber, formatDate, settlementStatusLabel } from "@/lib/format";

type SaleRow = { sale_type: "cash" | "credit"; total_amount: number; total_cost: number; sale_items?: { quantity_containers: number }[] };
type DistributorOption = { id: string; name: string };
type Settlement = { id: string; distributor_id: string; week_start: string; week_end: string; status: "open" | "settled"; amount_due_to_factory: number; amount_paid_to_factory: number };

export function WeeklyReportClient({
  start, end, distributorId, distributors, sales, payments, expenses, receipts, totalCustody, totalDebt, settlements, isDistributor,
}: {
  start: string; end: string; distributorId: string; distributors: DistributorOption[];
  sales: SaleRow[]; payments: { amount: number }[]; expenses: { category: string; amount: number }[];
  receipts: { quantity_containers: number }[]; totalCustody: number; totalDebt: number;
  settlements: Settlement[]; isDistributor: boolean;
}) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const figures = useMemo(() => {
    const containersReceived = receipts.reduce((s, r) => s + r.quantity_containers, 0);
    const containersSold = sales.reduce((s, sale) => s + (sale.sale_items ?? []).reduce((ss, i) => ss + i.quantity_containers, 0), 0);
    const cashSales = sales.filter((s) => s.sale_type === "cash").reduce((s, sale) => s + sale.total_amount, 0);
    const creditSales = sales.filter((s) => s.sale_type === "credit").reduce((s, sale) => s + sale.total_amount, 0);
    const totalSalesAmount = cashSales + creditSales;
    const costOfGoods = sales.reduce((s, sale) => s + sale.total_cost, 0);
    const grossProfit = totalSalesAmount - costOfGoods;
    const collections = payments.reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    return { containersReceived, containersSold, cashSales, creditSales, totalSalesAmount, costOfGoods, grossProfit, collections, totalExpenses, netProfit };
  }, [sales, payments, expenses, receipts]);

  function updateFilter(key: "start" | "end" | "distributor", value: string) {
    const params = new URLSearchParams({ start, end, distributor: distributorId });
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/reports/weekly?${params.toString()}`);
  }

  const rows: [string, number, boolean?][] = [
    ["عبوات مستلمة", figures.containersReceived, true],
    ["عبوات مباعة", figures.containersSold, true],
    ["مبيعات نقدية", figures.cashSales],
    ["مبيعات آجلة", figures.creditSales],
    ["إجمالي المبيعات", figures.totalSalesAmount],
    ["تحصيلات الديون", figures.collections],
    ["تكلفة البضاعة", figures.costOfGoods],
    ["الربح الإجمالي", figures.grossProfit],
    ["إجمالي المصروفات", figures.totalExpenses],
    ["صافي الربح", figures.netProfit],
    ["رصيد الديون الحالي", totalDebt],
    ["رصيد العهدة الحالي (عبوة)", totalCustody, true],
  ];

  const whatsappMessage = [
    `التقرير الأسبوعي — ${formatDate(start)} إلى ${formatDate(end)}`,
    `إجمالي المبيعات: ${formatMoney(figures.totalSalesAmount)}`,
    `الربح الإجمالي: ${formatMoney(figures.grossProfit)} / صافي الربح: ${formatMoney(figures.netProfit)}`,
    `رصيد الديون: ${formatMoney(totalDebt)}`,
    "— معامل خيرات اليمن",
  ].join("\n");

  const excelRows = rows.map(([label, value]) => ({ البند: label, القيمة: value }));

  return (
    <div>
      <PageHeader title="التقرير الأسبوعي" action={<ReportToolbar targetRef={printRef} fileName={`تقرير-أسبوعي-${start}-${end}`} excelRows={excelRows} whatsappMessage={whatsappMessage} />} />

      <div className="no-print mb-5 flex flex-wrap gap-3">
        <div className="w-40"><Input type="date" value={start} onChange={(e) => updateFilter("start", e.target.value)} /></div>
        <div className="w-40"><Input type="date" value={end} onChange={(e) => updateFilter("end", e.target.value)} /></div>
        {!isDistributor && (
          <div className="w-52">
            <Select value={distributorId} onChange={(e) => updateFilter("distributor", e.target.value)}>
              <option value="">كل الموزّعين</option>
              {distributors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </Select>
          </div>
        )}
      </div>

      <div ref={printRef} className="card p-5 sm:p-6">
        <ReportHeader title="التقرير الأسبوعي" subtitle={`${formatDate(start)} — ${formatDate(end)}`} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map(([label, value, isCount]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-navy-50 px-3 py-2.5 text-sm">
              <span className="text-navy-500">{label}</span>
              <span className="font-bold text-navy-900">{isCount ? formatNumber(value) : formatMoney(value)}</span>
            </div>
          ))}
        </div>

        {settlements.length > 0 && (
          <div className="mt-5 border-t border-navy-100 pt-4">
            <p className="mb-2 text-sm font-bold text-navy-700">تسويات هذا النطاق</p>
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
