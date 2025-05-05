'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchForm from '@/components/search/SearchForm';
import Results from '@/components/search/Results';
import { searchNormas } from '@/lib/infoleg/infoleg';
import { cn } from '@/lib/utils';

/**
 * --------------------------------------------------------------------------
 *  SEARCH ‑ PAGE (client component)
 *  – Keeps all network‑affecting params in the URL
 *  – Keeps `view` (grid | list) purely in client state / localStorage
 * --------------------------------------------------------------------------
 */
export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---------------------------------------------------------------------- */
  /*  UI STATE                                                               */
  /* ---------------------------------------------------------------------- */
  const [results, setResults] = useState<any[]>([]);
  const [meta, setMeta] = useState<{
    count: number;
    limit: number;
    offset: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- view mode – cosmetic, never hits the API ------------- */
  const STORAGE_KEY = 'resultsViewPreference';
  const [view, setView] = useState<'list' | 'grid'>('grid');
  useEffect(() => {
    const saved = localStorage.getItem('resultsViewPreference');
    if (saved === 'list' || saved === 'grid') {
      setView(saved);
    }
  }, []);
  /** Persist view in LocalStorage – nothing else, URL stays untouched */
  const handleViewChange = (v: 'list' | 'grid') => {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  /* ---------------------------------------------------------------------- */
  /*  ONLY call the API when “real” params change                            */
  /* ---------------------------------------------------------------------- */
  const prevKey = useRef<string>('');

  useEffect(() => {
    const apiParams = Object.fromEntries(searchParams.entries());
    if (Object.keys(apiParams).length === 0) return; // landing page

    const key = JSON.stringify(apiParams);
    if (key === prevKey.current) return; // no change

    prevKey.current = key;
    doSearch(apiParams);
  }, [searchParams]);

  /* ---------------------------------------------------------------------- */
  /*  Helper: build querystring (no `view` parameter here)                   */
  /* ---------------------------------------------------------------------- */
  const buildQueryString = (p: Record<string, unknown>) =>
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join('&');

  /* ---------------------------------------------------------------------- */
  /*  Data fetcher                                                           */
  /* ---------------------------------------------------------------------- */
  const doSearch = async (params: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { anios, ...apiParams } = params;

      /* -------- year buckets -------------------------------------------- */
      const parsedAnios: number[] =
        typeof anios === 'string'
          ? anios
              .split(',')
              .map(a => parseInt(a.trim(), 10))
              .filter(a => !isNaN(a))
          : [];

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

  /* ---------------------------------------------------------------------- */
  /*  Handlers – these **only** update the URL                               */
  /* ---------------------------------------------------------------------- */
  const handleSearch = (params: Record<string, unknown>) => {
    router.push(`/search?${buildQueryString(params)}`);
  };

  const goToPage = (page: number) => {
    const p = Object.fromEntries(searchParams.entries());
    const next = { ...p, offset: page.toString() };
    router.push(`/search?${buildQueryString(next)}`);
  };

  const handleReset = () => {
    setResults([]); // optimistic clear
    setMeta(null);
    router.replace('/search'); // wipe URL & history entry
  };

  /* initial values for <SearchForm /> (mirror URL) */
  const initialValues = Object.fromEntries(searchParams.entries());

  /* ---------------------------------------------------------------------- */
  /*  RENDER                                                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <div
      className={cn(
        'container mx-auto',
        'px-4 sm:px-6 md:px-0',
        'grid grid-cols-1 gap-6 py-6 md:grid-cols-3',
      )}
    >
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
