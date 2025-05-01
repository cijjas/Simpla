'use client';

import * as React from 'react';
import { format, Locale, setMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  locale?: Locale;
  yearFrom?: number;
  yearTo?: number;
}

export function DateSelect({
  value,
  onChange,
  placeholder,
  locale = es,
  yearFrom = 2000,
  yearTo = new Date().getFullYear(),
}: Props) {
  const [visibleMonth, setVisibleMonth] = React.useState<number>(
    (value ?? new Date()).getMonth(),
  );
  const [visibleYear, setVisibleYear] = React.useState<number>(
    (value ?? new Date()).getFullYear(),
  );

  const localizedMonths = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      format(setMonth(new Date(), i), 'LLLL', { locale }),
    );
  }, [locale]);

  const YEARS = React.useMemo(() => {
    return Array.from(
      { length: yearTo - yearFrom + 1 },
      (_, i) => yearFrom + i,
    );
  }, [yearFrom, yearTo]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal whitespace-nowrap overflow-hidden text-ellipsis',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value ? (
            format(value, 'PPP', { locale })
          ) : (
            <span>{placeholder || 'Elegir fecha'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-2'>
        <div className='flex gap-2 mb-2'>
          <Select
            defaultValue={visibleMonth.toString()}
            onValueChange={val => setVisibleMonth(parseInt(val))}
          >
            <SelectTrigger className='w-[130px]'>
              <SelectValue placeholder='Mes' />
            </SelectTrigger>
            <SelectContent>
              {localizedMonths.map((month, idx) => (
                <SelectItem key={month} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            defaultValue={visibleYear.toString()}
            onValueChange={val => setVisibleYear(parseInt(val))}
          >
            <SelectTrigger className='w-[100px]'>
              <SelectValue placeholder='Año' />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='rounded-md border'>
          <Calendar
            mode='single'
            locale={locale}
            selected={value}
            onSelect={onChange}
            month={new Date(visibleYear, visibleMonth)}
            onMonthChange={() => {}}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
