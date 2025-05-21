import { getFile } from '../utils/gettersFile';

export const getUsers = async () => {
  const { success, data } = await getFile('../../data', 'users.json');
  if (!success) return [];

  try {
    return JSON.parse(data);
  } catch (err) {
    console.error('Erreur de parsing JSON dans getUsers:', err);
    return [];
  }
};

export const getUserByUsername = async (username: string) => {
  const users = await getUsers();
  return users.find((user: any) => user.username === username) ?? null;
};
