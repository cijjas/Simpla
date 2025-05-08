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

/* ──────── DATE FORMATTERS FOR ARG 🇦🇷 ──────── */

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
 * Safely parses a "YYYY-MM-DD" date string as local Date
 */
export function parseArgDate(input: string): Date {
  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha en español sin errores de zona horaria.
 * Ej: "mié 24 abr 2024"
 */
export function formatDatePretty(
  input: string | Date,
  { full }: { full?: boolean } = {},
): string {
  if (!input) return '';

  const date =
    typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? parseArgDate(input)
      : input instanceof Date
      ? input
      : new Date(input);

  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const dayName = DAYS_SHORT[date.getDay()];

  return full
    ? `${dayName} ${day} de ${month} de ${year}`
    : `${dayName} ${day} ${month} ${year}`;
}

/**
 * Devuelve una fecha como "dd/mm/yyyy" sin errores UTC
 */
export function formatDateSlash(
  input: string | Date,
  { full }: { full?: boolean } = {},
): string {
  if (!input) return '';

  const date =
    typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? parseArgDate(input)
      : input instanceof Date
      ? input
      : new Date(input);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return full
    ? `${day}/${month}/${year}`
    : `${String(day).padStart(2, '0')}/${String(month).padStart(
        2,
        '0',
      )}/${year}`;
}

/**
 * Ej: "Publicado en el Boletín Oficial nro 123 • pág 4 el mié 24 abr 2024"
 */
export function formatBoletinInfo(
  nro?: string | null,
  pag?: string | null,
  fecha?: string | null,
): string | null {
  if (!nro && !pag && !fecha) return null;
  const fechaFormatted = fecha ? formatDatePretty(fecha, { full: true }) : '';
  return `Publicado en el Boletín Oficial${nro ? ` nro ${nro}` : ''}${
    pag ? ` • pág ${pag}` : ''
  }${fechaFormatted ? ` el ${fechaFormatted}` : ''}`;
}
