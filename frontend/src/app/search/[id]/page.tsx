import { getNormaDetalle } from '@/lib/infoleg/api';
import { NormaHeader } from '@/components/search/norma/NormaHeader';
import { NormaBody } from '@/components/search/norma/NormaBody';
import { notFound } from 'next/navigation';

export default async function NormaPage({
  params,
}: {
  params: { id: string };
}) {
  const norma = await getNormaDetalle(Number(params.id));
  if (!norma) notFound();

  return (
    <section className='container mx-auto max-w-4xl py-10 space-y-10'>
      <NormaHeader norma={norma} />
      <NormaBody originalHtml={norma.textoNorma} />
    </section>
  );
}
