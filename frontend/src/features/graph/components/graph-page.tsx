'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, AlertCircle, Network, Plus, Minus, RotateCcw, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRouter } from 'next/navigation';
import { useApi } from '@/features/auth/hooks/use-api';

interface Node extends d3.SimulationNodeDatum {
  id: number;
  label: string;
  type: 'current' | 'related';
  tipoNorma?: string;
  titulo_resumido?: string | null;
  numero?: number | null;
  sancion?: string | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: number | Node;
  target: number | Node;
  tipoRelacion: string;
}

interface NodeInfo {
  id: number;
  title: string;
  titulo_resumido: string | null;
  tipo: string;
  numero: number | null;
  sancion: string | null;
}

interface NormaRelacionesResponse {
  current_norma?: {
    infoleg_id: number;
    titulo: string | null;
    titulo_resumido: string | null;
    tipo_norma: string | null;
    numero: number | null;
    sancion: string | null;
  };
  nodes: Array<{
    infoleg_id: number;
    titulo: string | null;
    titulo_resumido: string | null;
    tipo_norma: string | null;
    numero: number | null;
    sancion: string | null;
  }>;
  links: Array<{
    source_infoleg_id: number;
    target_infoleg_id: number;
    tipo_relacion: string;
  }>;
}

export function GraphPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const api = useApi();
  const [data, setData] = useState<NormaRelacionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const hasFetchedRef = useRef(false);
  const router = useRouter();

  const fetchNormasData = useCallback(async () => {
    if (hasFetchedRef.current) {
      console.log('Already fetched data, skipping...');
      return;
    }
    
    try {
      hasFetchedRef.current = true;
      setLoading(true);
      setError(null);
      console.log('Fetching normas data...');
      const result = await api.get<NormaRelacionesResponse>('/api/normas/relaciones/all/?limit=1000');
      setData(result);
    } catch (err) {
      console.error('Error fetching normas data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      hasFetchedRef.current = false; // Reset on error so retry works
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchNormasData();
  }, []);

  // Use useCallback to create stable callback references
  const handleNodeHover = useCallback((info: NodeInfo) => {
    setNodeInfo(info);
  }, []);

  const handleNodeClick = useCallback((info: NodeInfo) => {
    setNodeInfo(info);
  }, []);

  // Click background to clear the selection
  const handleBackgroundClick = useCallback(() => {
    setNodeInfo(null);
  }, []);

  // Navigate to norma detail page
  const handleNavigateToNorma = useCallback((nodeId: number) => {
    router.push(`/normas/${nodeId}`);
  }, [router]);

  // Zoom control functions
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.5);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  // Get dot color based on relationship type
  const getDotColor = useCallback((nodeId: number, outgoingIds: Set<number>, incomingIds: Set<number>) => {
    if (incomingIds.has(nodeId)) {
      return 'bg-blue-600'; // Blue for nodes that modify others
    }
    if (outgoingIds.has(nodeId)) {
      return 'bg-orange-500'; // Orange for nodes modified by others
    }
    return 'bg-green-600'; // Green for default/isolated nodes
  }, []);

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  useEffect(() => {
    if (!data || loading || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // If no relationships at all (no nodes and no links), show empty state
    if (data.nodes.length === 0 && data.links.length === 0) {
      return;
    }

    const width = 1200;
    const height = 800;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height])
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Store zoom behavior reference
    zoomRef.current = zoom;
    svg.call(zoom);

    // Create container for all graph elements
    const container = svg.append('g');

    // Add background click handler
    container.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'grab')
      .on('click', handleBackgroundClick);

    // Create a map of all infoleg_ids to ensure we have all nodes
    const nodeMap = new Map<number, Node>();
    
    // Add all nodes from data.nodes
    data.nodes.forEach(node => {
      nodeMap.set(node.infoleg_id, {
        id: node.infoleg_id,
        label: truncateText(node.titulo || `Norma ${node.infoleg_id}`, 20),
        type: 'related' as const,
        tipoNorma: node.tipo_norma || undefined,
        titulo_resumido: node.titulo_resumido || null,
        numero: node.numero || null,
        sancion: node.sancion || null,
      });
    });

    // Add any missing nodes from links that aren't in data.nodes
    data.links.forEach(link => {
      // Add source node if not already present
      if (!nodeMap.has(link.source_infoleg_id)) {
        nodeMap.set(link.source_infoleg_id, {
          id: link.source_infoleg_id,
          label: `Norma ${link.source_infoleg_id}`,
          type: 'related' as const,
        });
      }
      // Add target node if not already present
      if (!nodeMap.has(link.target_infoleg_id)) {
        nodeMap.set(link.target_infoleg_id, {
          id: link.target_infoleg_id,
          label: `Norma ${link.target_infoleg_id}`,
          type: 'related' as const,
        });
      }
    });

    // Filter links to only include those where both source and target nodes exist
    const validLinks: Link[] = data.links
      .filter(link => 
        nodeMap.has(link.source_infoleg_id) && 
        nodeMap.has(link.target_infoleg_id)
      )
      .map(link => ({
        source: link.source_infoleg_id,
        target: link.target_infoleg_id,
        tipoRelacion: link.tipo_relacion,
      }));
    
    // Calculate relationship directions for all nodes
    const outgoingIds = new Set<number>();
    const incomingIds = new Set<number>();
    
    data.links.forEach(link => {
      outgoingIds.add(link.source_infoleg_id);
      incomingIds.add(link.target_infoleg_id);
    });
    
    // Convert map to array
    const nodes: Node[] = Array.from(nodeMap.values());

    // Create force simulation with circular layout
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<Node, Link>(validLinks)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))
      .force('radial', d3.forceRadial(200, width / 2, height / 2).strength(0.2));

    // Create container for links
    const linkGroup = container.append('g')
      .attr('class', 'links')
      .attr('stroke-opacity', 0.4);

    // Create links
    const link = linkGroup.selectAll('line')
      .data(validLinks)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Create container for nodes
    const nodeGroup = container.append('g')
      .attr('class', 'nodes');

    // Create node groups
    const node = nodeGroup.selectAll<SVGGElement, Node>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    const dotRadius = 8;
    
    // Add circles with colors based on relationship direction
    node.append('circle')
      .attr('r', dotRadius)
      .attr('fill', d => {
        if (incomingIds.has(d.id)) return '#1f77b4'; // Blue for nodes that modify others
        if (outgoingIds.has(d.id)) return '#ff7f0e'; // Orange for nodes modified by others
        return '#2ca02c'; // Green for default/isolated nodes
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 1);

    // Add hover effects
    node.on('mouseenter', function(event, d) {
      const nodeGroup = d3.select(this);
      
      // Make circle slightly bigger on hover
      nodeGroup.select('circle')
        .transition()
        .duration(200)
        .attr('r', 12);

      handleNodeHover({
        id: d.id,
        title: d.label || `Norma ${d.id}`,
        titulo_resumido: d.titulo_resumido || null,
        tipo: d.tipoNorma || '',
        numero: d.numero || null,
        sancion: d.sancion || null
      });
    });

    node.on('mouseleave', function(_event, _d) {
      const nodeGroup = d3.select(this);
      
      // Reset circle size
      nodeGroup.select('circle')
        .transition()
        .duration(200)
        .attr('r', dotRadius);
    });

    // Add click handlers
    node.on('click', (event, d) => {
      event.stopPropagation();
      
      handleNodeClick({
        id: d.id,
        title: d.label || `Norma ${d.id}`,
        titulo_resumido: d.titulo_resumido || null,
        tipo: d.tipoNorma || '',
        numero: d.numero || null,
        sancion: d.sancion || null
      });
    });

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, loading, handleNodeHover, handleNodeClick, handleBackgroundClick]);

  // Calculate relationship directions for display
  const outgoingIds = new Set<number>();
  const incomingIds = new Set<number>();
  
  if (data) {
    data.links.forEach(link => {
      outgoingIds.add(link.source_infoleg_id);
      incomingIds.add(link.target_infoleg_id);
    });
  }

  if (loading) {
    return (
      <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
        {/* Header Section - Fixed */}
        <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
          <div className='text-start space-y-1'>
            <h1 className='text-2xl md:text-3xl font-bold font-serif'>
              Relaciones entre Normas
            </h1>
            <p className='text-muted-foreground text-xs md:text-sm'>
              Visualización de las relaciones entre normas
            </p>
          </div>
        </div>

        {/* Loading Content */}
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <Loader2 className='h-12 w-12 animate-spin mx-auto text-muted-foreground' />
            <p className='text-muted-foreground'>Cargando relaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
        {/* Header Section - Fixed */}
        <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
          <div className='text-start space-y-1'>
            <h1 className='text-2xl md:text-3xl font-bold font-serif'>
              Relaciones entre Normas
            </h1>
            <p className='text-muted-foreground text-xs md:text-sm'>
              Visualización de las relaciones entre normas
            </p>
          </div>
        </div>

        {/* Error Content */}
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <AlertCircle className='h-12 w-12 mx-auto text-destructive' />
            <div className='space-y-2'>
              <p className='text-lg font-semibold'>Error al cargar los datos</p>
              <p className='text-muted-foreground'>{error}</p>
            </div>
            <Button onClick={() => {
              hasFetchedRef.current = false;
              fetchNormasData();
            }} variant='outline'>
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || (data.nodes.length === 0 && data.links.length === 0)) {
    return (
      <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
        {/* Header Section - Fixed */}
        <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
          <div className='text-start space-y-1'>
            <h1 className='text-2xl md:text-3xl font-bold font-serif'>
              Relaciones entre Normas
            </h1>
            <p className='text-muted-foreground text-xs md:text-sm'>
              Visualización de las relaciones entre normas
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <Network className='h-12 w-12 mx-auto text-muted-foreground/50' />
            <div className='space-y-2'>
              <p className='text-lg font-semibold'>No hay relaciones para mostrar</p>
              <p className='text-muted-foreground'>
                No se encontraron relaciones entre normas en este momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden'>
      {/* Header Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-4'>
        <div className='text-start space-y-1'>
          <h1 className='text-2xl md:text-3xl font-bold font-serif'>
            Relaciones entre Normas
          </h1>
          <p className='text-muted-foreground text-xs md:text-sm'>
            Mostrando {data.nodes.length} normas y {data.links.length} relaciones
          </p>
        </div>
      </div>

      {/* Legend Section - Fixed */}
      <div className='flex-shrink-0 border-b bg-background px-4 md:px-6 py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex gap-6 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full' style={{backgroundColor: '#1f77b4'}}></div>
              <span>Normas que modifican otras</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full' style={{backgroundColor: '#ff7f0e'}}></div>
              <span>Normas modificadas por otras</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full' style={{backgroundColor: '#2ca02c'}}></div>
              <span>Normas aisladas</span>
            </div>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 text-muted-foreground hover:text-foreground'>
                <Info className='h-4 w-4' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80' side='bottom' align='end'>
              <div className='space-y-2'>
                <h4 className='font-medium text-sm'>Instrucciones</h4>
                <p className='text-xs text-muted-foreground mb-3'>
                  Cómo interactuar con el gráfico de relaciones
                </p>
                <div className='space-y-1.5 text-xs'>
                  <p>• Arrastra los nodos para moverlos</p>
                  <p>• Haz clic en un nodo para ver detalles</p>
                  <p>• Haz clic en el fondo para deseleccionar</p>
                  <p>• Usa la rueda del mouse o los controles + - para hacer zoom</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>


      {/* Graph Content - Scrollable */}
      <div className='flex-1 overflow-hidden bg-muted/30 relative'>
        <div className='h-full w-full'>
          <svg ref={svgRef} className='w-full h-full' />
        </div>
        
        {/* Zoom Controls - Top Right */}
        <div className='absolute top-4 right-4 flex flex-col gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={handleZoomIn}
            className='h-9 w-9 bg-background/95 backdrop-blur-sm border shadow-sm hover:bg-background'
            title='Acercar'
          >
            <Plus className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={handleZoomOut}
            className='h-9 w-9 bg-background/95 backdrop-blur-sm border shadow-sm hover:bg-background'
            title='Alejar'
          >
            <Minus className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={handleResetZoom}
            className='h-9 w-9 bg-background/95 backdrop-blur-sm border shadow-sm hover:bg-background'
            title='Restablecer zoom'
          >
            <RotateCcw className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Fixed-height Information Display */}
      <div className='flex-shrink-0 h-20 px-6 py-3 border-t flex items-center bg-background'>
        {nodeInfo ? (
          <div className='flex items-center w-full gap-4'>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getDotColor(nodeInfo.id, outgoingIds, incomingIds)}`}></div>
            <div className='flex-1 min-w-0'>
              <div className='font-bold font-serif text-base truncate'>
                {nodeInfo.tipo && nodeInfo.numero && nodeInfo.sancion 
                  ? `${nodeInfo.tipo} ${nodeInfo.numero}/${nodeInfo.sancion.split('-')[0]}`
                  : `Norma sin información: ${nodeInfo.id}`
                }
              </div>
              <div className='text-sm text-muted-foreground truncate'>
                {nodeInfo.titulo_resumido || 'S/N'}
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleNavigateToNorma(nodeInfo.id)}
              className='flex-shrink-0 h-8 w-8 p-0'
              title={`Ver detalles de ${nodeInfo.tipo || 'norma'} ${nodeInfo.numero || nodeInfo.id}`}
            >
              <ExternalLink className='h-4 w-4' />
            </Button>
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>
            Haz clic en un nodo para ver información
          </div>
        )}
      </div>
    </div>
  );
}
