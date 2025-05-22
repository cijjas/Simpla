import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import NormaHeader from '@/features/infoleg/norma/norma-header';
import { NormaBody } from '@/features/infoleg/norma/norma-body';
import dynamic from 'next/dynamic';
import {
  getNormaDetallada,
  getNormaDetalladaResumen,
} from '@/features/infoleg/utils/api';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NormaPage({ params }: Props) {
  const { id } = await params;
  const norma = await getNormaDetallada(Number(id));
  if (!norma) notFound();

  return (
    <section className='container mx-auto max-w-5xl p-10 space-y-10'>
      <NormaHeader norma={norma} />
      <NormaBody originalHtml={norma.textoNorma || norma.textoNormaAct} />
    </section>
  );
}

/* ---------- 2.  METADATA  ---------- */
export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const norma = await getNormaDetalladaResumen(Number(id));
  if (!norma) return { title: 'Norma no encontrada' };

  const title = norma.nombreNorma ?? `Norma #${Number(id)}`;
  const summary =
    norma.tituloSumarioFormateado ?? norma.tituloResumidoFormateado ?? '';

  const ogImageUrl = `/api/og/norma?id=${Number(id)}`;

  return {
    title,
    description: summary,
    openGraph: {
      title,
      description: summary,
      type: 'article',
      url: `https://www.simplar.com.ar/norma/${Number(id)}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
      images: [ogImageUrl],
    },
  };
}
