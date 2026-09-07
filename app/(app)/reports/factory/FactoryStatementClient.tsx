"use client";

import { useMemo, useRef } from "react";
import { ReportToolbar } from "@/components/domain/ReportToolbar";
import { ReportHeader } from "@/components/domain/ReportHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatMoney, formatNumber } from "@/lib/format";

type DistributorOption = { id: string; name: string };
type Row = { id: string; name: string; totalSales: number; totalCost: number; totalCollected: number; totalExpenses: number; custody: number; debt: number; dueToFactory: number };

export function FactoryStatementClient({
  distributors, sales, payments, expenses, custody, debt, settlements,
}: {
  distributors: DistributorOption[];
  sales: { distributor_id: string; sale_type: "cash" | "credit"; total_amount: number; total_cost: number }[];
  payments: { distributor_id: string; amount: number }[];
  expenses: { distributor_id: string | null; amount: number }[];
  custody: { distributor_id: string; current_custody: number }[];
  debt: { distributor_id: string; total_debt: number }[];
  settlements: { distributor_id: string; amount_due_to_factory: number; amount_paid_to_factory: number; status: "open" | "settled" }[];
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const rows: Row[] = useMemo(
    () =>
      distributors.map((d) => {
        const dSales = sales.filter((s) => s.distributor_id === d.id);
        const dPayments = payments.filter((p) => p.distributor_id === d.id);
        const dExpenses = expenses.filter((e) => e.distributor_id === d.id);
        const dCustody = custody.filter((c) => c.distributor_id === d.id).reduce((s, c) => s + c.current_custody, 0);
        const dDebt = debt.filter((b) => b.distributor_id === d.id).reduce((s, b) => s + b.total_debt, 0);
        const dSettlements = settlements.filter((s) => s.distributor_id === d.id && s.status === "open");
        return {
          id: d.id,
          name: d.name,
          totalSales: dSales.reduce((s, x) => s + x.total_amount, 0),
          totalCost: dSales.reduce((s, x) => s + x.total_cost, 0),
          totalCollected: dPayments.reduce((s, x) => s + x.amount, 0),
          totalExpenses: dExpenses.reduce((s, x) => s + x.amount, 0),
          custody: dCustody,
          debt: dDebt,
          dueToFactory: dSettlements.reduce((s, x) => s + (x.amount_due_to_factory - x.amount_paid_to_factory), 0),
        };
      }),
    [distributors, sales, payments, expenses, custody, debt, settlements]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          totalSales: acc.totalSales + r.totalSales,
          totalCost: acc.totalCost + r.totalCost,
          totalCollected: acc.totalCollected + r.totalCollected,
          totalExpenses: acc.totalExpenses + r.totalExpenses,
          custody: acc.custody + r.custody,
          debt: acc.debt + r.debt,
          dueToFactory: acc.dueToFactory + r.dueToFactory,
        }),
        { totalSales: 0, totalCost: 0, totalCollected: 0, totalExpenses: 0, custody: 0, debt: 0, dueToFactory: 0 }
      ),
    [rows]
  );
  const netProfit = totals.totalSales - totals.totalCost - totals.totalExpenses;

  const columns: Column<Row>[] = [
    { header: "الموزّع", accessor: (r) => r.name, mobilePrimary: true },
    { header: "المبيعات", accessor: (r) => formatMoney(r.totalSales) },
    { header: "التكلفة", accessor: (r) => formatMoney(r.totalCost) },
    { header: "المحصّل", accessor: (r) => formatMoney(r.totalCollected) },
    { header: "المصروفات", accessor: (r) => formatMoney(r.totalExpenses) },
    { header: "العهدة", accessor: (r) => formatNumber(r.custody) },
    { header: "الديون", accessor: (r) => formatMoney(r.debt) },
    { header: "مستحق للمصنع", accessor: (r) => formatMoney(r.dueToFactory) },
  ];

  const whatsappMessage = [
    "كشف حساب المصنع (إجمالي)",
    `إجمالي المبيعات: ${formatMoney(totals.totalSales)}`,
    `صافي الربح: ${formatMoney(netProfit)}`,
    `إجمالي الديون: ${formatMoney(totals.debt)}`,
    `إجمالي المستحق من الموزّعين: ${formatMoney(totals.dueToFactory)}`,
    "— معامل خيرات اليمن",
  ].join("\n");

  const excelRows = rows.map((r) => ({
    الموزّع: r.name,
    المبيعات: r.totalSales,
    التكلفة: r.totalCost,
    المحصّل: r.totalCollected,
    المصروفات: r.totalExpenses,
    العهدة: r.custody,
    الديون: r.debt,
    "مستحق للمصنع": r.dueToFactory,
  }));

  return (
    <div>
      <PageHeader title="كشف حساب المصنع" subtitle="نظرة إجمالية على أداء كل الموزّعين" action={<ReportToolbar targetRef={printRef} fileName="كشف-حساب-المصنع" excelRows={excelRows} whatsappMessage={whatsappMessage} />} />

      <div ref={printRef} className="card p-5 sm:p-6">
        <ReportHeader title="كشف حساب المصنع" subtitle="إجمالي كل الموزّعين" />

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["إجمالي المبيعات", formatMoney(totals.totalSales)],
            ["صافي الربح", formatMoney(netProfit)],
            ["إجمالي الديون", formatMoney(totals.debt)],
            ["مستحق من الموزّعين", formatMoney(totals.dueToFactory)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-navy-100 p-3 text-center">
              <p className="text-[11px] font-bold text-navy-400">{label}</p>
              <p className="mt-1 text-sm font-extrabold text-navy-900">{value}</p>
            </div>
          ))}
        </div>

        <DataTable columns={columns} rows={rows} emptyMessage="لا يوجد موزّعون بعد" />
      </div>
    </div>
  );
}
