/**
 * Central place for every derived business number, so reports,
 * dashboard, and invoices always agree on the same formulas.
 */

export interface DailyFigures {
  containersReceived: number;
  containersSold: number;
  cashSales: number;
  creditSales: number;
  collections: number;
  costOfGoods: number;
  transportation: number;
  fuel: number;
  loadingUnloading: number;
  maintenance: number;
  communications: number;
  cashWithAtiq: number;
  otherExpenses: number;
  newDebts: number;
  collectedDebts: number;
  remainingCustody: number;
}

export function totalSales(cashSales: number, creditSales: number): number {
  return cashSales + creditSales;
}

export function grossProfit(totalSalesAmount: number, costOfGoods: number): number {
  return totalSalesAmount - costOfGoods;
}

export function totalOutgoingExpenses(f: {
  transportation: number;
  fuel: number;
  loadingUnloading: number;
  maintenance: number;
  communications: number;
  cashWithAtiq: number;
  otherExpenses: number;
}): number {
  return (
    f.transportation +
    f.fuel +
    f.loadingUnloading +
    f.maintenance +
    f.communications +
    f.cashWithAtiq +
    f.otherExpenses
  );
}

export function netProfit(gross: number, totalExpenses: number): number {
  return gross - totalExpenses;
}

/** Cash actually collected = cash sales + debt collections (credit sales are not cash until paid). */
export function cashCollected(cashSales: number, collections: number): number {
  return cashSales + collections;
}

export function currentCustody(
  received: number,
  sold: number,
  damaged: number,
  returned: number
): number {
  return received - sold - damaged - returned;
}

export function remainingDebt(totalAmount: number, paidAmount: number): number {
  return Math.max(0, totalAmount - paidAmount);
}

export function paymentStatusFor(totalAmount: number, paidAmount: number): "paid" | "partial" | "unpaid" {
  if (totalAmount <= 0) return "unpaid";
  if (paidAmount >= totalAmount) return "paid";
  if (paidAmount > 0) return "partial";
  return "unpaid";
}

export const EXPENSE_CATEGORIES = [
  "مواصلات",
  "بترول",
  "تحميل وتنزيل",
  "صيانة",
  "اتصالات",
  "نقد مع عتيق",
  "مصروفات أخرى",
] as const;

export type ExpenseCategoryName = (typeof EXPENSE_CATEGORIES)[number];
