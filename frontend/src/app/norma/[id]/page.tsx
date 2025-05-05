import { getNormaDetalle } from '@/lib/infoleg/api';
import { NormaHeader } from '@/features/norma/NormaHeader';
import { NormaBody } from '@/features/norma/NormaBody';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}
export default async function NormaPage({ params }: Props) {
  const { id } = await params;
  const norma = await getNormaDetalle(Number(id));
  if (!norma) notFound();

  return (
    <section className='container mx-auto max-w-4xl py-10 space-y-10'>
      <NormaHeader norma={norma} />
      <NormaBody originalHtml={norma.textoNorma} />
    </section>
  );
}
