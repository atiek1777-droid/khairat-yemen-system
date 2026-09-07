"use client";

import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  created_at: string;
  profiles?: { full_name: string; username: string };
};

const ACTION_LABELS: Record<string, string> = {
  create: "إضافة",
  update: "تعديل",
  delete: "حذف",
  login: "تسجيل دخول",
  logout: "تسجيل خروج",
  export: "تصدير",
  settle: "تسوية",
  print: "طباعة",
};

const ENTITY_LABELS: Record<string, string> = {
  sales: "المبيعات",
  payments: "التحصيلات",
  expenses: "المصروفات",
  inventory_receipts: "الاستلام",
  customers: "العملاء",
  distributors: "الموزّعون",
  weekly_settlements: "التسويات",
  products: "المنتج",
  auth: "الدخول",
};

function actionVariant(action: string): "success" | "warning" | "danger" | "navy" {
  if (action === "create") return "success";
  if (action === "update") return "warning";
  if (action === "delete") return "danger";
  return "navy";
}

export function AuditLogClient({ logs }: { logs: AuditLog[] }) {
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const entities = useMemo(() => Array.from(new Set(logs.map((l) => l.entity_type))), [logs]);

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) => (actionFilter === "all" || l.action === actionFilter) && (entityFilter === "all" || l.entity_type === entityFilter)
      ),
    [logs, actionFilter, entityFilter]
  );

  const columns: Column<AuditLog>[] = [
    { header: "التاريخ والوقت", accessor: (l) => formatDateTime(l.created_at), mobilePrimary: true },
    { header: "المستخدم", accessor: (l) => l.profiles?.full_name || "النظام" },
    { header: "الإجراء", accessor: (l) => <Badge variant={actionVariant(l.action)}>{ACTION_LABELS[l.action] || l.action}</Badge> },
    { header: "العنصر", accessor: (l) => ENTITY_LABELS[l.entity_type] || l.entity_type },
    { header: "الوصف", accessor: (l) => l.description || "—" },
  ];

  return (
    <div>
      <PageHeader title="سجل العمليات" subtitle="سجل تدقيق لكل الإضافات والتعديلات والحذف وتسجيلات الدخول" />

      <div className="no-print mb-4 flex flex-wrap gap-3">
        <div className="w-44">
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">كل الإجراءات</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </Select>
        </div>
        <div className="w-52">
          <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
            <option value="all">كل العناصر</option>
            {entities.map((e) => (<option key={e} value={e}>{ENTITY_LABELS[e] || e}</option>))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="لا توجد سجلات مطابقة" />
      ) : (
        <Card className="p-3 sm:p-4">
          <DataTable columns={columns} rows={filtered} />
        </Card>
      )}
    </div>
  );
}
