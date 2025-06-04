import http from 'http';
import { getView } from '../utils/getFile';

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
