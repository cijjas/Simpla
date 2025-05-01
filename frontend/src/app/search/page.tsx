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
  const [loading, setLoading] = useState(false);
  const initialValues = Object.fromEntries(searchParams.entries());

  // Parse view from URL (default: grid)
  const viewParam = searchParams.get('view');
  const view: 'list' | 'grid' =
    viewParam === 'grid' || viewParam === 'list' ? (viewParam as any) : 'grid';

  // Build ?query=string from object
  const buildQueryString = (p: Record<string, unknown>) =>
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join('&');

  // -------------------------------------------------------
  // Trigger search only on URL changes
  // -------------------------------------------------------
  useEffect(() => {
    const p = Object.fromEntries(searchParams.entries());
    if (Object.keys(p).length > 0) {
      doSearch(p);
    }
  }, [searchParams]);

  // page.tsx
  const doSearch = async (params: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { view, anios, ...apiParams } = params;

      // 🔥 fix: force string -> array of years
      const parsedAnios: number[] =
        typeof anios === 'string'
          ? anios
              .split(',')
              .map(a => parseInt(a.trim(), 10))
              .filter(a => !isNaN(a))
          : [];

      console.log('parsedAnios:', parsedAnios);

      if (parsedAnios.length > 0) {
        const currentYear = new Date().getFullYear();
        const today = new Date().toISOString().slice(0, 10);
        const buckets: any[] = [];

        await Promise.all(
          parsedAnios.map(async year => {
            if (year > currentYear) return;
            const desde = `${year}-01-01`;
            const hasta = year === currentYear ? today : `${year}-12-31`;

            const q = {
              ...apiParams,
              publicacion_desde: desde,
              publicacion_hasta: hasta,
            };

            const res = await searchNormas(q as any);
            buckets.push(...res.results);
          }),
        );

        setResults(buckets);
        setMeta({
          count: buckets.length,
          limit: (apiParams.limit as number) || buckets.length,
          offset: 1,
        });
      } else {
        const data = await searchNormas(apiParams as any);
        setResults(data.results);
        setMeta(data.metadata.resultset);
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // Form: just updates URL (no search here!)
  // -------------------------------------------------------
  const handleSearch = (params: Record<string, unknown>) => {
    router.push(`/search?${buildQueryString({ ...params, view })}`);
  };

  // Pagination: update URL
  const goToPage = (page: number) => {
    const p = Object.fromEntries(searchParams.entries());
    const limit = parseInt(p.limit as string) || 10;
    const offset = (page - 1) * limit + 1;
    const next = { ...p, offset: offset.toString() };
    router.push(`/search?${buildQueryString(next)}`);
  };

  // View toggle: update URL only
  const handleViewChange = (v: 'list' | 'grid') => {
    const p = Object.fromEntries(searchParams.entries());
    router.push(`/search?${buildQueryString({ ...p, view: v })}`);
  };
  const handleReset = () => {
    setResults([]);
    setMeta(null);
    router.replace('/search'); // limpia la URL y evita duplicar historia
  };

  return (
    <div className='container mx-auto grid grid-cols-1 gap-6 py-6 md:grid-cols-3'>
      <aside className='md:col-span-1'>
        <SearchForm
          onSearch={handleSearch}
          loading={loading}
          initialValues={initialValues}
          onReset={handleReset}
        />
      </aside>
      <main className='md:col-span-2'>
        <Results
          results={results}
          meta={meta}
          view={view}
          onViewChange={handleViewChange}
          onPageChange={goToPage}
          loading={loading}
        />
      </main>
    </div>
  );
}
