import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/features/auth/hooks/use-api';
import { getNormaDetalladaResumen } from '@/features/infoleg/utils/api';
import type { NormaItem } from '@/features/infoleg/utils/types';
import { useFolderNormas } from './use-folders';

interface UseFolderNormasWithDataResult {
  normas: NormaItem[];
  loading: boolean;
  error: string | null;
  addNormaToFolder: (normaId: number, notes?: string) => Promise<void>;
  removeNormaFromFolder: (normaId: number) => Promise<void>;
}

export function useFolderNormasWithData(folderId: string): UseFolderNormasWithDataResult {
  const { folderWithNormas, loading: folderLoading, error: folderError, addNormaToFolder: addToFolder, removeNormaFromFolder: removeFromFolder } = useFolderNormas(folderId);
  const [normas, setNormas] = useState<NormaItem[]>([]);
  const [normasLoading, setNormasLoading] = useState(false);
  const [normasError, setNormasError] = useState<string | null>(null);

  // Fetch actual norma data when folder normas change
  useEffect(() => {
    const fetchNormasData = async () => {
      if (!folderWithNormas?.normas || folderWithNormas.normas.length === 0) {
        setNormas([]);
        return;
      }

      try {
        setNormasLoading(true);
        setNormasError(null);

        console.log('Fetching normas data for folder:', folderWithNormas.normas.map(n => n.norma.id));
        
        const normaPromises = folderWithNormas.normas.map(async (folderNorma) => {
          try {
            const normaData = await getNormaDetalladaResumen(folderNorma.norma.id);
            return normaData;
          } catch (error) {
            console.error(`Error fetching norma ${folderNorma.norma.id}:`, error);
            return null; // Skip failed normas
          }
        });

        const normaResults = await Promise.all(normaPromises);
        // Filter out null results (failed fetches)
        const validNormas = normaResults.filter((norma): norma is NormaItem => norma !== null);
        
        console.log('Fetched normas:', validNormas);
        setNormas(validNormas);
      } catch (err) {
        console.error('Error fetching normas data:', err);
        setNormasError('Error al cargar las normas');
      } finally {
        setNormasLoading(false);
      }
    };

    fetchNormasData();
  }, [folderWithNormas]);

  const addNormaToFolder = useCallback(async (normaId: number, notes?: string) => {
    await addToFolder({ norma_id: normaId, notes, order_index: undefined });
  }, [addToFolder]);

  const removeNormaFromFolder = useCallback(async (normaId: number) => {
    await removeFromFolder(normaId);
  }, [removeFromFolder]);

  return {
    normas,
    loading: folderLoading || normasLoading,
    error: folderError || normasError,
    addNormaToFolder,
    removeNormaFromFolder
  };
}
