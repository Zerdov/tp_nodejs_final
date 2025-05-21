import http from 'http';
import { getView } from '../utils/gettersFile';
import { checkIdentity, login } from '../utils/auth';
import { getRequestBody } from '../utils/getRequestBody';

export const index = async (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
) => {
  if (req.method === 'GET') {
    const { success, data } = await getView('login.html');
    res.writeHead(success ? 200 : 500, { 'Content-Type': 'text/html' });
    res.end(data);
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const params = new URLSearchParams(body);
      const username = params.get('username') || '';
      const password = params.get('password') || '';

      const result = await checkIdentity(username, password);

      if (result) {
        login(res);
        res.writeHead(302, { 'Location': '/home' })
        res.end();
      } else {
        res.writeHead(401, { 'content-type': 'text/html' });
        res.end(`
          <h2>Échec de la connexion</h2>
          <p>Nom d'utilisateur ou mot de passe incorrect.</p>
          <a href="/">Réessayer</a>
        `);
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Erreur serveur lors du traitement du corps de la requête');
    }
  }
};
