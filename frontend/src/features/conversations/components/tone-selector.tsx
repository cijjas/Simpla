'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import type { ToneType } from '../types';

interface ToneSelectorProps {
  selectedTone: ToneType;
  onToneChange: (tone: ToneType) => void;
  disabled?: boolean;
}

const toneOptions: { value: ToneType; label: string; description: string }[] = [
  { 
    value: 'default', 
    label: 'Default', 
    description: 'Informativo y equilibrado' 
  },
  { 
    value: 'formal', 
    label: 'Formal', 
    description: 'Técnico y jurídico' 
  },
  { 
    value: 'academico', 
    label: 'Académico', 
    description: 'Explicativo y pedagógico' 
  },
  { 
    value: 'conciso', 
    label: 'Conciso', 
    description: 'Breve y directo' 
  },
];

export function ToneSelector({ selectedTone, onToneChange, disabled = false }: ToneSelectorProps) {
  const selectedOption = toneOptions.find(option => option.value === selectedTone) || toneOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={disabled}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          {selectedOption.label}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {toneOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onToneChange(option.value)}
            className="flex items-center gap-3 py-2 hover:bg-accent hover:text-accent-foreground"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {option.value === selectedTone && (
                <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <span className="font-medium text-sm">{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
