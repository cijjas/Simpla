'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useNormaDetail } from '../hooks/use-norma-detail';
import { useRelatedNormas } from '../hooks/use-related-normas';
import { useNormaExpansion } from '../hooks/use-norma-expansion';
import { useNormaSidebar } from '../hooks/use-norma-sidebar';
import { useNormaRelaciones } from '../hooks/use-norma-relaciones';
import { NormaHeader, NormaSidebar, NormaBody, NormaControls, NormaActions, NormasAIChat } from '../components';

interface NormaDetailPageProps {
  infolegId: number;
}

export function NormaDetailPage({ infolegId }: NormaDetailPageProps) {
  const router = useRouter();
  const { norma, loading, error, retry } = useNormaDetail(infolegId);
  const { data: relacionesData, loading: relacionesLoading } = useNormaRelaciones(infolegId);

  const [open, setOpen] = useState<string[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);

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

  const {
    modifica,
    modificadaPor,
    modificaProgress,
    modificadaProgress,
    modificaCount,
    modificadaCount,
  } = useRelatedNormas({ modificaIds, modificadaIds, open });

  const {
    expandedDivisions,
    expandedArticles,
    toggleDivision,
    toggleArticle,
    expandAll,
    collapseAll,
  } = useNormaExpansion(norma?.divisions);

  const hasDivisions = norma?.divisions && norma.divisions.length > 0;
  const { activeDivisionId, divisionRefs, scrollToDivision } = useNormaSidebar(
    !!hasDivisions && !showOriginal,
  );

  if (loading) {
    return (
      <div className='flex'>
        {/* Sidebar skeleton */}
        <aside className='w-72 flex-shrink-0 border-r border-border bg-muted/30 h-[calc(100vh-3.5rem)] sticky top-14'>
          <div className='p-6 space-y-6'>
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
        <main className='flex-1 flex flex-col'>
          {/* Header skeleton */}
          <div className='w-full bg-muted/40 border-b border-border'>
            <div className='flex justify-center'>
              <div className='w-full max-w-4xl px-8 py-8 space-y-4'>
                <Skeleton className='h-10 w-3/4' />
                <div className='flex gap-2'>
                  <Skeleton className='h-6 w-20' />
                  <Skeleton className='h-6 w-24' />
                  <Skeleton className='h-6 w-20' />
                </div>
                <Skeleton className='h-4 w-1/2' />
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className='flex-1 flex justify-center'>
            <section className='w-full max-w-4xl px-8 py-12 space-y-6'>
              <div className='space-y-4'>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-24 w-full' />
                <Skeleton className='h-24 w-full' />
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex'>
        <aside className='w-72 flex-shrink-0 border-r border-border bg-muted/30 h-[calc(100vh-3.5rem)] sticky top-14'>
          <div className='p-6'>
            <Button variant='ghost' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Volver
            </Button>
          </div>
        </aside>
        <main className='flex-1 flex flex-col'>
          <div className='flex-1 flex justify-center'>
            <div className='max-w-4xl px-8 py-12'>
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
        </main>
      </div>
    );
  }

  if (!norma) {
    return (
      <div className='flex'>
        <aside className='w-72 flex-shrink-0 border-r border-border bg-muted/30 h-[calc(100vh-3.5rem)] sticky top-14'>
          <div className='p-6'>
            <Button variant='ghost' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Volver
            </Button>
          </div>
        </aside>
        <main className='flex-1 flex flex-col'>
          <div className='flex-1 flex justify-center'>
            <div className='max-w-4xl px-8 py-12'>
              <div className='text-center py-12'>
                <h3 className='text-lg font-semibold mb-2'>Norma no encontrada</h3>
                <p className='text-muted-foreground'>
                  La norma solicitada no existe o no está disponible.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const normaTitle = norma.titulo_resumido || norma.titulo_sumario || 'Normativa';
  const hasOriginalText = !!(norma.texto_norma || norma.texto_norma_actualizado);

  // Generate nombre norma (e.g., "Ley 26.994/2014")
  const getNombreNorma = () => {
    if (norma.tipo_norma && norma.referencia?.numero) {
      // get the year from the norma.sancion in format 'YYYY-MM-DD'
      const year = norma.sancion?.split('-')[0];
      return `${norma.tipo_norma} ${norma.referencia.numero}/${year}`;
    }
    if (norma.tipo_norma) {
      return norma.tipo_norma;
    }
    return 'NORMA';
  };

  const nombreNorma = getNombreNorma();

  return (
    <div className='flex'>
      {hasDivisions ? (
        <NormaSidebar
          divisions={norma.divisions}
          activeDivisionId={activeDivisionId}
          normaTitle={normaTitle}
          nombreNorma={nombreNorma}
          infolegId={infolegId}
          modifica={modifica ?? undefined}
          modificadaPor={modificadaPor ?? undefined}
          onDivisionClick={scrollToDivision}
          onBack={() => router.push('/normas')}
          showOutline={!showOriginal}
          relacionesData={relacionesData}
          relacionesLoading={relacionesLoading}
        />
      ) : (
        <aside className='w-72 flex-shrink-0 border-r border-border bg-muted/30 h-[calc(100vh-3.5rem)] sticky top-14'>
          <div className='p-6'>
            <Button variant='ghost' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Volver
            </Button>
          </div>
        </aside>
      )}

      <main className='flex-1 flex flex-col'>
        {/* Full-width header background */}
        <div className='w-full bg-muted/40 border-b border-border'>
          <div className='flex justify-center'>
            <div className='w-full px-8 py-8 max-w-4xl'>
              <NormaHeader
                norma={{
                  id: norma.id,
                  infoleg_id: norma.infoleg_id,
                  titulo_sumario: norma.titulo_sumario ?? null,
                  titulo_resumido: norma.titulo_resumido ?? null,
                  tipo_norma: norma.tipo_norma ?? null,
                  clase_norma: norma.clase_norma ?? null,
                  estado: norma.estado ?? null,
                  publicacion: norma.publicacion ?? null,
                  nro_boletin: norma.nro_boletin ?? null,
                  pag_boletin: norma.pag_boletin ?? null,
                  sancion: norma.sancion ?? null,
                  jurisdiccion: norma.jurisdiccion ?? null,
                  observaciones: norma.observaciones ?? null,
                  texto_norma: norma.texto_norma ?? null,
                  texto_resumido: norma.texto_resumido ?? null,
                }}
                open={open}
                onOpenChange={setOpen}
                modifica={modifica}
                modificadaPor={modificadaPor}
                modificaProgress={modificaProgress}
                modificadaProgress={modificadaProgress}
                modificaCount={modificaCount}
                modificadaCount={modificadaCount}
              />
            </div>
          </div>
        </div>

        {/* Sticky button row */}
        <div className='sticky top-14 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border'>
          <div className='flex justify-center'>
            <div className='w-full px-8 py-4 max-w-4xl flex items-center justify-between gap-4'>
              <NormaControls
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
                onToggleOriginal={() => setShowOriginal(!showOriginal)}
                showOriginal={showOriginal}
                hasOriginalText={hasOriginalText}
              />
              <NormaActions norma={{
                id: norma.id,
                infoleg_id: norma.infoleg_id,
                titulo_sumario: norma.titulo_sumario ?? null,
                titulo_resumido: norma.titulo_resumido ?? null,
                tipo_norma: norma.tipo_norma ?? null,
                clase_norma: norma.clase_norma ?? null,
                publicacion: norma.publicacion ?? null,
                nro_boletin: norma.nro_boletin ?? null,
                pag_boletin: norma.pag_boletin ?? null,
                sancion: norma.sancion ?? null,
                jurisdiccion: norma.jurisdiccion ?? null,
                texto_norma: norma.texto_norma ?? null,
              }} />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className='flex-1 flex justify-center'>
          <section className='w-full px-8 py-12 max-w-4xl'>
            <NormaBody
              divisions={norma.divisions}
              textoNorma={norma.texto_norma ?? null}
              textoNormaActualizado={norma.texto_norma_actualizado ?? null}
              expandedDivisions={expandedDivisions}
              expandedArticles={expandedArticles}
              showOriginal={showOriginal}
              onToggleDivision={toggleDivision}
              onToggleArticle={toggleArticle}
              divisionRefs={divisionRefs.current}
            />
          </section>
        </div>
      </main>

      {/* AI Chat Component */}
      <NormasAIChat 
        normaId={norma.id} 
        infolegId={norma.infoleg_id} 
      />
      </div>
  );
}
