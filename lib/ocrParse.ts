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

const SUPPLIER_NOISE = /^(for\s+illustration|illustration\s+purposes|purposes\s+only|e-?\s*invoice$|validated\s+invoice|tax\s+invoice|^receipt$|^invoice$)/i;
const SUPPLIER_HINTS = /\b(sdn\s*bhd|pte\s*ltd|berhad|enterprise|restoran|kopitiam|cafe|trading|holdings|services|company|co\.?\s*ltd|premier|store|mart|shop|hotel|clinic|pharmacy|studio|salon)\b/i;
const FIELD_LABEL = /^(supplier|buyer|payment|invoice|document|unique|tax|total|subtotal|date|paid|signature|classification|description|quantity|amount|disc|frequency|billing|original|exchange|currency)\b/i;

function detectSupplier(lines: string[]): string | undefined {
  // Pass 1: lines containing a Malaysian company suffix anywhere in the top 12 lines
  for (const raw of lines.slice(0, 12)) {
    const t = raw.trim();
    if (t.length >= 3 && t.length < 80 && SUPPLIER_HINTS.test(t)) return t;
  }
  // Pass 2: first clean line in the top 8 lines
  for (const raw of lines.slice(0, 8)) {
    const t = raw.trim();
    if (t.length < 3 || t.length > 80) continue;
    if (SUPPLIER_NOISE.test(t)) continue;
    if (FIELD_LABEL.test(t)) continue;
    if (/^\d/.test(t)) continue;           // address / phone / TIN
    if (/@/.test(t)) continue;             // email
    if (/^[A-Z]\d{8,}/.test(t)) continue;  // TIN-like
    return t;
  }
  return undefined;
}

function pick(text: string, re: RegExp): string | undefined {
  const m = text.match(re);
  return m ? m[1].trim() : undefined;
}

function pickNum(text: string, re: RegExp): number | undefined {
  const m = text.match(re);
  return m ? numFromRm(m[1]) : undefined;
}

export function parseInvoiceText(text: string): ParsedOCR {
  const out: ParsedOCR = { rawText: text, items: [] };
  const lines = text.split(/\r?\n/);

  out.supplierName = detectSupplier(lines);

  // Label-value matches operate on full text since values often wrap to the next line
  // due to invoice table layouts. \s in JS regex matches \n by default.
  out.uuid          = pick(text, /Unique\s+Identifier\s+No[:\s]+([A-Za-z0-9-]+)/i);
  out.supplierTIN   = pick(text, /Supplier\s+TIN[:\s]+([A-Za-z0-9]+)/i);
  out.buyerTIN      = pick(text, /Buyer\s+TIN[:\s]+([A-Za-z0-9]+)/i);
  out.documentCode  = pick(text, /(?:Document\s+code|e-?\s*invoice\s+code)[:\s]+([A-Za-z0-9-]+)/i);
  out.supplierMSIC  = pick(text, /MSIC\s+code[:\s]+(\d+)/i);

  // Date — try multiple formats
  out.issueDate = pick(text, /Invoice\s+Date[^:]*:\s*([\d/\-:.\s]+?)(?:\n|$)/i)
              || pick(text, /Billing\s+Period[:\s]+([\d/\-]+\s*[-–]\s*[\d/\-]+)/i)
              || pick(text, /Date\s+and\s+Time\s+of\s+Validation[:\s]+([\d/\-:.\s]+?)(?:\n|$)/i);

  // Totals — allow up to 80 chars (incl. newlines) between label and number to handle table cells
  out.totalIncludingTax = pickNum(text, /Total\s+including\s+tax[\s\S]{0,80}?RM\s*([\d,.]+)/i)
                       ?? pickNum(text, /Total\s+payable\s+amount[\s\S]{0,80}?RM\s*([\d,.]+)/i);
  out.totalExcludingTax = pickNum(text, /Total\s+excluding\s+tax[\s\S]{0,80}?RM\s*([\d,.]+)/i);
  out.taxAmount         = pickNum(text, /Tax\s+amount[\s\S]{0,80}?RM\s*([\d,.]+)/i);

  out.paymentMode = pick(text, /(?:Payment\s+mode|Paid\s+by)[\s\-:]*([^\n]+)/i)?.split(/\s{2,}/)[0];

  // Line items — scan per line; LAST RM is total, second-to-last is tax
  for (const line of lines) {
    const head = line.match(/^\s*(\d{3})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!head) continue;
    const [, code, desc, qty, rest] = head;
    if (!/RM/i.test(rest)) continue;
    const amounts = Array.from(rest.matchAll(/RM\s*([\d,.]+)/gi)).map(am => numFromRm(am[1]));
    if (amounts.length < 1) continue;
    const unitPrice = amounts[0];
    const totalIncludingTax = amounts[amounts.length - 1];
    const taxAmount = amounts.length >= 3 ? amounts[amounts.length - 2] : 0;

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
