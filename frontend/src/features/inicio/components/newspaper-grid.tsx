'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PaperBackground } from './paper-background';

export function NewspaperGrid() {
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

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
              <span>{new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 p-8 relative transition-opacity duration-1000 ${contentLoaded ? 'opacity-100' : 'opacity-0'}`}>
          {/* Left Column - Main Article */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Headline */}
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl md:text-3xl font-bold uppercase leading-tight mb-4">
                NUEVAS NORMATIVAS IMPACTAN EL SECTOR EMPRESARIAL
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

              {/* Main Article Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-relaxed">
                <div>
                  <p className="mb-3">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  <p className="mb-3">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                    fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
                    culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                </div>
                <div>
                  <p className="mb-3">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                    doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                    veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                  </p>
                  <p className="mb-3">
                    Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
                    sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary Article */}
            <div className="border-b border-border pb-4">
              <h3 className="text-xl font-bold uppercase mb-3">
                Actualizaciones en Legislación Laboral
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-3">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                    exercitation ullamco laboris.
                  </p>
                </div>
                <div>
                  <p className="mb-3">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                    fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Side Articles */}
          <div className="space-y-4">
            {/* Right Column Headline */}
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold uppercase mb-3">
                Noticias Destacadas
              </h3>
              <div className="space-y-3 text-sm">
                <p className="mb-3">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="mb-3">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                  fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                </p>
              </div>
            </div>

            {/* Another Article */}
            <div className="border-b border-border pb-4">
              <h4 className="text-base font-bold uppercase mb-3">
                Cambios en Normativas Fiscales
              </h4>
              <div className="space-y-3 text-sm">
                <p className="mb-3">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                </p>
                <p className="mb-3">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                  fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                </p>
              </div>
            </div>

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
                    Título de Noticia
                  </h5>
                  <p className="text-xs leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                    incididunt ut labore et dolore magna aliqua.
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
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                  fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                </p>
              </div>
            </div>
          </div>
        </div>

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
