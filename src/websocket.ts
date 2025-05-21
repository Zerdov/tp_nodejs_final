import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { saveFile } from './controllers/fileController';
import fs from 'fs';
import path from 'path';

const filesDir = path.resolve( __dirname, '../data/files' );

export const startWebSocketServer = ( server: Server ) =>
{
    const wss = new WebSocketServer( { server } );

    wss.on( 'connection', ( ws: WebSocket, req: IncomingMessage ) =>
    {
        console.log( 'Client WebSocket connecté' );

        ws.on( 'message', async ( message ) =>
        {
            try
            {
                const data = JSON.parse( message.toString() );
                console.log( '[WebSocket] Données reçues :', data );

                if ( data.type === 'upload' && data.filename && data.fileData )
                {
                    await saveFile( data.filename, data.fileData );
                    ws.send( JSON.stringify( {
                        status: 'success',
                        message: 'Fichier reçu et sauvegardé.'
                    } ) );
                    wss.clients.forEach( client =>
                    {
                        if ( client.readyState === WebSocket.OPEN )
                        {
                            sendFileList( client );
                        }
                    } );
                }

                else if ( data.type === 'list' )
                {
                    sendFileList( ws );
                }
                else if ( data.type === 'delete' && data.filename )
                {
                    const filePath = path.join( filesDir, data.filename );
                    fs.unlink( filePath, ( err ) =>
                    {
                        if ( err )
                        {
                            ws.send( JSON.stringify( { type: 'status', success: false, message: "Erreur suppression." } ) );
                        } else
                        {
                            ws.send( JSON.stringify( { type: 'status', success: true, message: "Fichier supprimé." } ) );
                        }
                    } );
                }

                else
                {
                    ws.send( JSON.stringify( { status: 'error', message: 'Requête mal formée.' } ) );
                }

            } catch ( err )
            {
                console.error( 'Erreur dans WebSocket:', err );
                ws.send( JSON.stringify( { status: 'error', message: 'Erreur interne.' } ) );
            }
        } );
    } );

    console.log( 'Serveur WebSocket prêt (intégré au serveur HTTP)' );
};

// 🔁 Fonction pour renvoyer la liste des fichiers
function sendFileList ( ws: WebSocket )
{
    fs.readdir( filesDir, ( err, files ) =>
    {
        if ( err )
        {
            console.error( "Erreur lecture dossier:", err );
            ws.send( JSON.stringify( { type: "status", success: false, message: "Erreur lecture fichiers" } ) );
        } else
        {
            console.log( "[WS] Envoi liste fichiers:", files );
            ws.send( JSON.stringify( { type: "list", files } ) );
        }
    } );
}
