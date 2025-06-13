import fs from 'fs/promises';
import path from 'path';
import fsSync from 'fs'; // pour méthodes sync nécessaires (ex: existsSync)
import { spawn } from 'child_process';

export type File = {
    id: string;
    owner: string;
    path: string;
    type: 'file' | 'folder';
    sharedWith: string[];
};

const generateId = () => Math.random().toString( 36 ).substring( 2, 10 );

const FILES_JSON_PATH = path.resolve( __dirname, '../../data/files.json' );

export const readFilesJson = async (): Promise<File[]> =>
{
    try
    {
        const data = await fs.readFile( FILES_JSON_PATH, 'utf-8' );
        return JSON.parse( data ) as File[];
    } catch
    {
        return [];
    }
};

export const writeFilesJson = async ( files: File[] ): Promise<void> =>
{
    const data = JSON.stringify( files, null, 2 );
    await fs.writeFile( FILES_JSON_PATH, data, 'utf-8' );
};

export const folderExists = async ( owner: string, relPath: string ): Promise<boolean> =>
{
    const files = await readFilesJson();
    return files.some( f => f.owner === owner && f.path === relPath && f.type === 'folder' );
};

export const createFolderObject = ( owner: string, name: string ): File => ( {
    id: generateId(),
    owner,
    path: `/${ owner }/${ name }`,
    type: 'folder',
    sharedWith: [],
} );

export const saveFolder = async ( folder: File ): Promise<void> =>
{
    const files = await readFilesJson();
    await writeFilesJson( [ ...files, folder ] );
};

export const getFolderByPath = async ( folderPath: string, owner: string ): Promise<File | null> =>
{
    const files = await readFilesJson();
    const folder = files.find( f => f.owner === owner && f.path === folderPath && f.type === 'folder' );
    return folder ?? null;
};

export const updateFolder = async (
    oldPath: string,
    newName: string,
    owner: string
): Promise<File | null> =>
{
    const files = await readFilesJson();
    const folder = files.find( f => f.owner === owner && f.path === oldPath && f.type === 'folder' );
    if ( !folder ) return null;

    // Nouveau chemin
    const parts = oldPath.split( '/' );
    parts[ parts.length - 1 ] = newName;
    const newPath = parts.join( '/' );

    // Chemins physiques
    const oldDir = path.resolve( __dirname, '../../data/files', owner, folder.path.split( '/' ).pop() || '' );
    const newDir = path.resolve( __dirname, '../../data/files', owner, newName );

    // Renommer dossier physique
    try
    {
        if ( !fsSync.existsSync( oldDir ) )
        {
            // Pas de dossier physique ? On peut continuer en mettant à jour JSON
            console.warn( `Dossier physique non trouvé: ${ oldDir }` );
        } else
        {
            fsSync.renameSync( oldDir, newDir );
        }
    } catch ( err )
    {
        console.error( 'Erreur renommage dossier:', err );
        return null;
    }

    // Mettre à jour path dans JSON
    folder.path = newPath;

    const updatedFiles = files.map( f => ( f.id === folder.id ? folder : f ) );
    await writeFilesJson( updatedFiles );

    return folder;
};

export const deleteFolder = async ( folderPath: string, owner: string ): Promise<boolean> =>
{
    const files = await readFilesJson();
    const folder = files.find( f => f.owner === owner && f.path === folderPath && f.type === 'folder' );
    if ( !folder ) return false;

    // Supprimer dossier physique et contenu (récursif)
    const dir = path.resolve( __dirname, '../../data/files', owner, folderPath.split( '/' ).pop() || '' );

    try
    {
        if ( fsSync.existsSync( dir ) )
        {
            fsSync.rmSync( dir, { recursive: true, force: true } );
        }
    } catch ( err )
    {
        console.error( 'Erreur suppression dossier:', err );
        return false;
    }

    // Mettre à jour files.json en supprimant dossier + fichiers enfants (qui commencent par folderPath + '/')
    const filteredFiles = files.filter(
        f => !( f.path === folderPath || f.path.startsWith( folderPath + '/' ) )
    );

    await writeFilesJson( filteredFiles );

    return true;
};

export const zipFolder = (folderName: string): Promise<string> =>
{
    return new Promise((resolve, reject) =>
    {
        const sourceDir = path.resolve(__dirname, '../../data/files', folderName);
        const outputDir = path.resolve(__dirname, '../../data/archives');
        const outputZip = path.join(outputDir, `${folderName}.zip`);

        // Vérifie si le dossier à zipper existe
        if (!fsSync.existsSync(sourceDir))
        {
            return reject(new Error('Dossier source introuvable'));
        }

        // Crée le dossier de sortie s’il n’existe pas
        if (!fsSync.existsSync(outputDir))
        {
            fsSync.mkdirSync(outputDir, { recursive: true });
        }

        const zip = spawn('zip', ['-r', outputZip, '.'], { cwd: sourceDir });

        zip.on('close', (code) =>
        {
            if (code === 0) resolve(outputZip);
            else reject(new Error(`Le processus zip s'est terminé avec le code ${code}`));
        });

        zip.on('error', (err) =>
        {
            reject(err);
        });
    });
};
