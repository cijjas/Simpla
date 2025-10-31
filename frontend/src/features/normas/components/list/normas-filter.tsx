'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNormasFilters } from '../../hooks/use-normas-filters';
import { NormaFilters } from '../../api/normas-api';

interface NormasFilterProps {
  loading?: boolean;
  onFilterApplied?: () => void;
  mobileMode?: boolean; // When true, only shows search input
}

export function NormasFilter({ loading, onFilterApplied, mobileMode = false }: NormasFilterProps) {
  const {
    filterOptions,
    currentFilters,
    setFilters,
    clearAllFilters,
    hasActiveFilters,
  } = useNormasFilters();

  // Local pending state for filters (not applied until button click)
  const [pendingFilters, setPendingFilters] = useState<Partial<NormaFilters>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [dependenciaOpen, setDependenciaOpen] = useState(false);

  // Initialize pending filters from URL on mount
  useEffect(() => {
    if (!isInitialized) {
      setPendingFilters({
        search_term: currentFilters.search_term,
        numero: currentFilters.numero,
        dependencia: currentFilters.dependencia,
        titulo_sumario: currentFilters.titulo_sumario,
        tipo_norma: currentFilters.tipo_norma,
        año_sancion: currentFilters.año_sancion,
        nro_boletin: currentFilters.nro_boletin,
        pag_boletin: currentFilters.pag_boletin,
        publicacion_desde: currentFilters.publicacion_desde,
        publicacion_hasta: currentFilters.publicacion_hasta,
      });
      setIsInitialized(true);
    }
  }, [currentFilters, isInitialized]);

  // Parse date range from pending filters
  const dateRange = useMemo(() => {
    const range: { from?: Date; to?: Date } = {};
    if (pendingFilters.publicacion_desde) {
      range.from = new Date(pendingFilters.publicacion_desde);
    }
    if (pendingFilters.publicacion_hasta) {
      range.to = new Date(pendingFilters.publicacion_hasta);
    }
    return range;
  }, [pendingFilters.publicacion_desde, pendingFilters.publicacion_hasta]);

  // Check if pending filters differ from current filters
  const hasChanges = useMemo(() => {
    return (
      pendingFilters.search_term !== currentFilters.search_term ||
      pendingFilters.numero !== currentFilters.numero ||
      pendingFilters.dependencia !== currentFilters.dependencia ||
      pendingFilters.titulo_sumario !== currentFilters.titulo_sumario ||
      pendingFilters.tipo_norma !== currentFilters.tipo_norma ||
      pendingFilters.año_sancion !== currentFilters.año_sancion ||
      pendingFilters.nro_boletin !== currentFilters.nro_boletin ||
      pendingFilters.pag_boletin !== currentFilters.pag_boletin ||
      pendingFilters.publicacion_desde !== currentFilters.publicacion_desde ||
      pendingFilters.publicacion_hasta !== currentFilters.publicacion_hasta
    );
  }, [pendingFilters, currentFilters]);

  // Handle local filter changes (stored in pending state)
  const handleSearchTermChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, search_term: value || undefined }));
  };

  const handleNumeroChange = (value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    setPendingFilters(prev => ({ ...prev, numero: numValue }));
  };

  const handleDependenciaChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, dependencia: value === 'all' ? undefined : value }));
  };

  const handleTituloSumarioChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, titulo_sumario: value === 'all' ? undefined : value }));
  };

  const handleTipoNormaChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, tipo_norma: value === 'all' ? undefined : value }));
  };

  const handleAñoSancionChange = (value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    setPendingFilters(prev => ({ ...prev, año_sancion: numValue }));
  };

  const handleNroBoletinChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, nro_boletin: value || undefined }));
  };

  const handlePagBoletinChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, pag_boletin: value || undefined }));
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setPendingFilters(prev => ({
        ...prev,
        publicacion_desde: range.from!.toISOString().split('T')[0],
        publicacion_hasta: range.to!.toISOString().split('T')[0],
      }));
    } else {
      setPendingFilters(prev => ({
        ...prev,
        publicacion_desde: undefined,
        publicacion_hasta: undefined,
      }));
    }
  };

  // Apply pending filters to URL (triggers search)
  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    onFilterApplied?.();
  };

  // Handle Enter key press to apply filters
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      if (mobileMode) {
        // On mobile, apply search immediately when Enter is pressed
        // Only search term changes trigger immediate search
        if (pendingFilters.search_term !== currentFilters.search_term) {
          handleApplyFilters();
        }
      } else if (hasChanges) {
        handleApplyFilters();
      }
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setPendingFilters({
      search_term: undefined,
      numero: undefined,
      dependencia: undefined,
      titulo_sumario: undefined,
      tipo_norma: undefined,
      año_sancion: undefined,
      nro_boletin: undefined,
      pag_boletin: undefined,
      publicacion_desde: undefined,
      publicacion_hasta: undefined,
    });
    clearAllFilters();
    onFilterApplied?.();
  };

  // Mobile mode: only show search input (standard simple search)
  if (mobileMode) {
    return (
      <div className='w-full'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) {
              handleApplyFilters();
            }
          }}
          className='flex gap-2'
        >
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none z-10' />
            <Input
              id='mobile-search'
              type='search'
              className='pl-9 h-10 text-base bg-background w-full'
              placeholder='Buscar en normas...'
              value={pendingFilters.search_term || ''}
              onChange={e => handleSearchTermChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              autoComplete='off'
              enterKeyHint='search'
            />
          </div>
          <Button
            type='submit'
            size='sm'
            className='h-10 px-4 flex-shrink-0'
            disabled={loading || (!pendingFilters.search_term?.trim() && !currentFilters.search_term)}
          >
            Buscar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <div className='space-y-4 md:space-y-3 p-2 md:p-1'>
        {/* Search Term */}
        <div className='w-full'>
          <Label htmlFor='search' className='text-xs'>
            Búsqueda de texto
          </Label>
          <div className='relative mt-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none' />
            <Input
              id='search'
              className='pl-9 h-9 text-sm bg-background'
              placeholder='Buscar en normas...'
              value={pendingFilters.search_term || ''}
              onChange={e => handleSearchTermChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
        </div>

        {/* Número and Año Sanción Row */}
        <div className='grid grid-cols-3 gap-3'>
          {/* Número Field - 2/3 width */}
          <div className='col-span-2'>
            <Label htmlFor='numero' className='text-xs'>
              Número
            </Label>
            <Input
              id='numero'
              type='number'
              min='1'
              placeholder='Número'
              value={pendingFilters.numero || ''}
              onChange={e => handleNumeroChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className='h-9 text-sm mt-1 bg-background'
              disabled={loading}
            />
          </div>

          {/* Año Sanción Field - 1/3 width */}
          <div>
            <Label htmlFor='año_sancion' className='text-xs'>
              Año
            </Label>
            <Input
              id='año_sancion'
              type='number'
              min='1810'
              max='2100'
              placeholder='Año'
              value={pendingFilters.año_sancion || ''}
              onChange={e => handleAñoSancionChange(e.target.value)}
              className='h-9 text-sm mt-1 bg-background'
              disabled={loading}
            />
          </div>
        </div>

        {/* Dependencia - Combobox */}
        <div className='w-full'>
          <Label className='text-xs'>Dependencia</Label>
          <Popover open={dependenciaOpen} onOpenChange={setDependenciaOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={dependenciaOpen}
                className='w-full h-9 text-sm mt-1 justify-between bg-background font-normal overflow-hidden'
                disabled={loading}
              >
                <span className='truncate'>
                  {pendingFilters.dependencia
                    ? filterOptions?.dependencias.find(d => d === pendingFilters.dependencia)
                    : 'Seleccionar dependencia...'}
                </span>
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
              <Command>
                <CommandInput placeholder='Buscar dependencia...' />
                <CommandList>
                  <CommandEmpty>No se encontró dependencia.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value='all'
                      onSelect={() => {
                        handleDependenciaChange('all');
                        setDependenciaOpen(false);
                      }}
                      className='whitespace-normal'
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          !pendingFilters.dependencia ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className='break-words'>Todas</span>
                    </CommandItem>
                    {filterOptions?.dependencias
                      .filter(d => d && d.trim())
                      .map(dep => (
                        <CommandItem
                          key={dep}
                          value={dep}
                          onSelect={(currentValue) => {
                            handleDependenciaChange(currentValue === pendingFilters.dependencia ? 'all' : currentValue);
                            setDependenciaOpen(false);
                          }}
                          className='whitespace-normal'
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              pendingFilters.dependencia === dep ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className='break-words'>{dep}</span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Título Sumario */}
        <div className='w-full'>
          <Label className='text-xs'>Título Sumario</Label>
          <Select
            value={pendingFilters.titulo_sumario || 'all'}
            onValueChange={handleTituloSumarioChange}
            disabled={loading}
          >
            <SelectTrigger className='w-full h-9 text-sm mt-1 bg-background'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              {filterOptions?.titulos_sumario
                .filter(t => t && t.trim())
                .map(titulo => (
                  <SelectItem key={titulo} value={titulo}>
                    {titulo.length > 50 ? `${titulo.substring(0, 50)}...` : titulo}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className='w-full'>
          <Label className='text-xs'>Tipo</Label>
          <Select
            value={pendingFilters.tipo_norma || 'all'}
            onValueChange={handleTipoNormaChange}
            disabled={loading}
          >
            <SelectTrigger className='w-full h-9 text-sm mt-1 bg-background'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              {filterOptions?.tipos_norma
                .filter(t => t && t.trim())
                .map(tipo => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Número de Boletín and Página Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Número de Boletín Field */}
          <div>
            <Label htmlFor='nro_boletin' className='text-xs'>
              Nro. Boletín
            </Label>
            <Input
              id='nro_boletin'
              type='text'
              placeholder='Nro.'
              value={pendingFilters.nro_boletin || ''}
              onChange={e => handleNroBoletinChange(e.target.value)}
              className='h-9 text-sm mt-1 bg-background'
              disabled={loading}
            />
          </div>

          {/* Página de Boletín Field */}
          <div>
            <Label htmlFor='pag_boletin' className='text-xs'>
              Pág. Boletín
            </Label>
            <Input
              id='pag_boletin'
              type='text'
              placeholder='Pág.'
              value={pendingFilters.pag_boletin || ''}
              onChange={e => handlePagBoletinChange(e.target.value)}
              className='h-9 text-sm mt-1 bg-background'
              disabled={loading}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className='w-full'>
          <Label className='text-xs'>Fecha de Publicación</Label>
          <div className='mt-1'>
            <DateRangePicker
              placeholder='Desde - Hasta'
              initialDateFrom={dateRange.from}
              initialDateTo={dateRange.to}
              onUpdate={({ range }) => handleDateRangeChange(range)}
              className='h-9 text-sm bg-background'
            />
          </div>
        </div>

        {/* Clear and Apply Buttons */}
        <div className='flex gap-2 pt-2'>
          <Button
            variant='outline'
            onClick={handleClearAll}
            disabled={!hasActiveFilters || loading}
            size='sm'
            className='flex-1 min-w-0'
          >
            Limpiar
          </Button>
          <Button
            onClick={handleApplyFilters}
            disabled={!hasChanges || loading}
            size='sm'
            className='flex-[2] min-w-0'
          >
            <span className='truncate'>Aplicar Filtros</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
