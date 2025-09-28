'use client';

import { useState, useEffect } from 'react';
import NormaHeader from '@/features/infoleg/norma/norma-header';
import { NormaBody } from '@/features/infoleg/norma/norma-body';

// Types for the backend API response
interface Article {
  id: number;
  ordinal: string;
  body: string;
  order_index: number;
  child_articles: Article[];
}

interface Division {
  id: number;
  name: string;
  ordinal: string;
  title: string;
  body: string;
  order_index: number;
  child_divisions: Division[];
  articles: Article[];
}

interface BackendNormaData {
  id: number;
  infoleg_id: number;
  titulo_resumido: string;
  jurisdiccion: string;
  clase_norma: string;
  tipo_norma: string;
  sancion: string | null;
  publicacion: string | null;
  estado: string;
  divisions: Division[];
}

interface NormaPageProps {
  normaId?: number;
}

export default function NormaPage({ normaId = 1 }: NormaPageProps) {
  const [normaData, setNormaData] = useState<BackendNormaData | null>(null);
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch norma data from the backend API
  useEffect(() => {
    const fetchNormaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/norma/${normaId}/`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setNormaData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching norma data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNormaData();
  }, [normaId]);


  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error al cargar la norma</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-2">
            Asegúrate de que el backend esté ejecutándose y que exista una norma con ID {normaId} en la base de datos.
          </p>
        </div>
      </div>
    );
  }

  if (!normaData) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <div className="text-center text-gray-600">
          No se encontró información de la norma.
        </div>
      </div>
    );
  }

  // Transform backend data to match NormaHeader expected format
  const transformedNorma = {
    id: normaData.id,
    infoleg_id: normaData.infoleg_id,
    titulo_resumido: normaData.titulo_resumido,
    jurisdiccion: normaData.jurisdiccion,
    clase_norma: normaData.clase_norma,
    tipo_norma: normaData.tipo_norma,
    sancion: normaData.sancion || undefined,
    publicacion: normaData.publicacion || undefined,
    estado: normaData.estado,
    // Add required fields for NormaHeader
    nombreNorma: `${normaData.tipo_norma} ${normaData.id}`,
    tituloSumarioFormateado: normaData.titulo_resumido,
    tituloResumidoFormateado: normaData.titulo_resumido,
    textoResumidoFormateado: normaData.titulo_resumido,
    nroBoletin: '',
    pagBoletin: '',
    listaNormasQueComplementa: [],
    listaNormasQueLaComplementan: [],
    textoNorma: '',
    textoNormaAct: '',
    esNumerada: false,
    copyTexto: normaData.titulo_resumido,
  } as {
    id: number;
    infoleg_id: number;
    titulo_resumido: string;
    jurisdiccion: string;
    clase_norma: string;
    tipo_norma: string;
    sancion?: string;
    publicacion?: string;
    estado: string;
    nombreNorma: string;
    tituloSumarioFormateado: string;
    tituloResumidoFormateado: string;
    textoResumidoFormateado: string;
    nroBoletin: string;
    pagBoletin: string;
    listaNormasQueComplementa: number[];
    listaNormasQueLaComplementan: number[];
    textoNorma: string;
    textoNormaAct: string;
    esNumerada: boolean;
    copyTexto: string;
  };

  return (
    <section className='container mx-auto max-w-5xl p-10 space-y-10'>
      <NormaHeader norma={transformedNorma} />
      <NormaBody originalHtml={transformedNorma.textoNorma || transformedNorma.textoNormaAct} />
    </section>
  );
}
