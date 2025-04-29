// app/search/[id]/page.tsx
import { NormaHeader } from '@/components/search/norma/NormaHeader';
import { fetchNorma } from './loader';
import { NormaBody } from '@/components/search/norma/NormaBody';

interface Params {
  params: { id: string };
}

export default async function NormaPage({ params }: Params) {
  const norma = await fetchNorma(Number(params.id));

  return (
    <section className='container mx-auto max-w-4xl py-10 space-y-10'>
      <NormaHeader norma={norma} />
      <NormaBody html={norma.cleanedHtml} />
    </section>
  );
}
