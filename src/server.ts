import http from 'http';
import { index as homeController, getUsersEP as getUsers } from './controllers/home';
import { index as loginController } from './controllers/login';
import { index as fileController, share as shareFile } from './controllers/file';
import { downloadZip, index as folderController } from './controllers/folder';
import { isLoggedIn, logout } from './utils/auth';
import { getView } from './utils/getFile';
import { setupWebSocketServer } from './ws/server'; // importe ton setup WS

const server = http.createServer( ( req, res ) =>
{
  ( async () =>
  {
    if ( req.url === '/' )
    {
      logout( res );
      await loginController( req, res );
      return;
    }

    if ( isLoggedIn( req ) )
    {
      if ( req.url === '/home' )
      {
        await homeController( req, res );
        return;
      }
      if (req.url === '/home/users') {
        await getUsers(req, res);
        return;
      }
      if (req.url?.startsWith('/file')) {
        if (req.url === '/file/share') {
          await shareFile(req, res);
          return;
        }
        await fileController(req, res);
        return;
      }
      if ( req.url?.startsWith( '/folder' ) )
      {
        if (req.url === '/folder/download') {
          await downloadZip(req, res);
          return;
        }
        await folderController( req, res );
        return;
      }
      const { success, data } = await getView( '404.html' );
      res.writeHead( success ? 404 : 500, { 'Content-Type': 'text/html' } );
      res.end( data );
      return;
    }

    const { success, data } = await getView( '401.html' );
    res.writeHead( success ? 401 : 500, { 'Content-Type': 'text/html' } );
    res.end( data );
    return;
  } )();
}
);

// Crée ton serveur WebSocket en lui passant le serveur HTTP
setupWebSocketServer( server );

server.listen( 3000, () =>
{
  console.log( 'Server started: http://localhost:3000' );
} );
