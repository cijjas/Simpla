import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { NormaActions } from './NormaActions'; // client
import { Separator } from '@/components/ui/separator';

/**
 * Shape of a full "norma" object returned by Infoleg (v2) API.
 */
export interface Norma {
  id: number;
  jurisdiccion?: string;
  claseNorma?: string;
  tipoNorma?: string;
  sancion?: string;
  publicacion?: string;
  idNormas?: {
    numero: string;
    dependencia?: string;
    ramaDigesto?: string;
  }[];
  tituloSumario?: string;
  tituloResumido?: string;
  observaciones?: string;
  nroBoletin?: string;
  pagBoletin?: string;
  textoResumido?: string;
  textoNorma?: string;
  estado?: string;
  listaNormasQueComplementa?: number[];
  listaNormasQueLaComplementan?: number[];
  copyText: string;
}

/**
 * Lighter response when calling `?resumen=true` for a single id.
 */
interface NormaSummary {
  id: number;
  tipoNorma?: string;
  publicacion?: string;
  sancion?: string;
  idNormas?: { numero: string; dependencia?: string }[];
  tituloSumario?: string;
  tituloResumido?: string;
}

const API =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0/nacionales/normativos';

async function fetchNormaSummary(id: number): Promise<NormaSummary | null> {
  try {
    const res = await fetch(`${API}?id=${id}&resumen=true`, {
      // re‑fetch once a day on the server, client never revalidates
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as NormaSummary;
  } catch {
    return null;
  }
}

export async function NormaHeader({ norma }: { norma: Norma }) {
  // Fetch summaries for related normas in parallel (server‑side)
  const [modifica, modificadaPor] = await Promise.all([
    Promise.all(
      (norma.listaNormasQueComplementa ?? []).map(id => fetchNormaSummary(id)),
    ),
    Promise.all(
      (norma.listaNormasQueLaComplementan ?? []).map(id =>
        fetchNormaSummary(id),
      ),
    ),
  ]);

  return (
    <header className='space-y-6'>
      {/* Title + actions */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <h1 className='text-3xl font-bold font-serif leading-tight break-words'>
          {norma.tituloResumido || norma.tituloSumario || 'Sin título'}
        </h1>
        <NormaActions copyText={norma.copyText} />
      </div>

      {/* Basic metadata */}
      <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
        {norma.tipoNorma?.trim() && <Badge>{norma.tipoNorma}</Badge>}
        {norma.claseNorma?.trim() && (
          <Badge variant='secondary'>{norma.claseNorma}</Badge>
        )}
        {norma.idNormas?.[0]?.numero && (
          <span className='text-foreground font-serif font-bold'>
            Nº {norma.idNormas[0].numero}
          </span>
        )}

        <div className='h-4 border-l border-border mx-1' />

        {norma.publicacion && (
          <span>
            Publicación: {new Date(norma.publicacion).toLocaleDateString()}
          </span>
        )}
        {norma.sancion && (
          <span>Sanción: {new Date(norma.sancion).toLocaleDateString()}</span>
        )}
        {norma.jurisdiccion && <span>Jurisdicción: {norma.jurisdiccion}</span>}

        <div className='h-4 border-l border-border mx-1' />

        <span>
          Boletín&nbsp;{norma.nroBoletin} • pág&nbsp;{norma.pagBoletin}
        </span>
      </div>

      {/* Linked normas lists */}
      {!!(modifica.length || modificadaPor.length) && (
        <Accordion type='multiple' className='w-full'>
          {/* Modifica */}
          {modifica.filter(Boolean).length > 0 && (
            <AccordionItem value='modifica'>
              <AccordionTrigger>
                Modifica ({modifica.filter(Boolean).length})
              </AccordionTrigger>
              <AccordionContent>
                <ul className='flex flex-col gap-2'>
                  {modifica.filter(Boolean).map(n => (
                    <NormaListItem key={n!.id} data={n!} />
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Modificada por */}
          {modificadaPor.filter(Boolean).length > 0 && (
            <AccordionItem value='modificada'>
              <AccordionTrigger>
                Modificada por ({modificadaPor.filter(Boolean).length})
              </AccordionTrigger>
              <AccordionContent>
                <ul className='flex flex-col gap-2'>
                  {modificadaPor.filter(Boolean).map(n => (
                    <NormaListItem key={n!.id} data={n!} secondary />
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {/* Summary paragraph */}
      {norma.textoResumido && (
        <blockquote className='border-l-4 border-primary pl-4 italic text-muted-foreground'>
          {norma.textoResumido}
        </blockquote>
      )}
    </header>
  );
}

/**
 * Renders a single linked norma inside the accordion list.
 */
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
      {data.tipoNorma && (
        <Badge variant={secondary ? 'secondary' : 'default'}>
          {data.tipoNorma}
        </Badge>
      )}

      <Link
        href={`/search/${data.id}`}
        className='font-medium text-foreground font-serif hover:underline'
      >
        N° {data.idNormas?.[0]?.numero ?? data.id}
      </Link>
      {data.idNormas?.[0]?.dependencia && (
        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          ({data.idNormas[0].dependencia})
        </span>
      )}
      {displayDate && (
        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          {new Date(displayDate).toLocaleDateString()}
        </span>
      )}
      <span className='flex-1 truncate text-sm'>
        {data.tituloSumario || data.tituloResumido || 'Sin título'}
      </span>
    </li>
  );
}
