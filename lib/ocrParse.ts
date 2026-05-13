import { InvoiceItem } from './db';

export interface ParsedOCR {
  uuid?: string;
  supplierName?: string;
  supplierTIN?: string;
  supplierMSIC?: string;
  buyerName?: string;
  buyerTIN?: string;
  documentCode?: string;
  issueDate?: string;
  totalExcludingTax?: number;
  taxAmount?: number;
  totalIncludingTax?: number;
  paymentMode?: string;
  items: InvoiceItem[];
  rawText: string;
}

const numFromRm = (s: string): number => {
  const m = s.replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
};

export function parseInvoiceText(text: string): ParsedOCR {
  const out: ParsedOCR = { rawText: text, items: [] };
  const lines = text.split(/\r?\n/);

  // Heuristic: supplier name often appears on first non-empty line
  const firstLine = lines.find(l => l.trim().length > 2);
  if (firstLine && !firstLine.toLowerCase().includes('invoice')) {
    out.supplierName = firstLine.trim();
  }

  for (const line of lines) {
    if (!out.uuid) {
      const m = line.match(/Unique\s+Identifier\s+No[:\s]+([A-Za-z0-9-]+)/i);
      if (m) out.uuid = m[1];
    }
    if (!out.supplierTIN) {
      const m = line.match(/Supplier\s+TIN[:\s]+([A-Za-z0-9]+)/i);
      if (m) out.supplierTIN = m[1];
    }
    if (!out.buyerTIN) {
      const m = line.match(/Buyer\s+TIN[:\s]+([A-Za-z0-9]+)/i);
      if (m) out.buyerTIN = m[1];
    }
    if (!out.documentCode) {
      const m = line.match(/Document\s+code[:\s]+([A-Za-z0-9-]+)/i);
      if (m) out.documentCode = m[1];
    }
    if (!out.supplierMSIC) {
      const m = line.match(/MSIC\s+code[:\s]+(\d+)/i);
      if (m) out.supplierMSIC = m[1];
    }
    if (!out.issueDate) {
      const m = line.match(/Invoice\s+Date[^:]*:\s*(\d{2}\/\d{2}\/\d{4}[^\n]*)/i);
      if (m) out.issueDate = m[1].trim();
    }
    if (out.totalIncludingTax === undefined) {
      const m = line.match(/Total\s+including\s+tax[^0-9]*RM?\s*([\d,.]+)/i);
      if (m) out.totalIncludingTax = numFromRm(m[1]);
    }
    if (out.totalExcludingTax === undefined) {
      const m = line.match(/Total\s+excluding\s+tax[^0-9]*RM?\s*([\d,.]+)/i);
      if (m) out.totalExcludingTax = numFromRm(m[1]);
    }
    if (out.taxAmount === undefined) {
      const m = line.match(/^\s*Tax\s+amount[^0-9]*RM?\s*([\d,.]+)/i);
      if (m) out.taxAmount = numFromRm(m[1]);
    }
    if (out.paymentMode === undefined) {
      const m = line.match(/(?:Payment\s+mode|Paid\s+by)[\s\-]*[:\-]?\s*(.+)/i);
      if (m) out.paymentMode = m[1].split(/\s{2,}/)[0].trim();
    }
  }

  for (const line of lines) {
    const m = line.match(/^\s*(\d{3})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+RM?\s*([\d,.]+)\s+RM?\s*([\d,.]+)/i);
    if (m) {
      out.items.push({
        classificationCode: m[1],
        description: m[2].trim(),
        quantity: parseFloat(m[3]),
        unitPrice: numFromRm(m[4]),
        taxAmount: 0,
        totalIncludingTax: numFromRm(m[5]),
      });
    }
  }

  return out;
}
