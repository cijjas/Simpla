import { getNormaDetalle } from '@/lib/infoleg';
import { notFound } from 'next/navigation';

export default async function NormaPage({
  params,
}: {
  params: { id: string };
}) {
  const norma = await getNormaDetalle(Number(params.id));
  if (!norma || norma.status === 404) {
    notFound();
  }

  return (
    <article className='container mx-auto py-8'>
      <h1 className='mb-6 text-3xl font-bold'>
        {norma.tituloSumario || norma.tituloResumido}
      </h1>
      <div
        className='prose max-w-none'
        dangerouslySetInnerHTML={{ __html: norma.textoNorma }}
      />
    </article>
  );
}
