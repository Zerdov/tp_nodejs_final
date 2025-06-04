import { getFile } from '../utils/gettersFile';

export type User = {
  id: string,
  username: string,
  password: string
}

export const getUsers = async (): Promise<User[]> => {
  const { success, data } = await getFile('../../data', 'users.json');
  if (!success) return [];

  try {
    return JSON.parse(data) as User[];
  } catch (err) {
    console.error('Erreur de parsing JSON dans getUsers:', err);
    return [];
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find((user) => user.username === username) ?? null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(user => user.id === id) ?? null;
};
