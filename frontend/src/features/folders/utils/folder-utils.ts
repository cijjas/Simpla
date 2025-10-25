import { FolderTreeItem } from '../types';

/**
 * Builds the full path from root to the specified folder
 * @param folders - The complete folder tree
 * @param targetFolderId - The ID of the folder to build the path for
 * @returns Array of folders representing the path from root to target
 */
export function buildFolderPath(folders: FolderTreeItem[], targetFolderId: string): FolderTreeItem[] {
  const path: FolderTreeItem[] = [];
  
  function findPath(currentFolders: FolderTreeItem[], targetId: string): boolean {
    for (const folder of currentFolders) {
      path.push(folder);
      
      if (folder.id === targetId) {
        return true; // Found the target folder
      }
      
      // Recursively search in subfolders
      if (folder.subfolders.length > 0 && findPath(folder.subfolders, targetId)) {
        return true; // Found in subfolders
      }
      
      path.pop(); // Remove this folder from path if not found
    }
    
    return false; // Not found in this branch
  }
  
  findPath(folders, targetFolderId);
  return path;
}

/**
 * Finds a folder by ID in the folder tree
 * @param folders - The complete folder tree
 * @param folderId - The ID of the folder to find
 * @returns The folder if found, null otherwise
 */
export function findFolderById(folders: FolderTreeItem[], folderId: string): FolderTreeItem | null {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }
    
    if (folder.subfolders.length > 0) {
      const found = findFolderById(folder.subfolders, folderId);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Finds the parent folder of a given folder
 * @param folders - The complete folder tree
 * @param targetFolderId - The ID of the folder to find the parent of
 * @returns The parent folder if found, null if the folder is at root level or not found
 */
export function findParentFolder(folders: FolderTreeItem[], targetFolderId: string): FolderTreeItem | null {
  for (const folder of folders) {
    // Check if the target is a direct child
    if (folder.subfolders.some(subfolder => subfolder.id === targetFolderId)) {
      return folder;
    }
    
    // Recursively search in subfolders
    if (folder.subfolders.length > 0) {
      const found = findParentFolder(folder.subfolders, targetFolderId);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Gets the first available folder from the folder tree
 * Prioritizes root level folders (level 0)
 * @param folders - The complete folder tree
 * @returns The first available folder or null if no folders exist
 */
export function getFirstAvailableFolder(folders: FolderTreeItem[]): FolderTreeItem | null {
  if (folders.length === 0) return null;
  
  // Return the first root folder (level 0)
  const rootFolders = folders.filter(folder => folder.level === 0);
  return rootFolders.length > 0 ? rootFolders[0] : folders[0];
}
