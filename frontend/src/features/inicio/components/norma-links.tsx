import Link from 'next/link';

interface NormaMetadata {
  tipo_norma: string;
  numero: string | null;
}

interface NormaLinkProps {
  infolegId: number;
  metadata?: NormaMetadata;
  className?: string;
}

interface NormaLinkListProps {
  infolegIds: number[];
  normaMetadata: Record<number, NormaMetadata>;
  className?: string;
  separator?: string;
}

// Helper function to format norma display name
function formatNormaName(infolegId: number, metadata?: NormaMetadata): string {
  if (!metadata) {
    return `Norma ${infolegId}`;
  }
  
  const tipo = metadata.tipo_norma || 'Norma';
  const numero = metadata.numero;
  
  if (numero) {
    return `${tipo} ${numero}`;
  }
  
  return `${tipo} ${infolegId}`;
}

// Single norma link component
export function NormaLink({ infolegId, metadata, className = '' }: NormaLinkProps) {
  return (
    <Link 
      href={`/normas/${infolegId}`}
      className={`text-primary hover:text-primary/80 underline ${className}`}
    >
      {formatNormaName(infolegId, metadata)}
    </Link>
  );
}

// List of norma links component
export function NormaLinkList({ 
  infolegIds, 
  normaMetadata,
  className = '', 
  separator = ', ' 
}: NormaLinkListProps) {
  if (infolegIds.length === 0) {
    return null;
  }

  return (
    <span className={className}>
      {infolegIds.map((infolegId, index) => {
        const metadata = normaMetadata[infolegId];
        
        return (
          <span key={infolegId}>
            <NormaLink 
              infolegId={infolegId}
              metadata={metadata}
            />
            {index < infolegIds.length - 1 && separator}
          </span>
        );
      })}
    </span>
  );
}