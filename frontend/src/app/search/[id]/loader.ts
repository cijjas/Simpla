import { getNormaDetalle } from '@/lib/infoleg/infoleg';
import { parseInfolegHtml } from '@/lib/infoleg/parseInfolegHtml';
import { notFound } from 'next/navigation';

export async function fetchNorma(id: number) {
  const norma = await getNormaDetalle(id);
  if (!norma || norma.status === 404) notFound();

  return {
    ...norma,
    cleanedHtml: parseInfolegHtml(norma.textoNorma ?? ''),
    // keep a plain-text version for the copy button
    copyText: (norma.textoNorma ?? '').replace(/<[^>]+>/g, ''),
  };
}
