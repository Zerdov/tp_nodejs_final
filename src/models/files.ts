import { getFile } from '../utils/getFile';

export type File = {
  id: string;
  owner: string;
  path: string;
  type: 'file' | 'folder';
  sharedWith: string[];
};

const generateId = () => Math.random().toString(36).substring(2, 10);

export const getAccessibleFiles = async (userID: string): Promise<File[]> => {
  const { success, data } = await getFile('../../data', 'files.json');
  if (!success) return [];

  const allFiles: File[] = JSON.parse(data);

  return allFiles.filter(file =>
    file.owner === userID || file.sharedWith.includes(userID)
  );
};

export const getFolderById = async (folderId: string): Promise<File | null> => {
  const { success, data } = await getFile('../../data', 'files.json');
  if (!success) return null;

  try {
    const files: File[] = JSON.parse(data);
    const folder = files.find(f => f.id === folderId && f.type === 'folder');
    return folder ?? null;
  } catch (err) {
    console.error('Erreur de parsing JSON dans getFolderById:', err);
    return null;
  }
};

export const createFile = (files: File[], newFile: File): File[] => {
  return [...files, newFile];
};

export const updateFile = (files: File[], id: string, updates: Partial<File>): File[] => {
  return files.map(f => f.id === id ? { ...f, ...updates } : f);
};

export const deleteFile = (files: File[], id: string): File[] => {
  return files.filter(f => f.id !== id);
};
