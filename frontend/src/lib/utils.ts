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

import { format, parse, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en formato amigable en español.
 *
 * @param date - La fecha a formatear
 * @param options - Opciones para mostrar nombre largo o corto
 * @returns La fecha formateada
 */
const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];
const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/**
 * Formatea una fecha en español sin errores de zona horaria.
 *
 * @param input - Fecha tipo Date o string "YYYY-MM-DD"
 * @param options - { full?: boolean } para formato largo
 * @returns Fecha formateada tipo "mié 24 abr 2024"
 */
export function formatDatePretty(
  input: string | Date,
  { full }: { full?: boolean } = {},
): string {
  if (!input) return '';

  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split('-');
    const d = parseInt(day, 10);
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);

    const date = new Date(y, m, d); // local Date, avoids UTC bug
    const dayName = DAYS_SHORT[date.getDay()];
    const monthName = MONTHS_SHORT[m];

    return full
      ? `${dayName} ${d} de ${monthName} de ${y}`
      : `${dayName} ${d} ${monthName} ${y}`;
  }

  // fallback: format real Date objects
  const date = input instanceof Date ? input : new Date(input);
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const dayName = DAYS_SHORT[date.getDay()];

  return full
    ? `${dayName} ${day} de ${month} de ${year}`
    : `${dayName} ${day} ${month} ${year}`;
}
