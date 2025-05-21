import http from 'http';

export const index = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
}) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text' });
    res.end('GET METHOD');
  } else {
    res.writeHead(200, { 'Content-Type': 'text' });
    res.end('POST METHOD');
  }
}