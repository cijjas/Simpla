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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Expand, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Division, NormaSummary } from '@/features/normas/api/normas-api';
import { NormaRelationGraph } from './norma-relation-graph';
import { NormaRelationGraphDialog } from './norma-relation-graph-dialog';
import { NormaRelacionesResponse } from '../../api/normas-api';
import { useRouter } from 'next/navigation';

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
  const [activeTab, setActiveTab] = useState<'grafo' | 'lista'>('grafo');
  const router = useRouter();

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

  // Helper to format norma title
  const formatNormaTitle = useCallback((node: { infoleg_id: number; tipo_norma?: string | null; numero?: number | null; sancion?: string | null }) => {
    if (node.tipo_norma && node.numero && node.sancion) {
      const year = new Date(node.sancion).getFullYear();
      return `${node.tipo_norma} ${node.numero}/${year}`;
    }
    return `Norma ${node.infoleg_id}`;
  }, []);

  // Build complete node map including nodes from links
  const buildCompleteNodeMap = useCallback(() => {
    if (!relacionesData) return { normasQueModifican: [], normasModificadas: [] };

    // Create a map of all infoleg_ids to ensure we have all nodes
    const nodeMap = new Map<number, {
      infoleg_id: number;
      titulo?: string | null;
      titulo_resumido?: string | null;
      tipo_norma?: string | null;
      numero?: number | null;
      sancion?: string | null;
    }>();

    // Add nodes from data.nodes
    relacionesData.nodes.forEach(node => {
      nodeMap.set(node.infoleg_id, node);
    });

    // Add any missing nodes from links
    relacionesData.links.forEach(link => {
      if (!nodeMap.has(link.source_infoleg_id) && link.source_infoleg_id !== infolegId) {
        nodeMap.set(link.source_infoleg_id, {
          infoleg_id: link.source_infoleg_id,
        });
      }
      if (!nodeMap.has(link.target_infoleg_id) && link.target_infoleg_id !== infolegId) {
        nodeMap.set(link.target_infoleg_id, {
          infoleg_id: link.target_infoleg_id,
        });
      }
    });

    // Get incoming (normas that modify current)
    const incomingIds = new Set<number>();
    relacionesData.links.forEach(link => {
      if (link.target_infoleg_id === infolegId) {
        incomingIds.add(link.source_infoleg_id);
      }
    });

    // Get outgoing (normas modified by current)
    const outgoingIds = new Set<number>();
    relacionesData.links.forEach(link => {
      if (link.source_infoleg_id === infolegId) {
        outgoingIds.add(link.target_infoleg_id);
      }
    });

    const normasQueModifican = Array.from(incomingIds).map(id => nodeMap.get(id)!).filter(Boolean);
    const normasModificadas = Array.from(outgoingIds).map(id => nodeMap.get(id)!).filter(Boolean);

    return { normasQueModifican, normasModificadas };
  }, [relacionesData, infolegId]);

  const { normasQueModifican, normasModificadas } = buildCompleteNodeMap();

  const handleNavigateToNorma = useCallback((normaId: number) => {
    router.push(`/normas/${normaId}`);
  }, [router]);

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
              <DialogHeader className='flex-shrink-0 px-4 py-3 pt-4  border-b bg-muted/30'>
                <div className='text-xs text-muted-foreground/70 uppercase tracking-wide mb-1'>
                  Normas relacionadas
                </div>
                <DialogTitle className='text-xl font-bold font-serif'>
                  {nombreNorma}
                </DialogTitle>
                
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'grafo' | 'lista')} className='flex-1 flex flex-col min-h-0 gap-0 '>
                <TabsList className='flex-shrink-0 w-full justify-start rounded-none border-b bg-muted p-0'>
                  <TabsTrigger value='grafo' className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:rounded-none text-muted-foreground/70'>
                    Red Normativa
                  </TabsTrigger>
                  <TabsTrigger value='lista' className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:rounded-none text-muted-foreground/70'>
                    Lista
                  </TabsTrigger>
                </TabsList>
                
                {/* Graph Tab */}
                <TabsContent value='grafo' className='flex-1 min-h-0 overflow-hidden mt-0'>
                  <NormaRelationGraphDialog 
                    infolegId={infolegId}
                    data={relacionesData || undefined}
                    loading={relacionesLoading}
                  />
                </TabsContent>
                
                {/* List Tab */}
                <TabsContent value='lista' className='flex-1 min-h-0 overflow-hidden mt-0 flex flex-col'>
                  {/* Sticky Header - 2 columns with border between them */}
                  <div className='sticky top-0 bg-background z-10 border-b border-border flex-shrink-0'>
                    <div className='grid grid-cols-2 divide-x divide-border'>
                      <div className='p-2 text-center'>
                        <h3 className='text-sm font-bold font-serif text-foreground'>
                          Complementada por
                          <span className='ml-2 text-xs font-normal text-muted-foreground'>
                            ({normasQueModifican.length})
                          </span>
                        </h3>
                      </div>
                      <div className='p-2 text-center'>
                        <h3 className='text-sm font-bold font-serif text-foreground'>
                          Complementa
                          <span className='ml-2 text-xs font-normal text-muted-foreground'>
                            ({normasModificadas.length})
                          </span>
                        </h3>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className='h-full'>
                    <div className='grid grid-cols-2 divide-x divide-border pb-8'>
                      {/* Left column - Normas que modifican */}
                      <div className='pt-3 px-4 pb-6'>
                        <div className='space-y-2'>
                          {normasQueModifican.length > 0 ? (
                            normasQueModifican.map((norma) => (
                              <div
                                key={norma.infoleg_id}
                                className='group p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer'
                                onClick={() => handleNavigateToNorma(norma.infoleg_id)}
                              >
                                <div className='flex items-start justify-between gap-2'>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-bold font-serif text-sm truncate'>
                                      {formatNormaTitle(norma)}
                                    </div>
                                    <div className='text-xs text-muted-foreground line-clamp-2 mt-1'>
                                      {norma.titulo_resumido || 'Sin título resumido'}
                                    </div>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='flex-shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToNorma(norma.infoleg_id);
                                    }}
                                  >
                                    <ExternalLink className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className='text-sm text-muted-foreground text-center py-8'>
                              No hay normas que complementen a esta
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right column - Normas modificadas */}
                      <div className='pt-3 px-4 pb-6'>
                        <div className='space-y-2'>
                          {normasModificadas.length > 0 ? (
                            normasModificadas.map((norma) => (
                              <div
                                key={norma.infoleg_id}
                                className='group p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer'
                                onClick={() => handleNavigateToNorma(norma.infoleg_id)}
                              >
                                <div className='flex items-start justify-between gap-2'>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-bold font-serif text-sm truncate'>
                                      {formatNormaTitle(norma)}
                                    </div>
                                    <div className='text-xs text-muted-foreground line-clamp-2 mt-1'>
                                      {norma.titulo_resumido || 'Sin título resumido'}
                                    </div>
                                  </div>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='flex-shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToNorma(norma.infoleg_id);
                                    }}
                                  >
                                    <ExternalLink className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className='text-sm text-muted-foreground text-center py-8'>
                              Esta norma no complementa otras
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
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