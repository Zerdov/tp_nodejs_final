import http from 'http';
import { getUserByUsername } from '../models/users';
import { parseCookies } from '../utils/cookies';

export const checkIdentity = async (
  username: string,
  password: string
): Promise<{ success: boolean, token: string }> => {
  const user = await getUserByUsername(username);
  if (user && password === user.password) {
    const token = generateSimpleToken(username);
    return { success: true, token };
  }
  return { success: false, token: '' };
};

const generateSimpleToken = (username: string) => {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2);
  return `${username}-${timestamp}-${randomPart}`;
};

export const isLoggedIn = (req: http.IncomingMessage): boolean =>
  parseCookies(req).token !== null;

export const getUsernameYouLoggedIn = (req: http.IncomingMessage): string =>
  parseCookies(req).username;

export const login = (
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
  username: string,
  token: string
) => {
  res.writeHead(302, {
    Location: '/home',
    'Set-Cookie': [
      `token=${token}; HttpOnly; Path=/; Max-Age=3600`,
      `username=${username}; Path=/; Max-Age=3600`
    ]
  });
  res.end();
};

export const logout = (
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
) => {
  res.writeHead(302, {
    Location: '/',
    'Set-Cookie': [
      'token=; HttpOnly; Path=/; Max-Age=0',
      'username=; Path=/; Max-Age=0'
    ]
  });
  res.end();
};
