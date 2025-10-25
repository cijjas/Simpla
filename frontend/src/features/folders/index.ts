/**
 * Folders feature exports
 */

export { FolderTree } from './components/folder-tree';
export { FolderContent } from './components/folder-content';
export { CreateFolderDialog } from './components/create-folder-dialog';
export { EditFolderDialog } from './components/edit-folder-dialog';
export { DeleteFolderDialog } from './components/delete-folder-dialog';
export { AddToFolderDialog } from './components/add-to-folder-dialog';
export { FoldersPage } from './pages/folders-page';

export { useFolders, useFolderNormas } from './hooks/use-folders';
export { useFolderNormasWithData } from './hooks/use-folder-normas-with-data';

export type {
  FolderTreeItem,
  FolderResponse,
  FolderCreate,
  FolderUpdate,
  FolderMove,
  NormaInFolder,
  FolderNormaWithNorma,
  FolderWithNormasResponse,
  FolderNormaCreate,
  FolderNormaUpdate,
} from './types';
