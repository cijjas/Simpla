'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectGroup, 
  SelectLabel, 
} from '@/components/ui/select';
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

  return (
    <Select 
      value={selectedTone}
      onValueChange={(value) => onToneChange(value as ToneType)}
      disabled={disabled}
    >
      <SelectTrigger 
        className="rounded-3xl bg-secondary/50 " 
        aria-label="Select writing tone"
      >
        {/*
          MODIFICATION:
          Instead of using <SelectValue />, we manually render the label of the
          selected option. If nothing is selected, we show a placeholder.
        */}
        {selectedOption ? selectedOption.label : 'Select a tone'}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Opciones de Tono</SelectLabel>
          {/* This part remains unchanged, as it correctly renders the dropdown items */}
          {toneOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value} 
              className="py-2 h-auto" 
            >
              <div className="flex flex-col items-start leading-none">
                <span className="font-medium text-sm">{option.label}</span>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}