'use client';

import { useState } from 'react';
import {
  addMonths,
  subMonths,
  getMonth,
  getYear,
  setMonth,
  setYear,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn, formatDatePretty } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';

interface DateRangePopoverPickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const today = new Date();

const years = Array.from(
  { length: getYear(today) - 1810 + 1 },
  (_, i) => 1810 + i,
);

export function DateRangePopoverPicker({
  value,
  onChange,
}: DateRangePopoverPickerProps) {
  const [fromMonth, setFromMonth] = useState<Date>(
    value?.from ?? subMonths(today, 1),
  );
  const [toMonth, setToMonth] = useState<Date>(value?.to ?? today);

  const nextMonthOf = (date: Date) => addMonths(date, 1);

  const applyMonthYear = (date: Date, m?: number, y?: number) => {
    const withMonth = m !== undefined ? setMonth(date, m) : date;
    return y !== undefined ? setYear(withMonth, y) : withMonth;
  };

  const setFrom = (m?: number, y?: number) => {
    const newFrom = applyMonthYear(fromMonth, m, y);
    const minTo = nextMonthOf(newFrom);
    setFromMonth(newFrom);
    if (toMonth < minTo) setToMonth(minTo);
  };

  const setTo = (m?: number, y?: number) => {
    const tentative = applyMonthYear(toMonth, m, y);
    const minTo = nextMonthOf(fromMonth);
    setToMonth(
      tentative < minTo ? minTo : tentative > today ? today : tentative,
    );
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range.to && range.to < nextMonthOf(range.from)) return;
    if (range?.to && range.to > today) return;
    onChange(range?.from ? range : undefined);
  };

  const minRightCalendarMonth = nextMonthOf(fromMonth);

  const isFutureDate = (date: Date) => date > today;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-between overflow-hidden text-ellipsis whitespace-nowrap',
            !value?.from && 'text-muted-foreground',
          )}
        >
          {value?.from
            ? value.to
              ? `${formatDatePretty(value.from)} → ${formatDatePretty(
                  value.to,
                )}`
              : formatDatePretty(value.from)
            : 'Seleccionar fecha o rango'}
          <CalendarIcon className='ml-2 h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent align='start' className='w-auto p-4 space-y-4'>
        <div className='flex flex-wrap gap-2'>
          {/* Calendario Desde */}
          <div className='flex flex-col gap-2'>
            <span className='text-xs font-semibold'>Desde</span>
            <div className='flex gap-2'>
              <Select
                value={months[getMonth(fromMonth)]}
                onValueChange={m => setFrom(months.indexOf(m))}
              >
                <SelectTrigger className='w-[120px]'>
                  <SelectValue placeholder='Mes' />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, idx) => {
                    const date = applyMonthYear(
                      fromMonth,
                      idx,
                      getYear(fromMonth),
                    );
                    return (
                      <SelectItem
                        key={m}
                        value={m}
                        disabled={isFutureDate(date)}
                      >
                        {m}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                value={String(getYear(fromMonth))}
                onValueChange={y => setFrom(undefined, parseInt(y))}
              >
                <SelectTrigger className='w-[100px]'>
                  <SelectValue placeholder='Año' />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => {
                    const date = applyMonthYear(
                      fromMonth,
                      getMonth(fromMonth),
                      y,
                    );
                    return (
                      <SelectItem
                        key={y}
                        value={String(y)}
                        disabled={isFutureDate(date)}
                      >
                        {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Calendar
              className='rounded-md border text-sm'
              mode='range'
              month={fromMonth}
              selected={value}
              onMonthChange={d => setFromMonth(d)}
              onSelect={handleSelect}
              fromDate={new Date(1810, 0, 1)}
              toDate={today}
              initialFocus
            />
          </div>

          {/* Calendario Hasta */}
          <div className='flex flex-col gap-2'>
            <span className='text-xs font-semibold'>Hasta</span>
            <div className='flex gap-2'>
              <Select
                value={months[getMonth(toMonth)]}
                onValueChange={m => setTo(months.indexOf(m))}
              >
                <SelectTrigger className='w-[120px]'>
                  <SelectValue placeholder='Mes' />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, idx) => {
                    const date = applyMonthYear(toMonth, idx, getYear(toMonth));
                    const disabled =
                      date < minRightCalendarMonth || isFutureDate(date);
                    return (
                      <SelectItem key={m} value={m} disabled={disabled}>
                        {m}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                value={String(getYear(toMonth))}
                onValueChange={y => setTo(undefined, parseInt(y))}
              >
                <SelectTrigger className='w-[100px]'>
                  <SelectValue placeholder='Año' />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => {
                    const date = applyMonthYear(toMonth, getMonth(toMonth), y);
                    const disabled =
                      date < minRightCalendarMonth || isFutureDate(date);
                    return (
                      <SelectItem key={y} value={String(y)} disabled={disabled}>
                        {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Calendar
              className='rounded-md border text-sm'
              mode='range'
              month={toMonth}
              selected={value}
              onMonthChange={d => setToMonth(d)}
              onSelect={handleSelect}
              fromDate={minRightCalendarMonth}
              toDate={today}
            />
          </div>
        </div>

        {/* Botones finales */}
        <div className='flex justify-between gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              onChange(undefined);
              setFromMonth(subMonths(today, 1));
              setToMonth(today);
            }}
          >
            Limpiar
          </Button>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={!value?.from}
              onClick={() => {
                if (!value?.from) return;
                onChange({ from: value.from, to: today });
                setToMonth(today);
              }}
            >
              Hasta hoy
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onChange({ from: today, to: today })}
            >
              Hoy
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
