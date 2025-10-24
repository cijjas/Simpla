'use client';

import SvgEstampa from '@/components/icons/Estampa';
import { Button } from '@/components/ui/button';
import { ProgressiveText } from '@/components/ui/progressive-text';
import { Mail, MessageCircle } from 'lucide-react';
import {
  CONTACT_EMAIL,
  WHATSAPP_LINK,
} from '@/features/feedback/utils/contact.config';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <ProgressiveText
              className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-widest mb-4"
              delay={0.1}
              stagger={0.02}
            >
              COMENZAR AHORA
            </ProgressiveText>
            <ProgressiveText
              className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary-foreground mb-6 leading-tight"
              delay={0.2}
              stagger={0.04}
            >
              Investigación legal.<br />
              Simplificada.
            </ProgressiveText>
            <ProgressiveText
              className="text-base md:text-lg text-primary-foreground/70 mb-10 leading-relaxed"
              delay={0.4}
              stagger={0.02}
            >
              Accede a más de 700K normas argentinas con inteligencia artificial. Encuentra la legislación que necesitás en segundos.
            </ProgressiveText>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                variant="secondary"
                className="font-medium"
              >
                Probar gratis
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Ver demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Section */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="space-y-8">
            {/* Pages */}
            <div className="flex items-center">
              <h4 className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-widest mr-4">
                Pages
              </h4>
              <div className="flex-1 h-px bg-primary-foreground/20"></div>
              <nav className="flex gap-x-8 ml-4">
                <a href="#hero" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Inicio
                </a>
                <a href="#features" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Características
                </a>
                <a href="#services" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Servicios
                </a>
                <a href="#about-us" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Nosotros
                </a>
                <a href="#contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Contacto
                </a>
              </nav>
            </div>

            {/* Legal */}
            <div className="flex items-center">
              <h4 className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-widest mr-4">
                Legal
              </h4>
              <div className="flex-1 h-px bg-primary-foreground/20"></div>
              <nav className="flex gap-x-8 ml-4">
                <a href="#privacy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Política de privacidad
                </a>
                <a href="#terms" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Términos y condiciones
                </a>
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <SvgEstampa className="size-7 text-primary-foreground" />
                <span className="text-primary-foreground font-bold font-serif text-lg">Simpla</span>
              </div>
              <span className="text-primary-foreground/50 text-xs">
                Simpla 2025. All Rights Reserved
              </span>
            </div>

            {/* Contact Icons */}
            <div className="flex items-center gap-3">
              <a 
                href={`mailto:${CONTACT_EMAIL}`}
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-all"
                aria-label="Enviar correo"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a 
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-all"
                aria-label="Abrir WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}