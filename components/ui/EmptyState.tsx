import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-100 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50">
        <Icon className="h-7 w-7 text-gold-600" />
      </div>
      <h3 className="text-base font-bold text-navy-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-navy-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
