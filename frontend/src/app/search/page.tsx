'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchForm from '@/components/search/SearchForm';
import Results from '@/components/search/Results';
import { searchNormas } from '@/lib/infoleg/infoleg';

export default function BusquedaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<any[]>([]);
  const [meta, setMeta] = useState<{
    count: number;
    limit: number;
    offset: number;
  } | null>(null);

  // --------------------------------------------------
  // helper
  // --------------------------------------------------
  const buildQueryString = (p: Record<string, unknown>) =>
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join('&');

  // --------------------------------------------------
  // **NUEVO** – quito `view` antes de llamar a la API
  // --------------------------------------------------
  const doSearch = async (params: Record<string, unknown>) => {
    const { view, ...apiParams } = params; // <- filtrado
    const data = await searchNormas(apiParams as any);
    setResults(data.results);
    setMeta(data.metadata.resultset);
  };

  //---------------------------------------------------
  // view tomado de la URL (default list)
  //---------------------------------------------------
  const viewParam = searchParams.get('view');
  const view: 'list' | 'grid' =
    viewParam === 'grid' || viewParam === 'list' ? (viewParam as any) : 'grid';

  //---------------------------------------------------
  // search desde el formulario
  //---------------------------------------------------
  const handleSearch = async (params: Record<string, unknown>) => {
    await doSearch(params); // params SIN view
    router.push(`/search?${buildQueryString({ ...params, view })}`);
  };

  //---------------------------------------------------
  // paginación
  //---------------------------------------------------
  const goToPage = async (page: number) => {
    const p = Object.fromEntries(searchParams.entries());
    const limit = parseInt(p.limit as string) || 10;
    const offset = (page - 1) * limit + 1;
    const next = { ...p, offset: offset.toString() };
    await doSearch(next); // next incluye view pero se filtra
    router.push(`/search?${buildQueryString(next)}`);
  };

  //---------------------------------------------------
  // toggle list/grid -> sólo actualiza URL
  //---------------------------------------------------
  const handleViewChange = (v: 'list' | 'grid') => {
    const p = Object.fromEntries(searchParams.entries());
    router.push(`/search?${buildQueryString({ ...p, view: v })}`);
  };

  useEffect(() => {
    const p = Object.fromEntries(searchParams.entries());
    if (Object.keys(p).length) doSearch(p);
  }, [searchParams]);

  return (
    <div className='container mx-auto grid grid-cols-1 gap-6 py-6 md:grid-cols-3'>
      <aside className='md:col-span-1'>
        <SearchForm onSearch={handleSearch} />
      </aside>
      <main className='md:col-span-2'>
        <Results
          results={results}
          meta={meta}
          view={view}
          onViewChange={handleViewChange}
          onPageChange={goToPage}
        />
      </main>
    </div>
  );
}
