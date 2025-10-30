'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
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
  // Find the full object for the currently selected tone.
  const selectedOption = toneOptions.find(option => option.value === selectedTone);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          className="h-8 px-3 rounded-full cursor-pointer"
          size="sm"
          variant="ghost"
        >
          <span className="text-xs">{selectedOption ? selectedOption.label : 'Tono'}</span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Opciones de Tono</DropdownMenuLabel>
        {toneOptions.map((option) => (
          <DropdownMenuItem 
            key={option.value} 
            onClick={() => onToneChange(option.value)}
            className="py-2 h-auto"
          >
            <div className="flex flex-col items-start leading-none">
              <span className="font-medium text-sm">{option.label}</span>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}