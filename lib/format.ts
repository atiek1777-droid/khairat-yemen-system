const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => arabicDigits[Number(d)]);
}

export function formatMoney(amount: number | null | undefined, opts?: { withArabicDigits?: boolean }): string {
  const n = amount ?? 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  const withCurrency = `${formatted} ريال`;
  return opts?.withArabicDigits ? toArabicDigits(withCurrency) : withCurrency;
}

export function formatNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "مسدد بالكامل";
    case "partial":
      return "مسدد جزئياً";
    default:
      return "غير مسدد";
  }
}

export function saleTypeLabel(type: string): string {
  return type === "cash" ? "نقدي" : "آجل";
}

export function roleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "مدير النظام";
    case "factory_owner":
      return "مالك المصنع";
    default:
      return "موزّع";
  }
}

export function settlementStatusLabel(status: string): string {
  return status === "settled" ? "تمت التسوية" : "مفتوحة";
}

export function adjustmentTypeLabel(type: string): string {
  return type === "damaged" ? "تالف" : "مرتجع";
}
