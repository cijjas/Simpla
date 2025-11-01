"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useTimescape } from "timescape/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"

const timePickerInputBase =
  "shadow-none font-serif font-bold text-card-foreground p-1 inline tabular-nums h-fit border-none outline-none select-none content-box caret-transparent rounded-sm min-w-8 text-center focus:bg-muted focus-visible:ring-1 focus-visible:outline-none"

type DateFormat = "days" | "months" | "years"
type InputPlaceholders = Record<DateFormat, string>
const INPUT_PLACEHOLDERS: InputPlaceholders = {
  months: "MM",
  days: "DD",
  years: "YYYY",
}

interface DateInputProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  maxDate?: Date
  className?: string
}

function DateInput({ value, onChange, maxDate, className }: DateInputProps) {
  const isUpdatingFromProp = React.useRef(false)
  const prevValue = React.useRef<Date | undefined>(value)

  const handleDateChange = React.useCallback(
    (nextDate: Date | undefined) => {
      if (isUpdatingFromProp.current) return
      if (nextDate && maxDate && nextDate > maxDate) return
      onChange?.(nextDate)
    },
    [onChange, maxDate],
  )

  const timescape = useTimescape({
    date: value || new Date(),
    onChangeDate: handleDateChange,
  })

  React.useEffect(() => {
    if (value && timescape.update && value.getTime() !== prevValue.current?.getTime()) {
      isUpdatingFromProp.current = true
      timescape.update({ date: value })
      prevValue.current = value
      setTimeout(() => {
        isUpdatingFromProp.current = false
      }, 0)
    }
  }, [value])

  const rootProps = timescape.getRootProps()
  const { ref, ...restRootProps } = rootProps as { ref?: React.Ref<HTMLDivElement> }

  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-1 rounded-md", className)}
      {...restRootProps}
    >
      <Input
        className={cn(timePickerInputBase, "min-w-8")}
        {...timescape.getInputProps("days")}
        placeholder={INPUT_PLACEHOLDERS.days}
      />
      <span className="text-xs text-muted-foreground">/</span>
      <Input
        className={cn(timePickerInputBase, "min-w-8")}
        {...timescape.getInputProps("months")}
        placeholder={INPUT_PLACEHOLDERS.months}
      />
      <span className="text-xs text-muted-foreground">/</span>
      <Input
        className={cn(timePickerInputBase, "min-w-12")}
        {...timescape.getInputProps("years")}
        placeholder={INPUT_PLACEHOLDERS.years}
      />
    </div>
  )
}

interface DateRangePickerProps {
  className?: string
  value?: DateRange
  onSelect?: (range: DateRange | undefined) => void
}

export function DateRangePicker({ className, value, onSelect }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>()
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
  const [isMobile, setIsMobile] = React.useState(false)

  // Sync internal state with value prop
  React.useEffect(() => {
    if (value !== undefined) {
      setDate(value)
    }
  }, [value])

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const presets = [
    {
      label: "Today",
      getValue: () => ({
        from: new Date(),
        to: new Date(),
      }),
    },
    {
      label: "Yesterday",
      getValue: () => ({
        from: subDays(new Date(), 1),
        to: subDays(new Date(), 1),
      }),
    },
    {
      label: "Last 7 days",
      getValue: () => ({
        from: subDays(new Date(), 6),
        to: new Date(),
      }),
    },
    {
      label: "Last week",
      getValue: () => ({
        from: startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
        to: endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }),
      }),
    },
    {
      label: "Last 30 days",
      getValue: () => ({
        from: subDays(new Date(), 29),
        to: new Date(),
      }),
    },
    {
      label: "Last month",
      getValue: () => ({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
      }),
    },
  ]

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const range = preset.getValue()
    setTempDate(range)
  }

  const handleSubmit = () => {
    setDate(tempDate)
    onSelect?.(tempDate)
    setIsAnimating(false)
    setTimeout(() => {
      setOpen(false)
    }, 200)
  }

  const handleClear = () => {
    setTempDate(undefined)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true)
      setTempDate(date)
      // Trigger animation on next frame to allow DOM to render first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      setTimeout(() => {
        setOpen(false)
      }, 200)
    }
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      return "Elegir rango de fechas"
    }

    if (!range.to || format(range.from, "PP") === format(range.to, "PP")) {
      return format(range.from, "PP")
    }

    return `${format(range.from, "PP")} - ${format(range.to, "PP")}`
  }

  const handleFromDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const today = new Date()
      today.setHours(23, 59, 59, 999)

      if (newDate > today) return

      setTempDate((prev) => {
        const newRange = {
          from: newDate,
          to: prev?.to,
        }

        if (newRange.to && newRange.to < newDate) {
          newRange.to = undefined
        }

        return newRange
      })
    }
  }

  const handleToDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const today = new Date()
      today.setHours(23, 59, 59, 999)

      if (newDate > today) return

      setTempDate((prev) => {
        if (prev?.from && newDate < prev.from) {
          return prev
        }

        return {
          from: prev?.from,
          to: newDate,
        }
      })
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => handleOpenChange(true)}
        className={cn("justify-start text-left font-normal", !date && "text-muted-foreground", className)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange(date)}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={cn(
              "absolute inset-0 bg-black/50 transition-opacity duration-200",
              isAnimating ? "opacity-100" : "opacity-0"
            )}
            onClick={() => handleOpenChange(false)}
          />

          <div
            className={cn(
              "relative bg-background rounded-lg shadow-lg border transition-all duration-200 w-full max-w-full",
              isMobile ? "max-w-[calc(100%-2rem)]" : "max-w-3xl",
              isAnimating
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="text-lg font-bold sm:text-xl font-serif">Seleccionar rango de fechas</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-accent"
                onClick={() => handleOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isMobile ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <DateInput value={tempDate?.from} onChange={handleFromDateChange} maxDate={new Date()} />
                  <span className="text-muted-foreground font-medium">—</span>
                  <DateInput value={tempDate?.to} onChange={handleToDateChange} maxDate={new Date()} />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground mb-2 text-center font-serif">Predefinidas</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        className="font-normal hover:bg-accent text-sm"
                        onClick={() => handlePresetClick(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex">
                <div className="p-6 space-y-6">
                  <div className="flex justify-center items-center gap-3">
                    <DateInput value={tempDate?.from} onChange={handleFromDateChange} maxDate={new Date()} />
                    <span className="text-muted-foreground font-medium">—</span>
                    <DateInput value={tempDate?.to} onChange={handleToDateChange} maxDate={new Date()} />
                  </div>

                  <Calendar
                    mode="range"
                    selected={tempDate}
                    onSelect={setTempDate}
                    numberOfMonths={2}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    disabled={(date) => date > new Date()}
                    showOutsideDays={false}
                    className="rounded-md"
                  />
                </div>

                <div className="border-l bg-muted/30 p-6 w-64">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-foreground mb-4 font-serif">Predefinidas</p>
                    {presets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        className="w-full justify-start font-normal hover:bg-accent"
                        onClick={() => handlePresetClick(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t bg-muted/20 px-4 py-3 sm:px-6 sm:py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={handleClear} className="min-w-20 bg-transparent">
                Limpiar
              </Button>
              <Button onClick={handleSubmit} className="min-w-20">
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
