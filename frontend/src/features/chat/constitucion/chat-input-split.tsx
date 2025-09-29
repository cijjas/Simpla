'use client';

import { useEffect, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2Icon, MapPin, X } from 'lucide-react';
import { RagScopeDialog } from '../components/rag-scope-dialog';

// Province data for displaying names
const provinces = [
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

interface ChatInputSplitProps {
  question: string;
  setQuestion: (question: string) => void;
  send: () => void;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  selectedProvinces: string[];
  toggleProvince: (province: string) => void;
  clearProvinces: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export function ChatInputSplit({
  question,
  setQuestion,
  send,
  isLoading,
  textareaRef,
  selectedProvinces,
  toggleProvince,
  clearProvinces,
  dialogOpen,
  setDialogOpen,
}: ChatInputSplitProps) {
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question, textareaRef]);

  const hasSelectedProvinces = selectedProvinces.length > 0;

  const getProvinceName = (provinceId: string) => {
    return provinces.find(p => p.id === provinceId)?.name || provinceId;
  };

  return (
    <div className="space-y-3">
      {/* Selected Provinces Tags */}
      {hasSelectedProvinces && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {selectedProvinces.length} provincia{selectedProvinces.length > 1 ? 's' : ''} seleccionada{selectedProvinces.length > 1 ? 's' : ''}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearProvinces}
              className="h-auto p-1 text-xs hover:text-foreground"
            >
              Limpiar todo
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProvinces.map(provinceId => {
              const province = provinces.find(p => p.id === provinceId);
              const isSpecial = province?.isSpecial || false;
              return (
                <span
                  key={provinceId}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isSpecial
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  }`}
                >
                  {getProvinceName(provinceId)}
                  <button
                    onClick={() => toggleProvince(provinceId)}
                    className={`rounded-full p-0.5 transition-colors ${
                      isSpecial
                        ? "hover:bg-green-200 dark:hover:bg-green-800"
                        : "hover:bg-blue-200 dark:hover:bg-blue-800"
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="relative flex flex-col rounded-2xl border border-border bg-card shadow-sm dark:shadow-none">
        <div className="flex w-full items-end px-4 py-3">
          <div className="flex flex-col w-full">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder='Preguntá algo sobre las constituciones...'
              rows={1}
              disabled={isLoading}
              className='w-full resize-none overflow-hidden bg-transparent border-none outline-none ring-0 text-foreground placeholder:text-muted-foreground text-base leading-relaxed max-h-[240px] min-h-[1.5rem]'
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-3 pt-1 gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-8 px-2 text-xs hover:bg-muted"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Provincias
            {hasSelectedProvinces && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                {selectedProvinces.length}
              </span>
            )}
          </Button>
        </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={send}
              disabled={!question.trim() || isLoading}
              size="sm"
              className="h-8 px-3"
            >
              {isLoading ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* RAG Scope Dialog */}
      <RagScopeDialog
        selectedProvinces={selectedProvinces}
        toggleProvince={toggleProvince}
        clearProvinces={clearProvinces}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
      />
    </div>
  );
}
