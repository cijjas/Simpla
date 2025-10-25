'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
  lastUpdated?: string;
}

export function LegalPageLayout({ 
  title, 
  children, 
  lastUpdated 
}: LegalPageLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header with dark blue background */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div className="h-6 w-px bg-white/20" />
              <Link href="/" className="text-sm text-white/80 hover:text-white">
                Simpla
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with title */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-light text-white tracking-wide">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-blue-100 mt-4 text-lg">
              Última actualización: {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="prose prose-lg prose-gray max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
