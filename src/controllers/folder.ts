import http from 'http';
import path from 'path';
import fs from 'fs';
import { File, getFolderById } from '../models/files';
import
    {
        folderExists,
        createFolderObject,
        saveFolder,
        getFolderByPath,
        updateFolder,
        deleteFolder,
        zipFolder,
    } from '../models/folders';
import { getAuthenticatedUser } from '../utils/auth';
import { notifyUsersForPath } from '../ws/server';

export const index = async (
    req: http.IncomingMessage,
    res: http.ServerResponse & { req: http.IncomingMessage; }
) =>
{
    if ( req.method === 'POST' ) return create( req, res );
    if ( req.method === 'PUT' ) return update( req, res );
    if ( req.method === 'DELETE' ) return remove( req, res );
    if ( req.method === 'GET' ) return get( req, res );

    res.writeHead( 405 );
    res.end( 'Méthode non supportée' );
};

export const get = async (
    req: http.IncomingMessage,
    res: http.ServerResponse & { req: http.IncomingMessage; }
) =>
{
    const user = await getAuthenticatedUser( req );
    if ( !user )
    {
        res.writeHead( 401 );
        res.end( 'Unauthorized' );
        return;
    }

    try
    {
        const dataPath = path.resolve( __dirname, '../../data/files.json' );
        const rawData = fs.readFileSync( dataPath, 'utf-8' );
        const files: File[] = JSON.parse( rawData );

        // Filtrer uniquement les dossiers accessibles à l'utilisateur
        const folders = files.filter( file =>
            file.type === 'folder' &&
            ( file.owner === user.id || file.sharedWith.includes( user.id ) )
        );

        res.writeHead( 200, { 'Content-Type': 'application/json' } );
        res.end( JSON.stringify( folders ) );
    } catch ( err )
    {
        console.error( 'Erreur lecture files.json :', err );
        res.writeHead( 500 );
        res.end( 'Internal server error' );
    }
};

export const create = async (
    req: http.IncomingMessage,
    res: http.ServerResponse & { req: http.IncomingMessage; }
) =>
{
    const user = await getAuthenticatedUser( req );
    if ( !user )
    {
        res.writeHead( 401 );
        res.end( 'Unauthorized' );
        return;
    }

    if ( req.headers[ 'content-type' ] !== 'application/json' )
    {
        res.writeHead( 400 );
        res.end( 'Content-Type must be application/json' );
        return;
    }

    let body = '';
    req.on( 'data', chunk => ( body += chunk ) );
    req.on( 'end', async () =>
    {
        try
        {
            const { name } = JSON.parse( body );
            if ( !name || typeof name !== 'string' )
            {
                res.writeHead( 400 );
                res.end( 'Invalid or missing folder name' );
                return;
            }

            const sanitized = name.replace( /[^a-zA-Z0-9-_ ]/g, '' ).trim();
            if ( !sanitized )
            {
                res.writeHead( 400 );
                res.end( 'Nom de dossier invalide' );
                return;
            }

            const relPath = `/${ user.id }/${ sanitized }`;

            if ( await folderExists( user.id, relPath ) )
            {
                res.writeHead( 409 );
                res.end( 'Folder already exists' );
                return;
            }

            // Crée dossier physique
            const dir = path.resolve( __dirname, '../../data/files', user.id, sanitized );
            fs.mkdirSync( dir, { recursive: true } );

            const folderObj: File = createFolderObject( user.id, sanitized );
            await saveFolder( folderObj );

            await notifyUsersForPath( folderObj.path, {
                type: 'file-created',
                file: folderObj,
                by: user.id,
            } );

            res.writeHead( 201, { 'Content-Type': 'application/json' } );
            res.end( JSON.stringify( folderObj ) );
        } catch ( err )
        {
            console.error( 'Erreur création dossier:', err );
            res.writeHead( 500 );
            res.end( 'Internal server error' );
        }
    } );
};

