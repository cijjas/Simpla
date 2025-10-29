import { Metadata } from 'next';
import { NormaDetailPage } from '@/features/normas/pages/norma-detail-page';
import { FoldersProvider } from '@/features/folders/context/folders-context';
import { NormaSummary } from '@/features/normas/api/normas-api';

interface Props {
  params: Promise<{ id: string }>;
}

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api`;

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
    // Fetch norma data from public OG endpoint (no auth required for metadata generation)
    // Cache metadata indefinitely since normas rarely change
    const normaResponse = await fetch(`${API_BASE}/normas/${infolegId}/og/`, {
      next: { revalidate: false }, // Cache indefinitely
    });
    
    if (!normaResponse.ok) {
      throw new Error('Norma no encontrada');
    }
    
    const norma: NormaSummary = await normaResponse.json();
    
    // Use the same logic as the OG image generator for consistency
    const numero = norma.referencia?.numero ?? '';
    const anio = norma.sancion
      ? new Date(norma.sancion).getFullYear()
      : '';
    const ogTitle = `${norma.tipo_norma ?? 'Norma'} ${numero}${anio ? `/${anio}` : ''}`;
    const ogDescription = norma.titulo_sumario ?? norma.titulo_resumido ?? 'Legislación argentina, al alcance.';
    
    // Page title can be more descriptive (what shows in browser tab)
    const pageTitle = ogDescription 
      ? `${ogTitle} | ${ogDescription}` 
      : `${ogTitle} | Simpla`;
    
    const url = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/normas/${infolegId}`;

    return {
      title: pageTitle,
      description: ogDescription,
      keywords: [
        norma.tipo_norma || 'norma',
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
        title: ogTitle, // Matches what's shown on the OG image
        description: ogDescription, // Matches what's shown on the OG image
        url,
        siteName: 'Simpla',
        type: 'article',
        locale: 'es_AR',
        images: [
          {
            url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/api/og/norma?id=${infolegId}`,
            width: 1200,
            height: 630,
            alt: ogTitle,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle, // Matches what's shown on the OG image
        description: ogDescription, // Matches what's shown on the OG image
        site: '@SimplAr',
        images: [
          `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/api/og/norma?id=${infolegId}`,
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
  const fallbackDescription = 'Busca. Entiende. Actúa.';
    
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
            url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/api/og/norma?id=${infolegId}`,
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
          `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://simplalegal.com'}/api/og/norma?id=${infolegId}`,
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
