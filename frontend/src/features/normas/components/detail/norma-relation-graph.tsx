'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Skeleton } from '@/components/ui/skeleton';
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

interface NormaRelationGraphProps {
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
  expanded?: boolean;
  onNodeHover?: (nodeInfo: { id: number; title: string; titulo_resumido: string | null; tipo: string; numero: number | null; sancion: string | null }) => void;
  onNodeClick?: (nodeInfo: { id: number; title: string; titulo_resumido: string | null; tipo: string; numero: number | null; sancion: string | null }) => void;
  onNodeLeave?: () => void;
}

export function NormaRelationGraph({ 
  infolegId, 
  data, 
  loading, 
  expanded = false,
  onNodeHover,
  onNodeClick,
  onNodeLeave
}: NormaRelationGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!data || loading || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // If no relationships at all (no nodes and no links), show empty state
    if (data.nodes.length === 0 && data.links.length === 0) {
      return;
    }

    const width = expanded ? 1800 : 280;
    const height = expanded ? 1000 : 240;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

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
    const linkDistance = expanded ? 350 : 70;
    const chargeStrength = expanded ? -1800 : -300;
    const collisionRadius = expanded ? 140 : 15;
    
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
      .attr('stroke-opacity', 0.6);

    // Create links
    const link = linkGroup.selectAll('line')
      .data(validLinks)
      .join('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', expanded ? 6 : 1)
      .attr('opacity', expanded ? 0.8 : 0.3);

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

    if (expanded) {
      // Expanded view: dots that get slightly bigger on hover
      const dotRadius = (d: Node) => d.type === 'current' ? 16 : 12;
      
      // Add circles
      node.append('circle')
        .attr('r', dotRadius)
        .attr('fill', d => d.type === 'current' ? '#3b82f6' : '#e5e7eb')
        .attr('stroke', d => d.type === 'current' ? '#2563eb' : '#9ca3af')
        .attr('stroke-width', 2)
        .attr('opacity', 1);

      // Add tooltip with full info
      node.append('title')
        .text(d => `ID: ${d.id}${d.tipoNorma ? `\nTipo: ${d.tipoNorma}` : ''}${d.label ? `\n${d.label}` : ''}`);

      // Add hover effects for expanded view
      node.on('mouseenter', function(event, d) {
        const nodeGroup = d3.select(this);
        
        // Make circle slightly bigger on hover
        nodeGroup.select('circle')
          .transition()
          .duration(200)
          .attr('r', d.type === 'current' ? 20 : 16);

        // Call hover callback
        if (onNodeHover) {
          onNodeHover({
            id: d.id,
            title: d.label || `Norma ${d.id}`,
            titulo_resumido: d.titulo_resumido || null,
            tipo: d.tipoNorma || '',
            numero: d.numero || null,
            sancion: d.sancion || null
          });
        }
      });

      node.on('mouseleave', function(event, d) {
        const nodeGroup = d3.select(this);
        
        // Reset circle size
        nodeGroup.select('circle')
          .transition()
          .duration(200)
          .attr('r', d.type === 'current' ? 16 : 12);

        // Call leave callback
        if (onNodeLeave) {
          onNodeLeave();
        }
      });
    } else {
      // Minimal view: circles
      node.append('circle')
        .attr('r', d => d.type === 'current' ? 6 : 4)
        .attr('fill', 'currentColor')
        .attr('opacity', 0.7);

      // Add hover effects
      node.on('mouseenter', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.type === 'current' ? 8 : 6)
          .attr('opacity', 1);

        // Call hover callback
        if (onNodeHover) {
          onNodeHover({
            id: d.id,
            title: d.label || `Norma ${d.id}`,
            titulo_resumido: d.titulo_resumido || null,
            tipo: d.tipoNorma || '',
            numero: d.numero || null,
            sancion: d.sancion || null
          });
        }
      });

      node.on('mouseleave', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', d.type === 'current' ? 6 : 4)
          .attr('opacity', 0.7);

        // Call leave callback
        if (onNodeLeave) {
          onNodeLeave();
        }
      });
    }

    // Add click handlers (common for both views)
    node.on('click', (event, d) => {
      event.stopPropagation();
      
      if (expanded) {
        // In expanded view, only update the info section
        if (onNodeClick) {
          onNodeClick({
            id: d.id,
            title: d.label || `Norma ${d.id}`,
            titulo_resumido: d.titulo_resumido || null,
            tipo: d.tipoNorma || '',
            numero: d.numero || null,
            sancion: d.sancion || null
          });
        }
      } else {
        // In minimal view, navigate if not current norma
        if (d.id !== infolegId) {
          router.push(`/normas/${d.id}`);
        }
      }
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
  }, [data, loading, infolegId, router, expanded, onNodeHover, onNodeClick, onNodeLeave]);

  if (loading) {
    return (
        <Skeleton className='h-60 w-full' />
    );
  }

  if (!data || (data.nodes.length === 0 && data.links.length === 0)) {
    return null;
  }

  return (
        <svg ref={svgRef} className={expanded ? 'w-full h-full' : 'w-full'} />
  );
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

