/* eslint-disable max-lines */
'use client';

import React, { useState, useEffect, type JSX, forwardRef } from 'react';
import { Button } from './button';
import { Calendar } from './calendar';
import { DateInput } from './date-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
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
import { es } from 'date-fns/locale';

export interface DateRangePickerProps {
  /** Click handler for applying the updates from DateRangePicker. */
  onUpdate?: (values: { range: DateRange }) => void;
  /** Initial value for start date */
  initialDateFrom?: Date | string;
  /** Initial value for end date */
  initialDateTo?: Date | string;
  /** Placeholder text for the date range picker */
  placeholder?: string;
  error?: string;
  /** Optional className for the trigger button */
  className?: string;
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
  { name: 'thisWeek', label: 'Esta semana' },
  { name: 'lastWeek', label: 'Semana pasada' },
  { name: 'thisMonth', label: 'Este mes' },
  { name: 'last7', label: 'Últimos 7 días' },
  { name: 'last30', label: 'Últimos 30 días' },
  { name: 'lastYear', label: 'Último año' },
  { name: 'last4Years', label: 'Últimos 4 años' },
];

/* -----------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------*/
//  1️⃣   “Today” at 00:00 in Buenos Aires (never moves during the session)
const getTodayBA = (): Date => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
    .format(new Date()) // yyyy‑mm‑dd
    .split('-')
    .map(Number);
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};
const TODAY_BA = getTodayBA();

//   2️⃣   Reject any date later than TODAY_BA
const isFuture = (date: Date): boolean => date > TODAY_BA;

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
export const DateRangePicker = forwardRef<
  HTMLButtonElement,
  DateRangePickerProps
>(
  (
    { initialDateFrom, initialDateTo, placeholder, error, onUpdate, className, ...props },
    ref,
  ) => {
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
      const handleResize = (): void =>
        setIsSmallScreen(window.innerWidth < 960);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

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
     * Modal open/close side‑effects
     * -------------------------------------------------------------------*/
    useEffect(() => {
      if (isOpen) {
        // Every time we open the dialog start the draft from the *committed* range (or today‑today)
        setDraftRange(committedRange ?? buildTodayRange());
      }
    }, [isOpen]);

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
        case 'lastYear':
          from.setFullYear(from.getFullYear() - 1);
          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);
          break;
        case 'last4Years':
          from.setFullYear(from.getFullYear() - 4);
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
      isSelected ? (
        <Button
          variant='default'
          className={cn(
            'justify-start w-full transition-all duration-200',
            'bg-primary text-primary-foreground pointer-events-none',
            'shadow-sm'
          )}
        >
          <CheckIcon width={16} height={16} className="mr-2" />
          {label}
        </Button>
      ) : (
        <Button
          variant='ghost'
          className={cn(
            'justify-start w-full transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
          )}
          onClick={() => setPreset(preset)}
        >
          <span className="w-4 mr-2" />
          {label}
        </Button>
      )
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
            ref={ref}
            variant='outline'
            className={cn(
              'bg-card hover:bg-card cursor-pointer w-full max-w-full justify-between overflow-hidden text-ellipsis',
              className,
            )}
          >
            <div className='flex flex-col text-left w-full overflow-hidden p-0 m-0'>
              <div
                className={cn(
                  'truncate',
                  !committedRange?.from && 'text-muted-foreground font-normal',
                )}
              >
                {committedRange?.from
                  ? `${formatDatePretty(
                      committedRange.from,
                    )} → ${formatDatePretty(committedRange.to as Date)}`
                  : placeholder}
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
        <DialogContent
          className='bg-card w-full max-w-[95vw] sm:min-w-[768px] p-0 gap-0'
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <DialogHeader className='p-6 border-b bg-muted/30'>
            <DialogTitle>Seleccionar fecha o rango de fechas</DialogTitle>
          </DialogHeader>

          {/* Main Content */}
          <div className=''>
            {/* Desktop Layout */}
            {!isSmallScreen && (
              <div className='flex gap-6'>
                {/* Left Section: Date Inputs + Calendar */}
                <div className='flex-1 p-4'>
                  {/* Date Range Inputs */}
                  <div className='flex items-center justify-center gap-2 pb-2'>
                    <DateInput
                      value={draftRange.from}
                      onChange={date => {
                        if (isFuture(date)) return;
                        const toDate =
                          !draftRange.to || date > draftRange.to ? date : draftRange.to;
                        setDraftRange({
                          ...draftRange,
                          from: date,
                          to: toDate,
                        });
                      }}
                    />
                    <div className='text-muted-foreground font-medium'>→</div>
                    <DateInput
                      value={draftRange.to}
                      onChange={date => {
                        if (isFuture(date)) return;
                        const fromDate =
                          date < (draftRange.from as Date) ? date : draftRange.from;
                        setDraftRange({
                          ...draftRange,
                          from: fromDate,
                          to: date,
                        });
                      }}
                    />
                  </div>

                  {/* Calendar */}
                  <div className='flex justify-center'>
                    <Calendar
                      mode='range'
                      selected={
                        draftRange.from && draftRange.to
                          ? { from: draftRange.from, to: draftRange.to }
                          : undefined
                      }
                      onSelect={v => {
                        if (v?.from && !isFuture(v.from)) {
                          const safeTo = v.to && !isFuture(v.to) ? v.to : v.from;
                          setDraftRange({ from: v.from, to: safeTo });
                        }
                      }}
                      numberOfMonths={2}
                      defaultMonth={
                        new Date(TODAY_BA.getFullYear(), TODAY_BA.getMonth() - 1)
                      }
                      disabled={isFuture}
                      showOutsideDays={false}
                      styles={{
                        cell: { minWidth: '32px' },
                      }}
                      locale={es}
                    />
                  </div>
                </div>

                {/* Separator */}

                {/* Right Section: Preset Buttons */}
                <div className='min-w-[180px] flex flex-col gap-1 p-4' >
                  {PRESETS.map(p => (
                    <PresetButton
                      key={p.name}
                      preset={p.name}
                      label={p.label}
                      isSelected={selectedPreset === p.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Layout */}
            {isSmallScreen && (
              <>
                {/* Date Range Inputs */}
                <div className='flex items-center justify-center gap-3 mb-6'>
                  <DateInput
                    value={draftRange.from}
                    onChange={date => {
                      if (isFuture(date)) return;
                      const toDate =
                        !draftRange.to || date > draftRange.to ? date : draftRange.to;
                      setDraftRange({
                        ...draftRange,
                        from: date,
                        to: toDate,
                      });
                    }}
                  />
                  <div className='text-muted-foreground font-medium'>→</div>
                  <DateInput
                    value={draftRange.to}
                    onChange={date => {
                      if (isFuture(date)) return;
                      const fromDate =
                        date < (draftRange.from as Date) ? date : draftRange.from;
                      setDraftRange({
                        ...draftRange,
                        from: fromDate,
                        to: date,
                      });
                    }}
                  />
                </div>

                {/* Mobile Preset Select */}
                <div className='mb-6'>
                  <Select
                    defaultValue={selectedPreset}
                    onValueChange={value => setPreset(value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Seleccionar período...' />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.map(p => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Footer buttons */}
          <DialogFooter className='flex justify-end gap-2 p-4 border-t bg-muted/30'>
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
  },
);

DateRangePicker.displayName = 'DateRangePicker';
