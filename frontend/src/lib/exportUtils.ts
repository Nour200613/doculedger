import * as XLSX from "xlsx";
import { InvoiceData, LineItem } from "@/types";

export function exportToExcel(invoice: InvoiceData, customFileName?: string) {
  const wb = XLSX.utils.book_new();

  // 1. Prepare Header Summary Rows
  const summaryRows = [
    ["DocuLedger AI - Audited Invoice Extraction"],
    [],
    ["Document File:", invoice.fileName],
    ["Vendor:", invoice.vendorName],
    ["Invoice Number:", invoice.invoiceNumber],
    ["Invoice Date:", invoice.invoiceDate],
    ["Due Date:", invoice.dueDate],
    ["Currency:", invoice.currency],
    ["Math Audit Status:", invoice.mathAuditPassed ? "PASSED (100% Match)" : "FLAGGED FOR REVIEW"],
    ["Overall OCR Confidence:", `${Math.round(invoice.overallConfidence * 100)}%`],
    [],
    // Table Headers
    ["#", "Line Item Description", "Quantity", "Unit Price", "VAT Rate", "VAT Amount", "Line Total", "Confidence"],
  ];

  // 2. Line Items Data
  const itemRows = invoice.lineItems.map((item: LineItem, index: number) => [
    index + 1,
    item.itemDescription,
    item.quantity,
    item.unitPrice,
    `${(item.taxRate * 100).toFixed(0)}%`,
    item.taxAmount,
    item.total,
    `${Math.round(
      ((item.confidenceScores.itemDescription +
        item.confidenceScores.quantity +
        item.confidenceScores.unitPrice +
        item.confidenceScores.total) /
        4) *
        100
    )}%`,
  ]);

  // 3. Totals
  const totalRows = [
    [],
    ["", "", "", "", "", "Subtotal:", invoice.subtotal],
    ["", "", "", "", "", `VAT Total (${(invoice.vatRate * 100).toFixed(0)}%):`, invoice.vatTotal],
    ["", "", "", "", "", "Calculated Total:", invoice.totalAmount],
  ];

  const fullSheetData = [...summaryRows, ...itemRows, ...totalRows];

  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Set column widths
  ws["!cols"] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 16 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Invoice Data");

  const fileName = customFileName || `${invoice.fileName.replace(/\.[^/.]+$/, "")}_extracted.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportToCSV(invoice: InvoiceData, customFileName?: string) {
  const wb = XLSX.utils.book_new();

  const data = invoice.lineItems.map((item, index) => ({
    Index: index + 1,
    Description: item.itemDescription,
    Quantity: item.quantity,
    UnitPrice: item.unitPrice,
    VatRate: `${(item.taxRate * 100).toFixed(0)}%`,
    VatAmount: item.taxAmount,
    Total: item.total,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const fileName = customFileName || `${invoice.fileName.replace(/\.[^/.]+$/, "")}_extracted.csv`;
  XLSX.writeFile(wb, fileName, { bookType: "csv" });
}
