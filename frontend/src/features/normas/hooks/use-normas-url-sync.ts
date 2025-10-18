'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { NormaFilters } from '../api/normas-api';

const DEFAULT_LIMIT = 12;

/**
 * Hook to sync normas filters with URL parameters
 * URL is the single source of truth for filter state
 */
export function useNormasUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Parse filters from current URL - this is the source of truth
   */
  const getFiltersFromUrl = useCallback((): NormaFilters => {
    const urlFilters: NormaFilters = {
      limit: DEFAULT_LIMIT,
      offset: 0,
    };

    // Extract all filter parameters from URL
    const searchTerm = searchParams.get('q');
    const numero = searchParams.get('numero');
    const dependencia = searchParams.get('dependencia');
    const tituloSumario = searchParams.get('titulo_sumario');
    const jurisdiccion = searchParams.get('jurisdiccion');
    const tipoNorma = searchParams.get('tipo');
    const claseNorma = searchParams.get('clase');
    const estado = searchParams.get('estado');
    const añoSancion = searchParams.get('año_sancion');
    const sancionDesde = searchParams.get('sancion_desde');
    const sancionHasta = searchParams.get('sancion_hasta');
    const publicacionDesde = searchParams.get('publicacion_desde');
    const publicacionHasta = searchParams.get('publicacion_hasta');
    const nroBoletin = searchParams.get('nro_boletin');
    const pagBoletin = searchParams.get('pag_boletin');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (searchTerm?.trim()) {
      urlFilters.search_term = searchTerm.trim();
    }
    if (numero) {
      const numeroValue = parseInt(numero, 10);
      if (!isNaN(numeroValue) && numeroValue > 0) {
        urlFilters.numero = numeroValue;
      }
    }
    if (dependencia) {
      urlFilters.dependencia = dependencia;
    }
    if (tituloSumario) {
      urlFilters.titulo_sumario = tituloSumario;
    }
    if (jurisdiccion) {
      urlFilters.jurisdiccion = jurisdiccion;
    }
    if (tipoNorma) {
      urlFilters.tipo_norma = tipoNorma;
    }
    if (claseNorma) {
      urlFilters.clase_norma = claseNorma;
    }
    if (estado) {
      urlFilters.estado = estado;
    }
    if (añoSancion) {
      const añoValue = parseInt(añoSancion, 10);
      if (!isNaN(añoValue) && añoValue >= 1810) {
        urlFilters.año_sancion = añoValue;
      }
    }
    if (sancionDesde) {
      urlFilters.sancion_desde = sancionDesde;
    }
    if (sancionHasta) {
      urlFilters.sancion_hasta = sancionHasta;
    }
    if (publicacionDesde) {
      urlFilters.publicacion_desde = publicacionDesde;
    }
    if (publicacionHasta) {
      urlFilters.publicacion_hasta = publicacionHasta;
    }
    if (nroBoletin?.trim()) {
      urlFilters.nro_boletin = nroBoletin.trim();
    }
    if (pagBoletin?.trim()) {
      urlFilters.pag_boletin = pagBoletin.trim();
    }

    // Handle pagination
    const limitNum = limit ? parseInt(limit, 10) : DEFAULT_LIMIT;
    urlFilters.limit = !isNaN(limitNum) && limitNum > 0 ? limitNum : DEFAULT_LIMIT;

    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        urlFilters.offset = (pageNum - 1) * urlFilters.limit;
      }
    }

    return urlFilters;
  }, [searchParams]);

  /**
   * Update URL with new filter values
   * This is the single way to change filter state
   */
  const setFiltersInUrl = useCallback(
    (filters: Partial<NormaFilters>, resetPagination = true) => {
      // Get current filters from URL
      const currentFilters = getFiltersFromUrl();
      
      // Merge with new filters
      const newFilters = { ...currentFilters, ...filters };
      
      // Reset pagination if requested (default when filters change)
      if (resetPagination && filters.offset === undefined) {
        newFilters.offset = 0;
      }

      // Build URL params
      const params = new URLSearchParams();

      if (newFilters.search_term?.trim()) {
        params.set('q', newFilters.search_term.trim());
      }
      if (newFilters.numero !== undefined && newFilters.numero > 0) {
        params.set('numero', newFilters.numero.toString());
      }
      if (newFilters.dependencia) {
        params.set('dependencia', newFilters.dependencia);
      }
      if (newFilters.titulo_sumario) {
        params.set('titulo_sumario', newFilters.titulo_sumario);
      }
      if (newFilters.jurisdiccion) {
        params.set('jurisdiccion', newFilters.jurisdiccion);
      }
      if (newFilters.tipo_norma) {
        params.set('tipo', newFilters.tipo_norma);
      }
      if (newFilters.clase_norma) {
        params.set('clase', newFilters.clase_norma);
      }
      if (newFilters.estado) {
        params.set('estado', newFilters.estado);
      }
      if (newFilters.año_sancion !== undefined && newFilters.año_sancion >= 1810) {
        params.set('año_sancion', newFilters.año_sancion.toString());
      }
      if (newFilters.sancion_desde) {
        params.set('sancion_desde', newFilters.sancion_desde);
      }
      if (newFilters.sancion_hasta) {
        params.set('sancion_hasta', newFilters.sancion_hasta);
      }
      if (newFilters.publicacion_desde) {
        params.set('publicacion_desde', newFilters.publicacion_desde);
      }
      if (newFilters.publicacion_hasta) {
        params.set('publicacion_hasta', newFilters.publicacion_hasta);
      }
      if (newFilters.nro_boletin?.trim()) {
        params.set('nro_boletin', newFilters.nro_boletin.trim());
      }
      if (newFilters.pag_boletin?.trim()) {
        params.set('pag_boletin', newFilters.pag_boletin.trim());
      }

      // Add pagination (convert offset to page number)
      const limit = newFilters.limit || DEFAULT_LIMIT;
      const offset = newFilters.offset || 0;
      const page = Math.floor(offset / limit) + 1;
      
      // Only add page if not page 1 (default)
      if (page > 1) {
        params.set('page', page.toString());
      }
      
      // Only add limit if it's not the default
      if (limit !== DEFAULT_LIMIT) {
        params.set('limit', limit.toString());
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Always update URL (Next.js will handle if it's the same)
      router.replace(newUrl, { scroll: false });
    },
    [router, pathname, getFiltersFromUrl]
  );

  /**
   * Clear all filters (reset to defaults)
   */
  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { 
    getFiltersFromUrl, 
    setFiltersInUrl, 
    clearFilters,
    currentFilters: getFiltersFromUrl() 
  };
}

