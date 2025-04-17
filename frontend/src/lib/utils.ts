import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait = 300,
) {
  let t: NodeJS.Timeout;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  // @ts-ignore
  debounced.cancel = () => clearTimeout(t);
  return debounced as T & { cancel: () => void };
}
