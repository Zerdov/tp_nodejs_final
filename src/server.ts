// Agit comme le MainController: écoute et redirige vers le bon controller
import http from 'http';
import { index as homeController } from './controllers/home';
import { index as loginController } from './controllers/login';
import { isLoggedIn, logout } from './utils/auth';
import { getView } from './utils/gettersFile';

const server = http.createServer((req, res) => {
  // Fonction IIFE async pour pouvoir await
  (async () => {
    if (req.url === '/') {
      logout(res);
      await loginController(req, res);
      return;
    }

    if (isLoggedIn(req)) {
      if (req.url === '/home') {
        await homeController(req, res);
        return;
      };
      const { success, data } = await getView('404.html');
      res.writeHead(success ? 404 : 500, { 'Content-Type': 'text/html' });
      res.end(data);
      return;
    }

    const { success, data } = await getView('401.html');
    res.writeHead(success ? 401 : 500, { 'Content-Type': 'text/html' });
    res.end(data);
    return;
  })();
});

server.listen(3000, () => {
  console.log('Server started: http://localhost:3000');
});
