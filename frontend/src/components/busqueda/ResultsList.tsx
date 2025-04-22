// frontend/src/components/busqueda/ResultsList.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Props = {
  searchParams: URLSearchParams | null;
};

type ParsedDocument = {
  'titulo-norma'?: string;
  'nombre-coloquial'?: string;
  'tipo-norma'?: { texto: string };
  'numero-norma'?: string;
  provincia?: string;
  jurisdiccion?: { descripcion: string };
  fecha?: string;
};

type SearchResult = {
  uuid: string;
  documentAbstract: string;
};

type SearchResponse = {
  searchResults?: {
    documentResultList: SearchResult[];
    totalSearchResults: number;
  };
};

export default function ResultsList({ searchParams }: Props) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [page, setPage] = useState<number>(0);
  const pageSize = 25;

  useEffect(() => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams);
    params.set('o', String(page * pageSize));

    const fetchData = async () => {
      const res = await fetch(`/api/saij/search?${params.toString()}`);
      const json: SearchResponse = await res.json();
      setData(json);
    };
    fetchData();
  }, [searchParams, page]);

  if (!searchParams) {
    return (
      <p className='text-slate-500'>
        Complete algún criterio y presione Buscar.
      </p>
    );
  }
  if (!data) return <p className='text-slate-500'>Cargando…</p>;

  const docs = data.searchResults?.documentResultList ?? [];
  const total = data.searchResults?.totalSearchResults ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const getPages = (): number[] => {
    const pages: number[] = [];
    const start = Math.max(1, page + 1 - 1);
    const end = Math.min(totalPages, page + 1 + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className='flex flex-col gap-4 flex-1'>
      {docs.map(d => {
        let parsed: ParsedDocument = {};
        try {
          parsed = JSON.parse(d.documentAbstract)?.document?.content ?? {};
        } catch {
          /* ignore */
        }

        return (
          <Card key={d.uuid} className='p-4 hover:bg-slate-50'>
            <h3 className='font-semibold'>
              {parsed['titulo-norma'] ?? parsed['nombre-coloquial']}
            </h3>
            <p className='text-sm text-slate-600'>
              {parsed['tipo-norma']?.texto} {parsed['numero-norma']} ·{' '}
              {parsed.provincia ?? parsed.jurisdiccion?.descripcion} ·{' '}
              {parsed.fecha}
            </p>
          </Card>
        );
      })}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#'
                onClick={e => {
                  e.preventDefault();
                  setPage(p => Math.max(p - 1, 0));
                }}
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationLink
                href='#'
                isActive={page === 0}
                onClick={e => {
                  e.preventDefault();
                  setPage(0);
                }}
              >
                1
              </PaginationLink>
            </PaginationItem>

            {page > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {getPages().map(p =>
              p !== 1 && p !== totalPages ? (
                <PaginationItem key={p}>
                  <PaginationLink
                    href='#'
                    isActive={page === p - 1}
                    onClick={e => {
                      e.preventDefault();
                      setPage(p - 1);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ) : null,
            )}

            {page < totalPages - 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationLink
                href='#'
                isActive={page === totalPages - 1}
                onClick={e => {
                  e.preventDefault();
                  setPage(totalPages - 1);
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                href='#'
                onClick={e => {
                  e.preventDefault();
                  setPage(p => Math.min(p + 1, totalPages - 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
