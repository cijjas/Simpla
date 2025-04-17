'use client';

import { useState } from 'react';
import SearchForm from '@/components/busqueda/SearchForm';
import ResultsList from '@/components/busqueda/ResultsList';
import Header from '@/components/layout/Header';

export default function BusquedaPage() {
  const [queryParams, setQueryParams] = useState<URLSearchParams | null>(null);

  return (
    <main className='max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8'>
      {/* Left – form */}
      <SearchForm onSubmit={setQueryParams} />

      {/* Right – results */}
      <ResultsList searchParams={queryParams} />
    </main>
  );
}
