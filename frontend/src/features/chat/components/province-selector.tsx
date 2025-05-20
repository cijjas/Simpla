"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { FilterIcon, CheckIcon } from "lucide-react"
import { ALL_PROVINCES } from "../types"

interface ProvinceSelectorProps {
  selectedProvinces: string[]
  toggleProvince: (province: string) => void
  clearProvinces: () => void
  popoverOpen: boolean
  setPopoverOpen: (open: boolean) => void
}

export function ProvinceSelector({
  selectedProvinces,
  toggleProvince,
  clearProvinces,
  popoverOpen,
  setPopoverOpen,
}: ProvinceSelectorProps) {
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11"
          aria-label="Filtrar por provincia"
        >
          <FilterIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          {selectedProvinces.length > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 justify-center text-xs">
              {selectedProvinces.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 mb-2" side="top" align="start">
        <Command>
          <div className="p-2 border-b">
            <p className="text-sm font-medium text-muted-foreground">Filtrar por provincia:</p>
          </div>
          <CommandGroup className="max-h-[250px] overflow-y-auto">
            {ALL_PROVINCES.sort().map((province) => (
              <CommandItem
                key={province}
                onSelect={() => toggleProvince(province)}
                className="flex justify-between items-center cursor-pointer"
              >
                <span>{province}</span>
                {selectedProvinces.includes(province) && <CheckIcon className="h-4 w-4 text-slate-600" />}
              </CommandItem>
            ))}
          </CommandGroup>
          {selectedProvinces.length > 0 && (
            <>
              <Separator />
              <div className="p-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearProvinces}>
                  Limpiar selección
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
