import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const variants = {
  success: "bg-success-50 text-success",
  warning: "bg-warning-50 text-warning",
  danger: "bg-danger-50 text-danger-600",
  gold: "bg-gold-50 text-gold-700",
  navy: "bg-navy-50 text-navy-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

export function Badge({
  children,
  variant = "navy",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return <span className={cn("badge", variants[variant], className)}>{children}</span>;
}

export function PaymentStatusBadge({ status }: { status: "paid" | "partial" | "unpaid" }) {
  if (status === "paid") return <Badge variant="success">مسدد بالكامل</Badge>;
  if (status === "partial") return <Badge variant="warning">مسدد جزئياً</Badge>;
  return <Badge variant="danger">غير مسدد</Badge>;
}
