'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { NormasFilter } from '../components/normas-filter';
import { NormasList } from '../components/normas-list';
import { useNormasSearch } from '../hooks/use-normas-search';

export function NormasPage() {
  const {
    loading,
    error
  } = useNormasSearch();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 border-b bg-background px-6 py-4">
        <div className="text-start space-y-1">
          <h1 className="text-3xl font-bold font-serif">Explorador de Normas</h1>
          <p className="text-muted-foreground text-sm">
            Busca y explora la base de datos de normas legales argentinas
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="ml-4"
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content - Sidebar + Results */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter Sidebar - Fixed width */}
        <div className="w-80 flex-shrink-0 border-r bg-muted overflow-y-auto">
          <div className="p-6">
            <NormasFilter loading={loading} />
          </div>
        </div>

        {/* Results Section - Fills remaining space */}
        <div className="flex-1 overflow-hidden">
          <NormasList />
        </div>
      </div>
    </div>
  );
}
