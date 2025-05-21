import http from 'http';

export const parseCookies = (req: http.IncomingMessage): Record<string, string> => {
  const cookieHeader = req.headers.cookie ?? '';
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map(cookie => cookie.trim().split('='))
      .filter(([key, value]) => key && value)
  );
};
