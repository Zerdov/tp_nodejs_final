import { test } from 'node:test';
import assert from 'node:assert/strict';

type User = {
  id: string,
  username: string,
  password: string
};

const mockUsers: User[] = [
  { id: 'u1', username: 'alice', password: 'pw1' },
  { id: 'u2', username: 'bob', password: 'pw2' }
];

const getUsers = async (): Promise<User[]> => {
  return mockUsers;
};

const getUserByUsername = async (username: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(user => user.username === username) ?? null;
};

const getUserById = async (id: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(user => user.id === id) ?? null;
};


test('getUsers retourne tous les utilisateurs', async () => {
  const users = await getUsers();
  assert.equal(users.length, 2);
  assert.equal(users[0].username, 'alice');
});

test('getUserByUsername retourne bob', async () => {
  const user = await getUserByUsername('bob');
  assert.ok(user);
  assert.equal(user?.id, 'u2');
});

test('getUserByUsername retourne null si utilisateur inconnu', async () => {
  const user = await getUserByUsername('charlie');
  assert.equal(user, null);
});

test('getUserById retourne alice', async () => {
  const user = await getUserById('u1');
  assert.ok(user);
  assert.equal(user?.username, 'alice');
});

test('getUserById retourne null si id inconnu', async () => {
  const user = await getUserById('u999');
  assert.equal(user, null);
});
