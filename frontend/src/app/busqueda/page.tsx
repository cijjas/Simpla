import SearchClient from '@/features/busqueda/SearchClient';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className='p-6'>Cargando búsqueda...</div>}>
      <SearchClient />
    </Suspense>
  );
}
