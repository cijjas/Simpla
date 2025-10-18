'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division, NormaSummary } from '@/features/normas/api/normas-api';

/**
 * Interface for the props of the NormaSidebar component.
 * @param divisions - Array of division objects to be displayed in the sidebar.
 * @param activeDivisionId - The ID of the currently active/selected division.
 * @param normaTitle - Optional title for the regulation being viewed.
 * @param onDivisionClick - Callback function when a division is clicked.
 * @param onBack - Callback function for the back button.
 * @param showOutline - Whether to show the divisions outline.
 * @param modifica - Optional related normas that this norma modifies.
 * @param modificadaPor - Optional related normas that modify this norma.
 */
interface NormaSidebarProps {
  divisions: Division[];
  activeDivisionId: number | null;
  normaTitle?: string;
  onDivisionClick: (divisionId: number) => void;
  onBack: () => void;
  showOutline?: boolean;
  modifica?: NormaSummary[];
  modificadaPor?: NormaSummary[];
}

/**
 * A professional and elegant sidebar component for displaying a table of contents.
 * It features a clean layout, a subtle 60s-inspired typographic pairing, and robust
 * alignment for division titles, even with variable-length ordinals.
 */
export function NormaSidebar({
  divisions,
  activeDivisionId,
  normaTitle = 'Normativa',
  onDivisionClick,
  onBack,
  showOutline = true,
  modifica: _modifica,
  modificadaPor: _modificadaPor,
}: NormaSidebarProps) {
  return (
    <aside className='w-80 flex-shrink-0 border-r border-border  flex flex-col h-[calc(100vh-3.5rem)] sticky top-14'>
      {/* === Header Section: Provides context and the main back action === */}
      <div className='flex-shrink-0 p-4 border-b border-border space-y-3'>
      <Button
        variant='ghost'
        onClick={onBack}
        className='text-muted-foreground hover:text-foreground transition-colors'
      >
        <ArrowLeft className='size-4 mr-2' />
        Volver a Normativas
      </Button>
        
      </div>
      
      {/* === Scrollable Content Section: The table of contents === */}
      <ScrollArea className='flex-1'>
        <nav className='p-4'>
        <h1 className='px-2 text-lg font-bold font-serif tracking-tight text-foreground pb-4'>
          {normaTitle}
        </h1>
          {showOutline && (
            <div className='space-y-1'>
              {divisions.map(division => (
                <button
                  key={division.id}
                  onClick={() => onDivisionClick(division.id)}
                  className={cn(
                    'w-full flex items-start text-left py-1 px-3 rounded-md transition-colors duration-200',
                    activeDivisionId === division.id
                      ? 'bg-accent text-accent-foreground font-semibold border-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {/* --- Ordinal Styling ---
                      - Fixed width ensures all titles align perfectly
                      - Right-aligned for clean visual hierarchy
                  */}
                  {division.ordinal && (
                    <span className='w-12 flex-shrink-0 font-serif font-bold text-sm text-right pr-4'>
                      {division.ordinal}
                    </span>
                  )}
                  
                  {/* --- Title Styling ---
                      - Takes remaining space
                      - Comfortable line height for readability
                  */}
                  <span className='flex-1 text-sm leading-relaxed'>
                    {division.name || division.title || 'División sin título'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* === Footer Section === */}
      <div className='flex-shrink-0 border-t border-border p-3 text-center text-xs text-muted-foreground/70 font-light tracking-wide'>
        Simpla © {new Date().getFullYear()}
      </div>
    </aside>
  );
}