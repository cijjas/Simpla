'use client';

import React, { useState, useEffect } from 'react';
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
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { useNormasFilters } from '../../hooks/use-normas-filters';
import { NormaFilters } from '../../api/normas-api';

interface NormasFilterProps {
  loading?: boolean;
  onFilterApplied?: () => void;
}

export function NormasFilter({
  loading: _loading,
  onFilterApplied,
}: NormasFilterProps) {
  const {
    filterOptions,
    currentFilters,
    handleFilterChange: applyFilterChange,
    handleDateRangeChange: applyDateRangeChange,
    handleSearchTermChange: applySearchTermChange,
    clearAllFilters,
    hasActiveFilters,
  } = useNormasFilters();

  // Local state for pending filters
  const [pendingFilters, setPendingFilters] = useState<Partial<NormaFilters>>(
    {},
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Initialize pending filters with current filters
  useEffect(() => {
    setPendingFilters({
      numero: currentFilters.numero,
      anio: currentFilters.anio,
      nro_boletin: currentFilters.nro_boletin,
      search_term: currentFilters.search_term,
      tipo_norma: currentFilters.tipo_norma,
      publicacion_desde: currentFilters.publicacion_desde,
      publicacion_hasta: currentFilters.publicacion_hasta,
    });

    // Initialize date range
    if (currentFilters.publicacion_desde && currentFilters.publicacion_hasta) {
      setDateRange({
        from: new Date(currentFilters.publicacion_desde),
        to: new Date(currentFilters.publicacion_hasta),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle local filter changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLocalFilterChange = (key: string, value: any) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from && range.to) {
      setPendingFilters(prev => ({
        ...prev,
        publicacion_desde: format(range.from as Date, 'yyyy-MM-dd'),
        publicacion_hasta: format(range.to as Date, 'yyyy-MM-dd'),
      }));
    } else {
      setPendingFilters(prev => ({
        ...prev,
        publicacion_desde: undefined,
        publicacion_hasta: undefined,
      }));
    }
    setHasChanges(true);
  };

  // Apply filters when button is clicked
  const applyFilters = () => {
    // Apply each filter change
    Object.entries(pendingFilters).forEach(([key, value]) => {
      if (key === 'search_term') {
        applySearchTermChange(value as string);
      } else if (key === 'publicacion_desde' || key === 'publicacion_hasta') {
        applyDateRangeChange(key, value as string | undefined);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyFilterChange(key, value as any);
      }
    });
    setHasChanges(false);
    // Call the callback to close mobile filter drawer
    onFilterApplied?.();
  };

  // Clear all filters
  const handleClearAll = () => {
    clearAllFilters();
    setPendingFilters({});
    setDateRange({});
    setHasChanges(false);
    // Call the callback to close mobile filter drawer
    onFilterApplied?.();
  };

  return (
    <div className='w-full'>
      <div className='space-y-3 p-1'>
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
              placeholder='Buscar...'
              value={pendingFilters.search_term || ''}
              onChange={e =>
                handleLocalFilterChange('search_term', e.target.value)
              }
            />
          </div>
        </div>

        {/* Tipo */}
        <div className='w-full'>
          <Label className='text-xs'>Tipo</Label>
          <Select
            value={pendingFilters.tipo_norma || 'all'}
            onValueChange={value =>
              handleLocalFilterChange(
                'tipo_norma',
                value === 'all' ? undefined : value,
              )
            }
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

        {/* Número and Año Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Número Field */}
          <div>
            <Label htmlFor='numero' className='text-xs'>
              Número
            </Label>
            <Input
              id='numero'
              type='number'
              min='1'
              placeholder='Número'
              value={pendingFilters.numero || ''}
              onChange={e => {
                const value = e.target.value;
                const numValue = value ? parseInt(value, 10) : undefined;
                handleLocalFilterChange('numero', numValue);
              }}
              className='h-9 text-sm mt-1 bg-background'
            />
          </div>

          {/* Año Field */}
          <div>
            <Label htmlFor='anio' className='text-xs'>
              Año
            </Label>
            <Input
              id='anio'
              type='number'
              min='1900'
              max='2100'
              placeholder='Año'
              value={pendingFilters.anio || ''}
              onChange={e => {
                const value = e.target.value;
                const numValue = value ? parseInt(value, 10) : undefined;
                handleLocalFilterChange('anio', numValue);
              }}
              className='h-9 text-sm mt-1 bg-background'
            />
          </div>
        </div>

        {/* Número de Boletín Field */}
        <div className='w-full'>
          <Label htmlFor='nro_boletin' className='text-xs'>
            Número de Boletín
          </Label>
          <Input
            id='nro_boletin'
            type='text'
            placeholder='Nro. Boletín'
            value={pendingFilters.nro_boletin || ''}
            onChange={e =>
              handleLocalFilterChange('nro_boletin', e.target.value)
            }
            className='h-9 text-sm mt-1 bg-background'
          />
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

        {/* Clear and Apply Buttons - Bottom */}
        <div className='flex gap-2 pt-2'>
          <Button
            variant='outline'
            onClick={handleClearAll}
            disabled={!hasChanges && !hasActiveFilters}
            size='sm'
            className='w-1/4'
          >
            Limpiar
          </Button>
          <Button
            onClick={applyFilters}
            disabled={!hasChanges}
            size='sm'
            className='w-3/4'
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
