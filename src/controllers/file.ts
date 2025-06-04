import http from 'http';
import { File, readFilesJson, writeFilesJson, createFile, updateFile, deleteFile } from '../models/files';
import { getAuthenticatedUser } from '../utils/auth';
import path from 'path';
import fs from 'fs';
import { notifyUsersForPath } from '../ws/server';

export const index = async (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
) => {
  if (req.method === 'GET') return read(req, res);
  if (req.method === 'POST') return create(req, res);
  if (req.method === 'PUT') return update(req, res);
  if (req.method === 'DELETE') return deleteFileHandler(req, res); // "delete" est un mot réservé
  res.writeHead(405);
  res.end('Méthode non supportée');
};

export const create = async (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.writeHead(401);
    res.end('Unauthorized');
    return;
  }

  const contentType = req.headers['content-type'] || '';
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    res.writeHead(400);
    res.end('Invalid multipart form data');
    return;
  }

  const chunks: Buffer[] = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const body = Buffer.concat(chunks);
    const parts = body.toString().split(`--${boundary}`);
    const filePart = parts.find(p => p.includes('filename='));

    if (!filePart) {
      res.writeHead(400);
      res.end('No file found');
      return;
    }

    const match = filePart.match(/filename="(.+?)"/);
    if (!match) {
      res.writeHead(400);
      res.end('Invalid filename');
      return;
    }

    const filename = match[1];
    const binary = filePart.split('\r\n\r\n')[1].trimEnd();
    const buffer = Buffer.from(binary, 'binary');

    const dir = path.join(__dirname, '..', '..', 'data', 'files', user.id);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);

    const files = await readFilesJson();
    const fileObj: File = {
      id: Math.random().toString(36).slice(2),
      owner: user.id,
      path: `/${user.id}/${filename}`,
      type: 'file',
      sharedWith: [],
    };
    await writeFilesJson(createFile(files, fileObj));
    await notifyUsersForPath(fileObj.path, {
      type: 'file-created',
      file: fileObj,
      by: user.id
    });

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fileObj));
  });
};

export const read = async (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }
) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.writeHead(401);
    res.end('Unauthorized');
    return;
  }

  const files = await readFilesJson();
  const accessibleFiles = files.filter(f =>
    f.owner === user.id || f.sharedWith.includes(user.id)
  );

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(accessibleFiles));
};

export const update = async (
  req: http.IncomingMessage,
  res: http.ServerResponse & { req: http.IncomingMessage }
) => {
  if (req.headers['content-type'] !== 'application/json') {
    res.writeHead(400);
    res.end('Content-Type must be application/json');
    return;
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.writeHead(401);
    res.end('Unauthorized');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const { fileId, newName } = JSON.parse(body);
      if (!fileId || !newName) {
        res.writeHead(400);
        res.end('Missing fileId or newName');
        return;
      }

      const files = await readFilesJson();
      const file = files.find(f => f.id === fileId);
      if (!file) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      if (file.owner !== user.id) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      // Construire les chemins physiques
      const oldPath = path.join(__dirname, '..', '..', 'data', 'files', file.path);
      const dir = path.dirname(oldPath);
      const newPath = path.join(dir, newName);

      // Renommer fichier sur disque
      fs.renameSync(oldPath, newPath);

      // Mettre à jour path dans files.json
      file.path = `/${user.id}/${newName}`;
      await writeFilesJson(updateFile(files, file.id, file));
      await notifyUsersForPath(file.path, {
        type: 'file-renamed',
        fileId: file.id,
        newPath: file.path,
        by: user.id
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(file));
    } catch (err) {
      res.writeHead(500);
      res.end('Internal server error');
    }
  });
};

export const deleteFileHandler = async (
  req: http.IncomingMessage,
  res: http.ServerResponse & { req: http.IncomingMessage }
) => {
  if (req.headers['content-type'] !== 'application/json') {
    res.writeHead(400);
    res.end('Content-Type must be application/json');
    return;
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.writeHead(401);
    res.end('Unauthorized');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const { fileId } = JSON.parse(body);
      if (!fileId) {
        res.writeHead(400);
        res.end('Missing fileId');
        return;
      }

      const files = await readFilesJson();
      const file = files.find(f => f.id === fileId);
      if (!file) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      if (file.owner !== user.id) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      // Supprimer fichier physique
      const filePath = path.join(__dirname, '..', '..', 'data', 'files', file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Mettre à jour files.json
      await writeFilesJson(deleteFile(files, fileId));
      await notifyUsersForPath(file.path, {
        type: 'file-deleted',
        fileId: file.id,
        filePath: file.path,
        by: user.id
      });

      res.writeHead(204);
      res.end();
    } catch {
      res.writeHead(500);
      res.end('Internal server error');
    }
  });
};
