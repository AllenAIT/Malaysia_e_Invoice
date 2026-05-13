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

// Skip these when guessing supplier name from the first lines
const SUPPLIER_NOISE = /^(for\s+illustration|illustration\s+purposes|purposes\s+only|e-?\s*invoice|validated\s+invoice|tax\s+invoice|receipt|invoice)$/i;
const SUPPLIER_HINTS = /\b(sdn\s*bhd|pte\s*ltd|berhad|enterprise|restoran|kopitiam|cafe|trading|holdings|services|company|co\.?\s*ltd)\b/i;

function detectSupplier(lines: string[]): string | undefined {
  // First try: any line containing a Malaysian company suffix
  for (const raw of lines) {
    const t = raw.trim();
    if (t.length >= 3 && t.length < 80 && SUPPLIER_HINTS.test(t)) return t;
  }
  // Fallback: first non-noise line in the top of the file
  for (const raw of lines.slice(0, 8)) {
    const t = raw.trim();
    if (t.length < 3 || t.length > 80) continue;
    if (SUPPLIER_NOISE.test(t)) continue;
    if (/^(supplier|buyer|payment|invoice|document|unique|tax|total|subtotal|date|paid|signature|classification|description|quantity|amount|disc|frequency|billing|original)\b/i.test(t)) continue;
    if (/^\d/.test(t)) continue; // looks like address / phone
    return t;
  }
  return undefined;
}

export function parseInvoiceText(text: string): ParsedOCR {
  const out: ParsedOCR = { rawText: text, items: [] };
  const lines = text.split(/\r?\n/);

  out.supplierName = detectSupplier(lines);

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
      const m = line.match(/(?:Document\s+code|e-?invoice\s+code)[:\s]+([A-Za-z0-9-]+)/i);
      if (m) out.documentCode = m[1];
    }
    if (!out.supplierMSIC) {
      const m = line.match(/MSIC\s+code[:\s]+(\d+)/i);
      if (m) out.supplierMSIC = m[1];
    }
    if (!out.issueDate) {
      const m = line.match(/Invoice\s+Date[^:]*:\s*([\d/\-:.\s]+)/i);
      if (m) out.issueDate = m[1].trim();
    }
    if (out.totalIncludingTax === undefined) {
      const m = line.match(/Total\s+including\s+tax[^0-9]*RM?\s*([\d,.]+)/i);
      if (m) out.totalIncludingTax = numFromRm(m[1]);
    }
    if (out.totalIncludingTax === undefined) {
      const m = line.match(/Total\s+payable\s+amount[^0-9]*RM?\s*([\d,.]+)/i);
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

  // Line items: 3-digit classification code, then description, qty, then a series of RM amounts
  // We collect ALL "RM XX.XX" values and treat the LAST as total, second-to-last as tax
  for (const line of lines) {
    const head = line.match(/^\s*(\d{3})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!head) continue;
    const [, code, desc, qty, rest] = head;
    if (!/RM/i.test(rest)) continue;
    const amounts = Array.from(rest.matchAll(/RM\s*([\d,.]+)/gi))
      .map(m => numFromRm(m[1]))
      .filter(n => n > 0);
    if (amounts.length < 1) continue;
    const unitPrice = amounts[0];
    const totalIncludingTax = amounts[amounts.length - 1];
    const taxAmount = amounts.length >= 3 ? amounts[amounts.length - 2] : 0;

    // Sanity check: if total is implausibly larger than unitPrice * qty * 50, the OCR likely dropped a decimal.
    // Fall back to unitPrice * qty + tax.
    const q = parseFloat(qty);
    const expectedRoughly = unitPrice * q;
    const looksWrong = expectedRoughly > 0 && totalIncludingTax > expectedRoughly * 5 + 100;
    const finalTotal = looksWrong ? unitPrice * q + taxAmount : totalIncludingTax;

    out.items.push({
      classificationCode: code,
      description: desc.trim(),
      quantity: q,
      unitPrice,
      taxAmount,
      totalIncludingTax: finalTotal,
    });
  }

  return out;
}
