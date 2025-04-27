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

// ARG date formatter

// src/lib/utils.ts

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en formato amigable en español.
 *
 * @param date - La fecha a formatear
 * @param options - Opciones para mostrar nombre largo o corto
 * @returns La fecha formateada
 */
export function formatDatePretty(
  date: Date,
  { full }: { full?: boolean } = {},
): string {
  if (!date) return '';

  return format(date, full ? 'eeee d MMMM yyyy' : 'eee d MMM yyyy', {
    locale: es,
  });
}
