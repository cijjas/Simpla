'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { XIcon, CheckIcon } from 'lucide-react';
import { ALL_PROVINCES } from '../types';

interface RagScopeDialogProps {
  selectedProvinces: string[];
  toggleProvince: (province: string) => void;
  clearProvinces: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export function RagScopeDialog({
  selectedProvinces,
  toggleProvince,
  clearProvinces,
  dialogOpen,
  setDialogOpen,
}: RagScopeDialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className='sm:max-w-md md:max-w-lg bg-card max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>Seleccionar Ámbito Geográfico</DialogTitle>
          <DialogDescription>
            Elegí las provincias para contextualizar las respuestas. Si no
            seleccionas ninguna, se considerará el ámbito nacional.
          </DialogDescription>
        </DialogHeader>

        {selectedProvinces.length > 0 && (
          <div className='py-2 space-y-2'>
            <p className='text-sm font-medium text-foreground'>
              Seleccionadas:
            </p>
            <div className='flex flex-wrap gap-2'>
              {selectedProvinces.map(province => {
                const isNacional = province === 'Nacional' || province === 'La Nación Argentina';
                return (
                  <Badge
                    key={province}
                    variant={isNacional ? 'default' : 'secondary'}
                    className={`flex items-center gap-1 ${
                      isNacional 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800' 
                        : ''
                    }`}
                  >
                    <span>{province}</span>
                    <button
                      onClick={() => toggleProvince(province)}
                      className='appearance-none ring-offset-background rounded-full outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 p-0.5 hover:bg-muted-foreground/20'
                      aria-label={`Quitar ${province}`}
                    >
                      <XIcon className='h-3 w-3' />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className='flex-1 overflow-hidden'>
          <Command className='rounded-lg border shadow-sm mt-2 h-full flex flex-col'>
            <CommandInput placeholder='Buscar provincia...' />
            <CommandList className='flex-1 overflow-auto'>
            <CommandEmpty>No se encontraron provincias.</CommandEmpty>
            <CommandGroup>
              {ALL_PROVINCES.sort().map(province => {
                const isNacional = province === 'Nacional' || province === 'La Nación Argentina';
                const isSelected = selectedProvinces.includes(province);
                return (
                  <CommandItem
                    key={province}
                    onSelect={() => {
                      toggleProvince(province);
                      // Keep focus on input or allow selection without closing
                    }}
                    className={`cursor-pointer flex justify-between items-center ${
                      isSelected && isNacional ? 'bg-green-50 dark:bg-green-950' : ''
                    }`}
                  >
                    <span className={isNacional ? 'font-semibold' : ''}>{province}</span>
                    {isSelected && (
                      <CheckIcon className={`h-4 w-4 ${isNacional ? 'text-green-600' : 'text-primary'}`} />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <DialogFooter className='mt-4 sm:justify-between gap-2'>
          {selectedProvinces.length > 0 ? (
            <Button variant='outline' onClick={clearProvinces}>
              Limpiar Selección
            </Button>
          ) : (
            <div />
          )}{' '}
          {/* Placeholder to keep layout consistent */}
          <DialogClose asChild>
            <Button>Aplicar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
