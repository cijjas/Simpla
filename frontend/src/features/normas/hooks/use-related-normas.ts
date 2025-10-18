'use client';

import { useState, useEffect } from 'react';
import { NormaSummary, normasAPI } from '../api/normas-api';

interface UseRelatedNormasProps {
  modificaIds: number[];
  modificadaIds: number[];
  open: string[];
}

export function useRelatedNormas({
  modificaIds,
  modificadaIds,
  open,
}: UseRelatedNormasProps) {
  const [modifica, setModifica] = useState<NormaSummary[] | null>(null);
  const [modificadaPor, setModificadaPor] = useState<NormaSummary[] | null>(
    null,
  );
  const [modificaProgress, setModificaProgress] = useState(0);
  const [modificadaProgress, setModificadaProgress] = useState(0);

  const fetchList = async (
    ids: number[],
    setter: (d: NormaSummary[]) => void,
    setProgress: (p: number) => void,
  ) => {
    if (!ids.length) return;

    const promises = ids.map(async id => {
      try {
        return await normasAPI.getNormaSummary(id);
      } catch (error) {
        console.error(`Failed to fetch norma ${id}:`, error);
        return null;
      }
    });

    let completed = 0;
    const results = await Promise.allSettled(promises);

    results.forEach(_result => {
      completed++;
      setProgress((completed / ids.length) * 100);
    });

    const validResults = results
      .filter(
        (result): result is PromiseFulfilledResult<NormaSummary> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map(result => result.value);

    setter(validResults);
  };

  useEffect(() => {
    if (open.includes('modifica') && modifica === null && modificaIds.length) {
      fetchList(modificaIds, setModifica, setModificaProgress);
    }
    if (
      open.includes('modificada') &&
      modificadaPor === null &&
      modificadaIds.length
    ) {
      fetchList(modificadaIds, setModificadaPor, setModificadaProgress);
    }
  }, [open, modifica, modificadaPor, modificaIds, modificadaIds]);

  return {
    modifica,
    modificadaPor,
    modificaProgress,
    modificadaProgress,
    modificaCount: modificaIds.length,
    modificadaCount: modificadaIds.length,
  };
}
