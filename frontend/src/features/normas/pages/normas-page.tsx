'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search, BarChart3 } from 'lucide-react';
import { NormasFilter } from '../components/normas-filter';
import { NormasList } from '../components/normas-list';
import { NormasStats } from '../components/normas-stats';
import { useNormasSearch } from '../hooks/use-normas-search';

export function NormasPage() {
  const {
    loading,
    error
  } = useNormasSearch();


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Explorador de Normas</h1>
        <p className="text-muted-foreground text-lg">
          Busca y explora la base de datos de normas legales argentinas
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
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

      {/* Main Content */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Normas
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          {/* Filter Component */}
          <NormasFilter loading={loading} />

          {/* Results */}
          <NormasList />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <NormasStats />
        </TabsContent>
      </Tabs>

    </div>
  );
}
