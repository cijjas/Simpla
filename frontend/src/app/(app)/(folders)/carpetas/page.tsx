'use client';

import FolderTreeComponent from '@/components/ui/folder-tree';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { FolderOpen, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CarpetasPage() {
  const [selectedFolder, _setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex w-full overflow-hidden h-full'>
      {/* Left Sidebar with Folder Tree */}
      <div className='w-[320px] min-w-[320px] p-4 border-r border-border bg-background overflow-y-auto'>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Organización</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar carpetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <FolderTreeComponent />
      </div>

      {/* Main Content Area */}
      <div className='flex-1 overflow-y-auto p-6'>
        {selectedFolder ? (
          <div>
            <h1 className='text-2xl font-semibold mb-4'>Contenido de la Carpeta</h1>
            <p className='text-muted-foreground'>
              Aquí se mostrarán las normas dentro de la carpeta seleccionada.
            </p>
            {/* TODO: Implement folder content view */}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
            <h1 className='text-2xl font-semibold mb-4 text-gray-600'>
              Organiza tus Normas
            </h1>
            <div className="max-w-md">
              <p className='text-muted-foreground mb-6'>
                Crea carpetas para organizar tus normas jurídicas de manera eficiente. 
                Puedes agruparlas por tema, jurisdicción, importancia o cualquier criterio que te resulte útil.
              </p>
              
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">Sugerencias de Uso</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Favoritas:</strong> Para normas que consultas frecuentemente</li>
                      <li>• <strong>Por Leer:</strong> Normas pendientes de revisión</li>
                      <li>• <strong>Laboral:</strong> Normas de derecho laboral</li>
                      <li>• <strong>Fiscal:</strong> Normas tributarias y fiscales</li>
                      <li>• <strong>Por Compartir:</strong> Para enviar a tu equipo</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
