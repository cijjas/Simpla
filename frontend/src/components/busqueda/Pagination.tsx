'use client';
import { Button } from '@/components/ui/button';

type Props = {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (p: number) => void;
};

export default function Pagination({
  page,
  perPage,
  total,
  onPageChange,
}: Props) {
  const pages = Math.ceil(total / perPage);

  if (pages <= 1) return null;

  return (
    <div className='flex justify-center gap-4 pt-4'>
      <Button
        variant='outline'
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        ← Anterior
      </Button>
      <span className='self-center text-sm'>
        Página {page + 1} de {pages}
      </span>
      <Button
        variant='outline'
        disabled={page + 1 >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente →
      </Button>
    </div>
  );
}
