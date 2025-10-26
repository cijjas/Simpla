/**
 * Types for folder management system
 */

import { NormaSummary } from '@/features/normas/api/normas-api';

export interface FolderTreeItem {
  id: string;
  name: string;
  description?: string;
  level: number;
  color: string | null;
  icon: string;
  order_index: number;
  norma_count: number;
  subfolders: FolderTreeItem[];
}

export interface FolderResponse {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  level: number;
  color: string | null;
  icon: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  norma_count: number;
}

export interface FolderCreate {
  name: string;
  description?: string;
  parent_folder_id?: string;
  color: string | null;
  icon: string;
}

export interface FolderUpdate {
  name?: string;
  description?: string;
  color?: string | null;
  icon?: string;
  parent_folder_id?: string;
}

export interface FolderMove {
  parent_folder_id?: string;
  order_index?: number;
}

export interface FolderNormaWithNorma {
  id: string;
  norma: NormaSummary; // Use the same type as in normas feature
  added_at: string;
  order_index: number;
  notes?: string;
}

export interface FolderWithNormasResponse {
  folder: FolderResponse;
  normas: FolderNormaWithNorma[];
}

export interface FolderNormaCreate {
  norma_id: number;
  notes?: string;
  order_index?: number;
}

export interface FolderNormaUpdate {
  notes?: string;
  order_index?: number;
}
