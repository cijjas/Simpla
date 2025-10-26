import { useState, useEffect } from 'react';
import Link from 'next/link';
import { normasAPI, type NormaSummary } from '@/features/normas';

interface NormaLinkProps {
  infolegId: number;
  className?: string;
}

interface NormaLinkListProps {
  infolegIds: number[];
  className?: string;
  separator?: string;
}

// Hook to fetch norma details
function useNormaDetails(infolegIds: number[]) {
  const [normas, setNormas] = useState<Record<number, NormaSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (infolegIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchNormas = async () => {
      try {
        setLoading(true);
        const response = await normasAPI.getNormasBatch(infolegIds);
        
        // Convert array to lookup object
        const normasLookup: Record<number, NormaSummary> = {};
        response.normas.forEach((norma: NormaSummary) => {
          normasLookup[norma.infoleg_id] = norma;
        });
        
        setNormas(normasLookup);
        setError(null);
      } catch (err) {
        console.error('Error fetching norma details:', err);
        setError('Error al cargar detalles de normas');
      } finally {
        setLoading(false);
      }
    };

    fetchNormas();
  }, [infolegIds.join(',')]); // Depend on the IDs as a string

  return { normas, loading, error };
}

// Helper function to format norma display name
function formatNormaName(norma: NormaSummary): string {
  const tipo = norma.tipo_norma || 'Norma';
  const numero = norma.referencia?.numero;
  
  if (numero) {
    return `${tipo} ${numero}`;
  }
  
  return `${tipo} ${norma.infoleg_id}`;
}

// Single norma link component
export function NormaLink({ infolegId, className = '' }: NormaLinkProps) {
  const { normas, loading, error } = useNormaDetails([infolegId]);
  const norma = normas[infolegId];

  if (loading) {
    return <span className={`text-muted-foreground ${className}`}>Cargando...</span>;
  }

  if (error || !norma) {
    return <span className={`text-muted-foreground ${className}`}>Norma {infolegId}</span>;
  }

  return (
    <Link 
      href={`/normas/${infolegId}`}
      className={`text-primary hover:text-primary/80 underline ${className}`}
    >
      {formatNormaName(norma)}
    </Link>
  );
}

// List of norma links component
export function NormaLinkList({ 
  infolegIds, 
  className = '', 
  separator = ', ' 
}: NormaLinkListProps) {
  const { normas, loading, error } = useNormaDetails(infolegIds);

  if (loading) {
    return <span className={`text-muted-foreground ${className}`}>Cargando normas...</span>;
  }

  if (error) {
    return <span className={`text-muted-foreground ${className}`}>Error al cargar normas</span>;
  }

  return (
    <span className={className}>
      {infolegIds.map((infolegId, index) => {
        const norma = normas[infolegId];
        
        return (
          <span key={infolegId}>
            {norma ? (
              <Link 
                href={`/normas/${infolegId}`}
                className="text-primary hover:text-primary/80 underline"
              >
                {formatNormaName(norma)}
              </Link>
            ) : (
              <span className="text-muted-foreground">Norma {infolegId}</span>
            )}
            {index < infolegIds.length - 1 && separator}
          </span>
        );
      })}
    </span>
  );
}