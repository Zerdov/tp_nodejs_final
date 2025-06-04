import http from 'http';
import { getUserByUsername, User } from '../models/users';
import { parseCookies } from './cookies';

export const checkIdentity = async (
  username: string,
  password: string
): Promise<boolean> => {
  const user = await getUserByUsername(username);
  return !!user && user.password === password;
};

const generateSimpleToken = (): string => {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2);
  return `${timestamp}-${randomPart}`;
};

export const isLoggedIn = (req: http.IncomingMessage): boolean => {
  const cookies = parseCookies(req);
  return Boolean(cookies.token && cookies.username);
};

export const getAuthenticatedUser = async (
  req: http.IncomingMessage
): Promise<User | null> => {
  try {
    const cookies = parseCookies(req);
    if (!cookies.username) return null;
    const user = await getUserByUsername(cookies.username);
    return user;
  } catch (error) {
    console.error('Erreur dans getAuthenticatedUser:', error);
    return null;
  }
};

export const login = (
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
  username: string
): void => {
  const token = generateSimpleToken();

  res.setHeader('Set-Cookie', [
    `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`,
    `username=${encodeURIComponent(username)}; Path=/; Max-Age=3600; SameSite=Strict`
  ]);
};

export const logout = (
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
): void => {
  res.setHeader('Set-Cookie', [
    'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
    'username=; Path=/; Max-Age=0; SameSite=Strict'
  ]);
};
