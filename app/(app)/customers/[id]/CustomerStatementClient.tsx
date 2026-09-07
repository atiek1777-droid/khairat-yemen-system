"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Phone, MapPin, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ReportToolbar } from "@/components/domain/ReportToolbar";
import { Logo } from "@/components/brand/Logo";
import { formatMoney, formatDate, saleTypeLabel } from "@/lib/format";
import { HandCoins, Receipt as ReceiptIcon, Wallet } from "lucide-react";

type LedgerRow = {
  id: string;
  date: string;
  type: "sale" | "payment";
  label: string;
  debit: number; // increases debt
  credit: number; // decreases debt
};

export function CustomerStatementClient({ customer, sales, payments }: { customer: any; sales: any[]; payments: any[] }) {
  const printRef = useRef<HTMLDivElement>(null);

  const ledger: LedgerRow[] = useMemo(() => {
    const saleRows: LedgerRow[] = sales
      .filter((s) => s.sale_type === "credit")
      .map((s) => ({
        id: `sale-${s.id}`,
        date: s.sale_date,
        type: "sale" as const,
        label: `فاتورة ${s.invoice_number} — ${(s.sale_items ?? []).map((i: any) => `${i.quantity_containers} × ${i.products?.name ?? "عبوة"}`).join("، ")}`,
        debit: s.total_amount,
        credit: 0,
      }));
    const paymentRows: LedgerRow[] = payments.map((p) => ({
      id: `pay-${p.id}`,
      date: p.payment_date,
      type: "payment" as const,
      label: `سداد لفاتورة ${p.sales?.invoice_number ?? ""}${p.notes ? " — " + p.notes : ""}`,
      debit: 0,
      credit: p.amount,
    }));
    return [...saleRows, ...paymentRows].sort((a, b) => a.date.localeCompare(b.date));
  }, [sales, payments]);

  const totalCreditSales = sales.filter((s) => s.sale_type === "credit").reduce((sum, s) => sum + s.total_amount, 0);
  const totalCashSales = sales.filter((s) => s.sale_type === "cash").reduce((sum, s) => sum + s.total_amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDebt = Math.max(0, totalCreditSales - totalPaid);

  let running = 0;
  const ledgerWithBalance = ledger.map((row) => {
    running += row.debit - row.credit;
    return { ...row, balance: running };
  });

  const whatsappMessage = [
    `كشف حساب العميل: ${customer.name}`,
    `إجمالي المبيعات الآجلة: ${formatMoney(totalCreditSales)}`,
    `إجمالي المسدد: ${formatMoney(totalPaid)}`,
    `الرصيد المستحق: ${formatMoney(totalDebt)}`,
    "— معامل خيرات اليمن",
  ].join("\n");

  const excelRows = ledgerWithBalance.map((r) => ({
    التاريخ: formatDate(r.date),
    البيان: r.label,
    "مدين (دين جديد)": r.debit || "",
    "دائن (سداد)": r.credit || "",
    الرصيد: r.balance,
  }));

  return (
    <div>
      <div className="no-print mb-4">
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-800">
          <ArrowRight className="h-4 w-4" /> رجوع إلى العملاء
        </Link>
      </div>

      <PageHeader
        title={`كشف حساب: ${customer.name}`}
        subtitle={customer.distributors?.name ? `الموزّع: ${customer.distributors.name}` : undefined}
        action={<ReportToolbar targetRef={printRef} fileName={`كشف-حساب-${customer.name}`} excelRows={excelRows} whatsappMessage={whatsappMessage} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="مبيعات آجلة" value={totalCreditSales} icon={ReceiptIcon} tone="navy" />
        <StatCard label="مبيعات نقدية" value={totalCashSales} icon={Wallet} tone="emerald" />
        <StatCard label="إجمالي المسدد" value={totalPaid} icon={HandCoins} tone="gold" />
        <StatCard label="الرصيد المستحق" value={totalDebt} icon={ReceiptIcon} tone={totalDebt > 0 ? "danger" : "emerald"} />
      </div>

      <div ref={printRef} className="card p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between border-b border-navy-100 pb-4">
          <div className="flex items-center gap-3">
            <Logo size={54} showWordmark={false} />
            <div>
              <p className="text-sm font-extrabold text-navy-900">معامل خيرات اليمن</p>
              <p className="text-xs text-navy-400">الحصبة – شارع عمران – جوار جامع السلام · 784355755</p>
            </div>
          </div>
          <div className="text-left text-xs text-navy-400">
            <p>تاريخ الطباعة: {formatDate(new Date())}</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <p className="flex items-center gap-2 text-navy-600"><Phone className="h-4 w-4 text-navy-300" /> {customer.phone || "—"}</p>
          <p className="flex items-center gap-2 text-navy-600"><MapPin className="h-4 w-4 text-navy-300" /> {customer.address || "—"}</p>
          <p className="flex items-center gap-2 text-navy-600"><Truck className="h-4 w-4 text-navy-300" /> {customer.distributors?.name || "—"}</p>
        </div>

        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-navy-400">
              <th className="px-2 py-2 text-right font-bold">التاريخ</th>
              <th className="px-2 py-2 text-right font-bold">البيان</th>
              <th className="px-2 py-2 text-right font-bold">مدين</th>
              <th className="px-2 py-2 text-right font-bold">دائن</th>
              <th className="px-2 py-2 text-right font-bold">الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {ledgerWithBalance.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-navy-400">لا توجد عمليات مسجلة بعد</td>
              </tr>
            ) : (
              ledgerWithBalance.map((row) => (
                <tr key={row.id} className="border-b border-navy-50">
                  <td className="px-2 py-2.5 text-navy-600">{formatDate(row.date)}</td>
                  <td className="px-2 py-2.5 text-navy-800">{row.label}</td>
                  <td className="px-2 py-2.5 text-danger">{row.debit ? formatMoney(row.debit) : "—"}</td>
                  <td className="px-2 py-2.5 text-success">{row.credit ? formatMoney(row.credit) : "—"}</td>
                  <td className="px-2 py-2.5 font-bold text-navy-900">{formatMoney(row.balance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-5 flex justify-end border-t border-navy-100 pt-4">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-navy-500"><span>إجمالي المبيعات الآجلة</span><span>{formatMoney(totalCreditSales)}</span></div>
            <div className="flex justify-between text-navy-500"><span>إجمالي المسدد</span><span>{formatMoney(totalPaid)}</span></div>
            <div className="flex justify-between border-t border-navy-100 pt-1.5 text-base font-extrabold text-navy-900">
              <span>الرصيد المستحق</span><span className={totalDebt > 0 ? "text-danger" : "text-success"}>{formatMoney(totalDebt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
