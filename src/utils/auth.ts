import http from 'http';
import { getUserByUsername } from '../models/users';
import { parseCookies } from '../utils/cookies';

export const checkIdentity = async (
  username: string,
  password: string
): Promise<boolean> => {
  const user = await getUserByUsername(username);
  return user && password === user.password;
};

const generateSimpleToken = () => {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2);
  return `${timestamp}-${randomPart}`;
};

export const isLoggedIn = (req: http.IncomingMessage): boolean => {
  return parseCookies(req).token !== null && parseCookies(req).token !== undefined;
}

export const login = (
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
) => {
  res.setHeader('Set-Cookie', [
    `token=${encodeURIComponent(generateSimpleToken())}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`,
    // `username=${encodeURIComponent(username)}; Path=/; Max-Age=3600; SameSite=Strict`
  ]);
};

export const logout = (
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
) => {
  res.setHeader('Set-Cookie', [
    'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
    'username=; Path=/; Max-Age=0; SameSite=Strict'
  ]);
};
