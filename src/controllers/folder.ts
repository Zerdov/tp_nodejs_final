import http from 'http';
import path from 'path';
import fs from 'fs';
import { File } from '../models/files';
import
    {
        folderExists,
        createFolderObject,
        saveFolder,
        getFolderByPath,
        updateFolder,
        deleteFolder,
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

    res.writeHead( 405 );
    res.end( 'Méthode non supportée' );
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
