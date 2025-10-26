import { useState, useEffect, useCallback } from 'react';
import { type NormaSummary } from '@/features/normas/api/normas-api';
import { useFolderNormas } from './use-folders';
import { FolderNormaUpdate, FolderWithNormasResponse } from '../types';

interface UseFolderNormasWithDataResult {
  normas: NormaSummary[];
  folderWithNormas: FolderWithNormasResponse | null;
  loading: boolean;
  error: string | null;
  addNormaToFolder: (normaId: number, notes?: string) => Promise<void>;
  removeNormaFromFolder: (normaId: number) => Promise<void>;
  updateFolderNorma: (normaId: number, updateData: FolderNormaUpdate) => Promise<void>;
}

export function useFolderNormasWithData(folderId: string): UseFolderNormasWithDataResult {
  const { folderWithNormas, loading: folderLoading, error: folderError, addNormaToFolder: addToFolder, removeNormaFromFolder: removeFromFolder, updateFolderNorma } = useFolderNormas(folderId);
  const [normas, setNormas] = useState<NormaSummary[]>([]);
  const [normasLoading, setNormasLoading] = useState(false);
  const [normasError, setNormasError] = useState<string | null>(null);

  // Extract normas from folderWithNormas - no need for separate API calls
  useEffect(() => {
    if (!folderWithNormas?.normas || folderWithNormas.normas.length === 0) {
      setNormas([]);
      setNormasError(null);
      return;
    }

    // The backend now returns full norma data, so we can extract it directly
    const extractedNormas = folderWithNormas.normas
      .map(folderNorma => folderNorma.norma)
      .filter((norma): norma is NormaSummary => norma !== null);
    
    setNormas(extractedNormas);
    setNormasError(null);
  }, [folderWithNormas]);

  const addNormaToFolder = useCallback(async (normaId: number, notes?: string) => {
    await addToFolder({ norma_id: normaId, notes, order_index: undefined });
  }, [addToFolder]);

  const removeNormaFromFolder = useCallback(async (normaId: number) => {
    await removeFromFolder(normaId);
  }, [removeFromFolder]);

  const updateFolderNormaCallback = useCallback(async (normaId: number, updateData: FolderNormaUpdate) => {
    await updateFolderNorma(normaId, updateData);
  }, [updateFolderNorma]);

  return {
    normas,
    folderWithNormas,
    loading: folderLoading,
    error: folderError || normasError,
    addNormaToFolder,
    removeNormaFromFolder,
    updateFolderNorma: updateFolderNormaCallback
  };
}
