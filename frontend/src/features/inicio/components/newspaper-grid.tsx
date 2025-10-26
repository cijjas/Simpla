'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PaperBackground } from './paper-background';
import { useApi } from '@/features/auth/hooks/use-api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Newspaper, Clock } from 'lucide-react';
import { DailyDigestAPI } from '../api/daily-digest-api';
import { NormaLinkList } from './norma-links';

interface DigestSection {
  section_type: string;
  content: string;  // API returns 'content', not 'section_content'
  norma_ids: number[];
  order: number;    // API returns 'order', not 'section_order'
}

interface DigestData {
  date: string;     // API returns 'date', not 'digest_date'
  sections: DigestSection[];
  total_sections: number;
}

interface HeroContent {
  titular: string;
  lead: string;
}

interface SecondaryContent {
  titular: string;
  resumen_corto: string;
}

export function NewspaperGrid() {
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [digestData, setDigestData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useApi();
  const digestAPI = new DailyDigestAPI(api);

  useEffect(() => {
    // First load the background
    const backgroundTimer = setTimeout(() => {
      setBackgroundLoaded(true);
    }, 100);

    // Then load the content after background is ready
    const contentTimer = setTimeout(() => {
      setContentLoaded(true);
    }, 800);

    return () => {
      clearTimeout(backgroundTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  useEffect(() => {
    // Fetch digest data only once
    fetchDigestData();
  }, []); // Empty dependency array to run only once

  const fetchDigestData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const data = await digestAPI.getNewspaperDigest(today);
      setDigestData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching digest:', err);
      if (err.status === 404) {
        setError('No hay digest disponible para el día de hoy');
      } else {
        setError('Error al cargar el digest del día');
      }
    } finally {
      setLoading(false);
    }
  };

  const getHeroSection = (): DigestSection | null => {
    return digestData?.sections.find(section => section.section_type === 'hero') || null;
  };

  const getSecondarySection = (): DigestSection | null => {
    return digestData?.sections.find(section => section.section_type === 'secondary') || null;
  };

  const getThemeSections = (): DigestSection[] => {
    return digestData?.sections.filter(section => 
      section.section_type !== 'hero' && section.section_type !== 'secondary'
    ).sort((a, b) => a.order - b.order) || [];
  };

  const parseHeroContent = (content: string): HeroContent | null => {
    try {
      console.log('Parsing hero content:', content);
      const parsed = JSON.parse(content);
      console.log('Parsed hero content:', parsed);
      return parsed;
    } catch (error) {
      console.error('Error parsing hero content:', error, 'Content:', content);
      return { titular: 'Error al cargar titular', lead: content };
    }
  };

  const parseSecondaryContent = (content: string): SecondaryContent[] => {
    try {
      console.log('Parsing secondary content:', content);
      const parsed = JSON.parse(content);
      console.log('Parsed secondary content:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing secondary content:', error, 'Content:', content);
      return [{ titular: 'Error al cargar contenido', resumen_corto: content }];
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return new Date(dateString).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const heroSection = getHeroSection();
  const secondarySection = getSecondarySection();
  const themeSections = getThemeSections();
  const heroContent = heroSection ? parseHeroContent(heroSection.content) : null;
  const secondaryItems = secondarySection ? parseSecondaryContent(secondarySection.content) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full bg-card shadow-2xl relative overflow-hidden ">
        {backgroundLoaded && <PaperBackground />}
        
        {/* Header */}
        <div className={`relative z-2 transition-opacity duration-1000 ${contentLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center py-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              EL BOLETÍN SIMPLA
            </div>
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold font-serif text-foreground px-20">
                El Boletín Simpla
              </h1>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Normativas • Legislación • Actualidad Jurídica
            </div>
            <div className="px-10 flex justify-between items-center text-xs text-muted-foreground border-t border-b border-foreground py-2">
              <span>VOL. 1. NO. 1</span>
              <span>{formatDate(digestData?.date)}</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`text-center py-12 transition-opacity duration-1000 ${contentLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-lg text-muted-foreground">Cargando digest del día...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={`text-center py-12 transition-opacity duration-1000 ${contentLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-lg text-muted-foreground mb-4">{error}</div>
            <button 
              onClick={fetchDigestData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        {digestData && !loading && (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 p-8 relative transition-opacity duration-1000 ${contentLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {/* Left Column - Main Article (Hero Section) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Hero Section */}
              {heroContent && (
                <div className="border-b border-border pb-4">
                  <h2 className="text-2xl md:text-3xl font-bold uppercase leading-tight mb-4">
                    {heroContent.titular}
                  </h2>
                  
                  {/* Main Image */}
                  <div className="mb-4">
                    <Image
                      src="/images/patagonia.png"
                      alt="Imagen principal"
                      width={600}
                      height={300}
                      className="w-full h-64 object-cover border border-border"
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      <div className="font-bold">IMAGEN: Región Patagónica</div>
                      <div>Por: Equipo Editorial Simpla</div>
                      <div>Buenos Aires, Argentina</div>
                    </div>
                  </div>

                  {/* Hero Article Text */}
                  <div className="text-sm leading-relaxed">
                    <p className="mb-3">{heroContent.lead}</p>
                    {heroSection && (
                      <div className="text-xs text-muted-foreground mt-4">
                        <span className="font-bold">Normas relacionadas:</span>{' '}
                        <NormaLinkList infolegIds={heroSection.norma_ids} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Theme Sections */}
              {themeSections.map((themeSection, index) => (
                <div key={themeSection.section_type} className="border-b border-border pb-4">
                  <h3 className="text-xl font-bold uppercase mb-3">
                    {themeSection.section_type}
                  </h3>
                  <div className="text-sm leading-relaxed">
                    <p className="mb-3">{themeSection.content}</p>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-bold">Normas incluidas:</span>{' '}
                      <NormaLinkList infolegIds={themeSection.norma_ids} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column - Secondary Articles */}
            <div className="space-y-4">
              {/* Secondary Section */}
              {secondaryItems.length > 0 && (
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg font-bold uppercase mb-3">
                    Noticias Destacadas
                  </h3>
                  <div className="space-y-4">
                    {secondaryItems.map((item, index) => (
                      <div key={index} className="text-sm">
                        <h4 className="font-bold mb-2">{item.titular}</h4>
                        <p className="mb-3">{item.resumen_corto}</p>
                      </div>
                    ))}
                    {secondarySection && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-bold">Normas destacadas:</span>{' '}
                        <NormaLinkList infolegIds={secondarySection.norma_ids} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Placeholder content when no data */}
              {(!digestData || (!heroContent && secondaryItems.length === 0 && themeSections.length === 0)) && (
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg font-bold uppercase mb-3">
                    Información del Sistema
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p className="mb-3">
                      Este boletín se genera automáticamente basado en las normativas publicadas en el día.
                    </p>
                    <p className="mb-3">
                      Utiliza inteligencia artificial para analizar y clasificar las normas por impacto y temática.
                    </p>
                  </div>
                </div>
              )}

              {/* Small Article with Image */}
              <div className="border-b border-border pb-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Image
                      src="/images/gaucho.png"
                      alt="Imagen pequeña"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover border border-border"
                    />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold uppercase mb-2">
                      Acerca de Simpla
                    </h5>
                    <p className="text-xs leading-relaxed">
                      Simpla es tu herramienta de análisis normativo que utiliza IA para mantenerte 
                      informado sobre las últimas actualizaciones legislativas del país.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Article */}
              <div>
                <h5 className="text-sm font-bold uppercase mb-2">
                  Resumen Ejecutivo
                </h5>
                <div className="space-y-2 text-xs">
                  <p>
                    {digestData ? 
                      `Se analizaron un total de ${digestData.sections.reduce((acc, section) => acc + section.norma_ids.length, 0)} normas para este digest.` :
                      'El digest se actualiza diariamente con las últimas normativas publicadas.'
                    }
                  </p>
                  <p>
                    Las normas se clasifican por impacto y se agrupan temáticamente para facilitar 
                    su comprensión y seguimiento por parte de profesionales del derecho.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`border-t border-foreground py-6 px-8 relative transition-opacity duration-1000 ${contentLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <div className="border-foreground py-2">
              <div className="font-bold text-foreground mb-1">EL BOLETÍN SIMPLA</div>
              <div>Tu fuente confiable de información normativa y legislativa</div>
            </div>
            <div className="text-xs leading-relaxed max-w-2xl mx-auto">
              <strong>AVISO IMPORTANTE:</strong> Este contenido ha sido generado con asistencia de inteligencia artificial. 
              Aunque nos esforzamos por proporcionar información precisa y actualizada, la IA puede contener errores. 
              Siempre consulte fuentes oficiales y profesionales para decisiones importantes.
            </div>
            <div className="text-xs">
              Simpla © {new Date().getFullYear()} | Todos los derechos reservados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
