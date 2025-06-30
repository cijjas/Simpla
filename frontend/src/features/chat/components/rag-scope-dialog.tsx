'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
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
import { XIcon, CheckIcon, Frame } from 'lucide-react';
import { ALL_PROVINCES } from '../types';
// Assuming you have a cn utility
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='flex-shrink-0 h-10 w-10'
                aria-label='Filtrar por provincia'
              >
                <Frame className='h-4 w-4 sm:h-5 sm:w-5' />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side='bottom'>Filtrar por provincia</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className='sm:max-w-md md:sm:max-w-lg bg-card'>
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
              {selectedProvinces.map(province => (
                <Badge
                  key={province}
                  variant='secondary'
                  className='flex items-center gap-1'
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
              ))}
            </div>
          </div>
        )}

        <Command className='rounded-lg border shadow-sm mt-2'>
          <CommandInput placeholder='Buscar provincia...' />
          <CommandList className='max-h-[200px] sm:max-h-[250px]'>
            <CommandEmpty>No se encontraron provincias.</CommandEmpty>
            <CommandGroup>
              {ALL_PROVINCES.sort().map(province => (
                <CommandItem
                  key={province}
                  onSelect={() => {
                    toggleProvince(province);
                    // Keep focus on input or allow selection without closing
                  }}
                  className='cursor-pointer flex justify-between items-center'
                >
                  <span>{province}</span>
                  {selectedProvinces.includes(province) && (
                    <CheckIcon className='h-4 w-4 text-primary' />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

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
