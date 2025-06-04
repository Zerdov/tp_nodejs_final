import fs from 'fs/promises';
import path from 'path';
import { getFile } from '../utils/getFile';

export type File = {
  id: string;
  owner: string;
  path: string;
  type: 'file' | 'folder';
  sharedWith: string[];
};

const generateId = () => Math.random().toString(36).substring(2, 10);

export const readFilesJson = async (): Promise<File[]> => {
  try {
    const data = await fs.readFile(path.resolve(__dirname, '../../data/files.json'), 'utf-8');
    return JSON.parse(data) as File[];
  } catch (err) {
    return [];
  }
};

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

export const writeFilesJson = async (files: File[]): Promise<void> => {
  const data = JSON.stringify(files, null, 2);
  await fs.writeFile(path.resolve(__dirname, '../../data/files.json'), data, 'utf-8');
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

export const getSharedUsersForPath = async (filePath: string): Promise<string[]> => {
  const filesPath = path.join(__dirname, '../../data/files.json');
  const raw = await fs.readFile(filesPath, 'utf-8');
  const entries: File[] = JSON.parse(raw);

  const parts = filePath.split('/').filter(Boolean); // ["user-001", "shared", "truc.txt"]
  const foldersToCheck: string[] = [];

  // Génère tous les chemins potentiels vers les dossiers parents
  for (let i = 1; i < parts.length; i++) {
    const partial = '/' + parts.slice(0, i + 1).join('/');
    foldersToCheck.push(partial);
  }

  // Ajoute aussi le fichier lui-même (peut être partagé directement)
  foldersToCheck.push(filePath);

  // Trouve tous les éléments correspondants
  const sharedUsers = new Set<string>();
  for (const entry of entries) {
    if (foldersToCheck.includes(entry.path) && entry.sharedWith.length > 0) {
      entry.sharedWith.forEach(u => sharedUsers.add(u));
    }
  }

  return [...sharedUsers];
};