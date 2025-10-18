'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division, NormaSummary } from '@/features/normas/api/normas-api';
import { NormaRelationGraph } from './norma-relation-graph';
import { NormaRelationGraphDialog } from './norma-relation-graph-dialog';
import { NormaRelacionesResponse } from '../../api/normas-api';

interface HoveredNodeInfo {
  tipo: string;
  numero: number | null;
  sancion: string | null;
}

/**
 * Interface for the props of the NormaSidebar component.
 * @param divisions - Array of division objects to be displayed in the sidebar.
 * @param activeDivisionId - The ID of the currently active/selected division.
 * @param normaTitle - Optional title for the regulation being viewed.
 * @param nombreNorma - The constructed name of the norma (e.g., "Ley 26.994/2014").
 * @param infolegId - The infoleg ID of the current norma.
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
  nombreNorma?: string;
  infolegId: number;
  onDivisionClick: (divisionId: number) => void;
  onBack: () => void;
  showOutline?: boolean;
  modifica?: NormaSummary[];
  modificadaPor?: NormaSummary[];
  relacionesData?: NormaRelacionesResponse | null;
  relacionesLoading?: boolean;
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
  nombreNorma = 'NORMA',
  infolegId,
  onDivisionClick,
  onBack,
  showOutline = true,
  modifica: _modifica,
  modificadaPor: _modificadaPor,
  relacionesData,
  relacionesLoading = false,
}: NormaSidebarProps) {
  const [isGraphDialogOpen, setIsGraphDialogOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<HoveredNodeInfo | null>(null);

  const handleNodeHover = useCallback((nodeInfo: { id: number; title: string; titulo_resumido: string | null; tipo: string; numero: number | null; sancion: string | null }) => {
    setHoveredNode({
      tipo: nodeInfo.tipo,
      numero: nodeInfo.numero,
      sancion: nodeInfo.sancion
    });
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const formatHoveredTitle = (node: HoveredNodeInfo) => {
    if (!node.tipo || !node.numero || !node.sancion) {
      return 'S/N';
    }
    const year = new Date(node.sancion).getFullYear();
    return `${node.tipo} ${node.numero}/${year}`;
  };

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
        <nav className='p-4 space-y-6'>
          <h1 className='px-2 text-lg font-bold font-serif tracking-tight text-foreground pb-2'>
            {normaTitle}
          </h1>

          {showOutline && divisions.length > 0 ? (
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
          ) : (
            <div className='px-2 py-4 text-sm text-muted-foreground text-center'>
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* === Relationship Graph Section === */}
      {relacionesData && (relacionesData.nodes.length > 0 || relacionesData.links.length > 0) && (
        <>
          <div className='flex-shrink-0 font-serif font-bold relative group text-center text-xs text-muted-foreground/70 tracking-wide py-2'>
            {hoveredNode ? formatHoveredTitle(hoveredNode) : ''}
          </div>
          <div className='flex-shrink-0 border-t border-border relative group'>
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8'
              onClick={() => setIsGraphDialogOpen(true)}
            >
              <Expand className='h-4 w-4' />
            </Button>
            <NormaRelationGraph 
              infolegId={infolegId}
              data={relacionesData || undefined}
              loading={relacionesLoading}
              onNodeHover={handleNodeHover}
              onNodeLeave={handleNodeLeave}
            />
          </div>

          {/* === Expanded Graph Dialog === */}
          <Dialog open={isGraphDialogOpen} onOpenChange={setIsGraphDialogOpen}>
            <DialogContent className='max-w-[95vw] max-h-[60vh] h-[60vh] w-[95vw] p-0 gap-0 overflow-hidden flex flex-col '>
              <DialogHeader className='flex-shrink-0 px-4 py-3 pe-10 border-b bg-muted/30'>
                <div className='text-xs text-muted-foreground uppercase tracking-wide mb-1'>
                  Grafo de relaciones
                </div>
                <DialogTitle className='text-xl font-bold font-serif'>
                  {nombreNorma}
                </DialogTitle>
              </DialogHeader>
              
              {/* Graph with integrated information display */}
              <div className='flex-1 min-h-0 overflow-hidden'>
                <NormaRelationGraphDialog 
                  infolegId={infolegId}
                  data={relacionesData || undefined}
                  loading={relacionesLoading}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* === Footer Section === */}
      <div className='flex-shrink-0 border-t  border-border p-3 text-center text-xs text-muted-foreground/70 tracking-wide'>
        <div className='flex items-center justify-center gap-2'>
          <span className='font-serif font-bold'>Simpla </span> © {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}