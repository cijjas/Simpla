'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { NormaActions } from '@/features/infoleg/norma/norma-actions';
import { AddToFolderDialog } from '@/features/folders';
import { formatDateSlash } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  NormaSummary,
  Division,
  Article as NormaArticle,
} from '../api/normas-api';
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
  const [modificadaPor, setModificadaPor] = useState<NormaSummary[] | null>(
    null,
  );
  const [modificaProgress, setModificaProgress] = useState(0);
  const [modificadaProgress, setModificadaProgress] = useState(0);
  const [_copied, setCopied] = useState(false);
  const [isAddToFolderOpen, setIsAddToFolderOpen] = useState(false);

  // Body state
  const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(
    new Set(),
  );
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(
    new Set(),
  );
  const [showOriginal, setShowOriginal] = useState(false);

  // Sidebar state
  const [activeDivisionId, setActiveDivisionId] = useState<number | null>(null);
  const divisionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Initialize all divisions as expanded by default
  useEffect(() => {
    if (norma?.divisions) {
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
    }
  }, [norma]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      let currentDivision: number | null = null;

      divisionRefs.current.forEach((element, divisionId) => {
        const rect = element.getBoundingClientRect();
        const offsetTop = window.scrollY + rect.top;

        if (offsetTop <= scrollPosition) {
          currentDivision = divisionId;
        }
      });

      setActiveDivisionId(currentDivision);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [norma]);

  const scrollToDivision = (divisionId: number) => {
    const element = divisionRefs.current.get(divisionId);
    if (element) {
      const offset = 80;
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

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

    const promises = ids.map(async id => {
      try {
        return await normasAPI.getNormaSummary(id);
      } catch (error) {
        console.error(`Failed to fetch norma ${id}:`, error);
        return null;
      }
    });

    let completed = 0;
    const results = await Promise.allSettled(promises);

    results.forEach(_result => {
      completed++;
      setProgress((completed / ids.length) * 100);
    });

    const validResults = results
      .filter(
        (result): result is PromiseFulfilledResult<NormaSummary> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map(result => result.value);

    setter(validResults);
  };

  const modificaIds = useMemo(
    () =>
      Array.isArray(norma?.lista_normas_que_complementa)
        ? norma.lista_normas_que_complementa.map(id => Number(id))
        : [],
    [norma?.lista_normas_que_complementa],
  );
  const modificadaIds = useMemo(
    () =>
      Array.isArray(norma?.lista_normas_que_la_complementan)
        ? norma.lista_normas_que_la_complementan.map(id => Number(id))
        : [],
    [norma?.lista_normas_que_la_complementan],
  );

  useEffect(() => {
    if (!norma) return;

    if (open.includes('modifica') && modifica === null && modificaIds.length) {
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

  const legacyNorma = norma
    ? {
        id: norma.id, // Use database ID for favorites, not infoleg_id
        infolegId: norma.infoleg_id, // Keep infoleg_id for reference
        esNumerada: true,
        nombreNorma:
          norma.titulo_resumido || norma.titulo_sumario || 'Sin título',
        copyTexto: norma.texto_norma || '',
        tituloSumarioFormateado: norma.titulo_sumario || '',
        tituloResumidoFormateado: norma.titulo_resumido || '',
        textoNorma: norma.texto_norma || '',
      }
    : null;

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

    const indent = level * 24;

    return (
      <div key={article.id} className='relative'>
        {level > 0 && (
          <div
            className='absolute top-0 bottom-0 w-px bg-border'
            style={{ left: `${indent - 12}px` }}
          />
        )}

        <div
          className='flex items-start gap-3 py-2'
          style={{ paddingLeft: `${indent}px` }}
        >
          <div className='flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5'>
            {hasChildren ? (
              <button
                onClick={() => toggleArticle(article.id)}
                className='hover:bg-accent rounded transition-colors p-0.5'
              >
                {isExpanded ? (
                  <ChevronDown className='h-4 w-4 text-muted-foreground' />
                ) : (
                  <ChevronRight className='h-4 w-4 text-muted-foreground' />
                )}
              </button>
            ) : (
              <div className='w-1.5 h-1.5 rounded-full bg-border' />
            )}
          </div>

          <div className='flex-1 min-w-0'>
            {article.ordinal && (
              <span className='font-serif font-semibold text-base text-foreground mr-2'>
                Artículo {article.ordinal}
              </span>
            )}
            <div
              className='inline text-[15px] text-muted-foreground leading-[1.8] tracking-wide prose prose-sm max-w-none norma-html text-justify'
              dangerouslySetInnerHTML={{ __html: cleanBody }}
            />
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className='mt-1'>
            {article.child_articles.map(child =>
              renderArticle(child, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDivision = (division: Division, level: number = 0) => {
    const isExpanded = expandedDivisions.has(division.id);
    const hasContent =
      division.articles.length > 0 || division.child_divisions.length > 0;
    const cleanBody = division.body ? DOMPurify.sanitize(division.body) : null;

    const sizeClasses = {
      0: {
        heading: 'text-2xl',
        ordinal: 'text-xl',
        spacing: 'mb-8',
        topPadding: 'pt-6',
        borderWeight: 'border-b',
        borderColor: 'border-border/40',
      },
      1: {
        heading: 'text-xl',
        ordinal: 'text-lg',
        spacing: 'mb-6',
        topPadding: 'pt-4',
        borderWeight: 'border-b',
        borderColor: 'border-border/30',
      },
      2: {
        heading: 'text-lg',
        ordinal: 'text-base',
        spacing: 'mb-4',
        topPadding: 'pt-3',
        borderWeight: 'border-b',
        borderColor: 'border-border/20',
      },
    };

    const sizes = sizeClasses[Math.min(level, 2) as keyof typeof sizeClasses];
    const indent = level * 24;

    return (
      <div
        key={division.id}
        className={sizes.spacing}
        ref={el => {
          if (el && level === 0) {
            divisionRefs.current.set(division.id, el);
          }
        }}
        id={`division-${division.id}`}
      >
        <div
          className={cn('pb-3', sizes.borderWeight, sizes.borderColor)}
          style={{ marginLeft: `${indent}px` }}
        >
          <div className='flex items-start gap-3'>
            <div className='flex-shrink-0 w-6 h-6 flex items-center justify-center mt-1'>
              {hasContent ? (
                <button
                  onClick={() => toggleDivision(division.id)}
                  className='hover:bg-accent rounded transition-colors p-0.5'
                >
                  {isExpanded ? (
                    <ChevronDown className='h-5 w-5 text-muted-foreground' />
                  ) : (
                    <ChevronRight className='h-5 w-5 text-muted-foreground' />
                  )}
                </button>
              ) : (
                <div className='w-2 h-2 rounded-full bg-border' />
              )}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-baseline gap-2 flex-wrap mb-1'>
                {division.ordinal && (
                  <span
                    className={cn(
                      'font-serif font-bold',
                      sizes.ordinal,
                      'text-foreground',
                    )}
                  >
                    {division.ordinal}
                  </span>
                )}
                <h3
                  className={cn(
                    'font-serif font-semibold',
                    sizes.heading,
                    'text-foreground',
                  )}
                >
                  {division.name || division.title || 'División sin título'}
                </h3>
              </div>

              {cleanBody && (
                <div
                  className='mt-2 text-[15px] text-muted-foreground leading-[1.8] tracking-wide prose prose-sm max-w-none norma-html text-justify'
                  dangerouslySetInnerHTML={{ __html: cleanBody }}
                />
              )}
            </div>
          </div>
        </div>

        {hasContent && isExpanded && (
          <div className='mt-4' style={{ marginLeft: `${indent}px` }}>
            {division.articles.length > 0 && (
              <div className='mb-6'>
                {division.articles.map(article => renderArticle(article, 0))}
              </div>
            )}

            {division.child_divisions.length > 0 && (
              <div className='ml-6 border-l border-border pl-6 space-y-6'>
                {division.child_divisions.map(child =>
                  renderDivision(child, level + 1),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className='min-h-screen'>
        <div className='flex'>
          {/* Sidebar skeleton */}
          <aside className='w-72 flex-shrink-0 border-r border-border bg-muted/30'>
            <div className='sticky top-0 p-6 space-y-6'>
              {/* Back button skeleton */}
              <Skeleton className='h-10 w-28' />

              {/* Navigation skeleton */}
              <div className='space-y-3'>
                <Skeleton className='h-5 w-24' />
                <div className='space-y-2'>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                </div>
              </div>
            </div>
          </aside>

          {/* Main content skeleton */}
          <main className='flex-1 flex justify-center'>
            <section className='w-full max-w-4xl px-8 py-12 space-y-6'>
              <div className='space-y-4'>
                <Skeleton className='h-10 w-3/4' />
                <div className='flex gap-2'>
                  <Skeleton className='h-6 w-20' />
                  <Skeleton className='h-6 w-24' />
                  <Skeleton className='h-6 w-20' />
                </div>
                <Skeleton className='h-4 w-1/2' />
              </div>
              <div className='space-y-4'>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-24 w-full' />
                <Skeleton className='h-24 w-full' />
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center gap-4 mb-6'>
            <Button variant='ghost' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Volver
            </Button>
          </div>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='flex items-center justify-between'>
              <span>{error}</span>
              <Button
                variant='outline'
                size='sm'
                onClick={retry}
                className='ml-4'
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!norma) {
    return (
      <div className='min-h-screen p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center gap-4 mb-6'>
            <Button variant='ghost' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Volver
            </Button>
          </div>
          <div className='text-center py-12'>
            <h3 className='text-lg font-semibold mb-2'>Norma no encontrada</h3>
            <p className='text-muted-foreground'>
              La norma solicitada no existe o no está disponible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasDivisions = norma.divisions && norma.divisions.length > 0;

  return (
    <div className='min-h-screen'>
      {/* Layout with sidebar pushed to the edge */}
      <div className='flex'>
        {/* Sticky Sidebar - only show if there are divisions and not showing original text */}
        {hasDivisions && !showOriginal && (
          <aside className='w-72 flex-shrink-0 border-r border-border bg-muted/30 h-screen sticky top-0'>
            <div className='p-6 space-y-6 flex flex-col h-full'>
              {/* Back button - always visible */}
              <div className='flex-shrink-0'>
                <Button variant='ghost' onClick={() => router.back()}>
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Volver
                </Button>
              </div>

              {/* Navigation */}
              <ScrollArea className='flex-1'>
                <nav className='space-y-1 pr-2'>
                  <h2 className='font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4 px-3'>
                    Contenido
                  </h2>
                  {norma.divisions.map(division => (
                    <button
                      key={division.id}
                      onClick={() => scrollToDivision(division.id)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-md text-sm font-serif transition-all',
                        activeDivisionId === division.id
                          ? 'bg-accent text-foreground font-semibold border-l-2 border-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <span className='line-clamp-2'>
                        {division.ordinal && (
                          <span className='font-medium mr-1.5'>
                            {division.ordinal}
                          </span>
                        )}
                        {division.name ||
                          division.title ||
                          'División sin título'}
                      </span>
                    </button>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>
        )}

        {/* Main content area - centered with max width */}
        <main className='flex-1 flex justify-center'>
          <section
            className={cn(
              'w-full space-y-10',
              hasDivisions && !showOriginal
                ? 'max-w-4xl px-8 py-12'
                : 'max-w-5xl px-12 py-12',
            )}
          >
            {/* Back button when sidebar is not visible */}
            {(!hasDivisions || showOriginal) && (
              <div className='mb-6'>
                <Button variant='ghost' onClick={() => router.back()}>
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Volver
                </Button>
              </div>
            )}
            {/* Header Section */}
            <header className='space-y-6'>
              <div className='flex items-center justify-between gap-4 flex-wrap'>
                <h1 className='text-3xl font-bold font-serif leading-tight break-words'>
                  {norma.titulo_sumario ||
                    norma.titulo_resumido ||
                    'Sin título'}
                </h1>
                <div className='flex items-center gap-2'>
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
                {norma.jurisdiccion && (
                  <span>Jurisdicción: {norma.jurisdiccion}</span>
                )}
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
                      <AccordionTrigger>
                        Modifica ({modificaCount})
                      </AccordionTrigger>
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
                <blockquote className='border-l-4 border-primary pl-4 italic text-muted-foreground text-justify'>
                  {norma.observaciones}
                </blockquote>
              )}
            </header>

            {/* Body Section */}
            <div className='space-y-6'>
              {!norma.divisions.length &&
              !norma.texto_norma &&
              !norma.texto_norma_actualizado ? (
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
                  {showOriginal &&
                  (norma.texto_norma || norma.texto_norma_actualizado) ? (
                    <div
                      className='prose max-w-none text-gray-700 dark:text-slate-300 norma-html font-serif text-justify'
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          norma.texto_norma ||
                            norma.texto_norma_actualizado ||
                            '',
                        ),
                      }}
                    />
                  ) : (
                    <div className='space-y-8'>
                      {norma.divisions.map(division =>
                        renderDivision(division),
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      </div>

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
