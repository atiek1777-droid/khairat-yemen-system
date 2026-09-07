"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ReportToolbar } from "@/components/domain/ReportToolbar";
import { ReportHeader } from "@/components/domain/ReportHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";

type SaleRow = { sale_date: string; sale_type: "cash" | "credit"; total_amount: number; total_cost: number; customer_id: string | null; customers?: { name: string } };
type DistributorOption = { id: string; name: string };

export function MonthlyReportClient({
  month, distributorId, distributors, sales, expenses, totalCustody, totalDebt, isDistributor,
}: {
  month: string; distributorId: string; distributors: DistributorOption[];
  sales: SaleRow[]; expenses: { amount: number }[]; totalCustody: number; totalDebt: number; isDistributor: boolean;
}) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const figures = useMemo(() => {
    const cashSales = sales.filter((s) => s.sale_type === "cash").reduce((s, sale) => s + sale.total_amount, 0);
    const creditSales = sales.filter((s) => s.sale_type === "credit").reduce((s, sale) => s + sale.total_amount, 0);
    const totalSalesAmount = cashSales + creditSales;
    const costOfGoods = sales.reduce((s, sale) => s + sale.total_cost, 0);
    const grossProfit = totalSalesAmount - costOfGoods;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const byDay = new Map<string, number>();
    for (const s of sales) byDay.set(s.sale_date, (byDay.get(s.sale_date) ?? 0) + s.total_amount);
    const workingDays = byDay.size;
    const avgDailySales = workingDays > 0 ? totalSalesAmount / workingDays : 0;
    const avgDailyProfit = workingDays > 0 ? netProfit / workingDays : 0;
    let bestDay = { date: "", amount: 0 };
    for (const [date, amount] of byDay.entries()) if (amount > bestDay.amount) bestDay = { date, amount };

    const byCustomer = new Map<string, { name: string; total: number }>();
    for (const s of sales) {
      if (!s.customer_id) continue;
      const key = s.customer_id;
      const entry = byCustomer.get(key) ?? { name: s.customers?.name ?? "—", total: 0 };
      entry.total += s.total_amount;
      byCustomer.set(key, entry);
    }
    let topCustomer = { name: "—", total: 0 };
    for (const c of byCustomer.values()) if (c.total > topCustomer.total) topCustomer = c;

    return { cashSales, creditSales, totalSalesAmount, costOfGoods, grossProfit, totalExpenses, netProfit, workingDays, avgDailySales, avgDailyProfit, bestDay, topCustomer };
  }, [sales, expenses]);

  function updateFilter(key: "month" | "distributor", value: string) {
    const params = new URLSearchParams({ month, distributor: distributorId });
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/reports/monthly?${params.toString()}`);
  }

  const rows: [string, string][] = [
    ["إجمالي المبيعات", formatMoney(figures.totalSalesAmount)],
    ["مبيعات نقدية", formatMoney(figures.cashSales)],
    ["مبيعات آجلة", formatMoney(figures.creditSales)],
    ["تكلفة البضاعة", formatMoney(figures.costOfGoods)],
    ["الربح الإجمالي", formatMoney(figures.grossProfit)],
    ["إجمالي المصروفات", formatMoney(figures.totalExpenses)],
    ["صافي الربح", formatMoney(figures.netProfit)],
    ["أيام العمل", formatNumber(figures.workingDays)],
    ["متوسط المبيعات اليومية", formatMoney(figures.avgDailySales)],
    ["متوسط الربح اليومي", formatMoney(figures.avgDailyProfit)],
    ["أفضل يوم مبيعات", figures.bestDay.date ? `${formatDate(figures.bestDay.date)} (${formatMoney(figures.bestDay.amount)})` : "—"],
    ["أكبر عميل", figures.topCustomer.name !== "—" ? `${figures.topCustomer.name} (${formatMoney(figures.topCustomer.total)})` : "—"],
    ["رصيد الديون الحالي", formatMoney(totalDebt)],
    ["العهدة الحالية (عبوة)", formatNumber(totalCustody)],
  ];

  const whatsappMessage = [
    `التقرير الشهري — ${month}`,
    `إجمالي المبيعات: ${formatMoney(figures.totalSalesAmount)}`,
    `صافي الربح: ${formatMoney(figures.netProfit)}`,
    `متوسط المبيعات اليومية: ${formatMoney(figures.avgDailySales)}`,
    "— معامل خيرات اليمن",
  ].join("\n");

  const excelRows = rows.map(([label, value]) => ({ البند: label, القيمة: value }));

  return (
    <div>
      <PageHeader title="التقرير الشهري" action={<ReportToolbar targetRef={printRef} fileName={`تقرير-شهري-${month}`} excelRows={excelRows} whatsappMessage={whatsappMessage} />} />

      <div className="no-print mb-5 flex flex-wrap gap-3">
        <div className="w-40"><Input type="month" value={month} onChange={(e) => updateFilter("month", e.target.value)} /></div>
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
        <ReportHeader title="التقرير الشهري" subtitle={month} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-navy-50 px-3 py-2.5 text-sm">
              <span className="text-navy-500">{label}</span>
              <span className="font-bold text-navy-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
