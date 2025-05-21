import path from 'path';
import fs from 'fs/promises';

export const getFile = async (
  folder: string,
  file: string
): Promise<{ success: boolean, data: string }> => {
  const filePath = path.join(__dirname, folder, file);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: data };
  } catch {
    return { success: false, data: "<p>Server is down</p>" };
  }
};

export const getView = (file: string) => getFile('../../views', file);
