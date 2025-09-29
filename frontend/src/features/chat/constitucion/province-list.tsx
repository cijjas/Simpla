'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Province {
  id: string;
  name: string;
  isSpecial?: boolean;
}

const provinces: Province[] = [
  { id: 'NACIONAL', name: 'Nacional', isSpecial: true },
  { id: 'ARE', name: 'Entre Ríos' },
  { id: 'ARA', name: 'Salta' },
  { id: 'ARY', name: 'Jujuy' },
  { id: 'ARP', name: 'Formosa' },
  { id: 'ARN', name: 'Misiones' },
  { id: 'ARH', name: 'Chaco' },
  { id: 'ARW', name: 'Corrientes' },
  { id: 'ARK', name: 'Catamarca' },
  { id: 'ARF', name: 'La Rioja' },
  { id: 'ARJ', name: 'San Juan' },
  { id: 'ARM', name: 'Mendoza' },
  { id: 'ARQ', name: 'Neuquén' },
  { id: 'ARU', name: 'Chubut' },
  { id: 'ARR', name: 'Río Negro' },
  { id: 'ARZ', name: 'Santa Cruz' },
  { id: 'ARV', name: 'Tierra del Fuego' },
  { id: 'ARB', name: 'Buenos Aires' },
  { id: 'ARC', name: 'Ciudad de Buenos Aires' },
  { id: 'ARS', name: 'Santa Fe' },
  { id: 'ART', name: 'Tucumán' },
  { id: 'ARG', name: 'Santiago del Estero' },
  { id: 'ARD', name: 'San Luis' },
  { id: 'ARL', name: 'La Pampa' },
  { id: 'ARX', name: 'Córdoba' }
];

interface ProvinceListProps {
  selectedProvinces: string[];
  onProvinceToggle: (provinceId: string) => void;
  onClearAll: () => void;
  className?: string;
}

const ProvinceList: React.FC<ProvinceListProps> = ({
  selectedProvinces,
  onProvinceToggle,
  onClearAll,
  className = '',
}) => {
  const isProvinceSelected = (provinceId: string) => {
    return selectedProvinces.includes(provinceId);
  };

  const selectedCount = selectedProvinces.length;

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${className}`}>
      {/* Clear Button */}
      {selectedCount > 0 && (
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedCount} provincia{selectedCount > 1 ? 's' : ''} seleccionada{selectedCount > 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs"
            >
              Limpiar ({selectedCount})
            </Button>
          </div>
        </div>
      )}

      {/* Province List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-1">
          {provinces.map((province) => (
            <button
              key={province.id}
              onClick={() => onProvinceToggle(province.id)}
              className={cn(
                "w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left",
                isProvinceSelected(province.id)
                  ? province.isSpecial
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                  isProvinceSelected(province.id)
                    ? province.isSpecial
                      ? "bg-green-600 border-green-600"
                      : "bg-blue-600 border-blue-600"
                    : "border-muted-foreground"
                )}
              >
                {isProvinceSelected(province.id) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="flex-1 text-sm font-medium">
                {province.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProvinceList;
