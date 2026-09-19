import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null, symbol = '$', code = 'USD'): string {
  const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  return `${symbol}${formatted}`;
}

export function formatNumber(value: number | undefined | null, decimals = 0): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: number | undefined | null, decimals = 1): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${num.toFixed(decimals)}%`;
}

export function formatUnits(quantity: number | undefined | null, unitName = 'Units'): string {
  const num = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
  return `${formatNumber(num)} ${unitName}`;
}

export function formatDate(dateString: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function formatDateTime(dateString: string | Date | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}
