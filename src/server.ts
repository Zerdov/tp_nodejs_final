// Agit comme le MainController: écoute et redirige vers le bon controller
import http from 'http';
import fs from 'fs';
import path from 'path';
import { index as home } from './controllers/home';
import { startWebSocketServer } from './websocket';

const server = http.createServer( ( req, res ) =>
{

    if ( req.url === '/' )
    {
        res.writeHead( 200, { 'Content-Type': 'text' } );
        res.end( 'Log in' );
        return;
    };
    if ( req.url === '/upload' )
    {
        const filePath = path.resolve( __dirname, '../views/upload.html' );

        fs.readFile( filePath, ( err, data ) =>
        {
            if ( err )
            {
                res.writeHead( 500 );
                res.end( 'Erreur serveur' );
                return;
            }

            res.writeHead( 200, { 'Content-Type': 'text/html' } );
            res.end( data );
        } );

        return;
    }
    if ( req.url === '/home' )
    {
        home( req, res );
        return;
    };
    res.writeHead( 404, { 'Content-Type': 'text' } );
    res.end( 'Not found' );
    return;
} );

startWebSocketServer( server );

server.listen( 3000, () =>
{
    console.log( 'Serveur démarré sur http://localhost:3000' );
} );
