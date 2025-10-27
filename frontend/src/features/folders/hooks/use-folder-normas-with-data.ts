/**
 * Simplified hook for folder normas - now just a thin wrapper
 * The backend returns all data we need, so this is much simpler
 */

import { useCallback } from 'react';
import { useFolderNormas } from './use-folders';
import { FolderNormaUpdate } from '../types';

export function useFolderNormasWithData(folderId: string | null) {
  const {
    folderWithNormas,
    loading,
    error,
    isTransitioning,
    addNormaToFolder: addToFolder,
    removeNormaFromFolder: removeFromFolder,
    updateFolderNorma,
  } = useFolderNormas(folderId);

  const addNormaToFolder = useCallback(
    async (normaId: number, notes?: string) => {
      await addToFolder({ norma_id: normaId, notes, order_index: undefined });
    },
    [addToFolder]
  );

  const removeNormaFromFolder = useCallback(
    async (normaId: number) => {
      await removeFromFolder(normaId);
    },
    [removeFromFolder]
  );

  const updateFolderNormaCallback = useCallback(
    async (normaId: number, updateData: FolderNormaUpdate) => {
      await updateFolderNorma(normaId, updateData);
    },
    [updateFolderNorma]
  );

  return {
    folderWithNormas,
    loading,
    error,
    isTransitioning,
    addNormaToFolder,
    removeNormaFromFolder,
    updateFolderNorma: updateFolderNormaCallback,
  };
}
