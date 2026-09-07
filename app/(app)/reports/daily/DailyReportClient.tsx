"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ReportToolbar } from "@/components/domain/ReportToolbar";
import { ReportHeader } from "@/components/domain/ReportHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/calculations";

type SaleRow = { sale_type: "cash" | "credit"; total_amount: number; total_cost: number; sale_items?: { quantity_containers: number }[] };
type DistributorOption = { id: string; name: string };

export function DailyReportClient({
  date,
  distributorId,
  distributors,
  sales,
  payments,
  expenses,
  receipts,
  totalCustody,
  isDistributor,
}: {
  date: string;
  distributorId: string;
  distributors: DistributorOption[];
  sales: SaleRow[];
  payments: { amount: number }[];
  expenses: { category: string; amount: number }[];
  receipts: { quantity_containers: number }[];
  totalCustody: number;
  isDistributor: boolean;
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

    const byCategory = new Map<string, number>();
    for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    const transportation = byCategory.get("مواصلات") ?? 0;
    const fuel = byCategory.get("بترول") ?? 0;
    const loadingUnloading = byCategory.get("تحميل وتنزيل") ?? 0;
    const maintenance = byCategory.get("صيانة") ?? 0;
    const communications = byCategory.get("اتصالات") ?? 0;
    const cashWithAtiq = byCategory.get("نقد مع عتيق") ?? 0;
    const otherExpenses = byCategory.get("مصروفات أخرى") ?? 0;
    const totalOutgoing = transportation + fuel + loadingUnloading + maintenance + communications + cashWithAtiq + otherExpenses;
    const netProfit = grossProfit - totalOutgoing;
    const actualCash = cashSales + collections;

    return {
      containersReceived, containersSold, cashSales, creditSales, totalSalesAmount, costOfGoods, grossProfit,
      collections, transportation, fuel, loadingUnloading, maintenance, communications, cashWithAtiq, otherExpenses,
      totalOutgoing, netProfit, actualCash, newDebts: creditSales, collectedDebts: collections,
    };
  }, [sales, payments, expenses, receipts]);

  function updateFilter(key: "date" | "distributor", value: string) {
    const params = new URLSearchParams({ date, distributor: distributorId });
    params.set(key, value);
    if (key === "date" && !value) params.delete("date");
    if (key === "distributor" && !value) params.delete("distributor");
    router.push(`/reports/daily?${params.toString()}`);
  }

  const rows: [string, number][] = [
    ["عبوات مستلمة", figures.containersReceived],
    ["عبوات مباعة", figures.containersSold],
    ["مبيعات نقدية", figures.cashSales],
    ["مبيعات آجلة", figures.creditSales],
    ["إجمالي المبيعات", figures.totalSalesAmount],
    ["تحصيلات الديون", figures.collections],
    ["تكلفة البضاعة المباعة", figures.costOfGoods],
    ["الربح الإجمالي", figures.grossProfit],
    ["مصروف مواصلات", figures.transportation],
    ["مصروف بترول", figures.fuel],
    ["تحميل وتنزيل", figures.loadingUnloading],
    ["صيانة", figures.maintenance],
    ["اتصالات", figures.communications],
    ["نقد مع عتيق", figures.cashWithAtiq],
    ["مصروفات أخرى", figures.otherExpenses],
    ["إجمالي المصروفات", figures.totalOutgoing],
    ["صافي الربح", figures.netProfit],
    ["ديون جديدة", figures.newDebts],
    ["ديون محصّلة", figures.collectedDebts],
    ["العهدة الحالية (عبوة)", totalCustody],
    ["النقد الفعلي المتاح", figures.actualCash],
  ];

  const whatsappMessage = [
    `التقرير اليومي — ${formatDate(date)}`,
    `إجمالي المبيعات: ${formatMoney(figures.totalSalesAmount)}`,
    `نقدي: ${formatMoney(figures.cashSales)} / آجل: ${formatMoney(figures.creditSales)}`,
    `تكلفة البضاعة: ${formatMoney(figures.costOfGoods)}`,
    `الربح الإجمالي: ${formatMoney(figures.grossProfit)}`,
    `إجمالي المصروفات: ${formatMoney(figures.totalOutgoing)} (منها نقد مع عتيق: ${formatMoney(figures.cashWithAtiq)})`,
    `صافي الربح: ${formatMoney(figures.netProfit)}`,
    `النقد الفعلي المتاح: ${formatMoney(figures.actualCash)}`,
    "— معامل خيرات اليمن",
  ].join("\n");

  const excelRows = rows.map(([label, value]) => ({ البند: label, القيمة: value }));

  return (
    <div>
      <PageHeader
        title="التقرير اليومي"
        action={<ReportToolbar targetRef={printRef} fileName={`تقرير-يومي-${date}`} excelRows={excelRows} whatsappMessage={whatsappMessage} />}
      />

      <div className="no-print mb-5 flex flex-wrap gap-3">
        <div className="w-40">
          <Input type="date" value={date} onChange={(e) => updateFilter("date", e.target.value)} />
        </div>
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
        <ReportHeader title="التقرير اليومي" subtitle={formatDate(date)} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-navy-50 px-3 py-2.5 text-sm">
              <span className="text-navy-500">{label}</span>
              <span className="font-bold text-navy-900">{label.includes("عبوة") || label.includes("عبوات") ? formatNumber(value) : formatMoney(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
