import { db, Invoice, LotteryDraw } from './db';
import { generateRiggedDraw } from './lottery';

export const ENVISAGE_INVOICE: Invoice = {
  uuid: '987456789-2021-7654335',
  documentCode: 'INV00012',
  validationUrl: 'https://myinvois.hasil.gov.my/987456789-2021-7654335',
  source: 'qr+ocr',
  supplierName: 'Envisage Telco Sdn Bhd',
  supplierTIN: 'C135456789123',
  supplierMSIC: '61902',
  buyerName: 'Rajesh A/L Kumar',
  buyerTIN: 'IG678654321123',
  eInvoiceType: '01',
  eInvoiceVersion: '1.1',
  issueDate: '2024-08-07T02:36:20.000Z',
  scannedAt: '2024-08-07T03:00:00.000Z',
  currency: 'MYR',
  totalExcludingTax: 75.0,
  taxAmount: 4.5,
  totalIncludingTax: 79.5,
  taxType: 'Service Tax',
  taxRate: 6.0,
  paymentMode: 'Credit Card',
  billingPeriod: '1 Aug 2024 – 31 Aug 2024',
  digitalSignature: '9e83e05bbf9b5db17ac0deec3b7ce6cba983f6dc50531c7a919f28d5fb369etc3',
  items: [
    { classificationCode: '022', description: 'Monthly charges – G60', quantity: 1, unitPrice: 60.0, taxAmount: 3.6, totalIncludingTax: 63.6 },
    { classificationCode: '022', description: 'Other charges',         quantity: 1, unitPrice: 15.0, taxAmount: 0.9, totalIncludingTax: 15.9 },
  ],
  isSeed: true,
};

const EXTRA_SEEDS: Invoice[] = [
  {
    uuid: 'XWFGVZ6RSMACJRAZM1QR448J10',
    documentCode: '00000001',
    validationUrl: 'https://myinvois.hasil.gov.my/XWFGVZ6RSMACJRAZM1QR448J10',
    source: 'qr+ocr',
    supplierName: 'ABSS Connect Demo 3',
    supplierTIN: 'C10285856100',
    supplierMSIC: '00000',
    buyerName: 'Customer A',
    buyerTIN: '20103245678',
    eInvoiceType: '01',
    eInvoiceVersion: '1.1',
    issueDate: '2024-09-19T11:21:15.000Z',
    scannedAt: '2024-09-19T11:30:00.000Z',
    currency: 'MYR',
    totalExcludingTax: 2500.0,
    taxAmount: 250.0,
    totalIncludingTax: 2750.0,
    taxType: 'Sales Tax',
    taxRate: 10.0,
    paymentMode: 'Cheque',
    digitalSignature: 'XWFGVZ6RSMACJRAZM1QR448J10',
    items: [
      { classificationCode: '003', description: 'Computer',     quantity: 1, unitPrice: 1000.0, taxAmount: 100.0, totalIncludingTax: 1100.0 },
      { classificationCode: '003', description: 'Handphone X1', quantity: 1, unitPrice: 1500.0, taxAmount: 150.0, totalIncludingTax: 1650.0 },
    ],
    isSeed: true,
  },
  {
    uuid: 'A1B2-C3D4-E5F6-G7H8-DEMO99X',
    documentCode: 'CAFE-0042',
    validationUrl: 'https://myinvois.hasil.gov.my/A1B2C3D4E5F6G7H8DEMO99X',
    source: 'ocr',
    supplierName: 'Kopi Tiam Heritage',
    supplierTIN: 'C200300400500',
    supplierMSIC: '56101',
    eInvoiceType: '01',
    eInvoiceVersion: '1.1',
    issueDate: '2024-09-22T08:15:00.000Z',
    scannedAt: '2024-09-22T08:16:00.000Z',
    currency: 'MYR',
    totalExcludingTax: 18.4,
    taxAmount: 1.1,
    totalIncludingTax: 19.5,
    taxType: 'Service Tax',
    taxRate: 6.0,
    paymentMode: 'Cash',
    items: [
      { classificationCode: '030', description: 'Nasi Lemak Set', quantity: 1, unitPrice: 12.0, taxAmount: 0.72, totalIncludingTax: 12.72 },
      { classificationCode: '030', description: 'Teh Tarik',      quantity: 2, unitPrice: 3.2,  taxAmount: 0.38, totalIncludingTax: 6.78 },
    ],
    isSeed: true,
  },
  {
    uuid: 'GROCERY-2024-09-AEON-K7M3',
    documentCode: 'AEON-K7M3',
    validationUrl: 'https://myinvois.hasil.gov.my/GROCERY2024-09AEONK7M3',
    source: 'qr+ocr',
    supplierName: 'AEON Mid Valley',
    supplierTIN: 'C123456000777',
    supplierMSIC: '47190',
    eInvoiceType: '01',
    eInvoiceVersion: '1.1',
    issueDate: '2024-09-12T19:45:00.000Z',
    scannedAt: '2024-09-12T20:00:00.000Z',
    currency: 'MYR',
    totalExcludingTax: 142.5,
    taxAmount: 0,
    totalIncludingTax: 142.5,
    taxType: 'None',
    taxRate: 0,
    paymentMode: 'Credit Card',
    items: [
      { classificationCode: '035', description: 'Fresh Milk 2L',      quantity: 2, unitPrice: 12.9, taxAmount: 0, totalIncludingTax: 25.8 },
      { classificationCode: '035', description: 'Sourdough Bread',    quantity: 1, unitPrice: 14.5, taxAmount: 0, totalIncludingTax: 14.5 },
      { classificationCode: '035', description: 'Vegetables Bundle',  quantity: 1, unitPrice: 22.8, taxAmount: 0, totalIncludingTax: 22.8 },
      { classificationCode: '035', description: 'Chicken Breast 1kg', quantity: 1, unitPrice: 18.4, taxAmount: 0, totalIncludingTax: 18.4 },
      { classificationCode: '035', description: 'Rice 5kg',           quantity: 1, unitPrice: 31.0, taxAmount: 0, totalIncludingTax: 31.0 },
      { classificationCode: '035', description: 'Misc. Groceries',    quantity: 1, unitPrice: 30.0, taxAmount: 0, totalIncludingTax: 30.0 },
    ],
    isSeed: true,
  },
];

async function seedDemo(): Promise<void> {
  await db.invoices.add(ENVISAGE_INVOICE);
  const draw: LotteryDraw = {
    period: '2024-09 / 10',
    drawnAt: new Date('2024-10-25T00:00:00.000Z').toISOString(),
    prizes: generateRiggedDraw(ENVISAGE_INVOICE.uuid, '特別獎'),
  };
  await db.draws.add(draw);
}

export async function seedIfEmpty(): Promise<boolean> {
  const count = await db.invoices.count();
  if (count > 0) return false;
  await seedDemo();
  return true;
}

export async function resetToDemo(): Promise<void> {
  await db.invoices.clear();
  await db.draws.clear();
  await seedDemo();
}

// Kept for reference / future "load more samples" feature
export const SAMPLE_INVOICES: Invoice[] = EXTRA_SEEDS;
