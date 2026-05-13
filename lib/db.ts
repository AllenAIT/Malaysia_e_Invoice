import Dexie, { Table } from 'dexie';

export interface InvoiceItem {
  classificationCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxAmount: number;
  totalIncludingTax: number;
}

export interface Invoice {
  id?: number;
  uuid: string;
  documentCode?: string;
  validationUrl?: string;
  source: 'qr' | 'qr+ocr' | 'ocr' | 'manual' | 'consolidated';
  supplierName: string;
  supplierTIN?: string;
  supplierMSIC?: string;
  buyerName?: string;
  buyerTIN?: string;
  eInvoiceType?: string;
  eInvoiceVersion?: string;
  issueDate: string;
  scannedAt: string;
  currency: string;
  totalExcludingTax: number;
  taxAmount: number;
  totalIncludingTax: number;
  taxType?: string;
  taxRate?: number;
  paymentMode?: string;
  billingPeriod?: string;
  digitalSignature?: string;
  items: InvoiceItem[];
  rawQrPayload?: string;
  rawOcrText?: string;
  isSeed?: boolean;
}

export type MatchType = 'exact' | 'suffix7' | 'suffix6' | 'suffix5' | 'suffix4' | 'suffix3';

export interface LotteryPrize {
  tier: string;
  matchType: MatchType;
  number: string;
  amount: number;
}

export interface LotteryDraw {
  id?: number;
  period: string;
  drawnAt: string;
  prizes: LotteryPrize[];
}

export class InvoiceDB extends Dexie {
  invoices!: Table<Invoice, number>;
  draws!: Table<LotteryDraw, number>;

  constructor() {
    super('myinvois-scanner');
    this.version(1).stores({
      invoices: '++id, uuid, issueDate, scannedAt, supplierName, isSeed',
      draws: '++id, period, drawnAt',
    });
  }
}

export const db = new InvoiceDB();
