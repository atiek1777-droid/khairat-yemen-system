"use client";

import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Wallet, ShoppingCart, HandCoins, Receipt, TrendingUp, TrendingDown, Boxes, AlertCircle, Landmark } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/format";
import {
  totalSales as calcTotalSales,
  grossProfit as calcGrossProfit,
  netProfit as calcNetProfit,
  cashCollected as calcCashCollected,
} from "@/lib/calculations";
import type { CurrentProfile } from "@/lib/auth";

const CHART_COLORS = ["#146B4A", "#D9A441", "#1F8A5B", "#E88A25", "#D64545", "#17324D", "#F4C542"];

export function DashboardClient({
  profile,
  todaySales,
  rangeSales,
  rangePayments,
  rangeExpenses,
  totalCustody,
  totalDebt,
  amountDueToFactory,
}: {
  profile: CurrentProfile;
  todaySales: { sale_type: string; total_amount: number; total_cost: number }[];
  rangeSales: { sale_date: string; sale_type: string; total_amount: number; total_cost: number }[];
  rangePayments: { payment_date: string; amount: number }[];
  rangeExpenses: { expense_date: string; category: string; amount: number }[];
  totalCustody: number;
  totalDebt: number;
  amountDueToFactory: number;
}) {
  const todayCash = todaySales.filter((s) => s.sale_type === "cash").reduce((sum, s) => sum + s.total_amount, 0);
  const todayCredit = todaySales.filter((s) => s.sale_type === "credit").reduce((sum, s) => sum + s.total_amount, 0);
  const todayCost = todaySales.reduce((sum, s) => sum + s.total_cost, 0);
  const todayTotalSales = calcTotalSales(todayCash, todayCredit);
  const todayGrossProfit = calcGrossProfit(todayTotalSales, todayCost);
  const todayExpensesTotal = rangeExpenses.filter((e) => e.expense_date === new Date().toISOString().slice(0, 10)).reduce((s, e) => s + e.amount, 0);
  const todayNetProfit = calcNetProfit(todayGrossProfit, todayExpensesTotal);
  const todayCollections = rangePayments.filter((p) => p.payment_date === new Date().toISOString().slice(0, 10)).reduce((s, p) => s + p.amount, 0);
  const todayCashCollected = calcCashCollected(todayCash, todayCollections);

  const chartData = useMemo(() => {
    const byDay = new Map<string, { date: string; sales: number; cost: number }>();
    for (const s of rangeSales) {
      const entry = byDay.get(s.sale_date) ?? { date: s.sale_date, sales: 0, cost: 0 };
      entry.sales += s.total_amount;
      entry.cost += s.total_cost;
      byDay.set(s.sale_date, entry);
    }
    return Array.from(byDay.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, profit: d.sales - d.cost, label: formatDate(d.date).slice(0, 5) }));
  }, [rangeSales]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of rangeExpenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [rangeExpenses]);

  return (
    <div className="space-y-5">
      <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على أداء اليوم وآخر 14 يوماً" />

      <div>
        <p className="mb-2 text-xs font-bold text-navy-400">أداء اليوم</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="إجمالي المبيعات" value={todayTotalSales} icon={ShoppingCart} tone="navy" />
          <StatCard label="مبيعات نقدية" value={todayCash} icon={Wallet} tone="emerald" />
          <StatCard label="مبيعات آجلة" value={todayCredit} icon={Receipt} tone="gold" />
          <StatCard label="تحصيلات اليوم" value={todayCollections} icon={HandCoins} tone="emerald" />
          <StatCard label="مصروفات اليوم" value={todayExpensesTotal} icon={Receipt} tone="warning" />
          <StatCard label="الربح الإجمالي" value={todayGrossProfit} icon={todayGrossProfit >= 0 ? TrendingUp : TrendingDown} tone={todayGrossProfit >= 0 ? "emerald" : "danger"} />
          <StatCard label="صافي الربح" value={todayNetProfit} icon={todayNetProfit >= 0 ? TrendingUp : TrendingDown} tone={todayNetProfit >= 0 ? "emerald" : "danger"} />
          <StatCard label="النقد الفعلي المحصّل" value={todayCashCollected} icon={Wallet} tone="navy" />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-navy-400">المؤشرات العامة</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="العهدة الحالية (عبوة)" value={totalCustody} icon={Boxes} tone="gold" isMoney={false} />
          <StatCard label="إجمالي ديون العملاء" value={totalDebt} icon={AlertCircle} tone="danger" />
          <StatCard label="مستحق للمصنع (تسويات مفتوحة)" value={amountDueToFactory} icon={Landmark} tone="navy" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="المبيعات والربح — آخر 14 يوماً" />
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#146B4A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#146B4A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9A441" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#D9A441" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF0F5" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ fontFamily: "Tajawal", fontSize: 12, borderRadius: 12 }} />
                <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#146B4A" fill="url(#salesGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="الربح الإجمالي" stroke="#D9A441" fill="url(#profitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="توزيع المصروفات (14 يوماً)" />
          {expenseBreakdown.length === 0 ? (
            <p className="py-10 text-center text-sm text-navy-400">لا توجد مصروفات في هذه الفترة</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ fontFamily: "Tajawal", fontSize: 12, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 space-y-1.5">
            {expenseBreakdown.map((e, i) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-navy-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {e.name}
                </span>
                <span className="font-bold text-navy-800">{formatMoney(e.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
