import http from 'http';
import { getView } from '../utils/getFile';
import { getUserById, getUsers } from '../models/users';
import { getAuthenticatedUser } from '../utils/auth';

export const index = async (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
}) => { 
  if (req.method === 'GET') {
    const { success, data } = await getView('home.html');
    res.writeHead(success ? 200 : 500, { 'Content-Type': 'text/html' });
    res.end(data);
    return;
  } else {
    res.writeHead(200, { 'Content-Type': 'text' });
    res.end('POST METHOD');
  }
};

export const getUsersEP = async (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
) => {
  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end('Méthode non autorisée');
    return;
  }

  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    res.writeHead(401);
    res.end('Non authentifié');
    return;
  }

  const users = await getUsers();
  const otherUsers = users.filter(user => user.id !== currentUser.id);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(otherUsers));
};
