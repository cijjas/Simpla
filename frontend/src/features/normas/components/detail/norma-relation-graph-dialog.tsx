'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

interface NormaRelationGraphDialogProps {
  infolegId: number;
  data?: {
    current_norma: {
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
  };
  loading?: boolean;
}

export function NormaRelationGraphDialog({ 
  infolegId, 
  data, 
  loading
}: NormaRelationGraphDialogProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [outgoingIds, setOutgoingIds] = useState<Set<number>>(new Set());
  const [incomingIds, setIncomingIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Preselect the current norma when data is available
  useEffect(() => {
    if (data && data.current_norma && !nodeInfo) {
      // Start with the current norma selected
      setNodeInfo({
        id: data.current_norma.infoleg_id,
        title: data.current_norma.titulo || `Norma ${data.current_norma.infoleg_id}`,
        titulo_resumido: data.current_norma.titulo_resumido,
        tipo: data.current_norma.tipo_norma || '',
        numero: data.current_norma.numero,
        sancion: data.current_norma.sancion
      });
    }
  }, [data, nodeInfo]);

  // Use useCallback to create stable callback references
  // Both hover and click have the same behavior - show node info
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

  // Calculate relationship directions when data changes
  useEffect(() => {
    if (data && data.links) {
      const outgoing = new Set<number>();
      const incoming = new Set<number>();
      
      data.links.forEach(link => {
        if (link.source_infoleg_id === infolegId) {
          outgoing.add(link.target_infoleg_id);
        }
        if (link.target_infoleg_id === infolegId) {
          incoming.add(link.source_infoleg_id);
        }
      });
      
      setOutgoingIds(outgoing);
      setIncomingIds(incoming);
    }
  }, [data, infolegId]);

  // Get dot color based on relationship type - matches graph exactly
  const getDotColor = useCallback((nodeId: number) => {
    if (nodeId === infolegId) {
      return 'bg-[var(--muted-foreground)] border border-accent-foreground'; // Current norma
    }
    if (incomingIds.has(nodeId)) {
      return 'bg-muted-foreground border border-border'; // Modifies current
    }
    if (outgoingIds.has(nodeId)) {
      return 'bg-[var(--background)] border border-muted-foreground'; // Gets modified by current
    }
    return 'bg-background border border-border'; // Default
  }, [infolegId, outgoingIds, incomingIds]);

  useEffect(() => {
    if (!data || loading || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // If no relationships at all (no nodes and no links), show empty state
    if (data.nodes.length === 0 && data.links.length === 0) {
      return;
    }

    const width = 1800;
    const height = 1000;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add background click handler
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'default')
      .on('click', handleBackgroundClick);

    // Create a map of all infoleg_ids to ensure we have all nodes
    const nodeMap = new Map<number, Node>();
    
    // Add current norma
    nodeMap.set(data.current_norma.infoleg_id, {
      id: data.current_norma.infoleg_id,
      label: truncateText(data.current_norma.titulo || `Norma ${data.current_norma.infoleg_id}`, 20),
      type: 'current',
      tipoNorma: data.current_norma.tipo_norma || undefined,
      titulo_resumido: data.current_norma.titulo_resumido || null,
      numero: data.current_norma.numero || null,
      sancion: data.current_norma.sancion || null,
    });
    
    // Add related normas from data.nodes
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
      if (!nodeMap.has(link.source_infoleg_id) && link.source_infoleg_id !== infolegId) {
        nodeMap.set(link.source_infoleg_id, {
          id: link.source_infoleg_id,
          label: `Norma ${link.source_infoleg_id}`,
          type: 'related' as const,
        });
      }
      // Add target node if not already present
      if (!nodeMap.has(link.target_infoleg_id) && link.target_infoleg_id !== infolegId) {
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
    
    // Determine which nodes are outgoing (modified by current) vs incoming (modify current)
    const outgoingIds = new Set<number>();
    const incomingIds = new Set<number>();
    
    data.links.forEach(link => {
      if (link.source_infoleg_id === infolegId) {
        outgoingIds.add(link.target_infoleg_id);
      }
      if (link.target_infoleg_id === infolegId) {
        incomingIds.add(link.source_infoleg_id);
      }
    });
    
    // Convert map to array
    const nodes: Node[] = Array.from(nodeMap.values());

    // Create force simulation with forceX to separate outgoing/incoming
    const linkDistance = 350;
    const chargeStrength = -1800;
    const collisionRadius = 140;
    
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<Node, Link>(validLinks)
        .id(d => d.id)
        .distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('centerY', d3.forceY(height / 2).strength(0.1))
      .force('x', d3.forceX<Node>(d => {
        if (d.id === infolegId) return width / 2;
        if (outgoingIds.has(d.id)) return width * 0.8; // Affected by current → RIGHT
        if (incomingIds.has(d.id)) return width * 0.2; // Affect current → LEFT
        return width / 2;
      }).strength(0.5))
      .force('collision', d3.forceCollide().radius(collisionRadius));

    // Create container for links
    const linkGroup = svg.append('g')
      .attr('class', 'links')
      .attr('stroke-opacity', 0.2);

    // Create links
    const link = linkGroup.selectAll('line')
      .data(validLinks)
      .join('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 6)
      .attr('opacity', 0.8);

    // Create container for nodes
    const nodeGroup = svg.append('g')
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

    const dotRadius = (d: Node) => d.type === 'current' ? 24 : 18;
    
    // Add circles with colors based on relationship direction
    node.append('circle')
      .attr('r', dotRadius)
      .attr('fill', d => {
        if (d.type === 'current') return 'var(--muted-foreground)'; // Current norma - blue
        if (incomingIds.has(d.id)) return 'var(--muted-foreground)'; // Modifies current - background color
        if (outgoingIds.has(d.id)) return 'var(--background)'; // Gets modified - gray
        return 'var(--background)'; // Default
      })
      .attr('stroke', d => {
        if (d.type === 'current') return 'var(--accent-foreground)';
        if (incomingIds.has(d.id)) return 'var(--border)'; // Border for visibility
        if (outgoingIds.has(d.id)) return 'var(--muted-foreground)'; // Border for visibility
        return 'var(--border)';
      })
      .attr('stroke-width', 3)
      .attr('opacity', 1);

    // Remove tooltips for cleaner interaction

    // Add hover effects
    node.on('mouseenter', function(event, d) {
      const nodeGroup = d3.select(this);
      
      // Make circle slightly bigger on hover
      nodeGroup.select('circle')
        .transition()
        .duration(200)
        .attr('r', d.type === 'current' ? 28 : 22);

      handleNodeHover({
        id: d.id,
        title: d.label || `Norma ${d.id}`,
        titulo_resumido: d.titulo_resumido || null,
        tipo: d.tipoNorma || '',
        numero: d.numero || null,
        sancion: d.sancion || null
      });
    });

    node.on('mouseleave', function(event, d) {
      const nodeGroup = d3.select(this);
      
      // Reset circle size
      nodeGroup.select('circle')
        .transition()
        .duration(200)
        .attr('r', d.type === 'current' ? 24 : 18);
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
  }, [data, loading, infolegId, handleNodeHover, handleNodeClick, handleBackgroundClick]);

  if (loading) {
    return (
      <div className='w-full h-full flex items-center justify-center'>
        <Skeleton className='h-full w-full' />
      </div>
    );
  }

  if (!data || (data.nodes.length === 0 && data.links.length === 0)) {
    return (
      <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
        No hay relaciones para mostrar
      </div>
    );
  }

  return (
    <div className='w-full h-full flex flex-col'>
      {/* Graph Area */}
      <div className='flex-1 min-h-0 overflow-hidden'>
        <svg ref={svgRef} className='w-full h-full' />
      </div>
      
      {/* Fixed-height Information Display */}
      <div className='flex-shrink-0 h-20 px-6 py-3 border-t flex items-center bg-muted/30'>
        {nodeInfo ? (
          <div className='flex items-center w-full gap-4'>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getDotColor(nodeInfo.id)}`}></div>
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
            Cargando información...
          </div>
        )}
      </div>
    </div>
  );
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

