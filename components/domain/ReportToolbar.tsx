"use client";

import { useState, type RefObject } from "react";
import { Printer, FileDown, FileSpreadsheet, MessageCircle, Loader2 } from "lucide-react";
import { exportElementToPdf } from "@/lib/export/pdf";
import { exportToExcel } from "@/lib/export/excel";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export function ReportToolbar({
  targetRef,
  fileName,
  excelRows,
  whatsappMessage,
  onExported,
}: {
  targetRef: RefObject<HTMLElement>;
  fileName: string;
  excelRows?: Record<string, string | number>[];
  whatsappMessage?: string;
  onExported?: (action: "print" | "pdf" | "excel" | "whatsapp") => void;
}) {
  const [exportingPdf, setExportingPdf] = useState(false);

  function handlePrint() {
    onExported?.("print");
    window.print();
  }

  async function handlePdf() {
    if (!targetRef.current) return;
    setExportingPdf(true);
    try {
      await exportElementToPdf(targetRef.current, { fileName });
      onExported?.("pdf");
    } finally {
      setExportingPdf(false);
    }
  }

  function handleExcel() {
    if (!excelRows || excelRows.length === 0) return;
    exportToExcel(excelRows, { fileName });
    onExported?.("excel");
  }

  function handleWhatsApp() {
    if (!whatsappMessage) return;
    onExported?.("whatsapp");
    window.open(buildWhatsAppLink(whatsappMessage), "_blank");
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button onClick={handlePrint} className="btn-outline">
        <Printer className="h-4 w-4" /> طباعة
      </button>
      <button onClick={handlePdf} disabled={exportingPdf} className="btn-outline">
        {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        PDF
      </button>
      {excelRows && (
        <button onClick={handleExcel} className="btn-outline">
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </button>
      )}
      {whatsappMessage && (
        <button onClick={handleWhatsApp} className="btn-gold">
          <MessageCircle className="h-4 w-4" /> مشاركة واتساب
        </button>
      )}
    </div>
  );
}
