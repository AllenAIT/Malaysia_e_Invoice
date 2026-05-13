'use client';
import { useState } from 'react';
import { Invoice, InvoiceItem, db } from '@/lib/db';
import { useRouter } from 'next/navigation';

export function ManualEntry() {
  const router = useRouter();
  const [form, setForm] = useState({
    uuid: '',
    supplierName: '',
    supplierTIN: '',
    totalIncludingTax: '',
    taxAmount: '',
    issueDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'Cash',
    itemDescription: '',
    classificationCode: '030',
  });

  const submit = async () => {
    if (!form.uuid || !form.supplierName || !form.totalIncludingTax) {
      alert('請填寫 UUID、商家名稱、總金額');
      return;
    }
    const total = parseFloat(form.totalIncludingTax);
    const tax = parseFloat(form.taxAmount || '0');
    const item: InvoiceItem = {
      classificationCode: form.classificationCode,
      description: form.itemDescription || form.supplierName,
      quantity: 1,
      unitPrice: total - tax,
      taxAmount: tax,
      totalIncludingTax: total,
    };
    const invoice: Invoice = {
      uuid: form.uuid,
      source: 'manual',
      supplierName: form.supplierName,
      supplierTIN: form.supplierTIN,
      issueDate: new Date(form.issueDate).toISOString(),
      scannedAt: new Date().toISOString(),
      currency: 'MYR',
      totalExcludingTax: total - tax,
      taxAmount: tax,
      totalIncludingTax: total,
      paymentMode: form.paymentMode,
      items: [item],
    };
    const id = await db.invoices.add(invoice);
    router.push(`/invoices/${id}`);
  };

  return (
    <div className="space-y-3">
      <Field label="Unique Identifier No (抽獎用代碼)" value={form.uuid} onChange={v => setForm({ ...form, uuid: v })} placeholder="例：987456789-2021-7654335" />
      <Field label="Supplier Name" value={form.supplierName} onChange={v => setForm({ ...form, supplierName: v })} />
      <Field label="Supplier TIN" value={form.supplierTIN} onChange={v => setForm({ ...form, supplierTIN: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total (RM)" type="number" value={form.totalIncludingTax} onChange={v => setForm({ ...form, totalIncludingTax: v })} />
        <Field label="Tax (RM)" type="number" value={form.taxAmount} onChange={v => setForm({ ...form, taxAmount: v })} />
      </div>
      <Field label="Issue Date" type="date" value={form.issueDate} onChange={v => setForm({ ...form, issueDate: v })} />
      <Field label="Item Description" value={form.itemDescription} onChange={v => setForm({ ...form, itemDescription: v })} />
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Classification</label>
        <select
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          value={form.classificationCode}
          onChange={e => setForm({ ...form, classificationCode: e.target.value })}
        >
          <option value="022">電信服務 022</option>
          <option value="003">電子產品 003</option>
          <option value="030">餐飲 030</option>
          <option value="031">醫療保健 031</option>
          <option value="032">交通 032</option>
          <option value="033">娛樂 033</option>
          <option value="034">服飾 034</option>
          <option value="035">雜貨 035</option>
          <option value="045">其他 045</option>
        </select>
      </div>
      <button onClick={submit} className="w-full rounded-lg bg-brand-500 py-2.5 font-medium text-white hover:bg-brand-600">
        新增發票
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
      />
    </div>
  );
}
