import SearchClient from '@/components/search/SearchCleint';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className='p-6'>Cargando búsqueda...</div>}>
      <SearchClient />
    </Suspense>
  );
}
