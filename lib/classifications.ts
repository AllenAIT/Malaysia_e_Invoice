export const CLASSIFICATIONS: Record<string, { label: string; icon: string; color: string }> = {
  '001': { label: '早期儲蓄', icon: '💰', color: 'bg-amber-100 text-amber-800' },
  '002': { label: '證券交易', icon: '📈', color: 'bg-emerald-100 text-emerald-800' },
  '003': { label: '電子產品', icon: '💻', color: 'bg-blue-100 text-blue-800' },
  '004': { label: '禮品 / 卡片', icon: '🎁', color: 'bg-pink-100 text-pink-800' },
  '005': { label: '佣金', icon: '🤝', color: 'bg-slate-100 text-slate-800' },
  '006': { label: '雜項', icon: '📦', color: 'bg-stone-100 text-stone-800' },
  '007': { label: '出版物', icon: '📚', color: 'bg-indigo-100 text-indigo-800' },
  '008': { label: '專業服務', icon: '💼', color: 'bg-purple-100 text-purple-800' },
  '009': { label: '保險', icon: '🛡️', color: 'bg-cyan-100 text-cyan-800' },
  '010': { label: '回扣 / 折讓', icon: '🏷️', color: 'bg-rose-100 text-rose-800' },
  '011': { label: '訂閱', icon: '🔁', color: 'bg-violet-100 text-violet-800' },
  '022': { label: '電信服務', icon: '📡', color: 'bg-sky-100 text-sky-800' },
  '030': { label: '餐飲', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
  '031': { label: '醫療保健', icon: '⚕️', color: 'bg-red-100 text-red-800' },
  '032': { label: '交通', icon: '🚗', color: 'bg-teal-100 text-teal-800' },
  '033': { label: '娛樂', icon: '🎬', color: 'bg-fuchsia-100 text-fuchsia-800' },
  '034': { label: '服飾', icon: '👕', color: 'bg-lime-100 text-lime-800' },
  '035': { label: '雜貨 / 超市', icon: '🛒', color: 'bg-green-100 text-green-800' },
  '045': { label: '其他', icon: '🗂️', color: 'bg-zinc-100 text-zinc-800' },
};

export function getClassification(code: string) {
  return CLASSIFICATIONS[code] || { label: `代碼 ${code}`, icon: '🏷️', color: 'bg-zinc-100 text-zinc-700' };
}

export function classifyByKeyword(text: string): string {
  const t = (text || '').toLowerCase();
  if (/telco|monthly charge|prepaid|postpaid|sim|data plan|電信/.test(t)) return '022';
  if (/computer|laptop|phone|handphone|tablet|電腦|手機/.test(t)) return '003';
  if (/restaurant|food|meal|nasi|mee|roti|kopi|teh|餐|食/.test(t)) return '030';
  if (/clinic|pharmacy|hospital|medicine|藥|醫/.test(t)) return '031';
  if (/grab|uber|taxi|petrol|fuel|油|車費/.test(t)) return '032';
  if (/cinema|netflix|spotify|concert|電影|娛樂/.test(t)) return '033';
  if (/shirt|dress|pants|shoe|uniqlo|h&m|服飾|衣/.test(t)) return '034';
  if (/grocery|mart|tesco|aeon|jaya|超市|菜/.test(t)) return '035';
  return '045';
}
