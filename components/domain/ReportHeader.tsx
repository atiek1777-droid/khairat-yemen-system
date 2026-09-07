import { Logo } from "@/components/brand/Logo";

export function ReportHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-navy-100 pb-4">
      <div className="flex items-center gap-3">
        <Logo size={50} showWordmark={false} />
        <div>
          <p className="text-sm font-extrabold text-navy-900">معامل خيرات اليمن</p>
          <p className="text-xs text-navy-400">{title}</p>
        </div>
      </div>
      <p className="text-sm font-bold text-navy-700">{subtitle}</p>
    </div>
  );
}
