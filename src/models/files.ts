import { getFile } from '../utils/gettersFile';

export type FileEntry = {
  id: string;
  owner: string;
  path: string;
  type: 'file' | 'folder';
  sharedWith: string[];
};

export const getAccessibleFiles = async (username: string): Promise<FileEntry[]> => {
  const { success, data } = await getFile('../../data', 'files.json');
  if (!success) return [];

  const allFiles: FileEntry[] = JSON.parse(data);

  return allFiles.filter(file =>
    file.owner === username || file.sharedWith.includes(username)
  );
};

