'use client';

import React from 'react';
import { argentinaProvincePaths } from './argentina-paths';

interface Province {
  id: string;
  name: string;
}

const provinces: Province[] = [
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

interface ArgentinaMapSimpleProps {
  selectedProvinces?: string[];
  onProvinceToggle?: (provinceId: string) => void;
  className?: string;
}

const ArgentinaMapSimple: React.FC<ArgentinaMapSimpleProps> = ({
  selectedProvinces = [],
  onProvinceToggle,
  className = '',
}) => {
  const isProvinceSelected = (provinceId: string) => {
    return selectedProvinces.includes(provinceId);
  };

  const getProvinceClassName = (provinceId: string) => {
    const isSelected = isProvinceSelected(provinceId);
    return isSelected ? "selected" : "unselected";
  };

  const handleProvinceClick = (provinceId: string) => {
    if (onProvinceToggle) {
      onProvinceToggle(provinceId);
    }
  };

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${className}`}>
      {/* SVG Map - Takes full height */}
      <div className="flex-1 overflow-hidden min-h-0">
        <svg
          viewBox="200 200 600 600"  // Very zoomed in, centered  // Much bigger

          className="w-full h-full [&_path]:cursor-pointer [&_path]:transition-all [&_path]:duration-200 [&_path]:hover:opacity-80 [&_path.unselected]:fill-white [&_path.unselected]:stroke-stone-400 [&_path.unselected]:dark:fill-gray-800 [&_path.unselected]:dark:stroke-stone-500 [&_path.unselected]:hover:fill-stone-100 [&_path.unselected]:dark:hover:fill-gray-700 [&_path.selected]:fill-blue-500 [&_path.selected]:stroke-blue-600 [&_path.selected]:dark:stroke-blue-400"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
        >
          <g id="features">
            {provinces.map((province) => (
              <path
                key={province.id}
                id={province.id}
                className={getProvinceClassName(province.id)}
                strokeWidth="0.5"
                onClick={() => handleProvinceClick(province.id)}
                d={argentinaProvincePaths[province.id] || ""} // Use path data from argentina-paths.ts
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default ArgentinaMapSimple;
