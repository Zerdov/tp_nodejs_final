import { test } from 'node:test';
import assert from 'node:assert/strict';

type File = {
  id: string;
  owner: string;
  path: string;
  type: 'file' | 'folder';
  sharedWith: string[];
};

const mockFiles: File[] = [
  { id: 'f1', owner: 'u1', path: '/u1/docs', type: 'folder', sharedWith: ['u2'] },
  { id: 'f2', owner: 'u2', path: '/u2/file.txt', type: 'file', sharedWith: [] },
  { id: 'f3', owner: 'u1', path: '/u1/shared/file2.txt', type: 'file', sharedWith: ['u3'] },
];

const getFiles = async (): Promise<File[]> => {
  return mockFiles;
};

const getAccessibleFiles = async (userID: string): Promise<File[]> => {
  const allFiles = await getFiles();
  return allFiles.filter(file => file.owner === userID || file.sharedWith.includes(userID));
};

const getFolderById = async (folderId: string): Promise<File | null> => {
  const files = await getFiles();
  const folder = files.find(f => f.id === folderId && f.type === 'folder');
  return folder ?? null;
};

const createFile = (files: File[], newFile: File): File[] => {
  return [...files, newFile];
};

const updateFile = (files: File[], id: string, updates: Partial<File>): File[] => {
  return files.map(f => f.id === id ? { ...f, ...updates } : f);
};

const deleteFile = (files: File[], id: string): File[] => {
  return files.filter(f => f.id !== id);
};

const getSharedUsersForPath = async (filePath: string): Promise<string[]> => {
  const entries = await getFiles();

  const parts = filePath.split('/').filter(Boolean);
  const foldersToCheck: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    foldersToCheck.push('/' + parts.slice(0, i + 1).join('/'));
  }
  foldersToCheck.push(filePath);

  const sharedUsers = new Set<string>();
  for (const entry of entries) {
    if (foldersToCheck.includes(entry.path) && entry.sharedWith.length > 0) {
      entry.sharedWith.forEach(u => sharedUsers.add(u));
    }
  }
  return [...sharedUsers];
};


test('getFiles retourne tous les fichiers', async () => {
  const files = await getFiles();
  assert.equal(files.length, 3);
  assert.equal(files[0].id, 'f1');
});

test('getAccessibleFiles retourne fichiers accessibles par u1', async () => {
  const files = await getAccessibleFiles('u1');
  assert.equal(files.length, 2);
  assert(files.some(f => f.id === 'f1'));
  assert(files.some(f => f.id === 'f3'));
});

test('getAccessibleFiles retourne fichiers accessibles par u3 (partagés)', async () => {
  const files = await getAccessibleFiles('u3');
  assert.equal(files.length, 1);
  assert.equal(files[0].id, 'f3');
});

test('getFolderById retourne un dossier valide', async () => {
  const folder = await getFolderById('f1');
  assert.ok(folder);
  assert.equal(folder?.type, 'folder');
});

test('getFolderById retourne null pour un fichier ou id inconnu', async () => {
  assert.equal(await getFolderById('f2'), null);
  assert.equal(await getFolderById('unknown'), null);
});

test('createFile ajoute un nouveau fichier', () => {
  const newFile: File = { id: 'f4', owner: 'u4', path: '/u4/newfile', type: 'file', sharedWith: [] };
  const updated = createFile(mockFiles, newFile);
  assert.equal(updated.length, mockFiles.length + 1);
  assert(updated.some(f => f.id === 'f4'));
});

test('updateFile modifie un fichier', () => {
  const updated = updateFile(mockFiles, 'f1', { owner: 'u999' });
  const file = updated.find(f => f.id === 'f1');
  assert.equal(file?.owner, 'u999');
});

test('deleteFile supprime un fichier', () => {
  const updated = deleteFile(mockFiles, 'f2');
  assert.equal(updated.length, mockFiles.length - 1);
  assert(!updated.some(f => f.id === 'f2'));
});

test('getSharedUsersForPath retourne les utilisateurs partageant un chemin', async () => {
  const sharedUsers = await getSharedUsersForPath('/u1/shared/file2.txt');
  assert(sharedUsers.includes('u3'));
  assert(!sharedUsers.includes('u2'));
});
