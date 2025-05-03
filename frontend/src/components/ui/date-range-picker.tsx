/* eslint-disable max-lines */
'use client';

import React, { type FC, useState, useEffect, useRef, JSX } from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { DateInput } from './date-input';
import { Label } from './label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Switch } from './switch';
import { CheckIcon } from '@radix-ui/react-icons';
import { cn, formatDatePretty } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Separator } from './separator';
import { CalendarFold, CalendarIcon } from 'lucide-react';

export interface DateRangePickerProps {
  /** Click handler for applying the updates from DateRangePicker. */
  onUpdate?: (values: { range: DateRange }) => void;
  /** Initial value for start date */
  initialDateFrom?: Date | string;
  /** Initial value for end date */
  initialDateTo?: Date | string;
  /** Alignment of popover */
  align?: 'start' | 'center' | 'end';
  /** Option for locale */
  locale?: string;
}

const getDateAdjustedForTimezone = (
  dateInput: Date | string | undefined,
): Date | undefined => {
  if (dateInput == null) return undefined;
  if (typeof dateInput === 'string') {
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  return dateInput;
};

interface DateRange {
  from?: Date;
  to?: Date;
}

interface Preset {
  name: string;
  label: string;
}

// Define presets
const PRESETS: Preset[] = [
  { name: 'today', label: 'Hoy' },
  { name: 'yesterday', label: 'Ayer' },
  { name: 'last7', label: 'Últimos 7 días' },
  { name: 'last14', label: 'Últimos 14 días' },
  { name: 'last30', label: 'Últimos 30 días' },
  { name: 'thisWeek', label: 'Esta semana' },
  { name: 'lastWeek', label: 'Semana pasada' },
  { name: 'thisMonth', label: 'Este mes' },
  { name: 'lastMonth', label: 'Mes pasado' },
];

/**
 * DateRangePicker – separates the *committed* range (saved) from the *draft* range (being edited).
 *
 * Behaviour
 *  - If `initialDateFrom/To` are provided → they become the *committed* range and are shown on the button immediately.
 *  - If not provided → the committed range starts **undefined** so the button shows the placeholder «Fechas de publicación».
 *    When the dialog opens we still pre‑populate the calendar with *today → today* so the user has something handy to begin with.
 *  - Clicking «Guardar» copies the draftRange into committedRange **and** fires `onUpdate` (if the range really changed).
 *  - Clicking «Cancelar» or closing the dialog discards the draft.
 */
export const DateRangePicker: FC<DateRangePickerProps> & {
  filePath: string;
} = ({ initialDateFrom, initialDateTo, onUpdate }): JSX.Element => {
  /* ---------------------------------------------------------------------
   * Internal helpers & constants
   * -------------------------------------------------------------------*/
  const buildTodayRange = (): DateRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { from: today, to: today };
  };

  const initialCommitted: DateRange | undefined =
    initialDateFrom != null
      ? {
          from: getDateAdjustedForTimezone(initialDateFrom),
          to:
            getDateAdjustedForTimezone(initialDateTo) ??
            getDateAdjustedForTimezone(initialDateFrom),
        }
      : undefined;

  /**
   * committedRange – what the outside world currently ‘has’.
   * draftRange – what the user is tweaking inside the modal.
   */
  const [committedRange, setCommittedRange] = useState<DateRange | undefined>(
    initialCommitted,
  );
  const [draftRange, setDraftRange] = useState<DateRange>(
    initialCommitted ?? buildTodayRange(),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 960 : false,
  );

  /* ---------------------------------------------------------------------
   * Synchronise external prop changes → committed state
   * -------------------------------------------------------------------*/
  useEffect(() => {
    const updatedCommitted: DateRange | undefined =
      initialDateFrom != null
        ? {
            from: getDateAdjustedForTimezone(initialDateFrom),
            to:
              getDateAdjustedForTimezone(initialDateTo) ??
              getDateAdjustedForTimezone(initialDateFrom),
          }
        : undefined;
    setCommittedRange(updatedCommitted);
  }, [initialDateFrom, initialDateTo]);

  /* ---------------------------------------------------------------------
   * Responsive helper
   * -------------------------------------------------------------------*/
  useEffect(() => {
    const handleResize = (): void => setIsSmallScreen(window.innerWidth < 960);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------------------------------------------------------------------
   * Preset handling
   * -------------------------------------------------------------------*/
  const getPresetRange = (presetName: string): DateRange => {
    const preset = PRESETS.find(({ name }) => name === presetName);
    if (!preset) throw new Error(`Unknown date range preset: ${presetName}`);
    const from = new Date();
    const to = new Date();
    const first = from.getDate() - from.getDay();

    switch (preset.name) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        from.setDate(from.getDate() - 1);
        to.setDate(to.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last14':
        from.setDate(from.getDate() - 13);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last30':
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        from.setDate(first);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        from.setDate(from.getDate() - 7 - from.getDay());
        to.setDate(to.getDate() - to.getDay() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        from.setMonth(from.getMonth() - 1);
        from.setDate(1);
        to.setMonth(to.getMonth() - 1);
        to.setDate(0);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
    }

    return { from, to };
  };

  const setPreset = (presetName: string): void => {
    setDraftRange(getPresetRange(presetName));
  };

  /* ---------------------------------------------------------------------
   * Preset highlight (for the ghost tick ✓)
   * -------------------------------------------------------------------*/
  useEffect(() => {
    const match = PRESETS.find(p => {
      const pr = getPresetRange(p.name);
      return (
        draftRange.from?.setHours(0, 0, 0, 0) ===
          pr.from?.setHours(0, 0, 0, 0) &&
        draftRange.to?.setHours(0, 0, 0, 0) === pr.to?.setHours(0, 0, 0, 0)
      );
    });
    setSelectedPreset(match?.name);
  }, [draftRange]);

  /* ---------------------------------------------------------------------
   * Equality helper – used to decide if we should call onUpdate
   * -------------------------------------------------------------------*/
  const areRangesEqual = (a?: DateRange, b?: DateRange): boolean => {
    if (a == null || b == null) return a === b;
    return (
      a.from?.getTime() === b.from?.getTime() &&
      a.to?.getTime() === b.to?.getTime()
    );
  };

  /* ---------------------------------------------------------------------
   * Modal open/close side‑effects
   * -------------------------------------------------------------------*/
  useEffect(() => {
    if (isOpen) {
      // Every time we open the dialog start the draft from the *committed* range (or today‑today)
      setDraftRange(committedRange ?? buildTodayRange());
    }
  }, [isOpen]);

  /* ---------------------------------------------------------------------
   * Render helpers
   * -------------------------------------------------------------------*/
  const PresetButton = ({
    preset,
    label,
    isSelected,
  }: {
    preset: string;
    label: string;
    isSelected: boolean;
  }): JSX.Element => (
    <Button
      variant='ghost'
      className={cn(isSelected && 'pointer-events-none')}
      onClick={() => setPreset(preset)}
    >
      <span className={cn('pr-2 opacity-0', isSelected && 'opacity-70')}>
        <CheckIcon width={18} height={18} />
      </span>
      {label}
    </Button>
  );

  /* ---------------------------------------------------------------------
   * JSX
   * -------------------------------------------------------------------*/
  return (
    <Dialog open={isOpen} onOpenChange={open => setIsOpen(open)}>
      {/* -----------------------------------------------------------------
       * Trigger Button
       * ---------------------------------------------------------------*/}
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='w-full max-w-full justify-between overflow-hidden text-ellipsis'
        >
          <div className='flex flex-col text-left w-full overflow-hidden p-0 m-0'>
            <div className='truncate'>
              {committedRange?.from
                ? `${formatDatePretty(
                    committedRange.from,
                  )} → ${formatDatePretty(committedRange.to as Date)}`
                : 'Fechas de publicación'}
            </div>
          </div>
          {isOpen ? (
            <CalendarFold className='size-4 opacity-60' />
          ) : (
            <CalendarIcon className='size-4 opacity-60' />
          )}
        </Button>
      </DialogTrigger>

      {/* -----------------------------------------------------------------
       * Dialog Content
       * ---------------------------------------------------------------*/}
      <DialogContent className='w-full max-w-[95vw] sm:min-w-[768px]'>
        <DialogHeader>
          <DialogTitle>Seleccionar rango de fechas</DialogTitle>
        </DialogHeader>
        <Separator className='my-2' />

        {/* Calendar & Presets */}
        <div
          className={cn(
            'flex py-2',
            isSmallScreen ? 'justify-center' : 'justify-between',
          )}
        >
          {/* Draft selectors (calendars & inputs) */}
          <div className='flex'>
            <div className='flex flex-col'>
              <div className='flex flex-col lg:flex-row gap-2 px-3 justify-center items-center lg:items-start pb-4 lg:pb-0'>
                <div className='flex gap-2'>
                  <DateInput
                    value={draftRange.from}
                    onChange={date => {
                      const toDate =
                        !draftRange.to || date > draftRange.to
                          ? date
                          : draftRange.to;
                      setDraftRange({ ...draftRange, from: date, to: toDate });
                    }}
                  />
                  <div className='py-1'>→</div>
                  <DateInput
                    value={draftRange.to}
                    onChange={date => {
                      const fromDate =
                        date < (draftRange.from as Date)
                          ? date
                          : draftRange.from;
                      setDraftRange({
                        ...draftRange,
                        from: fromDate,
                        to: date,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Mobile preset select */}
              {isSmallScreen && (
                <Select
                  defaultValue={selectedPreset}
                  onValueChange={value => setPreset(value)}
                >
                  <SelectTrigger className='w-[180px] mx-auto mb-2'>
                    <SelectValue placeholder='Select...' />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map(p => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Desktop calendars */}
              {!isSmallScreen && (
                <Calendar
                  mode='range'
                  selected={
                    draftRange.from && draftRange.to
                      ? { from: draftRange.from, to: draftRange.to }
                      : undefined
                  }
                  onSelect={(v: { from?: Date; to?: Date } | undefined) => {
                    if (v?.from != null)
                      setDraftRange({ from: v.from, to: v.to ?? v.from });
                  }}
                  numberOfMonths={2}
                  defaultMonth={
                    new Date(new Date().setMonth(new Date().getMonth() - 1))
                  }
                />
              )}
            </div>
          </div>

          {/* Desktop preset buttons */}
          {!isSmallScreen && (
            <div className='flex flex-col items-end'>
              {PRESETS.map(p => (
                <PresetButton
                  key={p.name}
                  preset={p.name}
                  label={p.label}
                  isSelected={selectedPreset === p.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <DialogFooter className='flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              setIsOpen(false); // auto‑discard draft
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              if (!areRangesEqual(draftRange, committedRange)) {
                setCommittedRange(draftRange);
                onUpdate?.({ range: draftRange });
              }
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

DateRangePicker.displayName = 'DateRangePicker';
DateRangePicker.filePath =
  'libs/shared/ui-kit/src/lib/date-range-picker/date-range-picker.tsx';
