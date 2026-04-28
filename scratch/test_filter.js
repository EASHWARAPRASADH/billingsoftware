
const invoices = [
  { invoice_date: '2026-01-18', total_amount: 79.00, status: 'paid' },
  { invoice_date: '2026-01-28', total_amount: 10000.00, status: 'paid' },
  { invoice_date: '2026-04-15', total_amount: 500.00, status: 'paid' }
];

const startDate = '2026-01-01';
const endDate = '2026-01-31';

const filtered = invoices.filter(inv => {
  const date = inv.invoice_date;
  const match = date >= startDate && date <= endDate;
  console.log(`Checking ${date}: ${match}`);
  return match;
});

const total = filtered.reduce((sum, inv) => sum + inv.total_amount, 0);
console.log(`Total: ${total}`);
