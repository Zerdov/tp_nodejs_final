// Agit comme le MainController: écoute et redirige vers le bon controller
import http from 'http';
import { index as home } from './controllers/home';

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text' });
    res.end('Log in');
    return;
  };
  if (req.url === '/home') {
    home(req, res);
    return;
  };
  res.writeHead(404, { 'Content-Type': 'text' });
  res.end('Not found');
  return;
});

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
