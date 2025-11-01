import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDateSlash } from '@/lib/utils';
import { getNombreNorma } from '@/features/normas/utils/norma-utils';
import { NormaSummary } from '@/features/normas/api/normas-api';

interface NormaRelatedItemProps {
  data: NormaSummary;
  secondary?: boolean;
}

export function NormaRelatedItem({ data, secondary = false }: NormaRelatedItemProps) {
  const displayDate = data.publicacion || data.sancion;

  return (
    <li className='flex flex-wrap items-baseline gap-2'>
      {data.tipo_norma && (
        <Badge variant={secondary ? 'secondary' : 'default'}>
          {getNombreNorma(data)}
        </Badge>
      )}
      <Link
        href={`/norma/${data.infoleg_id}`}
        className='font-medium text-foreground font-serif hover:underline'
      >
        N° {data.infoleg_id}
      </Link>
      {displayDate && (
        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          {formatDateSlash(displayDate)}
        </span>
      )}
      <span className='flex-1 truncate text-sm'>
        {data.titulo_sumario || data.titulo_resumido || 'Sin título'}
      </span>
    </li>
  );
}
