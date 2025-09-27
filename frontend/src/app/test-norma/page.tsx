'use client';

import { useState, useEffect } from 'react';

// Types for the API response
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

interface NormaData {
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

export default function TestNormaPage() {
  const [normaData, setNormaData] = useState<NormaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Toggle expansion state for divisions and articles
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Fetch norma data from the backend API
  useEffect(() => {
    const fetchNormaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use a test ID - you can change this to any existing norma ID
        const response = await fetch('/api/norma/1/');
        
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
  }, []);

  // Render article with its children recursively
  const renderArticle = (article: Article, depth: number = 0): JSX.Element => {
    const articleId = `article-${article.id}`;
    const isExpanded = expandedItems.has(articleId);
    const hasChildren = article.child_articles.length > 0;

    return (
      <div key={article.id} className={`ml-${depth * 4} border-l-2 border-gray-200 pl-4 mb-2`}>
        <div 
          className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
            hasChildren ? 'cursor-pointer' : ''
          }`}
          onClick={() => hasChildren && toggleExpanded(articleId)}
        >
          {hasChildren && (
            <span className="text-gray-500 mt-1">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <div className="flex-1">
            <div className="font-semibold text-blue-600">
              {article.ordinal}
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {article.body}
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {article.child_articles.map(child => renderArticle(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render division with its children and articles recursively
  const renderDivision = (division: Division, depth: number = 0): JSX.Element => {
    const divisionId = `division-${division.id}`;
    const isExpanded = expandedItems.has(divisionId);
    const hasChildren = division.child_divisions.length > 0 || division.articles.length > 0;

    return (
      <div key={division.id} className={`ml-${depth * 4} border-l-2 border-blue-200 pl-4 mb-4`}>
        <div 
          className={`flex items-start gap-2 p-3 rounded cursor-pointer hover:bg-blue-50 ${
            hasChildren ? 'cursor-pointer' : ''
          }`}
          onClick={() => hasChildren && toggleExpanded(divisionId)}
        >
          {hasChildren && (
            <span className="text-blue-500 mt-1">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <div className="flex-1">
            <div className="font-bold text-blue-800">
              {division.ordinal} - {division.name}
            </div>
            {division.title && (
              <div className="font-semibold text-gray-800 mt-1">
                {division.title}
              </div>
            )}
            {division.body && (
              <div className="text-gray-600 mt-2 whitespace-pre-wrap">
                {division.body}
              </div>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-3">
            {/* Render child divisions */}
            {division.child_divisions.map(child => renderDivision(child, depth + 1))}
            
            {/* Render articles */}
            {division.articles.map(article => renderArticle(article, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando norma...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error al cargar la norma</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-2">
            Asegúrate de que el backend esté ejecutándose y que exista una norma con ID 1 en la base de datos.
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

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Norma Header */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {normaData.titulo_resumido}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-semibold">ID InfoLeg:</span> {normaData.infoleg_id}
            </div>
            <div>
              <span className="font-semibold">Jurisdicción:</span> {normaData.jurisdiccion || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Clase:</span> {normaData.clase_norma || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Tipo:</span> {normaData.tipo_norma || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Sanción:</span> {normaData.sancion || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Publicación:</span> {normaData.publicacion || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Estado:</span> {normaData.estado || 'N/A'}
            </div>
          </div>
        </div>

        {/* Divisions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Estructura de la Norma
          </h2>
          
          {normaData.divisions.length === 0 ? (
            <p className="text-gray-500 italic">Esta norma no tiene divisiones estructuradas.</p>
          ) : (
            <div>
              {normaData.divisions.map(division => renderDivision(division))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
