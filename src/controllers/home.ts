import http from 'http';
import { isLoggedIn } from '../utils/auth';

export const index = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
}) => { 
  if (req.method === 'GET') {
    if (isLoggedIn(req)) {
      res.writeHead(200, { 'Content-Type': 'text' });
      res.end('Bienvenue');
    } else {
      res.writeHead(302, { Location: '/' })
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text' });
    res.end('POST METHOD');
  }
};
