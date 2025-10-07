'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNormasFilters } from '../hooks/use-normas-filters';

interface NormasFilterProps {
  loading?: boolean;
}

export function NormasFilter({ loading: _loading }: NormasFilterProps) {
  const {
    filterOptions,
    currentFilters,
    handleFilterChange,
    handleDateRangeChange,
    handleSearchTermChange,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount
  } = useNormasFilters();
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDateChange = (key: 'sancion_desde' | 'sancion_hasta' | 'publicacion_desde' | 'publicacion_hasta', date: Date | undefined) => {
    const value = date ? format(date, 'yyyy-MM-dd') : undefined;
    handleDateRangeChange(key, value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Term */}
        <div className="space-y-2">
          <Label htmlFor="search">Búsqueda de texto</Label>
          <Input
            id="search"
            placeholder="Buscar en títulos, resúmenes y observaciones..."
            value={currentFilters.search_term || ''}
            onChange={(e) => handleSearchTermChange(e.target.value)}
          />
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Jurisdicción</Label>
            <Select
              value={currentFilters.jurisdiccion || 'all'}
              onValueChange={(value) => handleFilterChange('jurisdiccion', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions?.jurisdicciones.filter(j => j && j.trim()).map((jurisdiccion) => (
                  <SelectItem key={jurisdiccion} value={jurisdiccion}>
                    {jurisdiccion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Norma</Label>
            <Select
              value={currentFilters.tipo_norma || 'all'}
              onValueChange={(value) => handleFilterChange('tipo_norma', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions?.tipos_norma.filter(t => t && t.trim()).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Clase de Norma</Label>
            <Select
              value={currentFilters.clase_norma || 'all'}
              onValueChange={(value) => handleFilterChange('clase_norma', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions?.clases_norma.filter(c => c && c.trim()).map((clase) => (
                  <SelectItem key={clase} value={clase}>
                    {clase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={currentFilters.estado || 'all'}
              onValueChange={(value) => handleFilterChange('estado', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions?.estados.filter(e => e && e.trim()).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full md:w-auto"
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'} Filtros Avanzados
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Sanción Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentFilters.sancion_desde && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentFilters.sancion_desde ? (
                        format(new Date(currentFilters.sancion_desde), 'dd/MM/yyyy')
                      ) : (
                        "Seleccionar fecha"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentFilters.sancion_desde ? new Date(currentFilters.sancion_desde) : undefined}
                      onSelect={(date) => handleDateChange('sancion_desde', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Sanción Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentFilters.sancion_hasta && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentFilters.sancion_hasta ? (
                        format(new Date(currentFilters.sancion_hasta), 'dd/MM/yyyy')
                      ) : (
                        "Seleccionar fecha"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentFilters.sancion_hasta ? new Date(currentFilters.sancion_hasta) : undefined}
                      onSelect={(date) => handleDateChange('sancion_hasta', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Publicación Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentFilters.publicacion_desde && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentFilters.publicacion_desde ? (
                        format(new Date(currentFilters.publicacion_desde), 'dd/MM/yyyy')
                      ) : (
                        "Seleccionar fecha"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentFilters.publicacion_desde ? new Date(currentFilters.publicacion_desde) : undefined}
                      onSelect={(date) => handleDateChange('publicacion_desde', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Publicación Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentFilters.publicacion_hasta && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentFilters.publicacion_hasta ? (
                        format(new Date(currentFilters.publicacion_hasta), 'dd/MM/yyyy')
                      ) : (
                        "Seleccionar fecha"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentFilters.publicacion_hasta ? new Date(currentFilters.publicacion_hasta) : undefined}
                      onSelect={(date) => handleDateChange('publicacion_hasta', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Search is automatic when filters change */}
      </CardContent>
    </Card>
  );
}
