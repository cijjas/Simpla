import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait = 300,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let t: NodeJS.Timeout;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };

  const cancel = () => clearTimeout(t);

  return Object.assign(debounced, { cancel });
}
