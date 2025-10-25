'use client';

import Link from 'next/link';
import { FileText, Shield } from 'lucide-react';

interface LegalLinksProps {
  className?: string;
  showIcons?: boolean;
}

export function LegalLinks({ className = '', showIcons = true }: LegalLinksProps) {
  return (
    <div className={`flex flex-wrap gap-4 text-sm text-muted-foreground ${className}`}>
      <Link 
        href="/terminos" 
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {showIcons && <FileText className="h-4 w-4" />}
        Términos y Condiciones
      </Link>
      
      <span className="text-muted-foreground/50">•</span>
      
      <Link 
        href="/privacidad" 
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {showIcons && <Shield className="h-4 w-4" />}
        Política de Privacidad
      </Link>
    </div>
  );
}
