import fs from 'fs';
import path from 'path';

const filesDir = path.resolve( __dirname, '../../data/files' );

export const saveFile = ( filename: string, base64Data: string ): Promise<void> =>
{
    return new Promise( ( resolve, reject ) =>
    {
        // Assurer que le dossier existe
        if ( !fs.existsSync( filesDir ) )
        {
            fs.mkdirSync( filesDir, { recursive: true } );
        }

        // Extraction de la partie utile du base64 (sans le préfixe "data:")
        const base64 = base64Data.split( ',' )[ 1 ];
        const buffer = Buffer.from( base64, 'base64' );

        const filePath = path.join( filesDir, filename );

        // Écriture du fichier
        fs.writeFile( filePath, buffer, ( err ) =>
        {
            if ( err )
            {
                console.error( `Erreur lors de l'écriture du fichier: ${ err }` );
                reject( err );
            } else
            {
                console.log( `Fichier enregistré : ${ filePath }` );
                resolve();
            }
        } );
    } );
};
