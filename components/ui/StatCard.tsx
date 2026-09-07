import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, formatNumber } from "@/lib/format";

const tones = {
  emerald: { bg: "bg-emerald-700", ring: "ring-emerald-700/15", text: "text-emerald-700" },
  gold: { bg: "bg-gold-600", ring: "ring-gold-600/15", text: "text-gold-700" },
  navy: { bg: "bg-navy-800", ring: "ring-navy-800/15", text: "text-navy-800" },
  danger: { bg: "bg-danger", ring: "ring-danger/15", text: "text-danger" },
  warning: { bg: "bg-warning", ring: "ring-warning/15", text: "text-warning" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  isMoney = true,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  isMoney?: boolean;
  hint?: string;
}) {
  const t = tones[tone];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-navy-400">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", t.bg)}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </span>
      </div>
      <p className={cn("mt-3 text-2xl font-extrabold tabular-nums", t.text)}>
        {isMoney ? formatMoney(value) : formatNumber(value)}
      </p>
      {hint && <p className="mt-1 text-xs text-navy-400">{hint}</p>}
    </div>
  );
}
