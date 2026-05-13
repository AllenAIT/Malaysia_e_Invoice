export const formatRM = (amount: number) =>
  new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-MY', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(iso));

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
