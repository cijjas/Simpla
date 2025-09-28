'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchForm from './search-form';
import Results from './results';
import type { NormaItem } from '../utils/types';
import { getNormas } from '../utils/api';
import type { SearchParamsDto } from '../utils/dto';

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
  /*  UI STATE                                                               */
  /* ---------------------------------------------------------------------- */
  const [results, setResults] = useState<NormaItem[]>([]);
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
  /*  ONLY call the API when "real" params change                            */
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
  /*  Data fetcher                                                           */
  /* ---------------------------------------------------------------------- */
  const doSearch = async (params: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { sancion, ...apiParams } = params;
      const currentYear = new Date().getFullYear();
      const today = new Date().toISOString().slice(0, 10);
      let parsedAnios: number[] = [];

      if (sancion && typeof sancion === 'string') {
        const y = sancion.trim();
        const isTwoDigit = /^\d{2}$/.test(y);
        const isFourDigit = /^\d{4}$/.test(y);

        parsedAnios = isTwoDigit
          ? [1800, 1900, 2000]
              .map(base => base + Number.parseInt(y, 10))
              .filter(year => year <= currentYear)
          : isFourDigit
          ? [Number.parseInt(y, 10)].filter(year => year <= currentYear)
          : [];
      }

      if (parsedAnios.length === 1) {
        // If it's a single year, use sancion param directly
        const data = await getNormas({
          ...apiParams,
          sancion: String(parsedAnios[0]),
        } as SearchParamsDto);
        setResults(data.results);
        setMeta(data.metadata.resultset);
      } else if (parsedAnios.length > 1) {
        // Smart search by year buckets
        const buckets: NormaItem[] = [];

        await Promise.all(
          parsedAnios.map(async year => {
            const desde = `${year}-01-01`;
            const hasta = year === currentYear ? today : `${year}-12-31`;
            const q = {
              ...apiParams,
              publicacion_desde: desde,
              publicacion_hasta: hasta,
            };
            const res = await getNormas(q as SearchParamsDto);
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
        // No valid year in sancion, fall back to basic search
        const data = await getNormas(apiParams as SearchParamsDto);
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
    console.log('handleSearch', params);
    router.push(`/busqueda?${buildQueryString(params)}`);
  };

  const goToPage = (page: number) => {
    const p = Object.fromEntries(searchParams.entries());
    const next = { ...p, offset: page.toString() };
    router.push(`/busqueda?${buildQueryString(next)}`);
  };

  const handleReset = () => {
    setResults([]); // optimistic clear
    setMeta(null);
    router.replace('/busqueda'); // wipe URL & history entry
  };

  /* initial values for <SearchForm /> (mirror URL) */
  const initialValues = Object.fromEntries(searchParams.entries());
  // Handle smart `sancion` initial display

  if (typeof initialValues.sancion === 'string') {
    const years = initialValues.sancion
      .split(',')
      .map(y => Number.parseInt(y.trim(), 10))
      .filter(y => !isNaN(y));

    if (years.length > 1) {
      const lastTwo = years.map(y => y % 100);
      const allSameLastTwo = lastTwo.every(d => d === lastTwo[0]);
      if (allSameLastTwo) {
        // All years share same last two digits — display just those
        initialValues.sancion = lastTwo[0].toString().padStart(2, '0');
      }
    } else if (years.length === 1) {
      // Only one year — use full year
      initialValues.sancion = years[0].toString();
    }
  }
  /* ---------------------------------------------------------------------- */
  /*  RENDER                                                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <div className='w-full mx-auto px-6 py-4'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <aside className='lg:col-span-1 w-full'>
          <div className='sticky top-6'>
            <SearchForm
              onSearch={handleSearch}
              loading={loading}
              initialValues={initialValues}
              onReset={handleReset}
            />
          </div>
        </aside>

        <main className='lg:col-span-2 w-full'>
          <Results
            results={results}
            meta={meta}
            view={view}
            onViewChange={handleViewChange}
            onPageChange={goToPage}
            loading={loading}
            onReset={handleReset}
          />
        </main>
      </div>
    </div>
  );
}
