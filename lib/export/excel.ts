"use client";

import * as XLSX from "xlsx";

/**
 * Exports an array of plain objects to an .xlsx file.
 * Arabic text is plain Unicode data here, so no shaping issues occur
 * (unlike canvas/PDF rendering).
 */
export function exportToExcel(
  rows: Record<string, string | number>[],
  opts: { fileName: string; sheetName?: string }
) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { cellDates: false });
  worksheet["!cols"] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 20 }));
  // RTL sheet view
  worksheet["!margins"] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, opts.sheetName ?? "تقرير");
  (workbook as any).Workbook = { Views: [{ RTL: true }] };

  XLSX.writeFile(workbook, `${opts.fileName}.xlsx`);
}