export const update = async (
    req: http.IncomingMessage,
    res: http.ServerResponse & { req: http.IncomingMessage; }
) =>
{
    const user = await getAuthenticatedUser( req );
    if ( !user )
    {
        res.writeHead( 401 );
        res.end( 'Unauthorized' );
        return;
    }

    if ( req.headers[ 'content-type' ] !== 'application/json' )
    {
        res.writeHead( 400 );
        res.end( 'Content-Type must be application/json' );
        return;
    }

    let body = '';
    req.on( 'data', chunk => ( body += chunk ) );
    req.on( 'end', async () =>
    {
        try
        {
            const { oldPath, newName } = JSON.parse( body );
            if ( !oldPath || !newName )
            {
                res.writeHead( 400 );
                res.end( 'Missing oldPath or newName' );
                return;
            }

            const sanitized = newName.replace( /[^a-zA-Z0-9-_ ]/g, '' ).trim();
            if ( !sanitized )
            {
                res.writeHead( 400 );
                res.end( 'Nom de dossier invalide' );
                return;
            }

            const updatedFolder = await updateFolder( oldPath, sanitized, user.id );
            if ( !updatedFolder )
            {
                res.writeHead( 404 );
                res.end( 'Folder not found' );
                return;
            }

            await notifyUsersForPath( updatedFolder.path, {
                type: 'file-updated',
                file: updatedFolder,
                by: user.id,
            } );

            res.writeHead( 200, { 'Content-Type': 'application/json' } );
            res.end( JSON.stringify( updatedFolder ) );
        } catch ( err )
        {
            console.error( 'Erreur mise à jour dossier:', err );
            res.writeHead( 500 );
            res.end( 'Internal server error' );
        }
    } );
};

export const remove = async (
    req: http.IncomingMessage,
    res: http.ServerResponse & { req: http.IncomingMessage; }
) =>
{
    const user = await getAuthenticatedUser( req );
    if ( !user )
    {
        res.writeHead( 401 );
        res.end( 'Unauthorized' );
        return;
    }

    if ( req.headers[ 'content-type' ] !== 'application/json' )
    {
        res.writeHead( 400 );
        res.end( 'Content-Type must be application/json' );
        return;
    }

    let body = '';
    req.on( 'data', chunk => ( body += chunk ) );
    req.on( 'end', async () =>
    {
        try
        {
            const { folderPath } = JSON.parse( body );
            if ( !folderPath )
            {
                res.writeHead( 400 );
                res.end( 'Missing folderPath' );
                return;
            }

            const success = await deleteFolder( folderPath, user.id );
            if ( !success )
            {
                res.writeHead( 404 );
                res.end( 'Folder not found or error deleting' );
                return;
            }

            await notifyUsersForPath( folderPath, {
                type: 'file-deleted',
                filePath: folderPath,
                by: user.id,
            } );

            res.writeHead( 204 );
            res.end();
        } catch ( err )
        {
            console.error( 'Erreur suppression dossier:', err );
            res.writeHead( 500 );
            res.end( 'Internal server error' );
        }
    } );
};

export const downloadZip = async (
    req: http.IncomingMessage,
    res: http.ServerResponse & { req: http.IncomingMessage; }
) =>
{
    const user = await getAuthenticatedUser( req );
    if ( !user )
    {
        res.writeHead( 401 );
        res.end( 'Unauthorized' );
        return;
    }

    if ( req.method !== 'POST' || req.headers[ 'content-type' ] !== 'application/json' )
    {
        res.writeHead( 400 );
        res.end( 'Requête invalide' );
        return;
    }

    let body = '';
    req.on( 'data', chunk => ( body += chunk ) );
    req.on( 'end', async () =>
    {
        try
        {
            const { folderId } = JSON.parse( body );
            if ( !folderId )
            {
                res.writeHead( 400 );
                res.end( 'Missing folderId' );
                return;
            }

            const folder = await getFolderById( folderId );
            if ( !folder || !folder.sharedWith.includes( user.id ) )
            {
                res.writeHead( 403 );
                res.end( 'Accès interdit' );
                return;
            }

            const folderPath = folder.path.startsWith( '/' )
                ? folder.path.slice( 1 )
                : folder.path;

            const zipPath = await zipFolder( folderPath );

            const stat = fs.statSync( zipPath );
            res.writeHead( 200, {
                'Content-Type': 'application/zip',
                'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename="${ path.basename( folderPath ) }.zip"`
            } );

            const readStream = fs.createReadStream( zipPath );
            readStream.pipe( res );
        } catch ( err )
        {
            console.error( 'Erreur zip:', err );
            res.writeHead( 500 );
            res.end( 'Erreur lors de la compression' );
        }
    } );
};
  
