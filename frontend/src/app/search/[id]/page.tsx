import { NormaHeader } from '@/components/search/norma/NormaHeader';
import { NormaBody } from '@/components/search/norma/NormaBody';
import { getNormaDetalle } from '@/lib/infoleg/infoleg';
import { parseNormaViaApi } from '@/lib/infoleg/parseNorma';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NormaPage({ params }: Props) {
  const { id } = await params;
  const norma = await getNormaDetalle(Number(id));
  if (!norma || norma.status === 404) notFound();

  const parsed = await parseNormaViaApi(norma);

  const raw = {
    ...norma,
    copyText: (norma.textoNorma ?? '').replace(/<[^>]+>/g, ''),
  };

  return (
    <section className='container mx-auto max-w-4xl py-10 space-y-10'>
      <NormaHeader norma={raw} />
      <NormaBody parsed={parsed} />
    </section>
  );
}
