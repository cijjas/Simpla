'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { NormaActions } from '@/features/infoleg/norma/norma-actions';
import { AddToFolderDialog } from '@/features/folders';
import { formatDateSlash } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { NormaSummary, Division, Article as NormaArticle } from '../api/normas-api';
import { normasAPI } from '../api/normas-api';
import { useNormaDetail } from '../hooks/use-norma-detail';

interface NormaDetailPageProps {
  infolegId: number;
}

export function NormaDetailPage({ infolegId }: NormaDetailPageProps) {
  const router = useRouter();
  const { norma, loading, error, retry } = useNormaDetail(infolegId);

  // Header state
  const [open, setOpen] = useState<string[]>([]);
  const [modifica, setModifica] = useState<NormaSummary[] | null>(null);
  const [modificadaPor, setModificadaPor] = useState<NormaSummary[] | null>(null);
  const [modificaProgress, setModificaProgress] = useState(0);
  const [modificadaProgress, setModificadaProgress] = useState(0);
  const [_copied, setCopied] = useState(false);
  const [isAddToFolderOpen, setIsAddToFolderOpen] = useState(false);

  // Body state
  const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(new Set());
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [showOriginal, setShowOriginal] = useState(false);

  // Initialize expanded divisions when norma loads
  useEffect(() => {
    if (norma?.divisions) {
      setExpandedDivisions(new Set(norma.divisions.slice(0, 3).map(d => d.id)));
    }
  }, [norma]);

  const _handleCopy = async () => {
    if (!norma) return;
    try {
      await navigator.clipboard.writeText(norma.texto_norma || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const fetchList = async (
    ids: number[],
    setter: (d: NormaSummary[]) => void,
    setProgress: (p: number) => void,
  ) => {
    if (!ids.length) return;
    
    // Fetch all summaries in parallel for better performance
    const promises = ids.map(async (id) => {
      try {
        return await normasAPI.getNormaSummary(id);
      } catch (error) {
        console.error(`Failed to fetch norma ${id}:`, error);
        return null;
      }
    });
    
    // Update progress as requests complete
    let completed = 0;
    const results = await Promise.allSettled(promises);
    
    results.forEach((_result) => {
      completed++;
      setProgress((completed / ids.length) * 100);
    });
    
    const validResults = results
      .filter((result): result is PromiseFulfilledResult<NormaSummary> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
    
    setter(validResults);
  };

  // Extract IDs from the lista_normas fields
  const modificaIds = useMemo(() => 
    Array.isArray(norma?.lista_normas_que_complementa)
      ? norma.lista_normas_que_complementa.map((id) => Number(id))
      : [], 
    [norma?.lista_normas_que_complementa]
  );
  const modificadaIds = useMemo(() => 
    Array.isArray(norma?.lista_normas_que_la_complementan)
      ? norma.lista_normas_que_la_complementan.map((id) => Number(id))
      : [], 
    [norma?.lista_normas_que_la_complementan]
  );

  useEffect(() => {
    if (!norma) return;
    
    if (
      open.includes('modifica') &&
      modifica === null &&
      modificaIds.length
    ) {
      fetchList(modificaIds, setModifica, setModificaProgress);
    }
    if (
      open.includes('modificada') &&
      modificadaPor === null &&
      modificadaIds.length
    ) {
      fetchList(modificadaIds, setModificadaPor, setModificadaProgress);
    }
  }, [open, modifica, modificadaPor, norma, modificaIds, modificadaIds]);

  const modificaCount = modificaIds.length;
  const modificadaCount = modificadaIds.length;

  // Convert to old format for NormaActions compatibility
  const legacyNorma = norma ? {
    id: norma.infoleg_id,
    esNumerada: true,
    nombreNorma: norma.titulo_resumido || norma.titulo_sumario || 'Sin título',
    copyTexto: norma.texto_norma || '',
    tituloSumarioFormateado: norma.titulo_sumario || '',
    tituloResumidoFormateado: norma.titulo_resumido || '',
    textoNorma: norma.texto_norma || '',
  } : null;

  // Body functions
  const toggleDivision = (divisionId: number) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(divisionId)) {
      newExpanded.delete(divisionId);
    } else {
      newExpanded.add(divisionId);
    }
    setExpandedDivisions(newExpanded);
  };

  const toggleArticle = (articleId: number) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  const expandAll = () => {
    if (!norma?.divisions) return;
    const allDivisionIds = new Set<number>();
    const allArticleIds = new Set<number>();
    
    const collectIds = (divs: Division[]) => {
      divs.forEach(div => {
        allDivisionIds.add(div.id);
        
        const collectArticleIds = (articles: NormaArticle[]) => {
          articles.forEach(art => {
            allArticleIds.add(art.id);
            if (art.child_articles.length > 0) {
              collectArticleIds(art.child_articles);
            }
          });
        };
        
        collectArticleIds(div.articles);
        
        if (div.child_divisions.length > 0) {
          collectIds(div.child_divisions);
        }
      });
    };
    
    collectIds(norma.divisions);
    setExpandedDivisions(allDivisionIds);
    setExpandedArticles(allArticleIds);
  };

  const collapseAll = () => {
    setExpandedDivisions(new Set());
    setExpandedArticles(new Set());
  };

  const renderArticle = (article: NormaArticle, level: number = 0) => {
    const isExpanded = expandedArticles.has(article.id);
    const hasChildren = article.child_articles.length > 0;
    const cleanBody = DOMPurify.sanitize(article.body);
    
    // Calculate indentation - consistent 24px per level
    const indent = level * 24;

    return (
      <div key={article.id} className="relative">
        {/* Vertical connector line for nested items */}
        {level > 0 && (
          <div 
            className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-border/30 to-transparent"
            style={{ left: `${indent - 12}px` }}
          />
        )}
        
        <div 
          className="flex items-start gap-3 py-2"
          style={{ paddingLeft: `${indent}px` }}
        >
          {/* Expand/collapse button or indicator */}
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
            {hasChildren ? (
              <button
                onClick={() => toggleArticle(article.id)}
                className="hover:bg-accent rounded transition-colors p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
            )}
          </div>

          {/* Article content */}
          <div className="flex-1 min-w-0">
            {article.ordinal && (
              <span className="font-serif font-semibold text-base text-foreground mr-2">
                Artículo {article.ordinal}
              </span>
            )}
            <div
              className="inline text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none norma-html"
              dangerouslySetInnerHTML={{ __html: cleanBody }}
            />
          </div>
        </div>

        {/* Child articles */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {article.child_articles.map(child => renderArticle(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderDivision = (division: Division, level: number = 0) => {
    const isExpanded = expandedDivisions.has(division.id);
    const hasContent = division.articles.length > 0 || division.child_divisions.length > 0;
    const cleanBody = division.body ? DOMPurify.sanitize(division.body) : null;
    
    // Size mapping based on level
    const sizeClasses = {
      0: { 
        heading: 'text-2xl', 
        ordinal: 'text-xl', 
        spacing: 'mb-8', 
        topPadding: 'pt-6',
        borderWeight: 'border-b',
        borderColor: 'border-border/40'
      },
      1: { 
        heading: 'text-xl', 
        ordinal: 'text-lg', 
        spacing: 'mb-6', 
        topPadding: 'pt-4',
        borderWeight: 'border-b',
        borderColor: 'border-border/30'
      },
      2: { 
        heading: 'text-lg', 
        ordinal: 'text-base', 
        spacing: 'mb-4', 
        topPadding: 'pt-3',
        borderWeight: 'border-b',
        borderColor: 'border-border/20'
      }
    };
    
    const sizes = sizeClasses[Math.min(level, 2) as keyof typeof sizeClasses];
    const indent = level * 24;

    return (
      <div key={division.id} className={sizes.spacing}>
        {/* Division header */}
        <div 
          className={cn('pb-3', sizes.borderWeight, sizes.borderColor)}
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-start gap-3">
            {/* Expand/collapse button or indicator */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-1">
              {hasContent ? (
                <button
                  onClick={() => toggleDivision(division.id)}
                  className="hover:bg-accent rounded transition-colors p-0.5"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="w-2 h-2 rounded-full bg-border" />
              )}
            </div>

            {/* Division title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                {division.ordinal && (
                  <span className={cn('font-serif font-bold', sizes.ordinal, 'text-foreground')}>
                    {division.ordinal}
                  </span>
                )}
                <h3 className={cn('font-serif font-semibold', sizes.heading, 'text-foreground')}>
                  {division.name || division.title || 'División sin título'}
                </h3>
              </div>
              
              {cleanBody && (
                <div
                  className="mt-2 text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none norma-html"
                  dangerouslySetInnerHTML={{ __html: cleanBody }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Division content */}
        {hasContent && isExpanded && (
          <div className="mt-4" style={{ marginLeft: `${indent}px` }}>
            {/* Articles */}
            {division.articles.length > 0 && (
              <div className="mb-6">
                {division.articles.map(article => renderArticle(article, 0))}
              </div>
            )}

            {/* Child divisions */}
            {division.child_divisions.length > 0 && (
              <div className="ml-6 border-l border-border/20 pl-6 space-y-6">
                {division.child_divisions.map(child => renderDivision(child, level + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              className="ml-4"
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!norma) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Norma no encontrada</h3>
          <p className="text-muted-foreground">La norma solicitada no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      {/* Main content */}
      <section className='container mx-auto max-w-5xl space-y-10'>
        {/* Header Section */}
        <header className='space-y-6'>
          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <h1 className='text-3xl font-bold font-serif leading-tight break-words'>
              {norma.titulo_sumario || norma.titulo_resumido || 'Sin título'}
            </h1>
            <div className="flex items-center gap-2">
              {legacyNorma && <NormaActions norma={legacyNorma} />}
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
            {norma.tipo_norma?.trim() && <Badge>{norma.tipo_norma}</Badge>}
            {norma.clase_norma?.trim() && (
              <Badge variant='secondary'>{norma.clase_norma}</Badge>
            )}
            {norma.estado?.trim() && (
              <Badge variant='outline'>{norma.estado}</Badge>
            )}

            <div className='h-4 border-l border-border/30 mx-1' />

            {norma.publicacion && (
              <span>Publicación: {formatDateSlash(norma.publicacion)}</span>
            )}

            {norma.nro_boletin && (
              <span>
                Boletín Oficial&nbsp;{norma.nro_boletin}
                {norma.pag_boletin && ` • pág ${norma.pag_boletin}`}
              </span>
            )}

            <div className='h-4 border-l border-border/30 mx-1' />

            {norma.sancion && (
              <span>Sanción: {formatDateSlash(norma.sancion)}</span>
            )}
            {norma.jurisdiccion && <span>Jurisdicción: {norma.jurisdiccion}</span>}
          </div>

          {!!(modificaCount || modificadaCount) && (
            <Accordion
              type='multiple'
              className='w-full'
              value={open}
              onValueChange={setOpen}
            >
              {modificaCount > 0 && (
                <AccordionItem value='modifica'>
                  <AccordionTrigger>Modifica ({modificaCount})</AccordionTrigger>
                  <AccordionContent>
                    {modifica === null ? (
                      <Progress value={modificaProgress} />
                    ) : (
                      <ul className='flex flex-col gap-2'>
                        {modifica.map(n => (
                          <NormaListItem key={n.id} data={n} />
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {modificadaCount > 0 && (
                <AccordionItem value='modificada'>
                  <AccordionTrigger>
                    Modificada por ({modificadaCount})
                  </AccordionTrigger>
                  <AccordionContent>
                    {modificadaPor === null ? (
                      <Progress value={modificadaProgress} />
                    ) : (
                      <ul className='flex flex-col gap-2'>
                        {modificadaPor.map(n => (
                          <NormaListItem key={n.id} data={n} secondary />
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {norma.observaciones && (
            <blockquote className='border-l-4 border-primary pl-4 italic text-muted-foreground'>
              {norma.observaciones}
            </blockquote>
          )}
        </header>

        {/* Body Section */}
        <div className='space-y-6'>
          {!norma.divisions.length && !norma.texto_norma && !norma.texto_norma_actualizado ? (
            <Alert variant='default' className='my-6'>
              <Info className='h-4 w-4' />
              <AlertTitle>Sin contenido estructurado</AlertTitle>
              <AlertDescription>
                Esta norma no contiene divisiones o artículos estructurados.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Controls */}
              <div className='flex items-center gap-2 flex-wrap'>
                <Button variant='outline' size='sm' onClick={expandAll}>
                  Expandir todo
                </Button>
                <Button variant='outline' size='sm' onClick={collapseAll}>
                  Contraer todo
                </Button>
                {(norma.texto_norma || norma.texto_norma_actualizado) && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowOriginal(!showOriginal)}
                  >
                    {showOriginal ? 'Ver estructura' : 'Ver texto original'}
                  </Button>
                )}
              </div>

              {/* Content */}
              {showOriginal && (norma.texto_norma || norma.texto_norma_actualizado) ? (
                <div
                  className='prose max-w-none text-gray-700 dark:text-slate-300 norma-html'
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(norma.texto_norma || norma.texto_norma_actualizado || '') 
                  }}
                />
              ) : (
                <div className='space-y-8'>
                  {norma.divisions.map(division => renderDivision(division))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Add to Folder Dialog */}
      <AddToFolderDialog
        isOpen={isAddToFolderOpen}
        onClose={() => setIsAddToFolderOpen(false)}
        normaId={norma.id}
        normaTitle={norma.titulo_resumido || norma.titulo_sumario}
      />
    </div>
  );
}

function NormaListItem({
  data,
  secondary = false,
}: {
  data: NormaSummary;
  secondary?: boolean;
}) {
  const displayDate = data.publicacion || data.sancion;

  return (
    <li className='flex flex-wrap items-baseline gap-2'>
      {data.tipo_norma && (
        <Badge variant={secondary ? 'secondary' : 'default'}>
          {data.tipo_norma}
        </Badge>
      )}
      <Link
        href={`/norma/${data.infoleg_id}`}
        className='font-medium text-foreground font-serif hover:underline'
      >
        N° {data.infoleg_id}
      </Link>
      {displayDate && (
        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          {formatDateSlash(displayDate)}
        </span>
      )}
      <span className='flex-1 truncate text-sm'>
        {data.titulo_sumario || data.titulo_resumido || 'Sin título'}
      </span>
    </li>
  );
}