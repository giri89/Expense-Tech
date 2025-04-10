export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[₹,]/g, ''));
};