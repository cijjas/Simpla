'use client';

import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Pagination from './Pagination';

type Props = {
  searchParams: URLSearchParams | null;
};

export default function ResultsList({ searchParams }: Props) {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams);
    params.set('o', String(page * 25)); // override offset only

    const fetchData = async () => {
      const res = await fetch(`/api/saij/search?${params.toString()}`);
      const json = await res.json();
      setData(json);
    };
    fetchData();
  }, [searchParams, page]);

  if (!searchParams)
    return (
      <p className='text-slate-500'>
        Complete algún criterio y presione Buscar.
      </p>
    );

  if (!data) return <p className='text-slate-500'>Cargando…</p>;

  const docs = data.searchResults?.documentResultList ?? [];
  const total = data.searchResults?.totalSearchResults ?? 0;

  return (
    <div className='flex flex-col gap-4 flex-1'>
      {docs.slice(0, 25).map((d: any) => {
        const parsed = JSON.parse(d.documentAbstract).document.content;
        return (
          <Card key={d.uuid} className='p-4 hover:bg-slate-50'>
            <h3 className='font-semibold'>
              {parsed['titulo-norma'] ?? parsed['nombre-coloquial']}
            </h3>
            <p className='text-sm text-slate-600'>
              {parsed['tipo-norma'].texto} {parsed['numero-norma']} ·{' '}
              {parsed.provincia ?? parsed.jurisdiccion?.descripcion} ·{' '}
              {parsed.fecha}
            </p>
          </Card>
        );
      })}

      <Pagination
        page={page}
        perPage={25}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
