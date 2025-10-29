import { Metadata } from 'next';
import { NormaDetailPage } from '@/features/normas/pages/norma-detail-page';
import { FoldersProvider } from '@/features/folders/context/folders-context';
import { normasAPI } from '@/features/normas/api/normas-api';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const infolegId = parseInt(id, 10);

  // Default metadata if ID is invalid
  if (isNaN(infolegId)) {
    return {
      title: 'Norma no encontrada | Simpla',
      description: 'La norma solicitada no fue encontrada.',
    };
  }

  try {
    // Fetch norma data for metadata
    const norma = await normasAPI.getNormaSummary(infolegId);
    
    // Generate clean title format: "Ley 1234 | Regulaciones Sanitarias"
    const normaType = norma.tipo_norma || 'Norma';
    const normaNumber = norma.referencia?.numero;
    const normaIdentifier = normaNumber 
      ? `${normaType} ${normaNumber}` 
      : `${normaType} ${infolegId}`;
    
    // Get the clean norma title (without extra text)
    const normaMainTitle = norma.titulo_sumario || norma.titulo_resumido || 'Consulta normativa';
    
    // Create the final title and description
    const title = `${normaIdentifier} | ${normaMainTitle}`;
    const description = `${normaIdentifier} - ${normaMainTitle}`;
    const url = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/normas/${infolegId}`;

    return {
      title,
      description,
      keywords: [
        normaType,
        'norma',
        'legislación',
        'derecho',
        'argentina',
        'simpla',
        ...(norma.jurisdiccion ? [norma.jurisdiccion] : []),
        ...(norma.clase_norma ? [norma.clase_norma] : []),
      ],
      authors: [{ name: 'Simpla' }],
      openGraph: {
        title,
        description,
        url,
        siteName: 'Simpla',
        type: 'article',
        locale: 'es_AR',
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/images/preview.png`,
            width: 1200,
            height: 630,
            alt: normaIdentifier,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: '@SimplAr', // Replace with actual Twitter handle if available
        images: [
          `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simpla.ar'}/images/preview.png`,
        ],
      },
      alternates: {
        canonical: url,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching norma for metadata:', error);
    
    // Fallback metadata if API call fails
    const fallbackTitle = `Norma ${infolegId} | Consulta normativa`;
    const fallbackDescription = `Norma ${infolegId} - Consulta normativa`;
    
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      keywords: ['norma', 'legislación', 'derecho', 'argentina', 'simpla'],
      authors: [{ name: 'Simpla' }],
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/normas/${infolegId}`,
        siteName: 'Simpla',
        type: 'article',
        locale: 'es_AR',
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/images/preview.png`,
            width: 1200,
            height: 630,
            alt: `Norma ${infolegId}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
        site: '@SimplAr',
        images: [
          `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/images/preview.png`,
        ],
      },
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/normas/${infolegId}`,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  }
}

export default async function NormaDetailRoute({ params }: Props) {
  const { id } = await params;
  const infolegId = parseInt(id, 10);

  if (isNaN(infolegId)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">ID de norma inválido</h3>
          <p className="text-muted-foreground">El ID proporcionado no es válido.</p>
        </div>
      </div>
    );
  }

  return (
    <FoldersProvider>
      <NormaDetailPage infolegId={infolegId} />
    </FoldersProvider>
  );
}
