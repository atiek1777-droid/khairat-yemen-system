"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Renders a DOM element (already shaped, RTL Arabic text and all) to a
 * canvas snapshot and embeds it into a PDF. This sidesteps jsPDF's lack
 * of native Arabic glyph shaping — the browser does the text layout,
 * we just capture the pixels.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  opts: { fileName: string; orientation?: "portrait" | "landscape" }
) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const orientation = opts.orientation ?? "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${opts.fileName}.pdf`);
}
