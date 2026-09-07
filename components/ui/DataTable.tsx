"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
  /** Shown as the primary line in the mobile card view */
  mobilePrimary?: boolean;
}

/**
 * Responsive table: a real <table> on larger screens, and a stacked
 * card list on phones so nothing gets squeezed or requires pinch-zoom.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyMessage = "لا توجد بيانات لعرضها",
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-navy-400">{emptyMessage}</p>;
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-navy-400">
              {columns.map((col, i) => (
                <th key={i} className={cn("px-3 py-2.5 text-right font-bold", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-navy-50 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-navy-50/60"
                )}
              >
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-3 py-3 text-navy-800", col.className)}>
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2.5 sm:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={cn("rounded-xl border border-navy-100 bg-white p-3.5", onRowClick && "active:bg-navy-50")}
          >
            {columns.map((col, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between gap-3 py-1",
                  col.mobilePrimary && "border-b border-navy-50 pb-2 mb-1"
                )}
              >
                <span className="text-xs font-bold text-navy-400">{col.header}</span>
                <span
                  className={cn(
                    "text-sm text-navy-800",
                    col.mobilePrimary && "text-[15px] font-bold text-navy-900"
                  )}
                >
                  {col.accessor(row)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
