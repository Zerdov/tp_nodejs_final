// Agit comme le MainController: écoute et redirige vers le bon controller
import http from 'http';
import { index as home } from './controllers/home';
import { index as login } from './controllers/login';

const server = http.createServer((req, res) => {
  // Fonction IIFE async pour pouvoir await
  (async () => {
    if (req.url === '/') {
      await login(req, res);
      return;
    }

    if (req.url === '/home') {
      await home(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(__dirname);
  })();
});

server.listen(3000, () => {
  console.log('Server started: http://localhost:3000');
});
